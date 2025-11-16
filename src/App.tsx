import { Toaster } from "@/components/ui/toaster";
import { motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
// import LoginFormComponent from "./pages/LoginPage";
import SellerDashboard from "./pages/SellerDashboard";
import { ChatInterface } from "./components/ChatInterface";
import { Navigation } from "./components/Navigation";
import { Analytics } from "@/components/Analytics";
import { useEffect, useState } from "react";
import { BuyerReviews, SellerReviews } from "./components/Reviews";
import { supabase } from "./integrations/supabase/client";
import PropertyDetails from "./components/PropertyDetails";
import HousingComplexes from "./components/HousingComplexes";
import SavedProperties from "./pages/SavedProperties";
import ProfilePage from "./components/ProfilePage";
import UserReviews from "./components/UserReview";
import StripeConnect from "./components/StripeConnect";
import { SellerProfile } from "./components/SellerProfile";
import Checkout from "./pages/Checkout";
import BuyerPurchases from "./pages/BuyerPurchases";

const queryClient = new QueryClient();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile query timeout')), 10000)
          );
          
          const profilePromise = supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          
          try {
            const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as any;
            setUserRole(profile?.role || null);
          } catch (err) {
            console.warn('Profile fetch timed out, using default role');
            setUserRole('buyer'); // Default to buyer if fetch fails
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession) {
          try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 10000)
            );
            
            const profilePromise = supabase
              .from("profiles")
              .select("role")
              .eq("id", newSession.user.id)
              .single();
            
            const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as any;
            setUserRole(profile?.role || null);
          } catch (error) {
            console.warn("Profile fetch timed out, keeping current role");
            // Don't change role on timeout - keep whatever role was set before
          }
        } else {
          setUserRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen relative bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-background dark:to-background">
        {/* Background gradient and glow effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 dark:from-background dark:via-background/95 dark:to-background" />
        
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-100 to-transparent dark:from-primary/10 dark:to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
        </div>

        {/* Loading content */}
        <div className="relative flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-white/10 shadow-xl">
              <div className="flex items-center gap-3 px-4">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-600/40 dark:border-blue-400/40 animate-[spin_3s_linear_infinite]" />
                  <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin absolute inset-0" />
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="font-semibold bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:to-blue-600 bg-clip-text text-transparent">
                    Loading
                  </h3>
                  <p className="text-sm text-muted-foreground">Please wait...</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/housing-complexes" element={<HousingComplexes />} />
                
                {/* Auth routes */}
                <Route
                  path="/register"
                  element={
                    session ? (
                      <Navigate 
                        to={userRole === "seller" ? "/seller-dashboard" : "/dashboard"} 
                        replace 
                      />
                    ) : (
                      <Register />
                    )
                  }
                />
                <Route
                  path="/login"
                  element={
                    session ? (
                      <Navigate 
                        to={userRole === "seller" ? "/seller-dashboard" : "/dashboard"} 
                        replace 
                      />
                    ) : (
                      <Login />
                    )
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    !session ? (
                      <Navigate to="/login" replace />
                    ) : userRole === "seller" ? (
                      <Navigate to="/seller-dashboard" replace />
                    ) : (
                      <Dashboard />
                    )
                  }
                />

                <Route
                  path="/saved"
                  element={
                    !session ? <Navigate to="/login" replace /> : <SavedProperties />
                  }
                />

                <Route
                  path="/purchases"
                  element={
                    !session ? (
                      <Navigate to="/login" replace />
                    ) : userRole === "seller" ? (
                      <Navigate to="/seller-dashboard" replace />
                    ) : (
                      <BuyerPurchases />
                    )
                  }
                />

                <Route
                  path="/chat"
                  element={
                    !session ? <Navigate to="/login" replace /> : <ChatInterface />
                  }
                />

                <Route
                  path="/seller-dashboard"
                  element={
                    !session ? (
                      <Navigate to="/login" replace />
                    ) : userRole !== "seller" ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <SellerDashboard />
                    )
                  }
                />

                <Route
                  path="/properties/:id"
                  element={
                    !session ? <Navigate to="/login" replace /> : <PropertyDetails />
                  }
                />

                <Route
                  path="/checkout/:propertyId"
                  element={
                    !session ? <Navigate to="/login" replace /> : <Checkout />
                  }
                />

                <Route
                  path="/profile"
                  element={
                    !session ? <Navigate to="/login" replace /> : <ProfilePage />
                  }
                />

                <Route
                  path="/reviews/:userId"
                  element={
                    !session ? <Navigate to="/login" replace /> : <UserReviews />
                  }
                />

                <Route
                  path="/stripe-connect"
                  element={
                    !session ? (
                      <Navigate to="/login" replace />
                    ) : userRole !== "seller" ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <StripeConnect />
                    )
                  }
                />

                <Route
                  path="/seller/:sellerId"
                  element={
                    !session ? <Navigate to="/login" replace /> : <SellerProfile />
                  }
                />

                <Route
                  path="/reviews"
                  element={
                    !session ? (
                      <Navigate to="/login" replace />
                    ) : userRole !== "seller" ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <SellerReviews />
                    )
                  }
                />

                <Route
                  path="/buyer-reviews"
                  element={
                    !session ? (
                      <Navigate to="/login" replace />
                    ) : userRole !== "buyer" ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <BuyerReviews />
                    )
                  }
                />
              </Routes>
              <Analytics />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}