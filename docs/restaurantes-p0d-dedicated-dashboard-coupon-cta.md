# Restaurantes P0D — Dedicated Dashboard Coupon CTA

Gate: `RESTAURANTES-P0D-DEDICATED-DASHBOARD-COUPON-CTA-ADDON-ONLY-MODE`  
Date: 2026-07-06

## Executive Summary

Adds separate coupon upgrade/edit CTAs to `/dashboard/restaurantes` (the live dedicated Restaurante dashboard), distinct from **Editar restaurante**. Inactive add-on listings get **Agregar cupones +$99/mes** (direct $99-only Stripe checkout). Active add-on listings get **Editar cupones** (coupon-only edit mode, no base payment).

## Live QA problem

On `/dashboard/restaurantes?lang=es`, cards showed only generic actions (Ficha pública, Formulario, Editar restaurante). Coupon module CTAs were missing. **Editar restaurante** loaded the full listing into `/publicar/restaurantes`, which showed initial application pricing ($399 + $99).

## Root cause

1. Dedicated dashboard query did not select `listing_json` → could not detect `couponUpgradeEnabled`.
2. Card actions were hardcoded without coupon upgrade/edit.
3. `loadIntoForm()` is the correct path for normal edits but was the only edit path — no separate coupon module flow.

## Dedicated dashboard vs Mis anuncios

| Page | Purpose |
|------|---------|
| `/dashboard/restaurantes` | Primary Restaurante owner hub (Chuy’s screenshot) |
| `/dashboard/mis-anuncios?cat=restaurantes` | Cross-category inventory; P0C wired coupon CTAs here |

Both now share the same coupon helpers; dedicated page returns to `/dashboard/restaurantes` after checkout/edit.

## Why Editar restaurante must remain

Owners still need full listing edits (hours, phone, gallery, menu) without triggering payment. **Editar restaurante** hydrates the full draft and opens normal application mode — unchanged.

## Why Agregar cupones +$99/mes must be separate

Coupon module is a paid add-on on an **existing** published listing. It must not reuse the new-application checkout ($399 base). Separate CTA calls `redirectRestauranteDashboardCouponAddonCheckout({ listingId, returnPath: /dashboard/restaurantes })`.

## ListingId / owner identity chain

1. Dashboard query: `.eq("owner_user_id", user.id)` + `listing_json`
2. Upgrade click: bearer token → `/api/revenue-os/checkout` → `validateRestauranteAddonOnlyListingOwnership()`
3. Edit hydrate: `.eq("owner_user_id", userId)` after auth
4. Webhook: payment `owner_user_id` must match listing row

## Add-on-only checkout contract

- Package: `restaurantes_offers_addon` ($99/mo)
- Excludes: `restaurantes_base_monthly`
- Requires: existing `listingId`, authenticated owner
- Return: `/dashboard/restaurantes?lang=…`

## Coupon edit active-state behavior

**Editar cupones** → `hydrateRestauranteListingForCouponEdit()` → `/publicar/restaurantes?mode=coupon-edit&listingId=…&returnPanel=restaurantes` → section G → **Guardar cupones** (no Stripe, no $399 base).

## `/publicar/restaurantes` dashboard coupon context

- `mode=coupon-edit` (or legacy `dashboard-edit`): edit banner, save only
- `mode=coupon-addon` (or legacy `dashboard-addon`): $99-only checkout banner
- `returnPanel=restaurantes`: back links return to dedicated dashboard
- Normal `/publicar/restaurantes?lang=es`: unchanged new application

## Files inspected

`dashboard/restaurantes/page.tsx`, coupon checkout helper, mis-anuncios (prior gate), application client, Revenue OS checkout/fulfillment, verifiers.

## Files changed

- `app/(site)/dashboard/restaurantes/page.tsx` — listing_json, coupon CTAs, owner-safe hydrate
- `restaurantesDashboardCouponAddonCheckout.ts` — returnPath override, `coupon-edit`/`coupon-addon` modes, `buildDashboardRestaurantesReturnPath`
- `RestauranteApplicationClient.tsx` — mode aliases, returnPanel, edit banner copy
- P0C verifier mode string update, P0D verifier + doc

## What was not touched

Stripe webhook raw signature, Supabase schema, Servicios/other categories, preview shell layout, application step structure (minimal context only).

## Manual QA checklist

1. Login → `/dashboard/restaurantes?lang=es`
2. Confirm **Editar restaurante** still on each card
3. Inactive coupon listing → **Agregar cupones +$99/mes**
4. Click → Stripe **$99/mo only** → cancel → return to `/dashboard/restaurantes`
5. After paid add-on → **Editar cupones**
6. Edit coupons → no $399 base → save → return to dashboard
7. New Restaurante application still base + optional add-on

## TRUE/FALSE audit

See final gate report; automated verifiers must pass.

## Next Gate Recommendation for shared dashboard upgrade framework

Extract shared `buildRestauranteDashboardCardActions(row, { panel: 'restaurantes' | 'mis-anuncios' })` so both `/dashboard/restaurantes` and mis-anuncios use one action builder with panel-specific return paths. Add category-agnostic owner validation helper for future Servicios/Viajes add-ons.
