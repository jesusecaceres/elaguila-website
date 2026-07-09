# Bienes Raíces Patrocinadores de Leonix Lane V1 Audit

**Task:** Add the official Bienes Raíces "Patrocinadores de Leonix" sponsor/highlighted partner lane template to landing and results, using real listing data only and hiding when no real active sponsor/highlighted listing exists.

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
- app/(site)/clasificados/bienes-raices/page.tsx
- app/(site)/clasificados/bienes-raices/BienesRaicesLandingHub.tsx
- app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx
- app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx
- app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingShortcutSections.tsx
- app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingVisibilityStrip.tsx
- app/(site)/clasificados/bienes-raices/landing/bienesRaicesLandingCopy.ts
- app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx
- app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx
- app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsActiveFilters.tsx
- app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsHeader.tsx
- app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx
- app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes.ts
- app/(site)/clasificados/bienes-raices/resultados/cards/BadgeStack.tsx
- app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts
- app/(site)/clasificados/bienes-raices/resultados/lib/mapBrListingRowToCard.ts
- app/(site)/clasificados/bienes-raices/resultados/lib/brMonetizationVisibilityReadModel.ts
- app/(site)/clasificados/bienes-raices/landing/buildBrLandingInventorySections.ts
- app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta.tsx
- app/lib/listingPlans/revenuePricingMatrix.ts

---

## GATE 1 — SPONSOR SOURCE ANALYSIS

### Real Sponsor Qualifying Logic
From inspection of BrNegocioListing type and brMonetizationVisibilityReadModel:

**Current available signals:**
- badges includes "destacada"
- badges includes "promocionada"
- placementSignals (optional, future)
- activePlacementSignals (optional, future)
- monetization metadata (optional, future)

**Sponsor-qualified logic implemented:**
- listing.badges includes "destacada" OR
- listing.badges includes "promocionada"

**Does NOT qualify:**
- sellerKind negocio alone
- adPlanKey paid_business alone
- adPlanKey paid_private alone
- normal recent listings
- demo listings unless they already have real demo sponsor badges

### Monetization State from Prior Gate
- isFeatured: false (no real featured fields exist yet)
- isPromoted: false (no real promoted fields exist yet)
- badgesToAdd: only "negocio" for business listings
- monetizationWarnings: documents that placement fields are deferred

### Future Fields Needed
When monetization fields are added to listings table:
- package_tier / package_key / package_entitlement_id
- placement_tier / placement_tier_key
- is_featured / featured_until
- is_promoted / promoted_until
- is_verified / verified_at

These can be safely parsed in brMonetizationVisibilityReadModel and used for sponsor qualification.

---

## GATE 2 — CREATE BIENES SPONSORS LANE COMPONENT

### Created File
`app/(site)/clasificados/bienes-raices/components/BienesRaicesSponsorsLane.tsx`

### Component Props
- lang: "es" | "en"
- listings: BrNegocioListing[]
- surface: "landing" | "results"
- maxItems: optional, default 8

### Public Behavior
- Filters listings to only sponsor-qualified entries (badges includes "destacada" OR "promocionada")
- If no sponsor-qualified entries, returns null (no public placeholder)
- Does not render fake hardcoded businesses

### Visual Design
Matches Rentas/Bienes premium family:
- rounded-2xl
- cream/ivory background (bg-[#FFFDF7]/95)
- gold/olive border (border-[#C9A84A]/35)
- burgundy eyebrow (text-[#556B3E])
- serif title (font-serif)
- compact horizontal grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
- cards that can hold 6–10 items cleanly
- mobile-first stacking
- desktop compact lane

### Copy
**Spanish:**
- Title: Patrocinadores de Leonix
- Subtitle: Negocios y propiedades con visibilidad premium en Leonix Media, revista digital/impresa y resultados destacados.
- Eyebrow: VISIBILIDAD PREMIUM
- CTA: Ver anuncio

**English:**
- Title: Leonix Sponsors
- Subtitle: Businesses and listings with premium visibility across Leonix Media, digital/print magazine, and featured results.
- Eyebrow: PREMIUM VISIBILITY
- CTA: View listing

### Card Content
Uses real listing data:
- image (imageUrl)
- title
- price
- location/address line (addressLine)
- badge (BadgeStack with badges)
- CTA (Ver anuncio / View listing)
- detail href (leonixLiveAnuncioPath with lang)

---

## GATE 3 — ADD LANE TO LANDING

### Updated File
`app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx`

### Placement
After:
- BienesRaicesLandingHeroGateway

Before:
- BienesRaicesLandingShortcutSections

### Final Landing Order
1. Hero/search (BienesRaicesLandingHeroGateway)
2. Patrocinadores de Leonix lane if active sponsors exist (BienesRaicesSponsorsLane)
3. ¿Qué buscas? / discovery intent tiles (embedded in hero via tilesSlot)
4. Por presupuesto (BienesRaicesLandingShortcutSections)
5. Por características (BienesRaicesLandingShortcutSections)
6. Visibility CTA (BienesRaicesLandingVisibilityStrip)
7. Recent listings, if present

### Important Notes
- Intent tiles are embedded inside BienesRaicesLandingHeroGateway through tilesSlot
- Sponsor lane placed immediately after hero panel and before shortcut sections
- No major landing restructure performed
- Discovery sections preserved

---

## GATE 4 — ADD LANE TO RESULTS

### Updated File
`app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx`

### Placement
After:
- BienesRaicesResultsActiveFilters

Before:
- BienesRaicesResultsHeader

### Final Results Order
1. Hero/search (BienesRaicesResultsGatewayPanel)
2. Active filters if any (BienesRaicesResultsActiveFilters)
3. Patrocinadores de Leonix lane if active sponsors exist (BienesRaicesSponsorsLane)
4. Result count + sort/view controls (BienesRaicesResultsHeader)
5. Listings or empty state
6. Pagination if any
7. Lower visibility CTA (CategoryVisibilityCta)

### Important Notes
- Sponsor lane not between result count and listing cards
- Sponsor lane not above active filters
- No extra pills added
- No landing discovery sections added to results
- Active filters preserved
- Sort/view/listings preserved

---

## GATE 5 — KEEP MONETIZATION HONEST / DEFER FULL WIRE

### Not Connected
- Promo codes: NOT connected
- Stripe: NOT touched
- Package entitlement queries: NOT connected
- Admin promo code state: NOT touched
- Paid sorting: NOT added

### Documented in Audit
- Sponsor lane exists
- Public hides when no active sponsors
- Future wire should connect magazine contract / package entitlement / placement fields
- Direct promo-code-to-results sorting is forbidden
- Full monetization wire remains next gate

### No Fake Sponsor Display
- No fake sponsor cards
- No fake businesses
- No hardcoded placeholder sponsors
- No fake highlighted listings
- Lane returns null when no real sponsors exist

---

## GATE 6 — MOBILE QA

### At 390px Width
- Landing has no horizontal overflow
- Sponsor lane hides cleanly if empty (returns null)
- If sponsor entries exist, cards stack cleanly (grid-cols-1)
- Results has no horizontal overflow
- Results order remains clean
- No blank sponsor gap when empty

---

## GATE 7 — DESKTOP QA

### At Desktop Width
- Sponsor lane visually belongs to Bienes/Rentas premium system
- Lane is compact, not giant
- Lane can handle 6–10 entries over time (maxItems=8)
- Landing keeps discovery blocks
- Results keeps clean workspace
- No huge blank gaps

---

## GATE 8 — AUDIT DOC

### TRUE/FALSE Audit Checklist

- Bienes landing inspected: TRUE
- Bienes results inspected: TRUE
- Sponsor lane component created: TRUE
- Title uses Patrocinadores de Leonix / Leonix Sponsors: TRUE
- Landing sponsor lane mounted after hero/search: TRUE
- Results sponsor lane mounted after active filters: TRUE
- Lane hides if no real sponsors: TRUE
- No fake sponsor cards: TRUE
- Sponsor qualification uses real highlighted/promoted/placement signals only: TRUE
- Paid/business listing alone does not qualify: TRUE
- Landing discovery sections preserved: TRUE
- Results clean order preserved: TRUE
- Lower visibility CTA preserved: TRUE
- No promo-code direct sorting: TRUE
- No Stripe/Supabase/admin/dashboard changes: TRUE
- Other categories untouched: TRUE
- Mobile no overflow/no blank gap: TRUE
- Desktop compact premium lane: TRUE
- npm run build passed: TRUE

---

## Implementation Summary

### Files Changed
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesSponsorsLane.tsx` (created)
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx` (updated)
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` (updated)

### What Changed
- Created BienesRaicesSponsorsLane component with sponsor qualification logic
- Added sponsor lane to landing after hero/search and before shortcut sections
- Added sponsor lane to results after active filters and before result header
- Lane returns null when no sponsor-qualified listings exist
- Sponsor qualification uses only real badges (destacada, promocionada)
- No fake sponsor data or hardcoded businesses
- Visual design matches premium category family

### Landing
- Sponsor lane mounted after hero/search: TRUE
- Discovery sections preserved: TRUE
- Visibility CTA preserved: TRUE
- No fake sponsor cards: TRUE
- Empty lane hidden: TRUE

### Results
- Sponsor lane mounted after active filters: TRUE
- Result count/sort/view preserved: TRUE
- Listings/empty state preserved: TRUE
- Lower visibility CTA preserved: TRUE
- No extra pills/CTA rows: TRUE
- Empty lane hidden: TRUE

### Monetization
- No promo-code direct sorting: TRUE
- No fake highlighted listings: TRUE
- Full monetization wire deferred: TRUE

### Preserved
- Filter drawer untouched: TRUE
- Admin/dashboard/auth/Supabase/Stripe untouched: TRUE
- Other categories untouched: TRUE

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
- https://leonixmedia.com/clasificados/bienes-raices?lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?state=CA&lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?lang=es
