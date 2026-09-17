-- Autos Privado migration-safety follow-up (Owner Command Center Gate 20 release).
--
-- The prior migration (20260910120000_autos_privado_lifecycle_expires_at.sql) backfilled
-- expires_at = published_at + 30 days for every already-active Privado row. On Staging and in
-- Production preflight this was found to compute an ALREADY-PAST date for rows published well
-- before this migration ever existed (they had been running evergreen under the pre-lifecycle
-- product). Applying the new expires_at-aware application code on top of that literal backfill
-- would make those real, currently-live listings vanish from public search the instant the
-- deployment goes out, with no renewal window.
--
-- This is a one-time migration-safety transition grace, not a change to the permanent product
-- term: every NEW activation and every real renewal still computes a true 30-day term from its
-- own real activation/payment timestamp (see computeFixedDayRenewalExpiresAt in
-- app/lib/listingLifecycle/resolveListingLifecycle.ts, unchanged by this migration). This file
-- only corrects legacy rows whose already-applied backfill landed in the past, giving them a
-- fresh 30 days from the moment THIS migration runs instead — same one-shot, tracked-migration-
-- version guarantee as every other backfill in this codebase (Supabase applies a given migration
-- file exactly once; this is not a rule the running product ever re-evaluates).
--
-- Forward-only, additive-effect only:
-- - no dropped/renamed columns, no new columns
-- - only lane='privado' AND status='active' rows are touched
-- - only rows whose current expires_at is already <= now() are touched (a row whose real
--   published_at + 30 days already lands in the future is left exactly as the prior migration
--   set it)
-- - dealer (lane='negocios') rows are never touched (expires_at stays null for them, as before)
-- - draft/removed/pending rows are never touched (no status is read or written by this migration)
-- - no row is deleted, no id/owner/media/analytics field is touched

update public.autos_classifieds_listings
  set expires_at = now() + interval '30 days'
  where lane = 'privado'
    and status = 'active'
    and expires_at is not null
    and expires_at <= now();
