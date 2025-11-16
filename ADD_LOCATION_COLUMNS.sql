-- OPTIONAL: Add location tracking columns to profiles table
-- Only run this if you want to track user locations for property analytics

-- Add location columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location_latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS location_longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS profiles_location_idx 
ON profiles (location_latitude, location_longitude)
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Allow users to update their own location
CREATE POLICY IF NOT EXISTS "Users can update own location"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND column_name IN ('location_latitude', 'location_longitude', 'location_updated_at');

-- Expected output: 3 rows showing the new columns
