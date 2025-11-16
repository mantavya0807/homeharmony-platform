-- Check the actual status of properties in the database
-- Run this to see what's really happening

-- 1. Check if status column exists and what values it has
SELECT 
    id,
    title,
    status,
    seller_id
FROM properties
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check which properties have transactions (should be marked as sold)
SELECT 
    p.id,
    p.title,
    p.status,
    t.buyer_id,
    t.created_at as purchased_at
FROM properties p
INNER JOIN transactions t ON p.id = t.property_id
ORDER BY t.created_at DESC;

-- 3. Find properties that are sold but status is NOT 'sold'
SELECT 
    p.id,
    p.title,
    p.status,
    COUNT(t.id) as transaction_count
FROM properties p
LEFT JOIN transactions t ON p.id = t.property_id
GROUP BY p.id, p.title, p.status
HAVING COUNT(t.id) > 0 AND (p.status != 'sold' OR p.status IS NULL);


