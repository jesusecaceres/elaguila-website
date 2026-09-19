-- =====================================================================================================
-- ROLLBACK for 20260920122000_listings_owner_authority_guard.sql - NOT APPLIED.
-- Removes the guard trigger and its function. No data is read or written; the table returns exactly to its
-- pre-migration trigger set (trg_prevent_owner_change, trg_set_owner_id, listings_leonix_ad_id_biu, 3 audit triggers).
-- WARNING: this re-opens owner self-activation of paid-lane rows through the anon API.
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

drop trigger if exists listings_owner_authority_guard on public.listings;
drop function if exists public.listings_owner_authority_guard();

do $post$
begin
  if exists (
    select 1 from pg_trigger t
     where t.tgrelid = 'public.listings'::regclass and t.tgname = 'listings_owner_authority_guard'
  ) then
    raise exception 'rollback: listings_owner_authority_guard trigger still present';
  end if;
end
$post$;

commit;
