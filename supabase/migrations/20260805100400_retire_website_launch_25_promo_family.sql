-- Package C Build 2 (C4) — retire the "Launch 25" promotional campaign. Preserves ALL
-- historical rows (no DELETE, no destructive DDL); flips only the lifecycle status. Per
-- resolveEffectivePromoCodeStatus() (promoCodeLifecycle.ts) and resolvePromoForCheckout()
-- (revenuePromoRedemptions.ts), status <> 'active' is already sufficient to permanently reject
-- the code at Apply/checkout, redemption, and Stripe reachability — no application code change
-- is required for this half of retirement.
--
-- GATE 0 STOP-CONDITION CHECK — completed before this migration was authored (owner sign-off
-- obtained 2026-08-05): a read-only query found exactly one 'redeemed' row tied to a
-- website_launch_25-family code (redemption id babc6e2a-36ef-4534-95cd-0eef77ff60ff, promo
-- code LX-NEWS-SQESAR, Servicios base monthly, Stripe TEST-MODE session
-- cs_test_b1fTO4uZfQIDx2nhvsvBxY0jFIdGXH52KnyRd8emWBC5yRxoRsSSWlzrxZ, customer email on the
-- internal leonixmedia.com domain) — confirmed internal QA, not a real customer transaction, and
-- the owner explicitly authorized retirement to proceed. That redemption row and its payment
-- record are NOT modified by this migration (it only flips leonix_promo_codes.status); the
-- historical redemption remains exactly as it was.

UPDATE public.leonix_promo_codes
SET status = 'revoked',
    revoked_at = now(),
    updated_at = now(),
    metadata = metadata || jsonb_build_object(
      'retired_at', now(),
      'retirement_gate', 'PACKAGE-C-BUILD-2-LAUNCH-25-RETIREMENT-01',
      'retirement_reason', 'website_launch_25 promotional campaign retired; contractual design/setup 25% and founding_partner 25% are unrelated and untouched'
    )
WHERE status = 'active'
  AND (
    (metadata->>'promo_family') = 'website_launch_25'
    OR (code_type = 'newsletter' AND (metadata->>'website_checkout_only')::text IN ('true', '1', 'yes'))
  );

COMMENT ON TABLE public.leonix_promo_codes IS
  'Admin-managed promo code lifecycle (discount/attribution); distinct from package entitlements and public Cupones CMS. website_launch_25-family rows retired via Package C Build 2 (C4) — see leonix_promo_codes.status and metadata.retired_at.';
