-- Globalization Build D-S, Gate DS1 — Comida Local Google/Yelp review page URLs.
-- Additive only. URLs only: no owner-typed rating, no owner-typed review count, no provider
-- star score, no fake verification, no provider review snippets. Existing rows hydrate safely
-- with null (provider hidden until the owner adds a real link) — no refill, no invented data.

alter table public.comida_local_public_listings
  add column if not exists google_reviews_url text null,
  add column if not exists yelp_reviews_url text null;

comment on column public.comida_local_public_listings.google_reviews_url is
  'Real Google review-page URL only, owner-entered. Never a rating/count/verification — the shared Google/Yelp reputation drawer (Build B) links out, never fabricates provider data.';
comment on column public.comida_local_public_listings.yelp_reviews_url is
  'Real Yelp review-page URL only, owner-entered. Never a rating/count/verification — the shared Google/Yelp reputation drawer (Build B) links out, never fabricates provider data.';
