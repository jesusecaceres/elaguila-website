-- Package C Build 2 (C4) — link column mirroring promo_redemption_id, so the webhook
-- fulfillment path (revenueFulfillment.ts) can find and mark the verified-intro-discount
-- redemption row redeemed after payment succeeds, exactly like it does for promo redemptions.
-- No new pricing columns: discount amounts reuse the existing amount_subtotal_cents /
-- amount_discount_cents / amount_total_cents / discount_percent columns already used by promo
-- codes. Additive only; existing rows untouched.

ALTER TABLE public.leonix_payment_records
  ADD COLUMN IF NOT EXISTS verified_intro_discount_redemption_id uuid
    REFERENCES public.leonix_verified_intro_discount_redemptions (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leonix_payment_records_verified_intro_discount_redemption_idx
  ON public.leonix_payment_records (verified_intro_discount_redemption_id);

COMMENT ON COLUMN public.leonix_payment_records.verified_intro_discount_redemption_id IS
  'Package C Build 2 (C4) — FK to leonix_verified_intro_discount_redemptions, mirrors promo_redemption_id. Discount amounts reuse existing amount_subtotal_cents/amount_discount_cents/amount_total_cents/discount_percent columns; no new pricing columns added.';
