import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});

// Create a Connect account
router.post('/connect/account', async (req, res) => {
  try {
    console.log('Creating Stripe account...');
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      settings: {
        payouts: {
          schedule: {
            interval: 'manual'
          }
        }
      }
    });

    console.log('Stripe account created:', account.id);
    res.json({ accountId: account.id });
  } catch (error: any) {
    console.error('Error creating Stripe account:', error);
    res.status(500).json({ 
      error: 'Failed to create Stripe account',
      details: error.message 
    });
  }
});

// Create an account session
router.post('/connect/account-session', async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    console.log('Creating account session for:', accountId);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.VITE_APP_URL}/onboarding/refresh`,
      return_url: `${process.env.VITE_APP_URL}/onboarding/complete`,
      type: 'account_onboarding',
      collect: 'eventually_due'
    });

    console.log('Account session created with URL:', accountLink.url);
    res.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Error creating account session:', error);
    res.status(500).json({ 
      error: 'Failed to create account session',
      details: error.message 
    });
  }
});

// Check account status
router.get('/account/:accountId/status', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await stripe.accounts.retrieve(accountId);
    
    res.json({
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
      capabilities: account.capabilities
    });
  } catch (error: any) {
    console.error('Error checking account status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a payment intent
router.post('/payment-intent', async (req, res) => {
  try {
    const { amount, connectAccountId } = req.body;
    
    if (!amount || !connectAccountId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Amount and connectAccountId are required'
      });
    }

    // First, verify the account status
    const account = await stripe.accounts.retrieve(connectAccountId);
    if (account.capabilities?.transfers !== 'active') {
      return res.status(400).json({
        error: 'Account not ready',
        details: 'The seller account has not completed the onboarding process'
      });
    }

    console.log('Creating payment intent...', { amount, connectAccountId });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure amount is in cents and rounded
      currency: 'usd',
      payment_method_types: ['card'],
      application_fee_amount: Math.round(amount * 0.05), // 5% platform fee
      transfer_data: {
        destination: connectAccountId,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

export default router;
