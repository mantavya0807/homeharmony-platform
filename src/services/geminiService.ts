// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

interface SearchCriteria {
  bedrooms?: number | null;
  bathrooms?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  propertyType?: string | null;
  location?: {
    city?: string;
    state?: string;
  } | null;
  squareFeet?: number | null;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('Gemini API key is not configured in environment variables');
}

// Initialize Gemini with the API key from .env
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function analyzeSearchQuery(query: string): Promise<SearchCriteria> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analyze this property search query and extract search criteria. Handle misspellings and variations.
    Query: "${query}"
    
    Return only a JSON object with these fields (use null if not specified):
    {
      "bedrooms": number or null,
      "bathrooms": number or null,
      "minPrice": number or null,
      "maxPrice": number or null,
      "propertyType": "house" | "apartment" | "condo" | "townhouse" or null,
      "location": { "city": string, "state": string } or null,
      "squareFeet": number or null
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    // Clean and validate the response
    return {
      bedrooms: parsedResult.bedrooms || null,
      bathrooms: parsedResult.bathrooms || null,
      minPrice: parsedResult.minPrice || null,
      maxPrice: parsedResult.maxPrice || null,
      propertyType: parsedResult.propertyType || null,
      location: parsedResult.location || null,
      squareFeet: parsedResult.squareFeet || null
    };
  } catch (error) {
    console.error('Error analyzing query:', error);
    throw error;
  }
}

export function filterProperties(properties: any[], criteria: SearchCriteria) {
  return properties.filter(property => {
    // Check bedrooms
    if (criteria.bedrooms && property.bedrooms < criteria.bedrooms) {
      return false;
    }

    // Check bathrooms
    if (criteria.bathrooms && property.bathrooms < criteria.bathrooms) {
      return false;
    }

    // Check price range
    if (criteria.minPrice && property.price < criteria.minPrice) {
      return false;
    }
    if (criteria.maxPrice && property.price > criteria.maxPrice) {
      return false;
    }

    // Check property type
    if (criteria.propertyType &&
        property.property_type.toLowerCase() !== criteria.propertyType.toLowerCase()) {
      return false;
    }

    // Check location
    if (criteria.location) {
      if (criteria.location.city && 
          !property.city.toLowerCase().includes(criteria.location.city.toLowerCase())) {
        return false;
      }
      if (criteria.location.state &&
          !property.state.toLowerCase().includes(criteria.location.state.toLowerCase())) {
        return false;
      }
    }

    // Check square feet
    if (criteria.squareFeet && property.square_feet < criteria.squareFeet) {
      return false;
    }

    return true;
  });
}