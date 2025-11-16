-- Fix properties that have been purchased but weren't marked as sold
-- This happens when properties were purchased before the status column existed

-- Mark all properties with transactions as 'sold'
UPDATE properties
SET status = 'sold'
WHERE id IN (
    SELECT DISTINCT property_id 
    FROM transactions
)
AND (status IS NULL OR status != 'sold');

-- Verify the fix
SELECT 
    'Fixed' as action,
    COUNT(*) as properties_marked_sold
FROM properties
WHERE id IN (SELECT DISTINCT property_id FROM transactions)
AND status = 'sold';

-- Show which properties were updated
SELECT 
    p.id,
    p.title,
    p.status,
    t.buyer_id,
    t.created_at as purchased_at
FROM properties p
INNER JOIN transactions t ON p.id = t.property_id
ORDER BY t.created_at DESC;


