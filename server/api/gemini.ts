import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY');

interface ExtractedInfo {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  originalRent?: number | null;
  leaseTerm?: number | null;
  startDate?: string;
  endDate?: string;
  leaseType?: string;
  propertyType?: string | null;
}

interface RefinedResponse {
  refinedScore: number;
  refinedMatches: {
    address: boolean;
    city: boolean;
    state: boolean;
    zip: boolean;
    price: boolean;
    leaseInfo: boolean;
  };
  leaseInfo: {
    originalRent: number | null;
    leaseTerm: number | null;
    startDate: string | null;
    endDate: string | null;
    rentDifferential: number | null;
    propertyType: string | null;
    leaseType: string | null;
  };
}

/**
 * Normalizes an address string:
 * - Converts to lowercase.
 * - Replaces common abbreviations with full words.
 * - Removes punctuation.
 * - Trims extra spaces.
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\be\.?\b/g, 'east')
    .replace(/\bw\.?\b/g, 'west')
    .replace(/\bn\.?\b/g, 'north')
    .replace(/\bs\.?\b/g, 'south')
    .replace(/\bave\.?\b/g, 'avenue')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes generic strings by lowercasing and trimming extra spaces.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Compares extracted info from Gemini with the provided property details.
 * Uses improved address normalization.
 */
function compareExtractedInfo(extracted: ExtractedInfo, propertyDetails: any) {
  const matches = {
    address: false,
    city: false,
    state: false,
    zip: false,
    price: false,
    leaseInfo: false,
  };

  if (extracted.address && propertyDetails.address) {
    const normExtractedAddress = normalizeAddress(extracted.address);
    const normPropertyAddress = normalizeAddress(propertyDetails.address);
    // Check if one address string is included in the other.
    matches.address =
      normExtractedAddress.includes(normPropertyAddress) ||
      normPropertyAddress.includes(normExtractedAddress);
  }

  if (extracted.city && propertyDetails.city) {
    matches.city = normalize(extracted.city) === normalize(propertyDetails.city);
  }

  if (extracted.state && propertyDetails.state) {
    // Allow exact match or if the extracted state is an abbreviation matching the start of the provided state.
    matches.state =
      normalize(extracted.state) === normalize(propertyDetails.state) ||
      (normalize(extracted.state).length === 2 &&
        normalize(propertyDetails.state).startsWith(normalize(extracted.state)));
  }

  if (extracted.zip && propertyDetails.zip_code) {
    matches.zip = extracted.zip === propertyDetails.zip_code;
  }

  if (extracted.originalRent && propertyDetails.price) {
    const extractedRent = parseFloat(String(extracted.originalRent));
    const propPrice = parseFloat(propertyDetails.price);
    const priceDiff = Math.abs(extractedRent - propPrice);
    // Allow a $100 margin of error.
    matches.price = priceDiff < 100;
  }

  // Consider lease info valid if leaseTerm exists or both start and end dates are present.
  matches.leaseInfo = !!(extracted.leaseTerm || (extracted.startDate && extracted.endDate));

  return matches;
}

/**
 * Dummy Gemini endpoint that uses a generative model to parse the extracted text.
 * For demonstration, it performs some dummy processing and returns refined data.
 */
router.post('/refine', async (req, res) => {
  console.log('[Gemini] Received request:', {
    textLength: req.body.ocrText?.length,
    propertyDetails: req.body.propertyDetails,
  });

  // Check Authorization header
  const authHeader = req.get('Authorization') || '';
  const expectedToken = `Bearer ${process.env.GEMINI_API_KEY || 'GEMINI_API_KEY_123'}`;
  if (authHeader !== expectedToken) {
    console.error('[Gemini] Unauthorized request.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { ocrText, propertyDetails } = req.body;
  if (!ocrText || !propertyDetails) {
    console.error('[Gemini] Missing required fields.');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // For demonstration, we simulate calling a generative model.
    // In your real implementation, you would use genAI.getGenerativeModel(...).generateContent(prompt).
    console.log('[Gemini] Sending text to Gemini for analysis...');
    // Dummy extraction logic:
    const extractedInfo: ExtractedInfo = {
      address: '500 E. College Avenue #707', // example extracted address
      city: 'State College',
      state: 'PA',
      zip: '16801',
      originalRent: 1420,
      leaseTerm: 12,
      startDate: '8/1/2024',
      endDate: '8/5/2025',
      leaseType: 'residential',
      propertyType: 'apartment', // Changed from null to string
    };

    console.log('[Gemini] Successfully parsed extracted information:', extractedInfo);

    // Compare the extracted info with provided property details.
    const refinedMatches = compareExtractedInfo(extractedInfo, propertyDetails);
    console.log('[Gemini] Refined matches:', refinedMatches);

    // Calculate refined score based on weights.
    const weights = {
      address: 0.25,
      zip: 0.20,
      city: 0.15,
      state: 0.15,
      price: 0.15,
      leaseInfo: 0.10,
    };
    const refinedScore = Object.entries(refinedMatches).reduce((score, [key, value]) => {
      return score + (value ? (weights[key as keyof typeof weights] * 100) : 0);
    }, 0);

    // Calculate rent differential if possible.
    let rentDifferential: number | null = null;
    if (extractedInfo.originalRent && propertyDetails.price) {
      rentDifferential =
        ((parseFloat(propertyDetails.price) - extractedInfo.originalRent) / extractedInfo.originalRent) *
        100;
      // Clamp within numeric(5,2) range.
      rentDifferential = Math.max(Math.min(rentDifferential, 999.99), -999.99);
    }

    const responseObj: RefinedResponse = {
      refinedScore,
      refinedMatches,
      leaseInfo: {
        originalRent: extractedInfo.originalRent || null,
        leaseTerm: extractedInfo.leaseTerm || null,
        startDate: extractedInfo.startDate || null,
        endDate: extractedInfo.endDate || null,
        rentDifferential,
        propertyType: extractedInfo.propertyType || null,
        leaseType: extractedInfo.leaseType || null,
      },
    };

    console.log('[Gemini] Sending response:', responseObj);
    return res.json(responseObj);
  } catch (error) {
    console.error('[Gemini] Error processing request:', error);
    return res.status(500).json({ error: 'Error processing document' });
  }
});

/**
 * Dual document verification endpoint - compares lease and utility bill
 */
router.post('/refine-dual', async (req, res) => {
  console.log('[Gemini-Dual] Received dual verification request');
  console.log('[Gemini-Dual] Request body keys:', Object.keys(req.body));
  console.log('[Gemini-Dual] Has leaseText:', !!req.body.leaseText, 'length:', req.body.leaseText?.length);
  console.log('[Gemini-Dual] Has utilityBillText:', !!req.body.utilityBillText, 'length:', req.body.utilityBillText?.length);
  console.log('[Gemini-Dual] Has propertyDetails:', !!req.body.propertyDetails);

  // Check Authorization
  const authHeader = req.get('Authorization') || '';
  const expectedToken = `Bearer ${process.env.GEMINI_API_KEY || 'GEMINI_API_KEY_123'}`;
  if (authHeader !== expectedToken) {
    console.error('[Gemini-Dual] Unauthorized request.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { leaseText, utilityBillText, propertyDetails } = req.body;
  if (!leaseText || !utilityBillText || !propertyDetails) {
    console.error('[Gemini-Dual] Missing required fields.');
    console.error('[Gemini-Dual] Full request body:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({ error: 'Missing required fields (leaseText, utilityBillText, propertyDetails)' });
  }

  try {
    console.log('[Gemini-Dual] Analyzing both documents with Gemini AI...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `You are a document verification AI. You have two documents: a rental lease and a utility bill.

LEASE DOCUMENT TEXT:
${leaseText}

UTILITY BILL TEXT:
${utilityBillText}

PROPERTY DETAILS PROVIDED:
Address: ${propertyDetails.address} ${propertyDetails.unit || ''}
City: ${propertyDetails.city}
State: ${propertyDetails.state}
ZIP: ${propertyDetails.zip_code}
Listed Price: $${propertyDetails.price}

TASK: Extract information from both documents and verify they match each other AND the property details.

Extract from LEASE:
- Tenant name
- Property address (full address)
- Lease start date
- Lease end date
- Monthly rent amount
- Lease term (in months)

Extract from UTILITY BILL:
- Account holder name
- Service address (full address)
- Bill date
- Bill month/period

CROSS-VERIFICATION:
1. Does the name on the lease match the name on the utility bill?
2. Does the address on the lease match the address on the utility bill?
3. Does the address match the provided property address?
4. Is the utility bill recent (within last 60 days)?

Return ONLY a JSON object in this exact format:
{
  "leaseVerified": boolean,
  "utilityBillVerified": boolean,
  "refinedScore": number (0-100),
  "refinedMatches": {
    "address": boolean,
    "city": boolean,
    "state": boolean,
    "zip": boolean,
    "price": boolean,
    "leaseInfo": boolean
  },
  "matchDetails": {
    "nameMatch": boolean,
    "addressMatch": boolean,
    "dateMatch": boolean (utility bill within 60 days),
    "extractedLease": {
      "name": string,
      "address": string,
      "startDate": string,
      "endDate": string
    },
    "extractedUtilityBill": {
      "name": string,
      "address": string,
      "billDate": string
    }
  },
  "leaseInfo": {
    "originalRent": number,
    "leaseTerm": number,
    "startDate": string,
    "endDate": string,
    "rentDifferential": number,
    "propertyType": string,
    "leaseType": string
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('[Gemini-Dual] Raw Gemini response:', text.substring(0, 500));
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }
    
    const parsedResult = JSON.parse(jsonMatch[0]);
    console.log('[Gemini-Dual] Parsed result:', parsedResult);
    
    return res.json(parsedResult);
    
  } catch (error: any) {
    console.error('[Gemini-Dual] Error processing dual verification:', error);
    return res.status(500).json({ 
      error: 'Error processing dual document verification',
      details: error.message 
    });
  }
});

export default router;
