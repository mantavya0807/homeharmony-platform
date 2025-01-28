import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface StripePaymentProps {
  propertyId: string;
  propertyTitle: string;
  price: number;
  sellerId: string;
}

export default function StripePayment({ propertyId, propertyTitle, price, sellerId }: StripePaymentProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBuyClick = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get the user's session for authentication
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to make a purchase",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Make the request to your Supabase Edge Function
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabase.supabaseKey,
            'x-deno-subhost': supabase.supabaseUrl
          },
          body: JSON.stringify({
            propertyId,
            propertyTitle,
            price,
            sellerId,
            successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/properties/${propertyId}`
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "w-full py-3 px-4 rounded-lg text-white font-semibold flex items-center justify-center transition-colors",
        "bg-green-600 hover:bg-green-700"
      )}
      onClick={handleBuyClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Buy Property"
      )}
    </motion.button>
  );
}