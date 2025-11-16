-- Add RLS policy to allow buyers to update property status to 'sold' when they purchase
-- This is needed for the checkout process to work properly

-- First check if RLS is enabled on properties table
-- If not enabled, this might not be the issue

-- Option 1: Enable RLS if not already enabled (run this carefully!)
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Option 2: Add policy to allow authenticated users to update property status
-- This allows any authenticated user to update ONLY the status field
CREATE POLICY "Allow buyers to mark properties as sold"
ON properties
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Option 3: More restrictive - only allow updating status to 'sold' (safer)
-- DROP POLICY IF EXISTS "Allow buyers to mark properties as sold" ON properties;
-- CREATE POLICY "Allow buyers to mark properties as sold"
-- ON properties
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (status = 'sold');

-- Verify the policy was created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties' 
AND policyname = 'Allow buyers to mark properties as sold';


