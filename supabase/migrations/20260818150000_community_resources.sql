-- Recursos Data OS (Build 02) — permanent persistence for the Build 01 ResourceRecord contract
-- (app/lib/recursos/types.ts). Writes go through the service role only (app/admin/recursosActions.ts
-- + app/lib/recursos/server/communityResourcesDb.ts); public reads are limited to active rows via
-- RLS as defense-in-depth even though the app layer already never selects inactive/internal data.
--
-- Ranking doctrine (locked): this table intentionally has NO paid-boost/sponsorship ranking column.
-- `partner_status` and `featured` are editorial/relationship metadata only — future public ranking
-- (Build 03) must derive from urgency/relevance/geography/eligibility/verification freshness/active
-- status, never from partner_status or featured.

create table if not exists public.community_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,

  -- IDENTITY
  organization_name text not null,
  program_name text,
  organization_type text not null default 'other'
    check (organization_type in (
      'nonprofit', 'government', 'faith-based', 'school-district',
      'healthcare', 'community-clinic', 'hotline', 'other'
    )),

  -- BILINGUAL CONTENT
  short_description_es text not null default '',
  short_description_en text not null default '',
  details_es text,
  details_en text,

  -- CLASSIFICATION
  primary_category text not null
    check (primary_category in (
      'urgent-safety', 'food-basic-needs', 'housing-rent', 'mental-health-recovery',
      'health-clinics', 'legal-immigration', 'babies-kids-parents', 'youth-education',
      'jobs-training', 'seniors-disability', 'transportation-access', 'community-support'
    )),
  secondary_categories jsonb not null default '[]'::jsonb,
  urgency_level text not null default 'i-need-help'
    check (urgency_level in ('help-now', 'i-need-help', 'want-to-connect')),

  -- AUDIENCE
  age_min integer check (age_min is null or age_min >= 0),
  age_max integer check (age_max is null or age_max >= 0),
  audience_tags jsonb not null default '[]'::jsonb,

  -- SERVICE DATA
  service_tags jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  cost_model text not null default 'unknown'
    check (cost_model in ('free', 'low_cost', 'eligibility_based', 'unknown')),
  eligibility_es text,
  eligibility_en text,
  service_area text,

  -- CONTACT
  phone text,
  crisis_phone text,
  sms text,
  whatsapp text,
  email text,
  website_url text,
  application_url text,
  address_line1 text,
  address_line2 text,
  address_city text,
  address_state text,
  address_zip text,
  address_withheld_for_safety boolean not null default false,
  maps_search_href text,
  hours_note_es text,
  hours_note_en text,
  weekly_hours jsonb not null default '[]'::jsonb,
  is_24_hours boolean not null default false,

  -- VERIFICATION
  official_source_url text,
  last_verified_at timestamptz,
  next_verification_at timestamptz,
  verification_status text not null default 'needs_review'
    check (verification_status in ('verified', 'needs_review', 'stale', 'inactive')),
  active boolean not null default true,

  -- EDITORIAL / INTERNAL (never exposed publicly — see toPublicResource() in app/lib/recursos/types.ts)
  partner_status text not null default 'none'
    check (partner_status in ('none', 'listed', 'partner', 'founding-partner')),
  featured boolean not null default false,
  print_eligible boolean not null default false,
  internal_notes text,

  -- SYSTEM
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text,

  constraint community_resources_age_range_chk
    check (age_min is null or age_max is null or age_min <= age_max)
);

create index if not exists community_resources_primary_category_idx
  on public.community_resources (primary_category);

create index if not exists community_resources_urgency_level_idx
  on public.community_resources (urgency_level);

create index if not exists community_resources_verification_status_idx
  on public.community_resources (verification_status);

create index if not exists community_resources_active_idx
  on public.community_resources (active);

create index if not exists community_resources_active_urgency_idx
  on public.community_resources (active, urgency_level);

create index if not exists community_resources_updated_at_idx
  on public.community_resources (updated_at desc);

create index if not exists community_resources_next_verification_at_idx
  on public.community_resources (next_verification_at);

alter table public.community_resources enable row level security;

-- Defense in depth: even if a future code path queries with the anon key, only active AND
-- non-inactive-verification rows are visible. Admin/service-role reads and writes bypass RLS.
create policy "community_resources_select_public"
  on public.community_resources
  for select
  using (active = true and verification_status <> 'inactive');
