// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyList } from "@/components/PropertyList";
import { PopularProperties } from "@/components/PopularProperties";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LayoutGrid, Map as MapIcon, Bot, Loader2 } from "lucide-react";
import MapAndListView from "@/components/PropertyMapView";
import { useToast } from "@/components/ui/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variables
const GEMINI_API_KEY = "AIzaSyCEC-hIBfbVTGWS0SdrkXrKU20ZqY-srIo"

if (!GEMINI_API_KEY) {
  throw new Error('Gemini API key is not configured in environment variables');
}

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Default center: State College, PA
const DEFAULT_CENTER = { lat: 40.7934, lng: -77.86 };

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images: string[];
  property_type: string;
  saved_properties?: { id: string }[];
  isSaved?: boolean;
  click_count?: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*, saved_properties (id), property_clicks (id)")
        .eq("status", "available");

      if (error) throw error;

      const transformed = data.map((p: any) => ({
        ...p,
        isSaved: p.saved_properties?.length > 0,
        click_count: p.property_clicks?.length || 0,
      }));

      setProperties(transformed);
      setFilteredProperties(transformed);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    setSearchLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Search query: "${searchQuery}"
      From this query, extract exact requirements for property search.
      Consider variations and typos in words.
      
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
      const response = result.response.text();
      
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const criteria = JSON.parse(jsonMatch[0]);
      console.log("Parsed search criteria:", criteria);

      // Start with all properties
      let filtered = [...properties];

      // Apply filters based on criteria
      filtered = filtered.filter(property => {
        // Bedrooms filter
        if (criteria.bedrooms && property.bedrooms < criteria.bedrooms) {
          return false;
        }

        // Bathrooms filter
        if (criteria.bathrooms && property.bathrooms < criteria.bathrooms) {
          return false;
        }

        // Price range filter
        if (criteria.minPrice && property.price < criteria.minPrice) {
          return false;
        }
        if (criteria.maxPrice && property.price > criteria.maxPrice) {
          return false;
        }

        // Property type filter
        if (criteria.propertyType && 
            property.property_type.toLowerCase() !== criteria.propertyType.toLowerCase()) {
          return false;
        }

        // Location filter
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

        // Square footage filter
        if (criteria.squareFeet && property.square_feet < criteria.squareFeet) {
          return false;
        }

        return true;
      });

      setFilteredProperties(filtered);

      toast({
        title: "Search Complete",
        description: `Found ${filtered.length} matching properties`,
      });

    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to process your search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setFilteredProperties(properties);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with AI Search */}
      <header className="bg-white shadow py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Property Dashboard</h1>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Try: 'I need a 2 bedroom apartment in State College under $1500'"
                className="pl-10"
                disabled={searchLoading}
              />
              <Bot className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button type="submit" disabled={searchLoading}>
              {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
            {filteredProperties.length !== properties.length && (
              <Button type="button" variant="outline" onClick={resetSearch}>
                Reset
              </Button>
            )}
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Available Properties</h2>
          <div className="flex space-x-3">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4 mr-1" />
              Map
            </Button>
          </div>
        </div>

        {viewMode === "list" ? (
          <>
            <PopularProperties properties={filteredProperties} />
            <div className="bg-white shadow rounded-lg p-4">
              <PropertyList
                loading={loading}
                properties={filteredProperties}
                userLocation={null}
              />
            </div>
          </>
        ) : (
          <Card className="h-[600px] overflow-hidden">
            <MapAndListView 
              properties={filteredProperties} 
              center={DEFAULT_CENTER} 
            />
          </Card>
        )}
      </main>
    </div>
  );
}