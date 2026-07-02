# Restaurantes Pending Publish and Coupon/Offers Truth — Gate 01

## 1. Executive Summary

Gate **RESTAURANTES-PENDING-PUBLISH-AND-COUPON-OFFERS-TRUTH-01** fixes launch-blocking confusion on the Restaurante preview checkout and establishes safe pending persistence before Stripe.

**Screenshot problem:** Final checkout showed an Ofertas Locales upsell with $399 + $100 combo ($499) while the plan summary below showed a conflicting coupon add-on line (+$99, not included) and $399 total.

**Fix:** Separated customer-facing Ofertas Locales from Leonix checkout pricing; checkout summary shows only chargeable base $399/mo; restaurant row saved as `archived` (hidden) before Revenue OS checkout with stable `listingId`.

## 2. Screenshot Problem

The old `RestauranteOfertasLocalesUpsellCard` displayed combo pricing ($499/mo) inside the checkout area while the shared checkpoint showed a different add-on line (+$99). Users could not trust what Stripe would charge.

## 3. Promo Code vs Ofertas Locales vs Paid Add-On

| Concept | What it is | This gate |
|---------|------------|-----------|
| **Promo code** | Leonix discount on advertiser payment (e.g. launch promo on $399/mo) | Deferred — `PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01` |
| **Ofertas Locales / coupons** | Customer-facing offers for the public (lunch special, happy hour) | Separate module; not in today's checkout total |
| **Paid add-on** | Extra monthly Stripe line (e.g. +$99 offers module) | Not Revenue OS-ready — hidden from checkout summary |

They are **not** the same system.

## 4. Files Inspected

- `RestaurantePreviewClient.tsx`
- `RestauranteOfertasLocalesUpsellCard.tsx` / upsell copy
- `PublishCheckoutCheckpoint.tsx` / `publishCheckoutCheckpoint.ts`
- `POST /api/clasificados/restaurantes/publish`
- `revenueCategoryCheckoutClient.ts` / payload
- `revenuePricingMatrix.ts` (`restaurantes_base_monthly`, `restaurantes_offers_addon`)

## 5. Files Changed

| File | Change |
|------|--------|
| `RestaurantePreviewClient.tsx` | Secondary Ofertas card; pending save before checkout; `listingId` checkout |
| `saveRestaurantePendingBeforeCheckout.ts` | New client helper |
| `buildRestaurantePublishPayload.ts` | `activation_mode: pending_payment` |
| `publish/route.ts` | Pending save as `archived`; returns `listingId` |
| `restaurantesPublicListingMapper.ts` | Optional `status` param |
| `publishCheckoutCheckpoint.ts` | No add-on line / no block when add-on unsupported |
| `RestauranteOfertasLocalesCheckoutSecondaryCard.tsx` | Truthful secondary upsell |
| `restaurantesOffersCheckoutSecondaryCopy.ts` | Launch-safe copy |

## 6. Ofertas Locales Decision

Replaced combo upsell in checkout area with **secondary card**:
- ES: *Agrega Ofertas Locales después de publicar tu restaurante… no cambia el pago de hoy.*
- EN: *Add Local Offers after publishing… does not change today's checkout.*
- CTA: **Ver Ofertas Locales** / **View Local Offers** (link only)
- No $499 combo, no +$100 in checkout area

## 7. Checkout Summary Decision

When `REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = false`:

- **Show:** Established restaurant — $399.00/mo
- **Total:** $399.00/mo
- **Hide:** Add-on de cupones +$99, +$100, Combo $499
- **Do not block** base checkout when draft has coupon module enabled

## 8. Pending Persistence Before Checkout

**Pattern A (implemented):**

1. Client uploads media refs
2. `POST /api/clasificados/restaurantes/publish` with `activation_mode: pending_payment`
3. Server upserts `restaurantes_public_listings` with `status: archived` (not public-visible)
4. Returns `listingId`, `leonixAdId`, `draftListingId`
5. Revenue OS checkout uses **`listingId`** (UUID), not volatile session-only state

**Webhook activation:** Entitlement/listing activation after payment for `restaurantes` category is a follow-up gate (`RESTAURANTES-REVENUE-OS-WEBHOOK-ACTIVATION-01`). This gate does not fake activation locally.

## 9. Revenue OS Checkout Payload

```json
{
  "category": "restaurantes",
  "packageKey": "restaurantes_base_monthly",
  "listingId": "<uuid from pending save>",
  "leonixAdId": "<when allocated>",
  "locale": "es|en",
  "returnPath": "/clasificados/restaurantes"
}
```

Amount: **$399/mo** subscription via Revenue OS matrix. No add-on line items.

## 10. What This Gate Does Not Do

- No Leonix promo code UI
- No Revenue OS offers add-on checkout ($99/$100)
- No webhook foundation changes
- No migration (uses existing `archived` status)
- No fake paid/entitlement/coupon activation
- No other category changes

## 11. Manual QA Checklist

- [ ] Open Restaurante application; fill minimum data
- [ ] Preview without final confirmations
- [ ] Scroll to Section 3 final checkout
- [ ] Summary shows only $399/mo (no +$99/+100/$499)
- [ ] Ofertas card says separate / does not change today's total
- [ ] Required boxes unchecked by default; button disabled
- [ ] Check boxes → **Continuar al pago seguro**
- [ ] Stripe sandbox opens for $399 base plan (no real card)
- [ ] No fake paid status before webhook
- [ ] Back to Edit works

## 12. Next Recommended Gates

1. `RESTAURANTES-REVENUE-OS-WEBHOOK-ACTIVATION-01` — flip `archived` → `published` after payment
2. `PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01` — Leonix promo code at checkpoint
3. `STRIPE-REVENUE-OS-RESTAURANTES-OFFERS-ADDON-01` — bundled +$99 add-on when product-ready
