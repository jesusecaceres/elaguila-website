# CATEGORY-STANDARD-V2-BUSINESS-LANDING-IMAGE-MATCH-OFERTAS-RESTAURANTES-SERVICIOS-V1

## Scope
- Landing pages only: `/clasificados/ofertas-locales`, `/clasificados/restaurantes`, `/clasificados/servicios`.
- Results pages, publish flows, other categories, admin, dashboard, auth, Supabase, Stripe, package files, and global navigation were intentionally not edited.
- Screenshot paths from the prompt were checked with workspace glob tools. Rule files were available; image files were not exposed in the checked folders, so the implementation used the owner-described Rentas screenshots plus the Rentas implementation as the measurable source of truth.

## Files Inspected
- `app/(site)/clasificados/ofertas-locales/page.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/clasificados/restaurantes/page.tsx`
- `app/(site)/clasificados/restaurantes/landing/RestaurantesLandingPage.tsx`
- `app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract.ts`
- `app/(site)/clasificados/servicios/page.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosHeroSearch.tsx`
- `app/(site)/clasificados/servicios/landing/FeaturedBusinessSection.tsx`
- `app/(site)/clasificados/servicios/landing/RecentServicesSection.tsx`
- `app/(site)/clasificados/servicios/lib/serviciosLandingBuild.ts`
- `app/(site)/clasificados/rentas/page.tsx`
- `app/(site)/clasificados/rentas/RentasLandingHub.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/*`

## Files Changed
- `app/(site)/clasificados/components/categoryStandardV2/types.ts`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategorySearchCanvas.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/clasificados/restaurantes/landing/RestaurantesLandingPage.tsx`
- `app/(site)/clasificados/servicios/page.tsx`
- `app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx`
- `app/lib/website-audit/CATEGORY_STANDARD_V2_BUSINESS_LANDING_IMAGE_MATCH_OFERTAS_RESTAURANTES_SERVICIOS_V1.md`

## Rentas Visual Measurements Extracted
- Page shell: `relative min-h-screen overflow-x-hidden bg-[#F3EBDD] text-[#1F241C]`, radial background, subtle 52px grid, lane `mx-auto w-full min-w-0 max-w-[1280px]`, padding `px-3.5 pb-14 sm:px-5 lg:px-6`, safe top `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14`.
- Gateway card: `rounded-xl sm:rounded-2xl`, `border border-[#C9A84A]/40`, `bg-[#FFFDF7]/88`, `shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)]`, `backdrop-blur-[2px]`, padding `px-4 py-6 sm:px-7 sm:py-7`.
- Icon square: `h-14 w-14 rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536]`.
- Copy rhythm: eyebrow `text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]`; title `font-serif text-[2.1rem] sm:text-[2.5rem] lg:text-[2.65rem]`; tagline `mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C]`; intro `mt-3`; helper `mt-1.5`.
- Search shell: `rounded-xl bg-white/96 p-3.5 ring-1 ring-[#C9A84A]/30 sm:p-4 sm:rounded-2xl`; fields `min-h-[3rem] sm:min-h-[3.125rem] rounded-xl border-[#D6C7AD]/75`; grid `sm:grid-cols-12`, row 1 spans `5 | 2 | 2 | 1 | 2`, row 2 spans `3 | 2 | 3 | 4` when publish CTA exists.
- Primary CTA: `bg-[#7A1E2C]`, hover `#5e1721`, `text-[#FFFDF7]`, `min-h-[3rem] sm:min-h-[3.125rem]`, `rounded-xl`, `text-sm font-bold`, `px-5`.
- Secondary CTA: `border-[#C9A84A]/60`, `bg-[#FFFDF7]`, `text-[#3D3428]`, `min-h-[3rem] sm:min-h-[3.125rem]`, `rounded-xl`, `text-sm font-semibold`, `px-4`.
- Intent cards: `mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4`, cards `min-h-[4.75rem] sm:min-h-[5rem] rounded-xl border bg-gradient-to-br p-3`.
- Shortcut sections: `mt-6 space-y-5 sm:mt-7`, wrapper `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96`, padding `px-4 py-5 sm:px-6 sm:py-6`, chips `h-[38px]` budget and `h-[36px]` practical.
- Visibility strip: same landing section wrapper, gradient overlay, `h-11 w-11` icon square, compact burgundy CTA.

## Ofertas Changes
- Preserved route ownership: `page.tsx` renders `OfertasLocalesPublicSearchClient mode="landing"`.
- Added category-specific search placeholder support through shared V2 optional `queryPlaceholder`.
- Updated copy to the requested hero/helper/search/browse wording.
- Added Rentas-style discovery cards using supported `offerType`, `marketType`, and `category` params only.
- Kept shopping-list behavior intact.
- Removed the duplicate strong partner primary CTA; partner section now has only a secondary CTA.
- Added a compact visibility strip after the discovery/value sections.

## Restaurantes Changes
- Preserved route ownership: `page.tsx` renders `RestaurantesLandingPage`.
- Added requested search placeholder and fixed search submit URL construction to avoid double `?`.
- Kept title plural and Spanish/English copy paths.
- Removed the duplicate strong partner primary CTA; partner section now has only a secondary CTA.
- Replaced null discovery icons with real lightweight icons.
- Kept Spanish UI labels Spanish for the requested visible chips: `Perfil de negocio`, `Menú y contacto`, `Menú disponible`, `Sin gluten`.

## Servicios Changes
- Preserved route ownership: `page.tsx` renders `ServiciosLandingPage`.
- Removed landing data fetch for live public listings.
- Removed `Servicios recientes`, `Destacados`, result-card CTA clusters, and lower duplicate publish CTA from the landing render.
- Added full hero tagline, intro, helper, and query placeholder.
- Added clean provider value section, `Explora por giro` discovery grid, practical/trust chips, and print+digital visibility strip.
- Used supported Servicios results params only: `q`, `group`, `whatsapp`, `web`, `free_estimate`, `phys`, `mobileSvc`, `emergency`, `wknd`, `verified`, `licensed`, `insured`.

## Mobile / PWA Code Review
- All three pages use `LeonixCategoryPageShell`, `LeonixCategoryHeroGateway`, and `LeonixCategorySearchCanvas`, which stack hero/search controls to one column below `sm`.
- Search fields and CTAs keep `min-h-[3rem] sm:min-h-[3.125rem]`.
- Discovery grids collapse safely: shared V2 cards are one column on smallest screens and two/four columns upward; shortcut chips use horizontal snap overflow on small screens and wrap at `sm`.
- Page shells use `overflow-x-hidden` and `min-w-0` content lanes.

## TRUE / FALSE Audit
- Rentas screenshots used as visual source: FALSE (image files not exposed to workspace tools; owner-described screenshots and Rentas code used)
- Rentas files inspected read-only: TRUE
- Ofertas landing file confirmed: TRUE
- Restaurantes landing file confirmed: TRUE
- Servicios landing file confirmed: TRUE
- Ofertas hero/search matches Rentas rhythm: TRUE
- Restaurantes hero/search matches Rentas rhythm: TRUE
- Servicios hero/search matches Rentas rhythm: TRUE
- Ofertas duplicate strong CTA removed/softened: TRUE
- Restaurantes duplicate strong CTA removed/softened: TRUE
- Servicios published listing cards removed from landing: TRUE
- Restaurantes partner section kept clean: TRUE
- Servicios partner/value section kept/created clean: TRUE
- Landing CTAs follow contract: TRUE
- No results pages touched: TRUE
- No publish flows touched: TRUE
- No admin/dashboard/auth/Supabase/Stripe touched: TRUE
- No other categories touched: TRUE
- Mobile/PWA safe by code review: TRUE
- npm run build passed: TRUE
