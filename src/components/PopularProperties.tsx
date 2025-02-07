import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyCard } from "@/components/PropertyCard";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images: string[];
  click_count?: number;
  isSaved?: boolean;
}

interface PopularPropertiesProps {
  properties: Property[];
  searchLocation?: { 
    city: string; 
    state: string; 
  } | null;
}

export function PopularProperties({ properties, searchLocation }: PopularPropertiesProps) {
  // First ensure we have valid properties array
  if (!Array.isArray(properties) || properties.length === 0) {
    return null;
  }

  // Filter and sort properties with click counts
  const propertiesWithClicks = properties.filter(property => {
    if (!property?.city || !property?.state || !searchLocation?.city || !searchLocation?.state) {
      return false;
    }

    return (
      property.city.toLowerCase() === searchLocation.city.toLowerCase() &&
      property.state.toLowerCase() === searchLocation.state.toLowerCase() &&
      typeof property.click_count === 'number' &&
      property.click_count > 0
    );
  });

  // Sort by click count and take top 6
  const popularProperties = propertiesWithClicks
    .sort((a, b) => ((b.click_count || 0) - (a.click_count || 0)))
    .slice(0, 6);

  // If no popular properties in the location, don't show the section
  if (popularProperties.length === 0) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/10 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {searchLocation && (
            <>Popular Properties in {searchLocation.city}, {searchLocation.state}</>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PropertyCard
                {...property}
                location={`${property.city}, ${property.state}`}
                imageUrl={property.images?.[0]}
                beds={property.bedrooms}
                baths={property.bathrooms}
                sqft={property.square_feet}
                views={property.click_count}
                className="bg-background"
              />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}