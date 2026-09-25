-- Autos dealer capacity authority — TOTAL active vehicles: BASE 5 / PRO 10 / PRO + pack 20.
--
-- OWNER LOCK (TOTAL, parent included): the dealer parent row is the dealer's first vehicle and inventory
-- children are additional vehicles, so
--     BASE ($249)              = 5  total  = parent + 4 children
--     PRO ($399)               = 10 total  = parent + 9 children
--     PRO + $129 inventory pack = 20 total  = parent + 19 children
-- The application guards, dashboard counts, checkout copy and fulfillment already count TOTAL vehicles
-- (main listing + additional). Only this function counted CHILDREN, with the parent excluded (Gate 6C.2)
-- and limits of 10 / 20 children, i.e. 11 / 21 vehicles — and knew nothing about BASE. This migration makes
-- the database agree with everything else.
--
-- WHY THE DATABASE MUST KNOW. `autos_dealer_activate_listing` is the FINAL, atomic capacity authority for
-- every dealer activation ("the atomic RPC is the FINAL financial authority; the application preflight is
-- advisory-only and can race"). Any path that reaches it without a BASE-aware application pre-check could
-- exceed BASE = 5:
--   * a race between the application preflight and the RPC (bundle publish, owner restore),
--   * admin restore / republish (no entitlement pre-check at all),
--   * the staff assisted-publish child activation (now routed through this RPC as well).
--
-- WHAT CHANGES (and only this):
--   1. The limit is derived per parent from its entitlements (never from the caller):
--        BASE only  = live autos_dealer_quick_monthly and NO live autos_dealer_monthly  -> 5 total
--        PRO + pack = live inventory pack                                                 -> 20 total
--        otherwise (PRO, or NO evidence — never treated as BASE)                          -> 10 total
--      The pack never lifts BASE (it is PRO-only).
--   2. The parent counts as one vehicle. Children are counted exactly as before (inventory_role =
--      'inventory_vehicle' in the same group); the child ceiling is total - 1 (4 / 9 / 19).
--   3. `active_count` / `effective_limit` are now TOTAL-vehicle numbers (children + parent / total limit),
--      so every consumer (payment activation, restore, admin) reports the same figures the dashboard shows.
--   Activating the PARENT is refused only when children already EXCEED the child ceiling (for example after a
--   downgrade); activating a CHILD is refused when it would exceed it.
-- SECURITY DEFINER, search_path, advisory locks, owner/parent/status verification, the idempotent
-- already-active short-circuit, subscription grace/suspended/canceled enforcement, the no-caller-supplied-
-- limit contract and service_role-only execution are preserved from 20260903150000. The Bienes function is
-- NOT touched.
--
-- NOT APPLIED BY THIS COMMIT. Apply through the normal migration process after PM approval, and re-run the
-- capacity certifier (scripts/certify-package-c-c9-capacity-rpcs.mjs) against the isolated project first.

create or replace function public.autos_dealer_activate_listing(
  p_listing_id uuid,
  p_owner_user_id uuid,
  p_from_status text
)
returns table(activated boolean, idempotent boolean, blocked_reason text, active_count int, effective_limit int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target record;
  v_parent record;
  v_group_key uuid;
  v_boost_active boolean;
  v_base_only boolean;
  v_target_is_parent boolean;
  v_limit int;
  v_count int;
  v_sub_status text;
  v_grace_ends_at timestamptz;
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

  v_target_is_parent := v_target.inventory_role is distinct from 'inventory_vehicle';
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

  select exists (
    select 1 from public.listing_package_entitlements e
    where e.listing_id = v_parent.id::text
      and e.package_key = 'autos_dealer_inventory_pack_monthly'
      and e.status = 'active'
      and e.revoked_at is null
      and (e.starts_at is null or e.starts_at <= v_now)
      and (e.ends_at   is null or e.ends_at   >= v_now)
  ) into v_boost_active;
  -- OWNER LOCK 2026-09-24 (TOTAL vehicles, parent included): BASE 5 / PRO 10 / PRO + pack 20. BASE is proven
  -- ONLY by a LIVE autos_dealer_quick_monthly entitlement with NO live autos_dealer_monthly (PRO) entitlement
  -- on the SAME parent — Full beats Quick when both are live, so an upgrade never reads as a downgrade, and NO
  -- evidence (no rows) is never treated as BASE. The inventory pack never lifts BASE (it is PRO-only), so a
  -- stray pack row cannot either. Liveness mirrors the application resolver: status active/scheduled, not
  -- revoked, and not past ends_at.
  select
    exists (
      select 1 from public.listing_package_entitlements e
      where e.listing_id = v_parent.id::text
        and e.package_key = 'autos_dealer_quick_monthly'
        and e.status in ('active', 'scheduled')
        and e.revoked_at is null
        and (e.ends_at is null or e.ends_at >= v_now)
    )
    and not exists (
      select 1 from public.listing_package_entitlements e
      where e.listing_id = v_parent.id::text
        and e.package_key = 'autos_dealer_monthly'
        and e.status in ('active', 'scheduled')
        and e.revoked_at is null
        and (e.ends_at is null or e.ends_at >= v_now)
    )
  into v_base_only;
  -- v_limit is the CHILD ceiling = TOTAL limit - 1 (the parent is the first vehicle): BASE 4, PRO 9, PRO + pack 19.
  v_limit := case when v_base_only then 4 when v_boost_active then 19 else 9 end;

  -- Children only (inventory_role predicate from Gate 6C.2: the dealer parent never matches this count
  -- regardless of what its own coalesced group key resolves to). The PARENT is added as one vehicle in the
  -- refusal / success figures below — it is the dealer's first vehicle under the TOTAL owner lock.
  select count(*) into v_count
  from public.autos_classifieds_listings c
  where c.owner_user_id = p_owner_user_id
    and c.lane = 'negocios'
    and c.inventory_role = 'inventory_vehicle'
    and c.status = 'active'
    and coalesce(c.dealer_inventory_group_id, c.dealer_inventory_parent_listing_id, c.id) = v_group_key
    and c.id <> p_listing_id;

  -- A child is refused when it would push the group past the child ceiling; the parent is refused only when
  -- the children ALREADY exceed it (parent + children > total). active_count / effective_limit are TOTALS.
  if (v_target_is_parent and v_count > v_limit) or (not v_target_is_parent and v_count >= v_limit) then
    return query select false, false, 'capacity_reached', v_count + 1, v_limit + 1;
    return;
  end if;

  update public.autos_classifieds_listings
     set status = 'active',
         published_at = coalesce(published_at, v_now),
         updated_at = v_now
   where id = p_listing_id;

  return query select true, false, null::text, v_count + 1 + (case when v_target_is_parent then 0 else 1 end), v_limit + 1;
end;
$$;

revoke all on function public.autos_dealer_activate_listing(uuid, uuid, text) from public;
grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to service_role;

comment on function public.autos_dealer_activate_listing(uuid, uuid, text) is
  'Atomic, SECURITY DEFINER capacity+lifecycle-derived activation for autos_classifieds_listings negocios rows. Never accepts a caller-supplied limit. Limit is derived from the exact dealer parent entitlements and is a TOTAL of active vehicles, parent included: BASE (live autos_dealer_quick_monthly, no live autos_dealer_monthly) = 5; PRO = 10; PRO + inventory pack = 20 (child ceilings 4 / 9 / 19). active_count and effective_limit are totals. service_role execution only.';
