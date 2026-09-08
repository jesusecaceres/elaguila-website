-- Executive Hub — real persistence for Leonix Executive Contact Platform profiles.
-- Replaces the temporary in-memory admin store. Writes go through the service role
-- (app/admin/_lib/executiveHubStore.ts); the public /contact/[slug] route reads published
-- rows first, falling back to the legacy hardcoded registry during migration.

create table if not exists public.executives (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  preferred_name text,
  title text not null default '',
  company text not null default '',
  legal_entity text not null default '',
  phone_display text not null default '',
  phone_digits text not null default '',
  whatsapp_digits text not null default '',
  email text not null default '',
  website text not null default '',
  address_line1 text not null default '',
  address_line2 text,
  city text not null default '',
  state text not null default '',
  postal_code text not null default '',
  photo_path text,
  logo_path text,
  cover_path text,
  bio text not null default '',
  languages jsonb not null default '[]'::jsonb,
  business_hub_link text not null default '',
  connection_hub_link text not null default '',
  trust_chips jsonb not null default '[]'::jsonb,
  socials jsonb not null default '[]'::jsonb,
  theme text not null default 'leonix',
  working_hours jsonb not null default '[]'::jsonb,
  notes text not null default '',
  meta_description text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists executives_status_idx on public.executives (status);
create index if not exists executives_updated_at_idx on public.executives (updated_at desc);

alter table public.executives enable row level security;

-- Defense in depth: even if a future code path queries with the anon key, only published
-- executives are visible. Admin/service-role reads and writes bypass RLS entirely.
create policy "executives_select_published"
  on public.executives
  for select
  using (status = 'published');
