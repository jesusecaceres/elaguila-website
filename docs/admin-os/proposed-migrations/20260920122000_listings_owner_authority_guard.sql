-- =====================================================================================================
-- PROPOSED MIGRATION - NOT APPLIED. Deliberately outside supabase/migrations/.
-- Apply order: 3 of 5.   Risk: MEDIUM (touches every owner write on public.listings; test in a branch DB first).   Priority: P0.
--
-- WHY (verified read-only against production xuieateniufcrsfdomwl on 2026-09-18):
--   public.listings has RLS enabled + FORCED. The owner policy is
--     "Owner update own listings"  FOR UPDATE TO authenticated  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())
--   with NO column restriction, and authenticated holds column-level UPDATE on status / is_published / expires_at.
--   Triggers on the table today: trg_prevent_owner_change (owner_id only), trg_set_owner_id, listings_leonix_ad_id_biu, three
--   AFTER audit triggers. Nothing constrains WHICH status an owner may write, so through the public anon API an owner can:
--     * activate a never-paid Rentas / Bienes Raices / paid-Clases row (pending -> active, is_published = true);
--     * lift a staff hold (flagged -> active) or un-remove a row staff archived (removed -> active);
--     * extend / null out the paid term (`expires_at`; the public readers fail OPEN on a null expires_at);
--     * self-grant staff-only flags (admin_promoted, leonix_verified, boost_until, republish_override).
--
-- WHAT: ONE BEFORE INSERT OR UPDATE row trigger that constrains ONLY the PostgREST client roles
--   (current_user in ('authenticated','anon')). service_role / postgres / supabase_admin (every Revenue OS webhook,
--   every /api/admin/* route, every SECURITY DEFINER capacity RPC - inside those current_user is the definer) are untouched.
--
-- PROVEN IN PRODUCTION (listing_lifecycle_audit, read-only): en-venta SALE-2026-000067 (5f1b6eb5-da3e-43bc-9205-f4464b984e31) was
--   flagged (2026-06-02) and removed (2026-06-16) by staff (no actor = service role), then flipped removed -> sold on 2026-09-09 by an
--   OWNER write through the client API (actor = owner). dashboardOwnerRelistPolicy treats 'sold' as relistable, so a staff removal was
--   laundered back towards active by owner writes only. => staff-held / terminal states must be TERMINAL for owners.
--
-- STATE MODEL FOR THE OWNER (authenticated/anon) - enforced on the OLD row:
--   * Owner-movable statuses ONLY:  draft, pending, active, paused, sold.
--   * Staff / payment-engine / server-owned statuses are TERMINAL for owners: flagged, suspended, removed, expired, rejected, and any
--     unknown or empty status. An owner can change NOTHING about status out of them (content edits with the status unchanged are fine).
--   * An owner can never write INTO flagged, suspended, expired or rejected (staff / engine decisions).
--   * An owner can write INTO 'removed' ONLY if c_owner_may_archive = true (default FALSE, see 'ARCHIVE' below).
--
-- CATEGORY SEMANTICS (encoded from what the app actually does; classification uses the OLD row on UPDATE):
--   FREE lane  : en-venta, busco, comunidad, mascotas-y-perdidos (+ 'mascotas'), and clases WHEN is_free = true AND expires_at IS NULL.
--                Owner may: draft -> active (publish), active <-> paused, sold <-> active, mark sold (active/paused),
--                rewrite to draft (publisher re-save: active|paused|sold -> draft).
--   PAID lane  : rentas, bienes-raices (Negocio + FSBO), clases with is_free is not true (or with a paid term), and EVERY
--                unknown category (fail closed - add new FREE categories to c_free_cats below, deliberately).
--                Owner may ONLY: pause an ACTIVE row, resume paused/sold -> active (both were live before, term unchanged),
--                mark sold from active/paused, and enter the payment flow (draft -> pending).
--                Owner may NOT: pending|draft -> active or paused, INSERT status active, write is_published = true on anything that is
--                not (already or becoming) active, or touch expires_at.
--   ALL lanes  : category is immutable for owners; staff-only columns (admin_promoted, leonix_verified, boost_until, suspended_reason,
--                republish_override, republish_override_reason) are immutable / default-only for owners; is_published may only go
--                false -> true together with status = 'active' coming from draft/paused/sold/active.
--
-- ARCHIVE (c_owner_may_archive): today the owner dashboard archives by writing status 'removed' straight from the browser
--   (OWNER_LISTING_SOFT_ARCHIVE_PATCH, mis-anuncios list + detail + editar + drafts). Writing INTO removed is blocked by default
--   (coordinator directive: owners never move into removed/flagged). PREREQUISITE for applying with the default: route owner archive
--   through a server route (service role; verifies owner + that the current status is NOT a staff-held state) - otherwise the four
--   Archive buttons return the generic save error. INTERIM OPTION (Stage 1, keeps every hold protection): set c_owner_may_archive := true
--   below; archive is then a ONE-WAY door reachable only from draft/pending/active/paused/sold, and 'removed' can never be left by the
--   owner, so it launders nothing. The publishers' failure cleanup (update status 'removed') is best-effort and unchecked in the app:
--   when refused, the row simply stays draft/pending, which the retry path already reuses.
--
-- APP COMPATIBILITY (source scan of every browser-client writer to public.listings - see FINAL_DB_MIGRATIONS_PROPOSED_2026-09.md s.A):
--   dashboard pause/resume/sold/refresh/republish, editor save, drafts publish, En Venta / Busco / Comunidad / Mascotas / Clases
--   free publishers, and the Rentas/BR "pending_payment" insert + pending-row reuse are all inside the matrix above.
--   Server routes (BR/Rentas listing-edit, privado-status, Revenue OS fulfilment, admin routes) use the service role.
--
-- KNOWN, ACCEPTED UX CONSEQUENCES (documented, not bugs):
--   * an owner can no longer change ANYTHING about the status of a row staff flagged/removed or the engine suspended (contact support);
--   * archive from the browser is refused unless c_owner_may_archive = true or the server-route prerequisite above is deployed;
--   * a paid-lane row still 'pending' cannot be moved to draft/paused/sold - only paid;
--   * a paid Clases row in 'pending' that the owner re-declares as free (is_free true) is refused (repost instead);
--   * legacy 'immediate' real-estate publish (status 'active' insert) is refused; every current preview client already sends pending_payment;
--   * the quick-publisher retry no longer resurrects a failed-publish row that was marked 'removed' (the cleanup write is refused, so the
--     row stays draft/pending and the retry reuses it as before).
--
-- ROLLBACK: 20260920122000_listings_owner_authority_guard_rollback.sql (drops trigger + function; instant, no data touched).
-- BRANCH-DB TESTS: tests/listings_owner_authority_guard_branch_tests.sql (runs in one transaction and ROLLS BACK).
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
  -- ARCHIVE switch (see header): false = owners never write INTO 'removed' (server route owns archive). true = Stage-1 interim.
  c_owner_may_archive constant boolean := false;
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
       or new.suspended_reason is not null or new.republish_override is true then
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

  if v_cat = any (c_free_cats) or (v_cat = 'clases' and old.is_free is true and old.expires_at is null) then
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
    -- Staff / payment-engine / server-owned states are TERMINAL for owners: flagged, suspended, removed, expired, rejected and any
    -- unknown or empty status. (Production proof: SALE-2026-000067 went flagged -> removed by staff, then removed -> sold by its OWNER.)
    if v_old not in ('draft', 'pending', 'active', 'paused', 'sold') then
      raise exception 'listing_owner_authority_violation:staff_held_or_terminal_state' using errcode = '42501';
    end if;

    v_ok := false;
    if v_new = 'removed' then
      v_ok := c_owner_may_archive;                                         -- owner archive: default OFF (server route owns it)
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
  'PROPOSED 2026-09: constrains only PostgREST client roles (authenticated/anon). Owner-movable statuses = draft/pending/active/paused/sold; flagged/suspended/removed/expired/rejected are terminal for owners; free-vs-paid lane rules; service_role, postgres and definer-owned RPCs bypass.';

revoke all on function public.listings_owner_authority_guard() from public, anon, authenticated;

drop trigger if exists listings_owner_authority_guard on public.listings;
create trigger listings_owner_authority_guard
  before insert or update on public.listings
  for each row execute function public.listings_owner_authority_guard();

-- Post-condition.
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
