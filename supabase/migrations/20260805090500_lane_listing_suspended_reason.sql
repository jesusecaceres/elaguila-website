-- Package C Build 1 (C3) — M6: per-lane suspended_reason for suspension precedence.
-- The payment-suspension engine sets suspended_reason='payment' when it suspends a listing's
-- public visibility, and restore is a compare-and-swap that requires BOTH the exact suspended
-- status it wrote AND suspended_reason='payment' — so payment recovery can never resurrect a
-- listing that moderation, the owner, or an admin suspended (their writes either predate the
-- payment suspension, in which case payment suspension never fired, or land after it and are
-- detected by the CAS returning zero rows).
-- Documented follow-up (NOT in this build): moderation suspend paths should set
-- suspended_reason='moderation' so a moderation action during payment suspension also blocks
-- restore explicitly; today the CAS status comparison already covers the common orderings.
-- Additive nullable columns only; no existing row changes.

ALTER TABLE public.restaurantes_public_listings
  ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE public.servicios_public_listings
  ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE public.autos_classifieds_listings
  ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS suspended_reason text;

COMMENT ON COLUMN public.restaurantes_public_listings.suspended_reason IS
  'Why the current suspended-like status was applied (Package C Build 1). ''payment'' = payment-suspension engine; NULL = not suspension-managed. Restore CAS requires suspended_reason=''payment''.';
COMMENT ON COLUMN public.servicios_public_listings.suspended_reason IS
  'See restaurantes_public_listings.suspended_reason.';
COMMENT ON COLUMN public.autos_classifieds_listings.suspended_reason IS
  'See restaurantes_public_listings.suspended_reason.';
COMMENT ON COLUMN public.listings.suspended_reason IS
  'See restaurantes_public_listings.suspended_reason.';
