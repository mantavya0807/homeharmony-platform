# Environment Configuration Guide

## Overview
This project uses different environment configurations for **local development** and **production deployment**.

## Files Structure

```
.env                  # Local development (ignored by git)
.env.example          # Template with placeholder values (committed to git)
.env.production       # Production values reference (DO NOT commit with real secrets)
```

## Quick Setup

### For Local Development

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Set the mode:**
   ```dotenv
   NODE_ENV=local
   ```

3. **Configure URLs for local:**
   ```dotenv
   VITE_APP_URL=http://localhost:5173
   GEMINI_API_URL=http://localhost:4000/api/gemini/refine
   PORT=4000
   ```

4. **Fill in your API keys** (get these from respective service dashboards)

5. **Start development server:**
   ```bash
   npm run dev
   ```

### For Production (Vercel)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Copy all variables from `.env.production`**

3. **Key differences for production:**
   ```dotenv
   NODE_ENV=production
   VITE_APP_URL=https://www.sub-space.me
   GEMINI_API_URL=https://www.sub-space.me/api/gemini/refine
   VITE_API_URL=https://www.sub-space.me/api
   ```

4. **Important:** Use `GOOGLE_APPLICATION_CREDENTIALS_JSON` (full JSON string) instead of file path

## Environment Variables Reference

### Core Configuration
| Variable | Local | Production | Description |
|----------|-------|------------|-------------|
| `NODE_ENV` | `local` | `production` | Environment mode |
| `PORT` | `4000` | N/A | Server port (local only) |

### Application URLs
| Variable | Local | Production | Description |
|----------|-------|------------|-------------|
| `VITE_APP_URL` | `http://localhost:5173` | `https://www.sub-space.me` | Frontend URL |
| `GEMINI_API_URL` | `http://localhost:4000/api/gemini/refine` | `https://www.sub-space.me/api/gemini/refine` | Gemini API endpoint |
| `VITE_API_URL` | Not set | `https://www.sub-space.me/api` | Backend API base |

### Supabase (Same for both)
- `VITE_PUBLIC_SUPABASE_URL`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

### Stripe
**Development:**
- Use `sk_test_...` and `pk_test_...` keys

**Production:**
- Switch to `sk_live_...` and `pk_live_...` keys
- ⚠️ **NEVER commit live keys to git!**

### Google Cloud Services
- `GOOGLE_MAPS_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` (full JSON for Vercel)
- `WALK_SCORE_API_KEY`

## Switching Between Environments

### Method 1: Manual Edit (Recommended for testing)
Edit `.env` file and change:
```dotenv
# Switch to local
NODE_ENV=local
VITE_APP_URL=http://localhost:5173
GEMINI_API_URL=http://localhost:4000/api/gemini/refine

# Switch to production
NODE_ENV=production
VITE_APP_URL=https://www.sub-space.me
GEMINI_API_URL=https://www.sub-space.me/api/gemini/refine
VITE_API_URL=https://www.sub-space.me/api
```

### Method 2: Separate Files
Keep two files:
- `.env.local` (local settings)
- `.env.production` (production settings)

Copy the appropriate one to `.env` as needed:
```bash
# For local development
cp .env.local .env

# For production testing
cp .env.production .env
```

## Security Best Practices

✅ **DO:**
- Keep `.env` in `.gitignore`
- Use `.env.example` for team templates
- Store production secrets in Vercel dashboard
- Use test Stripe keys during development

❌ **DON'T:**
- Commit real API keys to git
- Share production `.env` via Slack/email
- Use production Stripe keys in development
- Hardcode secrets in source code

## Troubleshooting

### Issue: "API calls failing in production"
**Solution:** Check that `VITE_APP_URL` and `GEMINI_API_URL` use production domain, not localhost

### Issue: "CORS errors in development"
**Solution:** Ensure `VITE_APP_URL=http://localhost:5173` (not https)

### Issue: "OCR not working on Vercel"
**Solution:** Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` contains the full JSON string (not file path)

### Issue: "Environment variables not updating"
**Solution:** 
1. Restart dev server: `npm run dev`
2. For Vercel: Redeploy after changing env vars

## Testing Environment Setup

```bash
# Verify environment is loaded
npm run dev

# Check console for:
# - API URL being used
# - Supabase connection
# - Any missing env var warnings
```

## Need Help?

- Check `.env.example` for required variables
- See `PRODUCTION_DEPLOYMENT_GUIDE.md` for Vercel setup
- Contact team if API keys are missing
