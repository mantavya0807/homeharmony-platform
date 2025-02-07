import React, { useEffect, useRef, useState } from 'react';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSearchBarProps {
  onSearch: (location: string) => void;
  initialValue?: string;
  className?: string;
}

export function LocationSearchBar({ onSearch, initialValue = "", className }: LocationSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLoaded, error } = useGoogleMaps();
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required)
      const dummyElement = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(dummyElement);
    }
  }, [isLoaded]);

  useEffect(() => {
    // Close predictions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = async (input: string) => {
    if (!input || !autocompleteService.current) return;

    try {
      setLoading(true);
      const request = {
        input,
        componentRestrictions: { country: 'us' },
        types: ['(cities)']
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
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
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

  // Fallback for when Google Maps fails to load
  if (error) {
    return (
      <form onSubmit={handleSearch} className={className}>
        <div className="relative flex w-full max-w-2xl">
          <Input
            type="text"
            placeholder="Enter location (city, state)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-12"
          />
          <Button type="submit" size="icon" className="absolute right-0 h-full rounded-l-none">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-10">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={searchBoxRef}>
      <form onSubmit={handleSearch}>
        <div className="relative flex w-full max-w-2xl">
          <Input
            type="text"
            placeholder="Search by city..."
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
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-0 h-full rounded-l-none"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Predictions Dropdown */}
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