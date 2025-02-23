import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalkScoreData } from "@/pages/PropertyDetailsLocation";
import { Store } from "lucide-react";

interface NearbyViewProps {
  walkScoreData: WalkScoreData | null;
}

const NearbyView: React.FC<NearbyViewProps> = ({ walkScoreData }) => {
  if (!walkScoreData?.scores || Object.keys(walkScoreData.scores).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Store className="h-16 w-16 text-gray-400" />
        <p className="mt-4 text-lg text-gray-600">
          Nearby places information is not available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(walkScoreData.scores).map(([category, data]) => (
          <Card key={category} className="shadow-md hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl capitalize text-blue-700">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {data.score}
                </div>
                <div className="text-lg font-semibold">{category}</div>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {data.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NearbyView;
