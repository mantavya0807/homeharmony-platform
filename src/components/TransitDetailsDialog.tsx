import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, Train, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { WalkScoreData } from "@/components/PropertyDetailsLocation";
import { getApiUrl } from "@/lib/apiConfig";

interface TransitRoute {
  type: string;
  name: string;
  description?: string;
  stops?: {
    name: string;
    distance?: number;
  }[];
}

interface TransitDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  walkScoreData: WalkScoreData | null;
  lat: number;
  lon: number;
}

const TransitDetailsDialog: React.FC<TransitDetailsDialogProps> = ({
  open,
  onOpenChange,
  address,
  walkScoreData,
  lat,
  lon,
}) => {
  const [loading, setLoading] = useState(false);
  const [transitNetwork, setTransitNetwork] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("routes");

  useEffect(() => {
    const fetchTransitNetwork = async () => {
      if (!open) return;

      try {
        setLoading(true);
        setError(null);

        // Call the transit network API
        const apiUrl = getApiUrl();

        const response = await fetch(
          `${apiUrl}/walkscore/network?lat=${lat}&lon=${lon}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setTransitNetwork(data);
      } catch (err: any) {
        console.error("Error fetching transit network:", err);
        setError(err.message || "Failed to load transit network");
      } finally {
        setLoading(false);
      }
    };

    fetchTransitNetwork();
  }, [open, lat, lon]);

  // Function to render transit routes
  const renderTransitRoutes = () => {
    if (!transitNetwork?.routes || transitNetwork.routes.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No transit routes available.</p>
        </div>
      );
    }

    // Group routes by type
    const busRoutes = transitNetwork.routes.filter((route: any) => route.type === "bus");
    const railRoutes = transitNetwork.routes.filter((route: any) => route.type === "rail");
    const otherRoutes = transitNetwork.routes.filter(
      (route: any) => route.type !== "bus" && route.type !== "rail"
    );

    return (
      <div className="space-y-6">
        {busRoutes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Bus Routes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {busRoutes.map((route: any, index: number) => (
                <Card key={`bus-${index}`} className="overflow-hidden">
                  <CardHeader className="bg-blue-50 dark:bg-blue-900/20 p-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bus className="h-4 w-4" />
                      {route.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {route.description || "No description available"}
                    </p>
                    {route.stops && route.stops.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold mb-2">Nearby Stops:</h4>
                        <div className="space-y-2">
                          {route.stops.slice(0, 3).map((stop: any, i: number) => (
                            <div key={`stop-${i}`} className="flex items-center justify-between text-xs">
                              <span>{stop.name}</span>
                              {stop.distance && (
                                <Badge variant="outline" className="text-xs">
                                  {stop.distance.toFixed(1)} miles
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {railRoutes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Rail Routes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {railRoutes.map((route: any, index: number) => (
                <Card key={`rail-${index}`} className="overflow-hidden">
                  <CardHeader className="bg-green-50 dark:bg-green-900/20 p-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Train className="h-4 w-4" />
                      {route.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {route.description || "No description available"}
                    </p>
                    {route.stops && route.stops.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-semibold mb-2">Nearby Stops:</h4>
                        <div className="space-y-2">
                          {route.stops.slice(0, 3).map((stop: any, i: number) => (
                            <div key={`stop-${i}`} className="flex items-center justify-between text-xs">
                              <span>{stop.name}</span>
                              {stop.distance && (
                                <Badge variant="outline" className="text-xs">
                                  {stop.distance.toFixed(1)} miles
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {otherRoutes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Other Transit Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherRoutes.map((route: any, index: number) => (
                <Card key={`other-${index}`} className="overflow-hidden">
                  <CardHeader className="bg-purple-50 dark:bg-purple-900/20 p-3">
                    <CardTitle className="text-base capitalize">
                      {route.type} - {route.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {route.description || "No description available"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to render transit summary 
  const renderTransitSummary = () => {
    if (!walkScoreData?.transit) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No transit summary available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Transit Score</span>
                <Badge className="bg-blue-600">{walkScoreData.transit.score}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {walkScoreData.transit.description}
              </p>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Details</h4>
                <p className="text-sm">{walkScoreData.transit.summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link to Walk Score */}
        {walkScoreData.ws_link && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => window.open(walkScoreData.ws_link, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View Full Details on Walk Score
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transit Details</DialogTitle>
          <DialogDescription>{address}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="routes">Transit Routes</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="routes">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                  <p className="text-center text-muted-foreground">{error}</p>
                </div>
              ) : (
                renderTransitRoutes()
              )}
            </TabsContent>

            <TabsContent value="summary">
              {renderTransitSummary()}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TransitDetailsDialog;