import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageGallery from "@/components/ImageGallery";
import {
  Star,
  MessageSquare,
  Loader2,
  MapPin,
  Building,
  Users,
  ArrowRight,
  ThumbsUp,
} from "lucide-react";

interface ComplexCardProps {
  complex: any;
  userRole: string | null;
  onSelect: () => void;
}

// ---------------- StarRating component ----------------
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <motion.div
          key={`full-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </motion.div>
      ))}
      {hasHalfStar && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: fullStars * 0.1 }}
        >
          <Star
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
            strokeDasharray="20"
            strokeDashoffset="10"
          />
        </motion.div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <motion.div
          key={`empty-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.1,
          }}
        >
          <Star className="h-4 w-4 text-gray-300" />
        </motion.div>
      ))}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="ml-1 text-sm text-gray-500 dark:text-gray-400"
      >
        ({rating.toFixed(1)})
      </motion.span>
    </div>
  );
};

// ---------------- ReviewInput component ----------------
const ReviewInput = ({
  value,
  onChange,
  submitting,
  onSubmit,
}: {
  value: { rating: number; text: string };
  onChange: (val: { rating: number; text: string }) => void;
  submitting: boolean;
  onSubmit: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4"
    >
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange({ ...value, rating: star })}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= value.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                } transition-colors`}
              />
            </motion.button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Your Review</Label>
        <Textarea
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Share your experience..."
          className="min-h-[80px] resize-none focus:ring-2 focus:ring-primary border border-blue-500 text-sm"
        />
      </div>
      <Button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 dark:from-blue-500 dark:to-blue-700"
      >
        {submitting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Submit Review
          </div>
        )}
      </Button>
    </motion.div>
  );
};

// ---------------- ReviewCard component ----------------
const ReviewCard = ({ review }: { review: any }) => {
  const [helpfulCount, setHelpfulCount] = useState<number>(review.helpful || 0);
  const [hasClicked, setHasClicked] = useState(false);

  // Fetch the latest helpful count when the component mounts
  useEffect(() => {
    async function fetchLatestCount() {
      const { data, error } = await supabase
        .from("housing_complex_reviews")
        .select("helpful")
        .eq("id", review.id)
        .single();
      if (!error && data) {
        setHelpfulCount(data.helpful || 0);
      }
    }
    fetchLatestCount();
  }, [review.id]);

  const handleHelpfulClick = async () => {
    if (hasClicked) return;

    setHasClicked(true);

    // Call the RPC function to increment the helpful count atomically
    const { error } = await supabase.rpc("increment_helpful", {
      review_id: review.id,
    });

    if (error) {
      console.error("Error incrementing helpful:", error);
      setHasClicked(false);
    } else {
      // Fetch the updated count from the database
      const { data, error: fetchError } = await supabase
        .from("housing_complex_reviews")
        .select("helpful")
        .eq("id", review.id)
        .single();

      if (fetchError) {
        console.error("Error fetching updated helpful count:", fetchError);
      } else {
        setHelpfulCount(data.helpful || 0);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 border border-blue-100/50 dark:border-blue-900/50"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10 border-2 border-primary/10">
          <AvatarImage src={review.user?.avatar_url} />
          <AvatarFallback>
            {review.user?.full_name?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div>
              <h4 className="font-semibold text-sm">
                {review.user?.full_name || "Anonymous"}
              </h4>
              <StarRating rating={review.rating} />
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.review_text}
          </p>
          <div className="flex items-center gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleHelpfulClick}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ThumbsUp
                className={`h-4 w-4 ${
                  hasClicked ? "fill-primary text-primary" : ""
                }`}
              />
              <span>Helpful</span>
              <span className="text-xs font-medium">({helpfulCount})</span>
            </motion.button>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="h-4 w-4" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export function ComplexCard({ complex, userRole, onSelect }: ComplexCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [reviewInput, setReviewInput] = useState({ rating: 0, text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const handleSubmitReview = async () => {
    if (!reviewInput.rating || !reviewInput.text.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a rating and review text",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("housing_complex_reviews").insert({
        complex_id: complex.id,
        user_id: user.id,
        rating: reviewInput.rating,
        review_text: reviewInput.text,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      setReviewInput({ rating: 0, text: "" });
      onSelect();
      setIsReviewDialogOpen(false);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("housing_complex_id", complex.id);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (complex.id) {
      fetchProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complex.id]);

  return (
    <>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/10 dark:hover:shadow-primary/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/50 w-full">
          <CardContent className="p-0">
            <div className="relative overflow-hidden h-48 md:h-60 lg:h-64">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
              <ImageGallery
                photos={
                  complex.housing_complex_photos?.map((p: any) => p.photo_url) ||
                  []
                }
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2">
                <Badge className="bg-primary/90 text-white backdrop-blur-sm">
                  {complex.reviews.length} Reviews
                </Badge>
                <h3 className="text-xl font-bold text-white drop-shadow-lg">
                  {complex.name}
                </h3>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{complex.address}</span>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2">
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-primary/5">
                  <Building className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {properties.length} Units
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-primary/5">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {complex.reviews.length} Reviews
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-primary/5">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {complex.average_rating.toFixed(1)} Rating
                  </span>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 group"
                onClick={() => setIsOpen(true)}
              >
                View Details
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-2">
            <DialogTitle>{complex.name}</DialogTitle>
            <DialogDescription>{complex.address}</DialogDescription>
          </DialogHeader>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="flex w-full justify-center gap-2 md:gap-4 mt-4 bg-transparent border-none">
              <TabsTrigger
                value="overview"
                className="px-4 py-2 rounded-lg transition-transform duration-300 ease-in-out focus:outline-none data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:scale-105"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="properties"
                className="px-4 py-2 rounded-lg transition-transform duration-300 ease-in-out focus:outline-none data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:scale-105"
              >
                Properties
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="px-4 py-2 rounded-lg transition-transform duration-300 ease-in-out focus:outline-none data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:scale-105"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {complex.housing_complex_photos?.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-lg font-semibold">Gallery</h3>
                    <div className="w-full max-w-[800px] mx-auto h-[400px] overflow-hidden">
                      <ImageGallery
                        photos={complex.housing_complex_photos.map(
                          (p: any) => p.photo_url
                        )}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </section>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">About this Complex</h3>
                    <div className="prose dark:prose-invert">
                      <p className="text-muted-foreground">
                        {complex.description || "No description available."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                      {Object.entries(complex)
                        .filter(
                          ([key, value]) =>
                            key.startsWith("has_") && value === true
                        )
                        .map(([key]) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="justify-start gap-2 py-2 px-3 text-sm"
                          >
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            {key
                              .replace("has_", "")
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </Badge>
                        ))}
                    </div>
                  </section>
                  <section className="grid grid-cols-3 gap-6">
                    <Card className="bg-primary/5 border-none">
                      <CardHeader className="p-4">
                        <CardTitle className="text-xl font-bold">
                          {properties.length}
                        </CardTitle>
                        <CardDescription>Available Units</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="bg-primary/5 border-none">
                      <CardHeader className="p-4">
                        <CardTitle className="text-xl font-bold">
                          {complex.average_rating.toFixed(1)}
                        </CardTitle>
                        <CardDescription>Average Rating</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="bg-primary/5 border-none">
                      <CardHeader className="p-4">
                        <CardTitle className="text-xl font-bold">
                          {complex.reviews.length}
                        </CardTitle>
                        <CardDescription>Total Reviews</CardDescription>
                      </CardHeader>
                    </Card>
                  </section>
                </motion.div>
              </TabsContent>
              <TabsContent value="properties" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {loadingProperties ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : properties.length > 0 ? (
                    <Table className="rounded-lg border overflow-hidden shadow-sm text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Beds</TableHead>
                          <TableHead>Baths</TableHead>
                          <TableHead>Sq.ft</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((property) => (
                          <TableRow
                            key={property.id}
                            className="cursor-pointer transition-colors hover:bg-accent"
                            onClick={() => navigate(`/properties/${property.id}`)}
                          >
                            <TableCell>{property.title}</TableCell>
                            <TableCell className="capitalize">
                              {property.property_type}
                            </TableCell>
                            <TableCell>
                              ${property.price.toLocaleString()}
                            </TableCell>
                            <TableCell>{property.bedrooms}</TableCell>
                            <TableCell>{property.bathrooms}</TableCell>
                            <TableCell>{property.square_feet}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(`/properties/${property.id}`)
                                }
                                className="hover:bg-primary/10"
                              >
                                View Details
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No properties available at this time.
                      </p>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-0 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold">
                        {complex.average_rating.toFixed(1)}
                      </h3>
                      <StarRating rating={complex.average_rating} />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Based on {complex.reviews.length} reviews
                      </p>
                    </div>
                    {userRole === "buyer" && (
                      <Button
                        onClick={() => setIsReviewDialogOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-sm"
                      >
                        Write a Review
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {complex.reviews.map((review: any) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-6">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your thoughts about {complex.name}
            </DialogDescription>
          </DialogHeader>
          <ReviewInput
            value={reviewInput}
            onChange={setReviewInput}
            submitting={submitting}
            onSubmit={handleSubmitReview}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
