# CATEGORY STANDARD V2 PILOT OFERTAS RESTAURANTES LIVE ROUTE MIGRATION V1

## Route Proof

### Ofertas Locales

- Landing URL: `/clasificados/ofertas-locales`.
- Landing route file: `app/(site)/clasificados/ofertas-locales/page.tsx`.
- Landing route component: `ClasificadosOfertasLocalesPage`.
- Rendered landing component: `OfertasLocalesPublicSearchClient mode="landing"`.
- Results URL: `/clasificados/ofertas-locales/results`.
- Results route file: `app/(site)/clasificados/ofertas-locales/results/page.tsx`.
- Results route component: `ClasificadosOfertasLocalesResultsPage`.
- Rendered results component: `OfertasLocalesPublicSearchClient mode="results"`.

### Restaurantes

- Landing URL: `/clasificados/restaurantes`.
- Landing route file: `app/(site)/clasificados/restaurantes/page.tsx`.
- Landing route component: `ClasificadosRestaurantesLandingPage`.
- Rendered landing component: `RestaurantesLandingPage`.
- Results URL: `/clasificados/restaurantes/results`.
- Results alias route file: `app/(site)/clasificados/restaurantes/results/page.tsx`.
- Alias behavior: re-exports `../resultados/page`.
- Results implementation URL: `/clasificados/restaurantes/resultados`.
- Results implementation route file: `app/(site)/clasificados/restaurantes/resultados/page.tsx`.
- Rendered results component: `RestaurantesResultsShell`.

## Files Inspected

- `app/lib/website-audit/CLASIFICADOS_ALL_CATEGORIES_LANDING_RESULTS_ROUTE_OWNERSHIP_V2_SHELL_MIGRATION_AUDIT_V1.md`
- `app/lib/website-audit/CATEGORY_STANDARD_V2_BATCH_0_GLOBAL_SHELL_CTA_RESULTS_GUARDRAILS_V1.md`
- `app/(site)/clasificados/components/categoryStandardV2/README.md`
- `app/(site)/clasificados/components/categoryStandardV2/*`
- `app/(site)/clasificados/ofertas-locales/page.tsx`
- `app/(site)/clasificados/ofertas-locales/results/page.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/restaurantes/page.tsx`
- `app/(site)/clasificados/restaurantes/results/page.tsx`
- `app/(site)/clasificados/restaurantes/resultados/page.tsx`
- `app/(site)/clasificados/restaurantes/landing/RestaurantesLandingPage.tsx`
- `app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx`

## Files Changed

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/restaurantes/landing/RestaurantesLandingPage.tsx`
- `app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx`
- `app/lib/website-audit/CATEGORY_STANDARD_V2_PILOT_OFERTAS_RESTAURANTES_LIVE_ROUTE_MIGRATION_V1.md`

## Ofertas Landing / Results Migration Proof

- Landing renders `LeonixCategoryPageShell`, `LeonixCategoryHeroGateway`, `LeonixCategorySearchCanvas`, `LeonixCategoryPartnerSection`, and `LeonixCategoryShortcutSection`.
- Landing no longer renders results cards, active filters, shopping list controls, empty states, or result counts.
- Landing primary CTA uses `publishHref=/publicar/ofertas-locales?lang=...` and `publishLabel=c.sponsorPrimaryCta`; Batch 0 V2 auto-renders the CTA from href/label.
- Landing shortcuts use real query keys only: `offerType`, `marketType`, and `category`.
- Results render through `LeonixCategoryResultsShell`.
- Results order is V2: hero/search, active filters, toolbar, offer/item cards or compact empty state.
- Results do not render partner section or landing shortcuts.
- Offer API, item API, offer cards, item cards, detail drawer, filters drawer, sort/query behavior, and shopping list panel are preserved.
- Shopping list control remains inside the results workspace after the toolbar/active-filter area, not as a top-level CTA strip.

## Restaurantes Landing / Results Migration Proof

- Landing renders `LeonixCategoryPageShell`, `LeonixCategoryHeroGateway`, `LeonixCategorySearchCanvas`, `LeonixCategoryPartnerSection`, `LeonixCategoryDiscoveryGrid`, and `LeonixCategoryShortcutSection`.
- Landing primary CTA uses `/publicar/restaurantes` with localized sponsor/publish label.
- Landing discovery/shortcuts use real supported Restaurante query keys: `cuisine`, `svc`, `family`, `menu`, `wa`, `web`, `social`, `diet`, `open`, `rsv`, `pku`, `ft`.
- Old featured/recent/destacados rendering is not part of the landing output.
- Results render through `LeonixCategoryPageShell` and `LeonixCategoryResultsShell`.
- Results order is V2: hero/search, active filters, toolbar with sort/view/per-page, listing cards or compact empty state, pagination.
- Results do not render `RestaurantesDestacadosSection`, sponsor blocks, landing discovery, shortcut sections, or repeated publish CTA.
- Existing filter modal, active chip clear behavior, sort/perPage, pagination, inventory source, and `RestaurantePublishedListingCard` are preserved.

## CTA Slot Proof

- Ofertas and Restaurantes landing search canvases pass `publishHref` and `publishLabel` directly to `LeonixCategorySearchCanvas`.
- Batch 0 V2 behavior auto-renders the primary CTA from href/label.
- Results surfaces pass no publish href/label to the search canvas.
- Landing shell row shape remains `q | city | state | zip | Buscar` and `country | Filtros | Ver todos | primary action slot`.

## Results Cleanup Proof

- Ofertas results have no partner section, landing shortcut section, or random clear/shopping CTA strip above results.
- Restaurantes results have no sponsor/destacados section and no landing discovery/shortcut sections.
- Both results pages keep active filters, result count/sort controls, listings/cards, compact empty states, and drawer behavior.

## Mobile / PWA Proof

- Both pilots use V2 search canvas stacking rules for narrow screens.
- V2 partner/shortcut chip sections use horizontal scroll/slider behavior from Batch 0 guardrails.
- Results cards remain in single-column mobile layouts.
- Filter drawers/modals remain fixed overlays with scrollable content.
- No category-specific horizontal overflow hacks were added.

## Locked Files Respected

- Autos/Dealers were not touched.
- Servicios was not touched.
- En Venta, Empleos, Viajes, Clases, Comunidad, Busco, Mascotas y Perdidos were not touched.
- Rentas and Bienes were not touched.
- Negocios Locales, publicar/application, admin, dashboard, auth, middleware, Supabase, Stripe, package, Next config, and TS config were not touched.
- Category Standard V2 global files were not edited in this gate.
- No commit or push was performed.

## TRUE/FALSE Audit

- Batch 0 audit read: TRUE.
- V2 README read: TRUE.
- Ofertas live route proven: TRUE.
- Restaurantes live route proven: TRUE.
- Ofertas landing migrated to V2: TRUE.
- Ofertas results migrated to V2: TRUE.
- Restaurantes landing migrated to V2: TRUE.
- Restaurantes results migrated to V2: TRUE.
- landing CTA slots visible: TRUE.
- shell does not collapse when CTA data exists: TRUE.
- partner sections landing-only: TRUE.
- discovery/shortcut sections landing-only: TRUE.
- results have no random CTA rows: TRUE.
- results have no sponsor/discovery leakage: TRUE.
- Ofertas shopping list preserved: TRUE.
- Restaurantes listing cards preserved: TRUE.
- filters/drawers preserved: TRUE.
- mobile 390px safe by code review: TRUE.
- no Autos/Dealers touched: TRUE.
- no Servicios touched: TRUE.
- no other categories touched: TRUE.
- no admin/dashboard/auth/Supabase/Stripe touched: TRUE.
- npm run build passed: TRUE.
