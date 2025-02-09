import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { cn } from "@/lib/utils";

interface LocationSearchBarProps {
  onSearch: (location: string) => void;
  initialValue?: string;
  className?: string;
}

export function LocationSearchBar({
  onSearch,
  initialValue = "",
  className,
}: LocationSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isLoaded, error } = useGoogleMaps();
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !autocompleteService.current && window.google) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  useEffect(() => {
    // Close predictions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = (input: string) => {
    if (!input || !autocompleteService.current) return;
    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "us" },
        types: ["(regions)"], // e.g. city, state, postal_code
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
        }
        setLoading(false);
      }
    );
  };

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    const location = prediction.description;
    setSearchTerm(location);
    setShowPredictions(false);
    onSearch(location);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
    setShowPredictions(false);
  };

  /**
   * Use the browser’s Geolocation API to get the user’s current position,
   * then reverse-geocode it to an address and call onSearch with that address.
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation || !window.google?.maps?.Geocoder) {
      alert("Geolocation or Maps is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        // Reverse geocode the lat/lng to get an address string
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const address = results[0].formatted_address;
            setSearchTerm(address);
            onSearch(address);
          } else {
            // If reverse geocoding fails, just pass lat,lng to onSearch
            const fallback = `${latitude},${longitude}`;
            setSearchTerm(fallback);
            onSearch(fallback);
          }
          setShowPredictions(false);
        });
      },
      (error) => {
        console.error("Error getting current location:", error);
        alert("Unable to retrieve current location.");
      }
    );
  };

  if (error) {
    // If Google script load failed, just present a barebones input
    return (
      <form onSubmit={handleSearch} className={cn("w-full max-w-2xl flex gap-2", className)}>
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Enter location (city, state, or ZIP)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-12"
          />
          <Button type="submit" size="icon" className="absolute right-0 top-0 bottom-0 rounded-l-none">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
          <Crosshair className="h-4 w-4 mr-1" />
          Use My Location
        </Button>
      </form>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-10">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={searchBoxRef}>
      <form onSubmit={handleSearch} className="w-full max-w-2xl flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Enter location (city, state, or ZIP)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchPredictions(e.target.value);
            }}
            onFocus={() => {
              if (predictions.length > 0) setShowPredictions(true);
            }}
            className="pr-12"
          />
          <Button type="submit" size="icon" className="absolute right-0 top-0 bottom-0 rounded-l-none">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
          <Crosshair className="h-4 w-4 mr-1" />
          Use My Location
        </Button>
      </form>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
              onClick={() => handlePredictionSelect(prediction)}
              type="button"
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
