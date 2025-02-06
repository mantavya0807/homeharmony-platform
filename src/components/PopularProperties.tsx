// src/components/PopularProperties.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyCard } from "@/components/PropertyCard";
import { TrendingUp } from "lucide-react";

interface PopularPropertiesProps {
  properties: any[];
  searchLocation?: { 
    city: string; 
    state: string; 
  } | null;
}

export function PopularProperties({ properties, searchLocation }: PopularPropertiesProps) {
  // First filter by location if searchLocation exists
  const locationFilteredProperties = searchLocation 
    ? properties.filter(property => 
        property.city.toLowerCase() === searchLocation.city.toLowerCase() &&
        property.state.toLowerCase() === searchLocation.state.toLowerCase()
      )
    : properties;

  // Then get popular properties from filtered list
  const popularProperties = locationFilteredProperties
    .filter(property => property.click_count > 0)
    .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
    .slice(0, 6);

  if (popularProperties.length === 0) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/10 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {searchLocation 
            ? `Popular Properties in ${searchLocation.city}, ${searchLocation.state}`
            : 'Popular Properties'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularProperties.map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              location={`${property.city}, ${property.state}`}
              imageUrl={property.images?.[0]}
              views={property.click_count || 0}
              className="bg-background"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}