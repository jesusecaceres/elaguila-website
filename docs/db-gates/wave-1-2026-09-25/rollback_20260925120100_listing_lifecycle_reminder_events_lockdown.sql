-- ROLLBACK for supabase/migrations/20260925120100_listing_lifecycle_reminder_events_lockdown.sql — NOT A MIGRATION.
-- Restores the Leonix Media state observed 2026-09-25: RLS off; anon/authenticated/service_role hold arwdDxtm.
-- WARNING: this RE-EXPOSES the table to any visitor holding the public anon key. If a legitimate browser reader is
-- ever discovered, add an owner-scoped SELECT policy instead of rolling back.
begin;

alter table public.listing_lifecycle_reminder_events disable row level security;

grant all on table public.listing_lifecycle_reminder_events to anon, authenticated, service_role;

commit;
