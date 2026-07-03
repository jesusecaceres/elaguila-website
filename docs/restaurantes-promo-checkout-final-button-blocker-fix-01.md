# RESTAURANTES-PROMO-CHECKOUT-FINAL-BUTTON-BLOCKER-FIX-01

## 1. Executive Summary

Live Restaurante QA confirmed promo validation works (`RESTO-QA-25-01` applies 25% = −$99.75 on $399/mo base). The remaining issue was the **“Continuar al pago seguro”** button staying disabled after all confirmation boxes were checked. Root cause: the shared checkpoint blocks checkout when the **Restaurante coupon module** (`couponUpgradeEnabled`) is selected but Revenue OS cannot charge the add-on yet. This gate improves blocker messaging (promo-aware copy + edit CTA) and adds dev-only diagnostics. When the coupon module is **off**, draft is ready, promo is applied, and all boxes are checked, checkout opens Stripe for **$299.25/mo**.

## 2. Promo Success Confirmed

| Item | Value |
|------|-------|
| Code | `RESTO-QA-25-01` |
| Base plan | `restaurantes_base_monthly` — $399/mo |
| Discount | 25% (−$99.75) |
| Promo total shown | **$299.25/mo** |
| Validation | `POST /api/revenue-os/promo/validate` (server-owned) |

Promo discount math was **not** changed in this gate.

## 3. Why Button Was Blocked

`resolvePublishCheckoutCheckpoint` sets `blocked = true` when:

- `restaurantOffersAddonSelected` is true (from draft `couponUpgradeEnabled`), and
- `REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED === false`

Then `finalActionEnabled = !blocked && allRequiredChecked` → **false**, so the final button stays disabled even when all four confirmation boxes are checked and promo is applied.

Secondary blockers (unchanged):

- `draftReady === false` when minimum publish fields are incomplete (`minOk` / `auditRestaurantePublishReadiness`)
- Unchecked required confirmation boxes

## 4. Coupon Add-on Blocker Rule

When the restaurant coupon module is selected in Step I:

- Checkout **must remain blocked** — no silent $399 or $299.25 charge without add-on support.
- Promo discount applies to the **base $399/mo plan only** in the UI total; user must remove the unsupported add-on to proceed.
- Message (Spanish): *Para continuar al pago seguro hoy, vuelve a editar y desactiva el módulo de cupones del restaurante. El descuento promocional sí está aplicado al plan base de $399/mes.*
- CTA: **Volver a editar y quitar complemento** → `/publicar/restaurantes`

## 5. Base Plan With Promo Expected Stripe Amount

With coupon module **OFF**, valid promo, all confirmations checked, draft ready:

1. `saveRestaurantePendingBeforeCheckout`
2. `startRevenueCategoryCheckout` with `promoCode: RESTO-QA-25-01` (or applied code)
3. `redirectToRevenueCategoryCheckout(checkoutUrl)`
4. Stripe sandbox session total: **$299.25/mo**

Do not use a real card in QA.

## 6. Files Inspected

- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx`
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutClient.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`
- Prior docs for promo validation and coupon add-on truth

## 7. Files Changed

| File | Change |
|------|--------|
| `publishCheckoutCheckpoint.ts` | Promo-aware coupon blocker copy; `isRestaurantCouponCheckoutBlocked` helper |
| `PublishCheckoutCheckpoint.tsx` | Block alert + edit CTA above button; dev `console.debug` diagnostics |
| `RestaurantePreviewClient.tsx` | Pass `editHref`; dev log `couponUpgradeEnabled` + `draftReady` |
| `docs/restaurantes-promo-checkout-final-button-blocker-fix-01.md` | This document |
| `scripts/verify-restaurantes-promo-checkout-final-button-blocker-fix-01.mjs` | Gate verifier |
| `package.json` | Verifier script |

## 8. Manual QA Checklist

- [ ] Restaurante application with **coupon module OFF**
- [ ] Open preview
- [ ] Apply `RESTO-QA-25-01`
- [ ] Confirm −$99.75 discount; total $299.25/mo
- [ ] Check all four confirmation boxes
- [ ] Confirm **Continuar al pago seguro** enables
- [ ] Click button — Stripe sandbox opens for $299.25/mo (no real card)
- [ ] Repeat with **coupon module ON**
- [ ] Confirm checkout blocked with clear message + **Volver a editar y quitar complemento**
- [ ] Confirm promo discount still visible on base plan in summary
