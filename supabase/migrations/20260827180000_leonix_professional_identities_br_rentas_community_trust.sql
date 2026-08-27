-- Final Completion item 21 — Leonix Community Trust for BR Negocio / Rentas Negocio.
--
-- ****************************************************************************
-- PREPARED MIGRATION — NOT YET APPLIED TO ANY LIVE DATABASE (including production).
-- Apply only after explicit owner approval, using the same tracked Supabase migration
-- mechanism used for every other migration in this repo. This file is committed to the repo
-- so the migration is reviewable and ready, matching Wave 1's "safe first implementation
-- scope" principle — additive-only DDL, no data rewrite, no existing behavior change.
-- ****************************************************************************
--
-- WHY A NEW TABLE (not the existing servicios/restaurantes durable tables, not a Business Hub
-- table): the leonix_endorsement_votes design requires target_id to reference a table with
-- exactly one durable row per business identity that survives listing expiration/deletion.
-- Repo-wide search (all supabase/migrations/*.sql) found no such table for BR Negocio or
-- Rentas Negocio — their professional identity (agent name, brokerage, business name, etc.) is
-- captured fresh per LISTING row (`business_meta` JSON on `listings`), not in any separate
-- one-row-per-professional table. There is also no "Business Hub" table to duplicate — the
-- Global Business Hub OS (SharedConnectionHubReviewButton, etc.) is a rendering layer with no
-- database table of its own. This migration creates the smallest table that satisfies the
-- durability requirement: one row per (owner_id, category), keyed by the one thing about a BR
-- or Rentas professional that IS already durable and survives listing expiration — the
-- authenticated owner_id of the account that publishes their listings.
--
-- Forward-only schema. No data backfill (rows are created lazily, on first resolve, by the
-- application layer — see leonixProfessionalIdentityServer.ts). No existing table's rows are
-- touched. Servicios/Restaurantes categories, tables, and votes are completely untouched.

begin;

create table if not exists public.leonix_professional_identities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  -- Last-known display name, informational only (e.g. for an admin listing view) — never the
  -- authoritative source for what a vote is "about". The vote target is the (owner_id, category)
  -- identity itself, which survives even if display_name goes stale after a listing expires.
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leonix_professional_identities_category_chk
    check (category in ('bienes_raices_negocio', 'rentas_negocio'))
);

-- One durable identity per (owner, category) — resolved idempotently (insert-if-absent) by the
-- server, never client-writable directly.
create unique index if not exists leonix_professional_identities_owner_category_uidx
  on public.leonix_professional_identities (owner_id, category);

alter table public.leonix_professional_identities enable row level security;

-- Mirrors leonix_endorsement_votes' own posture: server-only via service role (the API route
-- resolves/creates identities; the identity's existence is otherwise only ever read indirectly
-- through the vote-summary RPC, never listed or browsed directly). RLS enabled, zero anon/
-- authenticated policies — same intentional pattern as leonix_endorsement_votes itself.
comment on table public.leonix_professional_identities is
  'Item 21 — durable per-(owner_id, category) professional identity for BR Negocio / Rentas '
  'Negocio Community Trust voting. One row survives across all of that owner''s listings and '
  'listing expirations. Service-role write/read only, via the resolve-identity API route.';

-- ---------------------------------------------------------------------------
-- Widen leonix_endorsement_votes for the two new target types + categories, preserving every
-- existing value (mirrors the exact additive drop/recreate pattern already used by
-- 20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql and
-- 20260602120000_g2a_global_analytics_identity.sql). Servicios/Restaurantes rows and behavior
-- are completely unaffected — their two constraint values are simply still present in the list.
-- ---------------------------------------------------------------------------
alter table public.leonix_endorsement_votes drop constraint if exists leonix_endorsement_votes_target_type_check;
alter table public.leonix_endorsement_votes
  add constraint leonix_endorsement_votes_target_type_check
  check (target_type in (
    'servicios_profile',
    'restaurantes_listing',
    'bienes_raices_negocio_identity',
    'rentas_negocio_identity'
  ));

alter table public.leonix_endorsement_votes drop constraint if exists leonix_endorsement_votes_category_check;
alter table public.leonix_endorsement_votes
  add constraint leonix_endorsement_votes_category_check
  check (category in ('servicios', 'restaurantes', 'bienes_raices_negocio', 'rentas_negocio'));

-- ---------------------------------------------------------------------------
-- Extend the atomic toggle RPC's target-existence check (Gate 6 of the original migration) with
-- the two new target types, verified against the new durable identity table. Function body is
-- otherwise byte-identical to the live version — only the target_type branch list changes.
-- ---------------------------------------------------------------------------
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
