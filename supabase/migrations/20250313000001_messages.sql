-- Internal messaging between users (buyer <-> seller)
CREATE TABLE IF NOT EXISTS messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- User can send if they are the sender
CREATE POLICY "User can insert as sender" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- User can read messages where they are sender or receiver
CREATE POLICY "User can read own thread" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
