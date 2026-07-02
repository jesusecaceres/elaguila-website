# Restaurantes Revenue OS Webhook Activation — Gate 01

## 1. Executive Summary

Gate **RESTAURANTES-REVENUE-OS-WEBHOOK-ACTIVATION-01** completes the paid Restaurante publish lifecycle by activating the pending restaurant listing after successful Revenue OS webhook fulfillment for `restaurantes_base_monthly`.

Prior gate saved listings as **`archived`** (hidden) before Stripe. This gate flips **`archived` → `published`** only after payment is confirmed via webhook.

## 2. Prior Blocker

From `RESTAURANTES-PENDING-PUBLISH-AND-COUPON-OFFERS-TRUTH-01`:

> Webhook must flip archived → published after payment.

## 3. Revenue OS Webhook Path

1. Stripe `checkout.session.completed` → `POST /api/revenue-os/webhook`
2. Signature verified (unchanged)
3. `fulfillCheckoutSessionCompleted` in `revenueFulfillment.ts`
4. Payment record marked **paid**
5. Package/placement entitlements activated
6. **`activatePaidRestauranteListingFromRevenueOs`** runs for `restaurantes_base_monthly`

Expired sessions use `markCheckoutSessionExpired` — **no** restaurant activation.

## 4. Package Key Used

`restaurantes_base_monthly` — constant `RESTAURANTES_BASE_MONTHLY_PACKAGE_KEY`

Other package keys skip restaurant activation (`skipped_wrong_package`).

## 5. Listing Identity Source

Stable **`listingId`** (UUID) from:

- Pending save: `POST /api/clasificados/restaurantes/publish` with `activation_mode: pending_payment`
- Stored on `leonix_payment_records.listing_id`
- Passed to Revenue OS checkout at payment start

## 6. Restaurant Table/Status Contract

| Table | `restaurantes_public_listings` |
|-------|-------------------------------|
| Pending/hidden | `status = archived` |
| Public-visible | `status = published` |
| Staff-hidden | `status = suspended` (not auto-activated) |

Public RLS: `using (status = 'published')` — archived rows are not public.

Columns updated on activation: `status`, `updated_at`, `published_at` (if null).

No `payment_status` column on restaurant table — payment truth lives in `leonix_payment_records`.

## 7. Activation Helper Behavior

**File:** `app/lib/listingPlans/revenueRestaurantFulfillment.ts`

**Function:** `activatePaidRestauranteListingFromRevenueOs`

| Outcome | Meaning |
|---------|---------|
| `activated` | `archived` → `published` |
| `already_published` | Idempotent no-op |
| `skipped_wrong_package` | Not `restaurantes_base_monthly` |
| `missing_listing_id` | Error — webhook fails (retry) |
| `not_found` | Row missing — webhook fails (retry) |
| `unsafe_status` | e.g. `suspended` — skipped, logged |
| `error` | DB error — webhook fails (retry) |

## 8. Idempotency Rules

- Already **published** → success, no duplicate update
- Concurrent webhook retries use `UPDATE … WHERE status = archived`
- Payment/entitlement idempotency unchanged from Revenue OS base gate

## 9. Expired/Canceled Session Rules

`checkout.session.expired` marks payment expired/canceled only. **Does not** call restaurant activation.

## 10. Audit Logging Result

On successful activation:

- Action: `restaurante_listing_activated_after_payment`
- Target: `restaurantes_public_listings` / `listingId`
- Metadata: `payment_record_id`, `package_key`, `stripe_checkout_session_id`, `stripe_event_id`, `leonix_ad_id`

Failures logged via `revenue_webhook_validation_failed` with `restaurante_activation_*` code.

## 11. Files Inspected

- `revenueFulfillment.ts`, `revenueEntitlementFulfillment.ts`, `revenueWebhook.ts`
- `app/api/revenue-os/webhook/route.ts` (read-only — not modified)
- `restaurantes_public_listings` schema migrations
- Prior Restaurante pending publish docs

## 12. Files Changed

| File | Change |
|------|--------|
| `revenueRestaurantFulfillment.ts` | New activation helper |
| `revenueFulfillment.ts` | Wire helper after entitlement activation |
| `revenueAuditLog.ts` | Add audit action type |

## 13. What This Gate Does Not Do

- No Restaurante UI changes
- No checkout route changes
- No webhook signature/raw-body changes
- No migrations
- No other category activation
- No Ofertas Locales / coupon entitlement
- No client-side paid status
- No fake paid status before webhook

## 14. Manual QA Checklist

- [ ] Restaurante application → preview → $399 checkout
- [ ] Required confirmations → Continue to secure payment
- [ ] Confirm row saved as **archived** before Stripe
- [ ] Complete Stripe sandbox checkout (test card only)
- [ ] Webhook returns 2xx
- [ ] Payment record **paid**
- [ ] Listing entitlement **active**
- [ ] Restaurant listing **published**
- [ ] Public detail page opens
- [ ] No fake paid status before webhook
- [ ] Expired checkout does **not** publish listing
- [ ] Canceled checkout does **not** publish listing

## 15. Next Recommended Gates

1. `PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01`
2. `STRIPE-REVENUE-OS-RESTAURANTES-OFFERS-ADDON-01`
3. `RESTAURANTES-OFERTAS-LOCALES-UPSELL-01`
