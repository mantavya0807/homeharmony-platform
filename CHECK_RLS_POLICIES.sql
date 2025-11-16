-- Check if properties table has RLS enabled and what policies exist
-- Run this to see what's preventing buyers from updating property status

-- 1. Check if RLS is enabled on properties table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'properties';

-- 2. List all policies on properties table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties';

-- 3. Try to see what permissions exist
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'properties';


