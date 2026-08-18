-- Package C Build 1 (C2) — M4: entitlement grant provenance + live-uniqueness protection.
-- C1 proved the only unique constraint is entitlement_code, so duplicate ACTIVE entitlements for
-- the same listing+package are possible (webhook dedupes by payment_record_id only; admin check
-- is TOCTOU). This adds:
--   1. grant_source — explicit provenance (suspension engine must never payment-suspend
--      print_included/comp/partner grants; manual cleared payments need distinguishable source).
--   2. A partial unique index over live rows keyed (listing_source, listing_id, package_key) —
--      listing_source participates because listing_id is free text shared across four lane
--      tables; package_key IS NOT NULL guard because legacy admin print rows predate package_key.
--
-- DUPLICATE SAFETY (owner rule: never delete or merge automatically): index creation FAILS
-- LOUDLY if live duplicates exist. Remediation is deterministic and human-approved:
-- run scripts/package-c/report-duplicate-entitlements.mjs, review, apply the documented demotion
-- (losers -> status 'expired' + metadata supersession trail; rows preserved), then re-run this
-- migration. Application-level idempotency (23505 -> re-select) ships in the same build either way.

ALTER TABLE public.listing_package_entitlements
  ADD COLUMN IF NOT EXISTS grant_source text
    CHECK (grant_source IS NULL OR grant_source IN
      ('stripe_webhook','admin_manual','print_included','comp','partner','manual_cleared_payment'));

-- Backfill only where provenance is unambiguous; everything else stays NULL (= legacy/unknown).
UPDATE public.listing_package_entitlements
   SET grant_source = 'stripe_webhook'
 WHERE grant_source IS NULL
   AND (metadata->>'source') = 'stripe_webhook';
UPDATE public.listing_package_entitlements
   SET grant_source = 'admin_manual'
 WHERE grant_source IS NULL
   AND payment_record_id IS NULL
   AND created_by IS NOT NULL;

-- Live-row uniqueness. Fails (non-destructively) if duplicates exist — see header.
CREATE UNIQUE INDEX IF NOT EXISTS listing_package_entitlements_live_uniq
  ON public.listing_package_entitlements (listing_source, listing_id, package_key)
  WHERE status IN ('active','scheduled')
    AND listing_id IS NOT NULL
    AND package_key IS NOT NULL;

COMMENT ON COLUMN public.listing_package_entitlements.grant_source IS
  'Provenance of the grant (Package C Build 1): stripe_webhook | admin_manual | print_included | comp | partner | manual_cleared_payment. NULL = legacy/unknown. Payment suspension only ever applies to stripe_webhook/manual_cleared_payment grants.';
