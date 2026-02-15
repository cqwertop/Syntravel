// Simple Amadeus proxy server
// Usage:
// 1. Install deps: npm install express node-fetch@2 cors
// 2. Run: AMADEUS_CLIENT_ID=O0Rgkj5tLoq1FGjHg10UYHP8xdCqLyBz AMADEUS_CLIENT_SECRET=AqKT83IrA1AkRnAF node server.js

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.AMADEUS_CLIENT_ID || 'O0Rgkj5tLoq1FGjHg10UYHP8xdCqLyBz';
const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || 'AqKT83IrA1AkRnAF';
// Use test (sandbox) endpoints for development
const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const BASE_URL = 'https://test.api.amadeus.com/v2';

let token = null;
let tokenExpiry = 0;

async function ensureToken() {
  if (token && Date.now() < tokenExpiry) return token;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  const res = await fetch(AUTH_URL, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Auth failed: ${res.status} ${t}`);
  }

  const data = await res.json();
  token = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 5000; // buffer
  return token;
}

async function forwardToAmadeus(path, reqQuery, res) {
  try {
    const t = await ensureToken();
    const qs = new URLSearchParams(reqQuery).toString();
    const url = `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } });
    const body = await r.text();
    res.status(r.status).send(body);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Flight offers proxy
app.get('/api/amadeus/flight-offers', async (req, res) => {
  await forwardToAmadeus('/shopping/flight-offers', req.query, res);
});

// Hotels by city proxy (reference-data)
app.get('/api/amadeus/hotels-by-city', async (req, res) => {
  await forwardToAmadeus('/reference-data/locations/hotels/by-city', req.query, res);
});

// Car rental offers proxy
app.get('/api/amadeus/car-rental-offers', async (req, res) => {
  await forwardToAmadeus('/shopping/car-rental-offers', req.query, res);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Amadeus proxy running on http://localhost:${PORT}`));
