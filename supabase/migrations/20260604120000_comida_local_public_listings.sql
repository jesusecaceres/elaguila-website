-- Comida Local public listings (Clasificados food-vendor lane).
-- FOOD-L5B: table + RLS + Leonix ID trigger. No seed rows.

create table if not exists public.comida_local_public_listings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete set null,
  draft_listing_id text,
  leonix_ad_id text,
  slug text not null,
  status text not null default 'published'
    check (status in ('draft', 'published', 'paused', 'suspended', 'pending_payment')),
  package_tier text not null default 'basic'
    check (package_tier in ('basic', 'plus')),
  payment_status text not null default 'not_required_for_l5b',
  expires_at timestamptz,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  business_name text not null,
  food_type text not null,
  food_type_custom text,
  city_canonical text,
  city_display text not null,
  zone_note text,
  que_vendes text not null,
  phone text,
  whatsapp text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  location_note text,
  location_url text,
  availability_note text,
  service_options jsonb not null default '[]'::jsonb,
  payment_methods jsonb not null default '[]'::jsonb,
  payment_other_note text,
  price_level text,
  languages jsonb not null default '[]'::jsonb,
  main_photo jsonb,
  logo_image jsonb,
  gallery_images jsonb not null default '[]'::jsonb,
  listing_json jsonb not null default '{}'::jsonb
);

comment on table public.comida_local_public_listings is
  'Published Comida Local vendor listings (street food, pop-ups, mobile sellers).';

comment on column public.comida_local_public_listings.leonix_ad_id is
  'Stable public Leonix ad code (COMIDA-YYYY-000001). Unique; assigned on insert.';

comment on column public.comida_local_public_listings.payment_status is
  'Payment lifecycle; FOOD-L5B uses not_required_for_l5b until Stripe (FOOD-L5D).';

create unique index if not exists comida_local_public_listings_slug_uidx
  on public.comida_local_public_listings (slug);

create unique index if not exists comida_local_public_listings_leonix_ad_id_uidx
  on public.comida_local_public_listings (leonix_ad_id)
  where leonix_ad_id is not null and btrim(leonix_ad_id) <> '';

create unique index if not exists comida_local_public_listings_draft_listing_id_uidx
  on public.comida_local_public_listings (draft_listing_id)
  where draft_listing_id is not null and btrim(draft_listing_id) <> '';

create index if not exists comida_local_public_listings_status_idx
  on public.comida_local_public_listings (status);

create index if not exists comida_local_public_listings_owner_user_id_idx
  on public.comida_local_public_listings (owner_user_id);

create index if not exists comida_local_public_listings_city_canonical_idx
  on public.comida_local_public_listings (city_canonical);

create index if not exists comida_local_public_listings_city_display_idx
  on public.comida_local_public_listings (city_display);

create index if not exists comida_local_public_listings_food_type_idx
  on public.comida_local_public_listings (food_type);

create index if not exists comida_local_public_listings_published_at_idx
  on public.comida_local_public_listings (published_at desc);

create index if not exists comida_local_public_listings_package_tier_idx
  on public.comida_local_public_listings (package_tier);

create index if not exists comida_local_public_listings_payment_status_idx
  on public.comida_local_public_listings (payment_status);

alter table public.comida_local_public_listings enable row level security;

create policy "comida_local_public_listings_select_public"
  on public.comida_local_public_listings
  for select
  using (status = 'published');

create policy "comida_local_public_listings_select_owner"
  on public.comida_local_public_listings
  for select
  to authenticated
  using (owner_user_id is not null and owner_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Leonix ID: COMIDA-YYYY-000001 (counter key comida_local:COMIDA:YYYY)
-- ---------------------------------------------------------------------------
create or replace function public.comida_local_leonix_ad_id_bi()
returns trigger
language plpgsql
as $fn$
declare
  y int;
  seq bigint;
  k text;
begin
  if new.leonix_ad_id is not null and btrim(new.leonix_ad_id) <> '' then
    return new;
  end if;
  y := extract(year from coalesce(new.published_at, new.updated_at, now() at time zone 'utc'))::int;
  k := format('comida_local:COMIDA:%s', y);
  seq := public.bump_leonix_ad_counter(k);
  new.leonix_ad_id := format('COMIDA-%s-%s', y, lpad(seq::text, 6, '0'));
  return new;
end;
$fn$;

drop trigger if exists comida_local_public_listings_leonix_ad_id_bi on public.comida_local_public_listings;
create trigger comida_local_public_listings_leonix_ad_id_bi
  before insert on public.comida_local_public_listings
  for each row
  execute procedure public.comida_local_leonix_ad_id_bi();
