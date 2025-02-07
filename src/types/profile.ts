export interface UserProfile {
    id: string;
    full_name: string;
    role: "buyer" | "seller";
    avatar_url: string | null;
    email: string;
    phone_number: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
    stripe_account_id?: string | null;
    rating?: number;
    review_count?: number;
  }
  
  export interface UserReview {
    id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    review_text: string;
    created_at: string;
    reviewer?: {
      full_name: string;
      avatar_url: string;
    };
  }