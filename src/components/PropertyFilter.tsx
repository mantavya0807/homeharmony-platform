import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

type PropertyType = "house" | "apartment" | "condo" | "townhouse";

interface PropertyFiltersProps {
  onFiltersChange: (filters: {
    beds: string;
    baths: string;
    propertyType: PropertyType | "any";
    minSquareFeet: string;
    maxSquareFeet: string;
    priceRange: [number, number];
    sublease_from: string;
    sublease_to: string;
  }) => void;
}

export function PropertyFilters({ onFiltersChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState({
    beds: "any",
    baths: "any",
    propertyType: "any" as PropertyType | "any",
    minSquareFeet: '',
    maxSquareFeet: '',
    priceRange: [0, 10000] as [number, number],
    sublease_from: '',
    sublease_to: '',
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceChange = (value: [number, number]) => {
    handleFilterChange('priceRange', value);
  };

  return (
    <div className="pt-4 pb-4">
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <button className="flex justify-between items-center w-full text-left text-lg font-semibold">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
                    />
                  </svg>
                  Filter Properties
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Property Type */}
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={filters.propertyType} onValueChange={(value) => handleFilterChange('propertyType', value)}>
                    <SelectTrigger><SelectValue placeholder="Any Type" /></SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 dark:bg-slate-950 dark:border-slate-800">
                      <SelectItem value="any">Any Type</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms */}
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Select value={filters.beds} onValueChange={(value) => handleFilterChange('beds', value)}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 dark:bg-slate-950 dark:border-slate-800">
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1+ Beds</SelectItem>
                      <SelectItem value="2">2+ Beds</SelectItem>
                      <SelectItem value="3">3+ Beds</SelectItem>
                      <SelectItem value="4">4+ Beds</SelectItem>
                      <SelectItem value="5">5+ Beds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bathrooms */}
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Select value={filters.baths} onValueChange={(value) => handleFilterChange('baths', value)}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 dark:bg-slate-950 dark:border-slate-800">
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1+ Baths</SelectItem>
                      <SelectItem value="2">2+ Baths</SelectItem>
                      <SelectItem value="3">3+ Baths</SelectItem>
                      <SelectItem value="4">4+ Baths</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Square Feet Range */}
            <div className="space-y-2">
              <Label>Square Feet</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minSquareFeet}
                  onChange={(e) => handleFilterChange('minSquareFeet', e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxSquareFeet}
                  onChange={(e) => handleFilterChange('maxSquareFeet', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          

                {/* Sublease Date Range */}
                <div className="space-y-2">
                  <Label>Sublease From</Label>
                  <Input type="date" value={filters.sublease_from} onChange={(e) => handleFilterChange('sublease_from', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Sublease To</Label>
                  <Input type="date" value={filters.sublease_to} onChange={(e) => handleFilterChange('sublease_to', e.target.value)} />
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Price Range</Label>
                  <span className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                      .format(filters.priceRange[0])} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                      .format(filters.priceRange[1])}
                  </span>
                </div>
                
                <Slider min={0} max={10000} step={100} value={filters.priceRange} onValueChange={handlePriceChange} className="w-full" />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
