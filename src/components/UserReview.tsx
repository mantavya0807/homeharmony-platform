import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserProfile, UserReview } from '@/types/profile';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  readOnly?: boolean;
}

function StarRating({ rating, onRatingChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onRatingChange(star)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          disabled={readOnly}
        >
          <Star
            className={`h-6 w-6 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function UserReviews() {
  const { userId } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: 0,
    review_text: '',
  });
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUser(), fetchReviews(), getCurrentUser()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchUser = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(profile);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    }
  };

  const fetchReviews = async () => {
    try {
      const { data: reviews, error } = await supabase
        .from('user_reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(
            full_name,
            avatar_url
          )
        `)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (newReview.rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_reviews')
        .insert({
          reviewer_id: user.id,
          reviewee_id: userId,
          rating: newReview.rating,
          review_text: newReview.review_text.trim(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      setNewReview({ rating: 0, review_text: '' });
      setShowReviewDialog(false);
      await fetchReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.full_name}</CardTitle>
              <CardDescription>
                {user.role === 'seller' ? 'Property Seller' : 'Property Buyer'}
              </CardDescription>
              <div className="flex items-center gap-2 mt-1">
                {user.rating !== undefined ? (
                  <>
                    <StarRating rating={user.rating} onRatingChange={() => {}} readOnly />
                    <span className="text-sm text-muted-foreground">
                      ({reviews.length} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No rating yet</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentUser && currentUser !== userId && (
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button className="mb-6">Write a Review</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                  <DialogDescription>
                    Share your experience with {user.full_name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    <StarRating
                      rating={newReview.rating}
                      onRatingChange={(rating) =>
                        setNewReview({ ...newReview, rating })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review</label>
                    <Textarea
                      value={newReview.review_text}
                      onChange={(e) =>
                        setNewReview({ ...newReview, review_text: e.target.value })
                      }
                      placeholder="Write your review here..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                    <AvatarFallback>
                      {review.reviewer?.full_name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{review.reviewer?.full_name}</h4>
                      <StarRating
                        rating={review.rating}
                        onRatingChange={() => {}}
                        readOnly
                      />
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{review.review_text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Reviews Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to review {user.full_name}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}