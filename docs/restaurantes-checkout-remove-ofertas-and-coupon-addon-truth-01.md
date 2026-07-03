# RESTAURANTES-CHECKOUT-REMOVE-OFERTAS-AND-COUPON-ADDON-TRUTH-01

## 1. Executive Summary

Removes the generic **Ofertas Locales** secondary card and CTA from Restaurante final checkout. Restores truthful **category-owned** coupon/add-on handling from the Restaurante application (`couponUpgradeEnabled`) in the shared `PublishCheckoutCheckpoint`. Base checkout remains **$399/mo** when no add-on is selected. When the add-on is selected but Revenue OS cannot charge it yet, checkout is **blocked honestly** — no silent $399 undercharge.

## 2. Why Ofertas Locales Was Removed From Restaurante Checkout

The prior gate replaced a confusing paid upsell with a secondary “add Ofertas Locales after publish” card. Users still found it misleading on the final checkout screen because **Ofertas Locales / Cupones** is a separate public customer-facing system, not part of Restaurante advertiser checkout.

Restaurante checkout now shows only:
- Restaurante base plan ($399/mo)
- Restaurante **category-owned** coupon module (when selected in Step I)

Public Ofertas Locales pages and flows are unchanged.

## 3. Promo Code vs Restaurante Coupon Add-on vs Public Ofertas/Cupones

| System | Purpose | This gate |
|--------|---------|-----------|
| **Leonix promo code** | Checkout discount on advertiser payment to Leonix | UI deferred — `PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01` |
| **Restaurante coupon add-on** | Category-owned paid module selected in Restaurante Step I (`couponUpgradeEnabled`) | Shown in plan summary or blocks checkout |
| **Cupones / Ofertas Locales** | Public customer-facing offers | **Not** shown on Restaurante checkout |

## 4. Files Inspected

- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- `app/lib/clasificados/restaurantes/RestauranteOfertasLocalesCheckoutSecondaryCard.tsx`
- `app/lib/clasificados/restaurantes/restaurantesOffersCheckoutSecondaryCopy.ts`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts`
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- `app/lib/listingPlans/revenuePricingMatrix.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`
- Prior docs/verifiers for Restaurante checkout gates

## 5. Files Changed

| File | Change |
|------|--------|
| `RestaurantePreviewClient.tsx` | Remove Ofertas secondary card; wire `couponUpgradeEnabled` → `restaurantOffersAddonSelected` |
| `publishCheckoutCheckpoint.ts` | Restaurante coupon add-on truth, blocking copy, canonical package key |
| `docs/restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01.md` | This document |
| `scripts/verify-restaurantes-checkout-remove-ofertas-and-coupon-addon-truth-01.mjs` | Gate verifier |
| `scripts/verify-restaurantes-pending-publish-and-coupon-offers-truth-01.mjs` | Updated for new product decision |
| `package.json` | Verifier script |

Unused files left in repo (not rendered): `RestauranteOfertasLocalesCheckoutSecondaryCard.tsx`, `restaurantesOffersCheckoutSecondaryCopy.ts`.

## 6. Restaurante Coupon/Add-on Field Found

**Field:** `couponUpgradeEnabled` (boolean) on `RestaurantePricingState` / draft model.

Set in `RestauranteApplicationClient.tsx` Step I when the advertiser enables the restaurant coupon module (+$99/mo in application UI).

Preview wires: `restaurantOffersAddonSelected: Boolean(normalizedDraft.couponUpgradeEnabled)`.

## 7. Revenue OS Add-on Support Result

| Item | Value |
|------|-------|
| Base package | `restaurantes_base_monthly` — $399/mo |
| Add-on package (matrix) | `restaurantes_offers_addon` — $99/mo |
| Checkout bundled add-on | **Not supported yet** — `REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = false` |
| Revenue OS checkout API | One `packageKey` per session; no add-on line item wiring |

**Next gate required for charging:** `STRIPE-REVENUE-OS-RESTAURANTES-COUPON-ADDON-01`

No fake add-on pricing or fake Stripe amounts were added.

## 8. Checkout Summary Result

**CASE A — no coupon add-on selected:**
- Restaurante establecido — $399/mo
- Total mensual — $399/mo
- Checkout allowed after confirmations

**CASE B — add-on selected AND Revenue OS supports it (future):**
- Base + Módulo de cupones del restaurante — +$99/mo
- Total reflects both line items
- Metadata records `restaurant_offers_addon_package_key`

**CASE C — add-on selected BUT unsupported (current):**
- Plan summary shows selected module with honest “not included in today's secure checkout” detail
- Total remains **$399/mo** (add-on excluded from chargeable total)
- Checkout **blocked** with calm copy directing user to remove add-on or contact Leonix

## 9. Blocking Behavior If Add-on Unsupported

Spanish:
> El módulo de cupones del restaurante todavía no está listo para pago seguro. Quita ese complemento para continuar con el plan base de $399/mes o contacta a Leonix.

English:
> The restaurant coupon module is not ready for secure checkout yet. Remove that add-on to continue with the $399/mo base plan or contact Leonix.

User can use **Volver a editar** to disable `couponUpgradeEnabled` in Step I.

## 10. Base $399 Flow Preservation

- Shared `PublishCheckoutCheckpoint` retained
- Pending save before Stripe (`saveRestaurantePendingBeforeCheckout`) unchanged
- Checkout uses stable `listingId` from pending save
- Webhook activation (`archived` → `published`) not touched
- No client-side paid activation
- Newsletter checkbox remains optional
- Promo code UI not added (`promoEligible: false`)

## 11. What This Gate Does Not Do

- Does not wire Leonix promo-code validation UI
- Does not touch Stripe webhook
- Does not touch Revenue OS checkout API foundation (except checkpoint metadata)
- Does not touch Servicios, Bienes Raíces, Autos, or other categories
- Does not remove public Ofertas Locales / Cupones pages
- Does not remove Restaurante application coupon fields
- Does not add Supabase migrations

## 12. Manual QA Checklist

- [ ] Open Restaurante application — select **no** coupon add-on
- [ ] Preview — confirm **no** Ofertas Locales card
- [ ] Confirm **no** “Ver Ofertas Locales” / “View Local Offers” button
- [ ] Plan summary shows **$399** total
- [ ] Complete confirmations — checkout opens after pending save
- [ ] Back to edit — enable coupon module in Step I
- [ ] Preview — summary shows selected module OR blocks checkout honestly
- [ ] Confirm checkout **cannot** proceed at $399 only when add-on selected and unsupported
- [ ] Confirm **no** promo-code input field
- [ ] Newsletter checkbox optional
- [ ] Webhook activation files unchanged

## 13. Next Recommended Gates

1. **STRIPE-REVENUE-OS-RESTAURANTES-COUPON-ADDON-01** — bundle base + coupon add-on in Revenue OS checkout
2. **PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01** — Leonix promo code input on shared checkpoint
3. Servicios / Bienes negocio category-owned add-ons (separate gates)
