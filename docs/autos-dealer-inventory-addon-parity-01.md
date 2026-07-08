# AUTOS-DEALER-INVENTORY-ADDON-PARITY-01

## Why this gate

Follows global paid-category pipeline matrix gate #2: Autos dealer child vehicle inventory was UI-only ("checkout soon") with no Revenue OS package key or entitlement truth. This gate clones the Bienes inventory-pack add-on pattern for Autos Negocio dealer parent + child vehicle inventory only.

## Before fix

- Inventory Boost panel: prepare + checkout-soon message (`autosInventoryBoostCheckoutSoonMessage`)
- No `autos_dealer_inventory_pack_monthly` in Revenue OS matrix
- No `listing_package_entitlements` unlock for dealer inventory
- Dashboard edit routes pointed at public vehicle detail, not negocio application
- Base dealer publish still native Stripe (`/api/clasificados/autos/checkout`); privado partial Revenue OS

## Files inspected

- `app/(site)/publicar/autos/negocios/**`, `AutosNegociosInventoryBoostPanel.tsx`, `autosInventoryBoostPipeline.ts`
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/lib/listingPlans/revenuePricingMatrix.ts`, `publishCheckoutCheckpoint.ts`, `revenueCategoryCheckoutPayload.ts`
- `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts` (reference)
- `app/api/clasificados/autos/listings/route.ts`, `public/dealer/[dealerInventoryGroupId]/route.ts`
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx`

## Files changed

- `app/lib/listingPlans/publishCheckoutCheckpoint.ts` — `AUTOS_DEALER_INVENTORY_PACK_*`, `REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED = true`
- `app/lib/listingPlans/revenuePricingMatrix.ts` — `autos_dealer_inventory_pack_monthly` @ 12900 cents
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts` — `AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT`
- `app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts` — new dashboard helper
- `app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft.ts` — hydration
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx` — dashboard golden loop
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx` — real checkout
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx` — entitlement gate
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx` — CTAs
- `app/(site)/dashboard/lib/dashboardInventory.ts` — listing-bound edit/preview
- `app/api/clasificados/autos/listings/route.ts` — boosted limit when entitlement active
- `app/lib/clasificados/autos/autosDealerInventoryPolicy.ts` — limit helpers
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx` — success CTA
- `scripts/verify-autos-dealer-inventory-addon-parity-01.mjs`, `scripts/smoke-autos-dealer-inventory-addon-parity-01.mjs`
- `package.json` — verify/smoke scripts

## Package/pricing decision

- **Key:** `autos_dealer_inventory_pack_monthly`
- **Price:** $129/mo (12900 cents) — sourced from `autosDealerInventoryCopy.ts` / A5.QA-03 audit (`INVENTORY_BOOST_MONTHLY_USD = 129`), not invented
- **Included:** +10 additional active vehicles (limit 10 → 20)
- Matrix unresolved note for dealer add-on superseded by product docs

## Native Stripe vs Revenue OS boundary

| Flow | Path |
|------|------|
| Autos Negocio base dealer publish | Unchanged — native `/api/clasificados/autos/checkout` |
| Autos Privado | Unchanged — Revenue OS `autos_privado_30d` where wired |
| Dealer inventory add-on (dashboard) | Revenue OS only — `autos_dealer_inventory_pack_monthly`, add-on-only, `listingId` required |

## Entitlement unlock truth

Active only when `listing_package_entitlements` row exists with:

- `listing_id` = dealer parent (main) listing id
- `package_key` = `autos_dealer_inventory_pack_monthly`
- `status` = active (not expired)

Read via `fetchAutosDealerInventoryPackEntitlementActive` → dashboard entitlement badges (`category: autos`, `listingSource: autos_classifieds_listings`).

**Not paid truth:** localStorage, draft flags, checkout started, child vehicles in draft, drawer open, returnPath alone.

## Dashboard CTA/route behavior

- Inactive: `Activar inventario +$129/mes` / `Activate inventory +$129/mo`
- Active: `Editar inventario` / `Edit inventory`
- Routes: `source=dashboard`, `mode=listing-edit|inventory-edit|inventory-addon`, `listingId`, `returnPanel=autos`, `focus=inventory-pack`

## Add-on-only checkout proof

`startAutosDealerInventoryPackCheckout` sends:

- `category: autos`
- `packageKey: autos_dealer_inventory_pack_monthly`
- `listingId` (required)
- `returnPath` → inventory editor (`mode=inventory-edit`, `focus=inventory-pack`)

Excludes: `autos_dealer_monthly`, `autos_privado_30d`, nested addOns.

## Success CTA return proof

`resolveAutosDealerInventoryPackSuccessPrimaryCta`:

- ES: `Agregar vehículos ahora`
- EN: `Add vehicles now`
- href → `/publicar/autos/negocios?...mode=inventory-edit&focus=inventory-pack&listingId=...`

## Child vehicle persistence/media truth

- Child vehicles: rows in `autos_classifieds_listings` with `inventory_role = inventory_vehicle`, grouped by `dealer_inventory_group_id`
- Hydration: `hydrateAutosDealerListingForDashboardEdit` loads parent + children via owner APIs; durable `http(s)` URLs only for public output
- Image reorder / VIN / video URL rules preserved in existing drawer/draft paths (unchanged)

## Preview/back loop

- Dashboard preview uses listing-bound query on `/clasificados/autos/negocios/preview`
- Back to edit preserves `listingId`, `mode`, `focus`, `returnPanel`

## Public output behavior

- Existing: `RelatedDealerCars`, `/api/clasificados/autos/public/dealer/[dealerInventoryGroupId]`
- Child vehicles render when stored active rows exist; no fake empty section

## Autos privado protection

- No inventory pack CTA on privado application or privado dashboard paths
- Hydration rejects `lane === "privado"`

## Protected

- Stripe webhook raw body/signature route
- Supabase migrations/schema
- Bienes / Restaurantes / Servicios runtime
- Autos privado payment flow
- Autos negocio base native Stripe publish

## Manual QA URLs

- https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=autos
- https://leonixmedia.com/clasificados/autos?lang=es
- Dealer public detail: `/clasificados/autos/vehiculo/{mainListingId}?lang=es`

### Manual QA checklist

- [ ] Dealer listing edit opens existing negocio application, not blank hub
- [ ] Dealer inventory inactive shows clear add-on CTA
- [ ] Add-on CTA opens Stripe for inventory pack only (no base dealer recharge)
- [ ] Success returns to inventory editor with `focus=inventory-pack`
- [ ] Active entitlement unlocks child vehicle editor
- [ ] Add child vehicle + images; reopen from dashboard — data holds
- [ ] Public dealer listing shows child vehicles in related shelf
- [ ] Autos privado has no inventory CTA

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| git status checked | TRUE |
| dealer parent path found | TRUE |
| child vehicle drawer/path found | TRUE |
| child storage path found | TRUE |
| package key + documented price | TRUE |
| no invented price | TRUE |
| entitlement check implemented | TRUE |
| add-on-only checkout | TRUE |
| success CTA returns to inventory editor | TRUE |
| dashboard hydration | TRUE |
| public child render preserved | TRUE |
| Autos privado protected | TRUE |
| verifier created | TRUE |
| smoke created | TRUE |
| no webhook/schema changes | TRUE |
| Bienes/Restaurantes/Servicios untouched | TRUE |

## READY TO COMMIT status

**READY TO COMMIT: YES** — pending local `npm run verify:autos-dealer-inventory-addon-parity-01`, smoke, and `npm run build` pass.
