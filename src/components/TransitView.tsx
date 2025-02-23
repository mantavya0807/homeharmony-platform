import React, { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bus, Train, Building } from "lucide-react";
import { WalkScoreData } from "@/components/PropertyDetailsLocation";

// Lazy load the TransitDetailsDialog
const TransitDetailsDialog = React.lazy(() => import("./TransitDetailsDialog"));

interface TransitRoute {
  type: "bus" | "rail" | "other";
  count: number;
  routes: string[];
}

interface WalkScoreTransit {
  score: number;
  description: string;
  summary: string;
  routes?: TransitRoute[]; // optional if your data has route arrays
}

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

  if (!walkScoreData?.transit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-500 mb-4" />
        <p className="text-lg text-gray-500">
          Transit information is not available for this location.
        </p>
      </div>
    );
  }

  const { score, description, summary } = walkScoreData.transit;

  // If your API also returns an array of routes (like "routes": [...]),
  // you can display them below. For now, we just show the summary.

  return (
    <div className="space-y-8">
      {/* Score Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="col-span-1 bg-gradient-to-br from-blue-50 to-white shadow-lg">
          <CardContent className="py-8 flex flex-col items-center">
            <div className="text-6xl font-bold text-blue-600">{score}</div>
            <div className="mt-2 text-xl font-semibold">Transit Score</div>
            <div className="mt-1 text-sm text-gray-600 text-center">{description}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Transit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{summary}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* View Full Transit Details Button */}
      <div className="mt-4 flex justify-center">
        <Button
          onClick={() => setDialogOpen(true)}
          className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
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
