import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get("/score", async (req, res) => {
  const { address, lat, lon } = req.query;
  console.log("Received Walk Score request with:", { address, lat, lon });

  if (!address || !lat || !lon) {
    return res.status(400).json({
      error: "Missing required query parameters: address, lat, lon"
    });
  }

  const WALK_SCORE_API_KEY = process.env.WALK_SCORE_API_KEY;
  if (!WALK_SCORE_API_KEY) {
    return res.status(500).json({ error: "Walk Score API key not set" });
  }

  try {
    const walkScoreUrl = "https://api.walkscore.com/score";
    const response = await axios.get(walkScoreUrl, {
      params: {
        format: "json",
        address: address,
        lat: Number(lat),
        lon: Number(lon),
        wsapikey: WALK_SCORE_API_KEY,
        transit: 1,
        bike: 1
      }
    });
    console.log("Walk Score API response:", response.data);
    res.json(response.data);
  } catch (error: any) {
    console.error("Walk Score API error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch Walk Score data",
      message: error.response?.data?.message || error.message
    });
  }
});

export default router;
