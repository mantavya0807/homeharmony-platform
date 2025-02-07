// SellerReviews.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reply?: string;
  reviewer: {
    full_name: string;
    avatar_url?: string;
  };
}

export function SellerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSellerReviews() {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }
      const sId = authData.user.id;
      setSellerId(sId);
      const { data: reviewsData, error } = await supabase
        .from("seller_reviews")
        .select("*, reviewer:profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url)")
        .eq("seller_id", sId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching reviews", error);
      } else {
        setReviews(reviewsData || []);
      }
      setLoading(false);
    }
    fetchSellerReviews();
  }, []);

  const submitReply = async (reviewId: string) => {
    const replyText = replyInputs[reviewId];
    if (!replyText) return;
    const { error } = await supabase
      .from("seller_reviews")
      .update({ reply: replyText })
      .eq("id", reviewId);
    if (error) {
      console.error("Error updating reply", error);
    } else {
      // Refresh reviews after a successful reply
      const { data: reviewsData, error } = await supabase
        .from("seller_reviews")
        .select("*, reviewer:profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url)")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching reviews", error);
      } else {
        setReviews(reviewsData || []);
      }
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
    }
  };

  if (loading) return <div>Loading reviews...</div>;
  if (!reviews.length) return <div>No reviews yet.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Reviews</h1>
      {reviews.map((review) => (
        <Card key={review.id} className="mb-4">
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.reviewer.avatar_url || ""} alt={review.reviewer.full_name} />
                  <AvatarFallback>{review.reviewer.full_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{review.reviewer.full_name}</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2">{review.comment}</p>
            {review.reply ? (
              <div className="mt-2 p-2 border rounded bg-gray-100">
                <strong>Reply:</strong> {review.reply}
              </div>
            ) : (
              <div className="mt-2">
                <Input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyInputs[review.id] || ""}
                  onChange={(e) =>
                    setReplyInputs((prev) => ({ ...prev, [review.id]: e.target.value }))
                  }
                />
                <Button size="sm" className="mt-2" onClick={() => submitReply(review.id)}>
                  Submit Reply
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
