# RESTAURANTES-P0F — Dashboard Edit Coupon Route + Image Persistence

## Executive summary

P0F closes the remaining Restaurante dashboard gap: **Editar restaurante** now opens an explicit **listing-edit** context so owners update a published listing without re-entering the $399 base checkout. Inside that form, inactive coupon/offers modules explain value and route to the same **$99/mo add-on-only** Stripe path. Coupon titles, codes, descriptions, links, flyer, and **images** persist through draft → blob upload → publish → public shell.

## Live issue from Chuy's QA

- Outside `/dashboard/restaurantes`: inactive listings show **Destacar ofertas +$99/mes** (Stripe $99 only); active listings show **Editar ofertas**.
- **Editar restaurante** previously routed to plain `/publicar/restaurantes?lang=es`, behaving like a new application and showing **$399 + $99 ($498)** at preview/payment.
- Public coupon cards showed text but images displayed **Sin foto aún** when coupon images were not converted to durable remote URLs before publish.

## Dashboard outside CTA vs inside edit-form CTA

| Context | Inactive module | Active module |
|--------|-----------------|---------------|
| Dashboard card | Destacar ofertas +$99/mes → add-on-only Stripe | Editar ofertas → coupon-edit form |
| Inside listing-edit form | Module card + Destacar ofertas +$99/mes → add-on-only Stripe | Coupon fields + Guardar ofertas (no Stripe) |

## Existing listing edit mode rules

- Route: `/publicar/restaurantes?source=dashboard&mode=listing-edit&listingId=…&returnPanel=restaurantes&lang=es`
- Modes: `listing-edit` (full edit), `coupon-edit` (offers only), `coupon-addon` (post-checkout focus)
- **Never** auto-set `couponUpgradeEnabled=true` before payment
- Save via publish API after `resolveRestauranteDraftMediaToRemoteUrls` — **no $399 base checkout**
- Final action: **Guardar cambios del restaurante** (not Continuar al pago seguro)

## New application rules

- Unchanged: `/publicar/restaurantes?lang=es` may show $399 base + optional $99 coupon module at preview/payment
- User may opt into coupon module locally before checkout (not fake activation on dashboard)

## Why $399 must be blocked in dashboard edit mode

Published listings already paid the base plan. Re-opening the generic application path treated edits as new submissions and surfaced base-plan pricing. `isExistingDashboardListingMode` blocks `goPreview()` and replaces preview/payment CTAs with direct save.

## Why couponUpgradeEnabled cannot be set before payment

Setting `couponUpgradeEnabled=true` locally would unlock coupon fields and include coupon data in save paths without entitlement proof, and could imply paid add-on status on the public listing. Entitlement is set only after Stripe webhook fulfillment for `restaurantes_offers_addon`.

## Coupon image persistence chain

1. **Upload (form):** `uploadCouponImage` → `draft.coupons[index].imageUrl` (data URL)
2. **Draft storage:** `restauranteDraftMedia.ts` offloads data URLs to IndexedDB refs (`|cp|`)
3. **Before publish/save:** `resolveRestauranteDraftMediaToRemoteUrls` → `restauranteDraftPublishPrepare.ts` uploads coupon slots to Blob (`slot: "coupon"`, `coupon_flyer`)
4. **Payload:** `buildRestaurantePublishPayload.ts` includes `imageUrl` per coupon when `couponUpgradeEnabled === true`
5. **DB:** publish route stores full draft in `listing_json`
6. **Public:** `mapRestauranteDraftToShell.ts` → `RestauranteShellCouponsBlock.tsx` renders `coupon.imageUrl`
7. **Re-open:** dashboard hydrate via `mergeRestauranteDraft(listing_json)` restores remote URLs into the form

## Files inspected

- `app/(site)/dashboard/restaurantes/page.tsx`
- `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/restaurantes/application/restauranteDraftPublishPrepare.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteDraftTypes.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts`
- `app/api/clasificados/restaurantes/publish/route.ts`
- `app/(site)/clasificados/restaurantes/shell/RestauranteShellCouponsBlock.tsx`

## Files changed

- `app/(site)/dashboard/restaurantes/page.tsx` — listing-edit route context
- `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts` — copy + href helpers
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx` — modes, payment guard, inside-form CTA, save path
- `scripts/verify-restaurantes-p0e-dashboard-coupon-cta-copy-clarity.mjs` — updated copy expectations
- `scripts/verify-restaurantes-p0f-dashboard-edit-coupon-route-image-persistence.mjs` — new verifier
- `package.json` — P0F script
- `docs/restaurantes-p0f-dashboard-edit-coupon-route-image-persistence.md` — this doc

## What was protected

- Stripe pricing unchanged
- Webhook raw body/signature handling unchanged
- Supabase schema/migrations untouched
- Servicios, Autos, Bienes Raíces, Rentas, Empleos, En Venta, admin, global nav untouched
- New application $399 + optional $99 flow unchanged

## Manual QA checklist

- [ ] Dashboard inactive listing shows **Destacar ofertas +$99/mes**
- [ ] Dashboard active listing shows **Editar ofertas**
- [ ] **Editar restaurante** opens listing-edit URL with `listingId`
- [ ] In listing edit mode, coupon section explains offers/coupons
- [ ] In listing edit mode inactive coupon CTA opens Stripe **$99 only**
- [ ] No **$399** base appears from dashboard listing edit
- [ ] After payment, listing shows **Editar ofertas**
- [ ] **Editar ofertas** opens coupon fields
- [ ] Add coupon text and images
- [ ] Save
- [ ] Reopen from dashboard and confirm coupon images are still visible
- [ ] Open public restaurant ad and confirm coupon images render
- [ ] Normal new application still shows **$399 + optional $99**

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Editar restaurante routes with listing-edit context | TRUE |
| listingId preserved | TRUE |
| owner_user_id filter preserved | TRUE |
| Dashboard CTA copy Destacar ofertas / Editar ofertas | TRUE |
| No fake couponUpgradeEnabled before payment | TRUE |
| Dashboard edit excludes $399 base | TRUE |
| Coupon image persistence pipeline wired | TRUE |
| Stripe/webhook/schema untouched | TRUE |
