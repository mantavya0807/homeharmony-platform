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

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images: string[];
  lat?: number;
  lng?: number;
  property_type: 'house' | 'apartment' | 'condo' | 'townhouse';
  saved_properties?: { id: string }[];
  isSaved?: boolean;
  click_count?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const { latitude, longitude } = useLocation();
  const [userLocation, setUserLocation] = useState<{ city: string; state: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Search/filter state
  const [searchLocation, setSearchLocation] = useState("");
  const [filters, setFilters] = useState({
    beds: 'any',
    baths: 'any',
    minSquareFeet: '',
    maxSquareFeet: '',
    priceRange: [0, 2000000],
  });

  // New state to track current search location
  const [currentSearchLocation, setCurrentSearchLocation] = useState<{ city: string; state: string } | null>(null);

  useEffect(() => {
    const locationPermissionAsked = localStorage.getItem('locationPermissionAsked');
    if (!locationPermissionAsked) {
      setShowLocationDialog(true);
    }
  }, []);

  // Geocode user location
  useEffect(() => {
    if (latitude && longitude && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: latitude, lng: longitude };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const addressComponents = results[0].address_components;
          const city = addressComponents.find((comp) =>
            comp.types.includes("locality")
          )?.long_name;
          const state = addressComponents.find((comp) =>
            comp.types.includes("administrative_area_level_1")
          )?.short_name;

          if (city && state) {
            setUserLocation({ city, state });
            setSearchLocation(`${city}, ${state}`);
            // Set initial search location
            setCurrentSearchLocation({ city, state });
          }
        }
      });
    }
  }, [latitude, longitude]);

  // Fetch properties with proper click tracking
// Update this fetchProperties function in your Dashboard component
const fetchProperties = async (locationQuery?: string) => {
  try {
    setLoading(true);

    // First, get all properties with click counts and saved status
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        *,
        saved_properties(id),
        property_clicks(id)
      `)
      .eq('status', 'available');

    if (propertiesError) throw propertiesError;

    // Transform the data to include proper click count
    const transformedProperties = (propertiesData || []).map(property => ({
      ...property,
      isSaved: property.saved_properties?.length > 0,
      // Count the actual number of clicks
      click_count: property.property_clicks?.length || 0,
      // Remove the raw property_clicks data from the object
      property_clicks: undefined
    }));

    // Parse location query and filter properties
    let filteredProperties = transformedProperties;
    if (locationQuery) {
      const [city, state] = locationQuery.split(',').map(s => s.trim());
      if (city && state) {
        setCurrentSearchLocation({ city, state });

        // Split properties into local and other
        const local = transformedProperties.filter(p => 
          p.city.toLowerCase() === city.toLowerCase() &&
          p.state.toLowerCase() === state.toLowerCase()
        );
        const other = transformedProperties.filter(p => 
          p.city.toLowerCase() !== city.toLowerCase() ||
          p.state.toLowerCase() !== state.toLowerCase()
        );

        // Combine with local properties first
        filteredProperties = [...local, ...other];
      }
    }

    setProperties(filteredProperties);
  } catch (error) {
    console.error('Error fetching properties:', error);
  } finally {
    setLoading(false);
  }
};

  // Sort properties by location helper function
  const sortPropertiesByLocation = (props: Property[], searchLoc: { city: string; state: string } | null) => {
    if (!searchLoc) return props;

    return [...props].sort((a, b) => {
      const aInSearchLocation = 
        a.city.toLowerCase() === searchLoc.city.toLowerCase() &&
        a.state.toLowerCase() === searchLoc.state.toLowerCase();
      const bInSearchLocation = 
        b.city.toLowerCase() === searchLoc.city.toLowerCase() &&
        b.state.toLowerCase() === searchLoc.state.toLowerCase();

      if (aInSearchLocation && !bInSearchLocation) return -1;
      if (!aInSearchLocation && bInSearchLocation) return 1;
      return 0;
    });
  };

  // Fetch properties when userLocation or search changes
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
      {/* Search Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="location" className="sr-only">
                  Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter location (city, state)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <PropertyFilters onFiltersChange={handleFiltersChange} />
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* View Toggle */}
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

        {viewMode === 'list' ? (
          <div className="space-y-12">
            <PopularProperties 
              properties={properties}
              searchLocation={currentSearchLocation}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-semibold">
                  All Available Properties
                </h2>
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