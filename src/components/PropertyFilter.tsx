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
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import type { Database } from "@/integrations/supabase/types";

type PropertyType = Database["public"]["Enums"]["property_type"];

interface PropertyFiltersProps {
  onFiltersChange: (filters: {
    beds: string;
    baths: string;
    propertyType: PropertyType | "any";
    minSquareFeet: string;
    maxSquareFeet: string;
    priceRange: [number, number];
  }) => void;
}

function valuetext(value: number) {
  return `$${value.toLocaleString()}`;
}

export function PropertyFilters({ onFiltersChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState({
    beds: "any",
    baths: "any",
    propertyType: "any" as PropertyType | "any",
    minSquareFeet: '',
    maxSquareFeet: '',
    priceRange: [0, 10000] as [number, number],
  });

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    handleFilterChange('priceRange', newValue as [number, number]);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <svg 
              className="w-5 h-5 text-primary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
              />
            </svg>
          </motion.div>
          Filter Properties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Property Type */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label>Property Type</Label>
            <Select
              value={filters.propertyType}
              onValueChange={(value) => handleFilterChange('propertyType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="any">Any Type</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Bedrooms */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label>Bedrooms</Label>
            <Select
              value={filters.beds}
              onValueChange={(value) => handleFilterChange('beds', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+ Beds</SelectItem>
                <SelectItem value="2">2+ Beds</SelectItem>
                <SelectItem value="3">3+ Beds</SelectItem>
                <SelectItem value="4">4+ Beds</SelectItem>
                <SelectItem value="5">5+ Beds</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Bathrooms */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Label>Bathrooms</Label>
            <Select
              value={filters.baths}
              onValueChange={(value) => handleFilterChange('baths', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 dark:bg-slate-950 dark:border-slate-800">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+ Baths</SelectItem>
                <SelectItem value="2">2+ Baths</SelectItem>
                <SelectItem value="3">3+ Baths</SelectItem>
                <SelectItem value="4">4+ Baths</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Square Feet Range */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
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
          </motion.div>
        </div>

        {/* Price Range Slider */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex justify-between items-center">
            <Label>Price Range</Label>
            <span className="text-sm text-muted-foreground">
              {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
            </span>
          </div>
          
          <Box>
            <Slider
              getAriaLabel={() => 'Price range'}
              value={filters.priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              getAriaValueText={valuetext}
              valueLabelFormat={value => formatPrice(value)}
              min={0}
              max={10000}
              step={100}
            />
          </Box>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(0)}</span>
            <span>{formatPrice(10000)}</span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
