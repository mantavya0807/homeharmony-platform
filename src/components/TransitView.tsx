import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bus, Train, Building, Loader2 } from "lucide-react";
import { WalkScoreData } from "@/components/PropertyDetailsLocation";

// Lazy load the TransitDetailsDialog
const TransitDetailsDialog = React.lazy(() => import("./TransitDetailsDialog"));

interface TransitViewProps {
  walkScoreData: WalkScoreData | null;
  propertyAddress: string;
  lat: number;
  lon: number;
}

export default function TransitView({
  walkScoreData,
  propertyAddress,
  lat,
  lon,
}: TransitViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transitRoutes, setTransitRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use real data if available, otherwise use these defaults specific to State College, PA
  const transitData = walkScoreData?.transit || {
    score: 45,
    description: "Some Transit",
    summary: "9 nearby routes: 9 bus, 0 rail, 0 other"
  };

  useEffect(() => {
    fetchRealTransitData();
  }, [lat, lon]);

  const fetchRealTransitData = async () => {
    try {
      if (!lat || !lon) {
        console.warn("No coordinates available for transit data");
        setTransitRoutes(getDefaultTransitRoutes());
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:4000/api' 
        : 'https://sub-space.me/api';

      console.log(`Fetching transit routes for coordinates: ${lat}, ${lon}`);

      const response = await fetch(
        `${apiUrl}/google-transit/routes-at-location?lat=${lat}&lng=${lon}`,
        {
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Transit routes data received:", data);

      if (data.status === "success" && data.routes && data.routes.length > 0) {
        setTransitRoutes(data.routes.slice(0, 6)); // Limit to 6 routes
      } else {
        setTransitRoutes(getDefaultTransitRoutes());
      }

    } catch (error) {
      console.error("Error fetching real transit data:", error);
      setTransitRoutes(getDefaultTransitRoutes());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTransitRoutes = () => {
    return [
      {
        name: "Blue Loop",
        type: "bus",
        agency: "CATA",
        description: "Campus loop service",
        frequency: "Every 15 min",
        color: "blue"
      },
      {
        name: "Red Link",
        type: "bus",
        agency: "CATA",
        description: "Downtown and campus service",
        frequency: "Every 20 min",
        color: "red"
      },
      {
        name: "White Loop",
        type: "bus",
        agency: "CATA",
        description: "Evening and late night service",
        frequency: "Every 30 min",
        color: "gray"
      },
      {
        name: "Green Link",
        type: "bus",
        agency: "CATA",
        description: "Service to housing areas",
        frequency: "Every 25 min",
        color: "green"
      }
    ];
  };

  // If transit data is explicitly null (rather than undefined), show no data message
  if (walkScoreData && walkScoreData.transit === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">
          Transit information is not available for this location.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Score Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="col-span-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-blue-950/10 shadow-lg">
          <CardContent className="py-8 flex flex-col items-center">
            <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">{transitData.score}</div>
            <div className="mt-2 text-xl font-semibold">Transit Score</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center">{transitData.description}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Transit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{transitData.summary}</p>
            {transitRoutes.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-500" />
                <span className="text-sm">{transitRoutes.length} transit {transitRoutes.length === 1 ? 'route' : 'routes'} nearby</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transit Routes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Nearby Transit Routes</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transitRoutes.map((route, index) => {
              const color = route.color || 'blue';
              const colorMap: Record<string, { bg: string; text: string }> = {
                blue: { bg: 'rgba(59, 130, 246, 0.2)', text: '#2563eb' },
                red: { bg: 'rgba(239, 68, 68, 0.2)', text: '#dc2626' },
                green: { bg: 'rgba(34, 197, 94, 0.2)', text: '#16a34a' },
                gray: { bg: 'rgba(156, 163, 175, 0.2)', text: '#4b5563' }
              };
              const colors = colorMap[color] || colorMap.blue;

              return (
                <Card key={index} className="p-4 flex items-start gap-3">
                  <div 
                    className="p-2 rounded-full" 
                    style={{ backgroundColor: colors.bg }}
                  >
                    <Bus className="h-5 w-5" style={{ color: colors.text }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{route.name}</h4>
                    <p className="text-sm text-muted-foreground">{route.description}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {route.frequency && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {route.frequency}
                        </span>
                      )}
                      {route.agency && (
                        <span className="text-xs text-muted-foreground">
                          {route.agency}
                        </span>
                      )}
                    </div>
                    {route.stops && route.stops.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Stops: {route.stops.slice(0, 3).join(", ")}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Additional Transit Information - Only show if we have valid transit data */}
      {transitData.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-blue-100 dark:border-blue-900/50">
            <CardHeader>
              <CardTitle className="text-lg">Transit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {transitData.summary}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                For detailed schedule information, fares, and real-time updates, please visit your local transit agency's website or use their mobile app.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* View Full Transit Details Button */}
      <div className="mt-4 flex justify-center">
        <Button
          onClick={() => setDialogOpen(true)}
          className="px-8 py-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          View Full Transit Details
        </Button>
      </div>

      {/* Lazy-loaded Transit Details Dialog */}
      <Suspense fallback={<div className="text-center py-8">Loading transit details...</div>}>
        {dialogOpen && (
          <TransitDetailsDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            address={propertyAddress}
            walkScoreData={walkScoreData}
            lat={lat}
            lon={lon}
          />
        )}
      </Suspense>
    </div>
  );
}