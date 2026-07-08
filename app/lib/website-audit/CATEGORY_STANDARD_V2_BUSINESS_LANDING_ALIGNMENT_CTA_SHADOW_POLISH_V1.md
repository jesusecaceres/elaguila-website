# CATEGORY-STANDARD-V2-BUSINESS-LANDING-ALIGNMENT-CTA-SHADOW-POLISH-V1

## Files Inspected
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/restaurantes/landing/RestaurantesLandingPage.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/constants.ts`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPageShell.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryHeroGateway.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategorySearchCanvas.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPartnerSection.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryDiscoveryGrid.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryShortcutSection.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryVisibilityStrip.tsx`

## Files Changed
- `app/(site)/clasificados/components/categoryStandardV2/constants.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/restaurantes/landing/RestaurantesLandingPage.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx`
- `app/lib/website-audit/CATEGORY_STANDARD_V2_BUSINESS_LANDING_ALIGNMENT_CTA_SHADOW_POLISH_V1.md`

## Alignment Fix Summary
- Added a local Rentas-style landing lane wrapper around hero plus lower sections on Ofertas, Restaurantes, and Servicios: `px-3.5 pb-14 sm:px-5 lg:px-6`.
- Removed lower-section duplicate `mx-auto max-w-[1280px]` and inner horizontal padding from these landing bodies so hero/gateway, partner/value, discovery, chips, and visibility strips share the same left/right edges.
- Kept the shared warm cream V2 page shell and background texture unchanged.

## CTA Shadow / Depth Fix Summary
- Updated the shared V2 landing primary CTA class with premium burgundy depth:
  - `shadow-[0_12px_24px_-16px_rgba(122,30,44,0.65)]`
  - `hover:shadow-[0_16px_28px_-16px_rgba(122,30,44,0.75)]`
- Applied the same conservative depth to the shared V2 visibility strip CTA.
- Secondary CTA classes were not made heavier, preserving the gold-border secondary hierarchy.

## Ofertas Duplicate Section Decision
- Removed the second Ofertas shortcut section that repeated the same `Explorar ofertas por necesidad` title/subtitle and duplicated the main discovery card intent.
- Kept the main discovery card/grid with real Ofertas URL keys: `offerType`, `marketType`, and `category`.
- Shopping-list behavior and results-only published cards remain untouched.

## Servicios Published Ads Final Check
- Servicios landing render does not import or render `RecentServicesSection`, `ServiciosDestacadosSection`, or `ServiciosHorizontalResultCard`.
- `Servicios recientes` and published result-card CTA clusters remain absent from landing.
- Partner/value, `Explora por giro`, practical chips, and visibility strip remain present.

## Restaurantes Final Check
- Partner section remains landing-only and uses only a secondary CTA.
- Cuisine cards, service chips, and important chips remain aligned under the same local lane wrapper.
- Spanish labels remain Spanish for visible UI labels such as `Menú disponible`, `Sin gluten`, `Comer en local`, `Para llevar`, and `Redes sociales`.

## Mobile / PWA Notes
- The local wrapper uses the same small-screen horizontal padding as Rentas and does not introduce fixed widths.
- Search controls still stack through shared `LeonixCategorySearchCanvas`.
- Discovery cards remain responsive through shared V2 grid classes.
- Chips continue to use snap overflow on small screens and wrapping from `sm`.
- Visibility strips remain flex-column on mobile and do not introduce horizontal overflow.

## Locked Files Respected
- Results pages were not edited.
- Publish flows were not edited.
- Rentas, Bienes, Autos/Dealers, other category folders, admin, dashboard, auth, Supabase, Stripe, middleware, package files, config files, and global nav/footer/header were not edited by this patch.
- Existing unrelated working-tree changes outside this gate were left untouched.

## TRUE / FALSE Audit
- Ofertas landing inspected: TRUE
- Restaurantes landing inspected: TRUE
- Servicios landing inspected: TRUE
- Section edges aligned to shared lane: TRUE
- Primary CTA shadow/depth restored: TRUE
- Secondary CTA hierarchy preserved: TRUE
- Ofertas duplicate section handled: TRUE
- Servicios published cards absent from landing: TRUE
- Restaurantes partner section clean: TRUE
- No results pages touched: TRUE
- No other categories touched: TRUE
- No admin/dashboard/auth/Supabase/Stripe touched: TRUE
- Mobile/PWA safe by code review: TRUE
- npm run build passed: TRUE
