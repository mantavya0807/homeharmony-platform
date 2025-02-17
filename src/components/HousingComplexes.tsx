// HousingComplexes.tsx
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, StarIcon, StarHalf } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ImageGallery from '@/components/ImageGallery';
import { HousingComplexesFilter, Filters, AMENITIES } from '@/components/HousingComplexesFilter';

// Custom hook to debounce a function
const useDebounce = (func: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]);

  return debouncedFunction;
};

// RatingStars displays 5 stars (filled, half, or empty) based on the rating (out of 5)
// and shows the numeric average rating next to them.
const RatingStars = memo(({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} className="w-4 h-4 text-yellow-500" />
      ))}
      {hasHalfStar && <StarHalf key="half" className="w-4 h-4 text-yellow-500" />}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
      <span className="ml-2 text-sm">({rating.toFixed(1)}/5)</span>
    </div>
  );
});

// Simple star rating input component
const StarRatingInput = memo(({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
}) => {
  return (
    <div>
      <input
        type="number"
        value={rating}
        onChange={(e) => onRatingChange(Number(e.target.value))}
        min={0}
        max={5}
        step={0.5}
        className="border rounded p-1"
      />
    </div>
  );
});

export default function HousingComplexes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complexes, setComplexes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplex, setSelectedComplex] = useState<any>(null);
  const [selectedComplexProperties, setSelectedComplexProperties] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 0, review_text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    city: '',
    state: '',
    zip_code: '',
    amenities: []
  });

  // Fetch housing complexes data along with reviews and photos.
  const fetchComplexes = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("housing_complexes")
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
          ),
          housing_complex_photos (
            id,
            photo_url,
            created_at
          )
        `);

      if (filters.city) query = query.ilike('city', `%${filters.city}%`);
      if (filters.state) query = query.ilike('state', `%${filters.state}%`);
      if (filters.zip_code) query = query.ilike('zip_code', `%${filters.zip_code}%`);
      filters.amenities.forEach(amenity => {
        query = query.eq(amenity, true);
      });

      const { data, error } = await query;
      if (error) throw error;

      const complexesWithDetails = (data || []).map((complex: any) => {
        const reviews = complex.housing_complex_reviews?.map((review: any) => ({
          id: review.id,
          rating: review.rating,
          review_text: review.review_text,
          created_at: review.created_at,
          user: {
            full_name: review.profiles?.full_name || "Anonymous",
          },
        })) || [];

        const average_rating = reviews.length > 0
          ? reviews.reduce((acc: number, review: any) => acc + review.rating, 0) / reviews.length
          : 0;

        return {
          ...complex,
          reviews,
          average_rating,
        };
      });

      setComplexes(complexesWithDetails);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load housing complexes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Create a debounced version of fetchComplexes to prevent excessive requests.
  const debouncedFetchComplexes = useDebounce(fetchComplexes, 1500);

  // Fetch properties for a specific complex.
  const fetchPropertiesForComplex = async (complexId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('housing_complex_id', complexId);

      if (error) throw error;
      setSelectedComplexProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    }
  };

  // When a complex is selected, load its properties.
  const handleComplexSelect = async (complex: any) => {
    setSelectedComplex(complex);
    await fetchPropertiesForComplex(complex.id);
  };

  // Handle review submission.
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplex) return;

    try {
      setSubmittingReview(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a review",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('housing_complex_reviews')
        .insert({
          complex_id: selectedComplex.id,
          user_id: user.id,
          rating: newReview.rating,
          review_text: newReview.review_text,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      // Refresh the complexes data after review submission.
      await fetchComplexes();
      setNewReview({ rating: 0, review_text: "" });
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Fetch complexes on mount and whenever filters change.
  useEffect(() => {
    debouncedFetchComplexes();
  }, [filters, debouncedFetchComplexes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Housing Complexes</h1>

      {/* Filters */}
      <HousingComplexesFilter
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Complex Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complexes.map((complex) => (
          <Card key={complex.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {/* Complex Photos */}
              {complex.housing_complex_photos && complex.housing_complex_photos.length > 0 ? (
                <ImageGallery photos={complex.housing_complex_photos.map((photo: any) => photo.photo_url)} />
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No photos available</p>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{complex.name}</h3>
                <p className="text-muted-foreground mb-4">{complex.address}</p>

                {/* Rating Display */}
                <div className="mb-4">
                  <RatingStars rating={complex.average_rating} />
                  <p className="text-sm text-muted-foreground mt-1">
                    {complex.reviews.length} reviews
                  </p>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(AMENITIES).map(([key, label]) => (
                    complex[key] && (
                      <Badge key={key} variant="secondary">
                        {label}
                      </Badge>
                    )
                  ))}
                </div>

                {/* View Details Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleComplexSelect(complex)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>

                  {/* Complex Details Dialog */}
                  {selectedComplex?.id === complex.id && (
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{complex.name}</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* About Section */}
                        <section>
                          <h3 className="text-lg font-semibold mb-2">About</h3>
                          <p className="text-muted-foreground">{complex.description}</p>
                        </section>

                        {/* Properties Section */}
                        <section>
                          <h3 className="text-lg font-semibold mb-4">Available Properties</h3>
                          {selectedComplexProperties.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Title</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Beds</TableHead>
                                  <TableHead>Baths</TableHead>
                                  <TableHead>Sq.ft</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedComplexProperties.map((property) => (
                                  <TableRow 
                                    key={property.id}
                                    className="cursor-pointer hover:bg-accent"
                                    onClick={() => navigate(`/properties/${property.id}`)}
                                  >
                                    <TableCell>{property.title}</TableCell>
                                    <TableCell className="capitalize">{property.property_type}</TableCell>
                                    <TableCell>${property.price.toLocaleString()}</TableCell>
                                    <TableCell>{property.bedrooms}</TableCell>
                                    <TableCell>{property.bathrooms}</TableCell>
                                    <TableCell>{property.square_feet}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-muted-foreground">No properties available</p>
                          )}
                        </section>

                        {/* Reviews Section */}
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Reviews</h3>
                            {userRole === 'buyer' && (
                              <Button onClick={() => setNewReview({ rating: 0, review_text: "" })}>
                                Write a Review
                              </Button>
                            )}
                          </div>

                          {/* Review Form */}
                          {userRole === 'buyer' && (
                            <form onSubmit={handleReviewSubmit} className="mb-6 space-y-4">
                              <div className="space-y-2">
                                <Label>Rating</Label>
                                <StarRatingInput
                                  rating={newReview.rating}
                                  onRatingChange={(rating) =>
                                    setNewReview(prev => ({ ...prev, rating }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Review</Label>
                                <Textarea
                                  value={newReview.review_text}
                                  onChange={(e) =>
                                    setNewReview(prev => ({ ...prev, review_text: e.target.value }))
                                  }
                                  placeholder="Write your review here..."
                                  required
                                />
                              </div>
                              <Button type="submit" disabled={submittingReview}>
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
                          )}

                          {/* Reviews List */}
                          <div className="space-y-4">
                            {complex.reviews.map((review) => (
                              <Card key={review.id}>
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-base">
                                        {review.user.full_name}
                                      </CardTitle>
                                      <RatingStars rating={review.rating} />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </CardHeader>
                                <div className="p-4">
                                  <p className="text-muted-foreground">
                                    {review.review_text}
                                  </p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </section>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
