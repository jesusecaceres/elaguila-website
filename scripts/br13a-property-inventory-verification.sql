-- BR13A verification SQL.
-- Run in Supabase only after applying the BR property inventory migration.

with br_negocio as (
  select
    l.id,
    l.leonix_ad_id,
    l.title,
    l.status,
    l.is_published,
    l.owner_id,
    l.business_name,
    l.seller_type,
    l.br_inventory_group_id,
    l.br_inventory_parent_listing_id,
    l.inventory_role,
    l.created_at,
    l.updated_at,
    l.published_at,
    coalesce(l.br_inventory_group_id::text, 'owner:' || l.owner_id::text) as inventory_count_key
  from public.listings l
  where l.category = 'bienes-raices'
    and (
      l.seller_type = 'business'
      or l.detail_pairs @> '[{"label":"Leonix:branch","value":"bienes_raices_negocio"}]'::jsonb
    )
),
active_counts as (
  select
    inventory_count_key,
    count(*) filter (
      where status = 'active'
        and is_published is true
    ) as active_negocio_property_count
  from br_negocio
  group by inventory_count_key
)
select
  b.id,
  b.leonix_ad_id,
  b.title,
  b.status,
  b.is_published,
  b.owner_id,
  b.business_name,
  b.seller_type,
  b.br_inventory_group_id,
  b.br_inventory_parent_listing_id,
  b.inventory_role,
  b.created_at,
  b.updated_at,
  b.published_at,
  a.active_negocio_property_count,
  5 as recommended_active_property_limit
from br_negocio b
left join active_counts a
  on a.inventory_count_key = b.inventory_count_key
order by coalesce(b.published_at, b.updated_at, b.created_at) desc nulls last
limit 50;
