import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SellerDashboard from "./pages/SellerDashboard";
import { ChatInterface } from "./components/ChatInterface";
import { Navigation } from "./components/Navigation";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import PropertyDetails from "./components/PropertyDetails";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import HousingComplexes from "./components/HousingComplexes";
import SavedProperties from "./pages/SavedProperties";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Get user profile
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      
      if (newSession) {
        // Get user profile when auth state changes
        supabase
          .from('profiles')
          .select('role')
          .eq('id', newSession.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
          });
      } else {
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <Navigation isAuthenticated={!!session} userRole={userRole} />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/housing-complexes" element={<HousingComplexes />} />
                <Route
                  path="/auth"
                  element={
                    session ? (
                      <Navigate to={userRole === 'seller' ? '/seller-dashboard' : '/dashboard'} />
                    ) : (
                      <Auth />
                    )
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : userRole === "seller" ? (
                      <Navigate to="/seller-dashboard" />
                    ) : (
                      <Dashboard />
                    )
                  }
                />
                <Route
                  path="/saved"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : (
                      <SavedProperties />
                    )
                  }
                />
                <Route
                  path="/chat"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : (
                      <ChatInterface />
                    )
                  }
                />
                <Route
                  path="/seller-dashboard"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : userRole !== "seller" ? (
                      <Navigate to="/dashboard" />
                    ) : (
                      <SellerDashboard />
                    )
                  }
                />
                <Route
                  path="/properties/:id"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : (
                      <PropertyDetails />
                    )
                  }
                />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;