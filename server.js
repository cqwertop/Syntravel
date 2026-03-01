// Simple SerpApi proxy server
// Usage:
// 1. Install deps: npm install express node-fetch@2 cors
// 2. Run: SERPAPI_API_KEY=your_key node server.js

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY || "";

function parseTravelerCount(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function toSerpApiQuery(query = {}) {
  return {
    engine: "google_flights",
    hl: "en",
    gl: "us",
    currency: query.currency || "USD",
    departure_id: query.departure_id || query.originLocationCode,
    arrival_id: query.arrival_id || query.destinationLocationCode,
    outbound_date: query.outbound_date || query.departureDate,
    return_date: query.return_date || query.returnDate
  };
}

async function fetchFlights(query) {
  if (!SERPAPI_API_KEY) {
    throw new Error("Missing SERPAPI_API_KEY");
  }

  const params = {
    ...toSerpApiQuery(query),
    api_key: SERPAPI_API_KEY
  };

  if (!params.departure_id || !params.arrival_id || !params.outbound_date) {
    throw new Error("Missing required params: departure_id, arrival_id, outbound_date");
  }

  // Optional traveler hint carried through for future server-side filtering.
  params.travelers = String(parseTravelerCount(query.travelers || query.adults || 1));

  const url = `https://serpapi.com/search.json?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SerpApi request failed: ${res.status} ${text}`);
  }
  return text;
}

app.get("/api/serpapi/flights", async (req, res) => {
  try {
    const body = await fetchFlights(req.query);
    res.status(200).type("application/json").send(body);
  } catch (err) {
    console.error("SerpApi flights proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Keep hotel/cars routes to avoid breaking existing callers; currently placeholders.
app.get("/api/serpapi/hotels", async (_req, res) => {
  res.status(200).json({ data: [] });
});

app.get("/api/serpapi/cars", async (_req, res) => {
  res.status(200).json({ data: [] });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`SerpApi proxy running on http://localhost:${PORT}`);
});
