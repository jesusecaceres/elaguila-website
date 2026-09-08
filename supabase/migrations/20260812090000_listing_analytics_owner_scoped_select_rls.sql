-- Package F Build F2, Gate 1 (P0 security fix) — the SELECT policy added in
-- 20260507180000_listing_analytics_schema_complete.sql ("Allow select listing_analytics",
-- USING (true)) made every listing_analytics row — including the raw user_id of every viewer,
-- saver, and messenger of every listing — readable by any anonymous or authenticated Supabase
-- client. Confirmed actively exercised: at least one live public component queried this table
-- directly from the browser (fixed in the same F2 build to instead call a server aggregate
-- route). This migration narrows SELECT to the row's own recorded owner only.
--
-- Design: owner_user_id is an existing, already-indexed column (idx_listing_analytics_owner_user_id,
-- idx_listing_analytics_owner_created) populated by the analytics event helpers specifically to
-- support owner-scoped dashboard reads (app/lib/clasificadosAnalytics.ts). Scoping SELECT to
-- `owner_user_id = auth.uid()` is therefore the schema's own already-intended boundary, not a new
-- concept — this migration only removes the accidental public bypass.
--
-- What this preserves:
--   * INSERT stays open (USING/WITH CHECK true) — anonymous visitors must still be able to record
--     view/save/share/CTA events on listings they don't own. Not touched by this migration.
--   * Service-role reads (getAdminSupabase(), used by every admin/server aggregate route) bypass
--     RLS entirely by design and are completely unaffected.
--   * Owner dashboard reads (mis-anuncios pages) that filter by their own listing_id set continue
--     to work as long as those rows carry owner_user_id — the normal case for events on an
--     owner's own listings.
--
-- Known, disclosed limitation (not silently hidden): owner_user_id is an optional field on the
-- analytics event helpers and defaults to NULL when a caller doesn't pass it. Any historical or
-- future row written without owner_user_id populated will not be visible to ANYONE via this
-- policy (including its real owner) until/unless that emitter is updated to pass it — this is a
-- data-completeness trade-off accepted in favor of closing the confirmed public PII leak; it can
-- only ever cause under-counting of an owner's own stats, never expose another party's data.

DROP POLICY IF EXISTS "Allow select listing_analytics" ON public.listing_analytics;

CREATE POLICY "Owner can select own listing_analytics" ON public.listing_analytics
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND owner_user_id = auth.uid()::text);
