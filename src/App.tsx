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
import { Navigation } from "./components/Navigation";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setUserRole(profile?.role || null);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <Navigation />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/auth"
                  element={
                    isAuthenticated ? (
                      <Navigate to={userRole === 'seller' ? '/seller-dashboard' : '/dashboard'} />
                    ) : (
                      <Auth />
                    )
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    !isAuthenticated ? (
                      <Navigate to="/auth" />
                    ) : userRole === "seller" ? (
                      <Navigate to="/seller-dashboard" />
                    ) : (
                      <Dashboard />
                    )
                  }
                />
                <Route
                  path="/seller-dashboard"
                  element={
                    !isAuthenticated ? (
                      <Navigate to="/auth" />
                    ) : userRole !== "seller" ? (
                      <Navigate to="/dashboard" />
                    ) : (
                      <SellerDashboard />
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