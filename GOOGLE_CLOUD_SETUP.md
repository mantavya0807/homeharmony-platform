# Google Cloud Service Account Setup Guide

## Step-by-Step Instructions

### Step 1: Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"NEW PROJECT"**
4. Enter project name: `homeharmony-platform` (or your preferred name)
5. Click **"CREATE"**
6. Wait for project creation, then select it from the dropdown

---

### Step 2: Enable Required APIs

1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for and enable these APIs:
   - **Cloud Vision API** (for OCR/document verification)
   - **Google Maps JavaScript API** (for maps)
   - **Places API** (for nearby places)
   - **Directions API** (for transit directions)
   - **Geocoding API** (for address conversion)

3. For each API:
   - Click on it
   - Click **"ENABLE"**
   - Wait for it to enable

---

### Step 3: Create Service Account

1. Go to [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **"+ CREATE SERVICE ACCOUNT"**
3. Fill in the details:
   - **Service account name**: `homeharmony-vision-api`
   - **Service account ID**: (auto-generated, keep it)
   - **Description**: `Service account for HomeHarmony document verification`
4. Click **"CREATE AND CONTINUE"**

---

### Step 4: Grant Permissions

1. In the **"Grant this service account access to project"** section:
   - **Role**: Select **"Cloud Vision API User"** or **"Editor"** (for broader access)
2. Click **"CONTINUE"**
3. Click **"DONE"** (skip optional user access)

---

### Step 5: Create and Download Key

1. Find your newly created service account in the list
2. Click on it (the email address)
3. Go to the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"CREATE"**
7. **The JSON file will automatically download** - this is your credentials file!

---

### Step 6: Save the Credentials File

1. **Move the downloaded JSON file** to your project:
   ```
   keys/homeharmony-service-account.json
   ```

2. **Update your `.env` file:**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./keys/homeharmony-service-account.json
   ```

   Or use full path:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=C:\Users\mrss\Desktop\new folder\homeharmony-platform\keys\homeharmony-service-account.json
   ```

---

### Step 7: Set Up Billing (Required for APIs)

1. Go to [Billing](https://console.cloud.google.com/billing)
2. Click **"LINK A BILLING ACCOUNT"**
3. Create a new billing account or link existing one
4. **Note**: Google Cloud has a free tier:
   - Cloud Vision API: 1,000 requests/month free
   - Maps API: $200 credit/month free
   - Most projects stay within free tier for development

---

### Step 8: Set API Restrictions (Security)

1. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your **API keys** (not service account)
3. For each API key:
   - Click to edit
   - **Application restrictions**: 
     - HTTP referrers: `https://www.sub-space.me/*`
     - `https://*.vercel.app/*` (for preview deployments)
   - **API restrictions**: Select specific APIs only
   - Click **"SAVE"**

---

## ✅ Verification

Test that everything works:

1. **Check file exists:**
   ```bash
   ls keys/homeharmony-service-account.json
   ```

2. **Verify .env has correct path:**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./keys/homeharmony-service-account.json
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## 🔐 For Vercel Deployment

1. **Get JSON content:**
   ```bash
   cat keys/homeharmony-service-account.json
   ```

2. **Copy entire JSON** (from `{` to `}`)

3. **Add to Vercel Environment Variables:**
   - Name: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Value: Paste entire JSON
   - Environment: Production, Preview, Development

---

## 📋 Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Cloud Vision API
- [ ] Enabled Maps/Places/Directions APIs
- [ ] Created service account
- [ ] Downloaded JSON key file
- [ ] Saved to `keys/` folder
- [ ] Updated `.env` file
- [ ] Set up billing account
- [ ] Added restrictions to API keys
- [ ] Tested locally
- [ ] Added JSON to Vercel environment variables

---

## 🆘 Troubleshooting

### Error: "Credentials not found"
- Check file path in `.env` is correct
- Use forward slashes: `./keys/file.json`
- Or use absolute path with backslashes: `C:\Users\...`

### Error: "Permission denied"
- Make sure service account has "Cloud Vision API User" role
- Check APIs are enabled in the project

### Error: "Billing not enabled"
- Enable billing in Google Cloud Console
- Free tier should be sufficient for development

---

## 💡 Pro Tips

1. **Never commit credentials to git** - Already in `.gitignore` ✅
2. **Use different service accounts** for dev/prod if needed
3. **Set up usage alerts** in Google Cloud Console
4. **Monitor API usage** regularly
5. **Rotate keys** periodically for security

---

## 📚 Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
- [Cloud Vision API Docs](https://cloud.google.com/vision/docs)
- [Maps API Setup](https://developers.google.com/maps/documentation/javascript/get-api-key)

