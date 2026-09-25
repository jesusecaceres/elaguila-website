-- =====================================================================================================
-- LAUNCH SECURITY WAVE 2 — public.listings owner-authority guard.
-- Canonical successor of the admin-branch proposal docs/admin-os/proposed-migrations/
-- 20260920122000_listings_owner_authority_guard.sql, re-validated against current golden code on 2026-09-25
-- (38 browser writers audited) and rehearsed on Staging (cgeehvnfyrdoperdotdh). Priority P0 · Risk MEDIUM.
--
-- WHY (verified read-only on Leonix Media xuieateniufcrsfdomwl): public.listings has RLS enabled + FORCED and the owner
--   policy "Owner update own listings" (authenticated, USING/WITH CHECK owner_id = auth.uid()) has NO column restriction.
--   Nothing constrains which status an owner may write, so through the public API an owner can activate a never-paid
--   Rentas / Bienes Raíces / paid-Clases row, lift a staff hold or un-remove a staff-archived row, extend / null the paid
--   term (`expires_at`; public readers fail OPEN on null), and self-grant staff-only flags.
--   Production proof: en-venta SALE-2026-000067 went flagged -> removed (staff) -> sold (owner, via the client API).
--
-- WHAT: ONE BEFORE INSERT OR UPDATE row trigger that constrains ONLY PostgREST client roles
--   (current_user in ('authenticated','anon')). service_role / postgres / supabase_admin — every Revenue OS webhook, every
--   /api route using getAdminSupabase, every SECURITY DEFINER RPC (current_user = definer inside) — is untouched.
--
-- OWNER STATE MODEL (on the OLD row):
--   * Owner-movable statuses: draft, pending, active, paused, sold. flagged / suspended / removed / expired / rejected / unknown
--     are TERMINAL for owners (content edits with the status unchanged are still fine).
--   * Owners never write INTO flagged, suspended, expired or rejected.
--   * ARCHIVE (Stage 1): c_owner_may_archive = TRUE — owners may write INTO 'removed' from draft/pending/active/paused/sold
--     (the four dashboard Archive buttons write status 'removed' from the browser). 'removed' can never be left by an
--     owner, so archive is a one-way door and launders nothing. Stage 2 (follow-up): move owner archive to a service-role
--     route and flip this to FALSE.
--   FREE lane : en-venta, busco, comunidad, mascotas-y-perdidos (+ 'mascotas'), and clases when is_free AND expires_at IS NULL.
--               Owner may publish draft -> active, pause/resume, mark sold, re-save to draft.
--   PAID lane : rentas, bienes-raices (Negocio + FSBO), paid clases and EVERY unknown category (fail closed).
--               Owner may pause an active row, resume paused/sold -> active, mark sold, and enter payment (draft -> pending).
--               Owner may NOT activate from pending/draft, insert active, publish a non-active row, or touch expires_at.
--   Clases draft (never paid, no term): the lane follows the NEW is_free, so an owner can switch a free draft into the paid
--     flow (draft -> pending) or a paid draft to free before it ever enters payment.
--   ALL lanes : category immutable; staff-only columns (admin_promoted, leonix_verified, boost_until, suspended_reason,
--               republish_override, republish_override_reason) immutable / default-only; is_published may only turn on
--               together with a legitimate 'active'.
--
-- APP COMPATIBILITY (current golden, audited 2026-09-25): every browser writer — free publishers (insert draft -> finalize
--   active), paid real-estate core (insert/reuse status 'pending'), paid Clases (insert 'pending'), dashboard pause / resume /
--   sold / relist / republish bookkeeping / archive, editor content saves, drafts publish/archive — is inside this matrix.
--   No browser code writes expires_at. The quick publishers' failure cleanup writes {is_published:false} only (same release).
--   Server routes (listing-edit, privado-status, listing-lifecycle, Quick Bienes custody, staff assisted publish, Revenue OS
--   fulfilment, renewals, admin) use the service role.
--
-- EXPECTED BEFORE: no listings_owner_authority_guard trigger/function.
-- EXPECTED AFTER : trigger listings_owner_authority_guard (BEFORE INSERT OR UPDATE, enabled) on public.listings.
-- IDEMPOTENT     : CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS / CREATE TRIGGER.
-- ROLLBACK       : docs/db-gates/wave-2-2026-09-25/rollback_20260925130000_listings_owner_authority_guard.sql
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

-- Fail fast on a drifted schema instead of installing a guard that references columns that do not exist.
do $pre$
declare
  v_missing text;
begin
  select string_agg(c, ', ')
    into v_missing
    from unnest(array[
      'status','is_published','expires_at','published_at','is_free','category',
      'admin_promoted','leonix_verified','boost_until','suspended_reason','republish_override','republish_override_reason'
    ]) as c
   where not exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'listings' and column_name = c
   );
  if v_missing is not null then
    raise exception 'listings_owner_authority_guard: public.listings is missing columns: %', v_missing;
  end if;
end
$pre$;

create or replace function public.listings_owner_authority_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  c_free_cats constant text[] := array['en-venta', 'busco', 'comunidad', 'mascotas-y-perdidos', 'mascotas'];
  -- ARCHIVE switch: TRUE = Stage 1 (owners may archive into 'removed'; one-way). FALSE once owner archive is server-routed.
  c_owner_may_archive constant boolean := true;
  v_cat  text;
  v_lane text;   -- 'free' | 'paid'
  v_old  text;
  v_new  text;
  v_ok   boolean;
begin
  -- Server code (service_role / postgres / supabase_admin, and SECURITY DEFINER RPCs whose current_user is the
  -- definer) is never restricted. Only PostgREST client roles are.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  v_new := lower(btrim(coalesce(new.status, '')));

  -- ---------------------------------------------------------------- INSERT ------------------------------------
  if tg_op = 'INSERT' then
    v_cat := lower(btrim(coalesce(new.category, '')));
    if v_cat = any (c_free_cats) or (v_cat = 'clases' and new.is_free is true) then
      v_lane := 'free';
    else
      v_lane := 'paid';
    end if;

    if new.admin_promoted is true or new.leonix_verified is true or new.boost_until is not null
       or new.suspended_reason is not null or new.republish_override is true
       or new.republish_override_reason is not null then
      raise exception 'listing_owner_authority_violation:staff_only_column_on_insert' using errcode = '42501';
    end if;

    if v_lane = 'paid' then
      if v_new not in ('pending', 'draft') or new.is_published is true or new.expires_at is not null then
        raise exception 'listing_owner_authority_violation:paid_lane_insert_must_be_pending' using errcode = '42501';
      end if;
    elsif v_new not in ('draft', 'active') then
      raise exception 'listing_owner_authority_violation:free_lane_insert_status' using errcode = '42501';
    end if;

    return new;
  end if;

  -- ---------------------------------------------------------------- UPDATE ------------------------------------
  v_cat := lower(btrim(coalesce(old.category, '')));
  v_old := lower(btrim(coalesce(old.status, '')));

  if new.category is distinct from old.category then
    raise exception 'listing_owner_authority_violation:category_immutable' using errcode = '42501';
  end if;

  if v_cat = any (c_free_cats) then
    v_lane := 'free';
  elsif v_cat = 'clases' and v_old = 'draft' and old.expires_at is null and new.expires_at is null then
    -- A Clases draft that never entered payment follows the NEW cost type (free draft -> paid flow, or the reverse).
    v_lane := case when new.is_free is true then 'free' else 'paid' end;
  elsif v_cat = 'clases' and old.is_free is true and old.expires_at is null then
    v_lane := 'free';
  else
    v_lane := 'paid';
  end if;

  -- Staff-only flags: an owner may never change them.
  if new.admin_promoted is distinct from old.admin_promoted
     or new.leonix_verified is distinct from old.leonix_verified
     or new.boost_until is distinct from old.boost_until
     or new.suspended_reason is distinct from old.suspended_reason
     or new.republish_override is distinct from old.republish_override
     or new.republish_override_reason is distinct from old.republish_override_reason then
    raise exception 'listing_owner_authority_violation:staff_only_column' using errcode = '42501';
  end if;

  -- The paid term is bought, never edited (public readers fail OPEN on a null expires_at).
  if v_lane = 'paid' and new.expires_at is distinct from old.expires_at then
    raise exception 'listing_owner_authority_violation:term_is_server_owned' using errcode = '42501';
  end if;

  -- Clases free/paid is fixed once the row has entered the payment flow or ever been live.
  if v_cat = 'clases' and new.is_free is true and old.is_free is not true
     and not (v_old = 'draft' and old.expires_at is null) then
    raise exception 'listing_owner_authority_violation:clases_lane_change' using errcode = '42501';
  end if;

  -- Status transitions (owner intent only; everything else is a payment / staff / server decision).
  if v_new is distinct from v_old then
    if v_old not in ('draft', 'pending', 'active', 'paused', 'sold') then
      raise exception 'listing_owner_authority_violation:staff_held_or_terminal_state' using errcode = '42501';
    end if;

    v_ok := false;
    if v_new = 'removed' then
      v_ok := c_owner_may_archive;                                         -- owner archive (one-way)
    elsif v_new = 'paused' then
      v_ok := (v_old = 'active') or (v_lane = 'free' and v_old = 'sold');
    elsif v_new = 'sold' then
      v_ok := v_old in ('active', 'paused');
    elsif v_new = 'active' then
      v_ok := (v_old in ('paused', 'sold')) or (v_lane = 'free' and v_old = 'draft');
    elsif v_new = 'draft' then
      v_ok := (v_lane = 'free' and v_old in ('active', 'paused', 'sold'));
    elsif v_new = 'pending' then
      v_ok := (v_lane = 'paid' and v_old = 'draft');                       -- enter the payment flow only
    end if;

    if not v_ok then
      raise exception 'listing_owner_authority_violation:status_transition_%_to_%_on_%_lane', v_old, v_new, v_lane
        using errcode = '42501';
    end if;
  end if;

  -- Visibility may only be switched ON together with a legitimate `active`.
  if new.is_published is true and old.is_published is not true then
    if v_new <> 'active' or v_old not in ('draft', 'paused', 'sold', 'active') then
      raise exception 'listing_owner_authority_violation:publish_flag_requires_active' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.listings_owner_authority_guard() is
  'Launch security Wave 2: constrains only PostgREST client roles (authenticated/anon) on public.listings. Owner-movable statuses = draft/pending/active/paused/sold; flagged/suspended/removed/expired/rejected are terminal for owners; free-vs-paid lane rules; owner archive into removed allowed (Stage 1, one-way); service_role, postgres and definer-owned RPCs bypass.';

revoke all on function public.listings_owner_authority_guard() from public, anon, authenticated;

drop trigger if exists listings_owner_authority_guard on public.listings;
create trigger listings_owner_authority_guard
  before insert or update on public.listings
  for each row execute function public.listings_owner_authority_guard();

do $post$
begin
  if not exists (
    select 1 from pg_trigger t
     where t.tgrelid = 'public.listings'::regclass and t.tgname = 'listings_owner_authority_guard'
       and not t.tgisinternal and t.tgenabled = 'O'
  ) then
    raise exception 'listings_owner_authority_guard: trigger was not installed / enabled';
  end if;
end
$post$;

commit;
