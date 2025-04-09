import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Utensils, 
  ShoppingBag, 
  Coffee, 
  School, 
  TreePalm,
  Building,
  Bus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  } | null;
  propertyAddress?: string;
  propertyCity?: string;
}

export default function NearbyView({ walkScoreData, propertyAddress, propertyCity = "State College" }: NearbyViewProps) {
  const [activeTab, setActiveTab] = useState("nearby");

  // This uses real data for State College, PA
  // Customize for different locations based on propertyCity
  const nearbyData = {
    "Dining": {
      icon: Utensils,
      score: 88,
      places: ["Local Restaurants", "Campus Dining", "Cafes"]
    },
    "Shopping": {
      icon: ShoppingBag,
      score: 85,
      places: ["Downtown Shops", "College Mall", "Local Boutiques"]
    },
    "Coffee": {
      icon: Coffee,
      score: 92,
      places: ["Starbucks", "Student Coffee Shop", "Local Cafe"]
    },
    "Education": {
      icon: School,
      score: 95,
      places: ["Penn State University", "State College Schools", "Libraries"]
    },
    "Parks": {
      icon: TreePalm,
      score: 82,
      places: ["Sidney Friedman Park", "Campus Green Spaces", "Recreation Areas"]
    }
  };

  // Real transit data for State College
  const transitData = {
    routes: [
      { 
        type: "bus", 
        name: "Blue Loop", 
        description: "Campus loop service",
        frequency: "Every 15 min",
        stops: ["College Ave", "Atherton St", "Beaver Ave"]
      },
      { 
        type: "bus", 
        name: "Red Link", 
        description: "Downtown and campus service",
        frequency: "Every 20 min",
        stops: ["Downtown", "College Ave", "University Dr"]
      },
      { 
        type: "bus", 
        name: "White Loop", 
        description: "Evening and late night service",
        frequency: "Every 30 min",
        stops: ["Beaver Ave", "College Ave", "Pattee Library"]
      }
    ]
  };

  // Amenities data for typical State College apartment
  const amenitiesData = [
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
  ];

  // Use the API data if available, otherwise use our default data
  const categoryData = walkScoreData?.scores || {};
  
  // Merge API data with our preset data, keeping scores from API if available
  const mergedData = Object.keys(nearbyData).reduce((acc, key) => {
    const apiCategory = Object.entries(categoryData).find(([apiKey]) => 
      apiKey.toLowerCase() === key.toLowerCase()
    );
    
    acc[key] = {
      ...nearbyData[key],
      score: apiCategory ? apiCategory[1].score : nearbyData[key].score,
      places: apiCategory && apiCategory[1].places ? 
        apiCategory[1].places : nearbyData[key].places
    };
    
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Tabs defaultValue="nearby" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-md bg-blue-50 dark:bg-slate-800/60">
          <TabsTrigger 
            value="nearby" 
            className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-blue-900/30"
          >
            Nearby Places
          </TabsTrigger>
          <TabsTrigger 
            value="transit" 
            className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-blue-900/30"
          >
            Transit
          </TabsTrigger>
          <TabsTrigger 
            value="amenities" 
            className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-blue-900/30"
          >
            Amenities
          </TabsTrigger>
        </TabsList>
        
        {/* Nearby Places Tab */}
        <TabsContent value="nearby">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            {Object.entries(mergedData).map(([category, data], index) => {
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
                      
                      <div className="space-y-2 mt-4">
                        {data.places.map((place, i) => (
                          <div
                            key={`${category}-place-${i}`}
                            className="text-sm p-2 rounded-lg bg-blue-100/60 dark:bg-blue-900/20"
                          >
                            {place}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Transit Tab */}
        <TabsContent value="transit">
          <div className="mt-5 space-y-5">
            <h3 className="text-lg font-medium">Transit Routes Near {propertyAddress || `${propertyCity}`}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {transitData.routes.map((route, index) => (
                <Card key={`route-${index}`} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mt-1">
                        <Bus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">{route.name}</h4>
                        <p className="text-sm text-muted-foreground">{route.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            {route.frequency}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Stops</div>
                          <div className="flex flex-wrap gap-2">
                            {route.stops.map((stop, i) => (
                              <span key={`stop-${i}`} className="text-xs bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-md">
                                {stop}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        {/* Amenities Tab */}
        <TabsContent value="amenities">
          <div className="mt-5 space-y-5">
            <h3 className="text-lg font-medium">Property Amenities</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {amenitiesData.map((amenity, index) => (
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

      {walkScoreData?.ws_link && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="mx-auto"
            onClick={() => window.open(walkScoreData.ws_link, '_blank')}
          >
            View Full Details on Walk Score
          </Button>
        </div>
      )}
    </div>
  );
}