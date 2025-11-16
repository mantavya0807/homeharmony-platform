-- Fix RLS policies for chat tables to allow buyers to see their chats
-- Run this to ensure all authenticated users can access their chats

-- 1. Ensure RLS is enabled on all chat tables
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view their chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can insert chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
DROP POLICY IF EXISTS "Users can insert chats" ON chats;
DROP POLICY IF EXISTS "Users can update their chats" ON chats;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their chats" ON messages;

-- 3. Create policies for chat_participants
CREATE POLICY "Users can view their chat participants"
ON chat_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR chat_id IN (
  SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert chat participants"
ON chat_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Create policies for chats
CREATE POLICY "Users can view their chats"
ON chats
FOR SELECT
TO authenticated
USING (id IN (
  SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert chats"
ON chats
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their chats"
ON chats
FOR UPDATE
TO authenticated
USING (id IN (
  SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
));

-- 5. Create policies for messages
CREATE POLICY "Users can view messages in their chats"
ON messages
FOR SELECT
TO authenticated
USING (chat_id IN (
  SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert messages in their chats"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their chats"
ON messages
FOR UPDATE
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- 6. Verify policies were created
SELECT 
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('chats', 'chat_participants', 'messages')
ORDER BY tablename, policyname;

