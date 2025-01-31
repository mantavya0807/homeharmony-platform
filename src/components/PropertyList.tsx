import { PropertyCard } from "./PropertyCard";
import { PropertyCard as SellerPropertyCard } from "./PropertyCard1";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export function PropertyList({ location, filters }) {
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get user role on component mount
  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error(profileError);
          return;
        }

        setUserRole(profile?.role || null);
      }
    };

    getUserRole();
  }, []);

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

      // Apply property type filter
      if (filters.propertyType && filters.propertyType !== 'any') {
        query = query.eq("property_type", filters.propertyType);
      }

      // Apply bed filter
      if (filters.beds && filters.beds !== 'any') {
        query = query.gte('bedrooms', parseInt(filters.beds));
      }

      // Apply bath filter
      if (filters.baths && filters.baths !== 'any') {
        query = query.gte('bathrooms', parseInt(filters.baths));
      }

      // Apply square feet filter
      if (filters.minSquareFeet) {
        query = query.gte('square_feet', parseInt(filters.minSquareFeet));
      }
      if (filters.maxSquareFeet) {
        query = query.lte('square_feet', parseInt(filters.maxSquareFeet));
      }

      // Apply price range filter
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange;
        query = query
          .gte('price', minPrice)
          .lte('price', maxPrice);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
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

  // Choose which PropertyCard component to use based on role
  const CardComponent = userRole === "seller" ? SellerPropertyCard : PropertyCard;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map((property) => (
        <CardComponent
          key={property.id}
          id={property.id}
          title={property.title}
          price={property.price}
          location={`${property.city}, ${property.state}`}
          beds={property.bedrooms}
          baths={property.bathrooms}
          sqft={property.square_feet}
          imageUrl={property.images?.[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
          userRole={userRole}
          sublease_from={property.sublease_from}
          sublease_to={property.sublease_to}
        />
      ))}
    </div>
  );
}