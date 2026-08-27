-- Reconciliation: Comida Local's own migration
-- (20260826120000_leonix_endorsement_votes_comida_local.sql, on main since the comida-local
-- branch merged, but not applied to canonical production before this point) and this session's
-- BR/Rentas migration (20260827180000_leonix_professional_identities_br_rentas_community_trust.sql)
-- both independently widen the exact same leonix_endorsement_votes CHECK constraints and the
-- exact same toggle RPC, each with a hardcoded value list that does not include the other's
-- additions. Applying either alone, in either order, would silently drop the other's
-- target_type/category support. This migration sets the constraint and RPC to their true
-- combined final state — additive only, drops nothing. Applied to canonical production
-- (xuieateniufcrsfdomwl) and verified: constraint values, vote/identity row counts unchanged,
-- RPC still SECURITY INVOKER.

begin;

alter table public.leonix_endorsement_votes drop constraint if exists leonix_endorsement_votes_target_type_check;
alter table public.leonix_endorsement_votes
  add constraint leonix_endorsement_votes_target_type_check
  check (target_type in (
    'servicios_profile',
    'restaurantes_listing',
    'comida_local_listing',
    'bienes_raices_negocio_identity',
    'rentas_negocio_identity'
  ));

alter table public.leonix_endorsement_votes drop constraint if exists leonix_endorsement_votes_category_check;
alter table public.leonix_endorsement_votes
  add constraint leonix_endorsement_votes_category_check
  check (category in (
    'servicios',
    'restaurantes',
    'comida-local',
    'bienes_raices_negocio',
    'rentas_negocio'
  ));

create or replace function public.toggle_leonix_endorsement_vote(
  p_target_type text,
  p_target_id uuid,
  p_category text,
  p_endorsement_key text,
  p_user_id uuid
)
returns table(active boolean, vote_count integer)
language plpgsql
set search_path = public
as $$
declare
  v_deleted integer;
  v_target_exists boolean;
begin
  if p_target_type = 'servicios_profile' then
    select exists (select 1 from public.servicios_public_listings where id = p_target_id) into v_target_exists;
  elsif p_target_type = 'restaurantes_listing' then
    select exists (select 1 from public.restaurantes_public_listings where id = p_target_id) into v_target_exists;
  elsif p_target_type = 'comida_local_listing' then
    select exists (select 1 from public.comida_local_public_listings where id = p_target_id) into v_target_exists;
  elsif p_target_type in ('bienes_raices_negocio_identity', 'rentas_negocio_identity') then
    select exists (select 1 from public.leonix_professional_identities where id = p_target_id) into v_target_exists;
  else
    v_target_exists := false;
  end if;

  if not v_target_exists then
    raise exception 'leonix_endorsement_target_not_found' using errcode = 'foreign_key_violation';
  end if;

  delete from public.leonix_endorsement_votes
  where user_id = p_user_id
    and target_type = p_target_type
    and target_id = p_target_id
    and endorsement_key = p_endorsement_key;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    insert into public.leonix_endorsement_votes (target_type, target_id, category, endorsement_key, user_id)
    values (p_target_type, p_target_id, p_category, p_endorsement_key, p_user_id)
    on conflict (user_id, target_type, target_id, endorsement_key) do nothing;
  end if;

  return query
  select
    exists (
      select 1 from public.leonix_endorsement_votes
      where user_id = p_user_id
        and target_type = p_target_type
        and target_id = p_target_id
        and endorsement_key = p_endorsement_key
    ) as active,
    (
      select count(*)::integer from public.leonix_endorsement_votes
      where target_type = p_target_type and target_id = p_target_id and endorsement_key = p_endorsement_key
    ) as vote_count;
end;
$$;

commit;
