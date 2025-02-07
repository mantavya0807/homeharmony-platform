// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PropertyList } from "@/components/PropertyList";
import { PropertyFilters } from "@/components/PropertyFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PopularProperties } from "@/components/PopularProperties";
import { LocationRequestDialog } from "@/components/LocationRequestDialog";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, Map as MapIcon } from "lucide-react";
import PropertyMapView from "@/components/PropertyMapView";
import { Card } from "@/components/ui/card";
import { LocationSearchBar } from "@/components/LocationSearchBar";

interface Property {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_avatar_url?: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images: string[];
  lat?: number;
  lng?: number;
  property_type: "house" | "apartment" | "condo" | "townhouse";
  saved_properties?: { id: string }[];
  isSaved?: boolean;
  click_count?: number;
  sublease_from?: string;
  sublease_to?: string;
  is_verified?: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const { latitude, longitude } = useLocation();
  const [userLocation, setUserLocation] = useState<{ city: string; state: string } | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const [searchLocation, setSearchLocation] = useState("");
  const [filters, setFilters] = useState({
    beds: "any",
    baths: "any",
    minSquareFeet: "",
    maxSquareFeet: "",
    priceRange: [0, 2000000],
  });
  const [currentSearchLocation, setCurrentSearchLocation] = useState<{ city: string; state: string } | null>(null);

  useEffect(() => {
    const locationPermissionAsked = localStorage.getItem("locationPermissionAsked");
    if (!locationPermissionAsked) {
      setShowLocationDialog(true);
    }
  }, []);

  useEffect(() => {
    if (latitude && longitude && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: latitude, lng: longitude };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const addressComponents = results[0].address_components;
          const city = addressComponents.find((comp) => comp.types.includes("locality"))?.long_name;
          const state = addressComponents.find((comp) =>
            comp.types.includes("administrative_area_level_1")
          )?.short_name;

          if (city && state) {
            setUserLocation({ city, state });
            setSearchLocation(`${city}, ${state}`);
            setCurrentSearchLocation({ city, state });
          }
        }
      });
    }
  }, [latitude, longitude]);

  const fetchProperties = async (locationQuery?: string) => {
    try {
      setLoading(true);

      const { data: propertiesData, error } = await supabase
        .from("properties")
        .select(`
          *,
          seller:profiles(
            id,
            full_name,
            avatar_url
          ),
          saved_properties(id),
          property_clicks(id)
        `)
        .eq("status", "available");

      if (error) throw error;

      const transformed = (propertiesData || []).map((p: any) => {
        return {
          id: p.id,
          seller_id: p.seller?.id,
          seller_name: p.seller?.full_name,
          seller_avatar_url: p.seller?.avatar_url,
          title: p.title,
          price: p.price,
          address: p.address,
          city: p.city,
          state: p.state,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          square_feet: p.square_feet,
          images: p.images,
          is_verified: p.is_verified,
          sublease_from: p.sublease_from,
          sublease_to: p.sublease_to,
        } as Property;
      });

      let filteredProperties = transformed;
      if (locationQuery) {
        const [city, state] = locationQuery.split(",").map((s) => s.trim());
        if (city && state) {
          setCurrentSearchLocation({ city, state });
        }
      }

      setProperties(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      fetchProperties(`${userLocation.city}, ${userLocation.state}`);
    } else {
      fetchProperties();
    }
  }, [userLocation]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchProperties(searchLocation);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    fetchProperties(searchLocation);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <LocationSearchBar 
              onSearch={(location) => {
                setSearchLocation(location);
                fetchProperties(location);
              }}
              initialValue={searchLocation}
            />
            <PropertyFilters onFiltersChange={handleFiltersChange} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <PopularProperties 
          properties={properties}
          searchLocation={searchLocation}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Available Properties</h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Map
            </Button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="space-y-12">
            <PopularProperties properties={properties} searchLocation={currentSearchLocation} />

            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-semibold">All Available Properties</h2>
                {currentSearchLocation && (
                  <span className="text-muted-foreground">
                    in {currentSearchLocation.city}, {currentSearchLocation.state}
                  </span>
                )}
              </div>
              <PropertyList
                loading={loading}
                properties={properties}
                userLocation={currentSearchLocation || userLocation}
              />
            </div>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden h-[600px]">
            <PropertyMapView properties={properties} />
          </Card>
        )}

        <LocationRequestDialog
          open={showLocationDialog}
          onOpenChange={setShowLocationDialog}
        />
      </div>
    </div>
  );
}
