import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Square,
  Star,
  Eye,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ImageGallery from "@/components/ImageGallery";
import { trackPropertyClick } from "@/utils/trackPropertyClick";

export interface PopularPropertyCardProps {
  id: string;
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
  sellerId?: string;
  sellerName?: string;
  sellerAvatarUrl?: string;
  sellerRating?: number;
  click_count?: number;
  onSaveToggle?: () => Promise<void>;
}

export function PopularPropertyCard({
  id,
  title,
  description,
  price,
  property_type,
  bedrooms,
  bathrooms,
  square_feet,
  address,
  city,
  state,
  zip_code,
  images,
  sublease_from,
  sublease_to,
  is_verified,
  verification_document_url,
  isSaved,
  sellerId,
  sellerName,
  sellerAvatarUrl,
  sellerRating,
  click_count,
  onSaveToggle,
}: PopularPropertyCardProps) {
  const navigate = useNavigate();

  const handleSellerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sellerId) {
      navigate(`/seller/${sellerId}`);
    }
  };

  const handleCardClick = async () => {
    try {
      await trackPropertyClick(id);
      navigate(`/properties/${id}`);
    } catch (error) {
      console.error("Error tracking property click:", error);
      navigate(`/properties/${id}`);
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer w-full"
    >
      <Card className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow w-full">
        <CardHeader className="p-0 relative h-48">
          {images && images.length > 1 ? (
            <ImageGallery
              photos={images}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <img
              src={images?.[0] || "/placeholder.jpg"}
              alt={title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          )}

          {/* Price Badge */}
          <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-blue-950 to-blue-700 text-white px-4 py-1 rounded-full shadow-md">
            ${price.toLocaleString()}
          </Badge>

          {/* Save Button */}
          {onSaveToggle && (
            <AnimatePresence>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToggle();
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-transform hover:scale-110"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileTap={{ scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Heart
                  className={`h-6 w-6 ${
                    isSaved
                      ? "fill-red-500 text-red-500"
                      : "stroke-current text-gray-600 dark:text-gray-300"
                  }`}
                />
              </motion.button>
            </AnimatePresence>
          )}

          {/* Verified Badge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 left-2 flex items-center bg-white/80 dark:bg-black/50 rounded-full px-2 py-0.5 text-sm">
                  {is_verified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-blue-500">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-yellow-500">Unverified</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-3">
                {is_verified
                  ? "This property has been verified."
                  : "Verification pending."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>

        <CardContent className="p-3">
          <h3 className="text-lg font-bold line-clamp-1">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {address}, {city}, {state} {zip_code || ""}
            </span>
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1 text-sm">
              <Bed className="h-4 w-4" />
              <span>{bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Bath className="h-4 w-4" />
              <span>{bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Square className="h-4 w-4" />
              <span>{square_feet} sqft</span>
            </div>
            {property_type && (
              <Badge variant="outline" className="text-xs">
                {property_type}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-3 border-t flex justify-between items-center">
          {sellerId && sellerName && (
            <div
              onClick={handleSellerClick}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={sellerAvatarUrl} alt={sellerName} />
                <AvatarFallback>
                  {sellerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{sellerName}</span>
                {sellerRating !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="h-3 w-3 text-yellow-400" />
                    {sellerRating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          )}
          {typeof click_count === "number" && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Eye className="h-4 w-4" /> {click_count} views
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default PopularPropertyCard;
