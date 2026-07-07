# Restaurantes P0B — Coupon Image + Dashboard Add-on Proof

Gate: `RESTAURANTES-P0B-COUPON-IMAGE-PERSISTENCE-DASHBOARD-ADDON-ONLY-PROOF`  
Date: 2026-07-06

## Executive Summary

Fixes coupon image loss between form upload, draft storage, preview, publish, and public render. Confirms dashboard add-on-only checkout ($99/mo) and adds **Editar cupones** for published listings with active coupon entitlement.

## QA findings from Chuy

1. Initial application checkout (base $399 + optional $99 add-on) works.
2. Revenue OS success/cancel returns safely (prior gate).
3. Coupon text appears in preview; coupon images showed **Sin foto aún** despite upload.
4. Dashboard card exists; $99-only upgrade path needed proof and clearer labels.

## Coupon image root cause

**First loss point:** `restauranteDraftMedia.ts` offloaded hero/gallery/dish images to IndexedDB but **not** `coupons[].imageUrl` or `couponFlyer.imageUrl`. Large data URLs either blew sessionStorage quota (save failed silently) or survived until preview without IDB resolution in the editor.

**Second loss point:** `resolveRestauranteDraftMediaToRemoteUrls()` did not upload coupon images to Blob before publish, so `buildRestaurantePublishPayload()` stripped `data:` URLs from `listing_json`.

## Coupon image fix

1. **IDB offload/inline** for `coupons[].imageUrl` (`|cp|index`) and `couponFlyer.imageUrl` (`|cfly`).
2. **Form preview** uses `RestauranteMediaPreviewImg` to resolve IDB refs in the application UI.
3. **Blob upload** slots `coupon` and `coupon_flyer` in draft-media-upload + publish prepare converts data URLs to HTTPS before checkout/publish.
4. **Publish payload** already includes `imageUrl`; public shell mapper and `RestauranteShellCouponsBlock` render when present.

## Dashboard add-on-only route proof

| State | Dashboard CTA | Checkout |
|-------|---------------|----------|
| Published, no coupon module | **Agregar cupones +$99/mes** | `restaurantes_offers_addon` only ($99/mo) |
| Published, coupon module active | **Editar cupones** | No checkout — hydrate → `/publicar/restaurantes?focus=coupon-upgrade&source=dashboard` |

Includes existing `listingId` + `leonixAdId`; returns to `/dashboard/mis-anuncios?lang=…&category=restaurantes`.

## Initial app vs dashboard checkout

| Flow | Package | Amount |
|------|---------|--------|
| Initial application/preview | `restaurantes_base_monthly` + optional add-on | $399/mo (+ $99/mo if coupon selected) |
| Dashboard upgrade (existing listing) | `restaurantes_offers_addon` only | **$99/mo** |

## Add-on-only fulfillment behavior

Webhook calls `activateRestauranteCouponAddonFromRevenueOs()` — sets `listing_json.couponUpgradeEnabled = true` on the **existing** published row; preserves profile and coupon content; no duplicate listing.

## Owner/entitlement protection

- Dashboard checkout requires auth session (`startRevenueCategoryCheckout`).
- Coupon edit hydrate loads listing via Supabase RLS (owner-scoped).
- Edit blocked unless `couponUpgradeEnabled === true` on listing.
- Publish API rejects heavy `data:` payloads; coupons require HTTPS refs after blob upload.
- Max 4 coupons enforced in draft merge and publish prepare.

## Files inspected

Application, draft media/storage, preview, publish payload, shell mapper, coupons block, dashboard mis-anuncios/inventory, Revenue OS checkout/fulfillment, prior verifiers/docs.

## Files changed

- `restauranteDraftMedia.ts` — coupon IDB offload/inline
- `restauranteDraftPublishPrepare.ts` — coupon blob upload
- `draft-media-upload/route.ts` — coupon slots
- `RestauranteApplicationClient.tsx` — IDB-aware coupon thumbnails
- `restaurantesDashboardCouponAddonCheckout.ts` — labels, edit hydrate
- `dashboardInventory.ts`, `dashboardMisAnunciosCategoryTools.ts`, `mis-anuncios/page.tsx` — CTAs

## What was not touched

Servicios, other categories, Stripe webhook raw body/signature, Supabase schema/migrations, Restaurante preview shell layout, application step structure, public Coming Soon UI.

## Manual QA checklist

1. Open Dashboard/Mis anuncios → Restaurantes → pick published ad (e.g. REST-2026-000005).
2. Without coupon module: confirm **Agregar cupones +$99/mes** → Stripe shows **$99/mo only** (no $399).
3. Cancel → dashboard-safe return.
4. After paid add-on (or test listing with `couponUpgradeEnabled`): **Editar cupones**.
5. Add coupon title/code; upload image; paste URL on second coupon if desired.
6. Preview → confirm image shows (not Sin foto aún).
7. Hard refresh application → image still shows in form.
8. Publish/update → public ad shows coupon image.
9. Initial new-ad checkout still shows $399 + optional $99 add-on.

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Coupon image loss point identified (IDB + publish upload gap) | TRUE |
| Uploaded image persists to draft (IDB) | TRUE |
| Pasted URL persists | TRUE |
| Preview shows real image | TRUE |
| Publish payload carries HTTPS imageUrl | TRUE |
| Dashboard upgrade action exists | TRUE |
| Inactive label: Agregar cupones +$99/mes | TRUE |
| Active label: Editar cupones | TRUE |
| Dashboard checkout $99 only | TRUE |
| Initial application unchanged | TRUE |
| Add-on fulfillment updates existing listing | TRUE |
| No Stripe webhook / schema changes | TRUE |
| No Servicios touched | TRUE |
