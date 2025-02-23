import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import GoogleMap from "@/components/GoogleMap";
import LocationDetailsCard from "@/components/LocationDetailsCard";
import TransitView from "@/components/TransitView";
import NearbyView from "@/components/NearbyView";
import LoadingSpinner from "@/components/LoadingSpinner";
import { motion } from "framer-motion";

// Inline error display component (as used in PropertyOverview)
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-destructive text-lg">{message}</p>
    </div>
  );
}

// Component interfaces
interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  unit?: string;
  property_type: string;
  housing_complex_id: string | null;
  housing_complex?: {
    id: string;
    name: string;
  };
}

export interface WalkScoreData {
  status?: number;
  walkscore?: number;
  description?: string;
  updated?: string;
  logo_url?: string;
  more_info_icon?: string;
  more_info_link?: string;
  ws_link?: string;
  transit?: {
    score: number;
    description: string;
    summary: string;
  };
  bike?: {
    score: number;
    description: string;
  };
  scores?: {
    [category: string]: {
      score: number;
      description: string;
    };
  };
}

// Google Maps API key – secure as needed
const GOOGLE_MAPS_API_KEY = "AIzaSyBTa9vnh7E-1xmwPvdOoaNMzrzRGh7ud0I";
// Walk Score endpoint URL
const WALK_SCORE_API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api/walkscore/score"
    : "/api/walkscore/score";

export default function PropertyDetailsLocation() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [walkScoreData, setWalkScoreData] = useState<WalkScoreData | null>(null);
  const [walkScoreLoading, setWalkScoreLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("map");

  // 1) Fetch property from Supabase
  const fetchProperty = useCallback(async () => {
    if (!id) {
      setError("No property ID provided");
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id, title, address, city, state, zip_code, unit, property_type,
          housing_complex:housing_complex_id (id, name)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      console.log("Fetched property:", data);
      setProperty(data);
    } catch (err: any) {
      console.error("Error fetching property:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 2) Geocode the full address using Google Geocode API
  const geocodeAddress = useCallback(
    async (address: string) => {
      console.log("Geocoding address:", address);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
          )}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        console.log("Geocode response:", data);
        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setLat(location.lat);
          setLng(location.lng);
          console.log("Coordinates set:", location.lat, location.lng);
        } else {
          console.error("Geocoding error:", data.status);
          toast({
            title: "Error",
            description: "Failed to geocode address",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error geocoding address:", err);
        toast({
          title: "Error",
          description: "Failed to get location coordinates",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // 3) Fetch Walk Score from the backend
  const fetchWalkScore = useCallback(
    async (address: string, city: string, state: string, lat: number, lng: number) => {
      console.log("Fetching Walk Score for:", { address, city, state, lat, lng });
      setWalkScoreLoading(true);
      try {
        const url = `${WALK_SCORE_API_URL}?address=${encodeURIComponent(
          address
        )}&lat=${lat}&lon=${lng}&city=${encodeURIComponent(city)}&state=${state}`;
        const response = await fetch(url);
        console.log("Walk Score response status:", response.status);
        const text = await response.text();
        console.log("Walk Score raw response:", text);

        const data = JSON.parse(text);
        console.log("Parsed Walk Score data:", data);
        setWalkScoreData(data);
      } catch (err: any) {
        console.error("Error fetching Walk Score:", err.message);
        toast({
          title: "Warning",
          description: "Could not load Walk Score information",
          variant: "warning",
        });
      } finally {
        setWalkScoreLoading(false);
      }
    },
    [toast]
  );

  // On mount, fetch property
  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // Build full address once property is set
  const fullAddress = property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`
    : "";

  // Geocode once we have the address
  useEffect(() => {
    if (fullAddress.trim()) {
      geocodeAddress(fullAddress);
    }
  }, [fullAddress, geocodeAddress]);

  // Fetch Walk Score once we have coordinates
  useEffect(() => {
    if (lat !== null && lng !== null && property) {
      fetchWalkScore(fullAddress, property.city, property.state, lat, lng);
    }
  }, [lat, lng, fullAddress, property, fetchWalkScore]);

  if (loading) return <LoadingSpinner />;
  if (error || !property) return <ErrorDisplay message={error || "Property not found"} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Property Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
            {property.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <p className="text-lg">{fullAddress}</p>
          {property.unit && <Badge variant="secondary">Unit {property.unit}</Badge>}
        </div>
      </motion.div>

      {/* Sticky Navbar */}
      <div className="sticky top-16 z-50 bg-background/70 backdrop-blur-sm py-4 shadow">
        <div className="container mx-auto flex justify-center">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-3xl"
          >
            <TabsList className="flex justify-around">
              <TabsTrigger
                value="map"
                className="px-6 py-2 rounded-md transition-colors hover:bg-blue-100 focus:outline-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Map
              </TabsTrigger>
              <TabsTrigger
                value="commute"
                className="px-6 py-2 rounded-md transition-colors hover:bg-blue-100 focus:outline-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Transit &amp; Commute
              </TabsTrigger>
              <TabsTrigger
                value="nearby"
                className="px-6 py-2 rounded-md transition-colors hover:bg-blue-100 focus:outline-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Nearby Places
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8 pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsContent value="map" className="focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <GoogleMap address={fullAddress} className="w-full h-[500px] rounded-lg" />
                  </CardContent>
                </Card>
              </div>
              <div>
                <LocationDetailsCard property={property} walkScoreData={walkScoreData} />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="commute" className="focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {walkScoreLoading ? (
                <LoadingSpinner />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <TransitView
                      walkScoreData={walkScoreData}
                      propertyAddress={fullAddress}
                      lat={lat || 0}
                      lon={lng || 0}
                    />
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="nearby" className="focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {walkScoreLoading ? (
                <LoadingSpinner />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <NearbyView walkScoreData={walkScoreData} />
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
