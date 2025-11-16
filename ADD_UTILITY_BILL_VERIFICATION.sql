-- Add utility bill verification fields to properties table
-- Run this in Supabase SQL Editor

-- Add utility_bill_url column to store utility bill document
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS utility_bill_url TEXT;

-- Add verification status fields
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS lease_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS utility_bill_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS documents_match BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0;

-- Add verification details JSONB column to store matching results
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS verification_details JSONB;

-- Verify the new columns were added
SELECT 
    column_name, 
    data_type, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('utility_bill_url', 'lease_verified', 'utility_bill_verified', 'documents_match', 'verification_score', 'verification_details');
