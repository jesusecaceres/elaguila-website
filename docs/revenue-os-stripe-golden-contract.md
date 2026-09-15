# Revenue OS / Stripe Golden Contract

Gate: `REVENUE-OS-STRIPE-GOLDEN-CONTRACT-01`
Date: 2026-09-15

## Executive summary

Production Servicios checkout was down on **both** Leonix discount paths at once — the automatic
verified-intro 15% and the staff finite-term promo code — from two independent, proven Stripe
integration bugs. Both are fixed; this doc locks the commercial contract and the fix so neither
regresses silently. Run `scripts/verify-revenue-os-stripe-golden-contract.ts` before touching any
file listed under "Protected files" below.

## What broke, proven with live Stripe evidence

**A — verified intro (automatic, no promo code).** `stripe.coupons.create` rejected the coupon's
`name` field with `Invalid string: ...; must be at most 40 characters` (the string was 46 chars).
The helper's own fail-closed design caught this correctly and returned a structured 503
(`verified_discount_temporarily_unavailable`) — but the discount could never actually provision.

**B — staff finite-term promo code.** The checkout-session builder always sent
`allow_promotion_codes: false` in the same request as a server-attached `discounts` array. Stripe
rejects the two keys being present together at all (regardless of value):
`You may only specify one of these parameters: allow_promotion_codes, discounts.` This call had no
error boundary, so the exception escaped uncaught and produced a raw, **empty HTTP 500** instead of
any structured failure.

Bug B is shared code (`app/lib/listingPlans/revenueStripe.ts`) — it would have hit verified-intro
too, immediately after bug A's coupon name was fixed. Both had to be fixed together to actually
unblock checkout.

## Golden commercial contract (do not reopen without explicit PM approval)

- Servicios base: **$399.00/month** (`servicios_base_monthly`, 39900 cents), `monthly_subscription`.
- Verified intro: **15% off the first payment only**, automatic, server-derived eligibility, Stripe
  mechanism `duration: "once"`. First payment **$339.15**, every renewal **$399.00**.
- Staff finite-term promo, locked tiers only: 10%/3mo, 15%/6mo, 20%/12mo, 25%/12mo (owner approval).
  Stripe mechanism `duration: "repeating"` + `duration_in_months`. Example (20%/12mo): **$319.20**
  for months 1–12, **$399.00** from month 13 — Stripe's own coupon expiry ends the discount; the app
  never manually reverts the price.
- Promo code and verified intro can never stack — rejected with `409 discount_conflict` before
  either discount path runs.
- Coupons are fixed-id, idempotent, reused across unlimited subscriptions — never per-customer,
  never recreated. A same-id coupon with the wrong shape is never trusted (fail-closed).
- Coupon `name` must stay ≤ 40 characters (Stripe's hard limit on `coupons.create`) — the verifier
  checks every locked tier's generated name length, not just the current four.
- Editing an active, already-entitled Servicios listing never re-triggers a base charge
  (`REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS` / `requiresBaseCheckout`).

## Stripe session-builder invariant (the root cause of bug B)

`allow_promotion_codes` and a server-attached `discounts` array must never both be present on the
same Checkout Session params object — Stripe rejects the request outright if they are, independent
of `allow_promotion_codes`'s value. `createRevenueStripeCheckoutSession` picks exactly one.

## Error boundary

Every Stripe provisioning call on the checkout path (coupon retrieve/create, checkout session
create) is wrapped in try/catch and returns a structured `{ok:false, code, message}` — never lets a
raw Stripe exception escape into an empty 500. Each catch logs sanitized, non-sensitive diagnostics
only (`type`, `code`, `param`, `statusCode`, `requestId`) — never the Stripe error's `.message`
(which can echo request context), never a key, never a secret, never the request body.

## Production webhook (separate, also required for fulfillment)

Production has no Stripe TEST webhook endpoint of its own — the only existing TEST endpoint points
at a Preview branch URL, which is why `STRIPE_WEBHOOK_SECRET` exists only in Vercel's Preview scope.
Required production endpoint: `https://leonixmedia.com/api/revenue-os/webhook`, TEST mode, exactly
these events: `checkout.session.completed`, `checkout.session.expired`, `invoice.paid`,
`invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`,
`charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`. Creating a webhook endpoint
generates a new signing secret — an action Claude Code's own tooling permission model blocks
outright (a "secret-store write"), so this is an owner action; see the release report for exact
steps. Never reuse the Preview endpoint's secret for Production — signing secrets are
endpoint-specific.

## Protected files — changes here require the regression gate

Run `node node_modules/tsx/dist/cli.mjs scripts/verify-revenue-os-stripe-golden-contract.ts` after
touching any of:

- `app/api/revenue-os/checkout/route.ts`
- `app/api/revenue-os/webhook/route.ts`
- `app/lib/listingPlans/revenueStripe.ts`
- `app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts`
- `app/lib/listingPlans/contractTermStripeCoupon.ts`
- `app/lib/listingPlans/promoContractTermBilling.ts`
- `app/lib/listingPlans/revenueWebhook.ts`
- `app/lib/listingPlans/revenuePricingMatrix.ts` (Servicios rows)

This is a regression lock, not a prohibition on legitimate future business changes (new tiers, new
categories, new amounts) — those still require updating this doc and the verifier's locked
expectations deliberately, not silently.

## Known separate residual (not payment authority)

`[newsletter] lookup failed { code: '42703' }` — Postgres "undefined column" on
`leonix_newsletter_subscribers.unsubscribe_token` / `unsubscribe_token_expires_at`, both genuinely
absent from the live table while `app/lib/leonix/leadCaptureServer.ts` reads and writes them. This
is a missing migration, unrelated to Stripe/checkout, and was not applied — flagged for owner
approval, not fixed here.
