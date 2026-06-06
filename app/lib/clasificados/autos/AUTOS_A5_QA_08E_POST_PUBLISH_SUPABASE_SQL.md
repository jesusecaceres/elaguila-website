# A5.QA-08E — Post-Publish Supabase Verification SQL

**Gate:** A5.QA-08E — Autos Negocios Publish Mapper Writes Inventory Group Fields

Run in **Supabase Dashboard → SQL Editor** on the project matching `NEXT_PUBLIC_SUPABASE_URL` (staging first, then production after proof).

**Safe SELECT only** — no destructive DDL in this file.

**Role note:** Draft/API uses `inventoryRole: "additional"`; DB column `inventory_role` stores `inventory_vehicle` (check constraint). Main anchor rows use `main`.

---

## 1. Recent listings (all lanes)

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
  listing_payload->>'year' as year,
  listing_payload->>'make' as make,
  listing_payload->>'model' as model,
  listing_payload->>'trim' as trim,
  listing_payload->>'version' as version,
  listing_payload->>'price' as price,
  listing_payload->>'mileage' as mileage,
  listing_payload->>'city' as city,
  listing_payload->>'state' as state,
  created_at,
  published_at
from public.autos_classifieds_listings
order by created_at desc
limit 25;
```

---

## 2. Grouped dealer inventory (expect ≥1 group after Negocios bundle QA publish)

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

**Expected after 3-vehicle QA bundle:**

- `real_listing_rows = 3`
- `roles` includes one `main` and two `inventory_vehicle`
- All `statuses` = `active` for live public listings
- Shared `dealer_inventory_group_id`

---

## 3. Orphan additional rows (should return 0 rows)

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
  listing_payload->>'model' as model
from public.autos_classifieds_listings
where inventory_role = 'inventory_vehicle'
  and dealer_inventory_parent_listing_id is null
order by created_at desc;
```

---

## 4. Active Negocios with grouping fields populated

```sql
select
  id,
  leonix_ad_id,
  status,
  dealer_inventory_group_id,
  dealer_inventory_parent_listing_id,
  inventory_role,
  published_at
from public.autos_classifieds_listings
where lane = 'negocios'
  and status = 'active'
order by published_at desc nulls last
limit 20;
```

**Expected:** Active Negocios main rows have `inventory_role = main` and non-null `dealer_inventory_group_id`.

---

## 5. Column existence (one-time schema check)

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'autos_classifieds_listings'
  and column_name in (
    'owner_user_id',
    'dealer_inventory_group_id',
    'dealer_inventory_parent_listing_id',
    'inventory_role',
    'listing_payload',
    'leonix_ad_id'
  )
order by column_name;
```

---

## 6. Detail route note

Public detail uses listing UUID (no slug column):

`/clasificados/autos/vehiculo/{id}?lang=es`

Leonix Ad ID is display-only; routing uses `id`.
