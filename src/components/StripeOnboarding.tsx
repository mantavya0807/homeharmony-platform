import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { createConnectAccount, createConnectAccountSession } from '@/utils/stripe';
import { supabase } from '@/integrations/supabase/client';

export default function StripeOnboarding() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStripeConnect = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create Stripe Connect account
      const { accountId } = await createConnectAccount();
      if (!accountId) throw new Error('No account ID received from Stripe');

      // Save the account ID to the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
      if (updateError) throw updateError;

      // Create an account session
      const { url } = await createConnectAccountSession(accountId);
      if (!url) throw new Error('No onboarding URL received from Stripe');

      // Redirect to Stripe Connect onboarding
      window.location.href = url;
    } catch (error: any) {
      console.error('Error connecting to Stripe:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Stripe account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleStripeConnect} disabled={loading} className="w-full">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting to Stripe...
        </>
      ) : (
        'Connect with Stripe'
      )}
    </Button>
  );
}
