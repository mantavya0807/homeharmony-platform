// SellerProfile.tsx
import { useEffect, useState } from "react";
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
    review_text: ''
  });

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
          .select(`
            *,
            reviewer:profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url),
            property:properties(title)
          `)
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false });

        if (reviewsError) throw reviewsError;

        // Get seller properties
        const { data: propertiesData, error: propsError } = await supabase
          .from("properties")
          .select("*")
          .eq("seller_id", sellerId);

        if (propsError) throw propsError;

        // Calculate average rating
        const averageRating = reviewsData?.length 
          ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length 
          : 0;

        setProfile({
          ...sellerProfile,
          average_rating: averageRating,
          total_reviews: reviewsData?.length || 0,
          total_properties: propertiesData?.length || 0
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
      const { error } = await supabase
        .from("seller_reviews")
        .insert({
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
        .select(`
          *,
          reviewer:profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url),
          property:properties(title)
        `)
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      setReviews(reviewsData || []);
      setShowReviewForm(false);
      setNewReview({ rating: 0, review_text: '' });
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
    return <div className="p-4">Loading Seller Profile...</div>;
  }
  if (!profile) {
    return <div className="p-4">Seller not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
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
          {profile.bio && <p className="text-muted-foreground mb-6">{profile.bio}</p>}

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
          setNewReview({
            ...newReview,
            rating: Number(e.target.value),
          })
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
          setNewReview({
            ...newReview,
            review_text: e.target.value,
          })
        }
      />
    </div>
    <Button type="submit">Submit Review</Button>
  </form>
)}
            </div>
          )}

          {/* Reviews Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Reviews</h3>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.reviewer.avatar_url || ""} alt={review.reviewer.full_name} />
                          <AvatarFallback>{review.reviewer.full_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.reviewer.full_name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
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
                      <div className="mt-4 p-2 border rounded bg-gray-50">
                        <p className="text-sm"><strong>Reply:</strong> {review.reply}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground">No reviews yet.</p>
            )}
          </div>

          {/* Properties Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Properties by {profile.full_name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  location={`${property.city}, ${property.state}`}
                  imageUrl={property.images?.[0]}
                  beds={property.bedrooms}
                  baths={property.bathrooms}
                  sqft={property.square_feet}
                  sublease_from={property.sublease_from}
                  sublease_to={property.sublease_to}
                  is_verified={property.is_verified}
                  sellerId={property.seller_id}
                  sellerName={profile.full_name}
                  sellerAvatarUrl={profile.avatar_url}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
