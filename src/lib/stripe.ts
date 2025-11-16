/**
 * Stripe Client Utilities
 * Modern implementation using PaymentElement and Connect APIs
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Initialize Stripe immediately
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error('❌ Stripe publishable key not found in environment variables');
  console.error('Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file');
}

console.log('🔑 Stripe key present:', !!publishableKey);

export const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);

export const getStripe = () => stripePromise;

/**
 * Create a Stripe Connect account for sellers
 */
export const createConnectAccount = async (email: string) => {
  try {
    const response = await fetch(`${API_URL}/api/stripe/connect/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create Connect account');
    }

    return data;
  } catch (error: any) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
};

/**
 * Create an account link for seller onboarding
 */
export const createAccountLink = async (accountId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/stripe/connect/create-account-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create account link');
    }

    return data;
  } catch (error: any) {
    console.error('Error creating account link:', error);
    throw error;
  }
};

/**
 * Get Connect account status
 */
export const getAccountStatus = async (accountId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/stripe/connect/account-status/${accountId}`);
    
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch account status');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching account status:', error);
    throw error;
  }
};

/**
 * Create a PaymentIntent for property purchase
 */
export const createPaymentIntent = async (
  amount: number,
  sellerAccountId: string,
  propertyId?: string,
  metadata?: Record<string, string>
) => {
  try {
    console.log(`Creating PaymentIntent for $${amount}`);

    const response = await fetch(`${API_URL}/api/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        sellerAccountId,
        propertyId,
        metadata,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    return data;
  } catch (error: any) {
    console.error('Error creating PaymentIntent:', error);
    throw error;
  }
};

/**
 * Confirm payment after successful transaction
 */
export const confirmPayment = async (paymentIntentId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/stripe/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to confirm payment');
    }

    return data;
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};
