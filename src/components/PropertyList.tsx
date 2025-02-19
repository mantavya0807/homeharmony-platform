import React, { useMemo } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { Loader2 } from "lucide-react";

interface Property {
  id: string;
  seller_id?: string;
  sellerName?: string;
  sellerAvatarUrl?: string;
  sellerRating?: number;
  title: string;
  description?: string;
  price: number;
  property_type?: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  images?: string[];
  sublease_from?: string;
  sublease_to?: string;
  is_verified?: boolean;
  verification_document_url?: string;
  isSaved?: boolean;
  click_count?: number;
  // Add more fields as needed
}

interface PropertyListProps {
  loading: boolean;
  properties: Property[];
  onSaveToggle?: (propertyId: string) => Promise<void>;
}

/**
 * Renders a grid/list of PropertyCard components
 */
export function PropertyList({
  loading,
  properties,
  onSaveToggle,
}: PropertyListProps) {
  // Filter out any invalid records
  const validProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    return properties.filter((p) => p && typeof p === "object" && p.id);
  }, [properties]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Empty state
  if (validProperties.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No properties found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {validProperties.map((property) => (
        <PropertyCard
          key={property.id}
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
          sellerId={property.seller_id}
          sellerName={property.sellerName}
          sellerAvatarUrl={property.sellerAvatarUrl}
          sellerRating={property.sellerRating}
          click_count={property.click_count}
          onSaveToggle={
            onSaveToggle ? () => onSaveToggle(property.id) : undefined
          }
        />
      ))}
    </div>
  );
}

export default PropertyList;
