import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Utensils, 
  ShoppingBag, 
  Coffee, 
  School, 
  TreePalm
} from "lucide-react";
import { getApiUrl } from "@/lib/apiConfig";

interface NearbyViewProps {
  walkScoreData?: {
    scores?: {
      [key: string]: {
        score: number;
        description: string;
        places?: string[];
      };
    };
    ws_link?: string;
    snapped_lat?: number;
    snapped_lon?: number;
  } | null;
  propertyAddress?: string;
  propertyCity?: string;
  propertyLat?: number;
  propertyLon?: number;
}

interface CategoryData {
  icon: any;
  score: number;
  places: Array<{
    name: string;
    vicinity?: string;
    rating?: number;
  }>;
  description: string;
}

export default function NearbyView({ 
  walkScoreData, 
  propertyAddress, 
  propertyCity = "State College",
  propertyLat,
  propertyLon
}: NearbyViewProps) {
  const [nearbyData, setNearbyData] = useState<Record<string, CategoryData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealPlacesData();
  }, [propertyLat, propertyLon]);

  const fetchRealPlacesData = async () => {
    try {
      // Use Walk Score snapped coordinates or provided coordinates
      const lat = propertyLat || walkScoreData?.snapped_lat;
      const lng = propertyLon || walkScoreData?.snapped_lon;

      if (!lat || !lng) {
        console.warn("No coordinates available, using default data");
        setNearbyData(getDefaultNearbyData());
        setLoading(false);
        return;
      }

      const apiUrl = getApiUrl();

      console.log(`Fetching nearby places for coordinates: ${lat}, ${lng}`);

      const response = await fetch(
        `${apiUrl}/google-places/categories?lat=${lat}&lng=${lng}&radius=1500`,
        {
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Nearby places data received:", data);

      if (data.status === "success" && data.categories) {
        // Transform API data to match our component structure
        const transformedData: Record<string, CategoryData> = {
          "Dining": {
            icon: Utensils,
            score: data.categories.Dining?.score || 0,
            description: data.categories.Dining?.description || "No data",
            places: data.categories.Dining?.places || []
          },
          "Shopping": {
            icon: ShoppingBag,
            score: data.categories.Shopping?.score || 0,
            description: data.categories.Shopping?.description || "No data",
            places: data.categories.Shopping?.places || []
          },
          "Coffee": {
            icon: Coffee,
            score: data.categories.Coffee?.score || 0,
            description: data.categories.Coffee?.description || "No data",
            places: data.categories.Coffee?.places || []
          },
          "Education": {
            icon: School,
            score: data.categories.Education?.score || 0,
            description: data.categories.Education?.description || "No data",
            places: data.categories.Education?.places || []
          },
          "Parks": {
            icon: TreePalm,
            score: data.categories.Parks?.score || 0,
            description: data.categories.Parks?.description || "No data",
            places: data.categories.Parks?.places || []
          }
        };

        setNearbyData(transformedData);
      } else {
        // Use fallback data if API returns unexpected format
        setNearbyData(getDefaultNearbyData());
      }

    } catch (error) {
      console.error("Error fetching real places data:", error);
      setNearbyData(getDefaultNearbyData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultNearbyData = (): Record<string, CategoryData> => {
    return {
      "Dining": {
        icon: Utensils,
        score: 88,
        description: "Very Good",
        places: [
          { name: "Local Restaurants" },
          { name: "Campus Dining" },
          { name: "Cafes" }
        ]
      },
      "Shopping": {
        icon: ShoppingBag,
        score: 85,
        description: "Very Good",
        places: [
          { name: "Downtown Shops" },
          { name: "College Mall" },
          { name: "Local Boutiques" }
        ]
      },
      "Coffee": {
        icon: Coffee,
        score: 92,
        description: "Excellent",
        places: [
          { name: "Starbucks" },
          { name: "Student Coffee Shop" },
          { name: "Local Cafe" }
        ]
      },
      "Education": {
        icon: School,
        score: 95,
        description: "Excellent",
        places: [
          { name: "Penn State University" },
          { name: "State College Schools" },
          { name: "Libraries" }
        ]
      },
      "Parks": {
        icon: TreePalm,
        score: 82,
        description: "Very Good",
        places: [
          { name: "Sidney Friedman Park" },
          { name: "Campus Green Spaces" },
          { name: "Recreation Areas" }
        ]
      }
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="h-full">
            <CardContent className="p-5">
              <Skeleton className="h-6 w-24 mb-3" />
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!nearbyData) {
    return <div>No data available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Object.entries(nearbyData).map(([category, data], index) => {
        const Icon = data.icon;
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{category}</h3>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                
                <div className="mb-2">
                  <div className="text-2xl font-bold">{data.score}</div>
                  <div className="text-xs text-muted-foreground">Score out of 100</div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-4">{data.description}</p>
                
                <div className="space-y-2 mt-4">
                  {data.places.slice(0, 5).map((place, i) => (
                    <div
                      key={`${category}-place-${i}`}
                      className="text-sm p-2 rounded-lg bg-blue-100/60 dark:bg-blue-900/20"
                    >
                      <div className="font-medium">{place.name}</div>
                      {place.vicinity && (
                        <div className="text-xs text-muted-foreground">{place.vicinity}</div>
                      )}
                      {place.rating && (
                        <div className="text-xs text-muted-foreground">
                          ⭐ {place.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}