import express from "express";
import multer from "multer";
import { performOCR } from "../../src/utils/documentVerification";

const router = express.Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {
  console.log('[Router] Received request for document verification.');
  try {
    if (!req.file) {
      console.error('[Router] No file uploaded.');
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    console.log('[Router] File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const propertyDetails = JSON.parse(req.body.propertyDetails);
    console.log('[Router] Property details received:', propertyDetails);

    const fileBuffer: Buffer = req.file.buffer;
    const mimetype = req.file.mimetype;
    const verificationResult = await performOCR(fileBuffer, propertyDetails, mimetype);
    console.log('[Router] Verification result:', verificationResult);
    res.json(verificationResult);
  } catch (error: any) {
    console.error('[Router] Document verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify document",
    });
  }
});

export default router;
