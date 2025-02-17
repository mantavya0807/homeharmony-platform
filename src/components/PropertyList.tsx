import { useMemo } from 'react';
import { PropertyCard } from "@/components/PropertyCard";
import { Loader2 } from "lucide-react";

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images: string[];
  property_type: string;
  saved_properties?: { id: string }[];
  isSaved?: boolean;
  click_count?: number;
}

interface PropertyListProps {
  loading: boolean;
  properties: Property[];
  userLocation?: {
    lat: number;
    lng: number;
  } | null;
}

export function PropertyList({ loading, properties, userLocation }: PropertyListProps) {
  // Move any hooks to the top level
  const validProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    
    return properties.filter(property => 
      property && typeof property === 'object' && 'id' in property
    );
  }, [properties]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Render empty state
  if (validProperties.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No properties found.</p>
      </div>
    );
  }

  // Render property list
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {validProperties.map((property) => (
        <PropertyCard
          key={property.id}
          id={property.id}
          title={property.title || "Untitled Property"}
          price={property.price || 0}
          location={`${property.city || ""}, ${property.state || ""}`}
          imageUrl={property.images?.[0]}
          beds={property.bedrooms || 0}
          baths={property.bathrooms || 0}
          sqft={property.square_feet || 0}
          isSaved={property.isSaved}
          views={property.click_count}
        />
      ))}
    </div>
  );
}