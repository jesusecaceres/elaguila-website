# Ofertas Stripe and Entitlement Coordination

## Scope

This is an implementation handoff only. Package 3 does not modify Stripe, checkout, webhooks, listing plans, Revenue OS, or entitlement code.

## Product 1

Recommended key:

```text
ofertas_locales_interactive_flyer_30d_ai_included
```

Contract:

- Name: Ofertas / Interactive Flyer
- Price: `$399`
- Price cents: `39900`
- Currency: `usd`
- Duration: `30` days
- AI included: `true`
- Public flyer: `true`
- Searchable reviewed products: `true`
- No separate AI line item.

## Product 2

Recommended key:

```text
ofertas_locales_coupons_30d_ai_included
```

Contract:

- Name: Cupones
- Price: `$199`
- Price cents: `19900`
- Currency: `usd`
- Duration: `30` days
- AI included: `true`
- Public coupon: `true`
- No cart/list feature entitlement.
- No separate AI line item.

## Required Metadata

Checkout/session/fulfillment metadata must include trusted server-derived values:

- `category`
- `selected_product_key`
- `lane`
- `canonical_listing_id`
- `owner_user_id`
- `duration_days`
- `price_cents`
- `currency`
- `ai_included`
- `parent_listing_id`
- `draft_identity`
- `source_asset_identity` when required
- `checkout_session_id`
- `payment_status`
- `fulfillment_status`
- `entitlement_id`

Do not trust client-supplied price, duration, currency, owner, or entitlement fields.

## Boundaries

Checkout initiation:

- Category app may request checkout readiness for a specific parent/draft.
- Shared checkout must calculate price server-side.
- No fake success before Stripe confirms payment.

Webhook fulfillment:

- Stripe webhook is the source of paid fulfillment.
- Fulfillment must be idempotent by Stripe session/payment intent and canonical listing ID.
- Duplicate checkout attempts must not create duplicate active entitlements for the same parent/lane.

Failed/cancelled payment:

- Parent remains private.
- Owner sees payment not complete or submission not ready, only if backed by real state.
- No public visibility is granted.

Payment success:

- Entitlement becomes fulfilled or ready.
- Submission/review remains separate from payment success.
- Public term should start at approval/publication, not checkout payment time.

Refund/cancellation:

- Shared Revenue OS must define whether current public visibility ends immediately, at term end, or enters admin review.
- Owner and admin dashboards must not claim an active entitlement if refund invalidates it.

## Entitlement Start Vs Public Term Start

Recommended rule:

- Entitlement readiness starts at successful payment.
- Public advertising term starts at approval/publication.
- Rejection does not consume public term.
- Replacement/review after approval must preserve or pause remaining time only by shared policy.

## Owner/Admin Visibility

Owner surfaces may show payment/entitlement only after shared storage exists. Admin surfaces may show readiness and fulfillment IDs once available. Package 3 intentionally does not show fake payment, analytics, or entitlement counts.

## Shared Files Likely Involved

- `app/lib/listingPlans/revenueCheckout.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`
- `app/lib/listingPlans/revenueCategoryCheckoutClient.ts`
- `app/lib/listingPlans/revenueStripe.ts`
- `app/lib/listingPlans/revenueEntitlementFulfillment.ts`
- `app/lib/listingPlans/revenueEntitlements.ts`
- `app/lib/listingPlans/packageEntitlements.ts`
- `app/lib/listingPlans/entitlementActivationContract.ts`
- `app/lib/listingPlans/listingPackageEntitlementsServer.ts`
- `app/api/checkout/**`
- `app/api/webhooks/**`
- Revenue OS verification scripts under `scripts/verify-stripe-revenue-os-*`

## Explicit Prohibitions

- No `$598`.
- No separate AI Stripe product.
- No optional AI metadata.
- No manual/basic product.
- No client-supplied price trust.
- No duplicate fulfillment.
- No fake payment success.

## Tests

- Checkout creates `$399` Ofertas session with AI included metadata.
- Checkout creates `$199` Cupones session with AI included metadata.
- Webhook fulfillment is idempotent.
- Duplicate checkout for same parent is blocked or reconciled.
- Failed/cancelled payment keeps parent private.
- Successful payment alone does not make listing public.
- Approval without fulfilled entitlement is blocked once shared contract is active.
- Refund policy updates entitlement/public state truthfully.
- Sandbox QA covers both products and webhook replay.
