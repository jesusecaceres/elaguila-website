-- NEWSLETTER UNSUBSCRIBE TOKEN — missing columns (Gate 3, P0 recovery follow-up, 2026-09-15).
-- app/lib/leonix/leadCaptureServer.ts reads and writes `unsubscribe_token` /
-- `unsubscribe_token_expires_at` on every insert/update, and
-- app/lib/newsletter/newsletterUnsubscribeServer.ts looks a subscriber up strictly by
-- `unsubscribe_token` (never by email) to process an unsubscribe link — but neither column exists
-- on the live table, so every write/select touching them fails with Postgres 42703
-- (undefined_column), surfaced client-side as newsletter capture "save_failed". Additive only;
-- both columns are nullable (a subscriber captured before this migration runs has neither until
-- their row is next written) and no existing row is touched.
--
-- Token shape: generateNewsletterUnsubscribeToken() (app/lib/newsletter/newsletterUnsubscribeToken.ts)
-- returns randomBytes(32).toString("hex") — a fixed 64-character opaque string — so `text` matches
-- every other string column already on this table (no column here uses varchar). Expiry is set as
-- `new Date(Date.now() + 1000*60*60*24*730).toISOString()` (~730 days out) — a plain
-- `timestamp with time zone`, matching consent_timestamp/created_at/archived_at/deleted_at already
-- on this table.
ALTER TABLE public.leonix_newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token text NULL,
  ADD COLUMN IF NOT EXISTS unsubscribe_token_expires_at timestamptz NULL;

-- The token is a bearer credential that unsubscribes exactly one subscriber
-- (newsletterUnsubscribeToken.ts's own doc comment) — a UNIQUE index is the natural completion of
-- that security model, not a separate feature: without it two subscribers could theoretically
-- collide on the same opaque token and either one's link would unsubscribe the other. Partial
-- (WHERE NOT NULL) so rows that have never had a token issued are never compared against each
-- other. Also serves as the lookup index for
-- newsletterUnsubscribeServer.ts's `.eq("unsubscribe_token", token)` query.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_newsletter_subscribers_unsubscribe_token_uk
  ON public.leonix_newsletter_subscribers (unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;

COMMENT ON COLUMN public.leonix_newsletter_subscribers.unsubscribe_token IS
  'Opaque bearer token (64 hex chars, randomBytes(32)) that identifies and authorizes unsubscribing this one subscriber via their unsubscribe link. Never derived from or interchangeable with the newsletter verification token. Never logged or printed.';
COMMENT ON COLUMN public.leonix_newsletter_subscribers.unsubscribe_token_expires_at IS
  'Expiry for unsubscribe_token (~730 days from issuance). A subscriber whose token has expired keeps their status unchanged until a fresh capture/update reissues a token.';
