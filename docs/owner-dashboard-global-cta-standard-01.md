# OWNER-DASHBOARD-GLOBAL-CTA-STANDARD-01

**Gate title:** OWNER-DASHBOARD-GLOBAL-CTA-STANDARD-01

## QA problem from Chuy

From `https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios`, clicking **"Editar anuncio"** for an existing Servicios listing routed like a **new application** (e.g. `/publicar/servicios?lang=es&product=servicios_profesionales`) instead of opening the existing listing in edit mode with identity.

Expected:
```
/clasificados/publicar/servicios?lang=es&edit=1&source=dashboard&mode=listing-edit&listingId=<id>&listingSlug=<slug>&leonixAdId=<adId>&returnPanel=servicios
```

## Why this is global, not only Servicios

"Editar anuncio" must mean the same thing (open the existing listing in application edit mode with identity) in **every** category. Restaurantes already routes correctly through its dashboard helper; Servicios in the global **Mis anuncios** grid was calling the generic `buildInventoryListingActions("servicios", item, lang, q)` with no P0C override, so its edit CTA relied on an action-contract URL that omitted `mode=listing-edit` and `returnPanel=servicios`. This gate standardizes the owner CTA URL contract and wires Servicios through its P0C helper.

## Files inspected

- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts`
- `app/(site)/dashboard/components/DashboardCategoryListingCard.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/categoryDashboardActionContract.ts`
- `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts` (P0C helper)
- `app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts` (reference)

## Files changed

- `app/(site)/dashboard/mis-anuncios/page.tsx` — Servicios cards now pass P0C edit/offers-edit route overrides.
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts` — `buildInventoryListingActions` accepts Servicios `serviciosEditHref` / `serviciosOffersEditHref` / `serviciosOffersActive` overrides + label overrides; renders an active "Editar ofertas" shortcut.
- `app/(site)/dashboard/lib/dashboardInventory.ts` — inventory item carries `serviciosOffersAddonActive`, read from the owner API `offers_addon_active`.
- `scripts/verify-owner-dashboard-global-cta-standard-01.mjs` + `package.json` script.

## Global owner CTA contract

Same label = same action in every category.

| CTA | ES label | EN label | Meaning |
| --- | --- | --- | --- |
| PUBLIC_DETAIL | Ficha pública / Ver público | Public listing / View public | Opens `/clasificados/{category}/{slug}` — never edit/new app |
| PUBLIC_RESULTS | Ver en resultados públicos | View in public results | Opens results filtered to the business/listing |
| EDIT_LISTING | Editar anuncio | Edit listing | Opens the existing listing in application edit mode with identity |
| EDIT_CATEGORY_SPECIFIC | Editar servicio / Editar restaurante | Edit service / Edit restaurant | Same as EDIT_LISTING with category wording |
| EDIT_OFFERS | Editar ofertas / Editar cupones | Edit offers / Edit coupons | Opens the existing listing directly in the coupon/offers section |
| MANAGE_LISTING | Administrar anuncio | Manage listing | Status/tools/management — not the edit form |
| PREVIEW | Vista previa | Preview | Existing listing/draft preview |
| ANALYTICS | Analíticas | Analytics | Listing/category analytics |
| FORM | Formulario | Form | Existing form context — not a blank new application |
| PUBLISH_NEW | Publicar / Publicar anuncio | Publish / Publish listing | Starts a **new** listing only |

Doctrine:
- **"Editar anuncio" must never start a blank/new application.**
- **"Publicar" starts a new application only.**
- **"Editar ofertas" requires listing identity** (listingId/slug) and only shows for pipelines that support offers/coupons when applicable.

## Global `{category}` helper strategy

Prefer reusable, category-parameterized helpers over one-off hard-coded routes. Shared systems own:

- **public detail URL** — `/clasificados/{category}/{slug}?lang=…`
- **public results URL** — `/clasificados/{category}/resultados?lang=…&q=…`
- **edit listing URL contract** — `edit=1&source=dashboard&mode=listing-edit&listingId&listingSlug&leonixAdId&returnPanel={category}`
- **preview URL contract** — existing listing/draft preview only
- **analytics URL contract** — `/dashboard/analytics` or category analytics
- **dashboard action labels** — `dashboardMisAnunciosCategoryTools` label helpers (`editListingLabel`, `publicViewLabel`, `previewLabel`, `analyticsLabel`, `publicResultsListingLabel`, `openPanelLabel`)
- **action builder override support** — `buildInventoryListingActions(category, item, lang, q, opts)`
- **TRUE/FALSE CTA route audit** — the verifier below

Category-specific helpers are used only where a category truly needs a special flow:
- Restaurantes coupons/offers — `restaurantesDashboardCouponAddonCheckout.ts`
- Servicios coupons/offers — `serviciosDashboardOffersAddonCheckout.ts`
- Bienes Raíces property inventory (parent/child)
- Dealer Autos vehicle inventory
- Ofertas Locales AI-searchable specials
- Clases paid/free gate

## Servicios Mis anuncios route fix

- **Editar anuncio** → `serviciosListingEditHref` →
  `/clasificados/publicar/servicios?lang=…&edit=1&source=dashboard&mode=listing-edit&listingId=…&listingSlug=…&leonixAdId=…&returnPanel=servicios`
- **Editar ofertas** (only when offers content is active) → `serviciosOffersEditHref` →
  `/clasificados/publicar/servicios?lang=…&edit=1&source=dashboard&mode=offers-edit&focus=coupon-upgrade&listingId=…&listingSlug=…&leonixAdId=…&returnPanel=servicios`
- Inactive offers → no confusing outside paid CTA. (Activation lives inside Editar anuncio → Cupones y ofertas, per P0C.)

## Restaurante behavior protected

- Public detail, Editar cupones (coupon editor), Vista previa, Ver en resultados públicos, Administrar anuncio all unchanged.
- Restaurante coupon upgrade/edit callbacks (`onCouponUpgrade`, `onCouponEdit`) preserved in the action builder.
- No Restaurante runtime file changed.

## Category action builder behavior

`buildInventoryListingActions` keeps every existing category path (restaurantes, empleos, viajes, autos, bienes, rentas, comida-local, en-venta) unchanged and only adds optional Servicios route/label overrides. When no override is passed, the previous default behavior applies.

## URL contract

- Existing-listing edit routes always carry `edit=1`, `source=dashboard`, `mode=listing-edit` (or `offers-edit`), `returnPanel=servicios`, and listing identity.
- Existing-listing edit routes never use `product=servicios_profesionales` or any blank new-application route.

## Pipeline audit standard

Every future category CTA gate MUST explicitly enumerate and account for each internal pipeline before claiming completion. A gate is incomplete if any pipeline below is silently skipped.

- **Servicios:** professional/white-collar AND blue-collar/trades.
- **Restaurantes:** established restaurant AND truck/mobile/pop-up style where applicable.
- **Ofertas Locales:** weekly flyer/supermarket AND coupon/promo lane.
- **Autos:** privado is separate from dealer/business inventory.
- **Bienes Raíces:** parent agent/business AND child property inventory.
- **Clases:** free class AND paid class.
- **No-upgrade categories** (no coupon/offers add-on, edit + manage only): En Venta/Varios, Rentas, Empleos, Autos privado, Comunidad/Eventos, Busco, Mascotas/Perdidos.

Rule: this gate implements the global CTA contract and the Servicios/Restaurantes proof. It does **not** implement every pipeline flow, but it locks the audit rule so future prompts cannot omit a pipeline. Each future gate restates its category's pipelines and shows the edit/offers URL contract per pipeline.

## What was protected

- No Stripe prices, no Stripe webhook raw-body/signature, no Supabase migrations.
- Restaurante runtime + all other category runtime files untouched.
- Servicios P0A/P0B/P0C behavior preserved; no duplicate listings.

## Manual QA checklist (production URLs)

1. **Servicios Mis anuncios** — `https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios`
   - Click "Editar anuncio". URL must include `/clasificados/publicar/servicios`, `edit=1`, `source=dashboard`, `mode=listing-edit`, `listingId` or `listingSlug`, `returnPanel=servicios`.
   - It must NOT open `/publicar/servicios?lang=es&product=servicios_profesionales`.
2. **Servicios coupon section** — same URL
   - Existing listing opens the saved application (not blank/new). "Cupones y ofertas destacadas" shows listing context.
   - If offers active, "Editar ofertas" opens directly to the coupon section (`mode=offers-edit&focus=coupon-upgrade`).
   - If inactive, no confusing outside paid CTA.
3. **Restaurantes regression** — `https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=restaurantes`
   - Ficha pública / Ver público → public detail. Editar cupones → coupon editor. Vista previa → preview. Ver en resultados públicos → filtered results. Administrar anuncio → management.

## TRUE/FALSE audit

- global Mis anuncios CTA contract documented: TRUE
- "Editar anuncio never starts blank app" documented: TRUE
- "Publicar starts new app only" documented: TRUE
- "Editar ofertas requires listing identity" documented: TRUE
- Servicios Editar anuncio uses serviciosListingEditHref: TRUE
- Servicios edit URL includes edit=1 / source=dashboard / mode=listing-edit / returnPanel=servicios / identity: TRUE
- Servicios edit URL does not use blank/new application route: TRUE
- Servicios Editar ofertas uses offers-edit + focus=coupon-upgrade when active: TRUE
- inactive outside paid CTA avoided: TRUE
- global action builder supports category-specific URL contracts: TRUE
- global `{category}` helper strategy documented: TRUE
- pipeline audit standard documented (Servicios/Restaurantes/Ofertas Locales/Autos/Bienes/Clases/no-upgrade): TRUE
- Restaurante Mis anuncios behavior preserved: TRUE
- no Stripe webhook / migration / Restaurante runtime changed: TRUE

## READY TO COMMIT

READY TO COMMIT: YES
