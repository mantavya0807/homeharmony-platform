/**
 * Modern Stripe Connect Component
 * Handles seller onboarding to Stripe Express accounts
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { createConnectAccount, createAccountLink, getAccountStatus } from '@/lib/stripe';

interface AccountStatus {
  accountId: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  isComplete: boolean;
  requirements?: any;
}

export default function StripeConnect() {
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUserEmail(user.email || null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (profile?.stripe_account_id) {
        setAccountId(profile.stripe_account_id);
        
        // Fetch detailed account status from Stripe
        try {
          const status = await getAccountStatus(profile.stripe_account_id);
          setAccountStatus(status);
        } catch (statusError) {
          console.error('Error fetching account status:', statusError);
          // Still set the account ID even if status check fails
        }
      }
    } catch (error) {
      console.error('Error checking account status:', error);
      setError('Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setConnectLoading(true);
    setError(null);

    try {
      if (!userEmail) {
        throw new Error('User email not found');
      }

      console.log('Creating Stripe Connect account...');

      // Create a new Connect account
      const { accountId: newAccountId } = await createConnectAccount(userEmail);

      // Save the account ID to the user's profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: newAccountId })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAccountId(newAccountId);

      // Redirect to onboarding
      await handleContinueOnboarding(newAccountId);
    } catch (error: any) {
      console.error('Error creating Stripe account:', error);
      setError(error.message || 'Failed to create Stripe account');
      setConnectLoading(false);
    }
  };

  const handleContinueOnboarding = async (accId?: string) => {
    const targetAccountId = accId || accountId;
    if (!targetAccountId) return;

    setConnectLoading(true);
    setError(null);

    try {
      console.log('Creating account link for:', targetAccountId);

      // Create an account link and redirect
      const { url } = await createAccountLink(targetAccountId);
      
      if (!url) throw new Error('Failed to create account link');

      console.log('Redirecting to Stripe onboarding...');
      window.location.href = url;
    } catch (error: any) {
      console.error('Error creating account link:', error);
      setError(error.message || 'Failed to start onboarding');
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
    <div className="container max-w-2xl mx-auto py-8 px-4">
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
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {accountStatus?.isComplete ? (
            <div className="space-y-6">
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Connected to Stripe</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your Stripe account is fully set up and ready to receive payments.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Account Status:</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Charges Enabled:</span>
                  <Badge variant="default">
                    {accountStatus.chargesEnabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payouts Enabled:</span>
                  <Badge variant="default">
                    {accountStatus.payoutsEnabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Stripe Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleContinueOnboarding()}
                  className="flex-1"
                >
                  Update Account
                </Button>
              </div>
            </div>
          ) : accountId ? (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your Stripe account is created but not yet fully set up. Complete the onboarding
                  to start receiving payments.
                </AlertDescription>
              </Alert>

              {accountStatus && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Details Submitted:</span>
                    <Badge variant={accountStatus.detailsSubmitted ? 'default' : 'secondary'}>
                      {accountStatus.detailsSubmitted ? 'Yes' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Charges Enabled:</span>
                    <Badge variant={accountStatus.chargesEnabled ? 'default' : 'secondary'}>
                      {accountStatus.chargesEnabled ? 'Yes' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Payouts Enabled:</span>
                    <Badge variant={accountStatus.payoutsEnabled ? 'default' : 'secondary'}>
                      {accountStatus.payoutsEnabled ? 'Yes' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              )}

              <Button
                onClick={() => handleContinueOnboarding()}
                disabled={connectLoading}
                className="w-full"
                size="lg"
              >
                {connectLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Continue Stripe Onboarding'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Why connect with Stripe?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Securely receive payments from buyers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>View your earnings and transaction history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Fast payouts to your bank account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Automatic tax reporting and compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Platform fee: Only 5% per transaction</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleCreateAccount}
                disabled={connectLoading}
                className="w-full"
                size="lg"
              >
                {connectLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Connect with Stripe'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By connecting, you agree to Stripe's{' '}
                <a
                  href="https://stripe.com/connect/account-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Connect Account Agreement
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
