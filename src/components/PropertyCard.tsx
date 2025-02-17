import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  HashIcon, 
  CheckCircle, 
  AlertTriangle, 
  Heart, 
  Eye, 
  Star 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trackPropertyClick } from "@/utils/trackPropertyClick";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  unit: string;
  imageUrl?: string;
  roomTag?: string;
  sublease_from?: string;
  sublease_to?: string;
  is_verified?: boolean;
  views?: number;
  sellerId?: string;
  sellerName?: string;
  sellerAvatarUrl?: string;
  sellerRating?: number;
  isSaved?: boolean;
  onSaveToggle?: () => Promise<void>;
}

export function PropertyCard({
  id,
  title,
  price,
  location,
  beds,
  baths,
  sqft,
  unit,
  imageUrl = "/placeholder.jpg",
  roomTag,
  sublease_from,
  sublease_to,
  is_verified,
  views,
  sellerId,
  sellerName,
  sellerAvatarUrl,
  sellerRating,
  isSaved,
  onSaveToggle
}: PropertyCardProps) {
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
      console.error("Error handling property click:", error);
      navigate(`/properties/${id}`);
    }
  };

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg animate-fadeIn cursor-pointer relative"
      onClick={handleCardClick}
    >
      <CardHeader className="p-0">
        <div className="relative h-48">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Price Badge */}
          <Badge className="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-full shadow-md">
            ${price.toLocaleString()}
          </Badge>
          
          {/* Like Button */}
          {onSaveToggle && (
            <AnimatePresence>
              <motion.button
                className={cn(
                  "absolute top-2 right-16 p-2 rounded-full",
                  "bg-background/80 backdrop-blur-sm",
                  "transition-colors hover:bg-background",
                  isSaved ? "text-red-500" : "text-muted-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToggle();
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isSaved ? "fill-current" : "stroke-current"
                  )}
                />
              </motion.button>
            </AnimatePresence>
          )}

          {/* Room Tag */}
          {roomTag && (
            <Badge className="absolute bottom-2 left-2 bg-secondary text-white px-2 py-1 text-xs rounded shadow-md">
              {roomTag}
            </Badge>
          )}

          {/* Verification Status with Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute left-2 top-2 flex items-center bg-white/80 dark:bg-black/50 rounded-full px-2 py-0.5 space-x-1 text-sm cursor-help">
                  {is_verified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-500">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-500">Unverified</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                {is_verified ? (
                  <p>This property's lease documents have been verified by our system. Rent, dates, and details match the original lease.</p>
                ) : (
                  <p>This property's lease documents are pending verification. Exercise caution and request documentation before proceeding.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
            {views !== undefined && (
              <motion.div
                className="flex items-center gap-1 text-muted-foreground text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Eye className="h-4 w-4" />
                {views} views
              </motion.div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin size={16} />
            <span className="text-sm line-clamp-1">{location}</span>
          </div>

          {/* Seller Info */}
          {sellerId && sellerName && (
            <div 
              onClick={handleSellerClick}
              className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors mt-1"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={sellerAvatarUrl} alt={sellerName} />
                <AvatarFallback>{sellerName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{sellerName}</span>
                {sellerRating && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {sellerRating.toFixed(1)} rating
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sublease Period */}
          {sublease_from && sublease_to && (
            <div className="text-sm text-muted-foreground mt-1">
              <span>Sublease period: </span>
              <span className="font-medium">
                {new Date(sublease_from).toLocaleDateString()} - {new Date(sublease_to).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-4 gap-4 p-4 border-t">
        <div className="flex items-center gap-1">
          <Bed size={16} />
          <span className="text-sm">{beds} beds</span>
        </div>
        <div className="flex items-center gap-1">
          <Bath size={16} />
          <span className="text-sm">{baths} baths</span>
        </div>
        <div className="flex items-center gap-1">
          <Square size={16} />
          <span className="text-sm">{sqft} sqft</span>
        </div>
        <div className="flex items-center gap-1">
          <HashIcon size={16} />
          <span className="text-sm">{unit} Unit</span>
        </div>
      </CardFooter>
    </Card>
  );
}