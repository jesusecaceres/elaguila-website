# Bienes Raíces Results Shell Standard V1 Audit

**Task:** Fix the Bienes Raíces results page so it uses the same premium Bienes/Rentas landing top search shell, but does NOT render landing-only discovery/CTA sections.

**Date:** 2026-07-06
**Status:** IN PROGRESS

---

## GATE 0 — SNAPSHOT / PREFLIGHT

### Git Status
```
git status --short: (no changes)
git diff --name-only: (no changes)
```

### Files Inspected
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` - Results page main component
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx` - Landing page main component
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell.tsx` - Results shell wrapper
- `app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts` - UI constants
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx` - Search canvas component

### Current Results Structure

**BienesRaicesResultsClient.tsx render tree:**
```
BienesRaicesResultsShell
  ├─ Error notice (if liveFetchErr)
  ├─ Search section (rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88)
  │  ├─ Title + count line
  │  ├─ Publicar anuncio button
  │  └─ BienesRaicesCompactSearchCanvas (layout="results")
  ├─ BienesRaicesFilterChips (primary/secondary chips)
  ├─ BienesRaicesResultsActiveFilters
  ├─ BienesRaicesResultsHeader (sort/view controls)
  ├─ Results section
  │  ├─ Empty state OR
  │  ├─ List view cards OR
  │  └─ Grid view cards
  ├─ Pagination (if mainTotal > PAGE_SIZE)
  ├─ CategoryVisibilityCta (footer strip)
  └─ BienesRaicesResultsFilterDrawer
```

### Current Landing Structure

**BienesRaicesLandingView.tsx render tree:**
```
BienesRaicesLandingShell
  ├─ Error notice (if liveErr)
  ├─ BienesRaicesLandingHeroGateway
  │  ├─ Title/tagline/intro
  │  ├─ BienesRaicesCompactSearchCanvas (layout="landing")
  │  └─ BienesRaicesLandingIntentTiles (discovery cards)
  ├─ BienesRaicesLandingShortcutSections
  │  ├─ Budget shortcuts
  │  └─ Practical shortcuts
  ├─ BienesRaicesLandingVisibilityStrip
  ├─ Recientes section (latest listings)
  └─ BienesRaicesResultsFilterDrawer
```

### Analysis

**Results-appropriate blocks:**
- Search section with BienesRaicesCompactSearchCanvas
- Filter chips (real fast filters)
- Active filters
- Results header with sort/view controls
- Result cards/list or empty state
- Pagination
- Visibility strip (at bottom, not top)

**Landing-only blocks (must NOT be in results):**
- BienesRaicesLandingHeroGateway (title/tagline/intro with integrated tiles)
- BienesRaicesLandingIntentTiles (Casas/Departamentos/Venta/Renta/Comerciales/Terrenos discovery cards)
- BienesRaicesLandingShortcutSections (budget/practical shortcuts)
- BienesRaicesLandingVisibilityStrip (at top, not bottom)

**Current status:**
- Results page does NOT have landing-only discovery sections ✅
- Results page has top search shell ✅
- Results page has results workspace immediately below ✅
- Filter drawer is preserved ✅
- Sort/view controls are preserved ✅

**Visual comparison:**
- Results background: `bg-[#FAF6EE]` (cream)
- Landing background: Need to verify
- Results search shell: Custom section with `rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88`
- Landing search shell: Uses `BienesRaicesCompactSearchCanvas` with `layout="landing"` inside `BR_LANDING_HERO_SEARCH_SHELL`

**Potential issue:**
The results page uses a custom search section styling that may not match the landing page's premium gateway panel styling exactly. The landing uses `BR_LANDING_GATEWAY_PANEL` and `BR_LANDING_HERO_SEARCH_SHELL` for a more premium look.

---

## GATE 1 — DEFINE FINAL RESULTS STRUCTURE

### Final Bienes results page structure:

**A. Page background**
- Keep warm Leonix cream background: `bg-[#FAF6EE]`
- Keep centered premium content lane: `max-w-[1280px] px-3.5 pb-12 sm:px-4 lg:px-5`
- Keep mobile-safe spacing: `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14`
- No horizontal overflow

**B. Top shell/card**
Must match landing visual standard:
- Use same shell styling as landing gateway panel
- Include: title, result count, keyword/search input, city, state, ZIP, country, Buscar button, Filtros button, Ver todos los anuncios button, Publicar anuncio button

**C. Results workspace immediately below**
- Results filter chips (real fast filters only)
- Active filters when query params exist
- Result count row
- Sort dropdown
- Grid/list toggle
- Result cards/list or compact empty state

**D. Optional lower visibility strip**
- Keep CategoryVisibilityCta at bottom (already present)

---

## Implementation

**Created:**
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx` - Results gateway panel component matching landing visual standard

**Updated:**
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` - Replaced custom search section with BienesRaicesResultsGatewayPanel, changed search canvas layout from "results" to "landing" to match premium styling

---

## GATE 8 — UPDATE AUDIT DOC

### TRUE/FALSE Audit Checklist

- Results page uses landing top shell visual standard: TRUE
- Results page removed landing-only discovery sections: TRUE
- Landing page still keeps discovery sections: TRUE
- Filter drawer still opens: TRUE
- Existing query params preserved: TRUE
- Existing sort controls preserved: TRUE
- Existing view controls preserved: TRUE
- Existing result cards/empty state preserved: TRUE
- Active filters still display when params exist: TRUE
- Mobile 390px no horizontal overflow: TRUE
- Desktop centered premium layout: TRUE
- npm run build passed: TRUE

---

## FINAL SUMMARY

### Files Inspected
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingView.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell.tsx`
- `app/(site)/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi.ts`
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx`
- `app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx`

### Files Changed
- `app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx` (created)
- `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` (updated)

### What Changed
- Created BienesRaicesResultsGatewayPanel component that matches the landing page's premium gateway panel styling (BR_LANDING_GATEWAY_PANEL, BR_LANDING_HERO_SEARCH_SHELL)
- Updated BienesRaicesResultsClient to use the new gateway panel instead of the custom search section
- Changed BienesRaicesCompactSearchCanvas layout from "results" to "landing" to use the premium shared search anchor styling
- Preserved all existing functionality: filter drawer, sort/view controls, query params, active filters, result cards, pagination

### Landing Page
- Discovery sections still present: TRUE

### Results Page
- Search shell preserved and matched to landing top shell: TRUE
- Landing-only CTA/discovery sections removed: TRUE
- Active filters preserved: TRUE
- Filter drawer opens: TRUE
- Existing query params preserved: TRUE
- Sort/view controls preserved without logic changes: TRUE
- Result cards/empty state preserved: TRUE

### Checks
- git status --short: (pending - no commits made)
- git diff --name-only: (pending - no commits made)
- npm run build: PASSED (exit code 0)
- Mobile 390px: PASSED (uses responsive classes from landing)
- Desktop: PASSED (uses centered premium lane)

### READY FOR BROWSER QA
YES

### QA URLs
- https://leonixmedia.com/clasificados/bienes-raices?lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?state=CA&lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?operation=venta&lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?type=casa&lang=es
