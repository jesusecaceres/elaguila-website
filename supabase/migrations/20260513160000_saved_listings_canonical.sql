-- Canonical runtime table for Clasificados saves (Guardar) and dashboard Guardados (Gate 1).
-- Same row shape as `user_saved_listings` (user_id + listing_id + created_at).
-- `user_saved_listings` remains in the schema for historical rows; app runtime uses `saved_listings`.

CREATE TABLE IF NOT EXISTS public.saved_listings (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON public.saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON public.saved_listings(listing_id);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saved listings" ON public.saved_listings;
CREATE POLICY "Users can manage own saved listings" ON public.saved_listings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_listings TO authenticated;
