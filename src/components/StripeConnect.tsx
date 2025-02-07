import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { createConnectAccount, createConnectAccountSession } from '@/utils/stripe';

export default function StripeConnect() {
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (profile?.stripe_account_id) {
        setAccountId(profile.stripe_account_id);
        setSuccess(true);
      }
    } catch (error) {
      console.error('Error checking account status:', error);
      setError('Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnectLoading(true);
    setError(null);

    try {
      // Create a Connect account
      const { accountId } = await createConnectAccount();

      // Save the account ID to the user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Create an account link and redirect
      const { url } = await createConnectAccountSession(accountId);
      if (!url) throw new Error('Failed to create account session');

      window.location.href = url;
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      setError(error.message || 'Failed to connect Stripe account');
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Connect with Stripe</CardTitle>
          <CardDescription>
            Set up your Stripe account to receive payments from buyers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Connected to Stripe</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your Stripe account is connected and ready to receive payments.
              </p>
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                >
                  Open Stripe Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Why connect with Stripe?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Securely receive payments from buyers</li>
                  <li>• View your earnings and transaction history</li>
                  <li>• Fast payouts to your bank account</li>
                  <li>• Automatic tax reporting</li>
                </ul>
              </div>

              <Button
                onClick={handleConnect}
                disabled={connectLoading}
                className="w-full"
              >
                {connectLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Stripe"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}