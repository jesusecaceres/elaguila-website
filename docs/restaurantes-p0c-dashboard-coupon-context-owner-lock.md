# Restaurantes P0C — Dashboard Coupon CTA, Listing Context, Owner Lock

Gate: `RESTAURANTES-P0C-DASHBOARD-COUPON-CTA-LISTING-CONTEXT-OWNER-LOCK`  
Date: 2026-07-06

## Executive Summary

Fixes missing dashboard coupon CTAs (`Agregar cupones +$99/mes` / `Editar cupones`), hardens add-on-only checkout with server-side listing ownership validation, and adds listing context to dashboard coupon edit/add-on URLs so existing listings never fall back to initial $399+$99 application checkout.

## Live QA Problem

- Dashboard Restaurante cards showed only generic actions (Ver público, Administrar anuncio, Vista previa).
- Coupon upgrade/edit buttons were built but stripped by a href-only action filter.
- Forcing `/publicar/restaurantes?focus=coupon-upgrade` without `listingId` opened initial application checkout ($399 + $99).

## Root Cause

1. **`buildInventoryListingActions()`** ended with `actions.filter((action) => Boolean(action.href))`, removing onClick-only coupon actions.
2. **`restauranteCouponEditHref()`** omitted `listingId`, `mode`, and return context.
3. **`/api/revenue-os/checkout`** did not verify `restaurantes_public_listings.owner_user_id === bearer user` before Stripe for add-on-only purchases.

## Login User ID Ownership Chain

| Step | Check |
|------|--------|
| Dashboard upgrade click | `startRevenueCategoryCheckout()` sends Supabase session bearer token |
| Checkout route | `getBearerUserId(request)` → required for add-on-only |
| Pre-Stripe gate | `validateRestauranteAddonOnlyListingOwnership()` — listing exists, published, owned by bearer, add-on not already active |
| Payment record | `ownerUserId` forced to bearer for add-on-only (never trusts body alone) |
| Webhook fulfillment | `activateRestauranteCouponAddonFromRevenueOs()` compares payment `owner_user_id` to listing row |
| Coupon edit hydrate | Browser query `.eq("owner_user_id", userId)` after auth |

## Dashboard CTA Bug

Coupon actions were pushed when eligible but filtered out at return. Fix:

```ts
return actions.filter((action) => Boolean(action.href) || Boolean(action.onClick));
```

`DashboardListingActionBar` already renders `onClick` buttons.

## Listing Context Requirements

| Flow | CTA | Behavior |
|------|-----|----------|
| No coupon module | Agregar cupones +$99/mes | Direct `redirectRestauranteDashboardCouponAddonCheckout({ listingId, leonixAdId })` — no `/publicar/restaurantes` |
| Active coupon module | Editar cupones | Hydrate owner listing → `/publicar/restaurantes?mode=dashboard-edit&listingId=…&focus=coupon-upgrade&source=dashboard` |

## Server Owner Validation

For `category=restaurantes` + `packageKey=restaurantes_offers_addon`:

- 401 if no bearer user
- 404 if listing missing
- 403 if `owner_user_id` mismatch
- 409 if `couponUpgradeEnabled` already true
- 422 if listing not published
- No payment record or Stripe session on failure

## Dashboard Add-on-only Checkout Contract

- Package: `restaurantes_offers_addon` ($99/mo)
- Excludes: `restaurantes_base_monthly`
- Requires: existing `listingId`, authenticated owner
- Return: `/dashboard/mis-anuncios?lang=…&category=restaurantes`

## `/publicar/restaurantes` Dashboard Context Handling

- `mode=dashboard-addon` + `listingId`: banner + $99-only checkout button (fallback if URL opened directly)
- `mode=dashboard-edit` + `listingId`: edit banner, section G save (no base checkout), no preview payment path
- Missing `listingId` with `source=dashboard`: safe error — no checkout

## Webhook/Fulfillment Safety

Add-on-only fulfillment updates existing listing `listing_json.couponUpgradeEnabled = true` only after verified payment. Owner mismatch between payment record and listing blocks activation.

## Files Inspected

Dashboard mis-anuncios, inventory, category tools, action bar, coupon checkout helper, Revenue OS checkout client/route, fulfillment, application client, prior verifiers/docs.

## Files Changed

- `dashboardMisAnunciosCategoryTools.ts` — keep onClick actions in filter
- `restaurantesDashboardCouponAddonCheckout.ts` — owner-safe hydrate, contextual edit/addon hrefs
- `mis-anuncios/page.tsx` — edit href with listingId
- `revenueCheckout.ts` — `validateRestauranteAddonOnlyListingOwnership()`
- `checkout/route.ts` — pre-Stripe owner gate, force bearer ownerUserId for add-on-only
- `revenueRestaurantFulfillment.ts` — payment/listing owner match on activation
- `revenueFulfillment.ts` — pass ownerUserId to addon activation
- `RestauranteApplicationClient.tsx` — dashboard context banners, $99-only addon checkout, edit save
- `package.json`, verifier script, this doc

## What Was Not Touched

Stripe webhook raw body/signature, Supabase schema/migrations, Servicios, other categories, Restaurante preview shell layout, application step structure (minimal context only).

## Manual QA Checklist

1. Log in as listing owner → Dashboard → Mis anuncios → Restaurantes.
2. Inactive coupon listing shows **Agregar cupones +$99/mes**.
3. Click → Stripe shows **$99/mo only** (no $399 base).
4. Cancel → dashboard-safe return.
5. After paid add-on, same listing shows **Editar cupones**.
6. Edit → upload coupon image → **Guardar cupones** → hard refresh public ad.
7. Another user / logged out: tampered `listingId` on checkout returns 403/401 — no Stripe session.
8. New Restaurante application still charges base + optional add-on.

## TRUE/FALSE Audit Table

See gate report in task output; all automated verifiers must pass.

## Next Gate Recommendation for Shared Dashboard Upgrade Framework

Extract a reusable `buildDashboardAddonCheckoutAction()` pattern:

- Category-specific eligibility on inventory rows
- onClick + href-safe action filter (shared helper)
- Server `validateListingOwnershipForAddonCheckout(category, listingId, bearerUserId)`
- Contextual edit href builder with `mode`, `listingId`, `returnPath`
- Shared verifier assertions for onClick retention + owner gate ordering

Categories with future dashboard add-ons (Servicios, Viajes) should adopt the same contract before exposing paid upgrade CTAs.
