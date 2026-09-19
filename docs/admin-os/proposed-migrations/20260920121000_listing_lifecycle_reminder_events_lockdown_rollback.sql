-- =====================================================================================================
-- ROLLBACK for 20260920121000_listing_lifecycle_reminder_events_lockdown.sql - NOT APPLIED.
-- Restores the production state observed on 2026-09-18: RLS off, anon/authenticated hold arwdDxtm.
-- WARNING: this RE-EXPOSES the table to any visitor holding the public anon key. Only use it if a legitimate
-- browser-side reader is discovered - and in that case prefer adding an owner-scoped SELECT policy instead.
-- =====================================================================================================
begin;

alter table public.listing_lifecycle_reminder_events disable row level security;

grant all on table public.listing_lifecycle_reminder_events to anon, authenticated;

commit;
