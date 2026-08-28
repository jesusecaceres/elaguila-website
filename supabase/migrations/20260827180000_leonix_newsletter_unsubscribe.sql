-- Newsletter engine v2 (CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01) — real unsubscribe/opt-out path.
--
-- Additive only. Preserves every existing leonix_newsletter_subscribers row and value. 'unsubscribed'
-- is already a valid status value (original leonix_lead_capture migration), so no CHECK-constraint
-- change is needed here. Adds three new nullable columns to support a secure, token-based unsubscribe
-- link: a per-subscriber opaque token (distinct from the double-opt-in verification_token added by
-- 20260826130000_leonix_newsletter_verification_state.sql — the two tokens must never be
-- interchangeable, since a leaked/guessed verification token must never be able to unsubscribe
-- someone, and vice versa), its expiry, and an unsubscribed_at timestamp that lets the app
-- distinguish a real, deliberate unsubscribe event from a row that simply doesn't exist or was
-- otherwise removed.

ALTER TABLE public.leonix_newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token text,
  ADD COLUMN IF NOT EXISTS unsubscribe_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

-- Token lookups (unsubscribe link clicks) should not table-scan.
CREATE INDEX IF NOT EXISTS leonix_newsletter_subscribers_unsubscribe_token_idx
  ON public.leonix_newsletter_subscribers (unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;

COMMENT ON COLUMN public.leonix_newsletter_subscribers.unsubscribe_token IS
  'Opaque random one-click-unsubscribe token (RFC 8058 style). Distinct from verification_token — '
  'never accept this value in place of a verification token or vice versa. Generated lazily on first '
  'subscribe/capture write when absent; stable across ordinary profile updates so an issued link keeps '
  'working. Never logged/printed.';
COMMENT ON COLUMN public.leonix_newsletter_subscribers.unsubscribe_token_expires_at IS
  'Expiry for unsubscribe_token. Long-lived by design (an unsubscribe link should keep working for the '
  'practical lifetime of the subscription), not a short-lived credential like verification_token.';
COMMENT ON COLUMN public.leonix_newsletter_subscribers.unsubscribed_at IS
  'Set the moment status transitions to unsubscribed via the real unsubscribe route. Null for rows '
  'that were never unsubscribed. Distinguishes a genuine unsubscribe event from row absence/deletion; '
  'never cleared by a later resubscribe (kept as history of the most recent unsubscribe).';
