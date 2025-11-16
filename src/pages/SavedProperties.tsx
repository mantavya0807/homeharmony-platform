import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { PropertyCard } from "@/components/PropertyCard";
import { useTheme } from "next-themes";

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
    status: string;
  };
}

export default function SavedProperties() {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedProperties();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getGlowStyles = () => {
    const lightGlow = `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
      rgba(30, 64, 175, 0.15), 
      rgba(59, 130, 246, 0.1), 
      transparent)`;
    const darkGlow = `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
      rgba(66, 153, 225, 0.15), 
      transparent)`;
    return {
      background: theme === "dark" ? darkGlow : lightGlow,
      opacity: isHovered ? 1 : 0.7,
    };
  };

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
            images,
            status
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
      <div ref={containerRef} className="relative min-h-screen overflow-hidden pt-24">
        {/* Background gradients and glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        {theme !== "dark" && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-70" />
        )}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={getGlowStyles()}
        />

        <div className="relative container mx-auto px-4 py-16">
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
            <h2 className="mt-6 text-2xl font-semibold text-blue-900 dark:text-white">
              No Saved Properties
            </h2>
            <p className="mt-2 text-muted-foreground max-w-sm">
              Properties you save will appear here. Click the heart icon on any property to save it for later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden pt-19">
      {/* Background gradients and glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      {theme !== "dark" && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-70" />
      )}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={getGlowStyles()}
      />

      <div className="relative container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-900 dark:text-white">
          Saved Properties
        </h1>
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
    </div>
  );
}
  