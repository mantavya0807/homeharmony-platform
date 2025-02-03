import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { handlePayment } from '@/utils/stripe';
import { supabase } from '@/integrations/supabase/client';

interface PaymentButtonProps {
  propertyId: string;
  sellerId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PaymentButton({ propertyId, sellerId, amount, onSuccess, onError }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkAccountStatus = async (accountId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/stripe/account/${accountId}/status`);
      if (!response.ok) throw new Error('Failed to check account status');
      
      const accountStatus = await response.json();
      
      if (!accountStatus.charges_enabled || !accountStatus.payouts_enabled) {
        throw new Error('Seller account is not fully set up to receive payments');
      }
      
      return true;
    } catch (error) {
      console.error('Account status error:', error);
      throw error;
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);

      // Get seller's Stripe account ID
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', sellerId)
        .single();

      if (sellerError || !sellerProfile?.stripe_account_id) {
        throw new Error('Seller is not set up to receive payments');
      }

      // Check account status before proceeding
      await checkAccountStatus(sellerProfile.stripe_account_id);

      // Process payment
      const paymentIntent = await handlePayment(
        amount, // The utility will convert to cents
        sellerProfile.stripe_account_id
      );

      if (!paymentIntent) {
        throw new Error('Payment failed');
      }

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          property_id: propertyId,
          seller_id: sellerId,
          buyer_id: (await supabase.auth.getUser()).data.user?.id,
          amount: amount,
          payment_intent_id: paymentIntent.id,
          status: 'completed'
        });

      if (transactionError) {
        throw transactionError;
      }

      // Update property status
      const { error: propertyError } = await supabase
        .from('properties')
        .update({ status: 'sold' })
        .eq('id', propertyId);

      if (propertyError) {
        throw propertyError;
      }

      toast({
        title: "Success!",
        description: "Your payment has been processed successfully.",
      });

      onSuccess?.();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong with the payment.",
        variant: "destructive",
      });
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePurchase}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing Payment...
        </>
      ) : (
        `Purchase Property ($${amount.toLocaleString()})`
      )}
    </Button>
  );
}