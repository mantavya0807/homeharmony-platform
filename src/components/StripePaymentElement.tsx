/**
 * Modern Stripe Payment Element Component
 * Custom embedded payment form using Stripe Elements
 */

import React, { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getStripe } from '@/lib/stripe';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  propertyTitle: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

/**
 * Inner payment form that has access to Stripe hooks
 */
const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  amount,
  propertyTitle,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

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
        setMessage(error.message || 'An error occurred during payment');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment successful!');
        setIsComplete(true);
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred');
      onError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Property:</span>
          <span className="font-medium">{propertyTitle}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Amount:</span>
          <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Includes 5% platform fee
        </div>
      </div>

      <div className="py-4 px-3 border rounded-md">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {message && (
        <Alert variant={isComplete ? 'default' : 'destructive'}>
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing || isComplete}
        className="w-full"
        size="lg"
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isProcessing
          ? 'Processing...'
          : isComplete
          ? 'Payment Complete'
          : `Pay $${amount.toFixed(2)}`}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Secured by Stripe • Your payment information is encrypted
      </p>
    </form>
  );
};

interface StripePaymentElementProps {
  clientSecret: string;
  amount: number;
  propertyTitle: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

/**
 * Main component that wraps the payment form with Stripe Elements provider
 */
export const StripePaymentElement: React.FC<StripePaymentElementProps> = ({
  clientSecret,
  amount,
  propertyTitle,
  onSuccess,
  onError,
}) => {
  const stripePromise = getStripe();

  if (!stripePromise) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Stripe is not configured. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // CardElement doesn't need clientSecret in options
  const options = {
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>
          Enter your payment details below to complete the transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            clientSecret={clientSecret}
            amount={amount}
            propertyTitle={propertyTitle}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default StripePaymentElement;

