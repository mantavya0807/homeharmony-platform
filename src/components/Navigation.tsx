import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface NavigationProps {
  isAuthenticated: boolean | null;
  userRole: string | null;
}

export function Navigation({ isAuthenticated, userRole }: NavigationProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all chats the user is part of
        const { data: participations } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (!participations?.length) return;

        // Get unread messages count
        const { data: messages } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .in('chat_id', participations.map(p => p.chat_id))
          .eq('read', false)
          .neq('sender_id', user.id);

        setUnreadCount(messages?.length || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages and updates
    const subscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchUnreadCount(); // Refresh count on any message changes
      })
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

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-2xl font-bold">
          HomeHarmony
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/housing-complexes">Housing Complexes</Link>
              </Button>
              <Button variant="ghost" asChild className="relative">
                <Link to="/chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth" state={{ initialView: "login" }}>Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth" state={{ initialView: "role" }}>Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}