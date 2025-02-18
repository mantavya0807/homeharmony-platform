import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyList } from "@/components/PropertyList";
import { PopularProperties } from "@/components/PopularProperties";
import { PropertyFilters } from "@/components/PropertyFilter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LayoutGrid,
  Map as MapIcon,
  Loader2,
  Search as SearchIcon,
  Sparkles,
  Filter as FilterIcon,
} from "lucide-react";
import MapAndListView from "@/components/PropertyMapView";
import { useToast } from "@/components/ui/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const GEMINI_API_KEY = "AIzaSyCEC-hIBfbVTGWS0SdrkXrKU20ZqY-srIo";
const DEFAULT_CENTER = { lat: 40.7934, lng: -77.86 };

// Sanity check for your Google Generative AI key (replace with your environment variable in production)
if (!GEMINI_API_KEY) {
  throw new Error("Gemini API key is not configured in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
  const { theme } = useTheme();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // For the radial glow effect on the search header
  const searchRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // For the filters modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    // Mouse tracking for radial glow
    const handleMouseMove = (e: MouseEvent) => {
      if (searchRef.current) {
        const rect = searchRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getGlowStyles = () => {
    const lightGlow = `
      radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px,
        rgba(30, 64, 175, 0.1),
        rgba(59, 130, 246, 0.05),
        transparent
      )
    `;
    const darkGlow = `
      radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px,
        rgba(66, 153, 225, 0.1),
        transparent
      )
    `;
    return {
      background: theme === "dark" ? darkGlow : lightGlow,
      opacity: isHovered ? 1 : 0.7,
    };
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*, saved_properties (id), property_clicks (id)")
        .eq("status", "available");

      if (error) throw error;

      const transformed = (data || []).map((p: any) => ({
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
      const prompt = `
Search query: "${searchQuery}"
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
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("Invalid response format from AI model");
      }

      // Convert the matched substring to a JSON object
      const criteria = JSON.parse(jsonMatch[0]);
      const filtered = [...properties].filter((property) => {
        if (criteria.bedrooms && property.bedrooms < criteria.bedrooms) return false;
        if (criteria.bathrooms && property.bathrooms < criteria.bathrooms) return false;
        if (criteria.minPrice && property.price < criteria.minPrice) return false;
        if (criteria.maxPrice && property.price > criteria.maxPrice) return false;
        if (
          criteria.propertyType &&
          property.property_type.toLowerCase() !== criteria.propertyType.toLowerCase()
        )
          return false;
        if (criteria.location) {
          if (
            criteria.location.city &&
            !property.city.toLowerCase().includes(criteria.location.city.toLowerCase())
          )
            return false;
          if (
            criteria.location.state &&
            !property.state.toLowerCase().includes(criteria.location.state.toLowerCase())
          )
            return false;
        }
        if (criteria.squareFeet && property.square_feet < criteria.squareFeet) return false;
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-background dark:to-background">
      {/* NAV/HEADER with additional top padding and "hero-like" styling */}
      <header className="relative overflow-hidden bg-white/50 dark:bg-transparent backdrop-blur-sm border-b">
        <div
          ref={searchRef}
          className="container mx-auto px-4 py-16 flex flex-col items-center" /* Increased top padding */
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full max-w-3xl">
            {/* Radial glow effect overlay */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={getGlowStyles()}
            />

            {/* Title */}
            <motion.h1
              className="text-3xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent drop-shadow-sm mb-6 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Property Dashboard
            </motion.h1>

            {/* AI Search Form + Filter Button on the same row */}
            <motion.form
              onSubmit={handleSearch}
              className="flex flex-wrap gap-2 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative flex-1 group">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Try: "I need a 2 bedroom apartment in State College under $1500"'
                  className="pl-10 bg-white/50 dark:bg-white/5 backdrop-blur-sm border-blue-900/20 dark:border-white/10 focus:border-blue-800 dark:focus:border-primary transition-colors animate-pulse"
                  disabled={searchLoading}
                />
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-900/40 dark:text-blue-400/40 transition-colors group-hover:text-blue-900 dark:group-hover:text-blue-400" />
              </div>

              <Button
                type="submit"
                disabled={searchLoading}
                className="bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20 transition-all"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SearchIcon className="h-4 w-4" />
                )}
              </Button>

              {filteredProperties.length !== properties.length && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSearch}
                  className="border-blue-900/20 dark:border-white/20 hover:border-blue-800 hover:bg-blue-50 dark:hover:border-primary dark:hover:bg-primary/10"
                >
                  Reset
                </Button>
              )}

              {/* Filters Button (now on the same line) */}
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 border-blue-900/20 dark:border-white/20 hover:border-blue-800 hover:bg-blue-50 dark:hover:border-primary dark:hover:bg-primary/10"
                  >
                    <FilterIcon className="h-5 w-5" />
                    Filters
                  </Button>
                </DialogTrigger>
                {/* Full-page-ish modal for Property Filter */}
                <DialogContent className="max-w-full md:max-w-full h-[95vh] animate-fadeIn overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Property Filters</DialogTitle>
                  </DialogHeader>
                  {/* Keep functionality the same */}
                  <PropertyFilters onFiltersChange={() => {}} />
                </DialogContent>
              </Dialog>
            </motion.form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
            Available Properties
          </h2>

          <div className="flex space-x-3">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600"
                  : "border-blue-900/20 dark:border-white/20"
              }
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("map")}
              className={
                viewMode === "map"
                  ? "bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600"
                  : "border-blue-900/20 dark:border-white/20"
              }
            >
              <MapIcon className="h-4 w-4 mr-1" />
              Map
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <PopularProperties properties={filteredProperties} />
              <Card className="backdrop-blur-sm bg-white/50 dark:bg-card/50 border-blue-100 dark:border-white/10">
                <PropertyList
                  loading={loading}
                  properties={filteredProperties}
                  userLocation={null}
                />
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-[600px] overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-card/50 border-blue-100 dark:border-white/10">
                <MapAndListView properties={filteredProperties} center={DEFAULT_CENTER} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-100 to-transparent dark:from-primary/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
      </div>
    </div>
  );
}
