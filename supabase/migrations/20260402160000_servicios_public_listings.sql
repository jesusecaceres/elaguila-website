-- Transitional public Servicios listings (Clasificados publish foundation).
-- Verification is Leonix-controlled via `leonix_verified`, not advertiser-editable.

create table if not exists public.servicios_public_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  business_name text not null,
  city text not null,
  profile_json jsonb not null,
  leonix_verified boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists servicios_public_listings_published_at_idx
  on public.servicios_public_listings (published_at desc);

alter table public.servicios_public_listings enable row level security;

-- Public read for discovery pages; writes use the service role (bypasses RLS).
create policy "servicios_public_listings_select_public"
  on public.servicios_public_listings
  for select
  using (true);
