-- Gate COMIDA-LOCAL-1 — register the $129/month Comida Local lane with the shared
-- payment-suspension engine.
--
-- `subscriptionLifecyclePolicy.LANE_SUSPENSION` had entries for restaurantes, servicios, autos
-- and bienes-raices but none for comida-local, so `applyPaymentSuspension` returned
-- `lane_unsupported` and a lapsed Comida Local listing could never be hidden. The code entry is
-- added in this gate; it needs the same per-lane `suspended_reason` column the other four lanes
-- got in 20260805090500_lane_listing_suspended_reason.sql, because suspend writes
-- suspended_reason='payment' and restore is a compare-and-swap that requires BOTH the exact
-- suspended status it wrote AND suspended_reason='payment' — so payment recovery can never
-- resurrect a listing that moderation, the owner, or an admin suspended.
--
-- No new status vocabulary: 'suspended' is already one of the five values the table's status
-- CHECK accepts (20260604120000). Additive nullable column only; no existing row changes.
--
-- The sweeper itself is NOT built or scheduled in this gate.

ALTER TABLE public.comida_local_public_listings
  ADD COLUMN IF NOT EXISTS suspended_reason text;

COMMENT ON COLUMN public.comida_local_public_listings.suspended_reason IS
  'See restaurantes_public_listings.suspended_reason. ''payment'' = payment-suspension engine; NULL = not suspension-managed. Restore CAS requires suspended_reason=''payment''.';
