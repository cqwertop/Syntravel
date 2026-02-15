// Amadeus API Configuration
const AMADEUS_CONFIG = {
  clientId: "O0Rgkj5tLoq1FGjHg10UYHP8xdCqLyBz",
  baseUrl: "https://api.amadeus.com/v2",
  authUrl: "https://api.amadeus.com/v1/security/oauth2/token"
};

let amadeusAccessToken = null;
let tokenExpiry = null;

/**
 * Get or refresh Amadeus access token
 */
async function getAmadeusToken() {
  // Check if token is still valid
  if (amadeusAccessToken && tokenExpiry && new Date().getTime() < tokenExpiry) {
    return amadeusAccessToken;
  }

  try {
    const response = await fetch(AMADEUS_CONFIG.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_CONFIG.clientId,
        client_secret: "AqKT83IrA1AkRnAF" // You'll need to add this if using OAuth
      })
    });

    if (!response.ok) {
      throw new Error("Failed to get Amadeus token");
    }

    const data = await response.json();
    amadeusAccessToken = data.access_token;
    tokenExpiry = new Date().getTime() + (data.expires_in * 1000);
    
    return amadeusAccessToken;
  } catch (error) {
    console.error("Token fetch failed:", error);
    throw error;
  }
}

/**
 * Search for flights using Amadeus API
 */
async function searchFlights(from, to, departDate, returnDate, travelers) {
  try {
    const token = await getAmadeusToken();
    
    // Extract IATA codes from location strings (e.g., "New York (JFK)" -> "JFK")
    const fromCode = extractIataCode(from);
    const toCode = extractIataCode(to);

    const params = new URLSearchParams({
      originLocationCode: fromCode,
      destinationLocationCode: toCode,
      departureDate: departDate,
      adults: travelers,
      max: "12"
    });

    if (returnDate) {
      params.append("returnDate", returnDate);
    }

    const url = `${AMADEUS_CONFIG.baseUrl}/shopping/flight-offers?${params}`;
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error("Flight search failed:", response.status);
      throw new Error("Flight search failed");
    }

    return await response.json();
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
    const token = await getAmadeusToken();
    
    // Get city code from location string
    const cityCode = extractIataCode(city);

    const params = new URLSearchParams({
      cityCode: cityCode,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      adults: travelers,
      max: "12"
    });

    const url = `${AMADEUS_CONFIG.baseUrl}/reference-data/locations/hotels/by-city?${params}`;
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error("Hotel search failed:", response.status);
      throw new Error("Hotel search failed");
    }

    return await response.json();
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
    const token = await getAmadeusToken();
    
    const params = new URLSearchParams({
      pickupLocationCode: extractIataCode(location),
      dropoffLocationCode: extractIataCode(location),
      pickupDate: startDate,
      dropoffDate: endDate,
      pickupTime: pickupTime || "10:00",
      dropoffTime: dropoffTime || "10:00",
      max: "12"
    });

    const url = `${AMADEUS_CONFIG.baseUrl}/shopping/car-rental-offers?${params}`;
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error("Car search failed:", response.status);
      throw new Error("Car search failed");
    }

    return await response.json();
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
