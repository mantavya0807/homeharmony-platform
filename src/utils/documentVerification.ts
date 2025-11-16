// src/utils/documentVerification.ts

import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

export interface VerificationResponse {
  success: boolean;
  text?: string;
  error?: string;
  is_verified?: boolean;
  matches?: any; // from Gemini
  score?: number;
  refinedScore?: number;
  refinedMatches?: any; // from Gemini
  leaseInfo?: {
    originalRent?: number;
    leaseTerm?: number | null;
    startDate?: string;
    endDate?: string;
    rentDifferential?: number | null;
  };
}

export interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: string;
  original_lease_rent?: string;
  sublease_rent?: string;
  sublease_from?: string;
  sublease_to?: string;
}

// Lazy initialization of Google Cloud Vision client
// This prevents errors during build time when env vars aren't available
let visionClient: ImageAnnotatorClient | null = null;

const getVisionClient = (): ImageAnnotatorClient => {
  if (visionClient) {
    return visionClient;
  }

  // Support both file path (local) and JSON string (Vercel)
  let config;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // For Vercel deployment - use JSON string
    config = {
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    };
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // For local development - use file path
    config = {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    };
  } else {
    throw new Error('Google Cloud Vision credentials not configured. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }

  visionClient = new ImageAnnotatorClient(config);
  return visionClient;
};

async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  console.log('[OCR-Utility] Extracting text from PDF...');
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    console.log(`[OCR-Utility] Page ${i} text (first 100 chars):`, pageText.substring(0, 100));
    fullText += pageText + '\n';
  }
  return fullText;
}

async function extractTextFromImage(fileBuffer: Buffer): Promise<string> {
  console.log('[OCR-Utility] Using Google Cloud Vision for OCR on image...');
  try {
    const client = getVisionClient();
    const [result] = await client.textDetection({ image: { content: fileBuffer } });
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in image');
    }
    const extracted = detections[0].description || '';
    console.log('[OCR-Utility] Extracted text (first 100 chars):', extracted.substring(0, 100));
    return extracted;
  } catch (error) {
    console.error('[OCR-Utility] Error during OCR:', error);
    throw error;
  }
}

/**
 * Calls the Gemini API to refine the verification analysis.
 * The entire OCR text is sent to Gemini along with the provided property details.
 */
async function refineVerificationWithGemini(
  extractedText: string,
  propertyDetails: PropertyDetails
): Promise<{ refinedScore: number; refinedMatches: any; leaseInfo: any }> {
  const geminiUrl = process.env.GEMINI_API_URL || 'http://localhost:4000/api/gemini/refine';
  const geminiApiKey = process.env.GEMINI_API_KEY || 'GEMINI_API_KEY_123';
  console.log('[Gemini] Sending data to Gemini API for refined analysis...');
  console.log('[Gemini] Object sent:', { ocrText: extractedText.substring(0, 200), propertyDetails });
  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${geminiApiKey}`
      },
      body: JSON.stringify({
        ocrText: extractedText,
        propertyDetails: propertyDetails
      })
    });
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    const refinedData = await response.json();
    console.log('[Gemini] Received refined analysis:', refinedData);
    return refinedData;
  } catch (error) {
    console.error('[Gemini] Error during Gemini API call:', error);
    throw error;
  }
}

/**
 * Main function to perform OCR and then refine the details using the Gemini API.
 * The entire extracted text is sent to Gemini, and Gemini returns all the details.
 */
export async function performOCR(
  fileBuffer: Buffer,
  propertyDetails: PropertyDetails,
  fileMimetype: string
): Promise<VerificationResponse> {
  try {
    console.log('[OCR] Starting document verification...');
    let extractedText = '';
    if (fileMimetype === 'application/pdf') {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else {
      extractedText = await extractTextFromImage(fileBuffer);
    }
    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the document');
    }
    
    // Send the entire text to Gemini and let it extract details
    console.log('[OCR] Sending text to Gemini API (first 200 chars):', extractedText.substring(0, 200));
    const geminiResult = await refineVerificationWithGemini(extractedText, propertyDetails);
    
    console.log('[OCR] Gemini API returned:', geminiResult);
    
    // Use Gemini result as the final result.
    const finalResult: VerificationResponse = {
      success: true,
      text: extractedText,
      is_verified: geminiResult.refinedScore >= 80,
      matches: geminiResult.refinedMatches,
      score: geminiResult.refinedScore,
      refinedScore: geminiResult.refinedScore,
      refinedMatches: geminiResult.refinedMatches,
      leaseInfo: geminiResult.leaseInfo,
    };
    
    console.log('[OCR] Final verification result:', finalResult);
    return finalResult;
  } catch (error: any) {
    console.error('[OCR] Document verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify document',
    };
  }
}

interface DualVerificationResponse extends VerificationResponse {
  leaseVerified?: boolean;
  utilityBillVerified?: boolean;
  documentsMatch?: boolean;
  matchDetails?: {
    nameMatch: boolean;
    addressMatch: boolean;
    dateMatch: boolean;
    extractedLease: {
      name?: string;
      address?: string;
      startDate?: string;
      endDate?: string;
    };
    extractedUtilityBill: {
      name?: string;
      address?: string;
      billDate?: string;
    };
  };
}

/**
 * Performs verification on both lease and utility bill documents and compares them
 */
export async function performDualDocumentVerification(
  leaseBuffer: Buffer,
  leaseMimetype: string,
  utilityBuffer: Buffer,
  utilityMimetype: string,
  propertyDetails: PropertyDetails
): Promise<DualVerificationResponse> {
  try {
    console.log('[Dual-OCR] Starting dual document verification...');
    
    // Extract text from both documents
    let leaseText = '';
    let utilityText = '';
    
    if (leaseMimetype === 'application/pdf') {
      leaseText = await extractTextFromPDF(leaseBuffer);
    } else {
      leaseText = await extractTextFromImage(leaseBuffer);
    }
    
    if (utilityMimetype === 'application/pdf') {
      utilityText = await extractTextFromPDF(utilityBuffer);
    } else {
      utilityText = await extractTextFromImage(utilityBuffer);
    }
    
    if (!leaseText.trim() || !utilityText.trim()) {
      throw new Error('Could not extract text from one or both documents');
    }
    
    console.log('[Dual-OCR] Lease text extracted (first 200 chars):', leaseText.substring(0, 200));
    console.log('[Dual-OCR] Utility bill text extracted (first 200 chars):', utilityText.substring(0, 200));
    
    // Send both texts to Gemini for cross-verification
    const geminiUrl = process.env.GEMINI_API_URL || 'http://localhost:4000/api/gemini/refine-dual';
    const geminiApiKey = process.env.GEMINI_API_KEY || 'GEMINI_API_KEY_123';
    
    console.log('[Dual-OCR] Sending both documents to Gemini for cross-verification...');
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${geminiApiKey}`
      },
      body: JSON.stringify({
        leaseText,
        utilityBillText: utilityText,
        propertyDetails
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    
    const geminiResult = await response.json();
    console.log('[Dual-OCR] Gemini cross-verification result:', geminiResult);
    
    // Calculate overall match score
    const matchDetails = geminiResult.matchDetails || {};
    const matchScore = [
      matchDetails.nameMatch,
      matchDetails.addressMatch,
      matchDetails.dateMatch
    ].filter(Boolean).length;
    
    const documentsMatch = matchScore >= 2; // At least 2 out of 3 must match
    const overallScore = geminiResult.refinedScore || 0;
    
    const finalResult: DualVerificationResponse = {
      success: true,
      text: `LEASE:\n${leaseText}\n\nUTILITY BILL:\n${utilityText}`,
      is_verified: documentsMatch && overallScore >= 80,
      leaseVerified: geminiResult.leaseVerified || false,
      utilityBillVerified: geminiResult.utilityBillVerified || false,
      documentsMatch,
      matchDetails: geminiResult.matchDetails,
      matches: geminiResult.refinedMatches,
      score: overallScore,
      refinedScore: overallScore,
      refinedMatches: geminiResult.refinedMatches,
      leaseInfo: geminiResult.leaseInfo,
    };
    
    console.log('[Dual-OCR] Final dual verification result:', finalResult);
    return finalResult;
    
  } catch (error: any) {
    console.error('[Dual-OCR] Dual document verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify documents',
    };
  }
}
