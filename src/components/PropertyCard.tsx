import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Heart, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trackPropertyClick } from '@/utils/trackPropertyClick';

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl: string;
  sublease_from?: string;
  sublease_to?: string;
  is_verified?: boolean;
  views?: number;
}

export function PropertyCard({
  id,
  title,
  price,
  location,
  beds,
  baths,
  sqft,
  imageUrl,
  sublease_from,
  sublease_to,
  is_verified = false,
  views,
}: PropertyCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkIfLiked();
  }, []);

  const checkIfLiked = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: savedProperty } = await supabase
        .from('saved_properties')
        .select()
        .eq('user_id', user.id)
        .eq('property_id', id)
        .single();

      setIsLiked(!!savedProperty);
    } catch (error) {
      console.error('Error checking saved status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save properties",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      if (isLiked) {
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);

        if (error) throw error;
        setIsLiked(false);
        
        toast({
          title: "Property removed from saved list",
          description: "You can always save it again later",
        });
      } else {
        const { error } = await supabase
          .from('saved_properties')
          .insert({
            user_id: user.id,
            property_id: id,
          });

        if (error) throw error;
        setIsLiked(true);

        toast({
          title: "Property saved!",
          description: "You can view it in your saved properties",
        });
      }
    } catch (error) {
      console.error('Error updating saved status:', error);
      toast({
        title: "Error",
        description: "Failed to update saved status",
        variant: "destructive",
      });
    }
  };

  const getSubLeaseDuration = () => {
    if (!sublease_from || !sublease_to) return null;
    
    const start = new Date(sublease_from);
    const end = new Date(sublease_to);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                  (end.getMonth() - start.getMonth());
    return months;
  };

  const subleaseDuration = getSubLeaseDuration();

  const handleCardClick = async () => {
    try {
      await trackPropertyClick(id);
      navigate(`/properties/${id}`);
    } catch (error) {
      console.error('Error handling property click:', error);
      // Still navigate even if tracking fails
      navigate(`/properties/${id}`);
    }
  };

  return (
    <TooltipProvider>
      <Card 
        className="group overflow-hidden transition-all duration-300 hover:shadow-lg animate-fadeIn cursor-pointer relative"
        onClick={handleCardClick}
      >
        <CardHeader className="p-0">
          <div className="relative h-48">
            <img
              src={imageUrl}
              alt={title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            />
            <Badge className="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded-full shadow-md">
              ${price.toLocaleString()}
            </Badge>
            <AnimatePresence>
              <motion.button
                className={cn(
                  "absolute top-2 left-2 p-2 rounded-full",
                  "bg-background/80 backdrop-blur-sm",
                  "transition-colors hover:bg-background",
                  isLiked ? "text-red-500" : "text-muted-foreground"
                )}
                onClick={handleLikeClick}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isLiked ? "fill-current" : "stroke-current"
                  )}
                />
              </motion.button>
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent className="p-4">
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
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <MapPin size={16} />
            <span className="text-sm line-clamp-1">{location}</span>
          </div>
          {subleaseDuration && (
            <div className="mb-2">
              <Badge variant="secondary">
                {subleaseDuration} month{subleaseDuration !== 1 ? 's' : ''} sublease
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(sublease_from).toLocaleDateString()} - {new Date(sublease_to).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="grid grid-cols-3 gap-4 p-4 border-t">
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
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}