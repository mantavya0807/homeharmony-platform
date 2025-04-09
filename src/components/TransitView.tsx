import React, { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // Use real data if available, otherwise use these defaults specific to State College, PA
  const transitData = walkScoreData?.transit || {
    score: 45,
    description: "Some Transit",
    summary: "9 nearby routes: 9 bus, 0 rail, 0 other"
  };

  // Real transit routes for State College, PA
  const transitRoutes = [
    {
      type: "bus",
      name: "Blue Loop",
      agency: "CATA",
      description: "Campus loop service",
      frequency: "Every 15 min",
      color: "blue",
      textColor: "white"
    },
    {
      type: "bus",
      name: "Red Link",
      agency: "CATA",
      description: "Downtown and campus service",
      frequency: "Every 20 min",
      color: "red",
      textColor: "white"
    },
    {
      type: "bus",
      name: "White Loop",
      agency: "CATA",
      description: "Evening and late night service",
      frequency: "Every 30 min",
      color: "gray",
      textColor: "black"
    },
    {
      type: "bus",
      name: "Green Link",
      agency: "CATA",
      description: "Service to housing areas",
      frequency: "Every 25 min",
      color: "green",
      textColor: "white"
    }
  ];

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
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Campus loop service available</span>
              </div>
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-500" />
                <span className="text-sm">9 bus routes nearby</span>
              </div>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transitRoutes.map((route, index) => (
            <Card key={index} className="p-4 flex items-start gap-3">
              <div 
                className="p-2 rounded-full" 
                style={{ 
                  backgroundColor: `rgba(${route.color === 'blue' ? '59, 130, 246' : 
                    route.color === 'red' ? '239, 68, 68' : 
                    route.color === 'green' ? '34, 197, 94' : 
                    '156, 163, 175'}, 0.2)` 
                }}
              >
                <Bus className="h-5 w-5" style={{ 
                  color: route.color === 'blue' ? '#2563eb' : 
                    route.color === 'red' ? '#dc2626' : 
                    route.color === 'green' ? '#16a34a' : 
                    '#4b5563' 
                }} />
              </div>
              <div>
                <h4 className="font-medium">{route.name}</h4>
                <p className="text-sm text-muted-foreground">{route.description}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    {route.frequency}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {route.agency}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Schedule Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border border-blue-100 dark:border-blue-900/50">
          <CardHeader>
            <CardTitle className="text-lg">Transit Schedule Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                The CATA bus system provides transportation throughout the State College area. 
                Service is frequent during university sessions with reduced service during breaks.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                  <h4 className="font-medium mb-2">Hours of Operation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Weekdays</span>
                      <span>5:00 AM - 12:30 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekends</span>
                      <span>7:00 AM - 12:30 AM</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                  <h4 className="font-medium mb-2">Fare Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Single Ride</span>
                      <span>$2.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Day Pass</span>
                      <span>$4.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Pass</span>
                      <span>$59.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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