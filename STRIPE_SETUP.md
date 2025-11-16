# 🔧 Stripe Integration Setup Guide

## Overview

This project uses **Stripe Connect** for marketplace payments. Sellers can receive payments directly to their bank accounts, and the platform takes a 5% fee per transaction.

---

## 📋 Prerequisites

1. **Stripe Account**: Create one at [stripe.com](https://stripe.com)
2. **Stripe Connect Enabled**: Enable in your Stripe Dashboard
3. **Environment Variables**: Configure as shown below

---

## 🔑 Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_API_URL=http://localhost:4000
VITE_APP_URL=http://localhost:8080
```

### Getting Your Keys:

1. **API Keys**: Dashboard → Developers → API Keys
   - Copy "Publishable key" → `VITE_STRIPE_PUBLISHABLE_KEY`
   - Copy "Secret key" → `STRIPE_SECRET_KEY`

2. **Webhook Secret**: Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen to:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated`
   - Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

---

## 🏗️ Architecture

### For Sellers (Stripe Connect)

1. Seller clicks "Connect with Stripe"
2. System creates Express Connect account
3. Seller completes onboarding on Stripe
4. Account ID saved to `profiles.stripe_account_id`

### For Buyers (Payment Element)

1. Buyer clicks "Purchase Property"
2. System creates PaymentIntent with destination charge
3. Custom payment form appears (embedded Stripe Elements)
4. Payment processed, platform fee automatically deducted
5. Seller receives remaining amount

---

## 🔄 Payment Flow

```
Buyer Payment: $1000
├─ Platform Fee (5%): $50
└─ Seller Receives: $950
```

### Technical Flow:

```
1. Buyer clicks "Purchase Property" button
   ↓
2. Frontend: Call createPaymentIntent()
   - Amount: $1000
   - Seller Account ID: acct_xyz123
   - Property ID metadata
   ↓
3. Backend: Create PaymentIntent
   - Amount: 100000 cents
   - Application Fee: 5000 cents
   - Transfer to: acct_xyz123
   ↓
4. Frontend: Show Payment Element
   - Embedded Stripe form
   - Collects card details
   ↓
5. Buyer completes payment
   ↓
6. Stripe processes payment
   ↓
7. Frontend: Call confirmPayment()
   ↓
8. Backend: Update database
   - Record transaction
   - Update property status
   ↓
9. Success! 🎉
```

---

## 📁 File Structure

```
├── server/api/stripe.ts          # Backend API endpoints
├── src/lib/stripe.ts             # Client utilities
├── src/components/
│   ├── StripePaymentElement.tsx  # Custom payment form
│   ├── PaymentButton.tsx         # Triggers payment flow
│   └── StripeConnect.tsx         # Seller onboarding
```

---

## 🔌 API Endpoints

### POST `/api/stripe/connect/create-account`
Creates a Stripe Express account for sellers.

**Request:**
```json
{
  "email": "seller@example.com",
  "businessType": "individual"
}
```

**Response:**
```json
{
  "success": true,
  "accountId": "acct_xyz123"
}
```

### POST `/api/stripe/connect/create-account-link`
Generates onboarding link for sellers.

**Request:**
```json
{
  "accountId": "acct_xyz123"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://connect.stripe.com/..."
}
```

### GET `/api/stripe/connect/account-status/:accountId`
Check if seller account is fully set up.

**Response:**
```json
{
  "success": true,
  "accountId": "acct_xyz123",
  "detailsSubmitted": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "isComplete": true
}
```

### POST `/api/stripe/create-payment-intent`
Creates a PaymentIntent for property purchase.

**Request:**
```json
{
  "amount": 1000,
  "sellerAccountId": "acct_xyz123",
  "propertyId": "prop_456",
  "metadata": {
    "buyerId": "user_789",
    "propertyTitle": "Cozy Studio Apartment"
  }
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_xyz"
}
```

### POST `/api/stripe/confirm-payment`
Verify payment completion.

**Request:**
```json
{
  "paymentIntentId": "pi_xyz"
}
```

**Response:**
```json
{
  "success": true,
  "paymentIntent": {
    "id": "pi_xyz",
    "amount": 1000,
    "status": "succeeded",
    "metadata": { ... }
  }
}
```

### POST `/api/stripe/webhook`
Handles Stripe webhook events (internal use only).

---

## 🧪 Testing

### Test Cards:

| Card Number         | Scenario              |
|--------------------|-----------------------|
| 4242 4242 4242 4242 | Successful payment    |
| 4000 0000 0000 0002 | Card declined         |
| 4000 0000 0000 9995 | Insufficient funds    |

- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### Testing Sellers:

1. Create seller account in test mode
2. Use test onboarding flow
3. Instantly approve account (no real verification needed)

---

## 🚀 Deployment

### Production Checklist:

- [ ] Switch to **LIVE** Stripe keys (pk_live_, sk_live_)
- [ ] Configure webhook endpoint with your production URL
- [ ] Test end-to-end payment flow
- [ ] Set up webhook monitoring
- [ ] Configure payout schedule in Stripe Dashboard
- [ ] Enable fraud prevention features

### Webhook URL:
```
https://your-production-domain.com/api/stripe/webhook
```

---

## 🐛 Troubleshooting

### "Account not ready to receive payments"
- Seller hasn't completed onboarding
- Check account status via `/api/stripe/connect/account-status/:id`
- Seller needs to complete identity verification

### "Payment fails immediately"
- Check Stripe Dashboard logs
- Verify seller account is fully enabled
- Ensure amount is at least $0.50
- Check webhook secret is correct

### "Nothing happens when clicking Purchase button"
- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Verify backend server is running on port 4000
- Check `VITE_API_URL` matches your backend URL

### "Stripe Elements not loading"
- Check `getStripe()` returns valid Stripe instance
- Verify publishable key format: `pk_test_...` or `pk_live_...`
- Check for JavaScript errors in console
- Ensure `@stripe/stripe-js` and `@stripe/react-stripe-js` are installed

---

## 📚 Additional Resources

- [Stripe Connect Docs](https://docs.stripe.com/connect)
- [Payment Intents API](https://docs.stripe.com/payments/payment-intents)
- [Stripe Elements](https://docs.stripe.com/payments/elements)
- [Destination Charges](https://docs.stripe.com/connect/destination-charges)
- [Stripe Testing](https://docs.stripe.com/testing)

---

## 🔐 Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Always validate** on the backend before creating charges
3. **Use webhooks** for payment confirmation (don't trust client-side only)
4. **Enable fraud detection** in Stripe Dashboard
5. **Use HTTPS** in production
6. **Rotate keys** if compromised
7. **Store webhook secret** securely

---

## 💡 Platform Fee Structure

- **Transaction Fee**: 5% per payment
- Example: $1000 payment → $50 platform, $950 to seller
- Stripe processing fees: Separate (paid by platform)
- Consider Stripe's 2.9% + $0.30 per successful charge in your pricing

---

## ✅ Setup Verification

Run this checklist to verify setup:

```bash
# 1. Check environment variables
echo $STRIPE_SECRET_KEY
echo $VITE_STRIPE_PUBLISHABLE_KEY

# 2. Start backend server
npm run server

# 3. Start frontend
npm run dev

# 4. Test seller onboarding
# Navigate to: http://localhost:8080/seller-dashboard
# Click "Connect with Stripe"

# 5. Test payment
# Navigate to property
# Click "Purchase Property"
# Use test card: 4242 4242 4242 4242
```

---

**Last Updated**: November 2025
**Stripe API Version**: 2024-11-20.acacia


