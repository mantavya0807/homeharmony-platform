import React, { useState } from "react";
import { motion } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, CheckCircle2, HomeIcon, MapPin } from "lucide-react";

type PropertyType = "house" | "apartment" | "condo" | "townhouse";

interface PropertyFiltersProps {
  onFiltersChange: (filters: {
    title: string;
    description: string;
    beds: string;
    baths: string;
    propertyType: PropertyType | "any";
    minSquareFeet: string;
    maxSquareFeet: string;
    priceRange: [number, number];
    address: string;
    city: string;
    state: string;
    zipCode: string;
    unit: string;
    isVerified: boolean;
    status: string;
    sublease_from: string;
    sublease_to: string;
    originalLeaseRent: string;
    originalLeaseTerm: string;
    rentDifferential: string;
  }) => void;
}

export function PropertyFilters({ onFiltersChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState({
    title: "",
    description: "",
    beds: "any",
    baths: "any",
    propertyType: "any" as PropertyType | "any",
    minSquareFeet: "",
    maxSquareFeet: "",
    priceRange: [0, 10000] as [number, number],
    address: "",
    city: "",
    state: "",
    zipCode: "",
    unit: "",
    isVerified: false,
    status: "any",
    sublease_from: "",
    sublease_to: "",
    originalLeaseRent: "",
    originalLeaseTerm: "",
    rentDifferential: "",
  });

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full px-6 py-8 space-y-8 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg"
    >
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
          Property Filters
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Fine-tune your property search with our advanced filters.
        </p>
      </div>

      <Card className="border border-gray-200 dark:border-gray-700 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 shadow-xl">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Basic Information Section */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <HomeIcon className="h-6 w-6" />
                <h3 className="font-semibold text-lg">Basic Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Property Title</Label>
                  <Input
                    placeholder="Search by title..."
                    value={filters.title}
                    onChange={(e) => handleFilterChange("title", e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Property Type</Label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) => handleFilterChange("propertyType", value)}
                  >
                    <SelectTrigger className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all">
                      <SelectValue placeholder="Any Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Type</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Location Section */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <MapPin className="h-6 w-6" />
                <h3 className="font-semibold text-lg">Location</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <Input
                    placeholder="Enter address..."
                    value={filters.address}
                    onChange={(e) => handleFilterChange("address", e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">City</Label>
                    <Input
                      placeholder="City..."
                      value={filters.city}
                      onChange={(e) => handleFilterChange("city", e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">State</Label>
                    <Input
                      placeholder="State..."
                      value={filters.state}
                      onChange={(e) => handleFilterChange("state", e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Property Details Section */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Building2 className="h-6 w-6" />
                <h3 className="font-semibold text-lg">Property Details</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bedrooms</Label>
                    <Select
                      value={filters.beds}
                      onValueChange={(value) => handleFilterChange("beds", value)}
                    >
                      <SelectTrigger className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}+ Beds
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bathrooms</Label>
                    <Select
                      value={filters.baths}
                      onValueChange={(value) => handleFilterChange("baths", value)}
                    >
                      <SelectTrigger className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {[1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}+ Baths
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Square Feet Range</Label>
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minSquareFeet}
                      onChange={(e) =>
                        handleFilterChange("minSquareFeet", e.target.value)
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxSquareFeet}
                      onChange={(e) =>
                        handleFilterChange("maxSquareFeet", e.target.value)
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Additional Filters */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-semibold text-lg">Additional Filters</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Verified Properties Only
                  </Label>
                  <Switch
                    checked={filters.isVerified}
                    onCheckedChange={(checked) =>
                      handleFilterChange("isVerified", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange("status", value)}
                  >
                    <SelectTrigger className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 transition-all">
                      <SelectValue placeholder="Any Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Price Range Section - Full Width */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="col-span-full space-y-4"
            >
              <Label className="text-sm font-medium">Price Range</Label>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-lg font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(filters.priceRange[0])}
                  </Badge>
                  <Badge variant="secondary" className="text-lg font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(filters.priceRange[1])}
                  </Badge>
                </div>
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={filters.priceRange}
                  onValueChange={(value) =>
                    handleFilterChange("priceRange", value)
                  }
                  className="w-full"
                />
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
