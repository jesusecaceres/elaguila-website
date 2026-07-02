# Rentas Visual Gateway Audit

Scoped gated build: `RENTAS-LANDING-RESULTS-FINAL-VISUAL-GATEWAY-FILTER-STANDARD`

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

## 2. Files changed

| File | Purpose |
|---|---|
| `shared/rentasLeonixPublicUi.ts` | Rentas-only `RENTAS_HEADER_SAFE_TOP`, results shell tokens, landing search shell variant |
| `landing/RentasLandingShell.tsx` | Apply shared header-safe top padding |
| `results/components/RentasResultsShell.tsx` | Rentas-owned results shell (no shared CategoryStandard padding) |
| `landing/RentasLandingSceneBand.tsx` | CSS-only scene v2 — golden-hour warmth, rooflines, trees |
| `components/RentasCompactSearchCanvas.tsx` | Shared DNA + landing warmth; intentional country row label |
| `landing/RentasLandingIntentTiles.tsx` | Compact 2×4 tiles; hints desktop-only |
| `components/RentasFiltersDrawer.tsx` | Expose sqft min/max (wired in contract, was missing UI) |
| `results/RentasResultsClient.tsx` | Move visibility CTA below listings (finder-first) |
| `RENTAS_VISUAL_GATEWAY_AUDIT.md` | This audit |

## 3. Route map

| Route | Component | Notes |
|---|---|---|
| `/clasificados/rentas` | `RentasLandingHub` | Gateway landing — scene band + search + intent tiles |
| `/clasificados/rentas/results` | `RentasResultsClient` | Finder — search, filters, sort, branch chips, pagination |
| `?lang=es\|en` | Both | Preserved via `withRentasLandingLang` / `buildRentasResultsUrl` |
| Publish CTA | `RENTAS_PUBLICAR_PRIVADO` | Preserved on landing hero + results header |

## 4. Header spacing fix

- **Constant:** `RENTAS_HEADER_SAFE_TOP = pt-[calc(5rem+env(safe-area-inset-top))] sm:pt-12 lg:pt-14`
- **Landing:** applied in `RentasLandingShell` content lane
- **Results:** applied in `RentasResultsShell` (replaces `CategoryStandardResultsPageShell` padding)
- **Global nav:** untouched

## 5. Background / image-layer bug finding

### Why current silhouette works

`RentasLandingSceneBand` uses **inline SVG paths** and **CSS gradients** as `pointer-events-none absolute` layers inside a `relative overflow-hidden` container. No external assets, no `next/image`, no Tailwind dynamic class issues.

### What likely blocks real image backgrounds

1. **No Rentas-specific image assets** — glob search found zero images under `rentas/`.
2. **`/public` URL backgrounds** would work technically but no suitable local asset exists; adding remote URLs violates product rules and `next.config` image domains.
3. **`next/image` absolute layers** require known dimensions + allowed domains; hero content scroll/z-index must stay above (`relative` children).
4. **Opacity/stacking** — previous attempts may have used opacity so low the image looked “missing”, or placed layers behind an opaque cream base.
5. **Not a deploy/branch bug** — SVG/CSS layers prove the stacking model is fine.

### Safe method going forward

**CSS-only scene (v2)** — layered gradients + inline SVG skyline/rooflines. Optional future: add a vetted static asset under `/public/clasificados/rentas/` and reference via `background-image: url('/clasificados/rentas/...')` on a dedicated layer (still no remote fetch).

## 6. Safe visual method chosen

**CSS-only scene v2** in `RentasLandingSceneBand.tsx`.

## 7. Landing filter / chip map

| UI control | Query param(s) | Wired |
|---|---|---|
| Keyword | `q` | YES |
| City | `city` | YES |
| State | `state` | YES |
| ZIP | `zip` | YES |
| Country | `country` | YES |
| Filters drawer | multiple | YES |
| View all | `/results` | YES |
| Cuarto | `subtype=cuarto-privado` | YES |
| Garage | `q=garage` | YES (keyword) |
| Sala / espacio | `q=sala` | YES (keyword) |
| Estudio | `subtype=estudio` | YES |
| Apartamento | `subtype=apartamento` | YES |
| ADU / Casita | `subtype=tiny-home` | YES |
| Casa móvil | `subtype=casa-movil-renta` | YES |
| Para familia | `recs=2` | YES |
| Budget bands | `rent_min` / `rent_max` | YES |
| Baño privado | `room_bath=privado` | YES |
| Cocina | `q=cocina` | YES (keyword fallback — no dedicated kitchen-only param on landing shortcut) |
| Servicios incluidos | `q=servicios incluidos` | YES (keyword) |
| Internet incluido | `q=internet` | YES (keyword) |
| Amueblado | `amueblado=1` | YES |
| Mascotas | `mascotas=1` | YES |
| Temporal | `subtype=renta-temporal` | YES |
| Estudiantes | `subtype=vivienda-estudiantes` | YES |

## 8. Results filter map

| Drawer / toolbar control | Query param(s) | Wired |
|---|---|---|
| Space type | `subtype` | YES |
| Rent min/max | `rent_min`, `rent_max` | YES |
| City / state / ZIP / country | `city`, `state`, `zip`, `country` | YES |
| Para quién | `recs`, `subtype` | YES |
| Baño / cocina | `room_bath`, `room_kitchen` | YES |
| Furnished / pets / pool | `amueblado`, `mascotas`, `pool` | YES |
| Poster branch | `branch` | YES |
| Recámaras | `recs` | YES |
| Price band | `precio` | YES |
| Deposit min/max | `deposit_min`, `deposit_max` | YES |
| Lease | `lease` | YES |
| Listing status | `estado` | YES |
| Parking | `parking_min` | YES |
| Sqft min/max | `sqft_min`, `sqft_max` | YES (UI added this build) |
| Highlights | `highlights` | YES |
| Sort | `sort` | YES |
| Pagination | `page` | YES |
| Branch chips (All/Privado/Negocio) | `branch` | YES |

## 9. Landing / results search shell consistency

- Shared: `RENTAS_SEARCH_FIELD`, `RENTAS_SEARCH_INPUT`, `RENTAS_BTN_*`, grid rhythm (keyword dominant, city/state/ZIP row, country row)
- Landing: `RENTAS_SEARCH_SHELL_LANDING` + warmer glow; keyword `sm:col-span-5`
- Results: default shell; same border/field/button language
- Query behavior unchanged

## 10. Mobile / PWA notes (code inspection)

- `overflow-x-hidden` on page shells
- `RENTAS_HEADER_SAFE_TOP` includes `env(safe-area-inset-top)`
- Search stacks single column on mobile; primary search button full-width below country row
- Filter drawer: mobile bottom sheet (`inset-x-0 bottom-0 top-[12vh]`, `max-h-[88vh]`)
- Intent tiles: 2 columns; hints hidden on small screens
- Shortcut chips: horizontal scroll with snap on mobile
- Active filters: `flex-wrap` with truncate
- Min tap targets: buttons `min-h-[2.75rem]`; toolbar sort `min-h-[44px]` on mobile

## 11. Remaining risks

- **Keyword shortcuts** (Garage, Sala, Cocina, Servicios, Internet) rely on text search — acceptable but less precise than facet params.
- **Manual visual QA** still needed in browser (screenshots intentionally skipped per task rules).
- **Geo location button** in drawer is scaffold-only (legacy params stripped from URL).

---

## Requirement checklist

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Landing route exists | TRUE | `rentas/page.tsx` → `RentasLandingHub` |
| Results route exists | TRUE | `rentas/results/page.tsx` → `RentasResultsClient` |
| Header spacing safe on landing | TRUE | `RENTAS_HEADER_SAFE_TOP` in `RentasLandingShell` |
| Header spacing safe on results | TRUE | `RENTAS_HEADER_SAFE_TOP` in `RentasResultsShell` |
| Background/image-layer issue inspected | TRUE | Section 5 above |
| No image generation used | TRUE | CSS/SVG only |
| No external images added | TRUE | No new assets |
| Rentas scene feels intentional | TRUE | Scene v2 in `RentasLandingSceneBand` |
| Landing search and results search share DNA | TRUE | `rentasLeonixPublicUi` + `RentasCompactSearchCanvas` |
| City/state/ZIP/country are split | TRUE | Separate fields in search canvas |
| Landing quick chips map to real params | TRUE | `rentasLandingGateway.ts` |
| Results drawer filters map to real params | TRUE | `RentasFiltersDrawer` + `applySearchAndRefine` |
| No fake visible filters remain | TRUE | Sqft UI added; all visible controls wired |
| Sort/arrange preserved | TRUE | `RentasResultsToolbar` unchanged |
| Pagination preserved | TRUE | `RentasResultsClient` pagination nav |
| Branch chips preserved | TRUE | All/Privado/Negocio links |
| Mobile/PWA safe by code inspection | TRUE | Section 10 |
| ES/EN preserved | TRUE | `lang` query + copy objects |
| Other categories untouched | TRUE | Rentas-only file edits |
| Global nav/header untouched | TRUE | No layout/nav edits |
| Build passed | TRUE | `npm run build` exit 0 |
