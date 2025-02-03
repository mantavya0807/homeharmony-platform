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

// Initialize the Google Cloud Vision client
const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

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
    const [result] = await visionClient.textDetection({ image: { content: fileBuffer } });
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
