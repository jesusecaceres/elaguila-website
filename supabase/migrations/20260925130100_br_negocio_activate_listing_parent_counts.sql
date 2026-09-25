-- =====================================================================================================
-- LAUNCH SECURITY WAVE 2 — Bienes Raíces Negocio capacity: the agent parent counts (forward fix for fresh rebuilds).
--
-- WHY: 20260903150000_fix_parent_inventory_capacity_counting (now marked OBSOLETE) redefined
--   public.br_negocio_activate_listing with the agent PARENT EXCLUDED from the count, contradicting the owner rule
--   (Bienes Negocio BASE = 1 active property TOTAL; +$99 inventory pack = 4 total — the parent is property #1).
--   Leonix Media never applied it: its live function counts the parent. Staging did apply it. And nothing later in the
--   source tree restored the Bienes function (20260924190000 only replaces the Autos function), so a database rebuilt
--   from source would get parent-excluding Bienes capacity.
--
-- WHAT: CREATE OR REPLACE public.br_negocio_activate_listing(uuid, uuid, text) with EXACTLY the logic live on Leonix
--   Media (captured read-only 2026-09-25, md5 f69cc5331601605c6bfbe4d8fcfdf220): limit 1 (4 with an active
--   br_inventory_pack_monthly), active inventory_property children + the parent when the parent is active/published.
--   Service-role only (PUBLIC / anon / authenticated revoked — keeps Launch security Wave 1 intact).
--
-- EFFECT BY DATABASE:
--   * fresh rebuild from source : restores the correct parent-counting semantics after 20260903150000.
--   * Leonix Media              : logic-identical re-definition (no behaviour change); optional to apply there.
--   * Staging                   : moves it from parent-excluding back to production truth.
-- IDEMPOTENT: CREATE OR REPLACE + REVOKE/GRANT; assertions re-verify.
-- ROLLBACK  : none required for Leonix Media (identical logic); see docs/db-gates/wave-2-2026-09-25/README.md.
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

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

revoke all on function public.br_negocio_activate_listing(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.br_negocio_activate_listing(uuid, uuid, text) to service_role;

do $post$
declare
  v_fn oid := 'public.br_negocio_activate_listing(uuid,uuid,text)'::regprocedure;
  v_def text := pg_get_functiondef('public.br_negocio_activate_listing(uuid,uuid,text)'::regprocedure);
begin
  if has_function_privilege('anon', v_fn, 'EXECUTE')
     or has_function_privilege('authenticated', v_fn, 'EXECUTE')
     or has_function_privilege('public', v_fn, 'EXECUTE') then
    raise exception 'br_negocio_activate_listing_parent_counts: a client role can EXECUTE br_negocio_activate_listing';
  end if;
  if not has_function_privilege('service_role', v_fn, 'EXECUTE') then
    raise exception 'br_negocio_activate_listing_parent_counts: service_role lost EXECUTE';
  end if;
  if position('v_count := v_count + case when coalesce(v_parent_active, false)' in v_def) = 0 then
    raise exception 'br_negocio_activate_listing_parent_counts: parent is not counted';
  end if;
end
$post$;

commit;
