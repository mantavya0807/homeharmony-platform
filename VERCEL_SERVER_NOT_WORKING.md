# 🚨 Vercel Server Routes Not Working

## The Problem

**Frontend works ✅ (Supabase, UI, database)**  
**Backend NOT working ❌ (`/api/*` routes not being invoked)**

---

## Why Server Routes Aren't Working

### Issue 1: Vercel Build Configuration
Your `vercel.json` tries to build the server, but the output might not be correct.

**Current setup:**
```json
{
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"  // ❌ This expects compiled JS, not TS
    }
  ]
}
```

**Problem**: `@vercel/node` expects a built `.js` file, but you're pointing to `.ts`

---

## 🔍 How to Check What's Happening

### Step 1: Check Vercel Function Logs
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click "Deployments"
4. Click on the latest deployment
5. Click "Functions" tab
6. Look for errors

**What to look for:**
- ❌ "Function not found" errors
- ❌ "Module not found" errors
- ❌ TypeScript compilation errors
- ❌ Missing dependencies

---

### Step 2: Check Build Logs
1. In the same deployment
2. Click "Build Logs"
3. Look for:
   - ❌ TypeScript compilation errors
   - ❌ Missing `dist/server` directory
   - ❌ Build command failures

---

### Step 3: Test API Directly
Open browser and visit:
```
https://www.sub-space.me/api/cors-test
```

**Expected**: JSON response `{"success": true, ...}`  
**If you get 404**: Server routes not working  
**If you get 500**: Server has errors

---

## 🔧 The Fix

### Option 1: Update `vercel.json` (RECOMMENDED)

Replace your `vercel.json` with this:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/serverless.js"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

Then create `api/serverless.js`:
```javascript
// api/serverless.js
const app = require('../dist/server/index.js').default;
module.exports = app;
```

---

### Option 2: Simpler Serverless Functions (EASIER)

Instead of using Express server, create individual serverless functions.

Create `api/stripe.js`:
```javascript
// api/stripe.js
export default async function handler(req, res) {
  // Your Stripe logic here
  res.json({ success: true });
}
```

**Pros**: Works immediately with Vercel  
**Cons**: Need to rewrite all server routes

---

### Option 3: Check if Server Built

In terminal, run:
```bash
npm run vercel-build
```

Then check if `dist/server/index.js` exists:
```bash
ls dist/server/
```

**If file doesn't exist**: Build is broken  
**If file exists**: Vercel routing is wrong

---

## 🐛 Gemini API Error Fix

**Current Error:**
```
[404] models/gemini-pro is not found
```

**Reason**: `gemini-pro` model is deprecated/removed

**Fix**: Update model name in these files:

### File 1: `src/pages/Dashboard.tsx` (line 363)
**Change:**
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

**To:**
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
// Or use: "gemini-2.0-flash-exp" for faster responses
```

### File 2: `src/services/geminiService.ts` (line 28)
**Same change as above**

---

## 📊 Debugging Steps

### 1. Test Server Locally First
```bash
# Build the server
npm run vercel-build

# Check if built
ls dist/server/index.js

# Test server locally
npm start
# OR
node dist/server/index.js
```

Then test: `http://localhost:4000/api/cors-test`

**If this works**: Problem is Vercel deployment  
**If this fails**: Problem is server code

---

### 2. Check Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables

**Make sure these exist:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
GOOGLE_MAPS_API_KEY
GEMINI_API_KEY
WALK_SCORE_API_KEY (optional)
```

---

### 3. Check Package.json Build Command

Your `vercel-build` script should compile TypeScript:
```json
{
  "scripts": {
    "vercel-build": "tsc -p tsconfig.server.json && vite build"
  }
}
```

**This should create:**
- `dist/` - Frontend build
- `dist/server/` - Backend build (from tsconfig.server.json)

---

## 🎯 Most Likely Issues

### Issue 1: Server Not Being Built
**Check**: Does `dist/server/index.js` exist after build?
**Fix**: Update `tsconfig.server.json` to output to `dist/server/`

### Issue 2: Vercel Can't Find Server Entry
**Check**: Vercel logs show "Function not found"
**Fix**: Update `vercel.json` routes

### Issue 3: Dependencies Missing
**Check**: Build logs show "Cannot find module"
**Fix**: Make sure `package.json` has all server dependencies

### Issue 4: TypeScript Not Compiling
**Check**: Build logs show TS errors
**Fix**: Fix TypeScript errors, or use `skipLibCheck: true`

---

## 🚀 Quick Fix to Test

**Create a simple test endpoint:**

Create `api/test.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
}
```

Commit and push:
```bash
git add api/test.js
git commit -m "Add test endpoint"
git push origin main
```

Wait for deployment, then visit:
```
https://www.sub-space.me/api/test
```

**If this works**: Your Express server isn't being deployed correctly  
**If this fails**: Vercel routing is broken

---

## 📝 What You Need to Do

1. **Check Vercel Function Logs** (see Step 1 above)
2. **Test `/api/cors-test` endpoint** (see Step 3 above)
3. **Share the logs with me** so I can see the exact error

**Most likely issue**: Server TypeScript isn't being compiled properly for Vercel serverless functions.

---

## 🔗 Useful Links

- [Vercel Node.js Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Vercel Express.js Guide](https://vercel.com/guides/using-express-with-vercel)
- [Gemini API Models](https://ai.google.dev/gemini-api/docs/models/gemini)

---

**The server routes are definitely not working. We need to see the Vercel build/function logs to know why.**
