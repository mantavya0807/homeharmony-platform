-- Simple fix: Allow authenticated users to update property status when purchasing
-- This is the ONLY change needed

-- Add policy to allow any authenticated user to update properties
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update properties"
ON properties
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- That's it. Test purchasing a property now.


