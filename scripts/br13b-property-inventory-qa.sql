-- BR13B QA SQL — run after publishing a main BR Negocio listing and one inventory_property child.

with br_negocio as (
  select
    l.id,
    l.leonix_ad_id,
    l.title,
    l.status,
    l.is_published,
    l.owner_id,
    l.seller_type,
    l.br_inventory_group_id,
    l.br_inventory_parent_listing_id,
    l.inventory_role,
    l.created_at,
    l.published_at
  from public.listings l
  where l.category = 'bienes-raices'
    and l.seller_type = 'business'
),
group_counts as (
  select
    coalesce(br_inventory_group_id::text, 'owner:' || owner_id::text) as inventory_count_key,
    count(*) filter (where status = 'active' and is_published is true) as active_negocio_property_count,
    count(*) filter (
      where status = 'active'
        and is_published is true
        and inventory_role = 'inventory_property'
    ) as active_inventory_property_count,
    count(*) filter (
      where status = 'active'
        and is_published is true
        and inventory_role = 'main'
    ) as active_main_count
  from br_negocio
  group by coalesce(br_inventory_group_id::text, 'owner:' || owner_id::text)
)
select
  b.id,
  b.leonix_ad_id,
  b.title,
  b.status,
  b.is_published,
  b.inventory_role,
  b.br_inventory_group_id,
  b.br_inventory_parent_listing_id,
  g.active_negocio_property_count,
  g.active_main_count,
  g.active_inventory_property_count,
  least(g.active_negocio_property_count, 3) as base_slots_used_of_3,
  greatest(0, least(g.active_negocio_property_count - 3, 5)) as upgrade_slots_used_of_5,
  3 as base_included_active_properties,
  8 as total_max_with_upgrade,
  (select count(*) from public.listings p where p.category = 'bienes-raices' and p.seller_type = 'personal') as privado_rows_not_counted
from br_negocio b
left join group_counts g
  on g.inventory_count_key = coalesce(b.br_inventory_group_id::text, 'owner:' || b.owner_id::text)
order by coalesce(b.published_at, b.created_at) desc nulls last
limit 30;
