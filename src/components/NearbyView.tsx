import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Coffee, School, ShoppingBag, Utensils, TreePalm } from "lucide-react";

interface Category {
  name: string;
  icon: React.ElementType;
  score: number;
  places: string[];
}

interface NearbyViewProps {
  walkScoreData: {
    scores?: {
      [key: string]: {
        score: number;
        description: string;
        places?: string[];
      };
    };
    ws_link?: string;
  } | null;
}

export default function NearbyView({ walkScoreData }: NearbyViewProps) {
  if (!walkScoreData?.scores || Object.keys(walkScoreData.scores).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Store className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">
          Nearby places information is not available.
        </p>
      </div>
    );
  }

  // Example categories with mock data (replace with real data from API)
  const categories: Category[] = [
    {
      name: "Dining",
      icon: Utensils,
      score: 95,
      places: ["The Diner", "Pizza Heaven", "Sushi Palace"]
    },
    {
      name: "Shopping",
      icon: ShoppingBag,
      score: 85,
      places: ["Target", "CVS Pharmacy", "Downtown Mall"]
    },
    {
      name: "Coffee",
      icon: Coffee,
      score: 90,
      places: ["Starbucks", "Local Coffee Shop", "Dunkin"]
    },
    {
      name: "Education",
      icon: School,
      score: 88,
      places: ["Penn State University", "State College High School"]
    },
    {
      name: "Parks",
      icon: TreePalm,
      score: 82,
      places: ["Sidney Friedman Park", "Sunset Park"]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {category.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{category.score}</div>
                  <div className="text-xs text-muted-foreground">
                    Score out of 100
                  </div>
                  <div className="mt-4 space-y-2">
                    {category.places.map((place) => (
                      <div
                        key={place}
                        className="text-sm p-2 rounded-lg bg-accent/50"
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

      {walkScoreData.ws_link && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => window.open(walkScoreData.ws_link, '_blank')}
          >
            View Full Details on Walk Score
          </Button>
        </div>
      )}
    </div>
  );
}