import express from "express";
import multer from "multer";
import { performOCR, performDualDocumentVerification } from "../../src/utils/documentVerification";

const router = express.Router();
const upload = multer();

// Single document verification (existing endpoint for backwards compatibility)
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

// Dual document verification endpoint (lease + utility bill)
router.post("/dual", upload.fields([
  { name: 'lease', maxCount: 1 },
  { name: 'utilityBill', maxCount: 1 }
]), async (req, res) => {
  console.log('[Router] Received request for dual document verification.');
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.lease || !files.utilityBill) {
      console.error('[Router] Missing required documents.');
      return res.status(400).json({
        success: false,
        error: "Both lease and utility bill documents are required",
      });
    }

    const leaseFile = files.lease[0];
    const utilityFile = files.utilityBill[0];
    
    console.log('[Router] Lease file:', {
      originalname: leaseFile.originalname,
      mimetype: leaseFile.mimetype,
      size: leaseFile.size,
    });
    console.log('[Router] Utility bill file:', {
      originalname: utilityFile.originalname,
      mimetype: utilityFile.mimetype,
      size: utilityFile.size,
    });

    const propertyDetails = JSON.parse(req.body.propertyDetails);
    console.log('[Router] Property details received:', propertyDetails);

    const verificationResult = await performDualDocumentVerification(
      leaseFile.buffer,
      leaseFile.mimetype,
      utilityFile.buffer,
      utilityFile.mimetype,
      propertyDetails
    );
    
    console.log('[Router] Dual verification result:', verificationResult);
    res.json(verificationResult);
  } catch (error: any) {
    console.error('[Router] Dual document verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify documents",
    });
  }
});

export default router;
