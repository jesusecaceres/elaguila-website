# STRIPE-REVENUE-OS-RESTAURANTES-COUPON-ADDON-01

## 1. Executive Summary

Enables **real Revenue OS checkout** for the Restaurante **coupon module add-on** (`restaurantes_offers_addon`, +$99/mo) when selected in the application (`couponUpgradeEnabled`). Checkout no longer blocks when the add-on is selected. Stripe charges base + add-on (minus promo discount). Payment records store add-on snapshot metadata. Webhook activation and promo redemption behavior are unchanged.

## 2. Why This Gate Was Needed

Live QA confirmed promo codes work on the base $399/mo plan, but checkout was **intentionally blocked** when the restaurant coupon module was selected because `REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED` was `false`. Users need coupons selected and published for QA — removing coupons was not an option.

## 3. Old Blocker

When `couponUpgradeEnabled` was true:

- `resolvePublishCheckoutCheckpoint` set `blocked = true`
- Final button disabled with message to remove the add-on
- Stripe never opened
- Total showed $399/mo only (add-on excluded from charge)

## 4. New Add-on Checkout Contract

Client may send:

```json
{
  "category": "restaurantes",
  "packageKey": "restaurantes_base_monthly",
  "addOns": [{ "key": "restaurantes_offers_addon", "quantity": 1 }]
}
```

Server rules:

- Only **allowlisted** add-on keys for the base package/category
- Prices resolved from `revenuePricingMatrix` — **never trust client price**
- Unknown keys rejected with 400
- Add-on snapshot stored on payment record metadata

## 5. Add-on Pricing

| Item | Package key | Price |
|------|-------------|-------|
| Restaurante base | `restaurantes_base_monthly` | $399.00/mo |
| Coupon module | `restaurantes_offers_addon` | +$99.00/mo |
| Subtotal (both) | — | **$498.00/mo** |

## 6. Promo Discount With Add-on

**Rule:** Promo applies to the **full chargeable checkout subtotal** (base + selected add-ons).

| Scenario | Subtotal | 25% promo | Total |
|----------|----------|-----------|-------|
| Base only | $399.00 | −$99.75 | **$299.25/mo** |
| Base + coupon module | $498.00 | −$124.50 | **$373.50/mo** |

Checkout route revalidates promo against server-computed `subtotalCents` including add-ons.

## 7. Stripe Amount Contract

- Server builds **multiple Stripe line items** (base + add-on) with promo discount distributed proportionally so line items sum to `finalAmountCents`
- Stripe session total **equals** UI total
- No silent $399 charge when add-on is selected

## 8. Payment Record Metadata

Pending payment records include:

- `amount_subtotal_cents` — base + add-ons
- `amount_discount_cents` / `amount_total_cents`
- `metadata.add_ons[]` — `{ key, price_cents, quantity, label }`
- `metadata.restaurant_coupon_addon_selected`
- `metadata.restaurant_offers_addon_package_key`
- `metadata.restaurant_offers_addon_price_cents`

## 9. Webhook Fulfillment Contract

Unchanged from prior gates:

- Payment marked **paid** only after Stripe webhook
- Restaurante listing **archived → published** on successful payment
- Coupon module data from draft remains on published listing
- Promo redemption increments only after webhook

## 10. Expired/Canceled Rules

- Expired/canceled Stripe sessions do not publish listing
- Promo does not redeem
- Payment stays pending/unpaid

## 11. Files Inspected

- `publishCheckoutCheckpoint.ts`, `PublishCheckoutCheckpoint.tsx`, `RestaurantePreviewClient.tsx`
- `revenueCheckout.ts`, `revenueStripe.ts`, `revenuePaymentRecords.ts`
- `revenueCategoryCheckoutPayload.ts`, `revenueCategoryCheckoutClient.ts`
- `app/api/revenue-os/checkout/route.ts`
- `revenuePromoValidation.ts`, `revenuePromoRedemptions.ts`, `revenuePricingMatrix.ts`

## 12. Files Changed

| File | Change |
|------|--------|
| `publishCheckoutCheckpoint.ts` | `REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = true`; add-on in payload |
| `revenueCheckout.ts` | Add-on validation, subtotal, Stripe line-item builder |
| `revenueStripe.ts` | Multiple line items support |
| `revenuePaymentRecords.ts` | Add-on snapshot metadata |
| `revenueCategoryCheckoutPayload.ts` | `addOns` in client payload |
| `revenueCategoryCheckoutClient.ts` | Pass addOns in fetch body |
| `app/api/revenue-os/checkout/route.ts` | Server add-on + promo subtotal + Stripe lines |
| `RestaurantePreviewClient.tsx` | Dynamic subtotal, pass addOns to checkout/promo |
| `docs/stripe-revenue-os-restaurantes-coupon-addon-01.md` | This document |
| `scripts/verify-stripe-revenue-os-restaurantes-coupon-addon-01.mjs` | Verifier |
| `package.json` | Verifier script |

## 13. What This Gate Does Not Do

- Does not touch webhook raw body/signature handling
- Does not touch public Cupones/Ofertas CMS
- Does not fake paid status or entitlement
- Does not add Supabase migrations
- Does not touch other categories (Servicios add-on remains future gate)

## 14. Manual QA Checklist

- [ ] Restaurante app — **select coupon module**
- [ ] Preview — confirm +$99 line, total $498/mo (no promo)
- [ ] Apply `RESTO-QA-25-01` — confirm −$124.50, total **$373.50/mo**
- [ ] Check all confirmation boxes — button enables (no blocker)
- [ ] Click Continuar al pago seguro — Stripe sandbox opens
- [ ] Stripe amount matches UI ($373.50/mo with promo)
- [ ] Complete **sandbox** payment only (no real card)
- [ ] Webhook publishes listing; coupons visible on public ad
- [ ] Promo redemption count updates after webhook
- [ ] Repeat with coupon module **off** — base promo $299.25 still works

## 15. Next Recommended Gates

1. **SERVICIOS-OFFERS-ADDON-CHECKOUT-01** — mirror pattern for `servicios_offers_addon`
2. **REVENUE-OS-PROMO-VALIDATE-ADDON-SUBTOTAL-01** — validate route server-recomputes subtotal from addOns keys
