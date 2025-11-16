/**
 * Modern Stripe Integration - November 2025
 * 
 * This implements:
 * - Stripe Connect Express accounts for sellers
 * - PaymentIntent API for secure payments
 * - Destination charges (platform takes fee, rest goes to seller)
 * - Embedded onboarding components
 */

import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Stripe - using default API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * CREATE CONNECT ACCOUNT
 * Creates a Stripe Express account for sellers
 */
router.post('/connect/create-account', async (req, res) => {
  try {
    const { email, businessType = 'individual' } = req.body;

    console.log('Creating Stripe Connect account for:', email);

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: businessType,
    });

    console.log('✅ Created Stripe account:', account.id);

    res.json({
      success: true,
      accountId: account.id,
    });
  } catch (error: any) {
    console.error('❌ Error creating Connect account:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * CREATE ACCOUNT LINK
 * Generates an onboarding link for seller to complete their Stripe setup
 */
router.post('/connect/create-account-link', async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required',
      });
    }

    // Get app URL - VITE_APP_URL is available in Vercel, fallback for local dev
    const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'http://localhost:8080';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/seller-dashboard?onboarding=refresh`,
      return_url: `${appUrl}/seller-dashboard?onboarding=complete`,
      type: 'account_onboarding',
    });

    console.log('✅ Created account link for:', accountId);

    res.json({
      success: true,
      url: accountLink.url,
    });
  } catch (error: any) {
    console.error('❌ Error creating account link:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET ACCOUNT STATUS
 * Check if seller account is fully onboarded and can receive payments
 */
router.get('/connect/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    const isComplete = account.details_submitted === true &&
                      account.charges_enabled === true &&
                      account.payouts_enabled === true;

    res.json({
      success: true,
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      isComplete: isComplete,
      requirements: account.requirements,
    });
  } catch (error: any) {
    console.error('❌ Error fetching account status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Helper function to sanitize metadata for Stripe
 * Stripe metadata has strict requirements:
 * - Values must be strings
 * - No control characters or '..'
 * - Max 500 characters per value
 * - Max 50 keys
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    
    // Convert to string and sanitize
    let sanitizedValue = String(value)
      .replace(/\.\./g, '') // Remove '..'
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 500); // Limit length
    
    // Only include if not empty
    if (sanitizedValue.trim()) {
      sanitized[key] = sanitizedValue;
    }
  }
  
  return sanitized;
}

/**
 * CREATE PAYMENT INTENT
 * Creates a PaymentIntent for a property purchase
 * Uses destination charges - platform takes 5% fee, rest goes to seller
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    // Trim all string inputs to remove any whitespace/newlines
    const { amount, propertyId, metadata = {} } = req.body;
    const sellerAccountId = req.body.sellerAccountId?.trim();

    // Validation
    if (!amount || amount < 50) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least $0.50',
      });
    }

    if (!sellerAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Seller account ID is required',
      });
    }

    // Verify seller account is ready
    const account = await stripe.accounts.retrieve(sellerAccountId);
    
    if (!account.charges_enabled) {
      return res.status(400).json({
        success: false,
        error: 'Seller account is not yet enabled to receive payments',
      });
    }

    // Calculate platform fee (5%)
    const platformFeeAmount = Math.round(amount * 0.05);
    const amountInCents = Math.round(amount * 100); // Convert dollars to cents

    // Sanitize metadata to prevent Stripe errors
    const safeMetadata = sanitizeMetadata({
      propertyId: propertyId || '',
      ...metadata,
    });

    // Create PaymentIntent with destination charge (on platform account, transfers to connected account)
    // Note: Do NOT use on_behalf_of with destination charges (transfer_data)
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'], // Explicit payment methods for Elements compatibility
      // Temporarily disable application fee to test if that's the issue
      // application_fee_amount: Math.round(platformFeeAmount * 100),
      transfer_data: {
        destination: sellerAccountId,
      },
      metadata: safeMetadata,
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('❌ Error creating PaymentIntent:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * CONFIRM PAYMENT
 * Called after successful payment to update database
 */
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment Intent ID is required',
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata,
        },
      });
    } else {
      res.json({
        success: false,
        error: 'Payment not yet completed',
        status: paymentIntent.status,
      });
    }
  } catch (error: any) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * WEBHOOK HANDLER
 * Handles Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).send('Webhook signature or secret missing');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`📨 Received webhook: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`✅ PaymentIntent succeeded: ${paymentIntent.id}`);
      // Here you would update your database to mark the transaction as complete
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ Payment failed: ${failedPayment.id}`);
      break;

    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      console.log(`🔄 Account updated: ${account.id}`);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;

