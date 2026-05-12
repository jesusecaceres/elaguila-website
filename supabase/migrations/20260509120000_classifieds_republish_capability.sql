-- Republish capability: ordering bump via republished_at (not legacy boost columns).

-- ---------------------------------------------------------------------------
-- listings (Rentas, En venta, Bienes raíces, Comunidad, Clases, …)
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists published_at timestamptz;

alter table public.listings
  add column if not exists republished_at timestamptz;

alter table public.listings
  add column if not exists republish_count integer not null default 0;

alter table public.listings
  add column if not exists last_republished_by uuid null references auth.users (id) on delete set null;

alter table public.listings
  add column if not exists last_republished_source text;

alter table public.listings
  add column if not exists republish_override boolean null;

comment on column public.listings.republished_at is
  'Last staff or owner republish (move to top) — preserves leonix_ad_id and public URL.';

comment on column public.listings.republish_override is
  'When true: republish allowed regardless of plan. When false: never. When null: derive from category + plan.';

-- Backfill published_at from created_at where missing (read path coalesce).
update public.listings
set published_at = coalesce(published_at, created_at)
where published_at is null;

-- Drop if re-run after manual tweak (idempotent shape).
alter table public.listings drop column if exists republish_sort_at;

alter table public.listings
  add column republish_sort_at timestamptz
  generated always as (coalesce(republished_at, published_at, created_at)) stored;

create index if not exists listings_republish_sort_at_idx
  on public.listings (republish_sort_at desc);

-- ---------------------------------------------------------------------------
-- restaurantes_public_listings
-- ---------------------------------------------------------------------------
alter table public.restaurantes_public_listings
  add column if not exists republished_at timestamptz;

alter table public.restaurantes_public_listings
  add column if not exists republish_count integer not null default 0;

alter table public.restaurantes_public_listings
  add column if not exists last_republished_by uuid null references auth.users (id) on delete set null;

alter table public.restaurantes_public_listings
  add column if not exists last_republished_source text;

alter table public.restaurantes_public_listings
  add column if not exists republish_override boolean null;

alter table public.restaurantes_public_listings drop column if exists republish_sort_at;

alter table public.restaurantes_public_listings
  add column republish_sort_at timestamptz
  generated always as (coalesce(republished_at, published_at, updated_at)) stored;

create index if not exists restaurantes_public_listings_republish_sort_at_idx
  on public.restaurantes_public_listings (republish_sort_at desc);

-- ---------------------------------------------------------------------------
-- servicios_public_listings
-- ---------------------------------------------------------------------------
alter table public.servicios_public_listings
  add column if not exists republished_at timestamptz;

alter table public.servicios_public_listings
  add column if not exists republish_count integer not null default 0;

alter table public.servicios_public_listings
  add column if not exists last_republished_by uuid null references auth.users (id) on delete set null;

alter table public.servicios_public_listings
  add column if not exists last_republished_source text;

alter table public.servicios_public_listings
  add column if not exists republish_override boolean null;

alter table public.servicios_public_listings drop column if exists republish_sort_at;

alter table public.servicios_public_listings
  add column republish_sort_at timestamptz
  generated always as (coalesce(republished_at, published_at, updated_at)) stored;

create index if not exists servicios_public_listings_republish_sort_at_idx
  on public.servicios_public_listings (republish_sort_at desc);

-- ---------------------------------------------------------------------------
-- empleos_public_listings
-- ---------------------------------------------------------------------------
alter table public.empleos_public_listings
  add column if not exists republished_at timestamptz;

alter table public.empleos_public_listings
  add column if not exists republish_count integer not null default 0;

alter table public.empleos_public_listings
  add column if not exists last_republished_by uuid null references auth.users (id) on delete set null;

alter table public.empleos_public_listings
  add column if not exists last_republished_source text;

alter table public.empleos_public_listings
  add column if not exists republish_override boolean null;

alter table public.empleos_public_listings drop column if exists republish_sort_at;

alter table public.empleos_public_listings
  add column republish_sort_at timestamptz
  generated always as (coalesce(republished_at, published_at, created_at, updated_at)) stored;

create index if not exists empleos_public_listings_republish_sort_at_idx
  on public.empleos_public_listings (republish_sort_at desc nulls last);

-- ---------------------------------------------------------------------------
-- autos_classifieds_listings
-- ---------------------------------------------------------------------------
alter table public.autos_classifieds_listings
  add column if not exists republished_at timestamptz;

alter table public.autos_classifieds_listings
  add column if not exists republish_count integer not null default 0;

alter table public.autos_classifieds_listings
  add column if not exists last_republished_by uuid null references auth.users (id) on delete set null;

alter table public.autos_classifieds_listings
  add column if not exists last_republished_source text;

alter table public.autos_classifieds_listings
  add column if not exists republish_override boolean null;

alter table public.autos_classifieds_listings drop column if exists republish_sort_at;

alter table public.autos_classifieds_listings
  add column republish_sort_at timestamptz
  generated always as (coalesce(republished_at, published_at, created_at, updated_at)) stored;

create index if not exists autos_classifieds_listings_republish_sort_at_idx
  on public.autos_classifieds_listings (republish_sort_at desc nulls last);

-- ---------------------------------------------------------------------------
-- viajes_staged_listings
-- ---------------------------------------------------------------------------
alter table public.viajes_staged_listings
  add column if not exists republished_at timestamptz;

alter table public.viajes_staged_listings
  add column if not exists republish_count integer not null default 0;

alter table public.viajes_staged_listings
  add column if not exists last_republished_by uuid null references auth.users (id) on delete set null;

alter table public.viajes_staged_listings
  add column if not exists last_republished_source text;

alter table public.viajes_staged_listings
  add column if not exists republish_override boolean null;

alter table public.viajes_staged_listings drop column if exists republish_sort_at;

alter table public.viajes_staged_listings
  add column republish_sort_at timestamptz
  generated always as (coalesce(republished_at, published_at, submitted_at, created_at, updated_at)) stored;

create index if not exists viajes_staged_listings_republish_sort_at_idx
  on public.viajes_staged_listings (republish_sort_at desc nulls last);
