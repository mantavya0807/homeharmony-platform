import { useEffect, useState, useRef } from "react";
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
import { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

// Add the cn utility function
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavigationProps {
  isAuthenticated: boolean;
  userRole: string | null;
}

// Rest of your original Navigation component code stays exactly the same
export function Navigation({ isAuthenticated, userRole }: NavigationProps) {
  // All your existing code remains unchanged
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  // Mouse tracking for glow effect
  const navRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getGlowStyles = () => {
    const lightGlow = `
      radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(30, 64, 175, 0.15), 
        rgba(59, 130, 246, 0.1), 
        transparent
      )
    `;
    
    const darkGlow = `
      radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(66, 153, 225, 0.15), 
        transparent
      )
    `;
    
    return {
      background: theme === 'dark' ? darkGlow : lightGlow,
      opacity: 0.7,
    };
  };

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

  // NavLinks Component
  const NavLinks = ({
    isAuthenticated,
    userRole,
    unreadCount,
    isMobile = false,
  }: {
    isAuthenticated: boolean;
    userRole: string | null;
    unreadCount: number;
    isMobile?: boolean;
  }) => {
    if (!isAuthenticated) return null;

    const baseButtonClass = cn(
      "relative font-medium transition-all duration-300",
      "hover:text-blue-800 dark:hover:text-primary",
      isMobile ? "w-full justify-start" : ""
    );

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

  return (
    <motion.nav
      ref={navRef}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/80 dark:bg-background/80 border-b border-blue-100 dark:border-white/10 backdrop-blur-md"
          : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Glow Effect */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300" 
        style={getGlowStyles()} 
      />

      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 dark:from-background dark:via-background/95 dark:to-background opacity-80" />

      {/* Content */}
      <div className="container mx-auto px-4 relative">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:via-blue-600 dark:to-blue-500 bg-clip-text text-transparent">
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
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="text-blue-900 dark:text-white hover:text-blue-700 dark:hover:text-primary"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 text-white hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-4 lg:hidden">
            <ThemeToggle />
            {isAuthenticated && profile && (
              <ProfileMenu profile={profile} onSignOut={handleSignOut} />
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
                        onClick={() => navigate(`/login&refresh=${Date.now()}`)}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600"
                        onClick={() => navigate(`/register&refresh=${Date.now()}`)}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}