# REVENUE-OS-BR-INVENTORY-PACK-FULFILLMENT-AND-GLOBAL-PREVIEW-SAFETY-01

## Why this gate follows Bienes global stack proof

Gate `GLOBAL-MONETIZED-CATEGORY-STACK-01-BIENES-PROOF` created the Bienes dashboard golden-loop routes, add-on checkout payload (`br_inventory_pack_monthly`), and inventory UI surfaces while **honestly blocking** Stripe activation (`REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED = false`). This gate enables fulfillment only after confirming the generic Revenue OS webhook path can create `listing_package_entitlements`, and fixes the proven Restaurante Mis anuncios preview identity bug.

## Live QA note

From **Mis anuncios → Restaurantes → Vista previa**, the route opened `/clasificados/restaurantes/preview?lang=es` and showed “Aún no hay datos del anuncio.” **Ver público** worked. Root cause: dashboard preview CTA was not listing-bound and pointed at the draft-only preview route.

## Files inspected

- `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`
- `app/lib/listingPlans/revenuePricingMatrix.ts`
- `app/lib/listingPlans/revenueEntitlementFulfillment.ts`
- `app/lib/listingPlans/revenuePaymentRecords.ts`
- `app/lib/listingPlans/revenueEntitlements.ts`
- `app/api/revenue-os/checkout/route.ts`
- `app/api/dashboard/listing-package-entitlements/route.ts`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts`
- `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts`
- `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts`
- Stripe webhook fulfillment docs/verifiers (read-only)

## Files changed

- `app/lib/listingPlans/publishCheckoutCheckpoint.ts` — enable `REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED`
- `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts` — entitlement read, pack checkout aliases, active-state helpers
- `app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx` — entitlement-gated UI + Stripe CTA
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` — dashboard inventory unlock after entitlement
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts` — hydration no longer treats `listing_json` flags as paid truth
- `app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx` — Bienes inventory pack success CTA
- `app/(site)/dashboard/lib/dashboardInventory.ts` — Restaurante listing-bound edit + public-detail preview
- `app/(site)/dashboard/lib/dashboardInventory.ts` — Restaurante listing-bound edit + public-detail preview (`restauranteDashboardListingPreviewHref`)
- `scripts/verify-bienes-inventory-golden-stack-parity-01.mjs` — updated for enabled fulfillment
- `scripts/verify-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01.mjs` (new)
- `scripts/smoke-revenue-os-br-inventory-pack-fulfillment-and-global-preview-safety-01.mjs` (new)
- `package.json` — script entries

## Revenue OS fulfillment finding

Generic `activateEntitlementsForPayment` in `revenueEntitlementFulfillment.ts` inserts `listing_package_entitlements` with `package_key`, `listing_id`, `status: active`, and links `leonix_payment_records`. No Stripe webhook raw-body/signature changes required. `br_inventory_pack_monthly` exists in `revenuePricingMatrix.ts` at **$99/mo** (`9900` cents), category `bienes-raices`, `stripeEligible: true`.

## BR inventory support flag decision

**Enabled:** `REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED = true` after entitlement read helpers were added (`fetchBienesInventoryPackEntitlementActive` via `/api/dashboard/listing-package-entitlements` → `revenuePackageKey`).

## Entitlement read / unlock truth

Inventory pack is **active** only when:

- `listing_package_entitlements` row exists for the parent listing
- `package_key = br_inventory_pack_monthly`
- `status = active` (via Revenue OS proof lookup)
- Owner session required for dashboard read

**Not** paid truth: `inventoryPackAccepted`, localStorage draft flags, checkout started, payment page visited, `listing_json.inventoryPackEnabled`.

## Checkout add-on-only proof

`BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT` uses only `br_inventory_pack_monthly` — no `br_agent_monthly`, no base `$399` recharge, `listingId` required.

## Success CTA return proof

`resolveBienesInventoryPackSuccessPrimaryCta` → `bienesInventoryEditHref` with `mode=inventory-edit`, `focus=inventory-pack`, `source=dashboard`, `listingId`, `returnPanel=bienes-raices`. Wired in `RevenueOsPagoResultView.tsx`. Fallback: Mis anuncios bienes-raices when `listingId` missing.

## Bienes dashboard / application behavior

- **Inactive:** explanation + `Activar inventario +$99/mes` starts add-on-only Stripe checkout
- **Active:** `Editar inventario` opens parent inventory editor (no Stripe)
- **Pending:** honest message after post-payment return while webhook confirms
- **Private listings:** inventory pack CTA not shown (negocio-only surfaces)
- Max **4** child properties preserved (`BR_INVENTORY_PACK_MAX_CHILDREN`)

## Global preview safety fix

Restaurante Mis anuncios `Vista previa` now uses `restauranteDashboardListingPreviewHref` → live public detail with `source=dashboard`, `preview=public`, `listingId`, `leonixAdId`. Edit href uses `restauranteListingEditHref`. Servicios/Bienes preview hrefs remain listing-bound (`preview=listing` + identity).

## What was protected

- Stripe webhook raw-body/signature verification untouched
- No Supabase migrations changed
- Restaurante coupon golden loop helpers preserved
- Servicios golden loop preserved
- Autos dealer, Ofertas, Clases runtime untouched
- No fake client-side inventory activation

## Smoke strategy

Source-level smoke validates checkout payload, success CTA routing, entitlement helpers, and Restaurante preview route safety. Browser Stripe/webhook E2E remains manual QA.

## Manual QA URLs

1. **Bienes Mis anuncios:** https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=bienes-raices  
   - Editar anuncio → inventory section → inactive shows +$99/mo → Stripe $99 only → success returns to inventory editor → unlock only after active entitlement

2. **Restaurante Mis anuncios:** https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=restaurantes  
   - Vista previa no longer empty draft preview; Ver público + Editar cupones still work

3. **Servicios regression:** https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios  
   - Editar anuncio / preview / volver a editar loop holds

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| git status checked | TRUE |
| Revenue OS path inspected | TRUE |
| BR support enabled safely | TRUE |
| BR checkout uses br_inventory_pack_monthly only | TRUE |
| BR checkout excludes br_agent_monthly | TRUE |
| webhook raw-body/signature untouched | TRUE |
| generic entitlement path reused | TRUE |
| active inventory uses real entitlement | TRUE |
| no fake activation | TRUE |
| success CTA returns to inventory editor | TRUE |
| child inventory max 4 preserved | TRUE |
| child public render path preserved | TRUE |
| Restaurante Vista previa empty-state bug fixed | TRUE |
| Restaurante Ver público preserved | TRUE |
| Restaurante Editar cupones preserved | TRUE |
| Servicios golden loop preserved | TRUE |
| verifier created | TRUE |
| smoke created | TRUE |
| doc created | TRUE |
| manual URLs included | TRUE |

## READY TO COMMIT status

READY TO COMMIT: YES
