// server/api/googleTransit.ts

import express from "express";
import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
import { corsHeaders, corsMiddleware } from "../_shared/cors";

dotenv.config();

const router = express.Router();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const googleMapsClient = new Client({});

if (!GOOGLE_MAPS_API_KEY) {
  console.warn("GOOGLE_MAPS_API_KEY not set in environment variables.");
}

// Apply CORS middleware
router.use(corsMiddleware);

/**
 * GET /directions
 * Get transit directions from origin to destination
 * Query params: origin, destination, departure_time (optional, defaults to now)
 */
router.get("/directions", async (req, res) => {
  const { origin, destination, departure_time } = req.query;
  
  console.log("Received transit directions request:", { origin, destination, departure_time });

  if (!origin || !destination) {
    return res.status(400).json({
      error: "Missing required parameters",
      message: "Required parameters: origin, destination"
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("No Google Maps API key, returning mock data");
    return res.json(getMockTransitDirections(origin as string, destination as string));
  }

  try {
    // Parse departure time or use current time
    const departureTime = departure_time 
      ? new Date(departure_time as string) 
      : new Date();

    const response = await googleMapsClient.directions({
      params: {
        origin: origin as string,
        destination: destination as string,
        mode: "transit" as const,
        departure_time: departureTime,
        alternatives: true,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== "OK") {
      console.error("Google Directions API error:", response.data.status);
      return res.json(getMockTransitDirections(origin as string, destination as string));
    }

    // Transform the response to include relevant transit information
    const routes = response.data.routes.map(route => ({
      summary: route.summary,
      distance: route.legs[0].distance,
      duration: route.legs[0].duration,
      departureTime: route.legs[0].departure_time,
      arrivalTime: route.legs[0].arrival_time,
      steps: route.legs[0].steps.map(step => ({
        travelMode: step.travel_mode,
        distance: step.distance,
        duration: step.duration,
        instructions: step.html_instructions,
        transitDetails: step.transit_details ? {
          line: {
            name: step.transit_details.line.name,
            shortName: step.transit_details.line.short_name,
            color: step.transit_details.line.color,
            vehicle: step.transit_details.line.vehicle.name,
            icon: step.transit_details.line.vehicle.icon
          },
          departureStop: {
            name: step.transit_details.departure_stop.name,
            location: step.transit_details.departure_stop.location
          },
          arrivalStop: {
            name: step.transit_details.arrival_stop.name,
            location: step.transit_details.arrival_stop.location
          },
          numStops: step.transit_details.num_stops,
          headsign: step.transit_details.headsign
        } : undefined
      }))
    }));

    res.json({
      status: "success",
      routes
    });

  } catch (error) {
    console.error("Error fetching transit directions:", error);
    res.status(500).json({
      error: "Failed to fetch transit directions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /nearby-stations
 * Find nearby transit stations
 * Query params: lat, lng, radius (optional, default 500m)
 */
router.get("/nearby-stations", async (req, res) => {
  const { lat, lng, radius = "500" } = req.query;
  
  console.log("Received nearby stations request:", { lat, lng, radius });

  if (!lat || !lng) {
    return res.status(400).json({
      error: "Missing required parameters",
      message: "Required parameters: lat, lng"
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("No Google Maps API key, returning mock data");
    return res.json(getMockNearbyStations());
  }

  try {
    const location = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const response = await googleMapsClient.placesNearby({
      params: {
        location,
        radius: parseInt(radius as string),
        type: "transit_station",
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", response.data.status);
      return res.json(getMockNearbyStations());
    }

    const stations = response.data.results.map(station => ({
      id: station.place_id,
      name: station.name,
      vicinity: station.vicinity,
      location: station.geometry?.location,
      rating: station.rating,
      types: station.types
    }));

    res.json({
      status: "success",
      stations,
      count: stations.length
    });

  } catch (error) {
    console.error("Error fetching nearby stations:", error);
    res.status(500).json({
      error: "Failed to fetch nearby stations",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /routes-at-location
 * Get transit routes available at a specific location
 * This combines Walk Score transit data with Places API to get actual transit information
 * Query params: lat, lng
 */
router.get("/routes-at-location", async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      error: "Missing required parameters",
      message: "Required parameters: lat, lng"
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("No Google Maps API key, returning mock data");
    return res.json(getMockRoutesAtLocation());
  }

  try {
    const location = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    // Search for nearby transit stations
    const stationsResponse = await googleMapsClient.placesNearby({
      params: {
        location,
        radius: 800, // 800m radius
        type: "transit_station",
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (stationsResponse.data.status !== "OK" && stationsResponse.data.status !== "ZERO_RESULTS") {
      return res.json(getMockRoutesAtLocation());
    }

    // Get details for each station to find route information
    const stations = stationsResponse.data.results.slice(0, 10); // Limit to 10 stations
    
    const routes: any[] = [];
    const routeMap = new Map(); // To deduplicate routes

    for (const station of stations) {
      try {
        const detailsResponse = await googleMapsClient.placeDetails({
          params: {
            place_id: station.place_id!,
            fields: ["name", "vicinity", "types"],
            key: GOOGLE_MAPS_API_KEY
          }
        });

        if (detailsResponse.data.status === "OK") {
          const details = detailsResponse.data.result;
          
          // Create route object from station
          const routeKey = details.name;
          if (!routeMap.has(routeKey)) {
            routeMap.set(routeKey, {
              name: details.name || station.name,
              type: "bus", // Default to bus, could be refined
              agency: "Local Transit",
              description: `Service at ${details.vicinity || station.vicinity}`,
              stops: [details.name || station.name]
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching details for station ${station.place_id}:`, error);
      }
    }

    const routesArray = Array.from(routeMap.values());

    res.json({
      status: "success",
      routes: routesArray,
      count: routesArray.length,
      stations: stations.map(s => ({
        id: s.place_id,
        name: s.name,
        vicinity: s.vicinity,
        location: s.geometry?.location
      }))
    });

  } catch (error) {
    console.error("Error fetching routes at location:", error);
    return res.json(getMockRoutesAtLocation());
  }
});

/**
 * Helper functions for mock data
 */
function getMockTransitDirections(origin: string, destination: string) {
  return {
    status: "success",
    routes: [
      {
        summary: "Via Campus Loop",
        distance: { text: "2.5 mi", value: 4023 },
        duration: { text: "25 mins", value: 1500 },
        steps: [
          {
            travelMode: "TRANSIT",
            instructions: "Take the Blue Loop bus",
            duration: { text: "15 mins", value: 900 },
            transitDetails: {
              line: {
                name: "Blue Loop",
                shortName: "Blue",
                color: "#0066CC",
                vehicle: "Bus"
              },
              departureStop: { name: "College Ave" },
              arrivalStop: { name: "Campus Center" },
              numStops: 5
            }
          }
        ]
      }
    ],
    mock: true
  };
}

function getMockNearbyStations() {
  return {
    status: "success",
    stations: [
      { id: "1", name: "College Ave Station", vicinity: "Downtown", location: { lat: 40.79, lng: -77.86 } },
      { id: "2", name: "Campus Center Stop", vicinity: "University", location: { lat: 40.80, lng: -77.85 } }
    ],
    count: 2,
    mock: true
  };
}

function getMockRoutesAtLocation() {
  return {
    status: "success",
    routes: [
      {
        name: "Blue Loop",
        type: "bus",
        agency: "CATA",
        description: "Campus loop service",
        frequency: "Every 15 min",
        stops: ["College Ave", "Atherton St", "Beaver Ave"]
      },
      {
        name: "Red Link",
        type: "bus",
        agency: "CATA",
        description: "Downtown and campus service",
        frequency: "Every 20 min",
        stops: ["Downtown", "College Ave", "University Dr"]
      },
      {
        name: "White Loop",
        type: "bus",
        agency: "CATA",
        description: "Evening and late night service",
        frequency: "Every 30 min",
        stops: ["Beaver Ave", "College Ave", "Pattee Library"]
      }
    ],
    count: 3,
    mock: true
  };
}

export default router;

