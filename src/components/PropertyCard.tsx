import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export interface PropertyCardProps {
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
  status?: string;
  onSaveToggle?: () => Promise<void>;
}

export function PropertyCard({
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
  status,
  sellerAvatarUrl,
  sellerRating,
  click_count,
  onSaveToggle,
}: PropertyCardProps) {
  const navigate = useNavigate();

  // Local state for saved/like status.
  const [saved, setSaved] = useState<boolean>(isSaved ?? false);

  // Clicking anywhere on the card opens the property details
  const handleCardClick = async () => {
    try {
      await trackPropertyClick(id);
      navigate(`/properties/${id}`);
    } catch (error) {
      console.error("Error tracking property click:", error);
      navigate(`/properties/${id}`);
    }
  };

  // Clicking on the seller avatar navigates to seller profile
  const handleSellerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sellerId) {
      navigate(`/seller/${sellerId}`);
    }
  };

  // Handle saving/liking the property.
  const handleSaveToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Optimistically update the UI
    setSaved((prev) => !prev);
    if (onSaveToggle) {
      try {
        await onSaveToggle();
      } catch (error) {
        console.error("Error toggling save:", error);
        // Optionally revert the change if there's an error.
        setSaved((prev) => !prev);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="relative group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_200px_at_center,rgba(59,130,246,0.05),transparent)]" />
      </div>

      <Card
        className={cn(
          "relative overflow-hidden rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
          "shadow hover:shadow-xl transition-shadow"
        )}
      >
        {/* Card Header with image gallery */}
        <CardHeader className="p-0 relative">
          <div className="relative h-48 overflow-hidden">
            {images && images.length > 1 ? (
              <ImageGallery
                photos={images}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <img
                src={images?.[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"}
                alt={title}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
            )}

            {/* Price Badge */}
            <Badge
              variant="secondary"
              className="absolute bottom-2 left-2 bg-gradient-to-r from-blue-950 to-blue-700 text-white px-3 py-1 rounded-full shadow-md"
            >
              ${price.toLocaleString()}
            </Badge>

            {/* Sold Badge */}
            {status === "sold" && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full shadow-md">
                SOLD
              </Badge>
            )}

            {/* Save (Like) Button */}
            {onSaveToggle && (
              <AnimatePresence>
                <motion.button
                  key={saved ? "saved" : "unsaved"}
                  onClick={handleSaveToggle}
                  className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-transform hover:scale-110"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileTap={{ scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-colors",
                      saved
                        ? "fill-red-500 text-red-500"
                        : "stroke-current text-gray-600 dark:text-gray-300"
                    )}
                  />
                </motion.button>
              </AnimatePresence>
            )}

            {/* Verified/Unverified Badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute top-2 left-2 flex items-center px-2 py-0.5 text-sm rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm">
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
                <TooltipContent className="max-w-xs p-3">
                  {is_verified
                    ? "This property has been verified by documentation."
                    : "Verification not confirmed. Request documentation from the seller."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="p-3 space-y-3">
          <div>
            <h3 className="text-base font-semibold line-clamp-1">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {address}, {city}, {state} {zip_code || ""}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-1 text-xs">
              <Bed className="h-4 w-4" />
              <span>{bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Bath className="h-4 w-4" />
              <span>{bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Square className="h-4 w-4" />
              <span>{square_feet} sqft</span>
            </div>
            {property_type && (
              <Badge variant="outline" className="text-xs">
                {property_type}
              </Badge>
            )}
          </div>

          {sublease_from && sublease_to && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Sublease: {new Date(sublease_from).toLocaleDateString()} –{" "}
              {new Date(sublease_to).toLocaleDateString()}
            </div>
          )}
        </CardContent>

        {/* Card Footer with Seller Info and Views */}
        <CardFooter className="p-3 border-t flex justify-between items-center">
          {sellerId && sellerName && (
            <div
              onClick={handleSellerClick}
              className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 p-1 rounded transition-colors"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={sellerAvatarUrl} alt={sellerName} />
                <AvatarFallback>
                  {sellerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-medium">{sellerName}</span>
                {sellerRating !== undefined && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <Star className="h-3 w-3 text-yellow-400" />
                    {sellerRating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          )}
          {typeof click_count === "number" && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Eye className="h-4 w-4" /> {click_count} views
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default PropertyCard;
