# Restaurantes Publish Checkout Checkpoint — QA Fix 01

## 1. Executive Summary

Gate **RESTAURANTES-PUBLISH-CHECKOUT-CHECKPOINT-QA-FIX-01** verifies and fixes the Restaurante preview final checkout after `PUBLISH-CHECKOUT-CHECKPOINT-STANDARD-01`.

**Finding:** The shared checkpoint was wired correctly but placed inside a collapsed `<details>` panel at the **top** of the preview page. QA users scrolling through the preview card/story sections did not see the checkout block at the bottom.

**Fix:** Moved `PublishCheckoutCheckpoint` to a visible **Section 3 — Final checkout** after the preview canvas. Application form no longer requires confirmation boxes to reach preview.

## 2. Files Inspected

- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx`
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutClient.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`

## 3. Files Changed

| File | Change |
|------|--------|
| `RestaurantePreviewClient.tsx` | Checkpoint moved to bottom section; session help stays in collapsible panel |
| `RestauranteApplicationClient.tsx` | Preview navigation no longer gated by application confirmations |
| `PublishCheckoutCheckpoint.tsx` | Added `draftReady` / `draftReadyMessage` for incomplete-draft gating |
| `publishCheckoutCheckpoint.ts` | Updated coupon add-on block copy (Gate 6) |

## 4. Restaurante Preview Route

- Route: `/clasificados/restaurantes/preview`
- Component: `RestaurantePreviewClient.tsx`
- Edit back link: `/publicar/restaurantes`

## 5. Shared Checkpoint Status

**Present and visible** at bottom of preview (Section 3). Uses `PublishCheckoutCheckpoint` with `RESTAURANTES_CHECKPOINT_CONFIRMATIONS`.

Preview does not require confirmation boxes — only the final checkout action does.

## 6. Plan Summary Status

| Lang | Label | Price |
|------|-------|-------|
| EN | Established restaurant | $399/mo |
| ES | Restaurante establecido | $399/mes |

Package key: `restaurantes_base_monthly` via `RESTAURANTES_BASE_CHECKOUT`.

## 7. Confirmation Box Status

Four required boxes (ES/EN) from shared preset. Unchecked by default. Final button disabled until all checked. Final action requires confirmations. Optional newsletter does not block checkout.

## 8. Revenue OS Checkout Status

- Final button: **Continue to secure payment** / **Continuar al pago seguro**
- Client: `startRevenueCategoryCheckout` → `POST /api/revenue-os/checkout`
- Payload: `listingDraftId`, `category: restaurantes`, `packageKey: restaurantes_base_monthly`
- No direct `POST /api/clasificados/restaurantes/publish` on final action
- No fake paid/entitlement activation
- Listing persistence before payment: deferred — `RESTAURANTES-PENDING-PUBLISH-BEFORE-CHECKOUT-01`

## 9. Promo Status

**Deferred.** No client validate endpoint; shared component shows honest deferred message. No fake Apply or redemption.

## 10. Newsletter Status

**Optional, persistence deferred.** Checkbox renders; does not block checkout; no “you are subscribed” claim.

## 11. Coupon/Add-on Status

If coupon add-on selected in draft but Revenue OS bundled add-on unsupported:

- Base $399/mo total remains visible (add-on not charged)
- Checkout blocked with calm copy:
  - EN: *This add-on is not ready for checkout yet. Continue with the base restaurant plan or contact Leonix.*
  - ES: *Este complemento todavía no está listo para pago. Continúa con el plan base del restaurante o contacta a Leonix.*

## 12. What This Gate Does Not Do

- No full application or preview redesign
- No other category migrations
- No checkout/webhook foundation changes
- No Supabase migrations or `.env` edits
- No restaurant listing persistence before payment

## 13. Manual QA Checklist

- [ ] Open Restaurante application
- [ ] Fill required minimum data
- [ ] Click Preview **without** checking final boxes
- [ ] Confirm preview opens
- [ ] Scroll to bottom — Section 3 **Final checkout**
- [ ] Confirm shared checkpoint appears
- [ ] Confirm $399/mo
- [ ] Confirm required boxes unchecked by default
- [ ] Confirm checkout button disabled before boxes
- [ ] Check all required boxes
- [ ] Confirm button enables
- [ ] Click Continue to secure payment
- [ ] Confirm Stripe sandbox checkout opens (no real card)
- [ ] Confirm no fake paid status before webhook
- [ ] Confirm Back to Edit still works

## 14. Next Recommended Gate

**RESTAURANTES-PENDING-PUBLISH-BEFORE-CHECKOUT-01** — persist restaurant listing as pending before/after Revenue OS checkout.
