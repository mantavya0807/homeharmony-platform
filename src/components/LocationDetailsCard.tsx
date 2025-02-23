import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { WalkScoreData } from "@/pages/PropertyDetailsLocation";

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
  };
}

interface LocationDetailsCardProps {
  property: Property;
  walkScoreData: WalkScoreData | null;
}

const LocationDetailsCard: React.FC<LocationDetailsCardProps> = ({ property, walkScoreData }) => {
  const openFullReport = () => {
    console.log("Opening full report:", walkScoreData?.ws_link);
    if (walkScoreData?.ws_link) {
      window.open(walkScoreData.ws_link, "_blank");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Location Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Property Type</p>
            <p className="text-sm text-muted-foreground capitalize">{property.property_type}</p>
          </div>
        </div>
        {property.housing_complex && (
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Housing Complex</p>
              <p className="text-sm text-muted-foreground">{property.housing_complex.name}</p>
            </div>
          </div>
        )}
        {walkScoreData && (
          <div className="pt-4 border-t">
            <p className="font-medium mb-4">Location Scores</p>
            <div className="space-y-3">
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Walk Score</span>
                  <Badge variant="secondary">{walkScoreData.walkscore}</Badge>
                </div>
              </div>
              {walkScoreData.transit && (
                <div className="bg-accent/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transit Score</span>
                    <Badge variant="secondary">{walkScoreData.transit.score}</Badge>
                  </div>
                </div>
              )}
              {walkScoreData.bike && (
                <div className="bg-accent/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bike Score</span>
                    <Badge variant="secondary">{walkScoreData.bike.score}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {walkScoreData?.ws_link && (
        <CardFooter>
          <Button variant="link" className="w-full cursor-pointer" onClick={openFullReport}>
            View Full Report on Walk Score
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default LocationDetailsCard;
