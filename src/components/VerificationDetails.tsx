import React from "react";
import { CheckCircle, AlertCircle, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerificationDetailsProps {
  isVerified: boolean;
  leaseInfo?: {
    originalRent?: number;
    leaseTerm?: number | null;
    startDate?: string;
    endDate?: string;
    rentDifferential?: number | null;
    leaseType?: string;
  };
}

export const VerificationDetails: React.FC<VerificationDetailsProps> = ({
  isVerified,
  leaseInfo,
}: VerificationDetailsProps) => {
  const originalRent = leaseInfo?.originalRent ?? 0;
  const leaseTerm = leaseInfo?.leaseTerm ?? 0;
  const rentDifferential = leaseInfo?.rentDifferential ?? 0;

  const formattedDifferential = rentDifferential > 0
    ? `+${rentDifferential.toFixed(1)}%`
    : `${rentDifferential.toFixed(1)}%`;

  const getDifferentialColor = (value: number) => {
    if (value > 0) return "text-green-500 dark:text-green-400";
    if (value < 0) return "text-red-500 dark:text-red-400";
    return "text-muted-foreground";
  };

  if (!isVerified) {
    return (
      <Card>
        <CardHeader className="border-b bg-accent/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-semibold">
                Verification Status
              </CardTitle>
              <Badge variant="warning" className="h-6">
                Pending
              </Badge>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 transition-colors" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-4">
                <p className="text-sm">
                  Verification in progress. Our AI is analyzing the lease document for accuracy.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-center">
            <p className="text-muted-foreground text-sm">
              Property details will be displayed after verification is complete. 
              This helps ensure all information is accurate and matches the lease document.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b bg-accent/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">
              Verification Details
            </CardTitle>
            <Badge variant="success" className="h-6">
              Verified
            </Badge>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 transition-colors" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-4">
              <p className="text-sm">
                Document verified using AI-powered analysis. All lease details match our records.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100/50 dark:bg-blue-900/20 p-2">
              <DollarSign className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Original Rent</span>
              <span className="font-semibold">
                ${originalRent.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100/50 dark:bg-purple-900/20 p-2">
              <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Lease Term</span>
              <span className="font-semibold">
                {leaseTerm} months
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Rent Differential</span>
              <span className={`font-semibold ${getDifferentialColor(rentDifferential)}`}>
                {formattedDifferential}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}