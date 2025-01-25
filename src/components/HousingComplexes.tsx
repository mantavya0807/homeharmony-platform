// src/pages/HousingComplexes.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Add this line
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Star, StarHalf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { StarIcon } from "lucide-react";

// Define all possible amenities
const AMENITIES = {
  has_swimming_pool: "Swimming Pool",
  has_gym: "Gym",
  has_clubhouse: "Clubhouse",
  has_business_center: "Business Center",
  has_community_room: "Community Room",
  has_gated_entry: "Gated Entry",
  has_security_cameras: "Security Cameras",
  has_doorman: "Doorman",
  has_playground: "Playground",
  has_bbq_area: "BBQ Area",
  has_dog_park: "Dog Park",
  has_tennis_court: "Tennis Court",
  has_basketball_court: "Basketball Court",
  has_elevator: "Elevator",
  has_parking_garage: "Parking Garage",
  has_package_room: "Package Room",
  has_laundry_facility: "Laundry Facility",
  has_bike_storage: "Bike Storage",
  has_sauna: "Sauna",
  has_spa: "Spa",
  has_yoga_studio: "Yoga Studio",
  has_movie_theater: "Movie Theater",
  has_game_room: "Game Room",
};

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user: {
    full_name: string;
  };
}

interface HousingComplex {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  // Amenities as separate boolean fields
  has_swimming_pool: boolean;
  has_gym: boolean;
  has_clubhouse: boolean;
  has_business_center: boolean;
  has_community_room: boolean;
  has_gated_entry: boolean;
  has_security_cameras: boolean;
  has_doorman: boolean;
  has_playground: boolean;
  has_bbq_area: boolean;
  has_dog_park: boolean;
  has_tennis_court: boolean;
  has_basketball_court: boolean;
  has_elevator: boolean;
  has_parking_garage: boolean;
  has_package_room: boolean;
  has_laundry_facility: boolean;
  has_bike_storage: boolean;
  has_sauna: boolean;
  has_spa: boolean;
  has_yoga_studio: boolean;
  has_movie_theater: boolean;
  has_game_room: boolean;
  average_rating: number;
  reviews: Review[];
}

export default function HousingComplexes() {
  const [complexes, setComplexes] = useState<HousingComplex[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplex, setSelectedComplex] = useState<HousingComplex | null>(null);
  const { toast } = useToast();
  const [newReview, setNewReview] = useState({ rating: 0, review_text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchComplexes();
  }, []);

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role);
      }
    };
    getUserRole();
  }, []);

  const fetchComplexes = async () => {
    try {
      const { data: complexData, error: complexError } = await supabase
        .from('housing_complexes')
        .select(`
          *,
          housing_complex_reviews (
            id,
            rating,
            review_text,
            created_at,
            user_id,
            profiles (
              full_name
            )
          )
        `);

      if (complexError) throw complexError;

      // Calculate average rating and format reviews
      const complexesWithRatings = complexData.map(complex => ({
        ...complex,
        reviews: complex.housing_complex_reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          review_text: review.review_text,
          created_at: review.created_at,
          user: {
            full_name: review.profiles?.full_name || 'Anonymous'
          }
        })),
        average_rating: complex.housing_complex_reviews.length > 0
          ? complex.housing_complex_reviews.reduce((acc, review) => acc + review.rating, 0) / complex.housing_complex_reviews.length
          : 0
      }));

      setComplexes(complexesWithRatings);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load housing complexes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplex) return;
  
    try {
      setSubmittingReview(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || userRole !== "buyer") {
        toast({
          title: "Not allowed",
          description: "Only buyers can submit reviews",
          variant: "destructive",
        });
        return;
      }
  
      // Update this part to use complex_id instead of housing_complex_id
      const { error } = await supabase
        .from('housing_complex_reviews')
        .insert([
          {
            complex_id: selectedComplex.id,  // Changed from housing_complex_id to complex_id
            user_id: session.user.id,
            rating: newReview.rating,
            review_text: newReview.review_text,
          }
        ]);
  
      if (error) throw error;
  
      await fetchComplexes();
      setNewReview({ rating: 0, review_text: "" });
      
      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
  
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const RatingStars = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-primary text-primary" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 text-primary" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
        ))}
        <span className="ml-2 text-sm">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number, onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="focus:outline-none"
          >
            <StarIcon
              className={`h-6 w-6 ${
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Housing Complexes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {complexes.map((complex) => (
          <Card key={complex.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{complex.name}</CardTitle>
                  <CardDescription>{complex.city}, {complex.state}</CardDescription>
                </div>
                <RatingStars rating={complex.average_rating} />
              </div>
            </CardHeader>
            <CardContent>
              {/* Optional: Display an image if available */}
              <img 
    src={complex.photo_url ||  "https://www.pexels.com/photo/house-lights-turned-on-106399/"} 
    alt={`${complex.name} Photo`} 
    className="w-full h-40 object-cover rounded-md mb-4"
  />
              
              <p className="text-sm text-muted-foreground mb-4">{complex.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(AMENITIES).map(([key, label]) => (
                  complex[key as keyof HousingComplex] && <Badge key={key} variant="secondary">{label}</Badge>
                ))}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedComplex(complex)}
                  >
                    View Details & Reviews
                  </Button>
                </DialogTrigger>
                {selectedComplex && (
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>{selectedComplex.name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-6">
                        {/* About Section */}
                        <div>
                          <h3 className="font-semibold mb-2">About</h3>
                          <p>{selectedComplex.description}</p>
                        </div>
                        
                        {/* Location Section */}
                        <div>
                          <h3 className="font-semibold mb-2">Location</h3>
                          <p>{selectedComplex.address}</p>
                          <p>{selectedComplex.city}, {selectedComplex.state} {selectedComplex.zip_code}</p>
                        </div>

                        {/* Amenities Section */}
                        <div>
                          <h3 className="font-semibold mb-2">Amenities</h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(AMENITIES).map(([key, label]) => (
                              selectedComplex[key as keyof HousingComplex] && <Badge key={key} variant="outline">{label}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Reviews Section */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">Reviews</h3>
                            <RatingStars rating={selectedComplex.average_rating} />
                          </div>
                          
                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-6">
                              {/* Reviews List */}
                              {selectedComplex.reviews.length > 0 ? (
                                <div className="space-y-4">
                                  {selectedComplex.reviews.map((review) => (
                                    <Card key={review.id}>
                                      <CardHeader>
                                        <div className="flex justify-between items-center">
                                          <CardTitle className="text-sm font-medium">
                                            {review.user.full_name}
                                          </CardTitle>
                                          <RatingStars rating={review.rating} />
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                          {review.review_text}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No reviews yet.</p>
                              )}

                              {/* Only show review form for buyers */}
                              {userRole === "buyer" && (
                                <div className="border-t pt-6">
                                  <h3 className="font-semibold mb-4">Write a Review</h3>
                                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Rating</Label>
                                      <StarRating
                                        rating={newReview.rating}
                                        onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Review</Label>
                                      <Textarea
                                        value={newReview.review_text}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, review_text: e.target.value }))}
                                        placeholder="Write your review here..."
                                        required
                                      />
                                    </div>
                                    <Button 
                                      type="submit" 
                                      disabled={submittingReview || newReview.rating === 0} 
                                      className="w-full"
                                    >
                                      {submittingReview ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Submitting...
                                        </>
                                      ) : (
                                        "Submit Review"
                                      )}
                                    </Button>
                                  </form>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                )}
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
