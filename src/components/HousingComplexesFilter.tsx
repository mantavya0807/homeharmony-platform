import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  X,
  Waves,
  Dumbbell,
  Home,
  Building2,
  Users,
  Shield,
  Camera,
  User,
  TreePine,
  Flame,
  Dog,
  Car,
  Package,
  Bike,
  Bath,
  PersonStanding,
  Volleyball,
  WashingMachine,
  Film,
  Gamepad,
} from "lucide-react";

import { SmokeDetector, Elevator, Baseball } from "@mynaui/icons-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** 
 * Local interface for the filters object 
 */
export interface Filters {
  search: string;
  amenities: string[];
}

/**
 * Local AMENITIES map
 */
const AMENITIES: Record<string, { label: string; icon: React.ElementType }> = {
  has_swimming_pool: { label: "Swimming Pool", icon: Waves },
  has_gym: { label: "Gym", icon: Dumbbell },
  has_clubhouse: { label: "Clubhouse", icon: Home },
  has_business_center: { label: "Business Center", icon: Building2 },
  has_community_room: { label: "Community Room", icon: Users },
  has_gated_entry: { label: "Gated Entry", icon: Shield },
  has_security_cameras: { label: "Security Cameras", icon: Camera },
  has_doorman: { label: "Doorman", icon: User },
  has_playground: { label: "Playground", icon: TreePine },
  has_bbq_area: { label: "BBQ Area", icon: Flame },
  has_dog_park: { label: "Dog Park", icon: Dog },
  has_tennis_court: { label: "Tennis Court", icon: Baseball },
  has_basketball_court: { label: "Basketball Court", icon: Volleyball },
  has_elevator: { label: "Elevator", icon: Elevator },
  has_parking_garage: { label: "Parking Garage", icon: Car },
  has_package_room: { label: "Package Room", icon: Package },
  has_laundry_facility: { label: "Laundry Facility", icon: WashingMachine },
  has_bike_storage: { label: "Bike Storage", icon: Bike },
  has_sauna: { label: "Sauna", icon: Bath },
  has_spa: { label: "Spa", icon: SmokeDetector },
  has_yoga_studio: { label: "Yoga Studio", icon: PersonStanding },
  has_movie_theater: { label: "Movie Theater", icon: Film },
  has_game_room: { label: "Game Room", icon: Gamepad },
};

interface FilterProps {
  filters: {
    search: string;
    amenities: string[];
  };
  onFilterChange: (newFilters: FilterProps["filters"]) => void;
}

export function HousingComplexesFilter({ filters, onFilterChange }: FilterProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...localFilters, search: e.target.value };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  // Keep the amenities, remove the dropdown
  const handleAmenityChange = (amenityKey: string, checked: boolean) => {
    let newAmenities = [...localFilters.amenities];
    if (checked && !newAmenities.includes(amenityKey)) {
      newAmenities.push(amenityKey);
    } else if (!checked && newAmenities.includes(amenityKey)) {
      newAmenities = newAmenities.filter((a) => a !== amenityKey);
    }
    const updated = { ...localFilters, amenities: newAmenities };
    setLocalFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    onFilterChange({ ...filters, amenities: [] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="flex-1">
          <Label htmlFor="search" className="text-sm font-semibold mb-1 block">
            Search by Name / City / State / ZIP
          </Label>
          <Input
            id="search"
            value={localFilters.search}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Selected Amenities (chips) */}
      {filters.amenities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 flex flex-wrap gap-2"
        >
          {filters.amenities.map((amenity) => (
            <Badge
              key={amenity}
              variant="secondary"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-sm shadow-sm"
            >
              {AMENITIES[amenity]?.label ?? amenity}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleAmenityChange(amenity, false)}
              />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </motion.div>
      )}

      {/* Amenities Checkboxes */}
      <div className="mt-4">
        <Label className="text-sm font-semibold mb-2 block">Amenities</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(AMENITIES).map(([key, { label, icon: Icon }]) => {
            const isSelected = localFilters.amenities.includes(key);
            return (
              <label
                key={key}
                className="flex items-center space-x-2 text-sm p-1 rounded transition-colors
                         hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 transition-colors"
                  checked={isSelected}
                  onChange={(e) => handleAmenityChange(key, e.target.checked)}
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
