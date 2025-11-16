-- ============================================================================
-- RESET STRIPE ACCOUNT IDs FOR ALL USERS
-- ============================================================================
-- Run this in Supabase SQL Editor to clear all Stripe account connections
-- This is useful when switching Stripe accounts or API keys
-- ============================================================================

-- Step 1: Check current Stripe accounts (OPTIONAL - just to see what will be cleared)
SELECT 
    id,
    email,
    full_name,
    stripe_account_id,
    created_at
FROM profiles 
WHERE stripe_account_id IS NOT NULL;

-- Step 2: Clear all Stripe account IDs
UPDATE profiles 
SET stripe_account_id = NULL;

-- Step 3: Verify the reset (should return no rows)
SELECT 
    id,
    email,
    stripe_account_id
FROM profiles 
WHERE stripe_account_id IS NOT NULL;

-- ============================================================================
-- DONE! All users' Stripe account IDs have been cleared.
-- 
-- Next steps:
-- 1. Make sure your .env has the correct STRIPE_SECRET_KEY
-- 2. Restart your backend server: npm run server
-- 3. Go to /seller-dashboard and click "Connect with Stripe" again
-- ============================================================================
