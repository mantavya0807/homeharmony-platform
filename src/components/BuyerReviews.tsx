// BuyerReviews.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface BuyerReview {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reviewee: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export function BuyerReviews() {
  const [reviews, setReviews] = useState<BuyerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBuyerReviews() {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }
      const userId = authData.user.id;
      const { data, error } = await supabase
        .from("userreviews")
        .select("*, reviewee:profiles(id, full_name, avatar_url)")
        .eq("reviewer_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching buyer reviews:", error);
      } else {
        setReviews(data || []);
      }
      setLoading(false);
    }
    fetchBuyerReviews();
  }, []);

  if (loading) return <div>Loading your reviews...</div>;
  if (!reviews.length) return <div>You haven't written any reviews yet.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Reviews</h1>
      {reviews.map((review) => (
        <Card key={review.id} className="mb-4">
          <CardContent>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={review.reviewee.avatar_url || ""} alt={review.reviewee.full_name} />
                <AvatarFallback>{review.reviewee.full_name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{review.reviewee.full_name}</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2">{review.review_text}</p>
            <span className="text-sm text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
