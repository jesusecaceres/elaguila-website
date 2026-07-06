# Restaurantes P0 — Coupon add-on published parity

## 1. Executive Summary

Paid Restaurante coupon module data was lost at **pending publish** because `buildRestaurantePublishPayload()` never included `couponUpgradeEnabled`, `coupons`, `couponFlyer`, or `couponMoreOffers`. Stripe checkout and webhook activation worked, but `restaurantes_public_listings.listing_json` stored an incomplete draft without coupon content. This gate preserves coupon add-on truth from application → pending row → webhook → public detail render.

## 2. Live QA Problem

- Application and preview showed the coupon module.
- Stripe charged base + `restaurantes_offers_addon` (+$99/mo).
- After successful payment/webhook, the published public ad did **not** show coupons.

## 3. Root Cause

`buildRestaurantePublishPayload()` omitted all coupon fields. Pending save before checkout wrote `listing_json` without coupon rows or `couponUpgradeEnabled`, so live mapping (`listingJsonToDraft` → `mapRestauranteDraftToShellData`) had nothing to render after activation.

## 4. Coupon Data Model

| Layer | Fields |
|-------|--------|
| Application flag | `couponUpgradeEnabled`, `couponMonthlyPrice` |
| Coupon rows | `coupons[]`: `title`, `description`, `couponCode`, `expirationDate`, `redemptionNote`, `imageUrl`, `url`, `ctaLabel` |
| Section extras | `couponFlyer.imageUrl`, `couponMoreOffers.url`, `couponMoreOffers.buttonLabel` |
| Storage | `restaurantes_public_listings.listing_json` (full draft blob) |
| Checkout add-on | `restaurantes_offers_addon` (+$99/mo) |
| Payment metadata | `restaurant_coupon_addon_selected`, `restaurant_offers_addon_package_key`, `add_ons` |

## 5. Pending Publish Fix

- `buildRestaurantePublishPayload()` now includes coupon add-on flag and content when `couponUpgradeEnabled === true`.
- `mergeRestauranteDraft()` normalizes/restores coupon fields from `listing_json`.
- Publish route unchanged structurally; still stores full draft via `draftToRestaurantePublicListingInsert`.

## 6. Checkout / Stripe Add-on Truth

Unchanged in this gate (already correct):

- Preview sends `addOns: [{ key: "restaurantes_offers_addon", quantity: 1 }]` when selected.
- Payment record metadata stores add-on snapshot.

## 7. Webhook Fulfillment Contract

- `activatePaidRestauranteListingFromRevenueOs()` still only flips status to `published` (no fake paid state).
- On activation, merges `couponUpgradeEnabled` from payment metadata into `listing_json`.
- If add-on not paid, strips coupon content from `listing_json` (no fake entitlement).

## 8. Public Render Contract

- Public detail reads `listing_json` → `mapRestauranteDraftToShellData()`.
- Coupon section renders only when `couponUpgradeEnabled === true` and at least one meaningful coupon row/flyer/more-offers link exists.
- Section title: **Cupones y ofertas destacadas** / **Featured coupons & offers**.
- Not sourced from public Ofertas Locales CMS.

## 9. Preview vs Live Parity

Both use `mapRestauranteDraftToShellData()` from the same draft shape. Preview draft (browser) and published `listing_json` now share coupon fields after pending save.

## 10. Dashboard Future Hook

Published listings store `couponUpgradeEnabled` + `coupons[]` inside `listing_json`. Future dashboard upgrade/edit can read and mutate the same fields without a new schema column.

**TODO (dashboard gate):** `RESTAURANTES-DASHBOARD-COUPON-ADDON-UPGRADE-EDIT-01`

## 11. Files Inspected

Application, preview, publish payload/route, listing mapper, Revenue OS checkout/payment/fulfillment, public `[slug]` detail, coupon shell block, existing verifiers/docs.

## 12. Files Changed

- `buildRestaurantePublishPayload.ts`
- `createEmptyRestauranteDraft.ts` (merge)
- `mapRestauranteDraftToShell.ts`
- `revenueRestaurantFulfillment.ts`
- `revenueFulfillment.ts`
- `RestauranteShellCouponsBlock.tsx`
- `RestauranteAdStoryPreview.tsx`
- `[slug]/page.tsx` (lang pass-through)
- `scripts/verify-restaurantes-p0-coupon-addon-published-parity.mjs`
- `package.json`

## 13. What This Gate Does Not Do

- No dashboard/admin UI
- No Supabase schema migrations
- No Stripe raw body/signature changes
- No Servicios changes
- No visual redesign
- No Ofertas Locales CMS integration

## 14. Manual QA Checklist

- [ ] Open Restaurante application
- [ ] Enable coupon module (`couponUpgradeEnabled`)
- [ ] Fill coupon title, description, code, expiration, image if supported
- [ ] Preview shows coupon section above gallery
- [ ] Continue to checkout — subtotal includes $399 base + $99 add-on
- [ ] Complete Stripe sandbox payment
- [ ] Webhook publishes listing
- [ ] Public `/clasificados/restaurantes/[slug]` shows **Cupones y ofertas destacadas**
- [ ] Repeat with add-off disabled — no coupon section on public ad
- [ ] Confirm no Ofertas Locales checkout confusion
- [ ] Confirm unpaid pending listing stays hidden (`pending_payment`)

## 15. Next Gate Recommendation

**RESTAURANTES-DASHBOARD-COUPON-ADDON-UPGRADE-EDIT-01** — dashboard read/edit of the same `listing_json` coupon fields.
