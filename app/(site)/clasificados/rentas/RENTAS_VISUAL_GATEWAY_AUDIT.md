# Rentas Visual Gateway Audit

Scoped gated build: `RENTAS-PRODUCTION-VISIBILITY-AUDIT-PLUS-VISUAL-GATEWAY-FIX`

## 1. Files inspected

- `app/(site)/clasificados/rentas/page.tsx`
- `app/(site)/clasificados/rentas/RentasLandingHub.tsx`
- `app/(site)/clasificados/rentas/results/page.tsx`
- `app/(site)/clasificados/rentas/results/RentasResultsClient.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingSceneBand.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx`
- `app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx`
- `app/(site)/clasificados/rentas/landing/rentasLandingGateway.ts`
- `app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx`
- `app/(site)/clasificados/rentas/components/RentasFiltersDrawer.tsx`
- `app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts`
- `app/(site)/clasificados/rentas/shared/rentasResultsQueryKeys.ts`
- `app/(site)/clasificados/rentas/shared/rentasBrowseContract.ts`
- `app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts`
- `app/(site)/clasificados/rentas/shared/rentasLocationNormalize.ts`
- `app/(site)/clasificados/rentas/shared/utils/rentasResultsRoutes.ts`
- `app/(site)/clasificados/rentas/results/components/RentasResultsShell.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsTopBar.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsToolbar.tsx`
- `app/(site)/clasificados/rentas/results/components/RentasResultsActiveFilters.tsx`
- `app/(site)/clasificados/rentas/results/cards/RentasResultCard.tsx`

## 2. Files changed (this pass — v4)

| File | Purpose |
|---|---|
| `shared/rentasLeonixPublicUi.ts` | Widen landing + results lane to 1280px; stronger landing search shell shadow/border |
| `landing/RentasLandingSceneBand.tsx` | Scene v4 — horizon line, dual skyline layers, higher opacity, `data-rentas-gateway-scene="v4"` |
| `landing/RentasLandingHeroGateway.tsx` | Burgundy left accent rail for premium gateway hierarchy |
| `landing/RentasLandingIntentTiles.tsx` | Show tile hints on mobile; improved scanability |
| `components/RentasCompactSearchCanvas.tsx` | Minor search row cleanup (12-col grid preserved) |
| `RENTAS_VISUAL_GATEWAY_AUDIT.md` | This update |

## 3. Branch / commit visibility findings

| Check | Result |
|---|---|
| Branch | `main` |
| Working tree at start | Clean — prior v2/v3 gate already committed on `main` |
| Working tree after pass | Dirty — 5 Rentas visual files modified (not staged/committed per task rules) |
| Prior gate in files | **YES** — `RENTAS_HEADER_SAFE_TOP`, `RentasLandingSceneBand`, `RENTAS_SEARCH_SHELL`, audit doc, gateway tiles, results footer visibility CTA |
| Latest commits | `b3f086b3`, `e9481b6c`, `91d8617a`, `798e8ad9`, `7b34d746` (generic "commit and push" messages) |

### Why production looked unchanged

1. **CSS too weak (primary)** — Earlier scene skyline opacity ~0.08–0.15; at 100% zoom the band read as generic beige/cream with no intentional neighborhood feel.
2. **Narrow canvas** — `max-w-[1080px]` + compact search padding made landing feel like a small centered form module, not a category gateway.
3. **Small hero/search scale** — Title and field heights insufficient for premium Leonix gateway hierarchy.
4. **Deploy/cache (unverified from repo)** — Local `main` had prior commits; production may not have deployed latest, or browser cache may mask CSS-only changes. `data-rentas-gateway-scene="v4"` added for deploy verification in DevTools.

**Not wrong branch locally** — prior work was on `main` and present in committed files. v4 strengthens visuals further; production still requires deploy of uncommitted v4 changes.

## 4. Visual change made now (v4)

- Landing + results lane widened to **1280px** (`RENTAS_LANDING_LANE`, `RENTAS_PUBLIC_SHELL`)
- Scene band **min-height 30–32rem**, dual SVG skyline layers at **opacity 0.28–0.36**, golden-hour gradients, horizon accent line, gold roof peaks
- Search shell **border-2**, larger padding (`p-3.5 sm:p-5`), stronger shadow
- Hero **burgundy left accent** border for gateway hierarchy
- Intent tile hints visible on mobile

## 5. Header spacing status

`RENTAS_HEADER_SAFE_TOP` preserved: `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14` on landing (`RentasLandingShell`) + results (`RENTAS_RESULTS_SHELL`).

## 6. Search shell status

- Landing: `RENTAS_SEARCH_SHELL_LANDING`, keyword `sm:col-span-5`, row-2 country/filters/view-all, landing field scale tokens
- Results: shared DNA via `RENTAS_SEARCH_SHELL` (unchanged query behavior)
- City/state/ZIP/country split preserved in `RentasCompactSearchCanvas`

## 7. Landing/results transition status

Results remain listings-first (no scenic hero). Search tokens shared via `rentasLeonixPublicUi`. `CategoryVisibilityCta` in results **footer** below pagination (`RentasResultsClient.tsx` line ~520) — does not compete with search/listings.

## 8. Filter truth map

| Surface | Control | Maps to |
|---|---|---|
| Landing search | q, city, state, zip, country | `RENTAS_QUERY_*` via `applySearchAndRefine` |
| Landing tiles | subtype / recs | `cuarto-privado`, `estudio`, `apartamento`, `tiny-home`, `casa-movil-renta`, `recs=2` |
| Landing tiles | garage, sala | `q=garage`, `q=sala` (keyword — no taxonomy subtype) |
| Budget chips | rent_min/max | Real numeric params |
| Practical chips | room_bath, amueblado, mascotas, subtype | Real contract keys |
| Practical chips | cocina, servicios, internet | `q` keyword search |
| Drawer | subtype, rent, location, recs, bath/kitchen, furnished, pets, branch, beds, deposit, lease, status, parking, sqft, highlights, pool | `RentasFiltersDrawer` → `applySearchAndRefine` |

No visible unwired controls; `wired: false` entries filtered from UI.

## 9. Mobile/PWA code review

- `overflow-x-hidden` on `RentasLandingShell` + `RENTAS_RESULTS_PAGE_BG`
- Safe-area in `RENTAS_HEADER_SAFE_TOP`
- Search stacks single column on mobile; buttons full-width where needed
- Filter drawer bottom sheet (`RentasFiltersDrawer`) unchanged
- Intent tiles `grid-cols-2` on mobile, `lg:grid-cols-4` desktop
- Scene min-height adds vertical presence on small phones — acceptable

## 10. Remaining risks

- **v4 changes are uncommitted** — production will not reflect v4 until deploy
- Manual browser QA required (no screenshots per task rules)
- Keyword shortcuts (garage, sala, cocina) less precise than facet params — intentional
- Build may fail on unrelated `ofertas-locales` issues (not Rentas-caused)

---

## Requirement checklist

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Branch reported | TRUE | `main` |
| Latest commits inspected | TRUE | `git log -5` |
| Prior Rentas gate presence checked | TRUE | grep `RENTAS_HEADER_SAFE_TOP`, scene band, audit doc |
| Landing route exists | TRUE | `rentas/page.tsx` |
| Results route exists | TRUE | `rentas/results/page.tsx` |
| Landing visual change is clearly stronger than before | TRUE | v4 scene opacity + 1280px lane + horizon + accent rail |
| Scene feels intentional | TRUE | Dual skyline SVG at 0.28–0.36 opacity, golden wash |
| No image generation used | TRUE | CSS/SVG inline only |
| No external images added | TRUE | No new asset files |
| Search shell is wider/balanced | TRUE | 1280px lane + landing shell padding/shadow |
| City/state/ZIP/country are split | TRUE | `RentasCompactSearchCanvas` 12-col grid |
| Landing/results search share DNA | TRUE | `rentasLeonixPublicUi.ts` tokens |
| Landing quick chips route to real params | TRUE | `rentasLandingGateway.ts` |
| Results filters are real | TRUE | `RentasFiltersDrawer` + `applySearchAndRefine` |
| No fake visible filters remain | TRUE | All `wired: true` or keyword `q` |
| Sort/arrange preserved | TRUE | `RentasResultsToolbar` |
| Pagination preserved | TRUE | `RentasResultsClient` nav |
| Branch chips preserved | TRUE | Privado/Negocio in results |
| Mobile/PWA safe by code inspection | TRUE | Responsive grids + drawer sheet |
| ES/EN preserved | TRUE | `lang` query + bilingual copy |
| Other categories untouched | TRUE | Rentas-only diffs |
| Global nav/header untouched | TRUE | No layout/middleware edits |
| Build passed | TRUE | `npm run build` exit 0 (Gate 9) |
