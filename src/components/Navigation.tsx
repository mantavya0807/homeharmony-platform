import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
  role: string;
  full_name: string | null;
}

export function Navigation() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setSession(session);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setProfile(null);
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

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold">
          HomeHarmony
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : session ? (
            <>
              <Button variant="ghost" asChild>
                <Link to={profile?.role === "seller" ? "/seller-dashboard" : "/dashboard"}>
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
  <Link to="/chat">
    <MessageSquare className="h-4 w-4 mr-2" />
    Messages
  </Link>
</Button>
              <Button onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <>

              <Button variant="ghost" asChild>
                <Link 
                  to="/auth" 
                  state={{ initialView: "login" }}
                >
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link 
                  to="/auth" 
                  state={{ initialView: "role" }}
                >
                  Get Started
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}