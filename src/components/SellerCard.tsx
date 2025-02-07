import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SellerProfileDialogProps {
  seller: {
    id: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    average_rating?: number;
    total_reviews?: number;
    properties?: any[];
  };
  triggerClassName?: string;
}

export default function SellerProfileDialog({ seller, triggerClassName }: SellerProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const initials = seller.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger Avatar */}
      <motion.button
        className={cn(
          "transition-transform hover:scale-105 focus:outline-none",
          triggerClassName
        )}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Avatar className="h-6 w-6">
          <AvatarImage src={seller.avatar_url} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </motion.button>

      {/* Dialog Content */}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <Card>
          <CardContent className="p-6">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={seller.avatar_url} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{seller.full_name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  {seller.average_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">
                        {seller.average_rating.toFixed(1)} ({seller.total_reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/chat`, { state: { sellerId: seller.id } });
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/seller/${seller.id}`);
                  }}
                >
                  View Full Profile
                </Button>
              </div>
            </div>

            {/* Bio Section */}
            {seller.bio && (
              <div className="mb-6">
                <p className="text-muted-foreground">{seller.bio}</p>
              </div>
            )}

            {/* Properties Preview */}
            {seller.properties && seller.properties.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Latest Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seller.properties.slice(0, 2).map((property) => (
                    <PropertyCard
                      key={property.id}
                      {...property}
                      location={`${property.city}, ${property.state}`}
                      imageUrl={property.images?.[0]}
                      beds={property.bedrooms}
                      baths={property.bathrooms}
                      sqft={property.square_feet}
                    />
                  ))}
                </div>
                {seller.properties.length > 2 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="link"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/seller/${seller.id}`);
                      }}
                    >
                      View All Properties ({seller.properties.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}