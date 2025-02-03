// src/utils/stripe.ts

import { loadStripe } from '@stripe/stripe-js';

const API_URL = 'http://localhost:4000'; // Point to Express server port

// Initialize Stripe with the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Create a Stripe Connect account by calling your backend endpoint.
 */
export const createConnectAccount = async () => {
  try {
    const response = await fetch(`${API_URL}/api/stripe/connect/account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create connect account');
    }

    const data = await response.json();
    return data; // Expected to return { accountId: string }
  } catch (error) {
    console.error('Error creating connect account:', error);
    throw error;
  }
};

/**
 * Create a Stripe Connect account session by calling your backend endpoint.
 */
export const createConnectAccountSession = async (accountId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/stripe/connect/account-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create connect account session');
    }

    const data = await response.json();
    return data; // Expected to return { url: string }
  } catch (error) {
    console.error('Error creating connect account session:', error);
    throw error;
  }
};

/**
 * Create a PaymentIntent by calling your backend endpoint.
 */
export const createPaymentIntent = async (amount: number, connectAccountId: string) => {
  try {
    console.log('Creating payment intent...', { amount, connectAccountId });

    const response = await fetch(`${API_URL}/api/stripe/payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents and round
        connectAccountId
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create payment intent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Handle a payment by first creating a PaymentIntent and then confirming the payment.
 */
export const handlePayment = async (amount: number, connectAccountId: string) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not loaded');

    // Create a PaymentIntent
    const { clientSecret } = await createPaymentIntent(amount, connectAccountId);
    if (!clientSecret) throw new Error('No client secret received');

    // Confirm the payment using Stripe.js
    const result = await stripe.confirmCardPayment(clientSecret);
    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

export { stripePromise };
