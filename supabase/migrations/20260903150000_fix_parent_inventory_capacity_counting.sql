-- Gate 6C.2 — commercial-contract correction: the dealer/agent parent must never consume one of
-- its own purchased inventory slots.
--
-- Confirmed root cause (Gate 6C.1): both `autos_dealer_activate_listing` and
-- `br_negocio_activate_listing` (originally created in
-- 20260810120000_autos_br_negocio_capacity_activation_rpc.sql, NOT edited here) counted the
-- active parent row itself toward v_count, because:
--   - Autos: the count query filtered only on lane/status/group-key, with no inventory_role
--     predicate, so the parent (whose own dealer_inventory_group_id/dealer_inventory_parent_
--     listing_id are both null, making its coalesce resolve to its own id) matched v_group_key
--     just like a real child would.
--   - Bienes: the count query itself already correctly scoped to
--     inventory_role='inventory_property' children only, but a trailing
--     `v_count := v_count + case when parent active ... then 1 else 0 end` explicitly added the
--     parent back in afterward.
-- Effect: base/boosted capacity silently delivered 9/19 real vehicles and 0/3 real properties
-- instead of the locked 10/20 vehicles and 1/4 properties.
--
-- This migration is purely additive (CREATE OR REPLACE FUNCTION on existing functions) and
-- changes ONLY the count semantics described above. Every other behavior — SECURITY DEFINER,
-- search_path, advisory locks, owner/parent/status verification, the idempotent already-active
-- short-circuit, subscription grace/suspended/canceled enforcement, entitlement-derived limit
-- resolution, the no-caller-supplied-limit contract, the return shape, and
-- revoke/grant-to-service_role-only — is preserved byte-for-byte from the original migration.

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- 1) Autos dealer inventory: same shape as 20260810120000, with an added
--    `c.inventory_role = 'inventory_vehicle'` predicate on the capacity count so the dealer
--    parent (inventory_role='main') can never satisfy it.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
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
  v_limit := case when v_boost_active then 20 else 10 end;

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
  'Package C Build 4 (C7), corrected Gate 6C.2 — atomic, SECURITY DEFINER capacity+lifecycle-derived activation for autos_classifieds_listings negocios rows. Never accepts a caller-supplied limit; derives boost state from the exact dealer parent listing_id only; capacity count is scoped to inventory_role=''inventory_vehicle'' children only, excluding the dealer parent itself. service_role execution only.';

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- 2) Bienes Raíces Negocio inventory: same shape as 20260810120000, with the trailing
--    parent-inclusion addition to v_count removed. The count query itself was already correctly
--    scoped to inventory_role='inventory_property' children only.
-- ─────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.br_negocio_activate_listing(
  p_listing_id uuid,
  p_owner_id uuid,
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
  v_pack_active boolean;
  v_limit int;
  v_count int;
  v_sub_status text;
  v_grace_ends_at timestamptz;
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

  -- Gate 6C.2 — count is (and already was) scoped to real inventory_property children only; the
  -- parent-inclusion addition that previously followed this query has been removed below.
  select count(*) into v_count
  from public.listings c
  where c.category = 'bienes-raices'
    and c.inventory_role = 'inventory_property'
    and c.br_inventory_parent_listing_id = v_parent.id
    and c.status = 'active'
    and c.is_published is true
    and c.id <> p_listing_id;

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
$$;

revoke all on function public.br_negocio_activate_listing(uuid, uuid, text) from public;
grant execute on function public.br_negocio_activate_listing(uuid, uuid, text) to service_role;

comment on function public.br_negocio_activate_listing(uuid, uuid, text) is
  'Package C Build 4 (C7), corrected Gate 6C.2 — atomic, SECURITY DEFINER capacity+lifecycle-derived activation for listings bienes-raices negocio inventory rows. Never accepts a caller-supplied limit; derives pack state from the exact commercial parent listing_id only; capacity count is scoped to inventory_role=''inventory_property'' children only, excluding the parent itself. service_role execution only.';
