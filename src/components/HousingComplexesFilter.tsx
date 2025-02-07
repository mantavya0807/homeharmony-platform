// src/components/HousingComplexesFilter.tsx
import React from 'react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Define amenities object
export const AMENITIES: { [key: string]: string } = {
  has_swimming_pool: "Swimming Pool",
  has_gym: "Gym",
  has_clubhouse: "Clubhouse",
  has_business_center: "Business Center",
  has_community_room: "Community Room",
  has_gated_entry: "Gated Entry",
  has_security_cameras: "Security Cameras",
  has_doorman: "Doorman",
  has_playground: "Playground",
  has_bbq_area: "BBQ Area",
  has_dog_park: "Dog Park",
  has_tennis_court: "Tennis Court",
  has_basketball_court: "Basketball Court",
  has_elevator: "Elevator",
  has_parking_garage: "Parking Garage",
  has_package_room: "Package Room",
  has_laundry_facility: "Laundry Facility",
  has_bike_storage: "Bike Storage",
  has_sauna: "Sauna",
  has_spa: "Spa",
  has_yoga_studio: "Yoga Studio",
  has_movie_theater: "Movie Theater",
  has_game_room: "Game Room",
};

export interface Filters {
  city: string;
  state: string;
  zip_code: string;
  amenities: string[];
}

interface HousingComplexesFilterProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export function HousingComplexesFilter({ filters, onFilterChange }: HousingComplexesFilterProps) {
  const handleInputChange = (key: keyof Filters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const handleAmenityChange = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    
    onFilterChange({
      ...filters,
      amenities: newAmenities
    });
  };

  return (
    <div className="mb-4 bg-background p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input
          placeholder="City"
          value={filters.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
        />
        <Input
          placeholder="State"
          value={filters.state}
          onChange={(e) => handleInputChange('state', e.target.value)}
        />
        <Input
          placeholder="ZIP Code"
          value={filters.zip_code}
          onChange={(e) => handleInputChange('zip_code', e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(AMENITIES).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-accent transition-colors">
            <Checkbox
              checked={filters.amenities.includes(key)}
              onCheckedChange={() => handleAmenityChange(key)}
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}