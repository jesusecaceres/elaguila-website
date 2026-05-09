-- Viajes staged listings: permanent Leonix Ad ID (TRAV-YYYY-000001).
-- Align `listings` prefix helper with app: TRAV (not TRVL) for travel/viajes; COM (not COMM) for comunidad.

create or replace function public.leonix_listings_prefix(p_category text)
returns text
language sql
immutable
as $f$
  select case lower(trim(coalesce(p_category, '')))
    when 'en-venta' then 'SALE'
    when 'rentas' then 'RENT'
    when 'clases' then 'CLASS'
    when 'comunidad' then 'COM'
    when 'travel' then 'TRAV'
    when 'viajes' then 'TRAV'
    when 'autos' then 'AUTO'
    when 'empleos' then 'JOB'
    else 'LIST'
  end;
$f$;

comment on function public.leonix_listings_prefix(text) is
  'Maps listings.category to Leonix ad prefix (TRAV for travel/viajes; COM for comunidad; etc.).';

-- ---------------------------------------------------------------------------
-- viajes_staged_listings
-- ---------------------------------------------------------------------------
alter table public.viajes_staged_listings
  add column if not exists leonix_ad_id text null;

comment on column public.viajes_staged_listings.leonix_ad_id is
  'Stable Leonix ad code (e.g. TRAV-2026-000001). Assigned when lifecycle_status=approved and is_public=true.';

-- Backfill published Viajes offers only (approved + public); drafts keep null until approval trigger runs.
with ordered as (
  select
    v.id,
    extract(year from coalesce(v.published_at, v.updated_at, v.created_at, now() at time zone 'utc'))::int as y,
    row_number() over (
      partition by extract(year from coalesce(v.published_at, v.updated_at, v.created_at, now() at time zone 'utc'))::int
      order by v.published_at asc nulls last, v.updated_at asc nulls last, v.id asc
    ) as seq
  from public.viajes_staged_listings v
  where (v.leonix_ad_id is null or trim(v.leonix_ad_id) = '')
    and v.lifecycle_status = 'approved'
    and v.is_public is true
)
update public.viajes_staged_listings v
set leonix_ad_id = 'TRAV-' || o.y::text || '-' || lpad(o.seq::text, 6, '0')
from ordered o
where v.id = o.id;

create unique index if not exists viajes_staged_listings_leonix_ad_id_uidx
  on public.viajes_staged_listings (leonix_ad_id)
  where leonix_ad_id is not null and trim(leonix_ad_id) <> '';

-- Do not force NOT NULL: drafts may legitimately omit until approved+public.

create or replace function public.viajes_staged_listings_leonix_ad_id_biu()
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
  if new.lifecycle_status = 'approved' and new.is_public is true then
    y := extract(year from coalesce(new.published_at, new.updated_at, now() at time zone 'utc'))::int;
    k := format('viajes:TRAV:%s', y);
    seq := public.bump_leonix_ad_counter(k);
    new.leonix_ad_id := format('TRAV-%s-%s', y, lpad(seq::text, 6, '0'));
  end if;
  return new;
end;
$fn$;

drop trigger if exists viajes_staged_listings_leonix_ad_id_biu on public.viajes_staged_listings;
create trigger viajes_staged_listings_leonix_ad_id_biu
  before insert or update on public.viajes_staged_listings
  for each row
  execute procedure public.viajes_staged_listings_leonix_ad_id_biu();

insert into public.leonix_ad_id_counters (key, last_seq)
select agg.k, agg.mx
from (
  select
    'viajes:' || m[1] || ':' || m[2] as k,
    max(m[3]::bigint) as mx
  from public.viajes_staged_listings,
  lateral regexp_match(leonix_ad_id, '^([A-Z]+)-([0-9]{4})-([0-9]{6})$') as m
  where m is not null
  group by 1
) agg
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);

-- ---------------------------------------------------------------------------
-- Listings: canonicalize legacy COMM / TRVL prefixes → COM / TRAV
-- ---------------------------------------------------------------------------
update public.listings l
set leonix_ad_id = regexp_replace(l.leonix_ad_id, '^COMM-', 'COM-')
where l.leonix_ad_id ~ '^COMM-'
  and lower(trim(l.category)) = 'comunidad';

update public.listings l
set leonix_ad_id = regexp_replace(l.leonix_ad_id, '^TRVL-', 'TRAV-')
where l.leonix_ad_id ~ '^TRVL-'
  and lower(trim(l.category)) in ('travel', 'viajes');

-- Re-key counter buckets so new inserts use COM/TRAV sequences (not parallel COMM/TRVL keys).
insert into public.leonix_ad_id_counters (key, last_seq)
select regexp_replace(c.key, '^listings:COMM:', 'listings:COM:'), c.last_seq
from public.leonix_ad_id_counters c
where c.key like 'listings:COMM:%'
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);

delete from public.leonix_ad_id_counters where key like 'listings:COMM:%';

insert into public.leonix_ad_id_counters (key, last_seq)
select regexp_replace(c.key, '^listings:TRVL:', 'listings:TRAV:'), c.last_seq
from public.leonix_ad_id_counters c
where c.key like 'listings:TRVL:%'
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);

delete from public.leonix_ad_id_counters where key like 'listings:TRVL:%';

insert into public.leonix_ad_id_counters (key, last_seq)
select agg.k, agg.mx
from (
  select
    'listings:' || m[1] || ':' || m[2] as k,
    max(m[3]::bigint) as mx
  from public.listings,
  lateral regexp_match(leonix_ad_id, '^([A-Z]+)-([0-9]{4})-([0-9]{6})$') as m
  where m is not null
  group by 1
) agg
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);

-- Assign leonix_ad_id on UPDATE when legacy rows still have null (INSERT trigger only in baseline migration).
drop trigger if exists listings_leonix_ad_id_bu on public.listings;
create trigger listings_leonix_ad_id_bu
  before update on public.listings
  for each row
  when (new.leonix_ad_id is null or trim(new.leonix_ad_id) = '')
  execute procedure public.listings_leonix_ad_id_bi();

drop trigger if exists servicios_public_listings_leonix_ad_id_bu on public.servicios_public_listings;
create trigger servicios_public_listings_leonix_ad_id_bu
  before update on public.servicios_public_listings
  for each row
  when (new.leonix_ad_id is null or trim(new.leonix_ad_id) = '')
  execute procedure public.servicios_leonix_ad_id_bi();

drop trigger if exists empleos_public_listings_leonix_ad_id_bu on public.empleos_public_listings;
create trigger empleos_public_listings_leonix_ad_id_bu
  before update on public.empleos_public_listings
  for each row
  when (new.leonix_ad_id is null or trim(new.leonix_ad_id) = '')
  execute procedure public.empleos_leonix_ad_id_bi();

drop trigger if exists autos_classifieds_listings_leonix_ad_id_bu on public.autos_classifieds_listings;
create trigger autos_classifieds_listings_leonix_ad_id_bu
  before update on public.autos_classifieds_listings
  for each row
  when (new.leonix_ad_id is null or trim(new.leonix_ad_id) = '')
  execute procedure public.autos_classifieds_leonix_ad_id_bi();
