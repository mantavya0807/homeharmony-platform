-- Fix: Remove newline characters from stripe_account_id
-- Run this in Supabase SQL Editor

-- Clean up any whitespace/newlines from stripe_account_id
UPDATE profiles 
SET stripe_account_id = TRIM(stripe_account_id)
WHERE stripe_account_id IS NOT NULL;

-- Verify the fix
SELECT id, email, stripe_account_id, LENGTH(stripe_account_id) as account_id_length
FROM profiles
WHERE stripe_account_id IS NOT NULL;


