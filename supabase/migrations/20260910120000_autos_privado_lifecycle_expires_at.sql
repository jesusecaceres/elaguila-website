-- Autos Privado fixed-term lifecycle support (Owner Command Center Gate 20).
-- Forward-only, nullable, additive:
-- - no dropped/renamed columns
-- - no rewritten IDs
-- - no destructive backfill of unknown historical expiration
-- - dealer (lane = 'negocios') rows are unaffected (subscription-based, never read this column)

alter table public.autos_classifieds_listings
  add column if not exists expires_at timestamptz null;

-- Deterministic backfill only where real activation truth already exists: an active Privado row's
-- own published_at (the same base timestamp the app itself would use via
-- computeFixedDayRenewalExpiresAt) plus the locked 30-day term. Never applied to a status this
-- app does not already treat as active, and never fabricates a date where published_at is null.
update public.autos_classifieds_listings
  set expires_at = published_at + interval '30 days'
  where lane = 'privado'
    and status = 'active'
    and expires_at is null
    and published_at is not null;

create index if not exists autos_classifieds_listings_privado_active_expires_at_idx
  on public.autos_classifieds_listings (expires_at)
  where lane = 'privado' and status = 'active' and expires_at is not null;
