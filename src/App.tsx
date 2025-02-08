// App.tsx
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
import { Analytics } from "@/components/Analytics";
import { useEffect, useState } from "react";
import {BuyerReviews, SellerReviews}  from "./components/Reviews";
import { supabase } from "./integrations/supabase/client";
import PropertyDetails from "./components/PropertyDetails";
import { ProtectedRoute } from "./components/ProtectedRoute";
import HousingComplexes from "./components/HousingComplexes";
import SavedProperties from "./pages/SavedProperties";
import ProfilePage from "./components/ProfilePage";
import UserReviews from "./components/UserReview";
import StripeConnect from "./components/StripeConnect";
import { SellerProfile } from "./components/SellerProfile";

const queryClient = new QueryClient();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", newSession.user.id)
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
                      <Navigate to={userRole === "seller" ? "/seller-dashboard" : "/dashboard"} />
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
                <Route path="/saved" element={!session ? <Navigate to="/auth" /> : <SavedProperties />} />
                <Route path="/chat" element={!session ? <Navigate to="/auth" /> : <ChatInterface />} />
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
                <Route path="/properties/:id" element={!session ? <Navigate to="/auth" /> : <PropertyDetails />} />
                <Route path="/profile" element={!session ? <Navigate to="/auth" /> : <ProfilePage />} />
                <Route
                  path="/reviews/:userId"
                  element={!session ? <Navigate to="/auth" /> : <UserReviews />}
                />
                <Route
                  path="/stripe-connect"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : userRole !== "seller" ? (
                      <Navigate to="/dashboard" />
                    ) : (
                      <StripeConnect />
                    )
                  }
                />
                {/* Seller profile page */}
                <Route path="/seller/:sellerId" element={!session ? <Navigate to="/auth" /> : <SellerProfile />} />
                {/* Seller reviews page (for sellers to see reviews received) */}
                <Route
                  path="/reviews"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : userRole !== "seller" ? (
                      <Navigate to="/dashboard" />
                    ) : (
                      <SellerReviews />
                    )
                  }
                />
                {/* Buyer reviews page (for buyers to see the reviews they have given) */}
                <Route
                  path="/buyer-reviews"
                  element={
                    !session ? (
                      <Navigate to="/auth" />
                    ) : userRole !== "buyer" ? (
                      <Navigate to="/dashboard" />
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
