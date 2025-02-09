import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PropertyList } from "@/components/PropertyList";
import { PropertyFilters } from "@/components/PropertyFilter";
import { PopularProperties } from "@/components/PopularProperties";
import { LocationRequestDialog } from "@/components/LocationRequestDialog";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import MapAndListView from "@/components/PropertyMapView";
import { Card } from "@/components/ui/card";
import { LocationSearchBar } from "@/components/LocationSearchBar";

// –––––––– PROPERTY INTERFACE ––––––––––
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
  property_type: "house" | "apartment" | "condo" | "townhouse";
  unit?: string;
  saved_properties?: { id: string }[];
  isSaved?: boolean;
  click_count?: number;
}

// Default center: State College, PA
const DEFAULT_CENTER = { lat: 40.7934, lng: -77.86 };

// –––––––– HELPER: HAVERSINE DISTANCE ––––––––––
function haversineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Geolocation dialog and device location (used if user hasn’t done a manual search)
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const { latitude, longitude } = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // View mode: list vs. map
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Manual location search/filtering state
  const [searchLocation, setSearchLocation] = useState("");
  const [manualLocationSet, setManualLocationSet] = useState(false);
  // Radius filtering
  const [radiusFilteringEnabled, setRadiusFilteringEnabled] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(10);

  // Additional property filters (beds, baths, square feet, price)
  const [filters, setFilters] = useState({
    beds: "any",
    baths: "any",
    minSquareFeet: "",
    maxSquareFeet: "",
    priceRange: [0, 2000000],
  });

  // Values returned from geocoding the manual search.
  const [geocodedCity, setGeocodedCity] = useState("");
  const [geocodedState, setGeocodedState] = useState("");
  const [geocodedZip, setGeocodedZip] = useState("");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);

  // On initial load, show location permission dialog if not asked before
  useEffect(() => {
    const locationPermissionAsked = localStorage.getItem("locationPermissionAsked");
    if (!locationPermissionAsked) {
      setShowLocationDialog(true);
    }
  }, []);

  // If no manual search is done, use the device’s location
  useEffect(() => {
    if (latitude && longitude && window.google?.maps && !manualLocationSet) {
      const latlng = { lat: latitude, lng: longitude };
      setUserLocation(latlng);
      setMapCenter(latlng);
    }
  }, [latitude, longitude, manualLocationSet]);

  // Fetch properties from Supabase
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select(`*, saved_properties (id), property_clicks (id)`)
        .eq("status", "available");

      if (propertiesError) throw propertiesError;

      // Convert lat/lng to numbers & track isSaved, click_count
      const transformed = (propertiesData || []).map((p: any) => ({
        ...p,
        lat: p.lat ? Number(p.lat) : undefined,
        lng: p.lng ? Number(p.lng) : undefined,
        isSaved: p.saved_properties?.length > 0,
        click_count: p.property_clicks?.length || 0,
      }));

      setProperties(transformed);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Geocode the location from the search bar
  const geocodeLocation = (locationStr: string) => {
    if (!window.google?.maps) {
      // If Google not loaded, just store the string so we can do partial matches
      setGeocodedCity(locationStr);
      setGeocodedState("");
      setGeocodedZip("");
      setMapCenter(DEFAULT_CENTER);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: locationStr }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const newCenter = results[0].geometry.location.toJSON();
        setMapCenter(newCenter);

        let foundCity = "";
        let foundState = "";
        let foundZip = "";
        for (const comp of results[0].address_components) {
          if (comp.types.includes("locality")) {
            foundCity = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_1")) {
            foundState = comp.short_name; // e.g. "PA"
          }
          if (comp.types.includes("postal_code")) {
            foundZip = comp.long_name;
          }
        }
        // Fallback: if no locality is found, try to use the state or raw search
        if (!foundCity && foundState) {
          foundCity = foundState;
        } else if (!foundCity && !foundState && !foundZip) {
          // if everything empty, just set city to the raw string
          foundCity = locationStr;
        }

        setGeocodedCity(foundCity);
        setGeocodedState(foundState);
        setGeocodedZip(foundZip);
      } else {
        // If geocoding fails, just use the raw string for a partial match
        setGeocodedCity(locationStr);
        setGeocodedState("");
        setGeocodedZip("");
        setMapCenter(DEFAULT_CENTER);
      }
    });
  };

  // When user submits a search in LocationSearchBar
  const handleSearchLocation = (location: string) => {
    setSearchLocation(location);
    geocodeLocation(location);
    setManualLocationSet(true);
  };

  // Filter in memory based on location or radius, plus the other property filters
  const applyLocalFilters = (props: Property[]): Property[] => {
    let filtered = props;

    // If user manually searched something
    if (manualLocationSet && searchLocation.trim() !== "") {
      if (radiusFilteringEnabled) {
        // If we have lat/lng for property, compare to our mapCenter
        filtered = filtered.filter((property) => {
          if (property.lat && property.lng) {
            const distance = haversineDistance(mapCenter, {
              lat: property.lat,
              lng: property.lng,
            });
            return distance <= radiusMiles;
          }
          return false;
        });
      } else {
        // Non-radius: partial match on city/state/zip
        const searchStr = (geocodedCity || geocodedState || geocodedZip || "").toLowerCase();
        if (searchStr) {
          filtered = filtered.filter((property) => {
            const propCity = property.city?.toLowerCase() || "";
            const propState = property.state?.toLowerCase() || "";
            const propZip = property.zip_code?.toLowerCase() || "";
            // True if *any* of these contain our geocoded city/state/zip
            return (
              propCity.includes(searchStr) ||
              propState.includes(searchStr) ||
              propZip.includes(searchStr)
            );
          });
        }
      }
    }

    // Apply beds/baths/price/sqft filters
    filtered = filtered.filter((property) => {
      if (filters.beds !== "any" && property.bedrooms < Number(filters.beds)) return false;
      if (filters.baths !== "any" && property.bathrooms < Number(filters.baths)) return false;

      const sf = property.square_feet || 0;
      const minSf = Number(filters.minSquareFeet) || 0;
      const maxSf = Number(filters.maxSquareFeet) || Infinity;
      if (sf < minSf || sf > maxSf) return false;

      const [minPrice, maxPrice] = filters.priceRange;
      if (property.price < minPrice || property.price > maxPrice) return false;

      return true;
    });

    return filtered;
  };

  const filteredProperties = applyLocalFilters(properties);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800">Property Dashboard</h1>
        </div>
      </header>

      {/* Search & Filter Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchLocation(searchLocation);
            }}
            className="space-y-4"
          >
            <LocationSearchBar onSearch={handleSearchLocation} initialValue={searchLocation} />

            <PropertyFilters onFiltersChange={setFilters} currentFilters={filters} />

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={radiusFilteringEnabled}
                  onChange={(e) => setRadiusFilteringEnabled(e.target.checked)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Filter by radius</span>
              </label>
              {radiusFilteringEnabled && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 text-sm">Radius: {radiusMiles} miles</span>
                  <input
                    id="radius"
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={radiusMiles}
                    onChange={(e) => setRadiusMiles(Number(e.target.value))}
                    className="w-48 accent-blue-600"
                  />
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

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
                userLocation={manualLocationSet ? null : userLocation}
              />
            </div>
          </>
        ) : (
          <Card className="h-[600px] overflow-hidden">
            <MapAndListView properties={filteredProperties} center={mapCenter} />
          </Card>
        )}
      </main>

      <LocationRequestDialog open={showLocationDialog} onOpenChange={setShowLocationDialog} />
    </div>
  );
}
