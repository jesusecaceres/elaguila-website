# BIENES-INVENTORY-GOLDEN-STACK-PARITY-01

Gate: GLOBAL-MONETIZED-CATEGORY-STACK-01-BIENES-PROOF — Bienes Raíces parent/child inventory as first global-stack proof.

## Why global stack proof (not a random Bienes patch)

Servicios required separate gates (CTA, hydration, hard route, golden loop). This gate extracts that into **GLOBAL-MONETIZED-CATEGORY-STACK-STANDARD-01** and applies it to Bienes inventory pack.

## Standard 02 facts

- Bienes = agent/business parent + child property inventory (up to 4 additional).
- Dashboard upgrade = add-on-only; no $399 base recharge from dashboard edit.
- Add-on persistence requires durable media, dashboard hydrate, public render, no fake entitlement.

## Bienes checkpoint facts

- Agent Showcase $399/mo; Inventory Pack +$99/mo (4 additional properties).
- `REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED=false` — Stripe line item deferred.
- Draft fields: `inventoryPackAccepted`, `additionalInventoryProperties`.

## Files changed

- `app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts` (new)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts` (new)
- `AgenteIndividualResidencialApplication.tsx`, `AgenteIndividualResidencialPreviewClient.tsx`
- `LeonixRealEstateListingManageCard.tsx`, `BrNegocioListingInventoryActions.tsx`
- `revenuePricingMatrix.ts`, `revenueCategoryCheckoutPayload.ts`, `publishCheckoutCheckpoint.ts`
- docs + verifiers + smoke

## Route/helper implementation

- Edit: `/clasificados/publicar/bienes-raices/negocio?edit=1&source=dashboard&mode=listing-edit&listingId=...&returnPanel=bienes-raices`
- Inventory edit: `...&mode=inventory-edit&focus=inventory-pack`
- Inventory addon: `...&mode=inventory-addon&focus=inventory-pack`
- Preview: `/clasificados/bienes-raices/preview/negocio?preview=listing&source=dashboard&...`
- Back-to-edit: `bienesBackToEditHrefFromPreview` — never hub/selector.

## Inventory add-on checkout truth

- Package key `br_inventory_pack_monthly` added to matrix ($99/mo).
- `REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED` remains **false** — checkout CTA shows honest blocked message; no fake activation.
- When enabled in a future gate: add-on-only via `BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT`; success CTA → `bienesInventoryEditHref`.

## Child persistence/media truth

- Max 4: `BR_INVENTORY_PACK_MAX_CHILDREN` enforced in shell/checkpoint.
- Dashboard hydration maps child DB rows → `additionalInventoryProperties` with durable image URLs.
- Preview blocked from creating duplicate parent on dashboard listing-bound path.

## Public output

- Parent detail uses `fetchBrRelatedInventoryListingsForDetail` for child property cards (existing path).

## Pipeline protection

- Private BR flow unchanged — no inventory add-on CTAs on privado lane.
- Negocio-only inventory section in dashboard card.

## Manual QA URLs

1. https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=bienes-raices — Editar anuncio → direct negocio app with dashboard params; saved data loads; preview → Volver a editar preserves context.
2. https://leonixmedia.com/clasificados/publicar/bienes-raices?lang=es — new application unchanged.
3. Inventory section — Editar inventario / Activar inventario links use golden-loop helpers; checkout blocked message if not supported.
4. Restaurantes/Servicios — regression via existing verifiers.

## READY TO COMMIT status

READY TO COMMIT: YES (with inventory Stripe fulfillment deferred honestly)

## TRUE/FALSE audit

- global stack proof explained: TRUE
- Bienes helper routes: TRUE
- dashboard hydration: TRUE
- inventory checkout honestly blocked: TRUE
- preview back loop: TRUE
- max 4 enforced: TRUE
- public child render path exists: TRUE
- private flow protected: TRUE
