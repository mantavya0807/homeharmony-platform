// ProfileMenu.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types/profile";

interface ProfileMenuProps {
  profile: UserProfile;
  onSignOut: () => void;
}

export default function ProfileMenu({ profile, onSignOut }: ProfileMenuProps) {
  const navigate = useNavigate();
  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const [reviewNotificationCount, setReviewNotificationCount] = useState<number>(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile?.id || !profile?.role) return;

      if (profile.role === 'seller') {
        // For sellers: Count unread reviews (ones without replies)
        const { count, error } = await supabase
          .from('seller_reviews')
          .select('id', { count: 'exact' })
          .eq('seller_id', profile.id)
          .is('reply', null);

        if (!error && count !== null) {
          setReviewNotificationCount(count);
        }
      } else {
        // For buyers: Count new replies to their reviews
        const { count, error } = await supabase
          .from('seller_reviews')
          .select('id', { count: 'exact' })
          .eq('reviewer_id', profile.id)
          .not('reply', 'is', null)
          .eq('reply_read', false);

        if (!error && count !== null) {
          setReviewNotificationCount(count);
        }
      }
    };

    fetchNotifications();

    // Subscribe to changes
    const subscription = supabase
      .channel('review_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_reviews'
      }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription)
    };
  }, [profile?.id, profile?.role]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          Profile
        </DropdownMenuItem>
        {profile.role === "seller" && (
          <>
            <DropdownMenuItem onClick={() => navigate("/seller-dashboard")}>
              Seller Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/stripe-connect")}>
              Connect Stripe
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/reviews")}>
              Reviews{" "}
              {reviewNotificationCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {reviewNotificationCount}
                </Badge>
              )}
            </DropdownMenuItem>
          </>
        )}
        {profile.role === "buyer" && (
          <DropdownMenuItem onClick={() => navigate("/buyer-reviews")}>
            My Reviews
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}