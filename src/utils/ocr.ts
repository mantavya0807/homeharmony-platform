// src/utils/ocr.ts

import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import jsLevenshtein from "js-levenshtein";

export interface OCRResponse {
  success: boolean;
  text?: string;
  error?: string;
  is_verified?: boolean;
  matches?: string[];
  score?: number;
  details?: {
    addressMatch?: boolean;
    cityMatch?: boolean;
    stateMatch?: boolean;
    zipMatch?: boolean;
  };
}

interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: string;
  title: string;
}

// State abbreviations mapping
const STATE_MAPPINGS: { [key: string]: string[] } = {
  "pennsylvania": ["pa", "penn", "penna"],
  "new york": ["ny"],
  // Add more states as needed
};

/**
 * Normalizes an address string for comparison
 */
function normalizeAddress(address: string): string {
  return address.toLowerCase()
    .replace("east", "e")
    .replace("west", "w")
    .replace("north", "n")
    .replace("south", "s")
    .replace("avenue", "ave")
    .replace("street", "st")
    .replace("road", "rd")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes a state name and checks against known abbreviations
 */
function normalizeState(state: string): string[] {
  state = state.toLowerCase();
  for (const [fullName, abbreviations] of Object.entries(STATE_MAPPINGS)) {
    if (state === fullName || abbreviations.includes(state)) {
      return [fullName, ...abbreviations];
    }
  }
  return [state];
}

/**
 * Enhanced fuzzy matching with special handling for addresses
 */
function enhancedMatch(text: string, value: string, type: string): number {
  if (!text || !value) return 0;

  // Special handling for different field types
  switch (type) {
    case 'address':
      const normalizedText = normalizeAddress(text);
      const normalizedValue = normalizeAddress(value);
      // Check if one contains the other
      if (normalizedText.includes(normalizedValue) || normalizedValue.includes(normalizedText)) {
        return 1;
      }
      return fuzzySimilarity(normalizedText, normalizedValue);

    case 'state':
      const stateVariants = normalizeState(value);
      return stateVariants.some(variant => text.toLowerCase().includes(variant)) ? 1 : 0;

    case 'zip_code':
      // For ZIP codes, check for exact match within the text
      return text.includes(value) ? 1 : 0;

    default:
      return fuzzySimilarity(text.toLowerCase(), value.toLowerCase());
  }
}

/**
 * Basic Levenshtein-based fuzzy matching
 */
function fuzzySimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const distance = jsLevenshtein(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  const similarity = 1 - distance / maxLen;
  return similarity < 0 ? 0 : similarity;
}

/**
 * Enhanced property details checking with field-specific logic
 */
function checkPropertyDetails(
  docText: string,
  details: PropertyDetails
): { matches: string[]; matchCount: number; averageScore: number; matchDetails: any } {
  const fields = [
    { key: "address", value: details.address, type: "address", threshold: 0.8 },
    { key: "city", value: details.city, type: "city", threshold: 0.8 },
    { key: "state", value: details.state, type: "state", threshold: 1 },
    { key: "zip_code", value: details.zip_code, type: "zip_code", threshold: 1 },
  ];

  let matches: string[] = [];
  let totalScore = 0;
  let matchDetails: any = {};

  fields.forEach((field) => {
    const score = enhancedMatch(docText, field.value, field.type);
    totalScore += score;
    
    if (score >= field.threshold) {
      matches.push(field.key);
      matchDetails[`${field.key}Match`] = true;
    } else {
      matchDetails[`${field.key}Match`] = false;
    }
  });

  return {
    matches,
    matchCount: matches.length,
    averageScore: totalScore / fields.length,
    matchDetails
  };
}

/**
 * Extracts text directly from PDF using pdf.js
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * Main OCR function with enhanced verification logic
 */
export const performOCR = async (
  file: File,
  propertyDetails: PropertyDetails
): Promise<OCRResponse> => {
  try {
    console.log("Starting OCR process for:", file.name, file.type);
    console.log("Property details:", propertyDetails);

    let extractedText = "";

    if (file.type === "application/pdf") {
      console.log("Processing PDF file...");
      extractedText = await extractTextFromPDF(file);
    } else if (file.type.startsWith("image/")) {
      console.log("Processing image file...");
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: m => console.log("Tesseract progress:", m)
      });
      extractedText = data.text;
    } else {
      throw new Error("Unsupported file type. Please upload an image or PDF.");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        error: "No text could be extracted from the document"
      };
    }

    console.log("Extracted text:", extractedText);

    const { matches, matchCount, averageScore, matchDetails } = checkPropertyDetails(
      extractedText,
      propertyDetails
    );

    // Verification requires at least address & zip_code match, or 3+ total matches
    const isVerified = (matchDetails.addressMatch && matchDetails.zipMatch) || matchCount >= 3;

    console.log("Match results:", {
      matches,
      matchCount,
      averageScore,
      matchDetails,
      isVerified
    });

    return {
      success: true,
      text: extractedText,
      is_verified: isVerified,
      matches,
      score: averageScore,
      details: matchDetails
    };

  } catch (error: any) {
    console.error("OCR Error:", error);
    return {
      success: false,
      error: error.message || "Failed to process document"
    };
  }
};