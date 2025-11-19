import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Home, CreditCard, Shield, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { stripePromise } from '@/lib/stripe';
import { createPaymentIntent } from '@/lib/stripe';

interface Property {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  photos: { url: string }[];
  seller_id: string;
  profiles: {
    stripe_account_id: string | null;
  };
}

function CheckoutForm({ property, clientSecret, onSuccess }: { property: Property; clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardReady, setCardReady] = useState(false);

  console.log('CheckoutForm render - stripe:', !!stripe, 'elements:', !!elements, 'clientSecret:', !!clientSecret);

  const PLATFORM_FEE_RATE = 0.05; // 5%
  const subtotal = property.price;
  const platformFee = subtotal * PLATFORM_FEE_RATE;
  const tax = subtotal * 0.0825; // 8.25% property tax estimate
  const total = subtotal + platformFee + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Record transaction in database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not logged in');

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            property_id: property.id,
            seller_id: property.seller_id,
            buyer_id: user.id,
            amount: total,
            payment_intent_id: paymentIntent.id,
            status: 'completed'
          });

        if (transactionError) {
          console.error('Transaction recording error:', transactionError);
        }

        // Update property status
        const { error: propertyError } = await supabase
          .from('properties')
          .update({ status: 'sold' })
          .eq('id', property.id);

        if (propertyError) {
          console.error('Property update error:', propertyError);
        }

        toast({
          title: "Payment Successful!",
          description: `You've successfully purchased ${property.title}`,
        });

        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="h-5 w-5" />
            Order Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property Price</span>
              <span className="font-medium">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee (5%)</span>
              <span className="font-medium">${platformFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Tax (8.25%)</span>
              <span className="font-medium">${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </h3>
          
          <div className="relative p-4 border border-input rounded-lg hover:border-primary/50 transition-colors min-h-[56px]">
            {!cardReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/50">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <CardElement
              onReady={() => {
                console.log('✅ CardElement is ready and mounted');
                setCardReady(true);
              }}
              onChange={(e) => {
                console.log('CardElement change:', e);
                setCardComplete(e.complete);
                if (e.error) {
                  setError(e.error.message);
                } else {
                  setError(null);
                }
              }}
              options={{
                hidePostalCode: false,
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    fontFamily: 'system-ui, sans-serif',
                    '::placeholder': {
                      color: '#94a3b8',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Your payment information is secure and encrypted
          </p>
        </CardContent>
      </Card>

      {/* Purchase Policies */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Purchase Policies
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><span className="font-medium text-foreground">Secure Transaction:</span> All payments are processed securely through Stripe</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p><span className="font-medium text-foreground">Buyer Protection:</span> Your purchase is protected by our buyer guarantee</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p><span className="font-medium text-foreground">Final Sale:</span> Property sales are final. Please review all details carefully</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p><span className="font-medium text-foreground">Tax Notice:</span> Actual tax amounts may vary. Consult with a tax professional</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !cardReady || !cardComplete || isProcessing}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : !stripe || !cardReady ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading Payment Form...
          </>
        ) : !cardComplete ? (
          'Enter Card Details'
        ) : (
          `Complete Purchase - $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By completing this purchase, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}

export default function Checkout() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCheckoutData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const loadCheckoutData = async () => {
    if (!propertyId) {
      navigate('/');
      return;
    }
    
    // Prevent duplicate calls
    if (loading === false && (property || error)) {
      console.log('Checkout data already loaded, skipping...');
      return;
    }
    try {
      // Fetch property details (images are stored in the images JSON field)
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          profiles:seller_id (stripe_account_id)
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      if (!propertyData) throw new Error('Property not found');

      // Format property data - images field is already a JSON array
      const formattedProperty = {
        ...propertyData,
        photos: propertyData.images ? propertyData.images.map((url: string) => ({ url })) : []
      };

      setProperty(formattedProperty as unknown as Property);

      // Check if seller has Stripe account
      if (!propertyData.profiles?.stripe_account_id) {
        throw new Error('Seller has not set up payments yet');
      }

      // Create PaymentIntent
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const total = propertyData.price * 1.1325; // Price + 5% fee + 8.25% tax
      const { clientSecret: secret } = await createPaymentIntent(
        total,
        propertyData.profiles.stripe_account_id
      );

      setClientSecret(secret);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to load checkout');
      toast({
        title: "Error",
        description: err.message || 'Failed to load checkout',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/purchases');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !property || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Checkout Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'Unable to load checkout'}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/properties/${propertyId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Button>
          <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
          <p className="text-muted-foreground mt-1">
            Secure checkout powered by Stripe
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Left Column - Simplified Property Card */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <div className="aspect-video relative rounded-lg overflow-hidden mb-3">
                  <img
                    src={property.photos?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {property.city}, {property.state}
                </p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{property.bedrooms} bed</span>
                  <span>•</span>
                  <span>{property.bathrooms} bath</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Checkout Form */}
          <div>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                property={property}
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
}

