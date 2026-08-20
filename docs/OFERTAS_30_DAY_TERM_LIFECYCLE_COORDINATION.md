# Ofertas 30-Day Term Lifecycle Coordination

## Existing Behavior

Package 4B changes category-local Ofertas/Cupones code to store and read `published_at` and `expires_at` as the canonical public advertising term. Public offer and product queries use the category helpers `isOfertaLocalPublicOfferRowEligible` and `isOfertaLocalPublicSearchRowEligible`, which require parent `status = 'approved'`, a present activation timestamp, a present expiration timestamp, and current server time before `expires_at`.

Admin approval in `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts` sets `status = 'approved'`, `published_at = now`, and `expires_at = published_at + 30 days` on the first valid approval transition. Owner and admin displays show activation, expiration, and derived active/expired/incomplete term status. Public cards may still display coupon/flyer validity dates, but those dates no longer consume the paid public advertising term before approval.

Current category files involved:

- `app/api/ofertas-locales/publish/route.ts`
- `app/api/ofertas-locales/admin/[id]/review/route.ts`
- `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts`
- `app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesFormatting.ts`
- `app/lib/ofertas-locales/ofertasLocalesDbSchema.ts`
- `supabase/migrations/20260731222500_ofertas_locales_30_day_public_term.sql`
- `scripts/ofertas-30-day-public-term-audit.mjs`

## Risk

If `valid_until` is treated as the paid term expiration, review delay can consume the customer's public advertising term before the offer is approved. Rejection and correction can also consume time even though the listing remains private.

## Recommended Canonical Rule

The purchased 30-day public term should start when the listing becomes publicly eligible, not when the draft is created, submitted, or paid.

Recommended state contract:

- Payment creates entitlement/readiness.
- Submission enters review.
- Approval/publication begins the public term.
- Expiration is calculated from activation/publication time plus `duration_days`.
- Rejection does not consume the public term.
- Correction/resubmission keeps the same parent identity and remains private until approval.
- Replacement after approval must enter a truthful update-review workflow and must not silently destroy paid public time.

## Package 4B Implementation

- Start event: first successful admin approval/public activation of the parent listing.
- Activation timestamp: `published_at`, written from server time inside the approval mutation.
- Expiration: `expires_at = published_at + 30 days`, calculated server-side with `OFERTAS_LOCALES_PUBLIC_TERM_DAYS = 30`.
- Idempotency: approval update is guarded by the previously fetched status, and approved listings are not valid approval sources.
- Rejection/correction: rejection and owner resubmission do not write `published_at` or `expires_at`.
- Public parent: active public results require approved status, `published_at`, `expires_at`, and current server time before `expires_at`.
- Public child: item search/detail requires approved active child state plus a non-expired parent public term.
- Coupon validity: coupon/promotion validity can end earlier than the parent term, but it cannot extend public visibility after the parent expires.
- Owner/admin: expired records remain visible as history and show truthful public-term state; no renewal/extension control is presented.
- Migration status: committed as a forward-only migration file and not applied by this package.
- Database status: no Supabase connection, database write, or migration application was performed.

## Shared Files Likely Involved

Do not change these in the Ofertas package:

- `app/lib/listingLifecycle/resolveListingLifecycle.ts`
- `app/lib/listingLifecycle/listingLifecycleConfig.ts`
- `app/lib/listingLifecycle/listingLifecycleTypes.ts`
- `app/lib/listingLifecycle/listingRenewalCheckout.ts`
- `app/lib/listingLifecycle/listingRenewalFulfillment.ts`
- `app/lib/listingPlans/packageEntitlements.ts`
- `app/lib/listingPlans/revenueEntitlementFulfillment.ts`
- `app/lib/listingPlans/entitlementActivationContract.ts`
- `app/lib/listingPlans/listingPackageEntitlementsServer.ts`
- Stripe/webhook fulfillment routes that create or activate package entitlements.

## Expected Metadata

Shared fulfillment should persist or derive:

- `category = ofertas_locales`
- `lane = interactive_flyer | coupons`
- `parent_listing_id`
- `owner_user_id`
- `duration_days = 30`
- `payment_status`
- `fulfillment_status`
- `entitlement_id`
- `public_term_starts_at`
- `public_term_ends_at`
- `published_at`
- `expires_at`
- `renewal_parent_id` when renewal exists

## Approval/Fulfillment Interaction

Admin approval should check for a fulfilled entitlement before starting the term. When the entitlement is valid, approval should set the public activation timestamp and compute the 30-day expiration from that timestamp. Rejection should leave entitlement available for correction unless the shared payment policy explicitly says otherwise.

## Expiration Behavior

Public APIs must exclude expired parents and children. Owner dashboards should retain expired listings as historical records. Admin should show expiration/readiness without claiming a live renewal.

## Renewal Behavior

Renewal/republish must not be displayed as live unless a real shared renewal checkout and fulfillment path exists. Renewal should preserve the canonical parent relationship or explicitly create a linked renewal identity according to the shared lifecycle contract.

## Acceptance Tests

- Submission pending review is private and does not start the public term.
- Approval starts the 30-day public term from approval/publication time.
- Rejection does not consume the public term.
- Resubmission of the same parent remains private until approval.
- Expiration removes public visibility while preserving owner access.
- Renewal cannot show as active before real payment fulfillment.
- Public queries use the canonical expiration field once shared lifecycle provides it.
