# CATEGORY-STANDARD-V2-AUTOS-DEALERS-LANDING-IMAGE-MATCH-V1

## Scope
- Landing pages only: `/clasificados/autos` and `/clasificados/dealers-de-autos`.
- Results pages, publish flows, inventory logic, vehicle detail pages, admin, dashboard, auth, Supabase, Stripe, and global nav/footer/header were not edited.
- Existing unrelated working-tree changes were present before this gate and were left untouched.

## Reference Package
- `C:\Users\chuy\Pictures\Landing pages` was checked with workspace glob tools, but image files were not exposed to the tool result.
- Compiled rule files were available and inspected from `C:\temp_LEONIX_ZIPS\Anlytics and Leonix Branding\landing and results page prompt`.
- Rentas implementation was inspected read-only as the measurable visual source of truth.

## Files Inspected
- `app/(site)/clasificados/autos/page.tsx`
- `app/(site)/clasificados/autos/landing/AutosLandingPage.tsx`
- `app/(site)/clasificados/dealers-de-autos/page.tsx`
- `app/lib/clasificados/autos/autosPublicMarket.ts`
- `app/lib/clasificados/autos/autosPublicMarketCopy.ts`
- `app/(site)/clasificados/autos/filters/autosPublicFilterTypes.ts`
- `app/(site)/clasificados/autos/filters/autosBrowseFilterContract.ts`
- `app/(site)/clasificados/autos/lib/autosPublicBlueprintCopy.ts`
- `app/(site)/clasificados/components/categoryStandardV2/*`
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx`

## Files Changed
- `app/(site)/clasificados/autos/landing/AutosLandingPage.tsx`
- `app/lib/website-audit/CATEGORY_STANDARD_V2_AUTOS_DEALERS_LANDING_IMAGE_MATCH_V1.md`

## Route Proof
- Autos landing: `app/(site)/clasificados/autos/page.tsx` renders `AutosLandingPage market="private"`.
- Dealers landing: `app/(site)/clasificados/dealers-de-autos/page.tsx` renders `AutosLandingPage market="dealer"`.
- Both routes share the active landing component but now branch by `market` for private Autos vs dealer/business content.

## Rentas Visual Measurements Extracted
- Page shell: `relative min-h-screen overflow-x-hidden bg-[#F3EBDD] text-[#1F241C]`, radial background, subtle 52px grid, lane `mx-auto w-full min-w-0 max-w-[1280px]`, padding `px-3.5 pb-14 sm:px-5 lg:px-6`, safe top `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14`.
- Gateway card: `rounded-xl sm:rounded-2xl`, `border border-[#C9A84A]/40`, `bg-[#FFFDF7]/88`, `shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)]`, `backdrop-blur-[2px]`, padding `px-4 py-6 sm:px-7 sm:py-7`.
- Icon square: `h-14 w-14 rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536]`.
- Text rhythm: eyebrow `text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]`; title `font-serif text-[2.1rem] sm:text-[2.5rem] lg:text-[2.65rem]`; tagline `mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C]`; intro `mt-3`; helper `mt-1.5`.
- Search shell: `rounded-xl bg-white/96 p-3.5 ring-1 ring-[#C9A84A]/30 sm:p-4 sm:rounded-2xl`.
- Search grid: row 1 `q | city | state | zip | Buscar` with spans `5 | 2 | 2 | 1 | 2`; row 2 `country | Filtros | browse | primary` with spans `3 | 2 | 3 | 4` when primary CTA exists.
- Primary CTA: `bg-[#7A1E2C]`, hover `#5e1721`, `text-[#FFFDF7]`, `min-h-[3rem] sm:min-h-[3.125rem]`, `rounded-xl`, `text-sm font-bold`, `px-5`, premium burgundy shadow from shared V2 constants.
- Secondary CTA: gold border, cream background, dark text, same height/radius rhythm.
- Discovery grid: `mt-4 grid`, safe one/two/four-column layout, cards `min-h-[4.75rem] sm:min-h-[5rem] rounded-xl border bg-gradient-to-br p-3`.
- Shortcut chips: section wrapper `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96`, chip row scrolls on mobile and wraps on `sm`, practical chips use olive border/cream gradient.
- Visibility strip: same landing section wrapper with compact icon block, copy, and burgundy CTA.

## Autos Changes
- Removed the old landing composition from active render: no internal language switch, old custom shell, inventory notice, peer CTA block, recent/private vehicle feed, dealer feed, or black/gold publish CTA block.
- Rebuilt the private Autos landing with V2 shell, gateway, integrated search shell, discovery grid, practical chips, and visibility strip.
- Autos does not render a partner/value section; this keeps private seller Autos distinct from Dealers.
- All Autos discovery links use supported Autos URL state: `seller`, `bodyStyle`, `priceMax`, `mileageMax`, `transmission`, or `q`.
- Omitted unsafe `Cerca de mí` because radius/geolocation is parsed but not applied by Autos public filtering.

## Dealers Changes
- Dealers uses the same active V2 landing component with dealer-specific copy, search CTA, browse link, discovery grid, partner/value section, practical chips, and visibility strip.
- Removed published vehicle/dealer card feeds from landing render.
- Dealer partner/value section is clean and landing-only, with secondary CTA only.
- Dealer discovery links use supported Autos URL state: `seller`, `condition`, `bodyStyle`, `mileageMax`, `city`, or `q`.
- Used `San José / Bay Area` as the safe city shortcut instead of unsupported “near me”.

## CTA Hierarchy Cleanup
- Search shell owns the main burgundy CTA:
  - Autos: `Publicar mi auto` / `Post my car`
  - Dealers: `Publicar como dealer` / `Post as dealer`
- Partner CTA exists only on Dealers and is secondary.
- Visibility strip has one compact burgundy visibility CTA and does not duplicate the publish CTA.

## Mobile / PWA Notes
- Both pages use `LeonixCategoryPageShell`, `LeonixCategoryHeroGateway`, and `LeonixCategorySearchCanvas`.
- Search controls stack on mobile via shared V2 grid classes.
- Discovery cards use shared responsive grid classes.
- Shortcut chips use shared overflow/wrap behavior.
- The local wrapper uses Rentas-aligned `px-3.5 pb-14 sm:px-5 lg:px-6`; no fixed viewport widths were introduced.

## Intentionally Not Touched
- Results routes and canonical route cleanup.
- Publish/application flows.
- Inventory fetch, result card, detail, dealer sample, and reusable landing card components.
- Rentas, Bienes, Ofertas, Restaurantes, Servicios, and other category files.
- Admin, dashboard, auth, Supabase, Stripe, middleware, APIs, package files, config files.

## TRUE / FALSE Audit
- Rentas screenshots used as visual source: FALSE (image files not exposed to workspace tools)
- Compiled rule files used: TRUE
- Rentas files inspected read-only: TRUE
- Autos landing file confirmed: TRUE
- Dealers landing file confirmed: TRUE
- Autos hero/search matches Rentas rhythm: TRUE
- Dealers hero/search matches Rentas rhythm: TRUE
- Autos published vehicle cards removed from landing: TRUE
- Dealers published vehicle cards removed from landing: TRUE
- Autos dealer partner section absent: TRUE
- Dealers partner/value section clean: TRUE
- Landing CTAs follow contract: TRUE
- No results pages touched: TRUE
- No publish flows touched: TRUE
- No admin/dashboard/auth/Supabase/Stripe touched: TRUE
- No other categories touched: TRUE
- Mobile/PWA safe by code review: TRUE
- npm run build passed: TRUE
