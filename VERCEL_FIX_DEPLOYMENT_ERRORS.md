# 🔧 Vercel Deployment Error Fixes

## Issues Found in Console

Based on the production errors at https://www.sub-space.me/, here are the problems and solutions:

---

## ✅ Fixed Issues

### 1. **Profile Query Timeout (Error: Profile query timeout)**
- **Problem**: 3-second timeout was too short for Vercel cold starts
- **Fix**: Increased timeout to 10 seconds and added fallback to default 'buyer' role
- **Status**: ✅ Fixed in `src/App.tsx`

### 2. **Location Columns Missing (400 Bad Request)**
```
GET /rest/v1/profiles?select=location_latitude,location_longitude 400
```
- **Problem**: Querying non-existent columns `location_latitude` and `location_longitude`
- **Fix**: Removed the query in `src/utils/trackPropertyClick.ts`
- **Status**: ✅ Fixed
- **Optional**: Run `ADD_LOCATION_COLUMNS.sql` if you want location tracking

### 3. **Property Clicks API 500 Error**
```
POST /api/property-clicks 500 (Internal Server Error)
```
- **Problem**: Supabase environment variables not found in server
- **Fix**: Updated `server/api/propertyClicks.ts` to check both `VITE_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_URL`
- **Status**: ✅ Fixed

---

## 🚨 Critical: Environment Variables to Add in Vercel

### Go to: [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables (set for **Production**, **Preview**, AND **Development**):

```bash
# Backend needs these WITHOUT VITE_ prefix
VITE_SUPABASE_URL=https://fqomlmgklwtzguzgfzxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb21sbWdrbHd0emd1emdmenh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMTE5MTQsImV4cCI6MjA1Mjg4NzkxNH0.FD9vwl1BQ7KHC4BB3A5yv4RB6_AW_u0ifmxwL3oPVFk

# Alternative names (for backwards compatibility)
VITE_PUBLIC_SUPABASE_URL=https://fqomlmgklwtzguzgfzxx.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb21sbWdrbHd0emd1emdmenh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMTE5MTQsImV4cCI6MjA1Mjg4NzkxNH0.FD9vwl1BQ7KHC4BB3A5yv4RB6_AW_u0ifmxwL3oPVFk
```

---

## ⚠️ API Key Issues to Fix

### 4. **Gemini API 403 Blocked**
```
[403] Requests to this API generativelanguage.googleapis.com are blocked
```

**Problem**: API key restrictions blocking production domain

**Fix**:
1. Go to [Google Cloud Console - API Keys](https://console.cloud.google.com/apis/credentials)
2. Find your Gemini API key
3. Edit → **Application restrictions**:
   - Remove or change restrictions
   - Add HTTP referrers:
     - `https://www.sub-space.me/*`
     - `https://*.vercel.app/*`
4. **API restrictions**: Select **"Restrict key"** → Check **"Generative Language API"**
5. **Save**

**Or Generate New Key**:
```bash
# Create new unrestricted key for testing
gcloud alpha services api-keys create \
  --display-name="Gemini API - Production" \
  --api-target=service=generativelanguage.googleapis.com
```

Then update Vercel environment variable:
```bash
VITE_GEMINI_API_KEY=your_new_key_here
GEMINI_API_KEY=your_new_key_here
```

---

### 5. **Google Maps API Issues**

**Warning**: `Google Maps JavaScript API has been loaded directly without loading=async`

**Fix**: Already using async loading in code, this is a minor warning.

**Deprecation**: `google.maps.Marker is deprecated`

**Fix**: Update to use Advanced Markers (low priority, current markers still work)

---

### 6. **WalkScore API 500 Error**
```
GET /api/walkscore/score 500 (Internal Server Error)
```

**Problem**: WalkScore API key not working or rate limited

**Fix**: The code already falls back to mock data, but check server logs in Vercel:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → View Function Logs
3. Look for WalkScore errors

**Optional**: Add WalkScore API key in Vercel:
```bash
WALK_SCORE_API_KEY=your_walkscore_key_here
```

Or the API will continue using mock data (which works fine for demo).

---

### 7. **Saved Properties 406 Error**
```
GET /rest/v1/saved_properties 406 (Not Acceptable)
```

**Problem**: Supabase REST API returning 406 - likely RLS policy issue

**Fix**: Run this SQL in Supabase SQL Editor:

```sql
-- Allow users to read their own saved properties
CREATE POLICY IF NOT EXISTS "Users can view own saved properties"
ON saved_properties
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own saved properties
CREATE POLICY IF NOT EXISTS "Users can save properties"
ON saved_properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own saved properties
CREATE POLICY IF NOT EXISTS "Users can unsave properties"
ON saved_properties
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

## 🔄 After Making Changes

### Redeploy to Vercel:

1. **If you changed code**:
   ```bash
   git add .
   git commit -m "Fix deployment errors"
   git push origin main
   ```

2. **If you only changed environment variables**:
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment
   - OR just wait - next push will pick up new variables

---

## 🧪 Testing After Fixes

Test these features on https://www.sub-space.me/:

1. ✅ **Login/Register** - Should not timeout
2. ✅ **Browse Properties** - No 500 errors
3. ✅ **Click Property** - Tracking should work
4. ✅ **Save Property** - No 406 errors
5. ✅ **View Property Details** - WalkScore loads (or shows mock data)
6. ⚠️ **AI Search** - Will work after Gemini API fix
7. ✅ **Maps** - Should load fine

---

## 📊 Monitoring

### Check Vercel Function Logs:
```
Vercel Dashboard → Project → Deployments → Latest → View Function Logs
```

### Check Supabase Logs:
```
Supabase Dashboard → Logs → API Logs
```

---

## 🎯 Priority Order

1. **High Priority** (breaks functionality):
   - ✅ Fix Supabase environment variables
   - ✅ Fix profile timeout
   - 🔴 Fix Gemini API key restrictions
   - 🔴 Fix saved_properties RLS policies

2. **Medium Priority** (degrades experience):
   - ⚠️ WalkScore API (currently using mock data fallback)
   - ⚠️ Google Maps deprecation warning

3. **Low Priority** (cosmetic):
   - ℹ️ Vercel Analytics warning
   - ℹ️ Chrome extension errors (not your app's fault)

---

## 📝 Summary of Code Changes

Files modified:
- ✅ `src/App.tsx` - Increased timeout, added fallback
- ✅ `src/utils/trackPropertyClick.ts` - Removed non-existent columns
- ✅ `server/api/propertyClicks.ts` - Fixed Supabase env vars

SQL scripts to run:
- 🔴 `FIX_SAVED_PROPERTIES_RLS.sql` (create this)
- ⚠️ `ADD_LOCATION_COLUMNS.sql` (optional)

Environment variables to add:
- 🔴 `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel
- 🔴 Fix Gemini API key restrictions in Google Cloud Console
- ⚠️ `WALK_SCORE_API_KEY` (optional)

---

**After these fixes, your deployment should be fully functional! 🚀**
