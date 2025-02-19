import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Building2,
  HomeIcon,
  MapPinned,
  Search,
  Home,
  Hotel,
  Building,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Extended Property Type definitions to include a search field
type PropertyType = "house" | "apartment" | "condo" | "townhouse";

interface HousingComplex {
  id: string;
  name: string;
}

interface PropertyFiltersProps {
  properties: any[]; // Array of properties for future use
  housingComplexes?: HousingComplex[];
  onFiltersChange: (filters: PropertyFilters) => void;
  onClose?: () => void;
}

export interface PropertyFilters {
  searchText: string;
  propertyType: PropertyType | "any";
  priceRange: [number, number];
  bedrooms: number | "any";
  bathrooms: number | "any";
  squareFeet: [number | null, number | null];
  housingComplexIds: string[];
  radius: number;
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
  };
  isVerified: boolean;
}

const DEFAULT_FILTERS: PropertyFilters = {
  searchText: "",
  propertyType: "any",
  priceRange: [0, 10000],
  bedrooms: "any",
  bathrooms: "any",
  squareFeet: [null, null],
  housingComplexIds: [],
  radius: 5, // Default 5 mile radius
  location: {
    lat: null,
    lng: null,
    address: "",
  },
  isVerified: false,
};

const PROPERTY_TYPES = [
  { value: "any", label: "Any Type", icon: HomeIcon },
  { value: "house", label: "House", icon: Home },
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "condo", label: "Condo", icon: Hotel },
  { value: "townhouse", label: "Townhouse", icon: Building2 },
];

export function PropertyFilters({
  properties,
  housingComplexes = [],
  onFiltersChange,
  onClose,
}: PropertyFiltersProps) {
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS);
  const [openComplexSelect, setOpenComplexSelect] = useState(false);

  const handleFilterChange = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Wait for explicit apply before calling onFiltersChange
  };

  // Prevent accidental modal closure by stopping event propagation.
  const stopPropagation = (e: React.MouseEvent | React.FocusEvent) =>
    e.stopPropagation();

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6 overflow-hidden"
    >
      {/* SEARCH PROPERTIES SECTION */}
      <section className="space-y-4" onClick={stopPropagation} onFocus={stopPropagation}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <Search className="h-5 w-5" />
          <h3 className="font-semibold">Search Properties</h3>
        </motion.div>
        <Input
          placeholder="Enter title, city, state or zip code..."
          value={filters.searchText}
          onChange={(e) => handleFilterChange("searchText", e.target.value)}
          onMouseDown={stopPropagation}
          className="w-full"
        />
      </section>

      {/* LOCATION & RADIUS SECTION */}
      <section className="space-y-4" onClick={stopPropagation} onFocus={stopPropagation}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <MapPinned className="h-5 w-5" />
          <h3 className="font-semibold">Location</h3>
        </motion.div>
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Enter address..."
              value={filters.location.address}
              onChange={(e) =>
                handleFilterChange("location", {
                  ...filters.location,
                  address: e.target.value,
                })
              }
              onMouseDown={stopPropagation}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Search Radius</Label>
              <span className="text-sm text-muted-foreground">
                {filters.radius} miles
              </span>
            </div>
            <Slider
              min={1}
              max={50}
              step={1}
              value={[filters.radius]}
              onValueChange={([value]) => handleFilterChange("radius", value)}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* PROPERTY TYPE SECTION */}
      <section className="space-y-4" onClick={stopPropagation} onFocus={stopPropagation}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <HomeIcon className="h-5 w-5" />
          <h3 className="font-semibold">Property Type</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={filters.propertyType === value ? "default" : "outline"}
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2 rounded-xl transition-all",
                filters.propertyType === value
                  ? "bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 text-white"
                  : "hover:border-blue-800 dark:hover:border-primary"
              )}
              onClick={() =>
                handleFilterChange("propertyType", value as PropertyType)
              }
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm">{label}</span>
            </Button>
          ))}
        </motion.div>
      </section>

      {/* PRICE RANGE SECTION (Normal Slider) */}
      <section className="space-y-4" onClick={stopPropagation} onFocus={stopPropagation}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <Building2 className="h-5 w-5" />
          <h3 className="font-semibold">Price Range</h3>
        </motion.div>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${Math.floor(filters.priceRange[0]).toLocaleString()}</span>
            <span>${Math.ceil(filters.priceRange[1]).toLocaleString()}</span>
          </div>
          <Slider
            min={0}
            max={10000}
            step={100}
            value={filters.priceRange}
            onValueChange={(range) => handleFilterChange("priceRange", range)}
            className="w-full"
          />
        </div>
      </section>

      {/* HOUSING COMPLEX SECTION */}
      <section className="space-y-4" onClick={stopPropagation} onFocus={stopPropagation}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <Building className="h-5 w-5" />
          <h3 className="font-semibold">Housing Complex</h3>
        </motion.div>
        <Popover open={openComplexSelect} onOpenChange={setOpenComplexSelect}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openComplexSelect}
              className="w-full justify-between text-sm"
            >
              {filters.housingComplexIds.length > 0
                ? `${filters.housingComplexIds.length} selected`
                : "Select housing complexes..."}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput
                placeholder="Search housing complexes..."
                className="h-9"
                onMouseDown={stopPropagation}
              />
              <CommandEmpty>No housing complex found.</CommandEmpty>
              <CommandGroup>
                {housingComplexes.map((complex) => (
                  <CommandItem
                    key={complex.id}
                    onSelect={(e) => {
                      e.stopPropagation();
                      const newIds = filters.housingComplexIds.includes(complex.id)
                        ? filters.housingComplexIds.filter((id) => id !== complex.id)
                        : [...filters.housingComplexIds, complex.id];
                      handleFilterChange("housingComplexIds", newIds);
                    }}
                    onMouseDown={stopPropagation}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.housingComplexIds.includes(complex.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {complex.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </section>

      {/* ROOMS & SIZE SECTION */}
      <section className="space-y-4" onClick={stopPropagation} onFocus={stopPropagation}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <Building2 className="h-5 w-5" />
          <h3 className="font-semibold">Rooms & Size</h3>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Bedrooms</Label>
            <Select
              value={filters.bedrooms.toString()}
              onValueChange={(value) =>
                handleFilterChange(
                  "bedrooms",
                  value === "any" ? "any" : parseInt(value)
                )
              }
            >
              <SelectTrigger onMouseDown={stopPropagation}>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}+ beds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Bathrooms</Label>
            <Select
              value={filters.bathrooms.toString()}
              onValueChange={(value) =>
                handleFilterChange(
                  "bathrooms",
                  value === "any" ? "any" : parseFloat(value)
                )
              }
            >
              <SelectTrigger onMouseDown={stopPropagation}>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}+ baths
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Square Feet</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Min sq ft"
              value={filters.squareFeet[0] || ""}
              onChange={(e) =>
                handleFilterChange("squareFeet", [
                  e.target.value ? parseInt(e.target.value) : null,
                  filters.squareFeet[1],
                ])
              }
              onMouseDown={stopPropagation}
              className="text-sm border-gray-200 dark:border-gray-700"
            />
            <Input
              type="number"
              placeholder="Max sq ft"
              value={filters.squareFeet[1] || ""}
              onChange={(e) =>
                handleFilterChange("squareFeet", [
                  filters.squareFeet[0],
                  e.target.value ? parseInt(e.target.value) : null,
                ])
              }
              onMouseDown={stopPropagation}
              className="text-sm border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* VERIFIED PROPERTIES TOGGLE */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-accent/50 transition-colors">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Verified Properties Only</Label>
            <p className="text-xs text-muted-foreground">
              Show only properties with verified documents
            </p>
          </div>
          <Switch
            checked={filters.isVerified}
            onCheckedChange={(checked) =>
              handleFilterChange("isVerified", checked)
            }
          />
        </div>

        {/* CLEAR & APPLY BUTTONS */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              onFiltersChange(DEFAULT_FILTERS);
            }}
            className="flex-1 border-blue-900/20 dark:border-white/20 hover:border-blue-800 dark:hover:border-primary"
          >
            Clear all
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
            onClick={() => onFiltersChange(filters)}
          >
            Show results
          </Button>
        </div>
      </section>
    </motion.div>
  );
}
