-- =====================================================================================================
-- BRANCH-DATABASE TEST for migrations 20260920120000 (revoke client EXECUTE) and 20260920124000 (positive commercial authority).
-- RUN ONLY ON A SUPABASE BRANCH / THROWAWAY COPY, never on production. One transaction, ends with ROLLBACK.
-- Run as `postgres`. PART 1 needs migration 1 applied; PART 2 needs migration 5 applied (skip it if only migration 1 is on the branch).
-- If the branch DB was built from repo migrations, migration 5's md5 drift guard needs:  set leonix.skip_rpc_md5_guard = 'on';
-- =====================================================================================================
begin;

create or replace function public._t_expect(p_label text, p_sql text, p_expect text) returns void
language plpgsql as $$
declare v_got text := 'OK';
begin
  begin
    execute p_sql;
  exception when others then
    v_got := sqlstate;
  end;
  if v_got is distinct from p_expect then
    raise exception 'TEST FAILED [%]: expected %, got %', p_label, p_expect, v_got;
  end if;
  raise notice 'PASS [%] -> %', p_label, v_got;
end
$$;
grant execute on function public._t_expect(text, text, text) to anon, authenticated, service_role;

-- ============================== PART 1: migration 1 (ACL) ===========================================================
do $t$
declare r record;
begin
  for r in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
            where n.nspname='public' and p.proname in ('br_negocio_activate_listing','autos_dealer_activate_listing') loop
    if has_function_privilege('anon', r.oid, 'EXECUTE') or has_function_privilege('authenticated', r.oid, 'EXECUTE') or has_function_privilege('public', r.oid, 'EXECUTE') then
      raise exception 'TEST FAILED: % still executable by a client role', r.proname;
    end if;
    if not has_function_privilege('service_role', r.oid, 'EXECUTE') then
      raise exception 'TEST FAILED: service_role cannot execute %', r.proname;
    end if;
    raise notice 'PASS [ACL %]', r.proname;
  end loop;
end
$t$;

-- fixtures (as postgres)
insert into public.listings (id, owner_id, category, status, is_published, seller_type, inventory_role, title, description) values
 ('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,'business','main','BR rpc row one','Descripcion suficientemente larga para el check'),
 ('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,'business','main','BR rpc row two','Descripcion suficientemente larga para el check'),
 ('c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,'business','main','BR rpc row three','Descripcion suficientemente larga para el check'),
 ('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,'business','main','BR rpc row four','Descripcion suficientemente larga para el check'),
 ('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000001','bienes-raices','pending',false,'business','main','BR rpc row five','Descripcion suficientemente larga para el check');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
select public._t_expect('authenticated cannot call br_negocio_activate_listing (42501)',
  $q$select * from public.br_negocio_activate_listing('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','pending')$q$, '42501');
select public._t_expect('authenticated cannot call autos_dealer_activate_listing (42501)',
  $q$select * from public.autos_dealer_activate_listing('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','pending')$q$, '42501');
reset role;
set local role anon;
select public._t_expect('anon cannot call br_negocio_activate_listing (42501)',
  $q$select * from public.br_negocio_activate_listing('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','pending')$q$, '42501');
reset role;
set local role service_role;
select public._t_expect('service_role CAN call the RPC (any result but a permission error)',
  $q$select * from public.br_negocio_activate_listing('c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','pending')$q$, 'OK');
reset role;

-- ============================== PART 2: migration 5 (positive authority) - skip if not applied ========================
-- Fixture 1 has no entitlement / subscription -> must be BLOCKED with commercial_authority_required.
do $t$
declare r record;
begin
  select * into r from public.br_negocio_activate_listing('c0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001','pending');
  if r.activated is not false or r.blocked_reason is distinct from 'commercial_authority_required' then
    raise exception 'TEST FAILED [BR no authority]: activated=% blocked_reason=%', r.activated, r.blocked_reason;
  end if;
  raise notice 'PASS [BR no entitlement/subscription -> commercial_authority_required]';
end
$t$;

-- Fixture 2: pending-payment entitlement must NOT count (contract: payment_status pending blocks).
insert into public.listing_package_entitlements (listing_id, category, listing_source, package_key, package_tier, status, starts_at, ends_at, metadata)
values ('c0000000-0000-0000-0000-000000000003','bienes-raices','bienes-raices','br_agent_monthly','digital_only','active', now()-interval '1 day', now()+interval '29 days', '{"payment_status":"pending"}');
do $t$
declare r record;
begin
  select * into r from public.br_negocio_activate_listing('c0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000001','pending');
  if r.activated is not false or r.blocked_reason is distinct from 'commercial_authority_required' then
    raise exception 'TEST FAILED [BR pending-payment entitlement]: activated=% blocked_reason=%', r.activated, r.blocked_reason;
  end if;
  raise notice 'PASS [BR entitlement with payment_status=pending -> blocked]';
end
$t$;

-- Fixture 3: expired entitlement (ends in the past) must NOT count.
insert into public.listing_package_entitlements (listing_id, category, listing_source, package_key, package_tier, status, starts_at, ends_at, metadata)
values ('c0000000-0000-0000-0000-000000000004','bienes-raices','bienes-raices','br_agent_monthly','digital_only','active', now()-interval '60 days', now()-interval '30 days', '{}');
do $t$
declare r record;
begin
  select * into r from public.br_negocio_activate_listing('c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000001','pending');
  if r.activated is not false or r.blocked_reason is distinct from 'commercial_authority_required' then
    raise exception 'TEST FAILED [BR expired entitlement]: activated=% blocked_reason=%', r.activated, r.blocked_reason;
  end if;
  raise notice 'PASS [BR expired entitlement -> blocked]';
end
$t$;

-- Fixture 4: a valid entitlement WITHOUT any subscription record (the real production shape: metadata has no payment_status) must ACTIVATE.
insert into public.listing_package_entitlements (listing_id, category, listing_source, package_key, package_tier, status, starts_at, ends_at, metadata, grant_source)
values ('c0000000-0000-0000-0000-000000000005','bienes-raices','bienes-raices','br_agent_monthly','digital_only','active', now()-interval '1 day', now()+interval '29 days', '{"subscription_active":true}', 'stripe_webhook');
do $t$
declare r record;
begin
  select * into r from public.br_negocio_activate_listing('c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000001','pending');
  if r.activated is not true then
    raise exception 'TEST FAILED [BR valid entitlement, no subscription]: activated=% blocked_reason=%', r.activated, r.blocked_reason;
  end if;
  raise notice 'PASS [BR valid base entitlement, no subscription record -> activated]';
end
$t$;

-- Autos: dealer parent without authority is blocked; with an active subscription record only it activates.
insert into public.autos_classifieds_listings (id, owner_user_id, lane, status, inventory_role) values
 ('c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000002','negocios','draft','main'),
 ('c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000002','negocios','draft','main');
do $t$
declare r record;
begin
  select * into r from public.autos_dealer_activate_listing('c0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000002','draft');
  if r.activated is not false or r.blocked_reason is distinct from 'commercial_authority_required' then
    raise exception 'TEST FAILED [autos no authority]: activated=% blocked_reason=%', r.activated, r.blocked_reason;
  end if;
  raise notice 'PASS [autos no entitlement/subscription -> commercial_authority_required]';
end
$t$;
insert into public.leonix_subscription_records (stripe_subscription_id, listing_id, listing_source, category, package_key, owner_user_id, status, current_period_end)
values ('sub_branch_test_1','c0000000-0000-0000-0000-000000000012','autos','autos','autos_dealer_monthly','d0000000-0000-0000-0000-000000000002','active', now()+interval '20 days');
do $t$
declare r record;
begin
  select * into r from public.autos_dealer_activate_listing('c0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000002','draft');
  if r.activated is not true then
    raise exception 'TEST FAILED [autos live subscription]: activated=% blocked_reason=%', r.activated, r.blocked_reason;
  end if;
  raise notice 'PASS [autos live subscription record -> activated]';
end
$t$;

drop function public._t_expect(text, text, text);
rollback;   -- nothing persists
