import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reviewer: {
    full_name: string;
    avatar_url?: string;
  };
  reply?: string;
}

export function BuyerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Optionally navigate to login or another route
          return;
        }

        // Fetch reviews written by this buyer
        const { data, error } = await supabase
          .from('seller_reviews')
          .select(`
            *,
            reviewer:profiles!reviewer_id(*),
            seller:profiles!seller_id(*)
          `)
          .eq('reviewer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) return <div className="pt-20 text-center">Loading...</div>;
  if (!reviews.length)
    return <div className="pt-20 text-center">You haven't written any reviews yet.</div>;

  return (
    <div className="pt-20 space-y-4 container mx-auto px-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <CardTitle>{review.reviewer?.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar>
                <AvatarImage src={review.reviewer?.avatar_url} />
                <AvatarFallback>{review.reviewer?.full_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{review.reviewer?.full_name}</div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }
                      size={16}
                    />
                  ))}
                </div>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
            <p className="text-sm mb-4">{review.review_text}</p>
            {review.reply && (
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <div className="font-medium mb-2">Seller's Reply:</div>
                <p className="text-sm">{review.reply}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SellerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Optionally navigate to login or another route
          return;
        }

        const { data, error } = await supabase
          .from('seller_reviews')
          .select(`
            *,
            reviewer:profiles!reviewer_id(*),
            seller:profiles!seller_id(*)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleReply = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('seller_reviews')
        .update({ reply: replyText })
        .eq('id', reviewId);

      if (error) throw error;

      // Update state to show the new reply
      setReviews(
        reviews.map(review =>
          review.id === reviewId ? { ...review, reply: replyText } : review
        )
      );
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error replying to review:', error);
    }
  };

  if (loading) return <div className="pt-20 text-center">Loading...</div>;

  return (
    <div className="pt-20 space-y-4 container mx-auto px-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <CardTitle>{review.reviewer?.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar>
                <AvatarImage src={review.reviewer?.avatar_url} />
                <AvatarFallback>{review.reviewer?.full_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{review.reviewer?.full_name}</div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }
                      size={16}
                    />
                  ))}
                </div>
              </div>
              {!review.reply && <Badge variant="destructive" className="ml-auto">New</Badge>}
            </div>
            <p className="text-sm mb-4">{review.review_text}</p>
            {review.reply ? (
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <div className="font-medium mb-2">Your Reply:</div>
                <p className="text-sm">{review.reply}</p>
              </div>
            ) : (
              <div className="mt-4">
                {replyingTo === review.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full p-2 border rounded-md"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => handleReply(review.id)}>
                        Submit Reply
                      </Button>
                      <Button variant="outline" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setReplyingTo(review.id)}>
                    Reply to Review
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
