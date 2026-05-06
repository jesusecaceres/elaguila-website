-- Permanent public Leonix ad reference for Restaurantes (`restaurantes_public_listings`).
-- Format: REST-YYYY-000001 (six-digit sequence per calendar year).

alter table public.restaurantes_public_listings
  add column if not exists leonix_ad_id text null;

comment on column public.restaurantes_public_listings.leonix_ad_id is
  'Stable public-facing Leonix ad code (e.g. REST-2026-000001). Unique; assigned on first insert.';

-- Backfill rows missing leonix_ad_id (ordered like production manual fix).
with ordered as (
  select
    id,
    extract(year from coalesce(published_at, updated_at, now() at time zone 'utc'))::int as y,
    row_number() over (
      partition by extract(year from coalesce(published_at, updated_at, now() at time zone 'utc'))::int
      order by published_at asc nulls last, updated_at asc nulls last, id asc
    ) as seq
  from public.restaurantes_public_listings
  where leonix_ad_id is null or trim(leonix_ad_id) = ''
)
update public.restaurantes_public_listings r
set leonix_ad_id = 'REST-' || o.y::text || '-' || lpad(o.seq::text, 6, '0')
from ordered o
where r.id = o.id;

create unique index if not exists restaurantes_public_listings_leonix_ad_id_uidx
  on public.restaurantes_public_listings (leonix_ad_id);

alter table public.restaurantes_public_listings
  alter column leonix_ad_id set not null;
