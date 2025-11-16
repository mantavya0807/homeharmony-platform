import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ArrowLeft, 
  Bed, 
  Bath, 
  Square, 
  Home,
  Star,
  MapPin,
  Calendar,
  Building,
  MessageSquare,
  ArrowRight 
} from "lucide-react";
import { useSavedStatus } from "@/hooks/useSavedStatus";
import { ComplexCard } from "@/components/ComplexCard";
import { VerificationDetails } from "@/components/VerificationDetails";
import { PaymentButton } from "@/components/PaymentButton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < Math.floor(rating) 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300"
          )}
        />
      ))}
      <span className="text-sm text-muted-foreground ml-2">
        ({rating.toFixed(1)})
      </span>
    </div>
  );
};

export default function PropertyDetailsOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // UI State for cursor glow and image selection
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // Data State
  const [property, setProperty] = useState<any>(null);
  const [sellerRating, setSellerRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { isSaved, loading: savingLoading, toggleSave } = useSavedStatus(id!);

  // Mouse tracking for glow effect
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

  // Fetch property and user data
  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user role if exists
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          setUserRole(profile?.role || null);
        }

        // Get property details with seller and housing complex data
        const { data: propertyData, error } = await supabase
          .from("properties")
          .select(`
            *,
            seller:seller_id (
              id,
              full_name,
              avatar_url,
              bio
            ),
            housing_complex:housing_complex_id (
              *,
              housing_complex_reviews (
                id, rating
              )
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setProperty(propertyData);

        // Fetch seller rating
        const { data: ratings } = await supabase
          .from("seller_reviews")
          .select("rating")
          .eq("seller_id", propertyData.seller.id);
        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
          setSellerRating(avg);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-background text-foreground py-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Glow Effect */}
      <div 
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(66,153,225,0.15), transparent)`,
          opacity: isHovered ? 1 : 0.7,
        }}
      />

      {/* Header with Back Button and Title */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {property.title}
          </motion.h1>
        </div>
      </div>

      {/* Featured Image with Thumbnail Strip */}
      <div className="container mx-auto px-4 mb-12">
        <motion.div 
          className="relative rounded-xl overflow-hidden h-[400px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={property.images[selectedImage]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
            {property.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={cn(
                  "h-16 w-16 rounded-lg overflow-hidden border-2 transition-all",
                  selectedImage === idx 
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main Grid Layout */}
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Property & Verification Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Details Card */}
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="bg-accent/50 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold">Property Details</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-2 text-sm">
                    <MapPin className="h-4 w-4" /> {fullAddress}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${property.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-accent/50">
                  <Bed className="h-6 w-6 text-primary mb-2" />
                  <div className="text-lg font-semibold">{property.bedrooms}</div>
                  <div className="text-xs text-muted-foreground">Bedrooms</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-accent/50">
                  <Bath className="h-6 w-6 text-primary mb-2" />
                  <div className="text-lg font-semibold">{property.bathrooms}</div>
                  <div className="text-xs text-muted-foreground">Bathrooms</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-accent/50">
                  <Square className="h-6 w-6 text-primary mb-2" />
                  <div className="text-lg font-semibold">{property.square_feet}</div>
                  <div className="text-xs text-muted-foreground">Sq Ft</div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-accent/50">
                  <Building className="h-6 w-6 text-primary mb-2" />
                  <div className="text-lg font-semibold capitalize">{property.property_type}</div>
                  <div className="text-xs text-muted-foreground">Type</div>
                </div>
              </div>

              <div className="prose dark:prose-invert mb-6">
                <h3 className="text-lg font-semibold">About this Property</h3>
                <p>{property.description}</p>
              </div>

              {property.sublease_from && property.sublease_to && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-accent/50 mb-6">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Lease Period</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(property.sublease_from).toLocaleDateString()} - {new Date(property.sublease_to).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Details */}
              <VerificationDetails
                isVerified={property.is_verified}
                leaseInfo={{
                  originalRent: property.original_lease_rent,
                  leaseTerm: property.original_lease_term,
                  startDate: property.sublease_from,
                  endDate: property.sublease_to,
                  rentDifferential: property.rent_differential,
                }}
              />

              {/* Purchase Section */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-lg">
                    Total: ${ (property.price * 1.05).toLocaleString() }
                  </span>
                  <span className="text-sm text-muted-foreground">Includes fees</span>
                </div>
                {userRole === "buyer" && (
                  <PaymentButton
                    propertyId={property.id}
                    propertyTitle={property.title}
                    sellerId={property.seller.id}
                    amount={property.price * 1.05}
                    onSuccess={() => navigate("/dashboard")}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Seller and Housing Complex */}
        <div className="space-y-8">
          {/* Seller Details Card */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl font-bold">About the Seller</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={property.seller.avatar_url} alt={property.seller.full_name} />
                  <AvatarFallback>{property.seller.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{property.seller.full_name}</h3>
                  {property.seller.bio && (
                    <p className="text-sm text-muted-foreground">{property.seller.bio}</p>
                  )}
                  {sellerRating !== null && <StarRating rating={sellerRating} />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate(`/seller/${property.seller.id}`)}
                  variant="outline"
                  className="w-full"
                >
                  View Profile
                </Button>
                <Button 
                  className="w-full"
                  onClick={() => navigate('/chat', { state: { sellerId: property.seller.id } })}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Housing Complex Card */}
          {property.housing_complex ? (
            <ComplexCard
              complex={{
                ...property.housing_complex,
                reviews: property.housing_complex.housing_complex_reviews || [],
                average_rating:
                  property.housing_complex.housing_complex_reviews?.length > 0
                    ? property.housing_complex.housing_complex_reviews.reduce(
                        (acc: number, rev: any) => acc + rev.rating,
                        0
                      ) / property.housing_complex.housing_complex_reviews.length
                    : 0,
              }}
              userRole={userRole}
              onSelect={() => {}}
            />
          ) : (
            <Card className="p-6">
              <CardHeader>
                <CardTitle>No Housing Complex</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This property is not part of an apartment complex.</p>
              </CardContent>
            </Card>
          )}
          
          {/* Actions Card */}
          <Card>
            <CardContent className="p-6">
              <motion.button
                onClick={toggleSave}
                className={cn(
                  "w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors",
                  isSaved ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                )}
                disabled={savingLoading}
              >
                {savingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : isSaved ? (
                  "Saved"
                ) : (
                  "Save Property"
                )}
              </motion.button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
