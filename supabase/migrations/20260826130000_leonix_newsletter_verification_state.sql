-- Newsletter engine v2 (CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01) — verification-state foundation.
--
-- Additive only. Preserves every existing leonix_newsletter_subscribers row and value: widens the
-- status CHECK constraint to also allow 'pending_verification' (existing 'subscribed' /
-- 'unsubscribed' rows and the column default are untouched), and adds two new nullable columns to
-- hold a double-opt-in verification token and its expiry. No existing row, index, RLS policy, or
-- grant is touched. Mirrors the exact DROP/ADD CHECK-constraint pattern used by
-- 20260826120000_leonix_endorsement_votes_comida_local.sql.
--
-- IMPORTANT — this migration is STORAGE/SCHEMA ONLY. No outbound verification email is sent by any
-- code in this change: nothing currently writes 'pending_verification' or a token. The application
-- foundation (token generation + pending -> verified state machine) lives in
-- app/lib/newsletter/newsletterVerificationState.ts, unused by the live checkout-capture write path
-- until a real email-delivery integration is built and explicitly wired in a future change.

-- ---------------------------------------------------------------------------
-- 1) WIDEN status CHECK CONSTRAINT
-- ---------------------------------------------------------------------------
ALTER TABLE public.leonix_newsletter_subscribers
  DROP CONSTRAINT IF EXISTS leonix_newsletter_subscribers_status_chk;

ALTER TABLE public.leonix_newsletter_subscribers
  ADD CONSTRAINT leonix_newsletter_subscribers_status_chk
  CHECK (status IN ('subscribed', 'unsubscribed', 'pending_verification'));

-- ---------------------------------------------------------------------------
-- 2) ADD verification token columns (nullable, no default — never populated by existing writes)
-- ---------------------------------------------------------------------------
ALTER TABLE public.leonix_newsletter_subscribers
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Token lookups (verification confirmation links) should not table-scan once this state is used.
CREATE INDEX IF NOT EXISTS leonix_newsletter_subscribers_verification_token_idx
  ON public.leonix_newsletter_subscribers (verification_token)
  WHERE verification_token IS NOT NULL;

COMMENT ON COLUMN public.leonix_newsletter_subscribers.verification_token IS
  'Opaque random double-opt-in token (foundation only — never logged/printed). Null until a future '
  'email-verification flow is wired; no current write path sets this column.';
COMMENT ON COLUMN public.leonix_newsletter_subscribers.verification_token_expires_at IS
  'Expiry for verification_token. Foundation only, unused by any current write path.';
COMMENT ON COLUMN public.leonix_newsletter_subscribers.verified_at IS
  'Timestamp a pending_verification subscriber confirmed via token. Foundation only, unused by any '
  'current write path.';
