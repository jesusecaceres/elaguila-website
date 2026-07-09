# REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-01

Micro-scoped Revenue OS patch — fix global promo validation so active newsletter signup
codes validate in paid checkout when their rules allow a payment discount.

## Objective

Newsletter code `LX-NEWS-SQESAR` (ACTIVE, 25% off, Any category, Any package, Can discount
payment: Yes, Subscriber identity: No) was rejected in Servicios checkout with
"Este código promocional no es válido para este pago." Make such codes validate, without
loosening protection for expired/revoked/mismatched/identity-required codes.

## Task classification

MICRO PATCH / SCOPED REVENUE OS VALIDATION FIX. No Servicios UI, Stripe, or Admin redesign.

## Files inspected

- `app/lib/listingPlans/revenuePromoValidation.ts` (publish-checkout validator)
- `app/lib/listingPlans/revenuePromoRedemptions.ts` (row load, launch-25 gate, discount math, checkout revalidation)
- `app/lib/listingPlans/promoCodeRules.ts` (pure eligibility + scope matching)
- `app/lib/listingPlans/promoCodeLifecycle.ts` / `packagePricingRules.ts` (rule model)
- `app/api/revenue-os/promo/validate/route.ts` (Apply endpoint)
- `app/api/revenue-os/checkout/route.ts` (pre-Stripe revalidation via `resolvePromoForCheckout`)
- `app/api/newsletter/subscribe/route.ts` (how newsletter codes are stored)
- Servicios preview client (payload wiring, read-only)

## Files changed

- `app/lib/listingPlans/revenuePromoRedemptions.ts`
  - Added `servicios_base_monthly` to `WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS`.
  - Added `resolvePromoCanDiscountPayment(row)` and `resolvePromoRequiresSubscriberIdentity(row)`.
  - `resolvePromoForCheckout` now rejects `promo_payment_discount_disabled` and
    `promo_identity_required` (only when identity is required and none is provided).
- `app/lib/listingPlans/promoCodeRules.ts`
  - `scopeMatches` now treats `any` / `all` / `*` / `Any category` / `Any package` (and
    `_`/spaceless variants) as match-all, in addition to empty/null = unrestricted.
- `app/lib/listingPlans/revenuePromoValidation.ts`
  - Enforces `can_discount_payment` (explicit `false` blocks) and identity-only-when-required.
  - Surfaces clear bilingual failure reasons via `localizeEligibilityReason`.
- `package.json` — new verify/smoke scripts.
- `scripts/verify-…` + `scripts/smoke-…` + this doc.

## Root cause

Newsletter signup codes are stored with `promo_family: "website_launch_25"` and
`website_checkout_only: true` (`/api/newsletter/subscribe`). `resolveWebsiteLaunch25Rejection`
constrains such codes to `WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS`, which listed only
`rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`, `restaurantes_base_monthly`.
Servicios (`servicios_base_monthly`) became a live Revenue OS website checkout product in
SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01 but was never added to that allowlist — so every
newsletter code was rejected on Servicios checkout regardless of its Any/Any scope.

## Validation rule (after patch)

A code discounts a paid checkout when:
1. status active; 2. within start/end window; 3. `can_discount_payment` not explicitly false;
4. category scope missing/empty/wildcard or includes checkout category;
5. package scope missing/empty/wildcard or includes checkout package key;
6. redemption / per-customer limits not exceeded;
7. if `subscriber_identity_required`, checkout provides a matching email/owner identity;
8. assigned/private alone does NOT block; 9. one promo only; 10. redemption stays webhook-only.

Launch-25/newsletter website-checkout codes remain constrained to the website-checkout
allowlist (print/combo/manual/free products stay excluded); Servicios base is now on it.

## Servicios test scenario result

`servicios_base_monthly`, category `servicios`, 25% newsletter code, Any/Any, can discount = Yes:
validates. Subtotal $498.00 → discount $124.50 → total $373.50 (base-only $399 → $99.75 → $299.25).

## Invalid promo protections preserved

Inactive/revoked, `can_discount_payment=false`, category mismatch, package mismatch, expired,
launch-25 on non-allowlisted product, and identity-required-without-identity all still reject.

## Discount math result

`Math.floor(subtotal * pct / 100)`, deterministic: 49800→12450 (total 37350);
39900→9975 (total 29925). UI, validate route, and pre-Stripe revalidation share the same math.

## Commands run

- `npm run verify:revenue-os-newsletter-promo-checkout-validation-01`
- `npm run smoke:revenue-os-newsletter-promo-checkout-validation-01`
- `npm run build`

## Notes / follow-up

Only `servicios_base_monthly` was added to the website-checkout allowlist (QA scope). Other
categories that later adopt the same Revenue OS website checkout standard (e.g. Bienes) may
need the same one-line allowlist addition; tracked as a follow-up to avoid changing other
category runtime in this micro patch.

## READY TO COMMIT

See final audit in the task response.
