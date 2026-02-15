// NOTE: For security and CORS reasons, Amadeus requires the client credentials
// exchange to happen on a trusted server. The browser cannot reliably call the
// token endpoint directly. This file now calls a local proxy at /api/amadeus/*
// which performs the token exchange and forwards requests to Amadeus.

const AMADEUS_PROXY_BASE = "/api/amadeus";

// Helper: forward client requests to the proxy server which handles auth
async function proxyGet(path, queryParams = {}) {
  const qs = new URLSearchParams(queryParams).toString();
  const url = `${AMADEUS_PROXY_BASE}${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Proxy request failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Search for flights using Amadeus API
 */
async function searchFlights(from, to, departDate, returnDate, travelers) {
  try {
    // Use proxy to perform authenticated call
    const fromCode = extractIataCode(from);
    const toCode = extractIataCode(to);
    const params = {
      originLocationCode: fromCode,
      destinationLocationCode: toCode,
      departureDate: departDate,
      adults: travelers,
      max: "12"
    };
    if (returnDate) params.returnDate = returnDate;

    return await proxyGet('/flight-offers', params);
  } catch (error) {
    console.error("Flight search error:", error);
    throw error;
  }
}

/**
 * Search for hotels using Amadeus API
 */
async function searchHotels(city, checkInDate, checkOutDate, travelers) {
  try {
    const cityCode = extractIataCode(city);
    const params = {
      cityCode: cityCode,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      adults: travelers,
      max: "12"
    };
    return await proxyGet('/hotels-by-city', params);
  } catch (error) {
    console.error("Hotel search error:", error);
    throw error;
  }
}

/**
 * Search for car rentals using Amadeus API
 */
async function searchCars(location, startDate, endDate, pickupTime, dropoffTime) {
  try {
    const params = {
      pickupLocationCode: extractIataCode(location),
      dropoffLocationCode: extractIataCode(location),
      pickupDate: startDate,
      dropoffDate: endDate,
      pickupTime: pickupTime || "10:00",
      dropoffTime: dropoffTime || "10:00",
      max: "12"
    };
    return await proxyGet('/car-rental-offers', params);
  } catch (error) {
    console.error("Car search error:", error);
    throw error;
  }
}

/**
 * Extract IATA code from location string (e.g., "New York (JFK)" -> "JFK")
 */
function extractIataCode(location) {
  const match = location.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : location.substring(0, 3).toUpperCase();
}

/**
 * Format Amadeus flight results for display
 */
function formatFlightResults(data) {
  if (!data.data || !Array.isArray(data.data)) {
    return [];
  }

  return data.data.slice(0, 12).map((flight) => {
    const itinerary = flight.itineraries[0];
    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];
    
    const departTime = new Date(firstSegment.departure.at);
    const arriveTime = new Date(lastSegment.arrival.at);
    const duration = calculateDuration(departTime, arriveTime);

    return {
      title: `${firstSegment.departure.iataCode} → ${lastSegment.arrival.iataCode}`,
      subtitle: flight.validatingAirlineCodes?.[0] || "Multi-carrier",
      price: Math.round(Number(flight.price.total)),
      currency: flight.price.currency,
      duration: duration,
      tags: [
        itinerary.segments.length === 1 ? "Direct" : `${itinerary.segments.length - 1} stop${itinerary.segments.length > 2 ? 's' : ''}`,
        flight.instantTicketingRequired ? "Instant confirmation" : "Standard"
      ]
    };
  });
}

/**
 * Format Amadeus hotel results for display
 */
function formatHotelResults(data) {
  if (!data.data || !Array.isArray(data.data)) {
    return [];
  }

  return data.data.slice(0, 12).map((hotel) => ({
    title: hotel.name || "Hotel",
    subtitle: `${hotel.address?.city || 'City'}, ${hotel.address?.countryCode || ''}`,
    price: Math.round(Math.random() * 300 + 80), // Mock pricing
    currency: "USD",
    duration: "1 night",
    tags: [
      hotel.hotelSource ? "Verified" : "Partner",
      "Free cancellation"
    ]
  }));
}

/**
 * Calculate duration between two dates
 */
function calculateDuration(start, end) {
  const ms = end - start;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}
