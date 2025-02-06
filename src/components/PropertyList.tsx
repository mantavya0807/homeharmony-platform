// src/components/PropertyList.tsx
import { motion } from "framer-motion";
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
  isSaved?: boolean;
  click_count?: number;
}

interface PropertyListProps {
  loading: boolean;
  properties: Property[];
  userLocation?: { 
    city: string; 
    state: string; 
  } | null;
}

export function PropertyList({ loading, properties, userLocation }: PropertyListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!properties?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No properties found.</p>
      </div>
    );
  }

  // Separate and sort properties based on location
  const { localProperties, otherProperties } = properties.reduce(
    (acc, property) => {
      if (userLocation && 
          property.city.toLowerCase() === userLocation.city.toLowerCase() &&
          property.state.toLowerCase() === userLocation.state.toLowerCase()) {
        acc.localProperties.push(property);
      } else {
        acc.otherProperties.push(property);
      }
      return acc;
    },
    { 
      localProperties: [] as Property[], 
      otherProperties: [] as Property[] 
    }
  );

  return (
    <div className="space-y-8">
      {/* Properties in user's location */}
      {localProperties.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Properties in {userLocation?.city}, {userLocation?.state}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localProperties.map((property, index) => (
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
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Properties in other locations */}
      {otherProperties.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Other Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProperties.map((property, index) => (
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
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}