# A5.QA-08D — Autos Supabase Manual Verification Checklist

**Purpose:** Safe, read-only Supabase Dashboard steps for Chuy to confirm Autos Negocios multi-inventory schema is applied and live publish creates real rows.

**Gate:** A5.QA-08D — Autos Supabase Production Verification + Live Inventory Publish Proof

---

## 1. Which Supabase project / environment

| Environment | When to use |
|---|---|
| **Staging / preview** | First pass — enable QA bypass env on Vercel preview or local with staging Supabase URL |
| **Production** | Only after staging proof; never enable QA bypass on production (`VERCEL_ENV=production` blocks bypass in code) |

**App env vars (staging/local QA publish):**

- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server publish writes)
- `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` **or** `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true`
- Must **not** be Vercel production tier

**Leonix table:** `public.autos_classifieds_listings`

---

## 2. Migration files that must be applied (repo)

Apply via Supabase Dashboard → **Database → Migrations** or SQL Editor (in order if greenfield; idempotent if already applied):

| File | Purpose |
|---|---|
| `supabase/migrations/20260409120000_autos_classifieds_listings.sql` | Base Autos listings table |
| `supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql` | `leonix_ad_id` column + trigger on `autos_classifieds_listings` |
| `supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql` | `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role` |

Optional later migrations (republish/admin — not blocking inventory proof):

- `20260508140000_classifieds_admin_ops_columns.sql`
- `20260509120000_classifieds_republish_capability.sql`

**Do not run:** `DROP TABLE`, column renames, or RLS rewrites from this checklist.

---

## 3. Column verification SQL (run first)

Paste in **Supabase Dashboard → SQL Editor → New query**. Safe `SELECT` only.

```sql
-- A5.QA-08D: verify autos_classifieds_listings inventory columns exist
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'autos_classifieds_listings'
  and column_name in (
    'id',
    'owner_user_id',
    'lane',
    'status',
    'leonix_ad_id',
    'dealer_inventory_group_id',
    'dealer_inventory_parent_listing_id',
    'inventory_role',
    'listing_payload',
    'published_at'
  )
order by column_name;
```

**Expected:** 10 rows returned. All nullable except core NOT NULL columns (`id`, `owner_user_id`, `lane`, `status`, etc.).

**Inventory role constraint check:**

```sql
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.autos_classifieds_listings'::regclass
  and conname like '%inventory%';
```

**Expected:** `autos_classifieds_listings_inventory_role_chk` allowing `main` and `inventory_vehicle`.

---

## 4. Leonix Ad ID trigger verification

```sql
select tgname, pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'public.autos_classifieds_listings'::regclass
  and not tgisinternal
  and tgname like '%leonix%';
```

**Expected:** At least one `BEFORE INSERT` trigger assigning `leonix_ad_id`.

---

## 5. After QA bundle publish — inventory row proof

Replace `:main_listing_id` with the UUID from success screen / checkout response.

```sql
-- Bundle proof for one publish (main + children)
with bundle as (
  select
    id,
    leonix_ad_id,
    owner_user_id,
    lane,
    status,
    dealer_inventory_group_id,
    dealer_inventory_parent_listing_id,
    inventory_role,
    published_at,
    listing_payload->>'dealerName' as dealer_name,
    listing_payload->>'make' as make,
    listing_payload->>'model' as model,
    listing_payload->>'year' as year,
    jsonb_array_length(coalesce(listing_payload->'mediaImages', '[]'::jsonb)) as photo_count
  from public.autos_classifieds_listings
  where id = :main_listing_id
     or dealer_inventory_group_id = (
       select dealer_inventory_group_id
       from public.autos_classifieds_listings
       where id = :main_listing_id
     )
     or dealer_inventory_parent_listing_id = :main_listing_id
)
select * from bundle
order by
  case inventory_role when 'main' then 0 when 'inventory_vehicle' then 1 else 2 end,
  published_at desc nulls last;
```

**Expected after 3-vehicle QA publish:**

| Check | Expected |
|---|---|
| Row count | 3 |
| `status` | All `active` |
| `lane` | All `negocios` |
| `leonix_ad_id` | 3 distinct non-null values (AUTO-YYYY-######) |
| `id` | 3 distinct UUIDs |
| `dealer_inventory_group_id` | Same UUID on all 3 |
| Main row | `inventory_role = 'main'`, `dealer_inventory_parent_listing_id` null |
| Child rows | `inventory_role = 'inventory_vehicle'`, `dealer_inventory_parent_listing_id = main id` |
| Dealer name | Same on all (inherited in `listing_payload`) |
| Vehicle fields | Different make/model/year per child |

---

## 6. Grouping verification SQL

```sql
-- Active Negocios inventory groups (recent)
select
  dealer_inventory_group_id,
  count(*) filter (where status = 'active' and lane = 'negocios') as active_vehicles,
  count(*) filter (where inventory_role = 'main') as main_count,
  count(*) filter (where inventory_role = 'inventory_vehicle') as child_count,
  array_agg(distinct leonix_ad_id order by leonix_ad_id) filter (where leonix_ad_id is not null) as leonix_ids,
  max(published_at) as latest_published
from public.autos_classifieds_listings
where lane = 'negocios'
  and dealer_inventory_group_id is not null
group by dealer_inventory_group_id
having count(*) filter (where status = 'active') >= 2
order by latest_published desc nulls last
limit 20;
```

---

## 7. Leonix Ad ID completeness (active Negocios)

```sql
select
  count(*) as active_negocios,
  count(*) filter (where leonix_ad_id is not null and trim(leonix_ad_id) <> '') as with_leonix_id,
  count(*) filter (where leonix_ad_id is null or trim(leonix_ad_id) = '') as missing_leonix_id
from public.autos_classifieds_listings
where lane = 'negocios' and status = 'active';
```

**Expected:** `missing_leonix_id = 0` for rows created after Leonix migration.

---

## 8. Inventory role distribution

```sql
select inventory_role, status, count(*)
from public.autos_classifieds_listings
where lane = 'negocios'
group by inventory_role, status
order by inventory_role, status;
```

---

## 9. Parent/child relationship integrity

```sql
select
  child.id as child_id,
  child.leonix_ad_id as child_leonix,
  child.inventory_role,
  child.dealer_inventory_parent_listing_id,
  parent.id as parent_id,
  parent.leonix_ad_id as parent_leonix,
  parent.inventory_role as parent_role,
  (child.dealer_inventory_group_id = parent.dealer_inventory_group_id) as same_group
from public.autos_classifieds_listings child
left join public.autos_classifieds_listings parent
  on parent.id = child.dealer_inventory_parent_listing_id
where child.lane = 'negocios'
  and child.inventory_role = 'inventory_vehicle'
order by child.created_at desc
limit 50;
```

**Expected:** `parent_role = 'main'`, `same_group = true`, parent row exists.

---

## 10. No draft-only / fake records

Published inventory must exist only as `autos_classifieds_listings` rows — not localStorage.

```sql
-- Confirm published bundle rows are real DB rows (not draft)
select id, status, published_at is not null as has_published_at
from public.autos_classifieds_listings
where lane = 'negocios'
  and status = 'active'
  and published_at is null;
```

**Expected:** 0 rows (active listings should have `published_at`).

App public API reads only `.eq('status', 'active')` from this table — no localStorage publish path.

---

## 11. RLS / read-path notes

| Actor | Read path |
|---|---|
| **Public anon** | RLS policy `autos_classifieds_listings_select_active` — `status = 'active'` only |
| **Owner authenticated** | Own rows any status via JWT |
| **Next.js API (service role)** | `getAdminSupabase()` — bypasses RLS for publish + public listing aggregation |

If public browse returns empty but SQL shows active rows:

- Check `NEXT_PUBLIC_SUPABASE_URL` matches the project you queried
- Check Vercel env has `SUPABASE_SERVICE_ROLE_KEY` for API routes
- Check listing `status = 'active'` and not `removed`

---

## 12. Full verification script (A4.0)

Also run repo file **`scripts/autos-a4-0-dealer-inventory-verification.sql`** in SQL Editor after migrations — shows recent rows + per-group active counts.

---

## 13. Screenshots to send (after QA publish)

1. **Column verification** — query §3 result (10 columns)
2. **Bundle proof** — query §5 showing 3 rows, shared group, roles, Leonix IDs
3. **Supabase Table Editor** — filter `autos_classifieds_listings` by `dealer_inventory_group_id`
4. **Success screen** — “Publicado en modo QA”, inventory count 3/10, vehicle links
5. **Browser** — Autos results showing 3 cards; one detail page with “Más vehículos de este dealer”
6. **Optional** — Network tab: `GET /api/clasificados/autos/public/listings` returns 3 IDs

---

## 14. Manual Dashboard checklist (step-by-step)

- [ ] Open [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Select **staging** project first (match `NEXT_PUBLIC_SUPABASE_URL` host)
- [ ] SQL Editor → run §3 column verification
- [ ] If columns missing → apply migrations from §2 (one file at a time; no drops)
- [ ] On staging/local: set QA bypass env (§1)
- [ ] Complete Negocios app: main vehicle + **2** added inventory vehicles
- [ ] Publish → confirm **Modo QA: pago omitido** on confirm
- [ ] Copy main `listing_id` from success URL (`listing_id=` param)
- [ ] SQL Editor → run §5 bundle proof with main UUID
- [ ] Confirm 3 active rows, shared group, distinct Leonix IDs
- [ ] Browser: `/clasificados/autos/resultados` — 3 cards
- [ ] Open each `/clasificados/autos/vehiculo/[id]` — detail loads
- [ ] Main detail shows 2 related vehicles; child detail shows main + sibling
- [ ] Public detail has **no** owner “Agregar vehículo al inventario”
- [ ] Screenshot §13 set → share for gate close to GREEN

---

## 15. If migration not yet applied

Run **only** the inventory grouping migration (safe, idempotent):

File: `supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql`

Then re-run §3. Do **not** drop or rename existing columns.

---

## 16. Detail URL note

Autos uses UUID routes, not slugs:

`/clasificados/autos/vehiculo/{listing_uuid}?lang=es`

There is no separate `slug` column on `autos_classifieds_listings`; `id` **is** the public detail key.
