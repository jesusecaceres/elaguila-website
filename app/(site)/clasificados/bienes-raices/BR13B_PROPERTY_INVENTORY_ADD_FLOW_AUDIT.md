# BR13B — Bienes Raices Property Inventory Add Flow + Locked Pricing

## Product decision implemented

- BR Negocio Base: **$399/month**
- Base includes up to **3** active property listings
- Property Inventory Upgrade: **$89.99/month**
- Upgrade adds up to **5** additional active properties
- Total with upgrade: up to **8** active properties
- No per-property pricing, no larger package, no Starter/Pro/Premium tiers
- More than 8: Contact Leonix

## Files added/updated (BR13B scope)

- `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts` — locked limits + count helpers
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy.ts` — ES/EN product copy
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryAddFlow.ts` — inventoryMode=add route/query helpers
- `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts` — inventory publish metadata
- `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts` — main listing group patch after insert
- `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx`
- `app/(site)/clasificados/bienes-raices/components/RelatedBrAgentProperties.tsx`
- `app/(site)/clasificados/bienes-raices/components/BrRelatedAgentPropertiesSection.tsx`
- `app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts`
- `app/(site)/clasificados/bienes-raices/lib/fetchBrOwnerInventoryListingsBrowser.ts`
- `app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` — public related section (BR Negocio only)
- `app/(site)/dashboard/mis-anuncios/page.tsx` — owner inventory card
- `app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx` — inventory metadata line
- `app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx` — inventory bits when columns present on row
- `scripts/br13b-property-inventory-qa.sql`
- `scripts/br13b-property-inventory-add-flow-audit.ts`

## Deferred

- Stripe / entitlement wiring (`isBrInventoryUpgradeActive` uses env/localStorage placeholder only)
- Full-screen drawer add flow (same-tab query-param route used: mobile-friendly full page)
- Admin queue `listingsAdminSelect` column extension (inventory bits render when row payload includes columns)
- Main-listing backfill for legacy rows without `inventory_role` (owner fallback grouping still works)

## Entitlement placeholder

- `NEXT_PUBLIC_LEONIX_BR_INVENTORY_UPGRADE=1` or `localStorage.LEONIX_BR_INVENTORY_UPGRADE=1` unlocks add-property CTA in dashboard (dev/QA only).

## One best QA SQL

```sql
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
```

## Build/check

- `npx tsx scripts/br-launch-selftest.ts` — OK
- `npm run br:13b-property-inventory-add-flow-audit` — OK
- `npm run build` — OK (after `showBrInventorySection` / `brNegocioInventoryRows` fix in `mis-anuncios/page.tsx`)

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| one upgrade package only | TRUE | Single $89.99/mo upgrade constants and copy |
| base includes 3 active properties | TRUE | `BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES = 3` |
| $399/month base copy/constant present | TRUE | `BASE_BR_NEGOCIO_MONTHLY_PRICE = 399` |
| $89.99/month upgrade copy/constant present | TRUE | `BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE = 89.99` |
| 5 additional active property upgrade limit defined | TRUE | `BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT = 5` |
| 8 total active property max with upgrade defined | TRUE | `BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT = 8` |
| no per-property pricing added | TRUE | No fee logic in policy/copy |
| no pricing tiers added | TRUE | No Starter/Pro/Premium |
| inventory_role inventory_property in implementation | TRUE | Publish + policy |
| br_inventory_group_id in implementation | TRUE | Publish + fetch helpers |
| br_inventory_parent_listing_id in implementation | TRUE | Publish + fetch helpers |
| one best QA SQL produced | TRUE | `scripts/br13b-property-inventory-qa.sql` |
| BR13B audit doc created/updated | TRUE | This file |
| Stripe/payment wiring not invented | TRUE | mailto placeholder CTA only |
| public section exists | TRUE | `BrRelatedAgentPropertiesSection` on BR live detail |
| dashboard upgrade/add CTA exists | TRUE | `BrPropertyInventoryDashboardSection` |
| npm run build completed | TRUE | `npm run build` exit 0 |
