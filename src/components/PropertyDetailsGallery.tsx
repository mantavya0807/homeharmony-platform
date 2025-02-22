import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Bed,
  Sofa,
  Bath,
  Utensils,
  FileText,
  Image,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useParams } from "react-router-dom";

interface Property {
  id: string;
  title: string;
  description: string;
  images: string[];
}

interface PropertyMedia {
  id: string;
  property_id: string;
  bedroom: string[] | null;
  living_room: string[] | null;
  bathroom: string[] | null;
  kitchen: string[] | null;
  floorplan: string[] | null;
  other: string[] | null;
  created_at: string;
}

interface RoomCategory {
  id: string;
  icon: React.ReactNode;
  label: string;
  key: keyof PropertyMedia | "all";
}

const ROOM_CATEGORIES: RoomCategory[] = [
  { id: "all", icon: <Camera className="h-4 w-4" />, label: "All Photos", key: "all" },
  { id: "bedroom", icon: <Bed className="h-4 w-4" />, label: "Bedrooms", key: "bedroom" },
  { id: "living_room", icon: <Sofa className="h-4 w-4" />, label: "Living Room", key: "living_room" },
  { id: "bathroom", icon: <Bath className="h-4 w-4" />, label: "Bathrooms", key: "bathroom" },
  { id: "kitchen", icon: <Utensils className="h-4 w-4" />, label: "Kitchen", key: "kitchen" },
  { id: "floorplan", icon: <FileText className="h-4 w-4" />, label: "Floor Plan", key: "floorplan" },
  { id: "other", icon: <Image className="h-4 w-4" />, label: "Other", key: "other" },
];

export default function PropertyDetailsGallery() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [propertyMedia, setPropertyMedia] = useState<PropertyMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!propertyId) {
        setError("No property ID provided.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("id, title, description, images")
          .eq("id", propertyId)
          .single();

        if (propertyError) throw propertyError;
        setProperty(propertyData);

        // Fetch property media (if available)
        const { data: mediaData, error: mediaError } = await supabase
          .from("property_media")
          .select("*")
          .eq("property_id", propertyId)
          .maybeSingle();

        if (mediaError) {
          console.error("Error fetching property media:", mediaError.message);
        }
        setPropertyMedia(mediaData);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [propertyId]);

  const getCurrentImages = () => {
    if (!propertyMedia) {
      return property?.images || [];
    }
    if (selectedCategory === "all") {
      return Object.entries(propertyMedia)
        .filter(([key]) => ROOM_CATEGORIES.some((cat) => cat.key === key))
        .flatMap(([_, urls]) => urls || []);
    }
    return propertyMedia[selectedCategory as keyof PropertyMedia] || [];
  };

  const currentImages = getCurrentImages();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{error || "Could not load property details"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Property Title */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent mb-2">
          {property.title}
        </h1>
        {property.description && <p className="text-muted-foreground">{property.description}</p>}
      </div>

      {/* Category Navigation */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            {ROOM_CATEGORIES.map((category) => {
              const count =
                category.key === "all"
                  ? currentImages.length
                  : propertyMedia?.[category.key]?.length || 0;

              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={cn(
                    "flex items-center gap-2 transition-all",
                    selectedCategory === category.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon}
                  <span>{category.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-8">
        {currentImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentImages.map((image, index) => (
              <motion.div
                key={`${image}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl"
                onClick={() => {
                  setCurrentImageIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={image}
                  alt={`${property.title} - Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Photo {index + 1} of {currentImages.length}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No photos available for this category</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && currentImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg"
          >
            <div className="absolute inset-0 flex flex-col">
              {/* Top Bar */}
              <div className="flex justify-between items-center px-6 py-4 bg-black/50">
                <div className="text-white">
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-sm opacity-80">
                    Photo {currentImageIndex + 1} of {currentImages.length}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Main Image */}
              <div className="flex-1 flex items-center justify-center relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 text-white hover:bg-white/10"
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
                  }
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                <img
                  src={currentImages[currentImageIndex]}
                  alt={`${property.title} - Photo ${currentImageIndex + 1}`}
                  className="max-h-[80vh] max-w-[80vw] object-contain"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 text-white hover:bg-white/10"
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
                  }
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>

              {/* Thumbnail Strip */}
              <div className="bg-black/50 p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {currentImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer transition-all",
                        idx === currentImageIndex ? "ring-2 ring-primary" : "opacity-50 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
