-- Public Restaurantes listings (Clasificados category lane).
-- Writes use the service role; public read for discovery + open-card detail.

create table if not exists public.restaurantes_public_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_user_id uuid references auth.users (id) on delete set null,
  draft_listing_id text,
  status text not null default 'published'
    check (status in ('published', 'suspended')),
  package_tier text,
  leonix_verified boolean not null default false,
  promoted boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  business_name text not null,
  city_canonical text not null,
  zip_code text,
  neighborhood text,
  primary_cuisine text,
  secondary_cuisine text,
  business_type text,
  price_level text,
  service_modes jsonb not null default '[]'::jsonb,
  moving_vendor boolean not null default false,
  home_based_business boolean not null default false,
  food_truck boolean not null default false,
  pop_up boolean not null default false,
  highlights jsonb not null default '[]'::jsonb,
  summary_short text,
  hero_image_url text,
  external_rating_value double precision,
  external_review_count integer,
  listing_json jsonb not null
);

create index if not exists restaurantes_public_listings_published_at_idx
  on public.restaurantes_public_listings (published_at desc);

create index if not exists restaurantes_public_listings_city_idx
  on public.restaurantes_public_listings (city_canonical);

create index if not exists restaurantes_public_listings_promoted_idx
  on public.restaurantes_public_listings (promoted desc, published_at desc);

alter table public.restaurantes_public_listings enable row level security;

create policy "restaurantes_public_listings_select_public"
  on public.restaurantes_public_listings
  for select
  using (status = 'published');
