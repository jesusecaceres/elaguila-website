-- Phase 5: permanent Leonix Ad IDs for all live classified tables (prefix-YEAR-000001).
-- Idempotent: adds columns if missing; backfills nulls; unique indexes; NOT NULL when safe; insert triggers.

-- ---------------------------------------------------------------------------
-- Counter table (atomic sequence per namespace/prefix/year)
-- ---------------------------------------------------------------------------
create table if not exists public.leonix_ad_id_counters (
  key text primary key,
  last_seq bigint not null default 0
);

comment on table public.leonix_ad_id_counters is
  'Monotonic sequence buckets for Leonix Ad IDs (e.g. listings:SALE:2026).';

create or replace function public.bump_leonix_ad_counter(p_key text)
returns bigint
language plpgsql
as $$
declare
  v bigint;
begin
  insert into public.leonix_ad_id_counters as c (key, last_seq)
  values (p_key, 1)
  on conflict (key) do update
  set last_seq = public.leonix_ad_id_counters.last_seq + 1
  returning last_seq into v;
  return v;
end;
$$;

-- Typed allocation for app/service role (optional; triggers also assign on INSERT).
create or replace function public.leonix_allocate_formatted(
  p_namespace text,
  p_prefix text,
  p_year int
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  seq bigint;
  k text;
begin
  k := format('%s:%s:%s', trim(p_namespace), trim(p_prefix), p_year::text);
  seq := public.bump_leonix_ad_counter(k);
  return format('%s-%s-%s', trim(p_prefix), p_year::text, lpad(seq::text, 6, '0'));
end;
$$;

revoke all on function public.leonix_allocate_formatted(text, text, int) from public;
grant execute on function public.leonix_allocate_formatted(text, text, int) to service_role;

revoke all on function public.bump_leonix_ad_counter(text) from public;
grant execute on function public.bump_leonix_ad_counter(text) to service_role;

-- ---------------------------------------------------------------------------
-- listings: column + prefix helper + backfill + trigger
-- ---------------------------------------------------------------------------
create or replace function public.leonix_listings_prefix(p_category text)
returns text
language sql
immutable
as $f$
  select case lower(trim(coalesce(p_category, '')))
    when 'en-venta' then 'SALE'
    when 'rentas' then 'RENT'
    when 'clases' then 'CLASS'
    when 'comunidad' then 'COMM'
    when 'travel' then 'TRVL'
    when 'viajes' then 'TRVL'
    when 'autos' then 'AUTO'
    when 'empleos' then 'JOB'
    else 'LIST'
  end;
$f$;

alter table public.listings
  add column if not exists leonix_ad_id text null;

comment on column public.listings.leonix_ad_id is
  'Stable Leonix ad code (e.g. SALE-2026-000001). Assigned on insert; immutable.';

with ordered as (
  select
    l.id,
    public.leonix_listings_prefix(l.category) as prefix,
    extract(year from coalesce(l.created_at, now() at time zone 'utc'))::int as y,
    row_number() over (
      partition by
        public.leonix_listings_prefix(l.category),
        extract(year from coalesce(l.created_at, now() at time zone 'utc'))::int
      order by coalesce(l.created_at, now() at time zone 'utc') asc, l.id asc
    ) as seq
  from public.listings l
  where l.leonix_ad_id is null or trim(l.leonix_ad_id) = ''
)
update public.listings li
set leonix_ad_id = o.prefix || '-' || o.y::text || '-' || lpad(o.seq::text, 6, '0')
from ordered o
where li.id = o.id;

create unique index if not exists listings_leonix_ad_id_uidx
  on public.listings (leonix_ad_id);

alter table public.listings
  alter column leonix_ad_id set not null;

create or replace function public.listings_leonix_ad_id_bi()
returns trigger
language plpgsql
as $fn$
declare
  p text;
  y int;
  seq bigint;
  k text;
begin
  if new.leonix_ad_id is not null and btrim(new.leonix_ad_id) <> '' then
    return new;
  end if;
  p := public.leonix_listings_prefix(new.category);
  y := extract(year from coalesce(new.created_at, now() at time zone 'utc'))::int;
  k := format('listings:%s:%s', p, y);
  seq := public.bump_leonix_ad_counter(k);
  new.leonix_ad_id := format('%s-%s-%s', p, y, lpad(seq::text, 6, '0'));
  return new;
end;
$fn$;

drop trigger if exists listings_leonix_ad_id_bi on public.listings;
create trigger listings_leonix_ad_id_bi
  before insert on public.listings
  for each row
  execute procedure public.listings_leonix_ad_id_bi();

-- ---------------------------------------------------------------------------
-- servicios_public_listings
-- ---------------------------------------------------------------------------
alter table public.servicios_public_listings
  add column if not exists leonix_ad_id text null;

comment on column public.servicios_public_listings.leonix_ad_id is
  'Stable Leonix ad code (SERV-YYYY-000001).';

with ordered as (
  select
    s.id,
    extract(year from coalesce(s.updated_at, s.published_at, now() at time zone 'utc'))::int as y,
    row_number() over (
      partition by extract(year from coalesce(s.updated_at, s.published_at, now() at time zone 'utc'))::int
      order by coalesce(s.updated_at, s.published_at) asc nulls last, s.id asc
    ) as seq
  from public.servicios_public_listings s
  where s.leonix_ad_id is null or trim(s.leonix_ad_id) = ''
)
update public.servicios_public_listings s
set leonix_ad_id = 'SERV-' || o.y::text || '-' || lpad(o.seq::text, 6, '0')
from ordered o
where s.id = o.id;

create unique index if not exists servicios_public_listings_leonix_ad_id_uidx
  on public.servicios_public_listings (leonix_ad_id);

alter table public.servicios_public_listings
  alter column leonix_ad_id set not null;

create or replace function public.servicios_leonix_ad_id_bi()
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
  y := extract(year from coalesce(new.updated_at, new.published_at, now() at time zone 'utc'))::int;
  k := format('servicios:SERV:%s', y);
  seq := public.bump_leonix_ad_counter(k);
  new.leonix_ad_id := format('SERV-%s-%s', y, lpad(seq::text, 6, '0'));
  return new;
end;
$fn$;

drop trigger if exists servicios_public_listings_leonix_ad_id_bi on public.servicios_public_listings;
create trigger servicios_public_listings_leonix_ad_id_bi
  before insert on public.servicios_public_listings
  for each row
  execute procedure public.servicios_leonix_ad_id_bi();

-- ---------------------------------------------------------------------------
-- empleos_public_listings
-- ---------------------------------------------------------------------------
alter table public.empleos_public_listings
  add column if not exists leonix_ad_id text null;

comment on column public.empleos_public_listings.leonix_ad_id is
  'Stable Leonix ad code (JOB-YYYY-000001).';

with ordered as (
  select
    e.id,
    extract(year from coalesce(e.created_at, e.updated_at, now() at time zone 'utc'))::int as y,
    row_number() over (
      partition by extract(year from coalesce(e.created_at, e.updated_at, now() at time zone 'utc'))::int
      order by coalesce(e.created_at, e.updated_at) asc nulls last, e.id asc
    ) as seq
  from public.empleos_public_listings e
  where e.leonix_ad_id is null or trim(e.leonix_ad_id) = ''
)
update public.empleos_public_listings e
set leonix_ad_id = 'JOB-' || o.y::text || '-' || lpad(o.seq::text, 6, '0')
from ordered o
where e.id = o.id;

create unique index if not exists empleos_public_listings_leonix_ad_id_uidx
  on public.empleos_public_listings (leonix_ad_id);

alter table public.empleos_public_listings
  alter column leonix_ad_id set not null;

create or replace function public.empleos_leonix_ad_id_bi()
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
  y := extract(year from coalesce(new.created_at, new.updated_at, now() at time zone 'utc'))::int;
  k := format('empleos:JOB:%s', y);
  seq := public.bump_leonix_ad_counter(k);
  new.leonix_ad_id := format('JOB-%s-%s', y, lpad(seq::text, 6, '0'));
  return new;
end;
$fn$;

drop trigger if exists empleos_public_listings_leonix_ad_id_bi on public.empleos_public_listings;
create trigger empleos_public_listings_leonix_ad_id_bi
  before insert on public.empleos_public_listings
  for each row
  execute procedure public.empleos_leonix_ad_id_bi();

-- ---------------------------------------------------------------------------
-- autos_classifieds_listings
-- ---------------------------------------------------------------------------
alter table public.autos_classifieds_listings
  add column if not exists leonix_ad_id text null;

comment on column public.autos_classifieds_listings.leonix_ad_id is
  'Stable Leonix ad code (AUTO-YYYY-000001).';

with ordered as (
  select
    a.id,
    extract(year from coalesce(a.created_at, a.updated_at, now() at time zone 'utc'))::int as y,
    row_number() over (
      partition by extract(year from coalesce(a.created_at, a.updated_at, now() at time zone 'utc'))::int
      order by coalesce(a.created_at, a.updated_at) asc nulls last, a.id asc
    ) as seq
  from public.autos_classifieds_listings a
  where a.leonix_ad_id is null or trim(a.leonix_ad_id) = ''
)
update public.autos_classifieds_listings a
set leonix_ad_id = 'AUTO-' || o.y::text || '-' || lpad(o.seq::text, 6, '0')
from ordered o
where a.id = o.id;

create unique index if not exists autos_classifieds_listings_leonix_ad_id_uidx
  on public.autos_classifieds_listings (leonix_ad_id);

alter table public.autos_classifieds_listings
  alter column leonix_ad_id set not null;

create or replace function public.autos_classifieds_leonix_ad_id_bi()
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
  y := extract(year from coalesce(new.created_at, new.updated_at, now() at time zone 'utc'))::int;
  k := format('autos:AUTO:%s', y);
  seq := public.bump_leonix_ad_counter(k);
  new.leonix_ad_id := format('AUTO-%s-%s', y, lpad(seq::text, 6, '0'));
  return new;
end;
$fn$;

drop trigger if exists autos_classifieds_listings_leonix_ad_id_bi on public.autos_classifieds_listings;
create trigger autos_classifieds_listings_leonix_ad_id_bi
  before insert on public.autos_classifieds_listings
  for each row
  execute procedure public.autos_classifieds_leonix_ad_id_bi();

-- ---------------------------------------------------------------------------
-- restaurantes_public_listings: trigger only (column + backfill already shipped)
-- ---------------------------------------------------------------------------
create or replace function public.restaurantes_leonix_ad_id_bi()
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
  k := format('restaurantes:REST:%s', y);
  seq := public.bump_leonix_ad_counter(k);
  new.leonix_ad_id := format('REST-%s-%s', y, lpad(seq::text, 6, '0'));
  return new;
end;
$fn$;

drop trigger if exists restaurantes_public_listings_leonix_ad_id_bi on public.restaurantes_public_listings;
create trigger restaurantes_public_listings_leonix_ad_id_bi
  before insert on public.restaurantes_public_listings
  for each row
  execute procedure public.restaurantes_leonix_ad_id_bi();

-- ---------------------------------------------------------------------------
-- Seed counters from existing IDs (max sequence per key) — avoids collisions after backfill
-- ---------------------------------------------------------------------------
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

insert into public.leonix_ad_id_counters (key, last_seq)
select agg.k, agg.mx
from (
  select
    'restaurantes:' || m[1] || ':' || m[2] as k,
    max(m[3]::bigint) as mx
  from public.restaurantes_public_listings,
  lateral regexp_match(leonix_ad_id, '^([A-Z]+)-([0-9]{4})-([0-9]{6})$') as m
  where m is not null
  group by 1
) agg
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);

insert into public.leonix_ad_id_counters (key, last_seq)
select agg.k, agg.mx
from (
  select
    'servicios:' || m[1] || ':' || m[2] as k,
    max(m[3]::bigint) as mx
  from public.servicios_public_listings,
  lateral regexp_match(leonix_ad_id, '^([A-Z]+)-([0-9]{4})-([0-9]{6})$') as m
  where m is not null
  group by 1
) agg
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);

insert into public.leonix_ad_id_counters (key, last_seq)
select agg.k, agg.mx
from (
  select
    'empleos:' || m[1] || ':' || m[2] as k,
    max(m[3]::bigint) as mx
  from public.empleos_public_listings,
  lateral regexp_match(leonix_ad_id, '^([A-Z]+)-([0-9]{4})-([0-9]{6})$') as m
  where m is not null
  group by 1
) agg
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);

insert into public.leonix_ad_id_counters (key, last_seq)
select agg.k, agg.mx
from (
  select
    'autos:' || m[1] || ':' || m[2] as k,
    max(m[3]::bigint) as mx
  from public.autos_classifieds_listings,
  lateral regexp_match(leonix_ad_id, '^([A-Z]+)-([0-9]{4})-([0-9]{6})$') as m
  where m is not null
  group by 1
) agg
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);
