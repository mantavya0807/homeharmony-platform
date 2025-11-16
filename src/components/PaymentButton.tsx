/**
 * Payment Button Component
 * Navigates to dedicated checkout page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAccountStatus } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';

interface PaymentButtonProps {
  propertyId: string;
  propertyTitle: string;
  sellerId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function PaymentButton({
  propertyId,
  propertyTitle,
  sellerId,
  amount,
  onSuccess,
  onError,
  className,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const initializePayment = async () => {
    setLoading(true);
    try {
      // Verify seller has Stripe account set up
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', sellerId)
        .single();

      if (sellerError || !sellerProfile?.stripe_account_id) {
        throw new Error('Seller is not set up to receive payments.');
      }

      // Check account status
      const accountStatus = await getAccountStatus(sellerProfile.stripe_account_id);
      if (!accountStatus.chargesEnabled || !accountStatus.payoutsEnabled) {
        throw new Error('Seller account is not yet enabled to receive payments.');
      }

      // Navigate to checkout page
      navigate(`/checkout/${propertyId}`);
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Unable to Process Payment",
        description: error.message || "Something went wrong initializing payment.",
        variant: "destructive",
      });
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={initializePayment}
      disabled={loading}
      className={className}
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Purchase Property - ${amount.toLocaleString()}
        </>
      )}
    </Button>
  );
}
