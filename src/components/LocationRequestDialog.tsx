import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface LocationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationRequestDialog({ open, onOpenChange }: LocationRequestDialogProps) {
  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
          localStorage.setItem('locationPermissionAsked', 'true');
          onOpenChange(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          localStorage.setItem('locationPermissionAsked', 'true');
          onOpenChange(false);
        }
      );
    }
  };

  const handleSkip = () => {
    localStorage.setItem('locationPermissionAsked', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <MapPin className="h-5 w-5" />
            Enable Location Services
          </DialogTitle>
          <DialogDescription>
            Allow us to show you properties in your area and provide better recommendations.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <Button onClick={handleAllowLocation}>
            Allow Location Access
          </Button>
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}