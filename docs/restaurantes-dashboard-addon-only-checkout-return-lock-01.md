# Restaurantes Dashboard Add-on-Only Checkout Return Lock 01

Gate: `REVENUE-OS-GLOBAL-RETURN-SAFETY-PLUS-RESTAURANTES-ADDON-ONLY-01`  
Date: 2026-07-06

## Problem

From Dashboard → Mis anuncios, Restaurante coupon upgrade could route owners into the **initial application checkout** showing:

- Restaurante establecido: $399/mo
- Módulo de cupones: +$99/mo
- Total: $498/mo

That is wrong for an **existing published** Restaurante listing. Dashboard upgrade must charge only the coupon add-on.

## Correct initial checkout vs dashboard upgrade checkout

| Flow | Package | Amount |
|------|---------|--------|
| Initial application/preview publish | `restaurantes_base_monthly` + optional `restaurantes_offers_addon` add-on | $399/mo (+ $99/mo if coupon selected in application) |
| Dashboard coupon upgrade (published listing) | `restaurantes_offers_addon` only | **$99/mo only** |

Initial `RestaurantePreviewClient` checkout is unchanged.

## Add-on-only payload

Dashboard checkout sends:

```json
{
  "category": "restaurantes",
  "packageKey": "restaurantes_offers_addon",
  "listingId": "<existing published row id>",
  "leonixAdId": "<when known>",
  "returnPath": "/dashboard/mis-anuncios?lang=es&category=restaurantes"
}
```

Server validation:

- `listingId` required (no draft-only add-on checkout)
- No nested `addOns`
- No `restaurantes_base_monthly`
- Price from `revenuePricingMatrix` only ($99/mo)
- Payment record metadata: `checkout_mode: "addon_only"`, `restaurant_coupon_addon_selected: true`

## Return path

Success/cancel URLs include sanitized `return_to` → `/dashboard/mis-anuncios?lang=…&category=restaurantes`. Launch lock allowlists `/revenue-os` and `/dashboard` so owners are not trapped at Coming Soon.

## Fulfillment behavior

On verified Stripe webhook for `restaurantes_offers_addon`:

- `activateRestauranteCouponAddonFromRevenueOs()` updates **existing** `restaurantes_public_listings` row
- Sets `listing_json.couponUpgradeEnabled = true` only after paid webhook proof
- Preserves existing restaurant profile/coupon content
- Does **not** create a duplicate listing
- Does **not** overwrite full listing JSON

Public coupon section remains data-driven (meaningful coupon content required to render).

## Manual QA

1. Sign in as owner with a **published** Restaurante without `couponUpgradeEnabled`.
2. Open `/dashboard/mis-anuncios?lang=es&category=restaurantes`.
3. Click **Activar módulo de cupones ($99/mes)** on the listing card.
4. Confirm Stripe Checkout shows **$99/mo only** (no $399 base line).
5. Complete sandbox payment → success page → **Volver a mi panel**.
6. After webhook, confirm `listing_json.couponUpgradeEnabled === true` on the same listing id.
7. Confirm initial `/clasificados/restaurantes/preview` checkout still shows $399 (+ optional $99 add-on).

## What was protected

- Restaurante preview shell layout
- Restaurante application step structure
- Stripe webhook raw body/signature handling
- Supabase schema/migrations
- Servicios UI/design (no Servicios files changed)
- Public Coming Soon lock for normal visitors on category browse paths
