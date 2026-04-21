-- Empleos (jobs) public listings — production source of truth for Clasificados Empleos.
-- Writes: Next.js routes with service role. Reads: published rows for public discovery; owners via RLS.

create table if not exists public.empleos_public_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  lane text not null
    check (lane in ('quick', 'premium', 'feria')),
  owner_user_id uuid references auth.users (id) on delete set null,
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in (
      'draft',
      'pending_review',
      'published',
      'paused',
      'archived',
      'rejected'
    )),
  moderation_reason text,
  review_notes text,
  lang text not null default 'es'
    check (lang in ('es', 'en')),
  title text not null,
  company_name text not null,
  city text not null,
  state text not null,
  postal_code text,
  modality text not null,
  job_type text not null,
  experience text not null,
  company_type text not null,
  category_slug text not null default 'oficina',
  salary_min numeric not null default 0,
  salary_max numeric not null default 0,
  salary_label text not null default '—',
  quick_apply boolean not null default false,
  verified_employer boolean not null default false,
  premium_employer boolean not null default false,
  listing_tier text not null default 'standard',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  listing_snapshot jsonb not null default '{}'::jsonb
);

create index if not exists empleos_public_listings_published_idx
  on public.empleos_public_listings (published_at desc nulls last)
  where lifecycle_status = 'published';

create index if not exists empleos_public_listings_owner_idx
  on public.empleos_public_listings (owner_user_id);

create index if not exists empleos_public_listings_lifecycle_idx
  on public.empleos_public_listings (lifecycle_status);

create index if not exists empleos_public_listings_city_state_idx
  on public.empleos_public_listings (lower(city), upper(state));

alter table public.empleos_public_listings enable row level security;

create policy "empleos_public_listings_select_published"
  on public.empleos_public_listings
  for select
  using (lifecycle_status = 'published');

create policy "empleos_public_listings_select_owner"
  on public.empleos_public_listings
  for select
  using (auth.uid() is not null and owner_user_id = auth.uid());

comment on table public.empleos_public_listings is
  'Leonix Clasificados — Empleos listings. Inserts/updates via service role API; public reads published; owners read own rows.';

-- Job applications (candidate → listing). All access via authenticated API + service role insert/select rules in app.
create table if not exists public.empleos_job_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.empleos_public_listings (id) on delete cascade,
  applicant_user_id uuid references auth.users (id) on delete set null,
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  message text not null default '',
  answers_json jsonb not null default '{}'::jsonb,
  status text not null default 'submitted'
    check (status in ('submitted', 'viewed', 'shortlisted', 'rejected', 'hired')),
  created_at timestamptz not null default now()
);

create index if not exists empleos_job_applications_listing_idx
  on public.empleos_job_applications (listing_id, created_at desc);

alter table public.empleos_job_applications enable row level security;

-- No anon policies: applications are read/written only through server APIs using the service role.

comment on table public.empleos_job_applications is
  'Candidate applications for Empleos listings. Use service role from Next.js API routes.';
