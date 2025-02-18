import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { MessageSquare, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProfileMenu from "./ProfileMenu";

interface NavigationProps {
  isAuthenticated: boolean;
  userRole: string | null;
}

export function Navigation({ isAuthenticated, userRole }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch profile and unread messages count
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // Real-time message updates
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const subscription = supabase
      .channel("messages_changes")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "messages" 
      }, fetchUnreadCount)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // NavLinks Component – only render when authenticated.
  const NavLinks = ({
    userRole,
    unreadCount,
    isMobile = false,
    isAuthenticated,
  }: {
    userRole: string | null;
    unreadCount: number;
    isMobile?: boolean;
    isAuthenticated: boolean;
  }) => {
    if (!isAuthenticated) return null;

    const baseButtonClass = `relative font-medium transition-colors hover:text-blue-800 dark:hover:text-primary ${
      isMobile ? "w-full justify-start" : ""
    }`;

    if (userRole === "seller") {
      return (
        <>
          <Button variant="ghost" className={baseButtonClass} asChild>
            <Link to="/seller-dashboard">Seller Dashboard</Link>
          </Button>
          <Button variant="ghost" className={baseButtonClass} asChild>
            <Link to="/housing-complexes">Housing Complexes</Link>
          </Button>
          <Button variant="ghost" className={`${baseButtonClass} relative`} asChild>
            <Link to="/chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          </Button>
        </>
      );
    }

    return (
      <>
        <Button variant="ghost" className={baseButtonClass} asChild>
          <Link to="/dashboard">Dashboard</Link>
        </Button>
        <Button variant="ghost" className={baseButtonClass} asChild>
          <Link to="/housing-complexes">Housing Complexes</Link>
        </Button>
        <Button variant="ghost" className={baseButtonClass} asChild>
          <Link to="/saved">Saved</Link>
        </Button>
        <Button variant="ghost" className={`${baseButtonClass} relative`} asChild>
          <Link to="/chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full">
                {unreadCount}
              </Badge>
            )}
          </Link>
        </Button>
      </>
    );
  };

  // Auth Buttons Component – use query parameters instead of navigation state.const 
  const AuthButtons = () => (
  <div className="flex items-center gap-4">
  <Button
    variant="ghost"
    className="text-blue-900 dark:text-white hover:text-blue-700 dark:hover:text-primary"
    onClick={() => navigate("/auth?view=login")}
  >
    Sign In
  </Button>
  <Button
    className="bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 text-white hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
    onClick={() => navigate("/auth?view=role")}
  >
    Get Started
  </Button>
</div>
);


  // Mobile Navigation Component
  const MobileNav = ({
    isAuthenticated,
    profile,
    userRole,
    unreadCount,
    onSignOut,
  }: {
    isAuthenticated: boolean;
    profile: any;
    userRole: string | null;
    unreadCount: number;
    onSignOut: () => void;
  }) => (
    <div className="flex items-center gap-4 lg:hidden">
      <ThemeToggle />
      {isAuthenticated && profile && (
        <ProfileMenu profile={profile} onSignOut={onSignOut} />
      )}

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <div className="flex flex-col gap-4 mt-8">
            <NavLinks
              userRole={userRole}
              unreadCount={unreadCount}
              isMobile
              isAuthenticated={isAuthenticated}
            />
            {!isAuthenticated && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/auth?view=login&refresh=${Date.now()}`)}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600"
                  onClick={() => navigate(`/auth?view=role&refresh=${Date.now()}`)}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <motion.nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-background/80 border-b border-blue-100 dark:border-white/10 backdrop-blur-md"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <span className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:via-blue-600 dark:to-blue-500 bg-clip-text text-transparent">
              Subspace
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <NavLinks
              userRole={userRole}
              unreadCount={unreadCount}
              isAuthenticated={isAuthenticated}
            />
            <ThemeToggle />

            {isAuthenticated ? (
              profile && (
                <ProfileMenu profile={profile} onSignOut={handleSignOut} />
              )
            ) : (
              <AuthButtons />
            )}
          </div>

          {/* Mobile Navigation */}
          <MobileNav
            isAuthenticated={isAuthenticated}
            profile={profile}
            userRole={userRole}
            unreadCount={unreadCount}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </motion.nav>
  );
}
