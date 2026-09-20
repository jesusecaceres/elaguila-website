# LEONIX OFERTAS LOCALES — Pricing Reconciliation

Branch: `claude/quick-remaining-families-build-2026-09` (Cursor closeout).
Certified Core parent: `b66322ba01482dcf433220de0a1855d6824f54c4`.
No new price, SKU, Stripe product, or migration.

## SERVER AUTHORITY

`app/lib/listingPlans/revenuePricingMatrix.ts` — the package definition consumed by
`validateRevenueCheckoutRequest` (`packageDef.priceCents`). Client cannot choose an amount.

| Field | Value |
|---|---|
| FLYER PACKAGE | `ofertas_locales_flyer_30d` |
| FLYER PRICE | `39900` cents ($399) |
| FLYER BILLING | `one_time`, `stripeEligible: true`, `unresolvedOwnerDecision: null` |
| COUPON PACKAGE | `ofertas_locales_coupons_30d` |
| COUPON PRICE | `19900` cents ($199) |
| COUPON BILLING | `one_time`, `stripeEligible: true`, `unresolvedOwnerDecision: null` |
| DURATION | 30 days (`durationDays: 30` on both packages; `OFERTAS_LOCALES_PUBLIC_TERM_DAYS = 30`) |

This matches historical Leonix doctrine (Flyer $399 / 30 days, Coupon $199 / 30 days) and is
therefore a BUG FIX, not a commercial redesign.

## CLIENT CONSTANT BEFORE

`app/lib/ofertas-locales/ofertasLocalesConstants.ts`:

- `OFERTAS_LOCALES_FLYER_PRICE_CENTS = 39900` (already correct)
- `OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 0` (stale; disagreed with server $199)
- `OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG.coupons.displayPriceUsd = 0`
- `OFERTAS_LOCALES_STEP1_BASE_PRODUCTS.coupon_promotion.priceDisplayMonthly = 0`
- `OFERTAS_LOCALES_PRIMARY_AD_FORMAT_OPTIONS.local_coupons.priceDisplayMonthly = 0`

`app/lib/ofertas-locales/ofertasLocalesCommercial.ts` reads those constants, so the coupon
commercial product persisted `commercial_amount_cents = 0` while Stripe checkout for
`ofertas_locales_coupons_30d` would charge `packageDef.priceCents = 19900`.

Pickup-partner monthly catalog `OFERTAS_LOCALES_PRICING.digitalCouponListing` (0 / 0) and
verified-intro 15% (`verifiedIntroDiscountPolicy.ts`; Ofertas packages are `promoEligible: false`)
were left unchanged.

Coupon-lane architecture (manual-entry, `aiIncluded: false`, 7 wizard steps, no scanner) was
left unchanged. This repair is price/consent only.

## CONSENT COPY BEFORE

`app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx` hardcoded flyer copy for every lane:

- ES: `Entiendo y autorizo el cobro de $399 por esta publicación de 30 días…`
- EN: `I understand and authorize the $399 charge for this 30-day publication…`

Checkout already submitted `packageKey: offer.commercialProductKey` (flyer or coupon). The
cross-wire was copy, not the package key.

## ACTUAL REPAIR

Align stale client 30-day coupon constants to the server package ($199). Derive checkout
consent and displayed charge from `getOfertaLocalCommercialProductByPackageKey` so:

- flyer consent / total = $399 / 30 days
- coupon consent / total = $199 / 30 days

No flyer package, duration, verified-intro, pickup-partner, or Stripe catalog change.

## FILES CHANGED

| File | Reason |
|---|---|
| `app/lib/ofertas-locales/ofertasLocalesConstants.ts` | Coupon cents + catalog/STEP1 display → $199; flyer $399 preserved |
| `app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts` | Lane display constant `local_coupons.priceDisplayMonthly` → 199 |
| `app/lib/ofertas-locales/ofertasLocalesCommercial.ts` | Comment + `ofertaLocalChargeConsentCopy()` helper |
| `app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx` | Consent and displayed amount from live package, not hardcoded $399 |
| `scripts/verify-ofertas-pricing-consistency-01.ts` | New source verifier (self-tested against synthetic $0 / $399 cross-wire) |
| `scripts/ofertas-locales-gate-k-two-lane-final-verifier.ts` | Check 03: Coupon = $199 (was FREE) |
| `scripts/verify-quick-remaining-families-01.ts` | §7 now asserts alignment, not "untouched" |
| `scripts/verify-quick-business-core-01.ts` | Narrow dashboard checkout allowlist for this one file |
| `scripts/verify-quick-classifieds-onramp-01.ts` | Same one-file dashboard allowlist |

## VERIFIERS

- `npx tsx scripts/verify-ofertas-pricing-consistency-01.ts`
- `npx tsx scripts/ofertas-locales-gate-k-two-lane-final-verifier.ts`
- focused Ofertas commercial/contract audits that already expected $199
- all six Quick program verifiers from Gate 2

## STATUS

**CLOSED** — coupon client constants and checkout consent now follow the existing server package
`$199 / 30 days`. Flyer remains `$399 / 30 days`. No new SKU.
