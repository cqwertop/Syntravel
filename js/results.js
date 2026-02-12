window.TRAVEL_API_CONFIG = {
  baseUrl: "",
  endpoint: "/search",
  apiKey: ""
};

const statusText = document.getElementById("statusText");
const results = document.getElementById("results");
const loginBtn = document.getElementById("loginBtn");
const signInBtn = document.getElementById("signInBtn");

const params = new URLSearchParams(window.location.search);
const payload = {
  type: params.get("type") || "packages",
  from: params.get("from") || "New York (JFK)",
  to: params.get("to") || "London (LHR)",
  departDate: params.get("departDate") || "",
  returnDate: params.get("returnDate") || "",
  travelers: Number(params.get("travelers") || 2),
  directOnly: params.get("directOnly") === "true",
  refundable: params.get("refundable") === "true"
};

loadResults();
loginBtn.addEventListener("click", goToLogin);
signInBtn.addEventListener("click", goToLogin);

async function loadResults() {
  statusText.textContent = "Loading live options...";
  results.innerHTML = "";

  try {
    const data = await searchTrips(payload);
    const normalized = normalizeResults(data, payload);

    if (!normalized.length) {
      statusText.textContent = "No results found. Try updating your search.";
      return;
    }

    statusText.textContent = `Showing ${normalized.length} ${payload.type} option(s) for ${payload.to}.`;
    renderCards(normalized);
  } catch (error) {
    statusText.textContent = `${error.message} Showing demo results.`;
    renderCards(mockResults(payload));
  }
}

function getApiConfig() {
  const fromWindow = window.TRAVEL_API_CONFIG || {};
  const fromStorage = {
    baseUrl: localStorage.getItem("travelApiBase") || "",
    apiKey: localStorage.getItem("travelApiKey") || "",
    endpoint: localStorage.getItem("travelApiEndpoint") || "/search"
  };

  return {
    baseUrl: fromWindow.baseUrl || fromStorage.baseUrl,
    apiKey: fromWindow.apiKey || fromStorage.apiKey,
    endpoint: fromWindow.endpoint || fromStorage.endpoint
  };
}

async function searchTrips(input) {
  const config = getApiConfig();

  if (!config.baseUrl) {
    throw new Error("No API configured.");
  }

  const query = new URLSearchParams({
    type: input.type,
    from: input.from,
    to: input.to,
    departDate: input.departDate,
    returnDate: input.returnDate,
    travelers: String(input.travelers),
    directOnly: String(input.directOnly),
    refundable: String(input.refundable)
  });

  const url = `${config.baseUrl}${config.endpoint}?${query.toString()}`;
  const headers = {
    "Content-Type": "application/json"
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
    headers["x-api-key"] = config.apiKey;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error("Live API request failed.");
  }

  return response.json();
}

function normalizeResults(data, input) {
  const raw = Array.isArray(data)
    ? data
    : data.results || data.trips || data.offers || [];

  return raw.slice(0, 12).map((item, index) => ({
    title: item.title || item.name || `${input.from} to ${input.to}`,
    subtitle: item.subtitle || item.airline || item.hotel || input.type,
    price: Number(item.price || item.total || item.amount || (220 + index * 55)),
    currency: item.currency || "USD",
    duration: item.duration || item.nights || "6h 20m",
    tags: item.tags || [input.directOnly ? "Direct" : "1 stop", input.refundable ? "Refundable" : "Standard"]
  }));
}

function renderCards(items) {
  results.innerHTML = items
    .map((item) => `
      <article class="result-card">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <div>${escapeHtml(item.subtitle)}</div>
          <div class="result-meta">
            <span>${escapeHtml(String(item.duration))}</span>
            ${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
        <div class="result-price">
          <strong>${escapeHtml(item.currency)} ${escapeHtml(String(item.price))}</strong>
          <span>Total per traveler</span>
        </div>
      </article>
    `)
    .join("");
}

function mockResults(input) {
  return [
    {
      title: `${input.from} to ${input.to}`,
      subtitle: "Preferred fare",
      price: 462,
      currency: "USD",
      duration: "7h 15m",
      tags: ["1 stop", "Carry-on"]
    },
    {
      title: `${input.to} Hotel + Flight Bundle`,
      subtitle: "4-star city center stay",
      price: 899,
      currency: "USD",
      duration: "5 nights",
      tags: ["Bundle", "Best value"]
    },
    {
      title: `${input.to} flexible option`,
      subtitle: "Free cancellation",
      price: 1045,
      currency: "USD",
      duration: "6 nights",
      tags: ["Refundable", "Pay later"]
    }
  ];
}

function goToLogin() {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `login.html?redirect=${redirect}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
