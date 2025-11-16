# ⚡ Quick Production Setup

## 🚨 URGENT: Before Deployment

### 1. Revoke Exposed API Key
```
Go to: https://console.cloud.google.com/apis/credentials
DELETE KEY: AIzaSyBc9lsvGxCCrT0cvi2o1nm1LyISnz3y_Lo
```

---

## 🔑 Environment Variables Needed for Vercel

Copy-paste this into Vercel Environment Variables:

### Frontend Variables (with VITE_ prefix):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_ for production
VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_GOOGLE_KEY
VITE_GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY
VITE_API_URL=https://your-app.vercel.app/api
VITE_APP_URL=https://your-app.vercel.app
```

### Backend Variables (NO VITE_ prefix):
```env
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_MAPS_API_KEY=YOUR_NEW_GOOGLE_KEY
GEMINI_API_KEY=YOUR_NEW_GEMINI_KEY
NODE_ENV=production
```

---

## 📍 Where to Get Each Key

### Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy: **URL** and **anon public** key

### Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. **For Testing**: Use "Test mode" keys (pk_test_, sk_test_)
3. **For Production**: Switch to "Live mode" keys (pk_live_, sk_live_)

### Google Maps & Gemini API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **API Key**
3. Click **"EDIT API KEY"** → Add restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add `https://your-app.vercel.app/*`
4. **API restrictions**: Select specific APIs
5. Create TWO keys (or use same for both):
   - One for **Maps JavaScript API, Places API, Directions API**
   - One for **Gemini API**

### Stripe Webhook Secret
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. Copy the **Signing secret** (`whsec_...`)

---

## 🚀 Deployment Steps

### Method 1: Automatic (Recommended)
```bash
# Just push to GitHub - Vercel deploys automatically
git add .
git commit -m "chore: Production configuration"
git push origin main
```

### Method 2: Manual via Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

---

## ✅ Checklist

- [ ] Old API key deleted from Google Cloud Console
- [ ] All environment variables added to Vercel
- [ ] Stripe webhook configured
- [ ] Google APIs enabled (Maps, Places, Directions, Gemini)
- [ ] API key restrictions added (domain whitelist)
- [ ] Deployed to Vercel
- [ ] Tested Stripe Connect onboarding
- [ ] Tested property search and maps
- [ ] Tested payment flow

---

## 🎯 Current Architecture

```
┌─────────────────────────────────────────┐
│         VERCEL (Single Deployment)      │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (React + Vite)                │
│  ↓  Routes: /* → index.html             │
│                                         │
│  Backend (Express Server)               │
│  ↓  Routes: /api/* → server/index.ts    │
│                                         │
└─────────────────────────────────────────┘
         ↓                    ↓
    Supabase            Stripe APIs
    (Database)          (Payments)
```

**Benefits:**
- ✅ Single deployment
- ✅ No CORS issues (same domain)
- ✅ Automatic HTTPS
- ✅ Free tier available
- ✅ Git-based deployments

---

## 🔧 Need to Update Variables?

1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Edit or add variables
4. **IMPORTANT**: Redeploy for changes to take effect
   - Settings → Deployments → Redeploy

---

## 📞 Support Resources

- **Vercel Issues**: Check deployment logs in Vercel dashboard
- **Stripe Issues**: Check Events in Stripe dashboard
- **API Issues**: Check Vercel Function Logs (real-time)
- **Full Guide**: See `PRODUCTION_DEPLOYMENT_GUIDE.md`

