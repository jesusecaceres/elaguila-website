-- Additive, unapplied. Do not apply from this mission.
-- Widens leonix_payment_records.source so Stripe Terminal can be stored.
-- Current CHECK (20260526120000_leonix_payment_records.sql) is:
--   admin_manual | stripe_checkout | stripe_webhook | owner_override | unknown
-- Runtime inserts of source='stripe_terminal' fail that constraint today.
-- Owner must apply this migration before Terminal payments can be recorded.

ALTER TABLE public.leonix_payment_records
  DROP CONSTRAINT IF EXISTS leonix_payment_records_source_chk;

ALTER TABLE public.leonix_payment_records
  ADD CONSTRAINT leonix_payment_records_source_chk CHECK (
    source IN (
      'admin_manual',
      'stripe_checkout',
      'stripe_webhook',
      'stripe_terminal',
      'owner_override',
      'unknown'
    )
  );

COMMENT ON CONSTRAINT leonix_payment_records_source_chk ON public.leonix_payment_records IS
  'Authoritative payment sources. stripe_terminal added 2026-09-22; unapplied until owner applies this migration.';
