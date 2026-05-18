# A4.0 — Autos Dealer Inventory Backend Migration and SQL Contract

## 1. Files inspected

- `app/lib/clasificados/autos/AUTOS_A4_DEALER_INVENTORY_GALLERY_AUDIT.md`
- `scripts/autos-a4-dealer-inventory-gallery-audit.ts`
- `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts`
- `app/lib/clasificados/autos/autosClassifiedsTypes.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/lib/mapAutosPublicListingToAutoDealer.ts`
- `app/api/clasificados/autos/listings/route.ts`
- `app/api/clasificados/autos/public/listings/route.ts`
- `app/api/clasificados/autos/public/listings/[id]/route.ts`
- `app/api/clasificados/autos/checkout/route.ts`
- `app/api/clasificados/autos/checkout/verify/route.ts`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx` (inspected only)
- `supabase/migrations/20260409120000_autos_classifieds_listings.sql`
- `supabase/migrations/20260509120000_classifieds_republish_capability.sql`
- `package.json`

## 2. Real Autos listings table found

The real Autos listings table is `public.autos_classifieds_listings`.

Columns already present before A4.0:

- `id uuid primary key`
- `owner_user_id uuid not null`
- `lane text` with `negocios` / `privado`
- `status text` with `draft`, `pending_payment`, `active`, `payment_failed`, `cancelled`, `removed`
- `lang text`
- `featured boolean`
- `listing_payload jsonb`
- `stripe_checkout_session_id text`
- `stripe_payment_intent_id text`
- `published_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`
- `leonix_ad_id text` from the shared Leonix ID migration
- republish columns including `republish_sort_at` from later migrations

## 3. Existing A4 foundation summary

A4 already created a real-listing gallery and a 10-active-vehicle policy:

- Public related dealer cards are built from active `autos_classifieds_listings` rows.
- Each related card links to its own `/clasificados/autos/vehiculo/[id]` detail URL.
- The current grouping fallback is `owner_user_id`.
- `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10`.
- Privado rows are excluded by `lane === "negocios"` checks.
- Checkout and activation paths block the 11th active Negocio vehicle at the app layer.

## 4. Data model decision

SQL needed: TRUE.

Chosen model: add real nullable grouping columns to `public.autos_classifieds_listings`:

- `dealer_inventory_group_id uuid null`
- `dealer_inventory_parent_listing_id uuid null`
- `inventory_role text null`

This preserves the real listing-per-vehicle model. The new metadata only groups real listing rows; it does not create nested inventory inside one ad.

Fallback rule: prefer `dealer_inventory_group_id`; if missing, use owner fallback (`owner:{owner_user_id}`) so existing rows keep working.

## 5. Migration file path and summary

Migration:

- `supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql`

Summary:

- Adds the three nullable inventory grouping columns.
- Adds an idempotent role check constraint for `main` / `inventory_vehicle`.
- Adds an idempotent nullable FK from `dealer_inventory_parent_listing_id` to `autos_classifieds_listings(id)`.
- Adds indexes for group id, parent id, role, and dealer active count shape.
- Adds comments.
- Does not drop, delete, truncate, rewrite, or execute data changes.

## 6. Columns added or equivalent existing fields

New columns:

- `dealer_inventory_group_id`
- `dealer_inventory_parent_listing_id`
- `inventory_role`

Existing fallback fields:

- `owner_user_id` for dealer grouping fallback
- `lane` for Negocio vs Privado
- `status` and `published_at` for active/public lifecycle
- `id` and `leonix_ad_id` for stable row/detail identity

## 7. Active 10-vehicle limit implications

The limit remains a flat Standard package rule: 10 active Negocio vehicles total. A4.0 does not add dealer tiers or per-car fee logic.

Helpers now support grouping-key resolution while preserving the existing active count behavior:

- `resolveDealerInventoryGroupingKey(row)` returns the new group id when present, otherwise owner fallback.
- `countActiveDealerInventoryVehicles(...)` counts active Negocio rows and excludes Privado.
- Existing `countActiveDealerVehicles(...)` remains intact for current checkout/activation guards.

## 8. Privado impact check

Privado remains unaffected:

- New columns are nullable.
- Helper grouping returns `null` for non-Negocio rows.
- Count helpers require `lane === "negocios"`.
- No Privado publish, payment, or UI logic was changed.

## 9. Verification SQL

```sql
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
```

## 10. Build/check result

- `npm run autos:a4-dealer-inventory-audit`: passed. The audit reported and ignored unrelated active En Venta dirty files.
- `npm run autos:a4-0-inventory-sql-audit`: passed.
- `npm run build`: passed.

## 11. Remaining risks

- The migration must be reviewed and applied in Supabase before A4.1 uses the new columns.
- Limit enforcement remains application-level; a DB trigger/constraint for concurrent payment races is intentionally not added in A4.0.
- A4.1 still needs the drawer/add-flow and a way to set `inventory_role`, parent id, and group id from UX.

## 12. Next gate

A4.1 Dealer Inventory Add Flow:

- drawer / slide-over add flow
- add vehicle CTA
- inventory add mode
- dashboard/admin grouped inventory UI
- full inventory page or CTA

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Real Autos listings table identified | TRUE | `public.autos_classifieds_listings`. |
| id column identified | TRUE | `id uuid primary key`. |
| leonix_ad_id column identified | TRUE | `leonix_ad_id` added by Leonix ID migration and mapped in service. |
| dealer/owner identity column identified | TRUE | `owner_user_id`. |
| status/active fields identified | TRUE | `status`, `published_at`; public active rows use `status = 'active'`. |
| Negocio vs Privado discriminator identified | TRUE | `lane` with `negocios` / `privado`. |
| Current 10 active vehicle limit query identified | TRUE | `countActiveDealerVehicles` over owner rows and checkout/activation guards. |
| Data model decision made | TRUE | Add nullable group/parent/role columns. |
| Real listing-per-vehicle model preserved | TRUE | Columns live on the real listing table; no child table or nested inventory. |
| Existing listings remain backward compatible | TRUE | Nullable columns and owner fallback. |
| SQL migration created if needed | TRUE | `20260518124700_autos_dealer_inventory_grouping.sql`. |
| SQL uses real Autos table name | TRUE | Migration targets `public.autos_classifieds_listings`. |
| SQL is additive | TRUE | Adds columns, constraints, comments, indexes only. |
| SQL supports group/parent/role | TRUE | Adds `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role`. |
| SQL was not executed | TRUE | Migration file only. |
| Autos types/helpers updated if needed | TRUE | Types and policy helpers updated. |
| Privado unaffected | TRUE | Helpers exclude non-Negocio rows; columns nullable. |
| No dealer tiers added | TRUE | No Starter/Pro/Premium policy logic. |
| No per-car fee logic added | TRUE | No per-car pricing or fee code added. |
| No fake nested inventory added | TRUE | Each vehicle remains a row in `autos_classifieds_listings`. |
| One best verification SQL produced | TRUE | `scripts/autos-a4-0-dealer-inventory-verification.sql` and SQL above. |
| No unrelated categories touched | TRUE | Autos/backend/migration/package audit only. |
| npm run build passed or failure clearly attributed | TRUE | `npm run build` passed. |
| No files staged | TRUE | No staging performed. |
| No commit created | TRUE | No commit performed. |
| No push attempted | TRUE | No push performed. |
