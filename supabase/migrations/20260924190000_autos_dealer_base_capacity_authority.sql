-- Autos dealer capacity authority — BASE (Quick / Simple) = 5 active vehicles total.
--
-- WHY THE DATABASE MUST KNOW. `autos_dealer_activate_listing` is the FINAL, atomic capacity authority
-- for every dealer activation (its own doc: "the atomic RPC is the FINAL financial authority; the
-- application preflight is advisory-only and can race"). Before this migration it knew only 10 / 20, so
-- any path that reaches it without a BASE-aware application pre-check could exceed BASE = 5:
--   * a race between the application preflight and the RPC (bundle publish, owner restore),
--   * admin restore / republish (no entitlement pre-check at all),
--   * the staff assisted-publish child activation (now routed through this RPC as well).
-- The application guards remain (fast, friendly copy); this makes the database agree with them.
--
-- SCOPE. CREATE OR REPLACE of the ONE autos function, changing ONLY the limit derivation (see the inline
-- comment). SECURITY DEFINER, search_path, advisory locks, owner/parent/status verification, idempotent
-- already-active short-circuit, subscription grace/suspended/canceled enforcement, the no-caller-supplied-
-- limit contract, the return shape and service_role-only execution are preserved from
-- 20260903150000. The Bienes function is NOT touched (BASE there is one property, already enforced).
--
-- NOT APPLIED BY THIS COMMIT. Apply through the normal migration process after PM approval.
--
-- NOTE (pre-existing, unchanged): this function counts CHILD vehicles only (the parent is excluded, per
-- 20260903150000), so PRO = parent + up to 10 children and PRO + pack = parent + up to 20, one more than the
-- application guard's total. BASE here is expressed as 4 children so that parent + children = 5, matching
-- the owner lock and the application guard exactly.

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
  -- OWNER LOCK 2026-09-24: BASE (Quick / Simple, $249) = at most FIVE active vehicles TOTAL — the main
  -- vehicle listing plus up to FOUR inventory children (the count below excludes the parent, so the
  -- child limit is 4). BASE is proven ONLY by a LIVE autos_dealer_quick_monthly entitlement with NO live
  -- autos_dealer_monthly (PRO) entitlement on the SAME parent — Full beats Quick when both are live, so
  -- an upgrade never reads as a downgrade, and NO evidence (no rows) is never treated as BASE. The
  -- inventory pack never lifts BASE (it is PRO-only), so a stray pack row cannot either. PRO (10) and
  -- PRO + pack (20) are unchanged. Liveness mirrors the application resolver: status active/scheduled,
  -- not revoked, and not past ends_at.
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
  v_limit := case when v_base_only then 4 when v_boost_active then 20 else 10 end;

  -- Gate 6C.2 — inventory_role predicate added: only real inventory_vehicle children may
  -- consume a capacity slot; the dealer parent (inventory_role='main') never matches this count
  -- regardless of what its own coalesced group key resolves to.
  select count(*) into v_count
  from public.autos_classifieds_listings c
  where c.owner_user_id = p_owner_user_id
    and c.lane = 'negocios'
    and c.inventory_role = 'inventory_vehicle'
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
$$;

revoke all on function public.autos_dealer_activate_listing(uuid, uuid, text) from public;
grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to service_role;

comment on function public.autos_dealer_activate_listing(uuid, uuid, text) is
  'Atomic, SECURITY DEFINER capacity+lifecycle-derived activation for autos_classifieds_listings negocios rows. Never accepts a caller-supplied limit. Limit is derived from the exact dealer parent entitlements: BASE (live autos_dealer_quick_monthly, no live autos_dealer_monthly) = 4 children (5 vehicles total); PRO = 10; PRO + inventory pack = 20. Capacity count is scoped to inventory_role=''inventory_vehicle'' children only. service_role execution only.';
