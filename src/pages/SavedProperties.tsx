import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { PropertyCard } from "@/components/PropertyCard";

interface SavedProperty {
  property: {
    id: string;
    title: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    square_feet: number;
    city: string;
    state: string;
    images: string[];
  };
}

export default function SavedProperties() {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedProperties();
  }, []);

  const fetchSavedProperties = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_properties")
        .select(
          `
          property:properties (
            id,
            title,
            price,
            bedrooms,
            bathrooms,
            square_feet,
            city,
            state,
            images
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedProperties(data || []);
    } catch (error) {
      console.error("Error fetching saved properties:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (savedProperties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            <Heart className="w-16 h-16 text-muted-foreground/50" />
          </motion.div>
          <h2 className="mt-6 text-2xl font-semibold">No Saved Properties</h2>
          <p className="mt-2 text-muted-foreground max-w-sm">
            Properties you save will appear here. Click the heart icon on any
            property to save it for later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Saved Properties</h1>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {savedProperties.map(({ property }) => (
          <PropertyCard
            key={property.id}
            id={property.id}
            title={property.title}
            price={property.price}
            location={`${property.city}, ${property.state}`}
            beds={property.bedrooms}
            baths={property.bathrooms}
            sqft={property.square_feet}
            imageUrl={
              property.images?.[0] ||
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
            }
          />
        ))}
      </motion.div>
    </div>
  );
}
