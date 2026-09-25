-- AUTOS CAPACITY REHEARSAL (Wave 2, 2026-09-25) — run ONLY on Staging / a branch database, never on production.
-- Requires 20260924190000_autos_dealer_base_capacity_authority applied. Fixture owners must be real auth.users ids on
-- that database (autos_classifieds_listings.owner_user_id has an FK to auth.users) — replace v_owner / v_other.
-- One DO block; it always ends with RAISE EXCEPTION 'AUTOS_REHEARSAL_RESULT fail=N ...', so NOTHING persists.
-- Staging result 2026-09-25: fail=0 (BASE 5 / PRO 10 / PACK 20 / no-evidence 10 / stray pack 5 / upgrade 10;
-- grace / expired grace / suspended / canceled / active; owner & status mismatch; idempotency; no parent link).
do $t$
declare
  v_owner uuid := '230e354f-6bc7-4e9f-ac20-bcd218bb5aa8';
  v_other uuid := 'd8ebdd6f-0749-42f8-ac8f-48aeed4dee9e';
  v_rep text := '';
  v_fail int := 0;
  tier record;
  v_p uuid; v_c uuid; r record; i int;
begin
  for tier in select * from (values
      ('BASE', array['autos_dealer_quick_monthly'], 5),
      ('PRO', array['autos_dealer_monthly'], 10),
      ('PACK', array['autos_dealer_monthly','autos_dealer_inventory_pack_monthly'], 20),
      ('NO_EVIDENCE', array[]::text[], 10),
      ('BASE+STRAY_PACK', array['autos_dealer_quick_monthly','autos_dealer_inventory_pack_monthly'], 5),
      ('BASE+PRO(upgrade)', array['autos_dealer_quick_monthly','autos_dealer_monthly'], 10)
    ) t(name, keys, total)
  loop
    insert into public.autos_classifieds_listings (owner_user_id, lane, status, inventory_role)
      values (v_owner, 'negocios', 'pending_payment', 'main') returning id into v_p;
    update public.autos_classifieds_listings set dealer_inventory_group_id = v_p where id = v_p;
    insert into public.listing_package_entitlements (listing_id, listing_source, category, package_key, package_tier, status, starts_at, ends_at)
      select v_p::text, 'autos_classifieds_listings', 'autos', k, 'digital_only', 'active', now() - interval '1 day', now() + interval '30 days'
      from unnest(tier.keys) k;
    select * into r from public.autos_dealer_activate_listing(v_p, v_owner, 'pending_payment');
    if not (r.activated and r.active_count = 1 and r.effective_limit = tier.total) then
      v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL %s parent: %s', tier.name, row_to_json(r));
    end if;
    for i in 2..(tier.total + 1) loop
      insert into public.autos_classifieds_listings (owner_user_id, lane, status, inventory_role, dealer_inventory_parent_listing_id, dealer_inventory_group_id)
        values (v_owner, 'negocios', 'pending_payment', 'inventory_vehicle', v_p, v_p) returning id into v_c;
      select * into r from public.autos_dealer_activate_listing(v_c, v_owner, 'pending_payment');
      if i <= tier.total then
        if not (r.activated and not r.idempotent and r.active_count = i and r.effective_limit = tier.total) then
          v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL %s child total %s should activate: %s', tier.name, i, row_to_json(r));
        end if;
      else
        if not (not r.activated and r.blocked_reason = 'capacity_reached' and r.active_count = tier.total and r.effective_limit = tier.total) then
          v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL %s child total %s should BLOCK: %s', tier.name, i, row_to_json(r));
        end if;
      end if;
    end loop;
    select count(*) into i from public.autos_classifieds_listings where coalesce(dealer_inventory_group_id, id) = v_p and status = 'active';
    v_rep := v_rep || format(E'\nOK-CHECK %s: active vehicles in group = %s (limit %s)', tier.name, i, tier.total);
    if i <> tier.total then v_fail := v_fail + 1; end if;
  end loop;

  insert into public.autos_classifieds_listings (owner_user_id, lane, status, inventory_role) values (v_owner, 'negocios', 'pending_payment', 'main') returning id into v_p;
  select * into r from public.autos_dealer_activate_listing(v_p, v_other, 'pending_payment');
  if r.activated or r.blocked_reason <> 'not_found_or_owner_mismatch' then v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL owner mismatch: %s', row_to_json(r)); end if;
  select * into r from public.autos_dealer_activate_listing(v_p, v_owner, 'draft');
  if r.activated or r.blocked_reason <> 'status_mismatch' then v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL status mismatch: %s', row_to_json(r)); end if;
  select * into r from public.autos_dealer_activate_listing(v_p, v_owner, 'pending_payment');
  if not r.activated then v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL first activation: %s', row_to_json(r)); end if;
  select * into r from public.autos_dealer_activate_listing(v_p, v_owner, 'pending_payment');
  if not (r.activated and r.idempotent) then v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL idempotency: %s', row_to_json(r)); end if;

  for tier in select * from (values ('grace', now() + interval '3 days', 'grace_blocks_new_capacity'),
                                    ('grace', now() - interval '1 day', 'subscription_suspended'),
                                    ('suspended', null::timestamptz, 'subscription_suspended'),
                                    ('canceled', null::timestamptz, 'subscription_canceled'),
                                    ('active', null::timestamptz, null)) s(status, grace_end, expect)
  loop
    insert into public.autos_classifieds_listings (owner_user_id, lane, status, inventory_role) values (v_owner, 'negocios', 'active', 'main') returning id into v_p;
    insert into public.leonix_subscription_records (listing_id, listing_source, status, grace_ends_at, stripe_subscription_id)
      values (v_p::text, 'autos_classifieds_listings', tier.status, tier.grace_end, 'sub_test_' || replace(gen_random_uuid()::text, '-', ''));
    insert into public.autos_classifieds_listings (owner_user_id, lane, status, inventory_role, dealer_inventory_parent_listing_id, dealer_inventory_group_id)
      values (v_owner, 'negocios', 'pending_payment', 'inventory_vehicle', v_p, v_p) returning id into v_c;
    select * into r from public.autos_dealer_activate_listing(v_c, v_owner, 'pending_payment');
    if (tier.expect is null and not r.activated) or (tier.expect is not null and (r.activated or r.blocked_reason <> tier.expect)) then
      v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL subscription %s/%s: %s', tier.status, tier.grace_end, row_to_json(r));
    else
      v_rep := v_rep || format(E'\nOK subscription %s (grace_end %s) -> %s', tier.status, coalesce(tier.grace_end::text,'-'), coalesce(r.blocked_reason, 'activated'));
    end if;
  end loop;

  insert into public.autos_classifieds_listings (owner_user_id, lane, status, inventory_role) values (v_owner, 'negocios', 'pending_payment', 'inventory_vehicle') returning id into v_c;
  select * into r from public.autos_dealer_activate_listing(v_c, v_owner, 'pending_payment');
  if r.activated or r.blocked_reason <> 'no_parent_link' then v_fail := v_fail + 1; v_rep := v_rep || format(E'\nFAIL no parent link: %s', row_to_json(r)); end if;

  raise exception 'AUTOS_REHEARSAL_RESULT fail=% (rolled back)%', v_fail, v_rep;
end
$t$;
