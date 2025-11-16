-- Migration: Add status column to properties table
-- This is REQUIRED for the post-purchase management system to work

-- Step 1: Add the status column with default value
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- Step 2: Set all existing properties to 'available'
UPDATE properties 
SET status = 'available' 
WHERE status IS NULL;

-- Step 3: Verify the changes
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_count,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_count
FROM properties;

-- Expected result: All properties should have status = 'available'


