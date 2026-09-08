-- Recursos Build 03A-V — durable current-source verification evidence for PDF-derived
-- candidate resources. This table is admin/operations evidence only: it records what a
-- staff member checked against a CURRENT official source, never the 2023 PDF alone, and
-- tracks whether/where a candidate was promoted into public.community_resources.
--
-- The candidate JSON at data/recursos/candidates/scc-community-resource-guide-2023.json
-- remains the immutable discovery-source record; this table is where review state lives.
create table if not exists public.community_resource_candidate_reviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null unique,

  disposition text not null default 'pending'
    check (disposition in ('pending', 'ready_for_promotion', 'promoted', 'dropped')),

  reviewed_by text,
  reviewed_at timestamptz,

  current_source_url text,
  current_source_type text
    check (current_source_type is null or current_source_type in ('government', 'official_org_site', 'phone_call')),

  organization_confirmed_active boolean,

  fields_confirmed jsonb not null default '[]',
  discrepancies_from_pdf jsonb not null default '[]',

  is_24_hours_confirmed_explicit boolean not null default false,

  address_handling text
    check (address_handling is null or address_handling in ('confirmed', 'withheld_for_safety', 'not_applicable')),

  verification_notes text,

  promoted_resource_id uuid references public.community_resources (id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_resource_candidate_reviews_disposition_idx
  on public.community_resource_candidate_reviews (disposition);

create index if not exists community_resource_candidate_reviews_promoted_resource_id_idx
  on public.community_resource_candidate_reviews (promoted_resource_id);

-- Admin/operations evidence only — never exposed to the public surface.
alter table public.community_resource_candidate_reviews enable row level security;
-- Deliberately no select/insert/update/delete policy: all access is service-role only,
-- mirroring public.community_resources' own write path (see communityResourcesDb.ts).
