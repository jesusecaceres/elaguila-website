# REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-02

Micro-scoped Revenue OS patch — fix subscriber-identity false rejection for newsletter-origin
payment discount promos at checkout.

## Objective

Live QA on Servicios checkout rejected `LX-NEWS-SQESAR` with:
"Este código promocional no es válido para este pago. (Este código requiere identidad de suscriptor.)"
even though Admin shows Subscriber identity = No and Can discount payment = Yes.

Make newsletter-origin promos validate as general Leonix website payment discounts when active,
payment-discount eligible, and scoped to Any category / Any package.

## Task classification

MICRO PATCH / SCOPED REVENUE OS VALIDATION FIX.

## Files inspected

- `app/lib/listingPlans/revenuePromoValidation.ts`
- `app/lib/listingPlans/revenuePromoRedemptions.ts`
- `app/lib/listingPlans/promoCodeRules.ts`
- `app/api/revenue-os/promo/validate/route.ts`
- `app/api/revenue-os/checkout/route.ts`
- `app/api/newsletter/subscribe/route.ts`
- `app/admin/(dashboard)/workspace/promo-codes/actions.ts`
- validation-01 docs/scripts (read-only reference)

## Files changed

- `app/lib/listingPlans/revenuePromoRedemptions.ts`
  - `resolvePromoRequiresSubscriberIdentity`: newsletter/SMS origin no longer requires identity
    at checkout; legacy delivery-assignment `subscriber_identity_required` does not block Apply.
    Explicit `checkout_subscriber_identity_required` still gates checkout when set.
  - `resolveWebsiteLaunch25Rejection`: skips package allowlist when category + package scopes
    are unrestricted (Any category / Any package).
- `app/lib/listingPlans/promoCodeRules.ts`
  - Exported `promoScopeIsUnrestricted` + `PROMO_SCOPE_WILDCARD_TOKENS` for shared scope truth.
- `package.json`, v02 verifier/smoke scripts, this doc.

## Exact root cause

Validation-01 added a subscriber-identity gate reading `metadata.subscriber_identity_required`
and `metadata.promo_rule.requires_subscriber_identity`. Newsletter codes are created with
`subscriber_identity_required: true` for delivery/assignment tracking (newsletter subscribe route
and admin newsletter create both set it). That flag was incorrectly interpreted as "checkout
must prove subscriber email before Apply" — causing the live rejection even when Admin shows
Subscriber identity = No and checkout payload is otherwise correct.

## Corrected promo doctrine

- Newsletter/SMS = acquisition channel, not a payment restriction.
- Assigned/private + delivery email = tracking metadata, not a checkout gate.
- Subscriber identity blocks checkout ONLY when explicitly required via
  `checkout_subscriber_identity_required` (or explicit false opt-out on non-newsletter codes).
- Any category + Any package = global website checkout eligibility (no Launch-25 allowlist cap).
- `can_discount_payment` must be true; redemption remains webhook-only; one promo per checkout.

## Servicios $498 / 25% result

subtotalCents 49800 → discountCents 12450 → totalCents 37350 ($373.50/mes).

## Invalid protections preserved

Inactive/revoked, payment-discount disabled, expired, category/package mismatch when scope is
specific, and explicit checkout identity-required without identity all still reject.

## READY TO COMMIT

See final audit in task response.
