// server/api/walkscore.ts

import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { corsHeaders, corsMiddleware } from "../_shared/cors";
import { Client } from "@googlemaps/google-maps-services-js";

dotenv.config();

const router = express.Router();
const WALK_SCORE_API_KEY = process.env.WALK_SCORE_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Initialize Google Maps client
const googleMapsClient = new Client({});

if (!WALK_SCORE_API_KEY) {
  console.warn("WALK_SCORE_API_KEY not set in environment variables. Using mock data.");
}

if (!GOOGLE_MAPS_API_KEY) {
  console.warn("GOOGLE_MAPS_API_KEY not set in environment variables. Geocoding will not work.");
}

// Apply CORS middleware
router.use(corsMiddleware);

/**
 * Geocode an address using Google Maps API
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Cannot geocode: No Google Maps API key");
    return null;
  }

  try {
    console.log(`Geocoding address: ${address}`);
    const response = await googleMapsClient.geocode({
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Geocoded ${address} to:`, location);
      return location;
    } else {
      console.warn(`Geocoding error: ${response.data.status}`);
      return null;
    }
  } catch (error) {
    console.error("Error during geocoding:", error);
    return null;
  }
}

/**
 * GET /score
 * Returns Walk Score, Transit Score, and Bike Score for a location
 */
router.get("/score", async (req, res) => {
  const { address, lat, lon, city, state } = req.query;
  console.log("Received Walk Score request with:", { address, lat, lon, city, state });
  console.log("WALK_SCORE_API_KEY present:", !!WALK_SCORE_API_KEY);
  console.log("GOOGLE_MAPS_API_KEY present:", !!GOOGLE_MAPS_API_KEY);

  // Validate minimum required parameters
  if (!address && (!lat || !lon)) {
    return res.status(400).json({
      error: "Missing required parameters",
      message: "Required parameters: either address OR (lat AND lon)"
    });
  }

  try {
    // Try to geocode if address is provided but coordinates are not
    let latitude = lat ? parseFloat(lat as string) : null;
    let longitude = lon ? parseFloat(lon as string) : null;
    
    if (address && (!latitude || !longitude)) {
      // Address provided without coordinates - attempt geocoding
      const fullAddress = `${address}, ${city || ''}, ${state || ''}`.replace(/,\s+,/g, ',').trim();
      const geocodeResult = await geocodeAddress(fullAddress);
      
      if (geocodeResult) {
        latitude = geocodeResult.lat;
        longitude = geocodeResult.lng;
        console.log(`Successfully geocoded to: ${latitude}, ${longitude}`);
      } else {
        console.warn("Geocoding failed, returning mock data");
        return res.json(getMockWalkScoreData(city as string, state as string));
      }
    }
    
    // If we couldn't get coordinates, return mock data
    if (!latitude || !longitude) {
      console.warn("No coordinates available, returning mock data");
      return res.json(getMockWalkScoreData(city as string, state as string));
    }

    // If no API key, return mock data for development
    if (!WALK_SCORE_API_KEY) {
      console.log("Using mock Walk Score data (no API key provided)");
      return res.json(getMockWalkScoreData(city as string, state as string));
    }

    // Construct the proper address
    const formattedAddress = address || `${city}, ${state}`;

    // Make request to Walk Score API
    const params = {
      format: "json",
      address: formattedAddress,
      lat: latitude,
      lon: longitude,
      wsapikey: WALK_SCORE_API_KEY,
      transit: 1,
      bike: 1
    };

    console.log("Making request to Walk Score API with params:", {
      address: formattedAddress,
      lat: latitude,
      lon: longitude
    });

    const response = await axios.get("https://api.walkscore.com/score", { 
      params,
      timeout: 5000 // 5 second timeout
    });
    
    console.log("Walk Score API response status:", response.status);
    
    if (response.data.status !== 1) {
      console.warn("Walk Score API returned non-success status:", response.data);
      return res.json(getMockWalkScoreData(city as string, state as string));
    }
    
    return res.json(response.data);
  } catch (error: unknown) {  // Explicitly type error as unknown
    console.error("Error fetching Walk Score data:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    // Return error details in development, mock data in production
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        error: "Walk Score API error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    // Return mock data when the API fails in production
    console.log("Returning mock data due to API error");
    return res.json(getMockWalkScoreData(city as string, state as string));
  }
});

/**
 * GET /network
 * Returns transit network details for a location
 */
router.get("/network", async (req, res) => {
  const { address, lat, lon, city, state } = req.query;
  console.log("Received transit network request:", { address, lat, lon, city, state });

  // Apply CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.header(key, value);
  });

  try {
    // Try to geocode if address is provided but coordinates are not
    let latitude = lat ? parseFloat(lat as string) : null;
    let longitude = lon ? parseFloat(lon as string) : null;
    
    if (address && (!latitude || !longitude)) {
      // Address provided without coordinates - attempt geocoding
      const fullAddress = `${address}, ${city || ''}, ${state || ''}`.replace(/,\s+,/g, ',').trim();
      const geocodeResult = await geocodeAddress(fullAddress);
      
      if (geocodeResult) {
        latitude = geocodeResult.lat;
        longitude = geocodeResult.lng;
      } else {
        return res.status(400).json({
          error: "Geocoding failed",
          message: "Could not determine coordinates for the given address"
        });
      }
    }
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "Required parameters: either address OR (lat AND lon)"
      });
    }

    // Return mock transit network data
    res.json(getMockTransitNetworkData(latitude, longitude, city as string, state as string));
  } catch (error: unknown) {
    console.error("Error fetching transit network data:", error);
    res.status(500).json({
      error: "Failed to fetch transit network data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Helper function to generate mock Walk Score data when API is unavailable
 */
function getMockWalkScoreData(city?: string, state?: string) {
  // Generate location-appropriate mock data
  const cityName = city || "State College";
  const stateName = state || "PA";
  
  // Generate different scores based on city
  let walkscore = 85;
  let transitScore = 62;
  let bikeScore = 76;
  
  // Adjust scores for known cities
  if (cityName === "New York") {
    walkscore = 96;
    transitScore = 86; 
    bikeScore = 68;
  } else if (cityName === "State College") {
    walkscore = 88;
    transitScore = 54;
    bikeScore = 72;
  }
  
  return {
    status: 1,
    walkscore: walkscore,
    description: walkscore > 90 ? "Walker's Paradise" : walkscore > 80 ? "Very Walkable" : "Somewhat Walkable",
    updated: new Date().toISOString(),
    logo_url: "https://cdn.walk.sc/images/api-logo.png",
    more_info_icon: "https://cdn.walk.sc/images/api-more-info.gif",
    more_info_link: "https://www.walkscore.com/how-it-works/",
    ws_link: `https://www.walkscore.com/score/${encodeURIComponent(cityName)}-${encodeURIComponent(stateName)}`,
    snapped_lat: 0,
    snapped_lon: 0,
    transit: {
      score: transitScore,
      description: transitScore > 80 ? "Excellent Transit" : transitScore > 60 ? "Good Transit" : "Some Transit",
      summary: `${transitScore > 80 ? 'Multiple' : 'Several'} nearby public transportation options in ${cityName}`
    },
    bike: {
      score: bikeScore,
      description: bikeScore > 70 ? "Very Bikeable" : "Bikeable"
    },
    scores: {
      "Dining": {
        score: cityName === "New York" ? 95 : 88,
        description: "Great dining options nearby",
        places: [`${cityName} Restaurants`, "Campus Dining", "Coffee Shops"]
      },
      "Shopping": {
        score: cityName === "New York" ? 92 : 85,
        description: "Good shopping options",
        places: ["Downtown Shops", "Local Mall", "Grocery Stores"]
      },
      "Schools": {
        score: 90,
        description: "Excellent education options",
        places: [cityName === "New York" ? "NYU" : "Penn State University", `${cityName} Schools`]
      },
      "Parks": {
        score: 81,
        description: "Many parks nearby",
        places: ["Local Parks", "Recreation Areas"]
      }
    }
  };
}

/**
 * Helper function for mock transit network data
 */
function getMockTransitNetworkData(lat: number, lon: number, city?: string, state?: string) {
  const cityName = city || "State College";
  
  // Generate different transit networks based on city
  if (cityName === "New York") {
    return {
      routes: {
        "r1": {
          category: "Bus",
          agency: "MTA",
          name: "Express Bus",
          short_name: "X1",
          description: "Express service across Manhattan",
          stop_ids: ["s1", "s2", "s3"]
        },
        "r2": {
          category: "Rail",
          agency: "MTA",
          name: "Subway",
          short_name: "A",
          description: "Subway service to Queens",
          stop_ids: ["s4", "s5", "s6"]
        }
      },
      stops: {
        "s1": {
          name: "53rd and Lexington",
          lat: lat,
          lon: lon,
          route_ids: ["r1", "r2"]
        },
        "s2": {
          name: "Grand Central",
          lat: lat + 0.01,
          lon: lon - 0.01,
          route_ids: ["r1"]
        }
      }
    };
  }
  
  // Default for other cities
  return {
    routes: {
      "r1": {
        category: "Bus",
        agency: "Local Transit Authority",
        name: "Downtown Express",
        short_name: "A",
        description: "Express service to downtown area",
        stop_ids: ["s1", "s2", "s3"]
      },
      "r2": {
        category: "Bus",
        agency: "University Transportation",
        name: "Campus Loop",
        short_name: "Blue",
        description: "Service around university campus",
        stop_ids: ["s4", "s5", "s6"]
      }
    },
    stops: {
      "s1": {
        name: `${cityName} Central`,
        lat: lat,
        lon: lon,
        route_ids: ["r1", "r2"]
      },
      "s2": {
        name: "Downtown",
        lat: lat + 0.005,
        lon: lon - 0.002,
        route_ids: ["r1"]
      }
    }
  };
}

export default router;