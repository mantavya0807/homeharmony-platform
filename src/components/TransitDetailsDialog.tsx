import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Train, Building, Clock, MapPin, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface StopDetail {
  id: string;
  lat: number;
  lon: number;
  name: string;
  route_ids: string[];
}

interface RouteDetail {
  id: string;
  name: string;
  short_name: string;
  long_name: string;
  category: "Rail" | "Bus" | "Other";
  agency: string;
  agency_url: string;
  color: string;
  text_color: string;
  description: string | null;
  stop_ids: string[];
}

interface NetworkResponse {
  stops: { [key: string]: StopDetail };
  routes: { [key: string]: RouteDetail };
}

interface TransitDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  lat: number;
  lon: number;
  walkScoreData: any;
}

// Simple icon switch
const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case "Bus":
      return <Bus className="h-5 w-5" />;
    case "Rail":
      return <Train className="h-5 w-5" />;
    default:
      return <Building className="h-5 w-5" />;
  }
};

export default function TransitDetailsDialog({
  open,
  onOpenChange,
  address,
  lat,
  lon,
  walkScoreData,
}: TransitDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [networkData, setNetworkData] = useState<NetworkResponse | null>(null);

  // Fetch the transit network when dialog opens
  useEffect(() => {
    const fetchNetwork = async () => {
      if (open) {
        setLoading(true);
        try {
          const resp = await fetch(`/api/walkscore/network?lat=${lat}&lon=${lon}`);
          if (!resp.ok) throw new Error("Failed to fetch transit network");
          const data: NetworkResponse = await resp.json();
          setNetworkData(data);
        } catch (err) {
          console.error("Error fetching transit network data:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchNetwork();
  }, [open, lat, lon]);

  const stopsArray = networkData ? Object.values(networkData.stops) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Transit Details</DialogTitle>
          <DialogDescription className="text-gray-600">
            Complete transit information for <span className="font-medium">{address}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Transit Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="text-6xl font-bold text-blue-600">
                  {walkScoreData?.transit?.score ?? 0}
                </div>
                <div className="mt-2 text-lg font-medium">Transit Score</div>
                <div className="mt-1 text-sm text-gray-600 text-center">
                  {walkScoreData?.transit?.description ?? "No transit data"}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                {walkScoreData?.transit?.summary ?? "No transit summary available"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed stops/routes from networkData */}
        <div className="my-6">
          <h3 className="text-xl font-semibold mb-2">Detailed Transit Network</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading transit info...</div>
          ) : networkData && stopsArray.length > 0 ? (
            stopsArray.map((stop) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 shadow-sm mb-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-semibold">{stop.name}</h4>
                    {/* If there's a distance property, you can show it here. */}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stop.route_ids.map((routeId) => {
                    const route = networkData.routes[routeId];
                    if (!route) return null;
                    return (
                      <div
                        key={route.id}
                        className="p-3 rounded-lg bg-blue-50"
                        style={{ borderLeft: `4px solid #${route.color || "000000"}` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryIcon category={route.category} />
                          <span className="font-semibold">
                            {route.name || route.short_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {route.description || ""}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Frequency not available</span>
                        </div>
                        {route.agency_url && (
                          <a
                            href={route.agency_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            {route.agency}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-600">No transit network data available.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
