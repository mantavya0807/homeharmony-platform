// Navigation.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Menu } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import ProfileMenu from "./ProfileMenu";
import { UserProfile } from "@/types/profile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationProps {
  isAuthenticated: boolean | null;
  userRole: string | null;
}

export function Navigation({ isAuthenticated, userRole }: NavigationProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profile) {
        setProfile(profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: participations } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);
      if (!participations?.length) return;
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .in("chat_id", participations.map((p) => p.chat_id))
        .eq("read", false)
        .neq("sender_id", user.id);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const subscription = supabase
      .channel("messages_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchUnreadCount)
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigation links for sellers (Reviews link is removed from the navbar)
  const SellerNavLinks = ({ isMobile = false, onClose = () => {} }) => (
    <>
      <Button variant="ghost" asChild className={isMobile ? "w-full justify-start" : ""} onClick={onClose}>
        <Link to="/seller-dashboard">Seller Dashboard</Link>
      </Button>
      <Button variant="ghost" asChild className={isMobile ? "w-full justify-start" : ""} onClick={onClose}>
        <Link to="/housing-complexes">Housing Complexes</Link>
      </Button>
      <Button
        variant="ghost"
        asChild
        className={`relative ${isMobile ? "w-full justify-start" : ""}`}
        onClick={onClose}
      >
        <Link to="/chat" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Messages
          {unreadCount > 0 && (
            <Badge variant="destructive" className={`absolute ${isMobile ? "right-4" : "-top-2 -right-2"} h-5 min-w-[20px] px-1 rounded-full`}>
              {unreadCount}
            </Badge>
          )}
        </Link>
      </Button>
    </>
  );

  // Navigation links for buyers (no Reviews link)
  const BuyerNavLinks = ({ isMobile = false, onClose = () => {} }) => (
    <>
      <Button variant="ghost" asChild className={isMobile ? "w-full justify-start" : ""} onClick={onClose}>
        <Link to="/dashboard">Dashboard</Link>
      </Button>
      <Button variant="ghost" asChild className={isMobile ? "w-full justify-start" : ""} onClick={onClose}>
        <Link to="/saved">Saved Properties</Link>
      </Button>
      <Button variant="ghost" asChild className={isMobile ? "w-full justify-start" : ""} onClick={onClose}>
        <Link to="/housing-complexes">Housing Complexes</Link>
      </Button>
      <Button
        variant="ghost"
        asChild
        className={`relative ${isMobile ? "w-full justify-start" : ""}`}
        onClick={onClose}
      >
        <Link to="/chat" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Messages
          {unreadCount > 0 && (
            <Badge variant="destructive" className={`absolute ${isMobile ? "right-4" : "-top-2 -right-2"} h-5 min-w-[20px] px-1 rounded-full`}>
              {unreadCount}
            </Badge>
          )}
        </Link>
      </Button>
    </>
  );

  // Navigation links for guests
  const GuestNavLinks = ({ isMobile = false, onClose = () => {} }) => (
    <>
      <Button variant="ghost" asChild className={isMobile ? "w-full justify-start" : ""} onClick={onClose}>
        <Link to="/auth" state={{ initialView: "login" }}>Sign In</Link>
      </Button>
      <Button asChild className={isMobile ? "w-full" : ""} onClick={onClose}>
        <Link to="/auth" state={{ initialView: "role" }}>Get Started</Link>
      </Button>
    </>
  );

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold">SubSpace</Link>
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              {userRole === "seller" ? (
                <SellerNavLinks />
              ) : userRole === "buyer" ? (
                <BuyerNavLinks />
              ) : null}
              {profile && <ProfileMenu profile={profile} onSignOut={handleSignOut} />}
            </>
          ) : (
            <GuestNavLinks />
          )}
        </div>
        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          {isAuthenticated && profile && <ProfileMenu profile={profile} onSignOut={handleSignOut} />}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {isAuthenticated ? (
                  <>
                    {userRole === "seller" ? (
                      <SellerNavLinks
                        isMobile
                        onClose={() => {
                          const closeButton = document.querySelector("[data-radix-collection-item]") as HTMLButtonElement;
                          closeButton?.click();
                        }}
                      />
                    ) : userRole === "buyer" ? (
                      <BuyerNavLinks
                        isMobile
                        onClose={() => {
                          const closeButton = document.querySelector("[data-radix-collection-item]") as HTMLButtonElement;
                          closeButton?.click();
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <GuestNavLinks
                    isMobile
                    onClose={() => {
                      const closeButton = document.querySelector("[data-radix-collection-item]") as HTMLButtonElement;
                      closeButton?.click();
                    }}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
