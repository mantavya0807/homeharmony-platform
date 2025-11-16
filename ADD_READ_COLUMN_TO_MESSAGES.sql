-- Add the 'read' column to the 'messages' table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Create an index on the read column for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- Set all existing messages to read = true (since they're old messages)
UPDATE public.messages
SET read = true
WHERE read IS NULL;

-- Verify the changes
SELECT
    COUNT(*) AS total_messages,
    COUNT(*) FILTER (WHERE read = true) AS read_count,
    COUNT(*) FILTER (WHERE read = false) AS unread_count
FROM public.messages;


