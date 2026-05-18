-- A4.0 Autos dealer inventory verification.
-- Run in Supabase SQL Editor after applying 20260518124700_autos_dealer_inventory_grouping.sql.

with recent_autos as (
  select
    id,
    leonix_ad_id,
    owner_user_id,
    lane,
    status,
    dealer_inventory_group_id,
    dealer_inventory_parent_listing_id,
    inventory_role,
    created_at,
    updated_at,
    published_at
  from public.autos_classifieds_listings
  order by coalesce(updated_at, published_at, created_at) desc
  limit 100
),
active_negocio_counts as (
  select
    owner_user_id,
    coalesce(dealer_inventory_group_id::text, 'owner:' || owner_user_id::text) as inventory_group_key,
    count(*) filter (where lane = 'negocios' and status = 'active') as active_negocio_vehicle_count,
    count(*) filter (where lane = 'privado' and status = 'active') as active_privado_rows_not_counted
  from public.autos_classifieds_listings
  group by owner_user_id, coalesce(dealer_inventory_group_id::text, 'owner:' || owner_user_id::text)
)
select
  r.id,
  r.leonix_ad_id,
  r.status,
  (r.status = 'active') as is_active,
  (r.published_at is not null) as has_published_at,
  r.owner_user_id,
  r.lane as seller_type_discriminator,
  r.dealer_inventory_group_id,
  r.dealer_inventory_parent_listing_id,
  r.inventory_role,
  c.inventory_group_key,
  c.active_negocio_vehicle_count,
  c.active_privado_rows_not_counted,
  (c.active_negocio_vehicle_count <= 10) as within_standard_10_vehicle_limit,
  r.created_at,
  r.updated_at,
  r.published_at
from recent_autos r
left join active_negocio_counts c
  on c.owner_user_id = r.owner_user_id
 and c.inventory_group_key = coalesce(r.dealer_inventory_group_id::text, 'owner:' || r.owner_user_id::text)
order by coalesce(r.updated_at, r.published_at, r.created_at) desc;
