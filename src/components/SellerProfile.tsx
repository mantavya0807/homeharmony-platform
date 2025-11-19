// SellerProfile.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Home } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reply?: string;
  reviewer: {
    full_name: string;
    avatar_url?: string;
  };
  property_id: string;
  property?: {
    title: string;
  };
}

interface SellerProfileData {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  average_rating?: number;
  total_reviews: number;
  total_properties: number;
}

// Variants for staggered animations on lists
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }, // You can also adjust the duration here
};

export function SellerProfile() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SellerProfileData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [newReview, setNewReview] = useState({
    rating: 0,
    review_text: "",
  });

  // For decorative background similar to Hero
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

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
    const lightGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(30, 64, 175, 0.15), 
        rgba(59, 130, 246, 0.1), 
        transparent
      )
    `;
    const darkGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(66, 153, 225, 0.15), 
        transparent
      )
    `;
    return {
      background: darkGlow, // Adjust if you have theme handling
      opacity: isHovered ? 1 : 0.7,
    };
  };

  useEffect(() => {
    if (!sellerId) return;
    async function fetchSellerProfile() {
      try {
        // Get current user details
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          setCurrentUserId(authData.user.id);
          const { data: userData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();
          setUserRole(userData?.role);
        }

        // Get seller profile
        const { data: sellerProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sellerId)
          .single();

        if (profileError) throw profileError;
        if (!sellerProfile) {
          setLoading(false);
          return;
        }

        // Get seller reviews with property information
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("seller_reviews")
          .select(
            `
            *,
            reviewer:profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url),
            property:properties(title)
          `
          )
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false });

        if (reviewsError) throw reviewsError;

        // Get seller properties
        const { data: propertiesData, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .eq("seller_id", sellerId);

       if (propsError) {
         console.error("Properties fetch error:", propsError);
       } else {
         console.log("Fetched properties:", propertiesData);
       }

        // Calculate average rating
        const averageRating = reviewsData?.length
          ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length
          : 0;

        setProfile({
          ...sellerProfile,
          average_rating: averageRating,
          total_reviews: reviewsData?.length || 0,
          total_properties: propertiesData?.length || 0,
        });
        setReviews(reviewsData || []);
        setProperties(propertiesData || []);
      } catch (error) {
        console.error("Error fetching seller profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSellerProfile();
  }, [sellerId]);

  const submitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast({
        title: "Error",
        description: "Please select a property to review",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        navigate("/auth");
        return;
      }

      // Check if a review already exists for this property
      const { data: existingReview } = await supabase
        .from("seller_reviews")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("reviewer_id", authData.user.id)
        .eq("property_id", selectedPropertyId)
        .maybeSingle();

      if (existingReview) {
        toast({
          title: "Error",
          description: "You have already reviewed this property",
          variant: "destructive",
        });
        return;
      }

      // Insert new review
      const { error } = await supabase.from("seller_reviews").insert({
        seller_id: sellerId,
        reviewer_id: authData.user.id,
        property_id: selectedPropertyId,
        rating: newReview.rating,
        review_text: newReview.review_text,
      });

      if (error) throw error;

      // Refresh reviews
      const { data: reviewsData } = await supabase
        .from("seller_reviews")
        .select(
          `
            *,
            reviewer:profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url),
            property:properties(title)
          `
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      setReviews(reviewsData || []);
      setShowReviewForm(false);
      setNewReview({ rating: 0, review_text: "" });
      setSelectedPropertyId("");

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium">Loading Seller Profile...</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium">Seller not found</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient and glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={getGlowStyles()}
      />

      {/* Main Content */}
      <div className="relative pt-32 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
                  <AvatarFallback>{profile.full_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                  <CardDescription>
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </CardDescription>
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">
                        {profile.average_rating?.toFixed(1)} ({profile.total_reviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span className="text-sm">{profile.total_properties} properties</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {profile.bio && (
                <p className="text-muted-foreground mb-6">{profile.bio}</p>
              )}

              {/* Write a Review section (only for buyers) */}
              {userRole === "buyer" && (
                <div className="mb-6">
                  <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                    {showReviewForm ? "Cancel Review" : "Write a Review"}
                  </Button>
                  {showReviewForm && (
                    <form onSubmit={submitReview} className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="property_id" className="block mb-1">
                          Select Property
                        </Label>
                        <select
                          name="property_id"
                          id="property_id"
                          className="border p-2 rounded w-full"
                          required
                          value={selectedPropertyId}
                          onChange={(e) => setSelectedPropertyId(e.target.value)}
                        >
                          <option value="">Select a property</option>
                          {properties.map((prop: any) => (
                            <option key={prop.id} value={prop.id}>
                              {prop.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="rating" className="block mb-1">
                          Rating (1-5)
                        </Label>
                        <Input
                          type="number"
                          name="rating"
                          id="rating"
                          min="1"
                          max="5"
                          required
                          className="w-full"
                          value={newReview.rating}
                          onChange={(e) =>
                            setNewReview({ ...newReview, rating: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="comment" className="block mb-1">
                          Comment
                        </Label>
                        <textarea
                          name="comment"
                          id="comment"
                          required
                          className="border p-2 rounded w-full"
                          rows={4}
                          value={newReview.review_text}
                          onChange={(e) =>
                            setNewReview({ ...newReview, review_text: e.target.value })
                          }
                        />
                      </div>
                      <Button type="submit">Submit Review</Button>
                    </form>
                  )}
                </div>
              )}

              {/* Reviews Section */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold mb-2">Reviews</h3>
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <motion.div key={review.id} variants={itemVariants}>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={review.reviewer.avatar_url || ""}
                                  alt={review.reviewer.full_name}
                                />
                                <AvatarFallback>
                                  {review.reviewer.full_name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{review.reviewer.full_name}</p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-4">{review.review_text}</p>
                          {review.reply && (
                            <div className="mt-4 p-2 border rounded bg-white-50">
                              <p className="text-sm">
                                <strong>Reply:</strong> {review.reply}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No reviews yet.</p>
                )}
              </motion.div>

              {/* Properties Section */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mt-8"
              >
                <h3 className="text-lg font-semibold mb-4">
                  Properties by {profile.full_name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <motion.div key={property.id} variants={itemVariants}>
                      <PropertyCard
                        key={property.id}
                        id={property.id}
                        title={property.title}
                        description={property.description}
                        price={property.price}
                        property_type={property.property_type}
                        bedrooms={property.bedrooms}
                        bathrooms={property.bathrooms}
                        square_feet={property.square_feet}
                        address={property.address}
                        city={property.city}
                        state={property.state}
                        zip_code={property.zip_code}
                        images={property.images}
                        sublease_from={property.sublease_from}
                        sublease_to={property.sublease_to}
                        is_verified={property.is_verified}
                        sellerId={property.seller_id}
                        sellerName={profile.full_name}
                        sellerAvatarUrl={profile.avatar_url}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-100 to-transparent dark:from-primary/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
      </div>
    </div>
  );
}
