import React, { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { Loader2 } from "lucide-react";

interface AddressInputProps {
  address: string;
  unit: string;
  city: string;
  state: string;
  zipCode: string;
  onAddressChange: (value: string) => void;
  onunitChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
}

export function AddressInput({
  address,
  unit,
  city,
  state,
  zipCode,
  onAddressChange,
  onunitChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
}: AddressInputProps) {
  const { toast } = useToast();
  const { isLoaded, error } = useGoogleMaps();
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required)
      const dummyElement = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(dummyElement);
    }
  }, [isLoaded]);

  const fetchPredictions = async (input: string) => {
    if (!input || !autocompleteService.current) return;

    try {
      setLoading(true);
      const request = {
        input,
        componentRestrictions: { country: 'us' },
        types: ['address']
      };

      const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
        autocompleteService.current!.getPlacePredictions(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });

      setPredictions(predictions);
      setShowPredictions(true);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch address suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionSelect = async (placeId: string) => {
    if (!placesService.current) return;

    try {
      setLoading(true);
      const place = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.current!.getDetails(
          {
            placeId,
            fields: ['address_components', 'formatted_address']
          },
          (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && result) {
              resolve(result);
            } else {
              reject(status);
            }
          }
        );
      });

      if (place.address_components) {
        const getComponent = (types: string[]) => {
          const component = place.address_components!.find(c => 
            types.every(t => c.types.includes(t))
          );
          return component ? component.long_name : '';
        };

        const streetNumber = getComponent(['street_number']);
        const route = getComponent(['route']);
        onAddressChange(`${streetNumber} ${route}`.trim());
        onCityChange(getComponent(['locality']) || getComponent(['sublocality_level_1']));
        onStateChange(getComponent(['administrative_area_level_1']));
        onZipCodeChange(getComponent(['postal_code']));
      }

      setShowPredictions(false);
      setPredictions([]);
    } catch (error) {
      console.error('Error getting place details:', error);
      toast({
        title: "Error",
        description: "Failed to get address details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Enter address manually (Maps API failed to load)"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>ZIP Code</Label>
          <Input
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="12345"
            required
          />
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        <Label>Address</Label>
        <div className="relative">
          <Input
            value={address}
            onChange={(e) => {
              onAddressChange(e.target.value);
              fetchPredictions(e.target.value);
            }}
            onFocus={() => setShowPredictions(true)}
            placeholder="Start typing to search..."
            required
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
        {showPredictions && predictions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                onClick={() => handlePredictionSelect(prediction.place_id)}
                type="button"
              >
                {prediction.description}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>ZIP Code</Label>
        <Input
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="12345"
          required
        />
      </div>
    </div>
  );
}