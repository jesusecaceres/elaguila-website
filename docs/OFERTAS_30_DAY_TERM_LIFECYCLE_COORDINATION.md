# Ofertas 30-Day Term Lifecycle Coordination

## Existing Behavior

Category-local Ofertas code stores and reads `valid_from`, `valid_until`, `submitted_at`, `updated_at`, and `published_at` where available. Public offer and product queries use the category helpers `isOfertaLocalPublicOfferRowEligible` and `isOfertaLocalPublicSearchRowEligible`, which require parent `status = 'approved'` and exclude rows whose effective `valid_until` is expired.

Admin approval in `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts` sets `status = 'approved'` and `published_at = now`, but it does not calculate or write a canonical 30-day `expires_at`. Owner and public displays still present the stored validity dates.

Current category files involved:

- `app/api/ofertas-locales/publish/route.ts`
- `app/api/ofertas-locales/admin/[id]/review/route.ts`
- `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts`
- `app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesFormatting.ts`

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
