import express from "express";
import axios from "axios";
import dotenv from "dotenv";
// import * as cheerio from "cheerio"; // only if you plan to scrape the Walk Score page

dotenv.config();

const router = express.Router();
const WALK_SCORE_API_KEY = process.env.WALK_SCORE_API_KEY;

if (!WALK_SCORE_API_KEY) {
  console.error("WALK_SCORE_API_KEY not set in environment variables.");
}

/**
 * GET /score
 * Merges Walk, Bike, and Transit scores for a given location.
 * Required query params: address, lat, lon, city, and either state or country.
 */
router.get("/score", async (req, res) => {
  const { address, lat, lon, city, state, country } = req.query;
  console.log("Received Walk Score request with:", { address, lat, lon, city, state, country });

  if (!address || !lat || !lon || !city || (!state && !country)) {
    return res.status(400).json({
      error:
        "Missing required query parameters: address, lat, lon, city, and either state (US) or country (non-US)"
    });
  }

  try {
    // General Walk Score API (walk and bike)
    const generalUrl = "https://api.walkscore.com/score";
    const generalParams = {
      format: "json",
      address,
      lat: Number(lat),
      lon: Number(lon),
      wsapikey: WALK_SCORE_API_KEY,
      transit: 1,
      bike: 1
    };

    // Transit Score API
    const transitUrl = "https://transit.walkscore.com/transit/score/";
    const transitParams: any = {
      format: "json",
      address,
      lat: Number(lat),
      lon: Number(lon),
      city,
      wsapikey: WALK_SCORE_API_KEY,
      transit: 1,
      bike: 1
    };
    if (state) {
      transitParams.state = state;
    } else {
      transitParams.country = country;
    }

    // Parallel calls
    const [generalResp, transitResp] = await Promise.all([
      axios.get(generalUrl, { params: generalParams }),
      axios.get(transitUrl, { params: transitParams })
    ]);

    console.log("General API response:", generalResp.data);
    console.log("Transit API response:", transitResp.data);

    const generalData = generalResp.data;
    const transitData = transitResp.data;

    // Merge final
    const combined = {
      // from general
      walkscore: generalData.walkscore,
      walk_description: generalData.description,
      updated: generalData.updated,
      logo_url: generalData.logo_url,
      more_info_icon: generalData.more_info_icon,
      more_info_link: generalData.more_info_link,
      ws_link: generalData.ws_link,
      // transit
      transit: {
        score: transitData.transit_score,
        description: transitData.description,
        summary: transitData.summary
      },
      // bike
      bike: {
        score: generalData.bike_score ?? null,
        description: generalData.bike_description ?? ""
      },
      scores: generalData.scores ?? {},
      // optionally store scraped HTML
      transit_html: ""
    };

    // OPTIONAL scraping:
    /*
    if (combined.ws_link) {
      try {
        const pageResp = await axios.get(combined.ws_link);
        const $ = cheerio.load(pageResp.data);
        const transitHtml = $("#transit").html() || "";
        combined.transit_html = transitHtml;
      } catch (scrapeError) {
        console.error("Error scraping ws_link page:", scrapeError);
        combined.transit_html = "";
      }
    }
    */

    console.log("Combined response:", combined);
    res.json(combined);
  } catch (error: any) {
    console.error("Error fetching Walk Score data:", error.message);
    res.status(500).json({
      error: "Failed to fetch Walk Score data",
      message: error.message
    });
  }
});

/**
 * GET /network
 * Detailed transit network info from Walk Score.
 * Required: lat, lon
 */
router.get("/network", async (req, res) => {
  const { lat, lon } = req.query;
  console.log("Received Transit Network Search request with:", { lat, lon });

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing required query parameters: lat, lon" });
  }

  try {
    const url = "https://transit.walkscore.com/transit/search/network/";
    const params = {
      lat: Number(lat),
      lon: Number(lon),
      wsapikey: WALK_SCORE_API_KEY
    };

    const response = await axios.get(url, { params });
    console.log("Network Search API response:", response.data);
    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching transit network data:", error.message);
    res.status(500).json({
      error: "Failed to fetch transit network data",
      message: error.message
    });
  }
});

export default router;
