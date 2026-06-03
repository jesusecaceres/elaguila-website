-- Gate A2 — Ensure PostgREST upsert target exists for saved_listings(user_id, listing_id).
-- Canonical migration defines PRIMARY KEY (user_id, listing_id); some environments may lack it.
-- IF NOT EXISTS is safe when PK or an equivalent unique index already covers these columns.

CREATE UNIQUE INDEX IF NOT EXISTS saved_listings_user_listing_unique
  ON public.saved_listings (user_id, listing_id);
