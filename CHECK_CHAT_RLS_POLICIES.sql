-- Check RLS policies on chat-related tables to ensure buyers can see their chats

-- 1. Check if RLS is enabled on chat tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('chats', 'chat_participants', 'messages')
ORDER BY tablename;

-- 2. List all policies on chat tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression
FROM pg_policies 
WHERE tablename IN ('chats', 'chat_participants', 'messages')
ORDER BY tablename, policyname;

-- 3. Test if current user can see their chat_participants
SELECT 
    cp.chat_id,
    cp.user_id,
    c.type as chat_type,
    c.created_at
FROM chat_participants cp
JOIN chats c ON c.id = cp.chat_id
WHERE cp.user_id = auth.uid()
LIMIT 10;


