-- ROLLBACK for supabase/migrations/20260925130000_listings_owner_authority_guard.sql — NOT A MIGRATION.
-- Removes the owner-authority trigger and its function (instant; no row data touched).
-- WARNING: this RE-OPENS owner self-activation of unpaid paid-lane listings through the public API.
begin;

drop trigger if exists listings_owner_authority_guard on public.listings;
drop function if exists public.listings_owner_authority_guard();

commit;
