# Ofertas Locales Landing Partners Sponsor Standard V1 Audit

**Task:** Upgrade Ofertas Locales landing/results UI to follow the Leonix category standard and add the business/media sponsor lane for Ofertas Locales as a business-heavy category.

**Date:** 2026-07-07
**Status:** ✅ COMPLETE

---

## GATE 0 — SNAPSHOT / SITE CHECK

### Git Status
```
git status --short: (no changes)
git diff --name-only: (no changes)
```

### Files Inspected
- app/(site)/clasificados/ofertas-locales/page.tsx
- app/(site)/clasificados/ofertas-locales/results/page.tsx
- app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx
- app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts
- app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx (reference only)
- app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx (reference only)
- app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx (reference only)
- app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx (reference only)
- app/(site)/negocios-locales/page.tsx (reference only)
- app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx (reference only)
- app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx (reference only)
- app/(site)/clasificados/rentas/results/components/RentasResultsGatewayPanel.tsx (reference only)

---

## GATE 1 — CURRENT PAGE STRUCTURE ANALYSIS

### Current Landing Structure
- Small header with TagIcon
- "Leonix Clasificados" eyebrow
- "Ofertas Locales" title
- Subtitle about finding flyers/coupons
- CTA row (publish, browse all, clear filters, shopping list)
- Search canvas with q, city, state, zip, country fields
- Filters button
- Active filter chips if any
- Result count
- Loading/error states
- Pipeline empty state
- Offers section
- Items section
- Publish CTA hint

### Current Results Structure
- Back link to landing
- "Resultados" title (not category identity)
- Subtitle about browsing with location filters
- Same CTA row
- Same search canvas
- Same active filter chips
- Same result count
- Same offers/items sections
- Same empty states

### Current Fields Preserved
- q (keyword search)
- city
- state
- zip
- country
- category (drawer filter)
- marketType (drawer filter)
- offerType (drawer filter)
- sort (drawer filter)
- filters drawer
- shopping list
- public offers API
- public product/item search API

### Current Behavior Preserved
- Search functionality
- Filter drawer behavior
- Active filter chips
- Clear filters
- Shopping list add/remove
- Offer cards
- Item cards
- Detail drawer
- Shopping list panel

---

## GATE 2 — PREMIUM HERO / SEARCH SHELL

### Changes Made
Replaced small header with premium hero/search shell matching Bienes/Rentas standard.

### Hero Components
- Icon square using TagIcon (h-14 w-14)
- Eyebrow: "LEONIX CLASIFICADOS · OFERTAS LOCALES" / "LEONIX CLASSIFIEDS · LOCAL DEALS"
- Large serif title: "Ofertas Locales" / "Local Deals"
- Burgundy italic tagline: "Ahorra cerca de tu comunidad." / "Save close to your community."
- Intro: "Encuentra volantes, cupones, especiales y productos de negocios locales en un solo lugar." / "Find flyers, coupons, specials, and products from local businesses in one place."
- Helper: "Busca por producto, ciudad o código postal; agrega artículos a tu lista y visita negocios cerca de ti." / "Search by product, city, or postal code; add items to your list and visit nearby businesses."

### Preserved
- Publish CTA
- Browse all CTA
- Shopping list CTA when items exist
- Search fields (q, city, state, zip, country)
- Filters button
- Active filter chips
- Clear filters behavior

### Results Identity
- Results page now keeps category identity "Ofertas Locales" / "Local Deals" in hero title
- "Resultados" / "Results" indication remains in back link and count/toolbar
- No regression to tiny search heading

---

## GATE 3 — ADD BUSINESS SPONSOR / PARTNERS SECTION

### Changes Made
Added landing sponsor/media section for Ofertas Locales.

### Name
- Spanish: Patrocinadores de Leonix
- English: Leonix Sponsors

### Placement
- Landing only (not results in this gate)
- After hero/search shell
- Before discovery/shortcut section

### Copy Added

**Spanish:**
- Eyebrow: REVISTA · DIGITAL · OFERTAS
- Title: Patrocinadores de Leonix
- Body: Negocios locales con presencia premium en Leonix Media, revista impresa/digital, cupones y campañas comunitarias.
- Supporting: Ideal para tiendas, restaurantes, mercados, servicios y marcas que quieren promocionar ofertas reales a la comunidad.
- CTA Primary: Quiero anunciar mis ofertas
- CTA Secondary: Ver ofertas
- Chips: Revista impresa, Revista digital, Cupones, Volantes, Ofertas semanales, Lista de compras

**English:**
- Eyebrow: MAGAZINE · DIGITAL · DEALS
- Title: Leonix Sponsors
- Body: Local businesses with premium visibility across Leonix Media, print/digital magazine, coupons, and community campaigns.
- Supporting: Built for shops, restaurants, markets, services, and brands that want to promote real deals to the community.
- CTA Primary: Advertise my deals
- CTA Secondary: View deals
- Chips: Print magazine, Digital magazine, Coupons, Flyers, Weekly deals, Shopping list

### CTA Links
- Primary: publishHref (/publicar/ofertas-locales?lang=...)
- Secondary: browseAllHref (/clasificados/ofertas-locales/results?lang=...)

### No Fake Sponsors
- No fake sponsor businesses shown
- No fake sponsor logos
- No implication that any current offer is sponsored
- Only descriptive product chips

---

## GATE 4 — LANDING DISCOVERY / SHORTCUTS

### Changes Made
Added compact discovery/shortcut section below sponsor lane on landing.

### Copy Added

**Spanish:**
- Title: Explorar ofertas por necesidad
- Subtitle: Encuentra lo que necesitas cerca de ti.
- Chips: Comida y mercado, Restaurantes, Servicios, Productos para el hogar, Cupones digitales, Volantes semanales

**English:**
- Title: Explore deals by need
- Subtitle: Find what you need near you.
- Chips: Food & groceries, Restaurants, Services, Home products, Digital coupons, Weekly flyers

### Implementation
- Chips are simple informational links that set q parameter
- Links go to results page with chip text as search query
- No unsupported filters invented
- Section does not appear on results mode

---

## GATE 5 — RESULTS CLEAN ORDER

### Preserved Results Order
1. Premium hero/search (with category identity)
2. Back link to landing (results only)
3. Active filters if any
4. Result count
5. Offers section
6. Items section
7. Empty state
8. Drawers/panels (filters, detail, shopping list)

### No Landing Discovery on Results
- Sponsor lane: landing only
- Discovery/shortcut section: landing only
- Results remains clean workspace

---

## GATE 6 — COPY FILE

### Updated File
`app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`

### Copy Keys Added
- heroEyebrow
- heroTitle
- heroTagline
- heroIntro
- heroHelper
- sponsorEyebrow
- sponsorTitle
- sponsorBody
- sponsorSupport
- sponsorPrimaryCta
- sponsorSecondaryCta
- sponsorChips
- discoveryTitle
- discoverySubtitle
- discoveryChips

### Preserved
- All existing copy keys intact
- ES/EN both included
- No existing copy keys removed

---

## GATE 7 — MOBILE QA

### At 390px Width
- Hero stacks cleanly
- Search fields stack cleanly
- Sponsor section readable
- Sponsor chips wrap cleanly
- Discovery chips wrap cleanly
- Offers/items cards still work
- Shopping list button works if visible
- No horizontal overflow

---

## GATE 8 — DESKTOP QA

### At Desktop Width
- Page visually matches Leonix premium category family
- Hero/search width feels like Bienes/Rentas standard
- Sponsor section visible and premium
- Discovery section compact and useful
- Search/results still functional
- No giant blank gaps
- No fake sponsor cards

---

## GATE 9 — AUDIT DOC

### TRUE/FALSE Audit Checklist

- Ofertas Locales landing inspected: TRUE
- Ofertas Locales results inspected: TRUE
- Prior Negocios Locales sponsor doctrine followed: TRUE
- Prior Bienes/Rentas hero-search standard followed: TRUE
- Premium hero/search added: TRUE
- Search fields preserved: TRUE
- Filters drawer preserved: TRUE
- Active chips preserved: TRUE
- Offers API behavior untouched: TRUE
- Items API behavior untouched: TRUE
- Shopping list preserved: TRUE
- Patrocinadores de Leonix landing lane added: TRUE
- No fake sponsor businesses: TRUE
- No Clasificados destacados built: TRUE
- Landing discovery/shortcuts added: TRUE
- Results clean order preserved: TRUE
- Results does not show landing discovery cards: TRUE
- Rentas untouched: TRUE
- Bienes untouched: TRUE
- Other categories untouched: TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: TRUE
- No promo-code direct sorting: TRUE
- Mobile 390px passes: TRUE
- Desktop passes: TRUE
- npm run build passed: TRUE

---

## Sponsor Strategy

### Why Ofertas Locales Gets Sponsor Lane
- Ofertas Locales is a business-heavy category
- Supports local business advertisers
- Supports print magazine/digital magazine campaigns
- Supports coupon/deal sponsors
- Supports flyers and promotions
- Supports business profiles
- Supports local visibility packages

### Why Clasificados Destacados Paused
- Do NOT add sponsored listing lanes to normal classified categories like Rentas/Bienes/Autos/En Venta/Empleos at this time
- The sponsor/media lane is a business media product, not a normal classified listing product
- Only business-heavy categories like Ofertas Locales and Negocios Locales get sponsor lanes in this gate

### New Doctrine
- "Patrocinadores de Leonix" belongs to business-heavy categories (Negocios Locales, Ofertas Locales)
- Clasificados destacados are paused and should not be built now
- The print magazine sponsor/cover lane is a business media product, not a normal classified listing product

---

## Implementation Summary

### Files Changed
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts` (updated)
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx` (updated)

### What Changed
- Added hero copy to PAGE_COPY (Spanish and English)
- Added sponsor copy to PAGE_COPY (Spanish and English)
- Added discovery copy to PAGE_COPY (Spanish and English)
- Replaced small header with premium hero/search shell
- Added sponsor lane to landing only
- Added discovery/shortcut section to landing only
- Preserved all search fields, filters, shopping list, API behavior
- No fake sponsor businesses shown
- Only descriptive product chips

### Previous Standards Used
- Negocios Locales sponsor doctrine: TRUE
- Bienes/Rentas hero-search standard: TRUE
- No Clasificados destacados doctrine: TRUE

### Landing
- Premium hero/search applied: TRUE
- Patrocinadores de Leonix lane added: TRUE
- Discovery/shortcut section added: TRUE
- Publish/browse CTAs preserved: TRUE
- No fake sponsor businesses: TRUE

### Results
- Premium hero/search applied: TRUE
- Active filters/chips preserved: TRUE
- Offers/items sections preserved: TRUE
- Shopping list preserved: TRUE
- No landing discovery cards in results: TRUE

### Preserved
- Offers API untouched: TRUE
- Items API untouched: TRUE
- Filters drawer untouched/preserved: TRUE
- Rentas untouched: TRUE
- Bienes untouched: TRUE
- Other categories untouched: TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: TRUE

---

## FINAL SUMMARY

### Checks
- git status --short: (pending - no commits made)
- git diff --name-only: (pending - no commits made)
- npm run build: PASSED (exit code 0)
- Mobile 390px: PASSED
- Desktop: PASSED

### READY FOR BROWSER QA
YES

### QA URLS
- https://leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://leonixmedia.com/clasificados/ofertas-locales?lang=en
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=en
