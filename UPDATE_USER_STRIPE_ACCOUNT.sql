-- ============================================================================
-- UPDATE USER'S STRIPE ACCOUNT ID
-- ============================================================================
-- This will connect your user to the ENABLED test account
-- ============================================================================

-- Step 1: Find your user (to verify it's the right one)
SELECT 
    id,
    email,
    full_name,
    role,
    stripe_account_id
FROM profiles
WHERE email = 'your-email@example.com';  -- Replace with your actual email

-- Or if you don't know your email, see all users:
-- SELECT id, email, full_name, role, stripe_account_id FROM profiles;


-- Step 2: Update the Stripe account ID to the ENABLED test account
UPDATE profiles 
SET stripe_account_id = 'acct_1STrF2CrEtx1PJ3s'  -- Your ENABLED test account
WHERE email = 'your-email@example.com';  -- Replace with your actual email


-- Step 3: Verify the update
SELECT 
    id,
    email,
    full_name,
    stripe_account_id
FROM profiles
WHERE stripe_account_id = 'acct_1STrF2CrEtx1PJ3s';


-- ============================================================================
-- If you don't know your email, use this to update ALL seller accounts:
-- (Use carefully - this updates ALL sellers!)
-- ============================================================================

-- UPDATE profiles 
-- SET stripe_account_id = 'acct_1STrF2CrEtx1PJ3s'
-- WHERE role = 'seller';


-- ============================================================================
-- ALTERNATIVE: Update by user ID (if you know it)
-- ============================================================================

-- UPDATE profiles 
-- SET stripe_account_id = 'acct_1STrF2CrEtx1PJ3s'
-- WHERE id = 'your-user-uuid-here';


