import { PropertyCard } from "./PropertyCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function PropertyList({ location, filters }) {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties", location, filters],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply location filter if provided
      if (location) {
        query = query.or(
          `city.ilike.%${location}%,state.ilike.%${location}%,zip_code.ilike.%${location}%`
        );
      }

      // Apply bed filter
      if (filters?.beds && filters.beds !== 'any') {
        query = query.gte('bedrooms', parseInt(filters.beds));
      }

      // Apply bath filter
      if (filters?.baths && filters.baths !== 'any') {
        query = query.gte('bathrooms', parseInt(filters.baths));
      }

      // Apply square feet filter
      if (filters?.minSquareFeet) {
        query = query.gte('square_feet', parseInt(filters.minSquareFeet));
      }
      if (filters?.maxSquareFeet) {
        query = query.lte('square_feet', parseInt(filters.maxSquareFeet));
      }

      // Apply price range filter
      if (filters?.priceRange) {
        // Make sure to handle price range as numbers
        const [minPrice, maxPrice] = filters.priceRange;
        query = query
          .gte('price', minPrice)
          .lte('price', maxPrice);

        console.log('Applying price filter:', minPrice, maxPrice); // Debug log
      }

      const { data, error } = await query;
      if (error) throw error;

      // Double-check the filtering on the client side for price
      const filteredData = data.filter(property => {
        const price = property.price;
        const [minPrice, maxPrice] = filters.priceRange;
        return price >= minPrice && price <= maxPrice;
      });

      return filteredData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!properties?.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No properties found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          id={property.id}
          title={property.title}
          price={property.price}
          location={`${property.city}, ${property.state}`}
          beds={property.bedrooms}
          baths={property.bathrooms}
          sqft={property.square_feet}
          imageUrl={property.images?.[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
        />
      ))}
    </div>
  );
}