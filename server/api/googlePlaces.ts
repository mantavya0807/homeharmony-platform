// server/api/googlePlaces.ts

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
 * GET /nearby
 * Search for nearby places around a location
 * Query params: lat, lng, radius (optional, default 1500m), type (optional)
 */
router.get("/nearby", async (req, res) => {
  const { lat, lng, radius = "1500", type } = req.query;
  
  console.log("Received nearby places request:", { lat, lng, radius, type });

  if (!lat || !lng) {
    return res.status(400).json({
      error: "Missing required parameters",
      message: "Required parameters: lat, lng"
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("No Google Maps API key, returning mock data");
    return res.json(getMockPlacesData(type as string));
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
        type: type as string,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", response.data.status);
      return res.json(getMockPlacesData(type as string));
    }

    // Transform the response to include relevant information
    const places = response.data.results.map(place => ({
      id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      location: place.geometry?.location,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      priceLevel: place.price_level,
      businessStatus: place.business_status,
      icon: place.icon,
      photos: place.photos?.map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      }))
    }));

    res.json({
      status: "success",
      results: places,
      count: places.length
    });

  } catch (error) {
    console.error("Error fetching nearby places:", error);
    res.status(500).json({
      error: "Failed to fetch nearby places",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /details
 * Get detailed information about a specific place
 * Query params: place_id
 */
router.get("/details", async (req, res) => {
  const { place_id } = req.query;
  
  if (!place_id) {
    return res.status(400).json({
      error: "Missing required parameter",
      message: "Required parameter: place_id"
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({
      error: "API key not configured"
    });
  }

  try {
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: place_id as string,
        key: GOOGLE_MAPS_API_KEY,
        fields: [
          "name",
          "formatted_address",
          "formatted_phone_number",
          "opening_hours",
          "rating",
          "user_ratings_total",
          "price_level",
          "website",
          "photos",
          "reviews"
        ]
      }
    });

    if (response.data.status !== "OK") {
      return res.status(404).json({
        error: "Place not found",
        status: response.data.status
      });
    }

    res.json({
      status: "success",
      result: response.data.result
    });

  } catch (error) {
    console.error("Error fetching place details:", error);
    res.status(500).json({
      error: "Failed to fetch place details",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /photo
 * Get a photo from a place
 * Query params: photo_reference, maxwidth (optional)
 */
router.get("/photo", async (req, res) => {
  const { photo_reference, maxwidth = "400" } = req.query;
  
  if (!photo_reference) {
    return res.status(400).json({
      error: "Missing required parameter",
      message: "Required parameter: photo_reference"
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({
      error: "API key not configured"
    });
  }

  try {
    // Return the photo URL that can be used directly
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photo_reference}&key=${GOOGLE_MAPS_API_KEY}`;
    
    res.json({
      status: "success",
      url: photoUrl
    });

  } catch (error) {
    console.error("Error generating photo URL:", error);
    res.status(500).json({
      error: "Failed to generate photo URL",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /categories
 * Get places grouped by categories (dining, shopping, parks, etc.)
 * Query params: lat, lng, radius (optional)
 */
router.get("/categories", async (req, res) => {
  const { lat, lng, radius = "1500" } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      error: "Missing required parameters",
      message: "Required parameters: lat, lng"
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("No Google Maps API key, returning mock data");
    return res.json(getMockCategorizedData());
  }

  try {
    const location = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    // Define categories to search for
    const categories = [
      { name: "Dining", types: ["restaurant", "cafe", "meal_takeaway"] },
      { name: "Shopping", types: ["shopping_mall", "store", "clothing_store"] },
      { name: "Coffee", types: ["cafe", "coffee_shop"] },
      { name: "Education", types: ["school", "university", "library"] },
      { name: "Parks", types: ["park", "campground"] }
    ];

    const results: any = {};

    // Fetch places for each category
    for (const category of categories) {
      const promises = category.types.map(type =>
        googleMapsClient.placesNearby({
          params: {
            location,
            radius: parseInt(radius as string),
            type,
            key: GOOGLE_MAPS_API_KEY!
          }
        })
      );

      const responses = await Promise.all(promises);
      
      // Combine and deduplicate results
      const allPlaces = responses.flatMap(r => r.data.results || []);
      const uniquePlaces = Array.from(
        new Map(allPlaces.map(p => [p.place_id, p])).values()
      );

      // Calculate score based on number and quality of places
      const avgRating = uniquePlaces.reduce((sum, p) => sum + (p.rating || 0), 0) / 
                       (uniquePlaces.length || 1);
      const score = Math.min(100, Math.round(
        (uniquePlaces.length * 2) + (avgRating * 10)
      ));

      results[category.name] = {
        score,
        description: getScoreDescription(score),
        places: uniquePlaces.slice(0, 5).map(p => ({
          id: p.place_id,
          name: p.name,
          vicinity: p.vicinity,
          rating: p.rating,
          location: p.geometry?.location
        }))
      };
    }

    res.json({
      status: "success",
      categories: results
    });

  } catch (error) {
    console.error("Error fetching categorized places:", error);
    return res.json(getMockCategorizedData());
  }
});

/**
 * Helper function to generate score descriptions
 */
function getScoreDescription(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 45) return "Fair";
  return "Limited";
}

/**
 * Helper function for mock places data
 */
function getMockPlacesData(type?: string) {
  const mockPlaces = {
    restaurant: [
      { id: "1", name: "Local Restaurant", vicinity: "Downtown", rating: 4.5, types: ["restaurant"] },
      { id: "2", name: "Campus Dining Hall", vicinity: "University Ave", rating: 4.0, types: ["restaurant"] }
    ],
    cafe: [
      { id: "3", name: "Starbucks", vicinity: "Main St", rating: 4.3, types: ["cafe"] },
      { id: "4", name: "Local Coffee Shop", vicinity: "College Ave", rating: 4.7, types: ["cafe"] }
    ]
  };

  return {
    status: "success",
    results: mockPlaces[type as keyof typeof mockPlaces] || mockPlaces.restaurant,
    count: 2,
    mock: true
  };
}

/**
 * Helper function for mock categorized data
 */
function getMockCategorizedData() {
  return {
    status: "success",
    categories: {
      "Dining": {
        score: 88,
        description: "Very Good",
        places: [
          { id: "1", name: "Local Restaurants", vicinity: "Downtown" },
          { id: "2", name: "Campus Dining", vicinity: "University" }
        ]
      },
      "Shopping": {
        score: 85,
        description: "Very Good",
        places: [
          { id: "3", name: "Downtown Shops", vicinity: "Main St" },
          { id: "4", name: "College Mall", vicinity: "College Ave" }
        ]
      },
      "Coffee": {
        score: 92,
        description: "Excellent",
        places: [
          { id: "5", name: "Starbucks", vicinity: "Center" },
          { id: "6", name: "Local Cafe", vicinity: "Downtown" }
        ]
      },
      "Education": {
        score: 95,
        description: "Excellent",
        places: [
          { id: "7", name: "Penn State University", vicinity: "University Park" },
          { id: "8", name: "Libraries", vicinity: "Campus" }
        ]
      },
      "Parks": {
        score: 82,
        description: "Very Good",
        places: [
          { id: "9", name: "Sidney Friedman Park", vicinity: "West" },
          { id: "10", name: "Campus Green Spaces", vicinity: "Campus" }
        ]
      }
    },
    mock: true
  };
}

export default router;

