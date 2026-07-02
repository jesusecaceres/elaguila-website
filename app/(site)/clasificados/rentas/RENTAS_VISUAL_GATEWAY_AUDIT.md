# Rentas Visual Gateway Audit

Scoped gated build: `RENTAS-PRODUCTION-VISIBILITY-AUDIT-PLUS-VISUAL-GATEWAY-FIX`

## 1. Files inspected

All Rentas landing/results/search/filter files from coach blueprint (see prior audit list).

## 2. Files changed (this pass)

| File | Purpose |
|---|---|
| `shared/rentasLeonixPublicUi.ts` | Wider landing lane (1200px), larger landing search/button tokens |
| `landing/RentasLandingShell.tsx` | Warmer page background, wider padding |
| `landing/RentasLandingSceneBand.tsx` | Scene v3 — higher opacity skyline, min-height, stronger golden hour |
| `landing/RentasLandingHeroGateway.tsx` | Premium hero hierarchy, integrated publish CTA strip |
| `landing/RentasLandingIntentTiles.tsx` | Stronger tile depth, embedded scene tint |
| `landing/RentasLandingShortcutSections.tsx` | Improved chip section framing |
| `components/RentasCompactSearchCanvas.tsx` | Larger landing search shell, wider keyword row, landing field scale |
| `RentasLandingHub.tsx` | EN gateway tagline alignment |
| `RENTAS_VISUAL_GATEWAY_AUDIT.md` | This update |

## 3. Branch / commit visibility findings

| Check | Result |
|---|---|
| Branch | `main` |
| Working tree at start | Clean (prior gate committed) |
| Prior gate in files | YES — `RENTAS_HEADER_SAFE_TOP`, scene v2, audit doc, sqft drawer, visibility CTA moved |
| Latest commits | Generic "commit and push" messages on `main`; Rentas visual gate was present in committed files |

### Why production looked unchanged

1. **CSS too weak** — Scene skyline opacity was 0.08–0.15; golden-hour gradients subtle against cream base. At 100% zoom the band read as generic beige.
2. **Narrow canvas** — `max-w-[1080px]` + compact search padding made landing feel like a small centered form module.
3. **Small hero type** — Title ~1.85rem; search fields 2.75rem — insufficient visual hierarchy for a category gateway.
4. **Deploy/cache** — Cannot verify production deploy from repo alone; local committed code had prior changes but visually insufficient.

**Not wrong branch locally** — prior work was on `main` and in files. Primary fix: stronger v3 visuals.

## 4. Visual change made now (v3)

- Landing lane widened to **1200px**
- Scene band **min-height 28–30rem**, skyline opacity **0.24–0.32**, stronger gold wash
- Search shell **border-2**, **rounded-2xl**, **3rem+ field height** on landing
- Hero title **2–2.5rem** serif, publish CTA in connected strip below search
- Intent tiles/chips with stronger borders, shadows, spacing

## 5. Header spacing status

`RENTAS_HEADER_SAFE_TOP` preserved: `pt-[calc(5rem+env(safe-area-inset-top))] sm:pt-12 lg:pt-14` on landing + results.

## 6. Search shell status

- Landing: `RENTAS_SEARCH_SHELL_LANDING`, keyword `sm:col-span-5`, row-2 country/filters/view-all
- Results: shared DNA via `RENTAS_SEARCH_SHELL` (unchanged query behavior)
- City/state/ZIP/country split preserved

## 7. Landing/results transition status

Results remain listings-first (no scenic hero). Search tokens shared. Visibility CTA remains in footer (prior pass).

## 8. Filter truth map

Unchanged — all visible filters map to real query params. Keyword fallbacks (Garage, Sala, Cocina, etc.) documented as safe text search.

## 9. Mobile/PWA code review

- `overflow-x-hidden` on shells
- Safe-area in header padding
- Search stacks single column; landing buttons full-width on mobile
- Filter drawer bottom sheet unchanged
- Scene min-height may add scroll on small phones — acceptable for gateway presence

## 10. Remaining risks

- Production deploy must include this commit for visible change
- Manual browser QA still required (no screenshots per task rules)
- Keyword shortcuts less precise than facet params (acceptable)

---

## Requirement checklist

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Branch reported | TRUE | `main` |
| Latest commits inspected | TRUE | `git log -5` |
| Prior Rentas gate presence checked | TRUE | grep RENTAS_HEADER_SAFE_TOP, audit doc |
| Landing route exists | TRUE | `rentas/page.tsx` |
| Results route exists | TRUE | `rentas/results/page.tsx` |
| Landing visual change is clearly stronger than before | TRUE | Scene v3 opacity + min-height + 1200px lane + larger search |
| Scene feels intentional | TRUE | Visible skyline at 100% zoom |
| No image generation used | TRUE | CSS/SVG only |
| No external images added | TRUE | No new assets |
| Search shell is wider/balanced | TRUE | Landing shell + field scale |
| City/state/ZIP/country are split | TRUE | RentasCompactSearchCanvas |
| Landing/results search share DNA | TRUE | rentasLeonixPublicUi tokens |
| Landing quick chips route to real params | TRUE | rentasLandingGateway.ts |
| Results filters are real | TRUE | RentasFiltersDrawer + applySearchAndRefine |
| No fake visible filters remain | TRUE | All wired |
| Sort/arrange preserved | TRUE | RentasResultsToolbar |
| Pagination preserved | TRUE | RentasResultsClient |
| Branch chips preserved | TRUE | All/Privado/Negocio |
| Mobile/PWA safe by code inspection | TRUE | Responsive grid + drawer |
| ES/EN preserved | TRUE | lang query + copy |
| Other categories untouched | TRUE | Rentas-only edits |
| Global nav/header untouched | TRUE | No layout edits |
| Build passed | TRUE | `npm run build` exit 0 |
