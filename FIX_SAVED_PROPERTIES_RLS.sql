-- Fix saved_properties 406 error by creating proper RLS policies
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can save properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can unsave properties" ON saved_properties;

-- Allow users to read their own saved properties
CREATE POLICY "Users can view own saved properties"
ON saved_properties
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own saved properties
CREATE POLICY "Users can save properties"
ON saved_properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own saved properties
CREATE POLICY "Users can unsave properties"
ON saved_properties
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'saved_properties';

-- Expected output: 3 policies (SELECT, INSERT, DELETE) for authenticated users
