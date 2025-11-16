import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, Building, Loader2, AlertCircle } from "lucide-react";
import LocationDetailsCard from "@/components/LocationDetailsCard";
import NearbyView from "@/components/NearbyView";
import TransitView from "@/components/TransitView";
import InteractiveMapWithPlaces from "@/components/InteractiveMapWithPlaces";
import { useToast } from "@/components/ui/use-toast";

export interface WalkScoreData {
  walkscore?: number;
  walk_description?: string;
  transit?: {
    score: number;
    description: string;
    summary: string;
  };
  bike?: {
    score: number | null;
    description: string;
  };
  scores?: {
    [key: string]: {
      score: number;
      description: string;
      places?: string[];
    };
  };
  ws_link?: string;
  logo_url?: string;
  more_info_link?: string;
  snapped_lat?: number;
  snapped_lon?: number;
}

export default function PropertyDetailsLocation() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [walkScoreData, setWalkScoreData] = useState<WalkScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("nearby");
  const [allNearbyPlaces, setAllNearbyPlaces] = useState<any[]>([]);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select(`
            *,
            housing_complex:housing_complex_id (
              id,
              name,
              address
            )
          `)
          .eq("id", id)
          .single();
        
        if (propertyError) throw propertyError;
        if (!propertyData) throw new Error("Property not found");
        
        setProperty(propertyData);
        
        // Get Walk Score data using the property's address
        await fetchWalkScore(propertyData);
      } catch (err: any) {
        console.error("Error fetching property details:", err);
        setError(err.message || "Failed to load property details");
        toast({
          title: "Error",
          description: "Failed to load property location data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPropertyDetails();
    }
  }, [id, toast]);

  // Fetch nearby places for the map - use categorized endpoint to match the list below
  useEffect(() => {
    const fetchNearbyPlacesForMap = async () => {
      if (!walkScoreData?.snapped_lat || !walkScoreData?.snapped_lon) return;

      try {
        const apiUrl = import.meta.env.DEV 
          ? 'http://localhost:4000/api' 
          : 'https://sub-space.me/api';

        // Use categories endpoint to match the data shown below
        const response = await fetch(
          `${apiUrl}/google-places/categories?lat=${walkScoreData.snapped_lat}&lng=${walkScoreData.snapped_lon}&radius=1500`,
          {
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.categories) {
            // Extract all places from all categories and tag them with category name
            const allPlaces: any[] = [];
            Object.entries(data.categories).forEach(([categoryKey, category]: [string, any]) => {
              if (category.places && Array.isArray(category.places)) {
                // Add category information to each place
                const placesWithCategory = category.places.map((place: any) => ({
                  ...place,
                  categoryName: categoryKey // 'dining', 'shopping', 'coffee', 'education', 'parks'
                }));
                allPlaces.push(...placesWithCategory);
              }
            });
            setAllNearbyPlaces(allPlaces);
          }
        }
      } catch (error) {
        console.error("Error fetching places for map:", error);
      }
    };

    fetchNearbyPlacesForMap();
  }, [walkScoreData]);

  const fetchWalkScore = async (propertyData: any) => {
    try {
      // Build address string from property data
      const fullAddress = `${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zip_code || ''}`.trim();
      
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:4000/api' 
        : 'https://sub-space.me/api';
      
      console.log(`Fetching Walk Score data for address: ${fullAddress}`);
      
      // Add error handling with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        // Send the full address to the server and let it handle geocoding
        const response = await fetch(
          `${apiUrl}/walkscore/score?` + 
          `address=${encodeURIComponent(fullAddress)}&` +
          `city=${encodeURIComponent(propertyData.city)}&` +
          `state=${encodeURIComponent(propertyData.state)}`, 
          { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const walkScoreResult = await response.json();
        console.log("Walk Score data received:", walkScoreResult);
        setWalkScoreData(walkScoreResult);
      } catch (fetchError: any) {
        // If fetch fails, use mock data
        console.warn("Error fetching from API, using mock data:", fetchError.message);
        setWalkScoreData(getMockWalkScoreData());
        
        // Only show toast if it's not an abort error
        if (fetchError.name !== 'AbortError') {
          toast({
            title: "Walk Score Limited",
            description: "Using estimated walkability data for this property",
            variant: "warning",
          });
        }
      }
      
    } catch (err: any) {
      console.error("Error in Walk Score processing:", err);
      // Fall back to mock data
      setWalkScoreData(getMockWalkScoreData());
    }
  };

  // Mock data generator that matches the property location
  const getMockWalkScoreData = (): WalkScoreData => {
    // Use property data to customize the mock scores if available
    const cityName = property?.city || "State College";
    const stateName = property?.state || "PA";
    
    // Adjust scores based on city
    let walkscore = 85;
    let transitScore = 62;
    let bikeScore = 76;
    
    if (cityName === "New York") {
      walkscore = 96;
      transitScore = 86;
      bikeScore = 68;
    } else if (cityName === "State College") {
      walkscore = 89;
      transitScore = 45;
      bikeScore = 71;
    }
    
    return {
      walkscore: walkscore,
      walk_description: walkscore > 90 ? "Walker's Paradise" : walkscore > 80 ? "Very Walkable" : "Somewhat Walkable",
      transit: {
        score: transitScore,
        description: transitScore > 80 ? "Rider's Paradise" : transitScore > 60 ? "Good Transit" : transitScore > 40 ? "Some Transit" : "Minimal Transit",
        summary: `${transitScore > 80 ? 'Multiple' : transitScore > 40 ? 'Several' : 'Few'} nearby public transportation options in ${cityName}`
      },
      bike: {
        score: bikeScore,
        description: bikeScore > 70 ? "Very Bikeable" : "Bikeable"
      },
      scores: {
        "Dining": {
          score: 88,
          description: "Great dining options nearby",
          places: ["Local Restaurants", "Campus Dining", "Cafes"]
        },
        "Shopping": {
          score: 85,
          description: "Good shopping options",
          places: ["Downtown Shops", "College Mall", "Local Boutiques"]
        },
        "Coffee": {
          score: 92,
          description: "Coffee lover's paradise",
          places: ["Starbucks", "Student Coffee Shop", "Local Cafe"]
        },
        "Education": {
          score: 95,
          description: "Excellent education options",
          places: ["Penn State University", "State College Schools", "Libraries"]
        },
        "Parks": {
          score: 82,
          description: "Many parks nearby",
          places: ["Sidney Friedman Park", "Campus Green Spaces", "Recreation Areas"]
        }
      },
      ws_link: `https://www.walkscore.com/score/${encodeURIComponent(cityName)}-${encodeURIComponent(stateName)}`
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Location Data</h2>
        <p className="text-center text-muted-foreground">{error || "Property not found"}</p>
      </div>
    );
  }

  const hasWalkScore = walkScoreData && walkScoreData.walkscore !== undefined;
  const hasTransitScore = walkScoreData?.transit?.score !== undefined;
  const hasBikeScore = walkScoreData?.bike?.score !== undefined;
  
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setActiveTab(value);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-600">
          Location Information
        </h1>
        
        {walkScoreData && walkScoreData.ws_link && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.open(walkScoreData.ws_link, '_blank')}
          >
            <MapPin className="h-4 w-4" />
            <span>View on Walk Score</span>
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Location Map and Scores Panel */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {/* Interactive Map with Place Markers */}
          <Card className="overflow-hidden h-96 bg-blue-50 dark:bg-blue-950/20 relative">
            {walkScoreData?.snapped_lat && walkScoreData?.snapped_lon ? (
              <InteractiveMapWithPlaces
                center={{
                  lat: walkScoreData.snapped_lat,
                  lng: walkScoreData.snapped_lon
                }}
                places={allNearbyPlaces}
                propertyAddress={`${property.address}, ${property.city}, ${property.state} ${property.zip_code || ''}`}
                className="w-full h-full rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <MapPin className="h-12 w-12 mx-auto text-blue-500/50 mb-4" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
          </Card>
          
          {/* Walk Scores Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasWalkScore && (
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-4xl font-bold text-blue-800 dark:text-blue-300">
                    {walkScoreData?.walkscore}
                  </div>
                  <p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    Walk Score
                  </p>
                  <p className="mt-1 text-xs text-blue-500/70 dark:text-blue-300/70 text-center">
                    {walkScoreData?.walk_description}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {hasTransitScore && (
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <Building className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-4xl font-bold text-green-800 dark:text-green-300">
                    {walkScoreData?.transit?.score}
                  </div>
                  <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                    Transit Score
                  </p>
                  <p className="mt-1 text-xs text-green-500/70 dark:text-green-300/70 text-center">
                    {walkScoreData?.transit?.description}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {hasBikeScore && walkScoreData?.bike?.score !== null && (
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                    <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-4xl font-bold text-purple-800 dark:text-purple-300">
                    {walkScoreData?.bike?.score}
                  </div>
                  <p className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                    Bike Score
                  </p>
                  <p className="mt-1 text-xs text-purple-500/70 dark:text-purple-300/70 text-center">
                    {walkScoreData?.bike?.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Tabs for Nearby Places, Transit, and Amenities */}
          <div className="w-full mt-6">
            <Tabs defaultValue="nearby" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="nearby">Nearby Places</TabsTrigger>
                <TabsTrigger value="transit">Transit</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
              </TabsList>
              
            <TabsContent value="nearby" className="mt-6">
              <NearbyView 
                walkScoreData={walkScoreData} 
                propertyAddress={property.address}
                propertyCity={property.city}
                propertyLat={walkScoreData?.snapped_lat}
                propertyLon={walkScoreData?.snapped_lon}
              />
            </TabsContent>
              
              <TabsContent value="transit" className="mt-6">
                <TransitView 
                  walkScoreData={walkScoreData} 
                  propertyAddress={`${property.address}, ${property.city}, ${property.state}`}
                  lat={walkScoreData?.snapped_lat || 40.7934}
                  lon={walkScoreData?.snapped_lon || -77.86}
                />
              </TabsContent>
              
              <TabsContent value="amenities" className="mt-6">
                <div className="space-y-5">
                  <h3 className="text-lg font-medium">Property Amenities</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Laundry Facilities",
                      "High-Speed Internet",
                      "On-Site Parking",
                      "Study Areas",
                      "Fitness Center",
                      "Bike Storage",
                      "Pet Friendly",
                      "Furnished Units",
                      "24/7 Maintenance",
                      "Security System"
                    ].map((amenity, index) => (
                      <Card key={`amenity-${index}`} className="bg-blue-50/80 dark:bg-blue-900/20 border-none">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="text-sm">{amenity}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Right sidebar with property location details */}
        <div className="col-span-1">
          <LocationDetailsCard property={property} walkScoreData={walkScoreData} />
        </div>
      </div>
    </div>
  );
}