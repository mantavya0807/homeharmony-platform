# Production Deployment Guide

## 🚀 Current Setup
- **Frontend + Backend**: Both deploy on Vercel (unified deployment)
- **Configuration**: `vercel.json` handles routing - `/api/*` → backend, everything else → frontend

---

## 📋 Environment Variables for Production

### ⚠️ CRITICAL: Must Change/Revoke These Keys First

**EXPOSED API KEY** (found in git history):
- `AIzaSyBc9lsvGxCCrT0cvi2o1nm1LyISnz3y_Lo` 
- **ACTION**: Go to Google Cloud Console → Credentials → DELETE or REGENERATE this key immediately

---

## 🔐 Required Environment Variables

### 1. **Frontend Environment Variables** (prefix with `VITE_`)

Add these in **Vercel Project Settings** → **Environment Variables**:

```bash
# Supabase (get from Supabase Dashboard → Project Settings → API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe (get from Stripe Dashboard → Developers → API Keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE  # Use pk_live_ for production
# OR for testing: pk_test_...

# Google APIs (create NEW keys at https://console.cloud.google.com/apis/credentials)
VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_GOOGLE_MAPS_KEY
VITE_GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY

# App URLs (update with your actual domain)
VITE_API_URL=https://your-app.vercel.app/api
VITE_APP_URL=https://your-app.vercel.app
```

---

### 2. **Backend Environment Variables** (NO `VITE_` prefix)

Also add these in **Vercel Environment Variables**:

```bash
# Stripe Backend (from Stripe Dashboard → Developers → API Keys)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE  # Use sk_live_ for production
# OR for testing: sk_test_...

STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET  # Get after setting up webhook

# Google APIs (same keys as frontend, but without VITE_ prefix for server)
GOOGLE_MAPS_API_KEY=YOUR_NEW_GOOGLE_MAPS_KEY
GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY

# Optional APIs
WALK_SCORE_API_KEY=your_walkscore_key_if_you_have_one

# Server Config (Vercel sets this automatically)
PORT=4000
NODE_ENV=production
```

---

## 📝 Step-by-Step Deployment Instructions

### Step 1: Revoke Compromised Keys

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find and DELETE: `AIzaSyBc9lsvGxCCrT0cvi2o1nm1LyISnz3y_Lo`
3. Create NEW API keys with restrictions:
   - **Google Maps API Key**: Add HTTP referrer restrictions (your domain)
   - **Gemini API Key**: Add API restrictions (only Gemini API)

---

### Step 2: Set Up Stripe for Production

#### Option A: Use Test Mode (Recommended for Initial Setup)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

#### Option B: Use Live Mode (For Real Transactions)
1. Complete Stripe business verification
2. Use live keys:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

---

### Step 3: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `homeharmony-platform`
3. Go to **Settings** → **Environment Variables**
4. Add ALL variables from above (both frontend `VITE_*` and backend)
5. Set environment scope:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

---

### Step 4: Set Up Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (for Connect)
   - `checkout.session.completed`
5. Copy the **Signing secret** (`whsec_...`)
6. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

### Step 5: Configure Google Cloud Platform

1. **Enable Required APIs:**
   - Google Maps JavaScript API
   - Google Places API
   - Google Directions API
   - Gemini API (Google AI Studio)

2. **Add API Restrictions:**
   ```
   HTTP Referrers:
   - https://your-app.vercel.app/*
   - https://*.vercel.app/* (for preview deployments)
   ```

3. **Set Usage Quotas** (to prevent abuse):
   - Maps API: Set daily limits
   - Gemini API: Monitor token usage

---

### Step 6: Deploy to Vercel

```bash
# Option 1: Push to GitHub (automatic deployment)
git push origin main

# Option 2: Manual deployment via CLI
npm install -g vercel
vercel --prod
```

---

## 🔍 Verify Deployment

### 1. Check Backend APIs
```bash
# Test CORS
curl https://your-app.vercel.app/api/cors-test

# Test Stripe (should return 405 for GET)
curl https://your-app.vercel.app/api/stripe/connect/create-account

# Test Google Places
curl https://your-app.vercel.app/api/google-places/nearby?lat=40.7934&lng=-77.86
```

### 2. Check Frontend
- Visit `https://your-app.vercel.app`
- Open browser DevTools → Console
- Look for: `🔑 Stripe key present: true`
- Test property search with map

### 3. Check Stripe Connection
- Log in as seller
- Go to Seller Dashboard
- Click "Connect with Stripe"
- Should redirect to Stripe onboarding

---

## 🛡️ Security Checklist

- [ ] Old Google API key revoked/deleted
- [ ] New API keys have domain restrictions
- [ ] Using `sk_live_` keys only in production environment
- [ ] Stripe webhook signature verification enabled
- [ ] `.env` file NOT committed (in `.gitignore`)
- [ ] No hardcoded API keys in source code
- [ ] CORS configured for production domain
- [ ] Supabase RLS policies enabled

---

## 📊 Environment Variable Summary

| Variable | Where Used | Required | Example |
|----------|-----------|----------|---------|
| `VITE_SUPABASE_URL` | Frontend | ✅ Yes | `https://abc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend | ✅ Yes | `eyJ...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend | ✅ Yes | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | Backend | ✅ Yes | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Backend | ✅ Yes | `whsec_...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend | ✅ Yes | `AIza...` (NEW KEY) |
| `VITE_GEMINI_API_KEY` | Frontend | ✅ Yes | `AIza...` (NEW KEY) |
| `GOOGLE_MAPS_API_KEY` | Backend | ✅ Yes | `AIza...` (same as frontend) |
| `GEMINI_API_KEY` | Backend | ✅ Yes | `AIza...` (same as frontend) |
| `VITE_API_URL` | Frontend | ⚠️ Auto | `https://your-app.vercel.app/api` |
| `VITE_APP_URL` | Backend | ⚠️ Auto | `https://your-app.vercel.app` |
| `WALK_SCORE_API_KEY` | Backend | ⭕ Optional | `your_key` |

---

## 🚨 Common Issues & Solutions

### Issue 1: "Stripe key not found"
**Solution**: Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set in Vercel environment variables (with `VITE_` prefix)

### Issue 2: "CORS error on API calls"
**Solution**: 
1. Check `VITE_API_URL` points to correct domain
2. Verify Vercel routes in `vercel.json` are correct

### Issue 3: "Google Maps not loading"
**Solution**: 
1. Generate NEW Google Maps API key
2. Add domain restriction: `https://your-app.vercel.app/*`
3. Enable required APIs in Google Cloud Console

### Issue 4: Stripe webhook not working
**Solution**:
1. Verify webhook URL: `https://your-app.vercel.app/api/stripe/webhook`
2. Check `STRIPE_WEBHOOK_SECRET` is set correctly
3. Test using Stripe CLI: `stripe trigger payment_intent.succeeded`

---

## 📱 Post-Deployment Testing

1. **User Registration/Login** ✅
2. **Property Search** ✅
3. **Map Loading** ✅
4. **Stripe Connect Onboarding** ✅
5. **Property Purchase Flow** ✅
6. **Chat Functionality** ✅
7. **Google Transit Directions** ✅

---

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)

---

## 💡 Pro Tips

1. **Use Test Mode First**: Test everything with `pk_test_` and `sk_test_` keys before going live
2. **Monitor Stripe Events**: Check Stripe Dashboard → Developers → Events to debug webhook issues
3. **Preview Deployments**: Every PR creates a preview deployment - test there first
4. **Environment Variables**: Changes require redeployment to take effect
5. **Logs**: Check Vercel → Deployments → View Function Logs for debugging

---

## 🎯 Next Steps After Deployment

1. Set up custom domain in Vercel (optional)
2. Configure DNS records
3. Enable Vercel Analytics
4. Set up error monitoring (e.g., Sentry)
5. Configure Stripe Connect settings
6. Test all payment flows thoroughly
7. Add usage alerts for Google APIs

---

**Need Help?** Check Vercel deployment logs for detailed error messages.

