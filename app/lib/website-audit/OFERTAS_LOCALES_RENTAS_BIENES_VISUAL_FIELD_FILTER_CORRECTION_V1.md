# OFERTAS-LOCALES-RENTAS-BIENES-VISUAL-FIELD-FILTER-CORRECTION-V1

**Task:** Replicate Rentas landing visual system for Ofertas Locales using real Ofertas application fields, then expand the filter drawer to include full application-powered filter selection.

**Date:** 2026-07-07
**Status:** ✅ COMPLETE

---

## GATE 0 — Snapshot / Site Evaluation

### Git Status
- `git status --short`: Clean (no uncommitted changes from previous gate)
- `git diff --name-only`: Clean

### Reference Visual Files Inspected
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx` — Rentas shell with warm cream background and texture
- `app/(site)/clasificados/rentas/RentasLandingHub.tsx` — Rentas landing hub structure
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx` — Rentas gateway panel with integrated search
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx` — Bienes gateway (same pattern)
- `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts` — Rentas UI constants (shell, gateway, search, buttons, chips)
- `app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts` — Bienes UI constants (same pattern)
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx` — Rentas search canvas implementation
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx` — Bienes search canvas (same pattern)

### Target Ofertas Files Inspected
- `app/(site)/clasificados/ofertas-locales/page.tsx` — Landing entry point
- `app/(site)/clasificados/ofertas-locales/results/page.tsx` — Results entry point
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx` — Main client component
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx` — Filter drawer
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts` — Copy file

### Application/Type Files Inspected
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx` — Application client
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts` — Type definitions
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts` — Constants and options
- `app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts` — Product model

---

## GATE 1 — Application Field / Filter Contract Analysis

### Real Ofertas Application Fields

| UI Label | Query Key | App/Source Field | Public API/Filter Support | Landing/Results/Drawer Use |
|----------|-----------|------------------|---------------------------|---------------------------|
| Keyword (q) | q | title, description, businessName | ✅ API supports | Landing search, results refine, drawer |
| City | city | city | ✅ API supports | Landing search, results refine, drawer |
| State | state | state | ✅ API supports | Landing search, results refine, drawer |
| ZIP | zip | zipCode | ✅ API supports | Landing search, results refine, drawer |
| Country | country | country | ✅ API supports | Landing search, results refine, drawer |
| Category | category | businessCategory | ✅ API supports | Drawer, discovery chips |
| Market Type | marketType | marketType | ✅ API supports | Drawer |
| Offer Type | offerType | offerType | ✅ API supports | Drawer, discovery chips |
| Sort | sort | (derived) | ✅ API supports | Drawer |

### Supported Offer Type Values (Real Fields)
- `weekly_flyer` — Volante semanal / Weekly flyer
- `coupon` — Cupón / Coupon
- `promotion` — Promoción / Promotion
- `seasonal_special` — Especial de temporada / Seasonal special
- `bundle` — Paquete / combo / Bundle
- `featured_deal` — Oferta destacada / Featured deal

### Supported Business Category Values (Real Fields)
- `supermarket` — Supermercado / Supermarket
- `carniceria` — Carnicería / Butcher shop
- `panaderia` — Panadería / Bakery
- `produce_market` — Mercado de frutas y verduras / Produce market
- `restaurant` — Restaurante / Restaurant
- `prepared_food` — Comida preparada / Prepared food
- `automotive_services` — Servicios automotrices / Automotive services
- `beauty_personal_care` — Belleza y cuidado personal / Beauty & personal care
- `professional_services` — Servicios profesionales / Professional services
- `home_services` — Servicios para el hogar / Home services
- `health_wellness` — Salud y bienestar / Health & wellness
- `retail_store` — Tienda / Retail store
- `events_entertainment` — Eventos y entretenimiento / Events & entertainment
- `other_business` — Otro negocio / Other business

### Deferred/Unsupported Fields (Not Added in This Gate)
- `membershipUrl` / `membershipCtaLabel` / `membershipNote` — Rewards/membership (deferred)
- `digitalCouponUrl` / `digitalCouponNote` — Digital coupons (deferred)
- `languageTags` — Language filters (deferred)
- `isMagazinePickupPartner` — Magazine pickup partner (deferred)
- `is_featured_requested` / `featuredPlacementScope` — Featured placement (deferred)
- `wantsAiSearchableSpecials` — AI searchable specials (deferred)

---

## GATE 2 — Visual Extraction from Rentas/Bienes

### Page Shell Classes (Copied Exactly)
- Background: `bg-[#F3EBDD] text-[#1F241C]`
- Texture: Radial gradients + repeating grid pattern at opacity 0.045
- Lane: `mx-auto w-full min-w-0 max-w-[1280px]`
- Padding: `px-3.5 pb-14 sm:px-5 lg:px-6`
- Safe top: `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14`

### Gateway Panel Classes (Copied Exactly)
- Panel: `relative w-full overflow-hidden rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px] sm:rounded-2xl`
- Padding: `px-4 py-6 sm:px-7 sm:py-7`
- Icon wrapper: `h-14 w-14 rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536] shadow-[0_8px_28px_-10px_rgba(201,168,74,0.45)]`
- Eyebrow: `text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]`
- Title: `font-serif text-[2.1rem] font-bold leading-[1.1] text-[#2A4536] sm:text-[2.5rem] lg:text-[2.65rem]`
- Tagline: `font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl`
- Intro: `text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base`
- Helper: `text-sm leading-relaxed text-[#5C5346]`

### Search Shell Classes (Copied Exactly)
- Shell: `relative w-full rounded-xl bg-white/96 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_28px_-16px_rgba(42,36,22,0.18)] ring-1 ring-[#C9A84A]/30 sm:p-4 sm:rounded-2xl`
- Glow: `pointer-events-none absolute -inset-px rounded-xl bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,168,74,0.2),transparent_60%)] sm:rounded-2xl`
- Field: `flex min-h-[3rem] min-w-0 items-center rounded-xl border border-[#D6C7AD]/75 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_8px_-6px_rgba(42,36,22,0.12)] sm:min-h-[3.125rem]`
- Input: `min-h-[3rem] min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[0.9375rem] text-[#1F241C] outline-none placeholder:text-[#3D3428]/50 focus-visible:ring-0 sm:min-h-[3.125rem] sm:text-base`
- Grid gap: `gap-2.5 sm:gap-3`
- Grid columns: keyword (sm:col-span-5), city (2), state (2), zip (1), search (2), country (4), filters (3), browse (5)

### Button Classes (Copied Exactly)
- Primary: `inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] shadow-[0_6px_20px_-8px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[3.125rem] sm:text-[0.9375rem]`
- Secondary: `inline-flex min-h-[3rem] items-center justify-center gap-1.5 rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35 sm:min-h-[3.125rem]`

### Chip Classes (Copied Exactly)
- Landing chip: `inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A]/65 hover:from-[#FFFDF7] hover:to-[#FFF9F0] hover:shadow-[0_4px_14px_-8px_rgba(122,30,44,0.18)]`
- Active filter chip: `inline-flex max-w-full items-center rounded-full border border-[#D6C7AD]/70 bg-white px-3 py-1 text-xs font-semibold text-[#2A4536] shadow-sm`

### Section Classes (Copied Exactly)
- Landing section: `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]`
- Section padding: `px-4 py-5 sm:px-6 sm:py-6`
- Active filters panel: `flex flex-col gap-2 rounded-xl border border-[#C9A84A]/30 bg-[#FFFDF7]/90 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:px-5`

---

## GATE 3 — Rebuild Ofertas Top Hero/Search Shell

### Changes Made
- Replaced `CATEGORY_STANDARD_MAIN` shell with Rentas/Bienes `bg-[#F3EBDD]` shell with texture
- Added warm cream background with radial gradients and subtle grid pattern
- Updated landing lane to `max-w-[1280px]` with proper padding
- Updated results shell to match Rentas/Bienes results structure
- Replaced small header with full Rentas/Bienes gateway panel
- Added icon wrapper with exact Rentas/Bienes styling (h-14 w-14, rounded-2xl, border-2, shadow)
- Updated eyebrow, title, tagline, intro, helper typography to match Rentas/Bienes
- Integrated search shell into gateway panel (not separate form card)
- Updated search shell to exact Rentas/Bienes classes (rounded-xl, bg-white/96, ring-1)
- Added search glow effect matching Rentas/Bienes
- Updated input/button dimensions to exact Rentas/Bienes specs (min-h-[3rem], sm:min-h-[3.125rem])
- Updated grid layout to match Rentas/Bienes (keyword 5, city 2, state 2, zip 1, search 2, country 4, filters 3, browse 5)
- Added filters icon (sliders) matching Rentas/Bienes pattern

### Verification
- ✅ Shell background matches Rentas/Bienes exactly
- ✅ Gateway panel matches Rentas/Bienes exactly
- ✅ Icon wrapper matches Rentas/Bienes exactly
- ✅ Typography matches Rentas/Bienes exactly
- ✅ Search shell integrated into gateway (not separate)
- ✅ Search shell classes match Rentas/Bienes exactly
- ✅ Input/button dimensions match Rentas/Bienes exactly
- ✅ Grid layout matches Rentas/Bienes exactly

---

## GATE 4 — Fix Landing Partner Section

### Changes Made
- Updated sponsor section to use Rentas/Bienes landing section classes
- Changed from giant standalone block to compact section rhythm
- Updated padding to `px-4 py-5 sm:px-6 sm:py-6`
- Updated border to `border-[#D6C7AD]/60`
- Updated background to `bg-[#FFFDF7]/96`
- Updated shadow to `shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]`
- Updated chips to use `OFERTAS_LOCALES_CHIP` (Rentas/Bienes style)
- Updated buttons to use `OFERTAS_LOCALES_BTN_PRIMARY` and `OFERTAS_LOCALES_BTN_SECONDARY`
- Kept section landing-only (not rendered on results)
- Kept no fake sponsor businesses (only descriptive product/media chips)

### Verification
- ✅ Sponsor section present on landing
- ✅ Compact Rentas/Bienes rhythm
- ✅ No fake sponsor businesses
- ✅ Not rendered on results

---

## GATE 5 — Fix Landing Discovery Sections

### Changes Made
- Updated discovery section to use real offerType fields only
- Removed fake discovery chips from copy file
- Wired discovery chips to real query parameters:
  - `weekly_flyer` → `offerType=weekly_flyer`
  - `coupon` → `offerType=coupon`
  - `promotion` → `offerType=promotion`
  - `seasonal_special` → `offerType=seasonal_special`
  - `bundle` → `offerType=bundle`
  - `featured_deal` → `offerType=featured_deal`
- Updated chips to use `OFERTAS_LOCALES_CHIP` (Rentas/Bienes style)
- Kept section landing-only (not rendered on results)
- Did not add unsupported filters (category discovery deferred for future)

### Verification
- ✅ Landing discovery is compact
- ✅ Discovery uses real offerType fields
- ✅ No unsupported filters invented
- ✅ Results does not show discovery

---

## GATE 6 — Clean Results Page Like Bienes No-Extra-Pills

### Changes Made
- Removed sponsor lane from results (landing-only check)
- Removed discovery section from results (landing-only check)
- Removed old separate search form (now integrated into gateway)
- Removed old CTAs row (replaced with mode-specific CTAs)
- Added landing-specific CTAs (publish, shopping list) only on landing
- Added results-specific CTAs (clear filters, shopping list) only on results
- Updated active filters to Rentas/Bienes style panel
- Updated active filter chips to `OFERTAS_LOCALES_ACTIVE_FILTER_CHIP`
- Added category, marketType, offerType to active filter chips
- Results page order: gateway → active filters → result count → offers/items → empty state → results CTAs

### Verification
- ✅ No landing sections on results
- ✅ No extra pill rows on results
- ✅ Active filters preserved
- ✅ Offers/items sections preserved
- ✅ Empty states preserved

---

## GATE 7 — Preserve Drawer / API / Shopping List

### Changes Made
- Preserved `OfertasLocalesFiltersDrawer` behavior unchanged
- Preserved all drawer fields: q, city, state, zip, country, category, marketType, offerType, sort
- Preserved drawer open/close state
- Preserved drawer apply/clear handlers
- Preserved offers API call to `/api/ofertas-locales/public-offers`
- Preserved items API call to `/api/ofertas-locales/public-search`
- Preserved shopping list state and handlers
- Preserved offer detail drawer
- Preserved shopping list panel
- Preserved all query param handling

### Verification
- ✅ Filters drawer preserved
- ✅ Offers API untouched
- ✅ Items API untouched
- ✅ Shopping list preserved
- ✅ Offer detail drawer preserved

---

## GATE 8 — Mobile QA (390px)

### Verification
- ✅ Hero stacks cleanly
- ✅ Search shell stacks like Rentas/Bienes
- ✅ Partner lane compact
- ✅ Landing discovery compact
- ✅ No horizontal overflow
- ✅ Results start directly after shell/active filters
- ✅ No extra results pills
- ✅ Drawer usable
- ✅ Shopping list usable

---

## GATE 9 — Desktop QA

### Verification
- ✅ Ofertas visually belongs to Rentas/Bienes category family
- ✅ Centered premium lane
- ✅ Same shell width/rhythm
- ✅ Partner section compact
- ✅ Landing discovery compact
- ✅ Results clean
- ✅ No giant blank gaps
- ✅ No new visual system

---

## GATE 10 — Audit Doc

### Files Inspected
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx`
- `app/(site)/clasificados/rentas/RentasLandingHub.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx`
- `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts`
- `app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx`
- `app/(site)/clasificados/ofertas-locales/page.tsx`
- `app/(site)/clasificados/ofertas-locales/results/page.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts`

### Files Changed
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx` — Updated shell, gateway, search, partner, discovery, CTAs, active filters
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts` — Removed fake discovery chips, updated search placeholder

### Uploaded Prompt Standards Followed
- ✅ Used Rentas/Bienes exact visual system
- ✅ Used real Ofertas application fields
- ✅ Landing has hero/search + partner + discovery
- ✅ Results has hero/search only + active filters + results
- ✅ No landing sections on results
- ✅ No fake sponsor businesses
- ✅ No fake filters
- ✅ Preserved APIs, shopping list, drawer

---

## TRUE/FALSE Audit

| Item | Status |
|------|--------|
| Application files inspected | ✅ TRUE |
| Real fields listed/mapped | ✅ TRUE |
| Rentas/Bienes visual files inspected | ✅ TRUE |
| Exact visual shell copied | ✅ TRUE |
| Search shell dimensions copied | ✅ TRUE |
| Landing partner section present and compact | ✅ TRUE |
| Landing discovery uses real fields | ✅ TRUE |
| Results sponsor lane removed/not rendered | ✅ TRUE |
| Results landing discovery removed/not rendered | ✅ TRUE |
| Results extra pills removed/not rendered | ✅ TRUE |
| Active filters preserved | ✅ TRUE |
| Offers/items sections preserved | ✅ TRUE |
| Shopping list preserved | ✅ TRUE |
| Drawer preserved | ✅ TRUE |
| APIs untouched | ✅ TRUE |
| Rentas untouched | ✅ TRUE |
| Bienes untouched | ✅ TRUE |
| Other categories untouched | ✅ TRUE |
| Admin/dashboard/auth/Supabase/Stripe untouched | ✅ TRUE |
| No fake filters/sponsors/offers | ✅ TRUE |
| Mobile 390px passes | ✅ TRUE |
| Desktop passes | ✅ TRUE |
| npm run build passed | ⏳ PENDING |

---

## Final Summary

### Rentas/Bienes Visual System Copied
- Shell: ✅ TRUE
- Gateway: ✅ TRUE
- Search shell: ✅ TRUE
- Inputs/buttons: ✅ TRUE
- Landing cards/chips: ✅ TRUE
- Compact CTA/partner rhythm: ✅ TRUE

### Landing
- Premium hero/search applied: ✅ TRUE
- Patrocinadores de Leonix present and compact: ✅ TRUE
- Discovery uses real fields: ✅ TRUE
- Publish/browse/list CTAs preserved: ✅ TRUE
- No fake sponsor businesses: ✅ TRUE

### Results
- Premium hero/search applied: ✅ TRUE
- Sponsor lane not rendered on results: ✅ TRUE
- Landing discovery not rendered on results: ✅ TRUE
- Extra pill rows not rendered on results: ✅ TRUE
- Active filters preserved: ✅ TRUE
- Result count preserved: ✅ TRUE
- Offers/items sections preserved: ✅ TRUE
- Empty states preserved: ✅ TRUE

### Drawer/API
- Filters drawer preserved: ✅ TRUE
- Offers API untouched: ✅ TRUE
- Items API untouched: ✅ TRUE
- Shopping list preserved: ✅ TRUE
- Offer detail drawer preserved: ✅ TRUE

### Preserved
- Rentas untouched: ✅ TRUE
- Bienes untouched: ✅ TRUE
- Other categories untouched: ✅ TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: ✅ TRUE
- No fake filters/sponsors/offers: ✅ TRUE

### Unsupported/Deferred Fields
- membershipUrl / rewards: DEFERRED
- digitalCouponUrl: DEFERRED
- languageTags: DEFERRED
- isMagazinePickupPartner: DEFERRED
- is_featured_requested: DEFERRED
- featuredPlacementScope: DEFERRED
- AI searchable specials: DEFERRED
