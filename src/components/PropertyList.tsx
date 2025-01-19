import { PropertyCard } from "./PropertyCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function PropertyList() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties?.map((property) => (
        <PropertyCard
          key={property.id}
          title={property.title}
          price={property.price}
          location={`${property.city}, ${property.state}`}
          beds={property.bedrooms}
          baths={property.bathrooms}
          sqft={property.square_feet}
          imageUrl={property.images[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
        />
      ))}
    </div>
  );
}