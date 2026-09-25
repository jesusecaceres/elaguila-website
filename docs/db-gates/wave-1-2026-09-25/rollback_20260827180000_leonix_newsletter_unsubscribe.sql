-- ROLLBACK for supabase/migrations/20260827180000_leonix_newsletter_unsubscribe.sql as applied to Leonix Media in
-- Wave 1 — NOT A MIGRATION.
-- On Leonix Media that migration effectively adds only `unsubscribed_at` and the non-unique
-- `leonix_newsletter_subscribers_unsubscribe_token_idx` (unsubscribe_token / unsubscribe_token_expires_at and the
-- UNIQUE `..._unsubscribe_token_uk` index already exist from 20260916140000 and are NOT touched here).
-- WARNING: dropping `unsubscribed_at` breaks the unsubscribe route again
-- (app/lib/newsletter/newsletterUnsubscribeServer.ts writes it) and discards any recorded unsubscribe timestamps.
-- Prefer leaving the additive column in place.
begin;

drop index if exists public.leonix_newsletter_subscribers_unsubscribe_token_idx;
alter table public.leonix_newsletter_subscribers drop column if exists unsubscribed_at;

commit;
