import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl: string;
  userRole?: string | null;
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
}: PropertyCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fadeIn cursor-pointer group relative"
      onClick={() => navigate(`/properties/${id}`)}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
          />
          <Badge className="absolute top-2 right-2 bg-primary">
            ${price.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
        <div className="flex items-center gap-1 mt-2 text-muted-foreground">
          <MapPin size={16} />
          <span className="text-sm line-clamp-1">{location}</span>
        </div>
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
  );
}