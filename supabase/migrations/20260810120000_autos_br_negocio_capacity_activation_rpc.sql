-- Package C Build 4 (C7) — atomic, capacity-and-lifecycle-deriving activation RPCs.
--
-- Two additive, SECURITY DEFINER functions only. No new tables, columns, indexes, or RLS
-- changes. Neither function accepts a caller-supplied capacity limit — each independently
-- re-derives owner/parent/group identity from fresh, transaction-locked DB rows, derives its
-- own effective capacity limit from a parent-scoped `listing_package_entitlements` lookup, and
-- independently enforces the existing C2/C3 subscription lifecycle rule (no new capacity during
-- grace/suspended/canceled) by querying `leonix_subscription_records` directly — never trusting
-- the application-level preflight guard (`commercialWriteGuard.ts`), which remains UX-only.
--
-- Both functions are serialized per commercial parent/group via a transaction-scoped Postgres
-- advisory lock (auto-released on commit/rollback), closing the SELECT-count-then-write race
-- that the application layer alone cannot close (see Package C Build 4 plan §G for the full
-- design rationale and adversarial review).
--
-- AUTHORED ONLY. NOT APPLIED to any database by this migration file's presence in the repo —
-- application is a separate, later, explicitly-authorized step outside this build's scope.

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- 1) Autos dealer inventory: atomic capacity+lifecycle-derived activation.
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

  -- Idempotent already-active short-circuit. No lock, no recount, no write: a duplicated
  -- webhook/verify delivery for an already-active row is a no-op success, never a second
  -- consumed slot, and never requires a destructive status transition to succeed.
  if v_target.status = 'active' then
    return query select true, true, null::text, null::int, null::int;
    return;
  end if;

  if v_target.status <> p_from_status then
    return query select false, false, 'status_mismatch', null::int, null::int;
    return;
  end if;

  -- `inventory_role` is nullable for legacy rows that predate the dealer-grouping migration
  -- (`autos_classifieds_listings_inventory_role_chk` permits null) — treated the same as 'main'
  -- (self-parent, no group children expected) rather than requiring a parent link that was never
  -- assigned to them.
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

  -- Reuse the EXACT canonical subscription lookup already built in C2/C3
  -- (commercialWriteGuard.ts's loadSubscriptionStatusForParent): listing_id = parent's own id,
  -- listing_source in ('autos_classifieds_listings','autos'), most recent row, no row -> permit
  -- (required for first-payment activation — inventory activation runs before the subscription
  -- record is created in the same webhook delivery). A lapsed grace is treated as effectively
  -- suspended for THIS decision only; the write-back reconciliation stays owned by existing TS
  -- call sites/webhook cranks, not duplicated here.
  select status, grace_ends_at into v_sub_status, v_grace_ends_at
  from public.leonix_subscription_records
  where listing_id = v_parent.id
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
  -- v_sub_status in ('active','pending') or null (no subscription record yet) -> permitted.

  select exists (
    select 1 from public.listing_package_entitlements e
    where e.listing_id = v_parent.id
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
$$;

revoke all on function public.autos_dealer_activate_listing(uuid, uuid, text) from public;
grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to service_role;

comment on function public.autos_dealer_activate_listing(uuid, uuid, text) is
  'Package C Build 4 (C7) — atomic, SECURITY DEFINER capacity+lifecycle-derived activation for autos_classifieds_listings negocios rows. Never accepts a caller-supplied limit; derives boost state from the exact dealer parent listing_id only. service_role execution only.';

-- ─────────────────────────────────────────────────────────────────────────────────────────────
-- 2) Bienes Raíces Negocio inventory: same shape, parent-scoped, lock namespace 871002.
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
  v_parent_active boolean;
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

  -- `inventory_role` is nullable for legacy rows that predate the property-grouping migration
  -- (`listings_br_inventory_role_chk` permits null) — treated the same as 'main' (self-parent,
  -- no group children expected) rather than requiring a parent link never assigned to them.
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
  where listing_id = v_parent.id
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
    where e.listing_id = v_parent.id
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
$$;

revoke all on function public.br_negocio_activate_listing(uuid, uuid, text) from public;
grant execute on function public.br_negocio_activate_listing(uuid, uuid, text) to service_role;

comment on function public.br_negocio_activate_listing(uuid, uuid, text) is
  'Package C Build 4 (C7) — atomic, SECURITY DEFINER capacity+lifecycle-derived activation for listings bienes-raices negocio inventory rows. Never accepts a caller-supplied limit; derives pack state from the exact commercial parent listing_id only. service_role execution only.';
