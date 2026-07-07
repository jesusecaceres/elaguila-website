# SERVICIOS-EDIT-ROUTE-RESTAURANTES-PARITY-HARD-FIX-01

## QA failure (Chuy)

From `https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios`, clicking **Editar anuncio** routed through:

1. `/clasificados/publicar/servicios/checkpoint`
2. `/publicar/servicios?lang=es&product=servicios_profesionales`
3. Blank new Servicios application

That is new-listing checkpoint behavior, not existing-listing edit.

## Why previous URL/hydration standards were not enough

**OWNER-DASHBOARD-GLOBAL-CTA-STANDARD-01** fixed query-param contracts. **OWNER-DASHBOARD-GLOBAL-EDIT-HYDRATION-STANDARD-01** fixed DB hydration in the application client.

The remaining bug: dashboard edit hrefs targeted `/clasificados/publicar/servicios`, whose **server page unconditionally redirects to checkpoint**. Hydration never ran because the user never reached the application with dashboard edit params.

## Restaurante pattern copied

Restaurante dashboard helpers route directly to the application:

```
/publicar/restaurantes?source=dashboard&mode=listing-edit&listingId=...
```

`RestauranteApplicationClient` reads `source`, `mode`, `listingId`, `leonixAdId`, `focus`, `returnPanel`, defines `isExistingDashboardListingMode`, and **blocks new-product initialization** in that mode.

## Root cause

`app/(site)/clasificados/publicar/servicios/page.tsx` (read-only during this gate):

```ts
redirect("/clasificados/publicar/servicios/checkpoint");
```

The working application mount is `app/(site)/publicar/servicios/page.tsx` → `ClasificadosServiciosApplication`.

## Files inspected

- `restaurantesDashboardCouponAddonCheckout.ts` (read-only)
- `RestauranteApplicationClient.tsx` (read-only)
- `serviciosDashboardOffersAddonCheckout.ts`
- `mis-anuncios/page.tsx`, `dashboardInventory.ts`, `dashboardMisAnunciosCategoryTools.ts`
- `dashboard/servicios/page.tsx`
- `ClasificadosServiciosApplication.tsx`
- `clasificados/publicar/servicios/page.tsx` (read-only — checkpoint redirect)

## Files changed

- `serviciosDashboardOffersAddonCheckout.ts` — direct `/publicar/servicios` edit routes; preview stays `/clasificados/publicar/servicios/preview`
- `ClasificadosServiciosApplication.tsx` — Restaurante-style `isExistingDashboardListingMode`; bypass product init
- `scripts/verify-servicios-edit-route-restaurantes-parity-hard-fix-01.mjs`
- `scripts/smoke-servicios-edit-route-restaurantes-parity-hard-fix-01.mjs`
- `package.json` — verifier + smoke scripts
- `docs/servicios-edit-route-restaurantes-parity-hard-fix-01.md`

## Forbidden routes (existing Servicios listings)

- `/clasificados/publicar/servicios/checkpoint`
- `/publicar/servicios?product=servicios_profesionales` (without dashboard listing identity)
- `/clasificados/publicar/servicios` (redirects to checkpoint)
- Any URL missing `source=dashboard` + `mode` + listing identity for dashboard edit

## Allowed routes

| Action | Route |
|--------|-------|
| Listing edit | `/publicar/servicios?lang=…&source=dashboard&mode=listing-edit&listingId=…&listingSlug=…&leonixAdId=…&returnPanel=servicios` |
| Offers edit | `/publicar/servicios?…&mode=offers-edit&focus=coupon-upgrade&…` |
| Offers addon | `/publicar/servicios?…&mode=offers-addon&focus=coupon-upgrade&…` |
| Listing preview | `/clasificados/publicar/servicios/preview?…&preview=listing&…` |

## Mis anuncios fix

Inventory + Mis anuncios already pass `serviciosListingEditHref` / `serviciosOffersEditHref` overrides. Helper now emits direct `/publicar/servicios` URLs so **Editar anuncio** no longer hits checkpoint redirect.

## `/dashboard/servicios` fix

Edit listing and Preview use `serviciosListingEditHref` / `serviciosListingPreviewHref`. **Publish another** still uses checkpoint entry (`/clasificados/publicar/servicios`) — intentional new-listing flow.

## Servicios application dashboard mode fix

- `isExistingDashboardListingMode` from `source=dashboard` + `mode` + listing identity (no `edit=1` required — Restaurante parity)
- Product/checkpoint init skipped when `isExistingDashboardListingMode`
- Existing hydration from `/api/clasificados/servicios/my-listing` unchanged

## Smoke test strategy

Source-level smoke (`smoke:servicios-edit-route-restaurantes-parity-hard-fix-01`) asserts sample href shapes: no checkpoint, no `product=servicios_profesionales`, includes `source=dashboard`, `listingId`, `mode=listing-edit` / `preview=listing`.

## What was protected

- Stripe / webhook / Supabase schema
- Restaurante runtime
- Servicios P0A/P0B coupon + checkpoint rules for **new** listings
- Publish/media guards
- Pause/resume on category dashboard

## Manual QA URLs

1. https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios — Editar anuncio → `/publicar/servicios?…&mode=listing-edit` (no checkpoint, no product param)
2. https://leonixmedia.com/dashboard/servicios?lang=es — Edit listing / Preview direct
3. https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=restaurantes — regression

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Restaurante route pattern inspected | TRUE |
| Servicios helper direct `/publicar/servicios` | TRUE |
| Existing edit avoids checkpoint | TRUE |
| Existing edit avoids product route | TRUE |
| Application dashboard mode bypasses product init | TRUE |
| Mis anuncios + /dashboard/servicios use helper | TRUE |
| Verifier blocks regression | TRUE |

## READY TO COMMIT status

Run `npm run verify:servicios-edit-route-restaurantes-parity-hard-fix-01` and `npm run build` before commit.
