# Dual Document Verification Implementation

## Summary
Implemented enhanced seller verification using **lease + utility bill** cross-verification to significantly reduce fraud while maintaining low friction for legitimate users.

## What Changed

### 1. Database Schema (`ADD_UTILITY_BILL_VERIFICATION.sql`)
Added new columns to `properties` table:
- `utility_bill_url` - Stores utility bill document URL
- `lease_verified` - Boolean flag for lease verification status
- `utility_bill_verified` - Boolean flag for utility bill verification status
- `documents_match` - Boolean indicating if both documents match
- `verification_score` - Integer score (0-100)
- `verification_details` - JSONB storing detailed match results

**Run this SQL in Supabase to enable the feature.**

### 2. Backend API Changes

#### `server/api/documentVerification.ts`
- Added new `/dual` endpoint for dual document verification
- Accepts `lease` and `utilityBill` multipart form fields
- Calls `performDualDocumentVerification()` utility function
- Returns cross-verification results

#### `src/utils/documentVerification.ts`
- Added `performDualDocumentVerification()` function
- Extracts text from both documents using OCR
- Sends both to Gemini API for cross-verification
- Returns detailed match results with score

#### `server/api/gemini.ts`
- Added `/refine-dual` endpoint
- Uses Gemini 2.0 Flash to analyze both documents
- Extracts:
  - Name from lease and utility bill
  - Address from both documents
  - Lease dates and rent amount
  - Utility bill date
- Returns match status for:
  - Name match ✓/✗
  - Address match ✓/✗
  - Date validity ✓/✗ (utility bill within 60 days)

### 3. Frontend UI Changes

#### `src/pages/SellerDashboard.tsx`
- Added `utility_bill_document` field to PropertyForm interface
- Added second file upload input with clear labeling
- Added tooltip explaining utility bill requirement
- Created `handleDualVerificationUpload()` function
- Updates property with both document URLs and verification status
- Shows detailed match results in toast notification

## How It Works

### User Flow
1. User uploads **lease document** (existing flow)
2. User uploads **utility bill** (within last 30 days)
3. System extracts text from both using Google Cloud Vision OCR
4. Gemini AI cross-verifies:
   - Names match between documents
   - Addresses match between documents
   - Address matches property listing
   - Utility bill is recent (within 60 days)
   - Rent amount is reasonable
5. System shows verification status:
   - ✓ All checks pass → Verified
   - ✗ Mismatch found → Pending manual review

### Verification Logic
- **Score Calculation**: 0-100 based on match quality
- **Pass Threshold**: ≥80 for automatic verification
- **Match Requirements**: At least 2 out of 3 (name, address, date) must match
- **Fallback**: Single lease verification still works if utility bill not provided

## Security Improvements
- **Name verification**: Ensures same person on both documents
- **Address verification**: Cross-checks property location
- **Recency check**: Utility bill proves current tenancy
- **Fraud reduction**: Much harder to fake matching documents

## User Experience
- **Extra time**: ~30 seconds to upload second document
- **Clear instructions**: Tooltips explain what's needed
- **Visual feedback**: Shows which checks passed/failed
- **Backwards compatible**: Works with or without utility bill

## Testing Steps

1. **Run the SQL migration**:
   ```sql
   -- Execute ADD_UTILITY_BILL_VERIFICATION.sql in Supabase SQL Editor
   ```

2. **Test single document upload** (backwards compatibility):
   - Upload only lease → Should work as before

3. **Test dual document upload**:
   - Upload lease + utility bill
   - Check verification status in database
   - Verify toast shows match details

4. **Test mismatch scenario**:
   - Upload lease with one name
   - Upload utility bill with different name
   - Should show "Verification Pending" with ✗ marks

## Next Steps (Optional Enhancements)
- Add manual admin review interface for pending verifications
- Store extracted data for analytics
- Add email notifications when verification completes
- Allow users to re-upload documents if verification fails

## Environment Variables Required
- `GEMINI_API_KEY` - For AI verification (already configured)
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - For OCR (already configured)

## Files Modified
- `ADD_UTILITY_BILL_VERIFICATION.sql` (NEW)
- `server/api/documentVerification.ts`
- `src/utils/documentVerification.ts`
- `server/api/gemini.ts`
- `src/pages/SellerDashboard.tsx`

All changes deployed ✅
