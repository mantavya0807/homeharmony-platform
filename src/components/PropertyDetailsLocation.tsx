import { useEffect, useState } from "react";
import { Loader2, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams } from "react-router-dom";

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
    // Optionally add walk score fields here if stored in your DB
  };
}

// Your Google Maps API key (for geocoding and maps)
const GOOGLE_MAPS_API_KEY = "AIzaSyBTa9vnh7E-1xmwPvdOoaNMzrzRGh7ud0I";
// Replace with your Walk Score API key
const WALK_SCORE_API_KEY = "9624893c394567ecd35e96f8d8a0660d";

function GoogleMap({ address, zoom = 15 }: { address: string; zoom?: number }) {
  return (
    <div className="relative h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
      <iframe
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
          address
        )}&zoom=${zoom}`}
        allowFullScreen
      />
    </div>
  );
}

// This component embeds the Walk Score widget for transit & commute.
function TransitCommuteView({
  fullAddress,
  lat,
  lng,
}: {
  fullAddress: string;
  lat: number;
  lng: number;
}) {
  // Construct the Walk Score widget URL.
  const widgetUrl = `https://www.walkscore.com/score/?format=inline&address=${encodeURIComponent(
    fullAddress
  )}&lat=${lat}&lon=${lng}&wsid=${WALK_SCORE_API_KEY}`;
  return (
    <div className="w-full">
      <iframe
        src={widgetUrl}
        width="100%"
        height="600"
        frameBorder="0"
        title="Walk Score Widget"
      ></iframe>
    </div>
  );
}

// This component shows additional neighborhood details (with a link to learn more).
function NearbyPlacesWidget({ walkScoreData }: { walkScoreData: any }) {
  if (!walkScoreData) {
    return <Loader2 className="animate-spin h-8 w-8" />;
  }
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">Neighborhood Details</p>
      <p className="text-sm text-muted-foreground">
        {walkScoreData.description ||
          "No neighborhood description available."}
      </p>
      {walkScoreData.ws_link && (
        <a
          href={walkScoreData.ws_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Know More on Walk Score
        </a>
      )}
    </div>
  );
}

export default function PropertyDetailsLocation() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For geocoding and Walk Score
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [walkScoreData, setWalkScoreData] = useState<any>(null);

  // Fetch property data
  useEffect(() => {
    async function fetchProperty() {
      if (!propertyId) {
        setError("No property ID provided.");
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
          .eq("id", propertyId)
          .single();

        if (error) throw error;
        setProperty(data);
      } catch (err: any) {
        console.error("Error fetching property:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [propertyId]);

  // Compute full address once property is loaded
  const fullAddress = property
    ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`
    : "";

  // Geocode the address to get latitude and longitude
  useEffect(() => {
    if (!fullAddress) return;
    async function geocode() {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            fullAddress
          )}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setLat(location.lat);
          setLng(location.lng);
        }
      } catch (err) {
        console.error("Error geocoding address:", err);
      }
    }
    geocode();
  }, [fullAddress]);

  // Fetch Walk Score data once lat/lng are available
  useEffect(() => {
    if (lat && lng && fullAddress) {
      async function fetchWalkScore() {
        try {
          const wsUrl = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(
            fullAddress
          )}&lat=${lat}&lon=${lng}&wsapikey=${WALK_SCORE_API_KEY}`;
          const response = await fetch(wsUrl);
          const data = await response.json();
          setWalkScoreData(data);
        } catch (err) {
          console.error("Error fetching Walk Score:", err);
        }
      }
      fetchWalkScore();
    }
  }, [lat, lng, fullAddress]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          {error || "Could not load property location"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Property Header */}
      <div className="container mx-auto px-4 py-8">
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
      </div>

      {/* Tabs Section */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="map" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 gap-1">
                <TabsTrigger
                  value="map"
                  className="data-[state=active]:bg-background"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="commute"
                  className="data-[state=active]:bg-background"
                >
                  Transit &amp; Commute
                </TabsTrigger>
                <TabsTrigger
                  value="nearby"
                  className="data-[state=active]:bg-background"
                >
                  Nearby Places
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="map" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <GoogleMap address={fullAddress} />
                  </div>
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          Location Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Property Type</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {property.property_type}
                            </p>
                          </div>
                        </div>
                        {property.housing_complex && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Housing Complex</p>
                              <p className="text-sm text-muted-foreground">
                                {property.housing_complex.name}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="pt-4">
                          <p className="font-medium mb-2">Quick Facts</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-sm text-muted-foreground">
                                Walk Score:{" "}
                                {walkScoreData && walkScoreData.walkscore
                                  ? walkScoreData.walkscore
                                  : "Loading..."}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-sm text-muted-foreground">
                                Transit Score:{" "}
                                {walkScoreData && walkScoreData.transit
                                  ? walkScoreData.transit.score
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Transit & Commute Tab */}
              <TabsContent value="commute" className="space-y-6">
                {lat && lng ? (
                  <TransitCommuteView fullAddress={fullAddress} lat={lat} lng={lng} />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin h-8 w-8" />
                  </div>
                )}
              </TabsContent>

              {/* Nearby Places Tab */}
              <TabsContent value="nearby" className="space-y-6">
                <NearbyPlacesWidget walkScoreData={walkScoreData} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
