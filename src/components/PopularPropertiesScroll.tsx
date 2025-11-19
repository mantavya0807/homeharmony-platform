import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PopularPropertyCard from "@/components/PopularPropertyCard";

interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  images: string[];
  is_verified?: boolean;
  verification_document_url?: string;
  isSaved?: boolean;
  seller_id: string;
  sellerName?: string;
  sellerAvatarUrl?: string;
  sellerRating?: number;
  click_count?: number;
}

interface PopularPropertiesProps {
  properties: Property[];
  onSaveToggle: (propertyId: string) => Promise<void>;
}

const PopularPropertiesScroll = ({ properties, onSaveToggle }: PopularPropertiesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-8 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {properties.map((property) => (
          <motion.div
            key={property.id}
            className="min-w-[22rem] flex-shrink-0 snap-center"
            transition={{ duration: 0.2 }}
          >
            <PopularPropertyCard
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
              is_verified={property.is_verified}
              verification_document_url={property.verification_document_url}
              isSaved={property.isSaved}
              sellerId={property.seller_id}
              sellerName={property.sellerName}
              sellerAvatarUrl={property.sellerAvatarUrl}
              sellerRating={property.sellerRating}
              click_count={property.click_count}
              onSaveToggle={() => onSaveToggle(property.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Scroll Gradient Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};

export default React.memo(PopularPropertiesScroll);