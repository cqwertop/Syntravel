window.TRAVEL_API_CONFIG = {
  baseUrl: "",
  endpoint: "/search",
  apiKey: ""
};
const state = {
  type: "packages"
};

const form = document.getElementById("searchForm");
const results = document.getElementById("results");
const statusText = document.getElementById("statusText");
const aiButton = document.getElementById("aiButton");
const tabs = document.querySelectorAll(".tab");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((el) => {
      el.classList.remove("active");
      el.setAttribute("aria-selected", "false");
    });

    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    state.type = tab.dataset.type;
  });
});

aiButton.addEventListener("click", () => {
  const destinations = ["Barcelona", "Lisbon", "Tokyo", "Dubai", "Vancouver"];
  const pick = destinations[Math.floor(Math.random() * destinations.length)];
  form.elements.to.value = pick;
  statusText.textContent = `AI suggestion picked ${pick}. Click Search deals to fetch live options.`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    type: state.type,
    from: form.elements.from.value.trim(),
    to: form.elements.to.value.trim(),
    departDate: form.elements.departDate.value,
    returnDate: form.elements.returnDate.value,
    travelers: Number(form.elements.travelers.value || 1),
    directOnly: form.elements.directOnly.checked,
    refundable: form.elements.refundable.checked
  };

  statusText.textContent = "Loading live options...";
  renderCards([]);

  try {
    const data = await searchTrips(payload);
    const normalized = normalizeResults(data, payload);

    if (!normalized.length) {
      statusText.textContent = "No results found. Try changing dates or route.";
      return;
    }

    statusText.textContent = `Showing ${normalized.length} option(s) for ${payload.to}.`;
    renderCards(normalized);
  } catch (error) {
    statusText.textContent = error.message;
    renderCards(mockResults(payload));
  }
});

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

async function searchTrips(payload) {
  const config = getApiConfig();

  if (!config.baseUrl) {
    throw new Error("No API configured yet. Showing demo results. Add TRAVEL_API_CONFIG in js/home.js.");
  }

  const query = new URLSearchParams({
    type: payload.type,
    from: payload.from,
    to: payload.to,
    departDate: payload.departDate,
    returnDate: payload.returnDate,
    travelers: String(payload.travelers),
    directOnly: String(payload.directOnly),
    refundable: String(payload.refundable)
  });

  const url = `${config.baseUrl}${config.endpoint}?${query.toString()}`;
  const headers = {
    "Content-Type": "application/json"
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
    headers["x-api-key"] = config.apiKey;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error("Live API request failed. Showing demo results.");
  }

  return response.json();
}

function normalizeResults(data, payload) {
  const raw = Array.isArray(data)
    ? data
    : data.results || data.trips || data.offers || [];

  return raw.slice(0, 8).map((item, index) => ({
    title: item.title || item.name || `${payload.from} to ${payload.to}`,
    subtitle: item.subtitle || item.airline || item.hotel || state.type,
    price: Number(item.price || item.total || item.amount || (220 + index * 55)),
    currency: item.currency || "USD",
    duration: item.duration || item.nights || "6h 20m",
    tags: item.tags || [payload.directOnly ? "Direct" : "1 stop", payload.refundable ? "Refundable" : "Standard"]
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

function mockResults(payload) {
  return [
    {
      title: `${payload.from} to ${payload.to}`,
      subtitle: "Preferred fare",
      price: 462,
      currency: "USD",
      duration: "7h 15m",
      tags: ["1 stop", "Carry-on"]
    },
    {
      title: `${payload.to} Hotel + Flight Bundle`,
      subtitle: "4-star city center stay",
      price: 899,
      currency: "USD",
      duration: "5 nights",
      tags: ["Bundle", "Best value"]
    },
    {
      title: `${payload.to} flexible option`,
      subtitle: "Free cancellation",
      price: 1045,
      currency: "USD",
      duration: "6 nights",
      tags: ["Refundable", "Pay later"]
    }
  ];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

