# A5.SHIP-03 — Post-publish Supabase SQL checklist

Run after Negocios QA publish to verify structured vehicle fields + inventory grouping.

## Latest rows (with structured payload fields)

```sql
select
  id,
  owner_user_id,
  lane,
  status,
  leonix_ad_id,
  dealer_inventory_group_id,
  dealer_inventory_parent_listing_id,
  inventory_role,
  listing_payload->>'vin' as vin,
  listing_payload->>'year' as year,
  listing_payload->>'make' as make,
  listing_payload->>'model' as model,
  listing_payload->>'trim' as trim,
  listing_payload->>'version' as version,
  listing_payload->>'engine' as engine,
  listing_payload->>'motor' as motor,
  listing_payload->>'bodyStyle' as body_style,
  listing_payload->>'drivetrain' as drivetrain,
  listing_payload->>'transmission' as transmission,
  listing_payload->>'fuelType' as fuel,
  listing_payload->>'doors' as doors,
  listing_payload->>'price' as price,
  listing_payload->>'mileage' as mileage,
  created_at,
  published_at
from public.autos_classifieds_listings
order by created_at desc
limit 25;
```

## Grouped dealer inventory

```sql
select
  dealer_inventory_group_id,
  count(*) as real_listing_rows,
  array_agg(id order by created_at asc) as listing_ids,
  array_agg(leonix_ad_id order by created_at asc) as leonix_ids,
  array_agg(inventory_role order by created_at asc) as roles,
  array_agg(status order by created_at asc) as statuses
from public.autos_classifieds_listings
where dealer_inventory_group_id is not null
group by dealer_inventory_group_id
order by max(created_at) desc
limit 10;
```

## Orphan additional rows (should return zero)

Production stores child role as `inventory_vehicle` (DB check constraint).

```sql
select
  id,
  leonix_ad_id,
  dealer_inventory_group_id,
  dealer_inventory_parent_listing_id,
  inventory_role,
  status,
  listing_payload->>'year' as year,
  listing_payload->>'make' as make,
  listing_payload->>'model' as model,
  listing_payload->>'engine' as engine,
  listing_payload->>'bodyStyle' as body_style
from public.autos_classifieds_listings
where inventory_role = 'inventory_vehicle'
  and dealer_inventory_parent_listing_id is null
order by created_at desc;
```
