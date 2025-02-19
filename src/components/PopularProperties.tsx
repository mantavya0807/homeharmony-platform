// src/components/PopularProperties.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyCard } from "@/components/PropertyCard";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

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
    .sort((a, b) => (b.click_count || 0) - (a.click_count || 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <TrendingUp className="mr-2" />
          Popular Properties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularProperties.map((property) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="border-2 border-yellow-400 rounded-lg"
              transition={{ duration: 0.3 }}
            >
              {/* Passing all property details to the PropertyCard */}
              <PropertyCard
                id={property.id}
                title={property.title}
                description={property.description}
                price={property.price}
                property_type={property.property_type}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                square_feet={property.square_feet}
                address={property.address}
                city={property.city}
                state={property.state}
                zip_code={property.zip_code}
                images={property.images}
                sublease_from={property.sublease_from}
                sublease_to={property.sublease_to}
                is_verified={property.is_verified}
                verification_document_url={property.verification_document_url}
                isSaved={property.isSaved}
                sellerId={property.sellerId}
                sellerName={property.sellerName}
                sellerAvatarUrl={property.sellerAvatarUrl}
                sellerRating={property.sellerRating}
                click_count={property.click_count}
                onSaveToggle={property.onSaveToggle}
                // Spread any extra properties
                {...property}
              />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}