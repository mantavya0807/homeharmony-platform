import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  Loader2,
  Home,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Receipt,
  Package,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Property = Database["public"]["Tables"]["properties"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface PurchaseWithDetails {
  transaction: Transaction;
  property: Property;
  seller: Profile;
}

export default function BuyerPurchases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "active" | "past">("all");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        navigate("/login");
        return;
      }

      // Fetch transactions for current user with property and seller details
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          property:properties(*),
          seller:profiles!transactions_seller_id_fkey(*)
        `)
        .eq("buyer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      const formattedPurchases = (transactionsData || []).map((t: any) => ({
        transaction: t,
        property: t.property,
        seller: t.seller,
      }));

      setPurchases(formattedPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast({
        title: "Error",
        description: "Failed to load your purchases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPurchases = () => {
    const now = new Date();
    return purchases.filter((purchase) => {
      if (filter === "all") return true;
      
      const subleaseFrom = purchase.property.sublease_from 
        ? new Date(purchase.property.sublease_from) 
        : null;
      const subleaseTo = purchase.property.sublease_to 
        ? new Date(purchase.property.sublease_to) 
        : null;

      if (filter === "upcoming") {
        return subleaseFrom && subleaseFrom > now;
      }
      if (filter === "active") {
        return subleaseFrom && subleaseTo && subleaseFrom <= now && subleaseTo >= now;
      }
      if (filter === "past") {
        return subleaseTo && subleaseTo < now;
      }
      return true;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredPurchases = getFilteredPurchases();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-background dark:to-background">
      <div className="container mx-auto px-4 pt-20 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 dark:from-primary dark:via-blue-600 dark:to-blue-500 bg-clip-text text-transparent">
            <ShoppingBag className="inline-block mr-3 h-12 w-12 mb-2" />
            My Purchases
          </h1>
          <p className="text-muted-foreground text-lg">
            View and manage all your property purchases
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
              <TabsTrigger value="all">
                All ({purchases.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="active">
                Active
              </TabsTrigger>
              <TabsTrigger value="past">
                Past
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Purchase List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredPurchases.length === 0 ? (
            <Card className="backdrop-blur-sm bg-white/50 dark:bg-card/50 border-blue-100 dark:border-white/10">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-6 rounded-full bg-primary/10 text-primary">
                    <Package className="h-12 w-12" />
                  </div>
                  <h2 className="text-2xl font-semibold">No Purchases Yet</h2>
                  <p className="text-muted-foreground max-w-sm">
                    {filter === "all" 
                      ? "You haven't purchased any properties yet. Start browsing to find your perfect place!"
                      : `No ${filter} purchases found.`}
                  </p>
                  {filter === "all" && (
                    <Button onClick={() => navigate("/dashboard")}>
                      <Home className="mr-2 h-4 w-4" />
                      Browse Properties
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPurchases.map((purchase, index) => (
                <motion.div
                  key={purchase.transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="backdrop-blur-sm bg-white/50 dark:bg-card/50 border-blue-100 dark:border-white/10 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-[250px_1fr] gap-6">
                        {/* Property Image */}
                        <div className="relative aspect-video md:aspect-square rounded-lg overflow-hidden">
                          <img
                            src={
                              purchase.property.images?.[0] ||
                              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                            }
                            alt={purchase.property.title}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-2 right-2 bg-green-500">
                            Purchased
                          </Badge>
                        </div>

                        {/* Property Details */}
                        <div className="flex flex-col">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-2">
                              {purchase.property.title}
                            </h3>
                            
                            <div className="space-y-3 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {purchase.property.address}, {purchase.property.city},{" "}
                                  {purchase.property.state}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>
                                  Seller: {purchase.seller.full_name || "Unknown"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Purchased: {formatDate(purchase.transaction.created_at)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-semibold text-foreground">
                                  ${purchase.transaction.amount.toLocaleString()}
                                </span>
                              </div>

                              {purchase.property.sublease_from && purchase.property.sublease_to && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    Lease: {formatDate(purchase.property.sublease_from)} -{" "}
                                    {formatDate(purchase.property.sublease_to)}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                <span className="text-xs">
                                  Transaction ID: {purchase.transaction.payment_intent_id}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-3 text-sm">
                              <Badge variant="outline">
                                {purchase.property.bedrooms} Bed
                              </Badge>
                              <Badge variant="outline">
                                {purchase.property.bathrooms} Bath
                              </Badge>
                              <Badge variant="outline">
                                {purchase.property.square_feet} sqft
                              </Badge>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/properties/${purchase.property.id}`)}
                            >
                              View Property
                            </Button>
                            <Button
                              onClick={() => navigate('/chat', { state: { sellerId: purchase.seller.id } })}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Contact Seller
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/seller/${purchase.seller.id}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

