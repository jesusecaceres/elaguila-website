-- =====================================================================================================
-- PROPOSED MIGRATION - NOT APPLIED. Deliberately outside supabase/migrations/.
-- Apply order: 5 of 5 (PHASE 2 - OPTIONAL, needs an OWNER DECISION on legacy rows; see below).   Risk: MEDIUM.   Priority: P1.
-- PREREQUISITE: 20260920120000_revoke_capacity_rpc_client_execute.sql applied first (that one closes the direct-call hole).
--
-- WHY (proven from prod function source, read-only, 2026-09-18): the two capacity RPCs only ever check NEGATIVE commercial
--   states of the latest leonix_subscription_records row (grace / suspended / canceled). A row with NO subscription record, or a
--   `pending` one, or NO entitlement at all passes; the entitlement lookup only picks the capacity LIMIT (BR 1 vs 4, dealer 10 vs 20),
--   never authority. So even for the server-side callers (admin Restore/Republish, owner resume, activate_pending, payment webhook)
--   the RPC is a capacity counter, not a payment authority; correctness rests on each caller's app-level pre-checks.
--
-- WHAT: add a POSITIVE authority check on the commercial PARENT (v_parent) - the row that owns the subscription/entitlement:
--     authority :=  a valid BASE entitlement for the parent            (br_agent_monthly | autos_dealer_monthly)
--                   OR a live subscription record for the parent        (status = 'active' and period not ended)
--   where "valid entitlement" mirrors app/lib/listingPlans/entitlementActivationContract.ts:
--     status = 'active' (not revoked/expired/canceled), revoked_at IS NULL, starts_at <= now <= ends_at (NULL = open),
--     and metadata->>'payment_status' is NULL (admin/manual grant) or NOT in pending|unpaid|requires_action|failed|canceled|refunded|disputed
--     (paid / succeeded / unknown-but-not-blocking => authority; identical to resolveEntitlementActivation).
--   It is an OR, NOT "subscription required": production has exactly 1 subscription record (autos) and Bienes Raices Negocio is
--   sold as a base ENTITLEMENT (br_agent_monthly, 1 active in prod), so requiring a subscription would break real activations.
--   Otherwise the RPC returns blocked_reason = 'commercial_authority_required' (fail closed; the idempotent already-active branch is
--   unchanged, so live rows are never touched by this migration).
--
-- CALLERS THAT STILL WORK (traced): Revenue OS webhook -> activatePaidBienesNegocioListingFromRevenueOs / activatePaidAutosDealerListingFromRevenueOs
--   run AFTER the entitlement is persisted (revenueFulfillment.ts ~L1600 / ~L2000: `tryActivate...AfterEntitlement`)  -> authority present.
--   Admin Restore / Republish / unsuspend (api/admin/autos/listings/[id], api/admin/clasificados/listings/[id]) and owner resume /
--   activate_pending / autos owner restore -> allowed iff the parent currently has authority (lapsed or never-paid parents are refused
--   with the new reason instead of being activated). Children are checked against their PARENT.
--   NOT COVERED / STILL BREAKS: the LEGACY one-time BR Stripe flow (api/clasificados/leonix/stripe/{checkout,verify,webhook} ->
--   tryActivateBrListingAfterPayment) never writes an entitlement; it would now be refused for BR Negocio rows. Confirm it is retired
--   (Stripe endpoint disabled) BEFORE applying - UNVERIFIED in prod.
--
-- LEGACY ROWS - OWNER DECISION (measured read-only 2026-09-18, live rows WITHOUT authority under this rule):
--   autos negocios parents active: 2 total, 1 without authority;  BR Negocio parents active: 7 total, 7 without;  BR Negocio children active: 1, 1 without.
--   They are unaffected while `active`. If any is paused/removed later, resume/restore will be refused until staff records a cleared
--   manual entitlement (the app doctrine: "staff who want to comp a listing must record a cleared manual payment / entitlement").
--   Run the pre-flight query in FINAL_DB_MIGRATIONS_PROPOSED_2026-09.md s.B and decide grandfathering BEFORE applying.
--
-- APP FOLLOW-UP (types only, no behaviour change; blocked_reason already falls through to a generic "transition_not_allowed"):
--   app/lib/listingPlans/capacityActivationRpc.ts  CapacityActivationBlockedReason += "commercial_authority_required"
--   app/lib/clasificados/bienes-raices/brCapacityOwnerFeedback.ts  add owner copy for it.
--
-- DRIFT GUARD: the bodies below were derived from the production definitions. The migration refuses to overwrite a function whose
--   current pg_get_functiondef md5 differs from the one recorded on 2026-09-18 (someone changed it). In a branch DB built from repo
--   migrations the md5 differs by whitespace; run   set leonix.skip_rpc_md5_guard = 'on';   for that session only.
--
-- ROLLBACK: 20260920124000_capacity_rpc_commercial_authority_rollback.sql (restores the two production bodies verbatim).
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

do $guard$
declare
  v_skip text := coalesce(current_setting('leonix.skip_rpc_md5_guard', true), 'off');
begin
  if to_regprocedure('public.br_negocio_activate_listing(uuid,uuid,text)') is null
     or to_regprocedure('public.autos_dealer_activate_listing(uuid,uuid,text)') is null then
    raise exception 'capacity_rpc_commercial_authority: one of the capacity RPCs does not exist';
  end if;
  if v_skip <> 'on' then
    if md5(pg_get_functiondef('public.br_negocio_activate_listing(uuid,uuid,text)'::regprocedure)) <> 'f69cc5331601605c6bfbe4d8fcfdf220' then
      raise exception 'capacity_rpc_commercial_authority: br_negocio_activate_listing changed since the 2026-09-18 production snapshot - re-derive this migration';
    end if;
    if md5(pg_get_functiondef('public.autos_dealer_activate_listing(uuid,uuid,text)'::regprocedure)) <> 'd5cd8e627012e7c0df7db38fa84e978f' then
      raise exception 'capacity_rpc_commercial_authority: autos_dealer_activate_listing changed since the 2026-09-18 production snapshot - re-derive this migration';
    end if;
  end if;
end
$guard$;

-- ---------------------------------------------------------------------------------------------------
-- 1) Autos dealer inventory
-- ---------------------------------------------------------------------------------------------------
create or replace function public.autos_dealer_activate_listing(p_listing_id uuid, p_owner_user_id uuid, p_from_status text)
 returns table(activated boolean, idempotent boolean, blocked_reason text, active_count integer, effective_limit integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_target record;
  v_parent record;
  v_group_key uuid;
  v_boost_active boolean;
  v_limit int;
  v_count int;
  v_sub_status text;
  v_grace_ends_at timestamptz;
  v_has_authority boolean;
  v_now timestamptz := now();
begin
  select id, owner_user_id, lane, status, inventory_role,
         dealer_inventory_parent_listing_id, dealer_inventory_group_id
    into v_target
  from public.autos_classifieds_listings
  where id = p_listing_id
  for update;

  if not found or v_target.owner_user_id <> p_owner_user_id or v_target.lane <> 'negocios' then
    return query select false, false, 'not_found_or_owner_mismatch', null::int, null::int;
    return;
  end if;

  if v_target.status = 'active' then
    return query select true, true, null::text, null::int, null::int;
    return;
  end if;

  if v_target.status <> p_from_status then
    return query select false, false, 'status_mismatch', null::int, null::int;
    return;
  end if;

  if v_target.inventory_role is distinct from 'inventory_vehicle' then
    v_parent := v_target;
  else
    if v_target.dealer_inventory_parent_listing_id is null then
      return query select false, false, 'no_parent_link', null::int, null::int;
      return;
    end if;
    select id, owner_user_id, lane, inventory_role, dealer_inventory_group_id
      into v_parent
    from public.autos_classifieds_listings
    where id = v_target.dealer_inventory_parent_listing_id
    for update;
    if not found or v_parent.owner_user_id <> p_owner_user_id or v_parent.lane <> 'negocios' then
      return query select false, false, 'parent_not_found_or_owner_mismatch', null::int, null::int;
      return;
    end if;
  end if;

  v_group_key := coalesce(v_parent.dealer_inventory_group_id, v_parent.id);
  perform pg_advisory_xact_lock(871001, hashtext(v_group_key::text));

  select status, grace_ends_at into v_sub_status, v_grace_ends_at
  from public.leonix_subscription_records
  where listing_id = v_parent.id::text
    and listing_source in ('autos_classifieds_listings', 'autos')
  order by created_at desc
  limit 1;

  if v_sub_status = 'grace' and v_grace_ends_at is not null and v_grace_ends_at < v_now then
    v_sub_status := 'suspended';
  end if;

  if v_sub_status = 'grace' then
    return query select false, false, 'grace_blocks_new_capacity', null::int, null::int;
    return;
  elsif v_sub_status = 'suspended' then
    return query select false, false, 'subscription_suspended', null::int, null::int;
    return;
  elsif v_sub_status = 'canceled' then
    return query select false, false, 'subscription_canceled', null::int, null::int;
    return;
  end if;

  -- [B2] POSITIVE commercial authority for the dealer parent (entitlement OR live subscription; NOT subscription-only).
  select (
    exists (
      select 1 from public.listing_package_entitlements e
      where e.listing_id = v_parent.id::text
        and e.package_key = 'autos_dealer_monthly'
        and e.status = 'active'
        and e.revoked_at is null
        and (e.starts_at is null or e.starts_at <= v_now)
        and (e.ends_at   is null or e.ends_at   >= v_now)
        and lower(btrim(coalesce(e.metadata ->> 'payment_status', '')))
            not in ('pending', 'unpaid', 'requires_action', 'failed', 'canceled', 'refunded', 'disputed')
    )
    or exists (
      select 1 from public.leonix_subscription_records s
      where s.listing_id = v_parent.id::text
        and s.listing_source in ('autos_classifieds_listings', 'autos')
        and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end >= v_now)
    )
  ) into v_has_authority;

  if not coalesce(v_has_authority, false) then
    return query select false, false, 'commercial_authority_required', null::int, null::int;
    return;
  end if;

  select exists (
    select 1 from public.listing_package_entitlements e
    where e.listing_id = v_parent.id::text
      and e.package_key = 'autos_dealer_inventory_pack_monthly'
      and e.status = 'active'
      and e.revoked_at is null
      and (e.starts_at is null or e.starts_at <= v_now)
      and (e.ends_at   is null or e.ends_at   >= v_now)
  ) into v_boost_active;
  v_limit := case when v_boost_active then 20 else 10 end;

  select count(*) into v_count
  from public.autos_classifieds_listings c
  where c.owner_user_id = p_owner_user_id
    and c.lane = 'negocios'
    and c.status = 'active'
    and coalesce(c.dealer_inventory_group_id, c.dealer_inventory_parent_listing_id, c.id) = v_group_key
    and c.id <> p_listing_id;

  if v_count >= v_limit then
    return query select false, false, 'capacity_reached', v_count, v_limit;
    return;
  end if;

  update public.autos_classifieds_listings
     set status = 'active',
         published_at = coalesce(published_at, v_now),
         updated_at = v_now
   where id = p_listing_id;

  return query select true, false, null::text, v_count + 1, v_limit;
end;
$function$;

-- ---------------------------------------------------------------------------------------------------
-- 2) Bienes Raices Negocio inventory
-- ---------------------------------------------------------------------------------------------------
create or replace function public.br_negocio_activate_listing(p_listing_id uuid, p_owner_id uuid, p_from_status text)
 returns table(activated boolean, idempotent boolean, blocked_reason text, active_count integer, effective_limit integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_target record;
  v_parent record;
  v_pack_active boolean;
  v_limit int;
  v_count int;
  v_parent_active boolean;
  v_sub_status text;
  v_grace_ends_at timestamptz;
  v_has_authority boolean;
  v_now timestamptz := now();
begin
  select id, owner_id, category, status, is_published, inventory_role, br_inventory_parent_listing_id
    into v_target
  from public.listings
  where id = p_listing_id
  for update;

  if not found or v_target.owner_id <> p_owner_id or v_target.category <> 'bienes-raices' then
    return query select false, false, 'not_found_or_owner_mismatch', null::int, null::int;
    return;
  end if;

  if v_target.status = 'active' and v_target.is_published is true then
    return query select true, true, null::text, null::int, null::int;
    return;
  end if;

  if v_target.status <> p_from_status then
    return query select false, false, 'status_mismatch', null::int, null::int;
    return;
  end if;

  if v_target.inventory_role is distinct from 'inventory_property' then
    v_parent := v_target;
  else
    if v_target.br_inventory_parent_listing_id is null then
      return query select false, false, 'no_parent_link', null::int, null::int;
      return;
    end if;
    select id, owner_id, category, inventory_role, status, is_published
      into v_parent
    from public.listings
    where id = v_target.br_inventory_parent_listing_id
    for update;
    if not found or v_parent.owner_id <> p_owner_id or v_parent.category <> 'bienes-raices' then
      return query select false, false, 'parent_not_found_or_owner_mismatch', null::int, null::int;
      return;
    end if;
  end if;

  perform pg_advisory_xact_lock(871002, hashtext(v_parent.id::text));

  select status, grace_ends_at into v_sub_status, v_grace_ends_at
  from public.leonix_subscription_records
  where listing_id = v_parent.id::text
    and listing_source in ('listings', 'bienes-raices')
  order by created_at desc
  limit 1;

  if v_sub_status = 'grace' and v_grace_ends_at is not null and v_grace_ends_at < v_now then
    v_sub_status := 'suspended';
  end if;

  if v_sub_status = 'grace' then
    return query select false, false, 'grace_blocks_new_capacity', null::int, null::int;
    return;
  elsif v_sub_status = 'suspended' then
    return query select false, false, 'subscription_suspended', null::int, null::int;
    return;
  elsif v_sub_status = 'canceled' then
    return query select false, false, 'subscription_canceled', null::int, null::int;
    return;
  end if;

  -- [B2] POSITIVE commercial authority for the Negocio parent (entitlement OR live subscription; NOT subscription-only:
  -- Bienes Raices Negocio is sold as the br_agent_monthly base entitlement).
  select (
    exists (
      select 1 from public.listing_package_entitlements e
      where e.listing_id = v_parent.id::text
        and e.package_key = 'br_agent_monthly'
        and e.status = 'active'
        and e.revoked_at is null
        and (e.starts_at is null or e.starts_at <= v_now)
        and (e.ends_at   is null or e.ends_at   >= v_now)
        and lower(btrim(coalesce(e.metadata ->> 'payment_status', '')))
            not in ('pending', 'unpaid', 'requires_action', 'failed', 'canceled', 'refunded', 'disputed')
    )
    or exists (
      select 1 from public.leonix_subscription_records s
      where s.listing_id = v_parent.id::text
        and s.listing_source in ('listings', 'bienes-raices')
        and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end >= v_now)
    )
  ) into v_has_authority;

  if not coalesce(v_has_authority, false) then
    return query select false, false, 'commercial_authority_required', null::int, null::int;
    return;
  end if;

  select exists (
    select 1 from public.listing_package_entitlements e
    where e.listing_id = v_parent.id::text
      and e.package_key = 'br_inventory_pack_monthly'
      and e.status = 'active'
      and e.revoked_at is null
      and (e.starts_at is null or e.starts_at <= v_now)
      and (e.ends_at   is null or e.ends_at   >= v_now)
  ) into v_pack_active;
  v_limit := case when v_pack_active then 4 else 1 end;

  select (status = 'active' and is_published is true) into v_parent_active
  from public.listings where id = v_parent.id;

  select count(*) into v_count
  from public.listings c
  where c.category = 'bienes-raices'
    and c.inventory_role = 'inventory_property'
    and c.br_inventory_parent_listing_id = v_parent.id
    and c.status = 'active'
    and c.is_published is true
    and c.id <> p_listing_id;

  v_count := v_count + case when coalesce(v_parent_active, false) and v_parent.id <> p_listing_id then 1 else 0 end;

  if v_count >= v_limit then
    return query select false, false, 'capacity_reached', v_count, v_limit;
    return;
  end if;

  update public.listings
     set status = 'active', is_published = true,
         published_at = coalesce(published_at, v_now), updated_at = v_now
   where id = p_listing_id;

  return query select true, false, null::text, v_count + 1, v_limit;
end;
$function$;

-- CREATE OR REPLACE keeps the existing ACL, but restate it so this migration is self-contained even on a fresh database.
revoke all on function public.autos_dealer_activate_listing(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.br_negocio_activate_listing(uuid, uuid, text)   from public, anon, authenticated;
grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to service_role;
grant execute on function public.br_negocio_activate_listing(uuid, uuid, text)   to service_role;

do $post$
begin
  if position('commercial_authority_required' in pg_get_functiondef('public.br_negocio_activate_listing(uuid,uuid,text)'::regprocedure)) = 0
     or position('commercial_authority_required' in pg_get_functiondef('public.autos_dealer_activate_listing(uuid,uuid,text)'::regprocedure)) = 0 then
    raise exception 'capacity_rpc_commercial_authority: new body not installed';
  end if;
  if has_function_privilege('anon', 'public.br_negocio_activate_listing(uuid,uuid,text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.br_negocio_activate_listing(uuid,uuid,text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.autos_dealer_activate_listing(uuid,uuid,text)'::regprocedure, 'EXECUTE')
     or has_function_privilege('authenticated', 'public.autos_dealer_activate_listing(uuid,uuid,text)'::regprocedure, 'EXECUTE') then
    raise exception 'capacity_rpc_commercial_authority: a client role can still execute a capacity RPC';
  end if;
end
$post$;

commit;
