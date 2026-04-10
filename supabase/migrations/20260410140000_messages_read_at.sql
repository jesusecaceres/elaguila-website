-- Optional read tracking for inbox unread counts (dashboard + future APIs)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

COMMENT ON COLUMN public.messages.read_at IS 'When the receiver marked the message read; null = unread.';

DROP POLICY IF EXISTS "Receiver can update own messages" ON public.messages;
CREATE POLICY "Receiver can update own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
