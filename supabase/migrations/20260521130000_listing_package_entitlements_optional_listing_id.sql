-- Gate G1.6B-FIX1: allow package entitlements before a listing/ad exists (sales pre-ad codes).

ALTER TABLE public.listing_package_entitlements
  ALTER COLUMN listing_id DROP NOT NULL;

COMMENT ON COLUMN public.listing_package_entitlements.listing_id IS
  'Optional at grant time. Null = code issued before ad creation; future attach/redeem gate links listing.';
