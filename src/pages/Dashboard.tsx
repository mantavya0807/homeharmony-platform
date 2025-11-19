import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyList } from "@/components/PropertyList";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PopularPropertyCard from "@/components/PopularPropertyCard";
import { PropertyFilters as PropertyFiltersComponent } from "@/components/PropertyFilter";
import PopularPropertiesScroll from "@/components/PopularPropertiesScroll";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("Gemini API key is not configured");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const DEFAULT_CENTER = { lat: 40.7934, lng: -77.86 };

interface Property {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  images: string[];
  is_verified?: boolean;
  verification_document_url?: string;
  status: string;
  unit?: string;
  saved_properties?: { id: string; user_id?: string }[];
  isSaved?: boolean;
  click_count?: number;
}

interface AICriteria {
  bedrooms: number | null;
  bathrooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  propertyType: "house" | "apartment" | "condo" | "townhouse" | null;
  location: { city: string; state: string } | null;
  squareFeet: number | null;
}

const defaultUIFilters = {
  searchText: "",
  propertyType: "any" as "any" | "house" | "apartment" | "condo" | "townhouse",
  beds: "any",
  baths: "any",
  minSquareFeet: "",
  maxSquareFeet: "",
  priceRange: [0, 10000] as [number, number],
  address: "",
  city: "",
  state: "",
  zipCode: "",
  radius: 5,
  isVerified: false,
};

export default function Dashboard() {
  const { toast } = useToast();
  const { theme } = useTheme();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiCriteria, setAICriteria] = useState<AICriteria | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [uiFilters, setUIFilters] = useState(defaultUIFilters);

  const searchRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [housingComplexes, setHousingComplexes] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchHousingComplexes = async () => {
      try {
        const { data, error } = await supabase
          .from("housing_complexes")
          .select("id, name")
          .order("name");
        if (error) throw error;
        setHousingComplexes(data || []);
      } catch (error) {
        console.error("Error fetching housing complexes:", error);
        toast({
          title: "Error",
          description: "Failed to load housing complexes",
          variant: "destructive",
        });
      }
    };
    fetchHousingComplexes();
  }, []);

  useEffect(() => {
    const filtered = properties.filter((property) => {
      if (aiCriteria) {
        if (aiCriteria.bedrooms && property.bedrooms < aiCriteria.bedrooms) {
          return false;
        }
        if (aiCriteria.bathrooms && property.bathrooms < aiCriteria.bathrooms) {
          return false;
        }
        if (aiCriteria.minPrice && property.price < aiCriteria.minPrice) {
          return false;
        }
        if (aiCriteria.maxPrice && property.price > aiCriteria.maxPrice) {
          return false;
        }
        if (
          aiCriteria.propertyType &&
          property.property_type.toLowerCase() !==
            aiCriteria.propertyType.toLowerCase()
        ) {
          return false;
        }
        if (aiCriteria.location) {
          if (
            aiCriteria.location.city &&
            !property.city
              .toLowerCase()
              .includes(aiCriteria.location.city.toLowerCase())
          ) {
            return false;
          }
          if (
            aiCriteria.location.state &&
            !property.state
              .toLowerCase()
              .includes(aiCriteria.location.state.toLowerCase())
          ) {
            return false;
          }
        }
        if (aiCriteria.squareFeet && property.square_feet < aiCriteria.squareFeet) {
          return false;
        }
      }

      if (uiFilters.searchText) {
        const searchLower = uiFilters.searchText.toLowerCase();
        const titleMatch = property.title.toLowerCase().includes(searchLower);
        const cityMatch = property.city.toLowerCase().includes(searchLower);
        const stateMatch = property.state.toLowerCase().includes(searchLower);
        const zipMatch =
          property.zip_code && property.zip_code.toLowerCase().includes(searchLower);
        if (!titleMatch && !cityMatch && !stateMatch && !zipMatch) {
          return false;
        }
      }
      if (
        uiFilters.propertyType !== "any" &&
        property.property_type.toLowerCase() !== uiFilters.propertyType.toLowerCase()
      ) {
        return false;
      }
      if (uiFilters.beds !== "any") {
        const bedsNum = parseInt(uiFilters.beds);
        if (property.bedrooms < bedsNum) {
          return false;
        }
      }
      if (uiFilters.baths !== "any") {
        const bathsNum = parseFloat(uiFilters.baths);
        if (property.bathrooms < bathsNum) {
          return false;
        }
      }
      if (uiFilters.minSquareFeet) {
        const minSqFt = Number(uiFilters.minSquareFeet);
        if (property.square_feet < minSqFt) {
          return false;
        }
      }
      if (uiFilters.maxSquareFeet) {
        const maxSqFt = Number(uiFilters.maxSquareFeet);
        if (property.square_feet > maxSqFt) {
          return false;
        }
      }
      if (
        property.price < uiFilters.priceRange[0] ||
        property.price > uiFilters.priceRange[1]
      ) {
        return false;
      }
      if (
        uiFilters.address &&
        !property.address.toLowerCase().includes(uiFilters.address.toLowerCase())
      ) {
        return false;
      }
      if (
        uiFilters.city &&
        !property.city.toLowerCase().includes(uiFilters.city.toLowerCase())
      ) {
        return false;
      }
      if (
        uiFilters.state &&
        !property.state.toLowerCase().includes(uiFilters.state.toLowerCase())
      ) {
        return false;
      }
      if (
        uiFilters.zipCode &&
        property.zip_code &&
        !property.zip_code.toLowerCase().includes(uiFilters.zipCode.toLowerCase())
      ) {
        return false;
      }
      if (uiFilters.radius && uiFilters.address) {
        const locText = uiFilters.address.toLowerCase();
        const addressHasText = property.address.toLowerCase().includes(locText);
        const cityHasText = property.city.toLowerCase().includes(locText);
        if (!addressHasText && !cityHasText) {
          return false;
        }
      }
      if (uiFilters.isVerified && !property.is_verified) {
        return false;
      }
      return true;
    });
    setFilteredProperties(filtered);
  }, [properties, aiCriteria, uiFilters]);

  useEffect(() => {
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

  // Single, merged fetchProperties function
  const fetchProperties = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch properties with saved status for current user
      // EXCLUDE sold properties explicitly
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          saved_properties!left(
            id,
            user_id
          ),
          property_clicks(id)
        `)
        .not("status", "eq", "sold");

      if (error) throw error;

      const transformed = (data || []).map((p: any) => ({
        ...p,
        isSaved:
          p.saved_properties?.some((sp: any) => sp.user_id === user?.id) || false,
        click_count: p.property_clicks?.length || 0,
      }));

      setProperties(transformed);
      setAICriteria(null);
      setUIFilters(defaultUIFilters);
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
      setAICriteria(null);
      return;
    }
    setSearchLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
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
}
      `;
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from AI model");
      }
      const criteria = JSON.parse(jsonMatch[0]);
      setAICriteria(criteria);
      toast({
        title: "Search Complete",
        description: "AI search criteria applied.",
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
    setAICriteria(null);
  };

  const handleSaveToggle = useCallback(async (propertyId: string) => {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save properties",
          variant: "destructive",
        });
        return;
      }

      const property = filteredProperties.find((p) => p.id === propertyId);
      const alreadySaved = property?.isSaved;

      if (alreadySaved) {
        // Delete saved property record
        const { error: deleteError } = await supabase
          .from("saved_properties")
          .delete()
          .match({
            property_id: propertyId,
            user_id: user.id,
          });

        if (deleteError) throw deleteError;
      } else {
        // Insert new saved property record
        const { error: insertError } = await supabase
          .from("saved_properties")
          .insert([
            {
              property_id: propertyId,
              user_id: user.id,
            },
          ]);

        if (insertError) throw insertError;
      }

      // Update local state after successful save/unsave
      setProperties((prevProperties) =>
        prevProperties.map((p) =>
          p.id === propertyId ? { ...p, isSaved: !alreadySaved } : p
        )
      );

      toast({
        title: alreadySaved ? "Property Unsaved" : "Property Saved",
        description: alreadySaved
          ? "Property removed from saved items"
          : "Property added to saved items",
      });
    } catch (err) {
      console.error("Error toggling property save:", err);
      toast({
        title: "Error",
        description: "Could not save property",
        variant: "destructive",
      });
    }
  }, [filteredProperties, toast]);

  const popularProperties = useMemo(() => {
    return [...filteredProperties]
      .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
      .slice(0, 5);
  }, [filteredProperties]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-background dark:to-background">
      <header className="relative overflow-hidden bg-white/50 dark:bg-transparent backdrop-blur-sm border-b">
        <div
          ref={searchRef}
          className="container mx-auto px-4 py-16 flex flex-col items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full max-w-3xl">
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={getGlowStyles()}
            />
            <motion.h1
              className="text-3xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent drop-shadow-sm mb-6 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Property Dashboard
            </motion.h1>
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
                  className="pl-10 bg-white/50 dark:bg-white/5 backdrop-blur-sm border-blue-900/20 dark:border-white/10 focus:border-blue-800 dark:focus:border-primary transition-colors"
                  disabled={searchLoading}
                />
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-900/40 dark:text-blue-400/40 transition-colors group-hover:text-blue-900 dark:group-hover:text-blue-400" />
              </div>
              <Button
                type="submit"
                disabled={searchLoading}
                className="bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SearchIcon className="h-4 w-4" />
                )}
              </Button>
              {(aiCriteria || searchQuery) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSearch}
                  className="border-blue-900/20 dark:border-white/20 hover:border-blue-800 dark:hover:border-primary dark:hover:bg-primary/10"
                >
                  Reset
                </Button>
              )}
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 border-blue-900/20 dark:border-white/20 hover:border-blue-800 dark:hover:border-primary dark:hover:bg-primary/10"
                  >
                    <FilterIcon className="h-5 w-5" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh] p-0 animate-fadeIn">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
                      Filter Properties
                    </DialogTitle>
                    <DialogDescription>
                      Customize your search with our advanced filters
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-6 pt-2 overflow-y-auto">
                    <PropertyFiltersComponent
                      housingComplexes={housingComplexes}
                      onFiltersChange={(newFilters) => {
                        setUIFilters({
                          searchText: newFilters.searchText,
                          propertyType: newFilters.propertyType,
                          beds: newFilters.bedrooms.toString(),
                          baths: newFilters.bathrooms.toString(),
                          minSquareFeet:
                            newFilters.squareFeet[0]?.toString() || "",
                          maxSquareFeet:
                            newFilters.squareFeet[1]?.toString() || "",
                          priceRange: newFilters.priceRange,
                          address: newFilters.location.address,
                          city: "",
                          state: "",
                          zipCode: "",
                          radius: newFilters.radius,
                          isVerified: newFilters.isVerified,
                        });
                        setIsFilterOpen(false);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </motion.form>
          </div>
        </div>
      </header>
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
              {popularProperties.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-xl font-semibold bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
                    Popular Properties
                  </h3>
                  <PopularPropertiesScroll
                    properties={popularProperties}
                    onSaveToggle={handleSaveToggle}
                  />
                </div>
              )}
              <Card className="backdrop-blur-sm bg-white/50 dark:bg-card/50 border-blue-100 dark:border-white/10">
                <div className="p-4">
                  <PropertyList
                    loading={loading}
                    properties={filteredProperties}
                    onSaveToggle={(propertyId: string) =>
                      handleSaveToggle(propertyId)
                    }
                  />
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-[calc(100vh-280px)]"
            >
              <MapAndListView
                properties={filteredProperties}
                center={DEFAULT_CENTER}
                onSaveToggle={handleSaveToggle}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
