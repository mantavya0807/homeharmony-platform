import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train } from "lucide-react";
import { WalkScoreData } from "@/pages/PropertyDetailsLocation";

interface TransitViewProps {
  walkScoreData: WalkScoreData | null;
}

const TransitView: React.FC<TransitViewProps> = ({ walkScoreData }) => {
  // Use "more_info_link" if available; fallback to ws_link
  const transitDetailsLink = walkScoreData?.more_info_link || walkScoreData?.ws_link;

  const openTransitDetails = () => {
    console.log("Opening transit details:", transitDetailsLink);
    if (transitDetailsLink) {
      window.open(transitDetailsLink, "_blank");
    }
  };

  if (!walkScoreData?.transit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Train className="h-16 w-16 text-gray-400" />
        <p className="mt-4 text-lg text-gray-600">
          Transit information is not available for this location.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center bg-white rounded-lg p-6 shadow-md">
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {walkScoreData.transit.score}
          </div>
          <div className="text-lg font-semibold">Transit Score</div>
          <p className="mt-2 text-sm text-gray-500 text-center">
            {walkScoreData.transit.description}
          </p>
        </div>
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Transit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-base">
                {walkScoreData.transit.summary}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      {transitDetailsLink ? (
        <div className="text-center">
          <Button 
            variant="outline" 
            className="mt-4 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
            onClick={openTransitDetails}
          >
            View Full Transit Details
          </Button>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-sm">No additional transit details available.</p>
      )}
    </div>
  );
};

export default TransitView;
