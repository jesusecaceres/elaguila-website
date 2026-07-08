# AUTOS-DEALER-INVENTORY-ADDON-LIVE-PARITY-02

Task classification: **SCOPED GATED BUILD** — Autos Dealer inventory add-on completion / proof / regression fix.

Follows `AUTOS-DEALER-INVENTORY-ADDON-PARITY-01` and the global paid-category Revenue OS checklist. This gate inspected the existing parity-01 work, confirmed what is real, closed the remaining live gaps, and proved the stack.

## What already existed from parity-01

- `autos_dealer_inventory_pack_monthly` package key + `REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED = true` (`publishCheckoutCheckpoint.ts`).
- Matrix entry at `12900` cents ($129/mo), `stripeEligible`, `billingMode: monthly_subscription` (`revenuePricingMatrix.ts`).
- Dashboard add-on-only checkout payload `AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT` (`revenueCategoryCheckoutPayload.ts`).
- Dashboard helper `autosDashboardInventoryAddonCheckout.ts` — listing-bound edit/inventory/add-on/preview HREFs, real entitlement read via `listing_package_entitlements`, add-on-only `startRevenueCategoryCheckout`.
- Hydration mapper `autosPublishedToDealerApplicationDraft.ts` — parent + child inventory hydration with durable URLs.
- Boost panel wired to real checkout (no "checkout soon").
- Public dealer child render via `RelatedDealerCars` / `AutosDealerInventoryVehicleCard` fed by `listActiveDealerInventoryByGroupId`.
- Success CTA resolver in `RevenueOsPagoResultView.tsx`.
- Autos privado application carries no inventory-pack references.

## What was completed / fixed in parity-02

1. **Server-side dealer ownership + lane guard (new).** `validateAutosDealerInventoryAddonOwnership` in `revenueCheckout.ts`, invoked in `/api/revenue-os/checkout` for `autos` + `autos_dealer_inventory_pack_monthly`. Enforces: authenticated bearer, listing exists, `owner_user_id` match, `lane === "negocios"` (privado rejected `422 listing_not_dealer`), `status === "active"`. Previously the generic checkout had no autos owner/lane gate — a privado listingId could have been submitted.
2. **Success CTA wording** changed to ES `Administrar inventario` / EN `Manage inventory` (Gate 8), still returning to the listing-bound inventory editor.
3. Verifier + smoke + doc added; package scripts registered.

## Package/pricing truth

- Key: `autos_dealer_inventory_pack_monthly`
- Price: **$129/month** = `AUTOS_DEALER_INVENTORY_PACK_PRICE_CENTS = 12900`
- Billing: `monthly_subscription`, `stripeEligible: true`, category `autos`, `customerType: dealer_business`
- Dashboard upgrade includes **only** the add-on package — never `autos_dealer_monthly` (base) and never any privado package.

## Native Stripe vs Revenue OS boundary

Base Autos payment flows are untouched. The dealer inventory add-on rides the shared Revenue OS checkout (`/api/revenue-os/checkout` → pending payment record → Stripe → webhook → `activateEntitlementsForPayment` writes `listing_package_entitlements`). No second base checkout, no Stripe session created client-side, no webhook raw-body/signature change.

## Entitlement unlock truth

- Unlock reads `listing_package_entitlements` (via `fetchDashboardListingPackageEntitlementBadges`), matched on `package_key = autos_dealer_inventory_pack_monthly` and the listing.
- `isAutosDealerInventoryPackEntitlementActiveFromProof` derives active state from server proof only.
- Local drafts, started-but-unpaid checkouts, and base-package proofs do **not** unlock inventory.

## Dashboard success routing

After paid success, `resolveAutosDealerInventoryPackSuccessPrimaryCta` returns a CTA (`Administrar inventario` / `Manage inventory`) that routes to `autosDealerInventoryEditHref` — `mode=inventory-edit`, `focus=inventory-pack`, `source=dashboard`, `returnPanel=autos`, `listingId` (+`leonixAdId`). Cancel returns to the same listing-bound editor with the add-on inactive; user can retry.

## Child vehicle data/images persistence

Child vehicles save under the dealer parent listing. Hydration mapper enforces durable `http(s)` URLs for images/media in public payload — no blob/data/IndexedDB refs. Preview / Volver a editar preserve parent + child context via listing-bound params.

## Public render status

Public dealer detail renders child inventory through `listActiveDealerInventoryByGroupId` → `RelatedDealerCars`. Mobile-first shelf cards with `Ver detalle` CTA. No empty broken section when there is no inventory.

## Autos privado protection

- No inventory add-on CTA/module in privado application (`AutosPrivadoApplication.tsx`).
- Privado lane rejected server-side (`validateAutosDealerInventoryAddonOwnership` → `listing_not_dealer`).
- No `autos_dealer_inventory_pack_monthly` checkout for privado; "more private cars = new ad" rule unchanged.

## What was protected

Restaurantes / Servicios / Bienes runtime and success paths, Ofertas / Clases / Rentas / Empleos / En Venta, Stripe webhook raw body/signature, Supabase migrations (none changed), Autos privado flow.

## Manual QA URLs

- https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=autos
- https://leonixmedia.com/clasificados/autos?lang=es
- Autos dealer public detail (dealer inventory group) discovered by code

## Commands run

- `npm run verify:autos-dealer-inventory-addon-live-parity-02`
- `npm run smoke:autos-dealer-inventory-addon-live-parity-02`
- `npm run verify:autos-dealer-inventory-addon-parity-01`
- `npm run build`

## TRUE/FALSE audit

See final report in chat.

## READY TO COMMIT

READY TO COMMIT: YES
