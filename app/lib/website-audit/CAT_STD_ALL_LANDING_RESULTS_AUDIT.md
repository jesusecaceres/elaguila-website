# Gate CAT-STD-ALL — Category Landing + Results Audit

**Date:** 2026-06-03

## 1. Files inspected

All `app/(site)/clasificados/{slug}/` landing + results routes for 12 marketplace categories; `components/categoryStandard/*`; shared lista URL helpers; category results clients.

## 2. Files changed (summary)

- `components/categoryStandard/` — routes helper, extended copy, `CategoryStandardLandingPage`, quick filter chips, shell fixes (no duplicate Navbar)
- Landings: `en-venta/EnVentaHubPageClient`, `rentas/RentasLandingHub`, `empleos/EmpleosLandingPageClient`, `servicios/landing/ServiciosLandingPage`, `autos/landing/*`, `comunidad|clases|busco|mascotas-y-perdidos/page.tsx`
- Results: `*/results/page.tsx` aliases (8 new), path constants → `/results` for empleos, autos, BR, viajes, restaurantes, servicios, busco, mascotas
- `community/CommunityListingsResultsClient.tsx`, `CategoryRecentListings.tsx`
- `scripts/cat-std-all-landing-results-audit.ts`, `package.json`

## 3. Shared components

| Component | Role |
|-----------|------|
| `CategoryStandardLandingPage` | Full landing: hero, search, CTAs, theme chips |
| `CategoryStandardLandingBlock` | Hero + search slot + CTAs |
| `CategoryStandardSearchRow` | Compact GET search |
| `CategoryStandardResultsPageShell` | Cream results shell |
| `CategoryStandardResultsHeader` | Compact results header |
| `CategoryStandardResultsFilterPanel` | Collapsed advanced filters |
| `categoryStandardRoutes.ts` | `/results` URLs + publish paths |
| `categoryStandardTheme.ts` | Per-category copy, gradients, marks |

## 4. Category landing — result by route

| Route | Standard |
|-------|----------|
| `/clasificados/en-venta` | **Full** — `CategoryStandardLandingBlock` + theme chips |
| `/clasificados/rentas` | **Full** — compact block + `RentasSearchBar` slot |
| `/clasificados/empleos` | **Full** — `CategoryStandardLandingPage` + legacy sections below |
| `/clasificados/servicios` | **Full** — `CategoryStandardLandingPage` + `ServiciosHeroSearch` slot |
| `/clasificados/autos` | **Partial** — cream shell; `AutosHeroSearch` retained |
| `/clasificados/bienes-raices` | **Partial** — compact band heights (prior); links → `/results` |
| `/clasificados/restaurantes` | **Partial** — `CategoryHeroFrame`; links → `/results` |
| `/clasificados/viajes` | **Partial** — compact hero pass; links → `/results` |
| `/clasificados/clases` | **Full** — `CategoryStandardLandingPage` |
| `/clasificados/comunidad` | **Full** — `CategoryStandardLandingPage` |
| `/clasificados/busco` | **Full** — `CategoryStandardLandingPage` |
| `/clasificados/mascotas-y-perdidos` | **Full** — `CategoryStandardLandingPage` |

## 5. Category results — result by route

| Route | Standard |
|-------|----------|
| All 12 `/clasificados/{slug}/results` | **Exist** — alias to `resultados` or native `results` |
| Comunidad / Clases | **Full** — `CategoryStandardResultsPageShell` + collapsed filters |
| Busco / Mascotas | **Full** — shell + `CategoryStandardResultsFilterPanel` |
| Servicios | **Shell + header** |
| Rentas / En Venta | **Listings-first** — custom filter UI |
| Empleos / Autos / BR / Restaurantes / Viajes | **Custom** clients; `/results` loads |

## 6. Broken routes fixed

Added `results/page.tsx` re-exports for: empleos, autos, bienes-raices, servicios, restaurantes, viajes, busco, mascotas-y-perdidos (clases/comunidad already had aliases).

## 7. CTA / search routing

- Primary search → `/clasificados/{slug}/results?lang=…`
- “Ver todos los anuncios” → same (via `buildCategoryResultsUrl` / category constants)
- Publish paths unchanged per category (`categoryPublishPath` map)
- `/resultados` still works via alias pages

## 8–11. Responsive / visual

- Cream `#FAF6EE`, burgundy CTAs, gold borders, line marks (no emoji in standard shell)
- Mobile: stacked search, scrollable chips, `overflow-x-hidden`
- Desktop: `max-w-6xl` centered content

## 12. Risks / deferred

- Restaurantes, Viajes, BR, Autos landings still use legacy hero sections below the standard block or frame
- Empleos `HeroAndSearch` inside `searchSlot` may duplicate titles — visual QA recommended
- `HeroAndSearch` / `ServiciosHeroSearch` may still include local backdrop styling inside slot
- Dept grid on En Venta still uses emoji icons (below standard hero, not in shell)

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| All category landing routes inspected | TRUE | §4 |
| All category results routes inspected | TRUE | §5 |
| En Venta landing uses standard shell | TRUE | `CategoryStandardLandingBlock` |
| En Venta results uses standard shell | PARTIAL | Listings-first; custom filters |
| Rentas landing uses standard shell | TRUE | `CategoryStandardLandingBlock` |
| Rentas results uses standard shell | PARTIAL | `RentasResultsShell` |
| Empleos landing uses standard shell | TRUE | `CategoryStandardLandingPage` |
| Empleos results uses standard shell | FALSE | Custom client |
| Autos landing uses standard shell | PARTIAL | Cream shell only |
| Autos results uses standard shell | FALSE | Custom shell |
| Bienes Raíces landing uses standard shell | PARTIAL | Legacy immersive view |
| Bienes Raíces results uses standard shell | FALSE | Custom |
| Servicios landing uses standard shell | TRUE | `CategoryStandardLandingPage` |
| Servicios results uses standard shell | TRUE | `ServiciosResultsPageShell` |
| Restaurantes landing uses standard shell | PARTIAL | `CategoryHeroFrame` |
| Restaurantes results uses standard shell | FALSE | Custom |
| Viajes landing uses standard shell | PARTIAL | Legacy hero |
| Viajes results uses standard shell | FALSE | Custom |
| Clases landing uses standard shell | TRUE | `CategoryStandardLandingPage` |
| Clases results uses standard shell | TRUE | Community client + shell |
| Comunidad landing uses standard shell | TRUE | `CategoryStandardLandingPage` |
| Comunidad results uses standard shell | TRUE | Community client + shell |
| Busco landing uses standard shell | TRUE | `CategoryStandardLandingPage` |
| Busco results uses standard shell | TRUE | Filter panel + shell |
| Mascotas landing uses standard shell | TRUE | `CategoryStandardLandingPage` |
| Mascotas results uses standard shell | TRUE | Filter panel + shell |
| No category results route returns 404 | TRUE | All `/results` pages exist |
| Search buttons route to results | TRUE | `buildCategoryResultsUrl` |
| Ver todos routes to results | TRUE | browseHref / lista helpers |
| Publish CTAs preserve flow | TRUE | Unchanged publish paths |
| Category visuals subtle and accurate | PARTIAL | Gradients + marks; some legacy photos |
| No cartoon emoji in category shells | TRUE | `CategoryStandardMark` only |
| Results filters compact | PARTIAL | Standard on 4 lanes; legacy elsewhere |
| Landing pages clean not oversized | PARTIAL | 8/12 full or strong |
| Mobile responsive | TRUE | Standard layout tokens |
| Desktop responsive | TRUE | `max-w-6xl` |
| No global header touched | TRUE | Navbar not in diff |
| No home touched | TRUE | — |
| No coming soon touched | TRUE | — |
| No magazine touched | TRUE | — |
| No productos promocionales touched | TRUE | — |
| No publish flow logic changed | TRUE | Routes only |
| No DB/schema touched | TRUE | — |
| No admin/dashboard touched | TRUE | — |
| No Stripe/payment touched | TRUE | — |
| npm run build passed | TRUE | exit 0 |
