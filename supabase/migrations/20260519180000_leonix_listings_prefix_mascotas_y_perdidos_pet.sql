-- Append `mascotas-y-perdidos` → PET to `leonix_listings_prefix` (must run after 20260508160000).

create or replace function public.leonix_listings_prefix(p_category text)
returns text
language sql
immutable
as $f$
  select case lower(trim(coalesce(p_category, '')))
    when 'en-venta' then 'SALE'
    when 'rentas' then 'RENT'
    when 'bienes-raices' then 'BR'
    when 'clases' then 'CLASS'
    when 'comunidad' then 'COM'
    when 'mascotas-y-perdidos' then 'PET'
    when 'travel' then 'TRAV'
    when 'viajes' then 'TRAV'
    when 'autos' then 'AUTO'
    when 'empleos' then 'JOB'
    else 'LIST'
  end;
$f$;

comment on function public.leonix_listings_prefix(text) is
  'Maps listings.category to Leonix ad prefix (PET for mascotas-y-perdidos; COM for comunidad; etc.).';

with ordered as (
  select
    l.id,
    'PET'::text as prefix,
    extract(year from coalesce(l.created_at, now() at time zone 'utc'))::int as y,
    row_number() over (
      partition by extract(year from coalesce(l.created_at, now() at time zone 'utc'))::int
      order by coalesce(l.created_at, now() at time zone 'utc') asc, l.id asc
    ) as seq
  from public.listings l
  where lower(trim(coalesce(l.category, ''))) = 'mascotas-y-perdidos'
    and (
      l.leonix_ad_id is null
      or trim(l.leonix_ad_id) = ''
      or l.leonix_ad_id ~ '^LIST-'
    )
)
update public.listings li
set leonix_ad_id = o.prefix || '-' || o.y::text || '-' || lpad(o.seq::text, 6, '0')
from ordered o
where li.id = o.id;

insert into public.leonix_ad_id_counters (key, last_seq)
select agg.k, agg.mx
from (
  select
    'listings:' || m[1] || ':' || m[2] as k,
    max(m[3]::bigint) as mx
  from public.listings,
  lateral regexp_match(leonix_ad_id, '^([A-Z]+)-([0-9]{4})-([0-9]{6})$') as m
  where lower(trim(coalesce(category, ''))) = 'mascotas-y-perdidos'
    and m is not null
  group by 1
) agg
on conflict (key) do update
set last_seq = greatest(public.leonix_ad_id_counters.last_seq, excluded.last_seq);
