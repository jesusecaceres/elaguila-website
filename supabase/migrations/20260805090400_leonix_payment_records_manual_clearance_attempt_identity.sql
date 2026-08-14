-- Package C Build 1 (C2) — M5: leonix_payment_records extensions.
--   1. Manual cleared-payment clearing sub-machine (Agreement v1.2 §7-§9: payment is received
--      only when funds are verified cleared; deposited/pending checks must not fulfill).
--      Dedicated CHECK-backed columns, not metadata — cleared truth must be enforceable and
--      indexable. payment_status remains the cross-source ledger truth ('pending' until cleared
--      -> 'paid'); manual_state is the clearing detail, valid only for source 'admin_manual'.
--   2. Per-invoice idempotency: renewal invoice.paid fulfillment inserts one payment record per
--      Stripe invoice; the partial unique index makes replays idempotent by construction.
--   3. P0 purchase-attempt identity: one UNRESOLVED checkout attempt per stable purchase key
--      (owner+listing+package+add-ons+mode). Same house pattern as Package A's
--      listings.publish_attempt_key. Open-session reuse + 23505 recovery in application code.
-- Additive only; existing rows untouched (all new columns nullable).

ALTER TABLE public.leonix_payment_records
  ADD COLUMN IF NOT EXISTS manual_method text
    CHECK (manual_method IS NULL OR manual_method IN ('cash','check','zelle','ach','money_order','other')),
  ADD COLUMN IF NOT EXISTS manual_state text
    CHECK (manual_state IS NULL OR manual_state IN ('pending_verification','cleared','rejected','reversed')),
  ADD COLUMN IF NOT EXISTS cleared_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS evidence_reference text,
  ADD COLUMN IF NOT EXISTS checkout_attempt_key text,
  ADD COLUMN IF NOT EXISTS attempt_generation integer;

-- Manual clearing states are only meaningful for admin-recorded manual payments.
ALTER TABLE public.leonix_payment_records
  DROP CONSTRAINT IF EXISTS leonix_payment_records_manual_state_source_chk;
ALTER TABLE public.leonix_payment_records
  ADD CONSTRAINT leonix_payment_records_manual_state_source_chk
    CHECK (manual_state IS NULL OR source = 'admin_manual');

-- One payment record per Stripe invoice (renewal history, replay-idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS leonix_payment_records_stripe_invoice_key
  ON public.leonix_payment_records (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- One UNRESOLVED purchase attempt per stable identity. Resolved records (paid/canceled/failed
-- terminal/expired) release the key so a genuinely new attempt can begin.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_payment_records_open_attempt_key
  ON public.leonix_payment_records (checkout_attempt_key)
  WHERE checkout_attempt_key IS NOT NULL
    AND payment_status IN ('pending','unpaid','requires_action');

CREATE INDEX IF NOT EXISTS leonix_payment_records_manual_state_idx
  ON public.leonix_payment_records (manual_state)
  WHERE manual_state IS NOT NULL;

COMMENT ON COLUMN public.leonix_payment_records.checkout_attempt_key IS
  'Stable server-computed purchase-attempt identity (Package C Build 1): sha256(owner|source|listing|package|addons|mode|operation). Partial unique over unresolved statuses prevents duplicate payable Stripe sessions for one purchase; Stripe request idempotencyKey = key + ":" + attempt_generation.';
