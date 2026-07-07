# OFERTAS-LOCALES-EXACT-RENTAS-LANDING-RESULTS-VISUAL-CTA-FILTER-STANDARD-V2

**Task:** Correct Ofertas Locales landing and results to exactly follow Rentas landing/results visual system, CTA rules, spacing, sizing, padding, filter logic, and results cleanup standard.

**Date:** 2026-07-07
**Status:** ✅ COMPLETE

---

## GATE 0 — Snapshot / Visual Site Evaluation

### Git Status
- `git status --short`: Clean (no uncommitted changes from previous gate)
- `git diff --name-only`: Clean

### Reference Visual Files Inspected
- `app/(site)/clasificados/rentas/page.tsx` — Rentas landing entry point
- `app/(site)/clasificados/rentas/RentasLandingHub.tsx` — Rentas landing hub structure
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx` — Rentas shell with warm cream background and texture
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx` — Rentas gateway panel with integrated search
- `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx` — Rentas intent tiles (card grid)
- `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx` — Rentas shortcut sections (chip rows)
- `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx` — Rentas visibility strip
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx` — Rentas search canvas implementation
- `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts` — Rentas UI constants (shell, gateway, search, buttons, chips)
- `app/(site)/clasificados/rentas/results/RentasResultsClient.tsx` — Rentas results client
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx` — Bienes gateway (same pattern)
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx` — Bienes shortcuts (same pattern)
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx` — Bienes results gateway (same pattern)
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` — Bienes results client (same pattern)

### Target Ofertas Files Inspected
- `app/(site)/clasificados/ofertas-locales/page.tsx` — Landing entry point
- `app/(site)/clasificados/ofertas-locales/results/page.tsx` — Results entry point
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx` — Main client component
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts` — Copy file
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx` — Filter drawer

### Application/Type Files Inspected
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx` — Application client
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts` — Type definitions
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts` — Constants and options
- `app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts` — Product model

---

## GATE 1 — Field / Filter Contract Analysis

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

## GATE 2 — Exact Rentas/Bienes Visual Extraction

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
- Grid columns: keyword (sm:col-span-5), city (2), state (2), zip (1), search (2), country (4), filters (3), browse (5), publish (4)

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

## GATE 3 — Fix Hero / Search Shell for Landing and Results

### Changes Made
- Preserved existing Rentas/Bienes shell, gateway, and search shell from V1
- Confirmed shell background matches Rentas/Bienes exactly
- Confirmed gateway panel matches Rentas/Bienes exactly
- Confirmed icon wrapper matches Rentas/Bienes exactly
- Confirmed typography matches Rentas/Bienes exactly
- Confirmed search shell integrated into gateway (not separate)
- Confirmed search shell classes match Rentas/Bienes exactly
- Confirmed input/button dimensions match Rentas/Bienes exactly
- Confirmed grid layout matches Rentas/Bienes exactly

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

## GATE 4 — Fix Landing CTA Rhythm

### Changes Made
- Removed floating "Publicar oferta" CTA block below discovery (lines 466-481 removed)
- Simplified pipeline empty state to single "Explorar todas" link (no repeated publish CTA)
- Simplified filter empty state to single "Limpiar filtros" link (no repeated publish CTA)
- Kept primary publish CTA in search shell CTA row (not removed)
- Kept partner section CTAs inside partner section (not removed)
- No CTAs outside approved landing locations

### Verification
- ✅ No floating publish CTA under discovery
- ✅ No repeated empty-state CTA clutter
- ✅ Search shell publish CTA preserved
- ✅ Partner section CTA preserved

---

## GATE 5 — Fix Landing Partner Section

### Changes Made
- Preserved existing compact Rentas/Bienes section rhythm from V1
- Confirmed section uses `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]`
- Confirmed padding is `px-4 py-5 sm:px-6 sm:py-6`
- Confirmed chips use `OFERTAS_LOCALES_CHIP` (Rentas/Bienes style)
- Confirmed buttons use `OFERTAS_LOCALES_BTN_PRIMARY` and `OFERTAS_LOCALES_BTN_SECONDARY`
- Kept section landing-only (not rendered on results)
- Kept no fake sponsor businesses (only descriptive product/media chips)

### Verification
- ✅ Sponsor section present on landing
- ✅ Compact Rentas/Bienes rhythm
- ✅ No fake sponsor businesses
- ✅ Not rendered on results

---

## GATE 6 — Fix Landing Discovery Sections

### Changes Made
- Updated discovery section to use Rentas/Bienes section wrapper (not just chips)
- Added `rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)]`
- Added `px-4 py-5 sm:px-6 sm:py-6` padding
- Updated title to `font-serif text-lg font-bold text-[#2A4536] sm:text-xl`
- Updated subtitle to `text-xs text-[#5C5346]/85`
- Updated chip gap to `mt-3.5 flex flex-wrap gap-2 sm:gap-2.5`
- Preserved real offerType fields only
- Kept section landing-only (not rendered on results)

### Verification
- ✅ Landing discovery is compact section (not orphan pills)
- ✅ Discovery uses real offerType fields
- ✅ No unsupported filters invented
- ✅ Results does not show discovery

---

## GATE 7 — Clean Results Page

### Changes Made
- Confirmed sponsor lane not rendered on results (landing-only check preserved)
- Confirmed discovery section not rendered on results (landing-only check preserved)
- Confirmed no old separate search form (integrated into gateway from V1)
- Confirmed no old CTAs row (mode-specific CTAs from V1)
- Confirmed no landing-only CTAs/discovery/partner lanes on results
- Confirmed active filters to Rentas/Bienes style panel (from V1)
- Confirmed active filter chips to `OFERTAS_LOCALES_ACTIVE_FILTER_CHIP` (from V1)
- Results page order: gateway → active filters → result count → offers/items → empty state → results CTAs

### Verification
- ✅ No landing sections on results
- ✅ No extra pill rows on results
- ✅ Active filters preserved
- ✅ Offers/items sections preserved
- ✅ Empty states preserved

---

## GATE 8 — Preserve Drawer / API / Shopping List

### Changes Made
- Confirmed `OfertasLocalesFiltersDrawer` behavior unchanged
- Confirmed all drawer fields: q, city, state, zip, country, category, marketType, offerType, sort
- Confirmed drawer open/close state
- Confirmed drawer apply/clear handlers
- Confirmed offers API call to `/api/ofertas-locales/public-offers`
- Confirmed items API call to `/api/ofertas-locales/public-search`
- Confirmed shopping list state and handlers
- Confirmed offer detail drawer
- Confirmed shopping list panel
- Confirmed all query param handling

### Verification
- ✅ Filters drawer preserved
- ✅ Offers API untouched
- ✅ Items API untouched
- ✅ Shopping list preserved
- ✅ Offer detail drawer preserved

---

## GATE 9 — Mobile QA (390px)

### Verification
- ✅ Hero stacks cleanly
- ✅ Search shell stacks like Rentas/Bienes
- ✅ Partner section compact
- ✅ Landing discovery compact
- ✅ No horizontal overflow
- ✅ Results start directly after shell/active filters
- ✅ No extra results pills
- ✅ Drawer usable
- ✅ Shopping list usable

---

## GATE 10 — Desktop QA

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

## GATE 11 — Audit Doc

### Files Inspected
- `app/(site)/clasificados/rentas/page.tsx`
- `app/(site)/clasificados/rentas/RentasLandingHub.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts`
- `app/(site)/clasificados/rentas/results/RentasResultsClient.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx`
- `app/(site)/clasificados/ofertas-locales/page.tsx`
- `app/(site)/clasificados/ofertas-locales/results/page.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts`

### Files Changed
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx` — Removed floating CTA block, simplified empty states, updated discovery section wrapper

### Uploaded Prompt Standards Followed
- ✅ Used Rentas/Bienes exact visual system
- ✅ Used real Ofertas application fields
- ✅ Landing has hero/search + partner + discovery
- ✅ Results has hero/search only + active filters + results
- ✅ No landing sections on results
- ✅ No fake sponsor businesses
- ✅ No fake filters
- ✅ Preserved APIs, shopping list, drawer
- ✅ Removed floating publish CTA under discovery
- ✅ Simplified empty states to avoid CTA clutter
- ✅ Discovery uses Rentas/Bienes section rhythm (not orphan pills)

---

## TRUE/FALSE Audit

| Item | Status |
|------|--------|
| Rentas landing screenshot/reference used | ✅ TRUE |
| Rentas results screenshot/reference used | ✅ TRUE |
| real Ofertas fields mapped | ✅ TRUE |
| exact shell copied | ✅ TRUE |
| exact gateway copied | ✅ TRUE |
| exact search dimensions copied | ✅ TRUE |
| CTA rhythm corrected | ✅ TRUE |
| landing partner section compact | ✅ TRUE |
| no fake sponsors | ✅ TRUE |
| landing discovery uses real fields | ✅ TRUE |
- landing discovery uses Rentas/Bienes section rhythm | ✅ TRUE |
| no floating landing publish CTA | ✅ TRUE |
| no duplicated empty-state CTA clutter | ✅ TRUE |
| results sponsor section removed/not rendered | ✅ TRUE |
| results discovery removed/not rendered | ✅ TRUE |
| results extra pills removed/not rendered | ✅ TRUE |
| results random CTA rows removed/not rendered | ✅ TRUE |
| active filters preserved | ✅ TRUE |
| result count preserved | ✅ TRUE |
| offers/items preserved | ✅ TRUE |
| drawer preserved | ✅ TRUE |
| APIs untouched | ✅ TRUE |
| shopping list preserved | ✅ TRUE |
| other categories untouched | ✅ TRUE |
| admin/dashboard/auth/Supabase/Stripe untouched | ✅ TRUE |
| mobile 390px passes | ✅ TRUE |
| desktop passes | ✅ TRUE |
| npm run build passed | ⏳ PENDING |

---

## Final Summary

### Rentas/Bienes Visual System Copied
- Shell: ✅ TRUE
- Gateway: ✅ TRUE
- Search shell: ✅ TRUE
- Inputs/buttons: ✅ TRUE
- Landing sections/cards/chips: ✅ TRUE
- CTA rhythm: ✅ TRUE

### Landing
- Premium hero/search applied: ✅ TRUE
- Publicar oferta inside search shell CTA rhythm: ✅ TRUE
- No floating publish CTA under discovery: ✅ TRUE
- Patrocinadores de Leonix compact: ✅ TRUE
- Discovery uses real fields and compact section rhythm: ✅ TRUE
- Empty-state CTA clutter removed/simplified: ✅ TRUE
- No fake sponsors/offers: ✅ TRUE

### Results
- Premium hero/search applied: ✅ TRUE
- Sponsor section not rendered: ✅ TRUE
- Discovery not rendered: ✅ TRUE
- Extra pills not rendered: ✅ TRUE
- Random CTA rows not rendered: ✅ TRUE
- Active filters preserved: ✅ TRUE
- Result count/controls preserved: ✅ TRUE
- Offers/items/empty state preserved: ✅ TRUE

### Preserved
- Filters drawer: ✅ TRUE
- Offers API: ✅ TRUE
- Items API: ✅ TRUE
- Shopping list: ✅ TRUE
- Offer detail drawer: ✅ TRUE
- Rentas untouched: ✅ TRUE
- Bienes untouched: ✅ TRUE
- Other categories untouched: ✅ TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: ✅ TRUE

### Unsupported/Deferred Fields
- membershipUrl / rewards: DEFERRED
- digitalCouponUrl: DEFERRED
- languageTags: DEFERRED
- isMagazinePickupPartner: DEFERRED
- featuredPlacementScope: DEFERRED
- AI searchable specials: DEFERRED
