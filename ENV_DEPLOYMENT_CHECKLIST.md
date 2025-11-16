# Environment Variables Deployment Checklist

## 🚨 Issues Found in Your Current Setup

### Problem 1: Server Using `VITE_` Variables
In `server/api/stripe.ts`, the code uses:
```typescript
process.env.VITE_APP_URL  // ❌ WRONG - VITE_ vars don't exist in server
```

**Fix Needed:** The server should use `APP_URL` or `VITE_APP_URL` should be available to server (Vercel makes this work, but let's be explicit).

---

## ✅ Correct Environment Variables for Deployment

### **Local `.env` File** (for development)

```env
# ============================================
# SUPABASE
# ============================================
VITE_SUPABASE_URL=https://fqomlmgklwtzguzgfzxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ============================================
# STRIPE (Use TEST keys for local dev)
# ============================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ============================================
# GOOGLE APIs (Generate NEW keys!)
# ============================================
# Frontend keys (with VITE_ prefix)
VITE_GOOGLE_MAPS_API_KEY=AIza...your_new_google_maps_key
VITE_GEMINI_API_KEY=AIza...your_new_gemini_key

# Backend keys (NO VITE_ prefix - for server)
GOOGLE_MAPS_API_KEY=AIza...your_new_google_maps_key
GEMINI_API_KEY=AIza...your_new_gemini_key

# ============================================
# GOOGLE CLOUD VISION (Service Account)
# ============================================
# Local: Use file path
GOOGLE_APPLICATION_CREDENTIALS=./keys/meal-plan-optimizer-9dcf86e16b65.json

# ============================================
# APP URLs (Local Development)
# ============================================
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:4000/api

# ============================================
# OPTIONAL APIs
# ============================================
WALK_SCORE_API_KEY=your_walkscore_key_if_you_have_one
```

---

### **Vercel Environment Variables** (for production)

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

Add these (set for Production, Preview, AND Development):

```env
# ============================================
# SUPABASE
# ============================================
VITE_SUPABASE_URL=https://fqomlmgklwtzguzgfzxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ============================================
# STRIPE (Use LIVE keys for production, TEST for testing)
# ============================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================
# GOOGLE APIs (NEW KEYS - revoke old ones!)
# ============================================
# Frontend (with VITE_ prefix)
VITE_GOOGLE_MAPS_API_KEY=AIza...your_new_key
VITE_GEMINI_API_KEY=AIza...your_new_key

# Backend (NO VITE_ prefix)
GOOGLE_MAPS_API_KEY=AIza...your_new_key
GEMINI_API_KEY=AIza...your_new_key

# ============================================
# GOOGLE CLOUD VISION (Service Account JSON)
# ============================================
# Get JSON content: cat keys/meal-plan-optimizer-9dcf86e16b65.json
# Paste ENTIRE JSON as value (single line or multi-line)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# ============================================
# APP URLs (Production)
# ============================================
VITE_APP_URL=https://www.sub-space.me

# DO NOT SET VITE_API_URL - uses relative /api automatically!

# ============================================
# SERVER CONFIG
# ============================================
NODE_ENV=production
PORT=4000
```

---

## 🔧 Fix Required in Code

The server code needs to be updated to handle `VITE_APP_URL` properly. Let me check and fix it:

