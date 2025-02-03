import express from "express";
import { trackClick } from "../../src/utils/clicks";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("[Router] Received request for property click tracking.");

  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      console.error("[Router] No property ID provided.");
      return res.status(400).json({ success: false, error: "Property ID is required" });
    }

    console.log(`[Router] Tracking click for property ID: ${propertyId}`);
    const result = await trackClick(propertyId);

    if (!result.success) {
      console.error("[Router] Error tracking click:", result.error);
      return res.status(400).json(result);
    }

    console.log("[Router] Click tracked successfully.");
    res.json(result);
  } catch (error: any) {
    console.error("[Router] Property click tracking error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to track property click",
    });
  }
});

export default router;
