# ✅ Vercel Deployment Checklist

## 🔴 CRITICAL - Do These First

### 1. Add Environment Variables in Vercel
Go to: [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

**Add these for Production, Preview, AND Development:**

```bash
# Supabase (BOTH formats needed for server compatibility)
VITE_SUPABASE_URL=https://fqomlmgklwtzguzgfzxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb21sbWdrbHd0emd1emdmenh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMTE5MTQsImV4cCI6MjA1Mjg4NzkxNH0.FD9vwl1BQ7KHC4BB3A5yv4RB6_AW_u0ifmxwL3oPVFk

VITE_PUBLIC_SUPABASE_URL=https://fqomlmgklwtzguzgfzxx.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb21sbWdrbHd0emd1emdmenh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMTE5MTQsImV4cCI6MjA1Mjg4NzkxNH0.FD9vwl1BQ7KHC4BB3A5yv4RB6_AW_u0ifmxwL3oPVFk
```

---

### 2. Fix Gemini API Key Restrictions
**Current Error**: `403 - API_KEY_SERVICE_BLOCKED`

**Steps:**
1. Go to [Google Cloud Console - API Keys](https://console.cloud.google.com/apis/credentials)
2. Click on your Gemini API key
3. **Application restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add these referrers:
     ```
     https://www.sub-space.me/*
     https://*.vercel.app/*
     ```
4. **API restrictions**:
   - Select "Restrict key"
   - Check: "Generative Language API"
5. Click **SAVE**

**Or create new key:**
```bash
# No restrictions (easier for testing)
```

Then update in Vercel:
```bash
VITE_GEMINI_API_KEY=your_new_key_here
GEMINI_API_KEY=your_new_key_here
```

---

### 3. Run SQL Scripts in Supabase

**Go to**: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor

**Run this script**: `FIX_SAVED_PROPERTIES_RLS.sql`
```sql
-- Copy and paste the content from FIX_SAVED_PROPERTIES_RLS.sql
```

This fixes the **406 error** when saving properties.

---

### 4. Commit and Push Code Changes

```bash
git add .
git commit -m "Fix Vercel deployment errors"
git push origin main
```

**Changed files:**
- ✅ `src/App.tsx` - Increased profile query timeout
- ✅ `src/utils/trackPropertyClick.ts` - Removed non-existent columns
- ✅ `server/api/propertyClicks.ts` - Fixed Supabase env vars
- ✅ `src/components/Analytics.tsx` - Reduced console warnings

---

## ⚠️ OPTIONAL - Improve Features

### 5. Add WalkScore API Key (Optional)
Currently using mock data fallback, which works fine.

If you want real WalkScore data:
1. Get API key from [WalkScore](https://www.walkscore.com/professional/api.php)
2. Add to Vercel:
   ```bash
   WALK_SCORE_API_KEY=your_walkscore_key_here
   ```

---

### 6. Add Location Tracking (Optional)
If you want to track user locations for analytics:

**Run in Supabase SQL Editor**: `ADD_LOCATION_COLUMNS.sql`

Then uncomment location tracking in `src/utils/trackPropertyClick.ts`

---

## 🧪 Testing After Deployment

Visit https://www.sub-space.me/ and test:

1. ✅ **Login** - Should not timeout (10s timeout now)
2. ✅ **Browse properties** - No 500 errors
3. ✅ **Click on property** - Tracking should work (no 500)
4. ✅ **Save property** - No 406 error
5. ✅ **View property details** - Location info loads
6. 🔴 **AI Search** - Will work after Gemini API fix
7. ✅ **Google Maps** - Should load fine

---

## 📊 Check Logs

### Vercel Function Logs:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to "Deployments"
4. Click latest deployment
5. Click "View Function Logs"

Look for:
- ✅ No "Supabase credentials not found" errors
- ✅ No 500 errors from API routes

### Supabase Logs:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your Project → Logs → API
3. Look for:
   - ✅ No RLS policy violations
   - ✅ Successful queries

---

## 🎯 Expected Results After Fixes

| Issue | Status | Solution |
|-------|--------|----------|
| Profile timeout | ✅ Fixed | Increased timeout to 10s + fallback |
| Location columns 400 | ✅ Fixed | Removed query |
| Property clicks 500 | ✅ Fixed | Fixed env vars |
| Saved properties 406 | 🔴 **RUN SQL** | Need RLS policies |
| Gemini API 403 | 🔴 **FIX API KEY** | Update restrictions |
| WalkScore 500 | ⚠️ Using mock data | Optional: Add API key |
| Analytics warning | ✅ Fixed | Reduced console spam |

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Add environment variables in Vercel Dashboard (see above)

# 2. Fix Gemini API key restrictions in Google Cloud Console

# 3. Run FIX_SAVED_PROPERTIES_RLS.sql in Supabase SQL Editor

# 4. Push code changes
git add .
git commit -m "Fix deployment errors"
git push origin main

# 5. Wait for Vercel to redeploy (automatic)

# 6. Test: https://www.sub-space.me/
```

---

## 📞 Need Help?

Check these logs:
- **Frontend errors**: Browser DevTools Console
- **Backend errors**: Vercel Function Logs
- **Database errors**: Supabase Dashboard → Logs

---

**Last Updated**: November 16, 2025
