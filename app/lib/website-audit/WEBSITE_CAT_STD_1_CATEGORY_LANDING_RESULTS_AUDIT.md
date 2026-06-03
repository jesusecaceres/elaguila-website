# Gate CAT-STD-1 — Category Landing + Results Standardization Audit

**Date:** 2026-05-29  
**Scope:** Individual clasificados category landing + results pages only.

## 1. Files inspected

- `app/(site)/clasificados/components/categoryStandard/*`
- `app/(site)/clasificados/components/categoryLanding/CategoryHeroFrame.tsx`
- Landings: `en-venta/EnVentaHubPageClient.tsx`, `rentas/RentasLandingHub.tsx`, `empleos/**`, `autos/**`, `bienes-raices/landing/**`, `servicios/**`, `restaurantes/**`, `viajes/**`, `comunidad/page.tsx`, `clases/page.tsx`, `busco/page.tsx`, `mascotas-y-perdidos/page.tsx`
- Results: `en-venta/results/**`, `rentas/results/**`, `empleos/resultados/**`, `autos/resultados/**`, `bienes-raices/resultados/**`, `servicios/**`, `restaurantes/resultados/**`, `viajes/resultados/**`, `community/CommunityListingsResultsClient.tsx`, `busco/BuscoResultsClient.tsx`, `mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx`

## 2. Files changed (this gate)

- `app/(site)/clasificados/components/categoryStandard/*` (theme, hero, search, CTAs, results shell/header, filter panel, landing shell)
- `comunidad/page.tsx`, `clases/page.tsx`, `busco/page.tsx`, `mascotas-y-perdidos/page.tsx`
- `busco/BuscoResultsClient.tsx`, `mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx`
- `community/CommunityListingsResultsClient.tsx`
- `rentas/results/components/RentasResultsShell.tsx`, `rentas/landing/RentasLandingHero.tsx`
- `servicios/ServiciosResultsPageShell.tsx`
- Compact hero passes: `en-venta/EnVentaHubPageClient.tsx`, `rentas/rentasLandingTheme.ts`, `bienes-raices/landing/BienesRaicesLandingView.tsx`, `autos/landing/AutosLandingShell.tsx`, `empleos/components/landing/HeroAndSearch.tsx`, `servicios/landing/ServiciosHeroSearch.tsx`, `viajes/components/ViajesHero.tsx`, `components/categoryLanding/CategoryHeroFrame.tsx`
- `scripts/website-cat-std-1-category-landing-results-audit.ts`, `package.json` (audit script only)

## 3. Category landing pages audited

| Category | Route | Implementation | Standard level |
|----------|-------|----------------|----------------|
| En Venta / Varios | `/clasificados/en-venta` | `EnVentaHubPageClient` | Compact hero + search (custom); heights reduced |
| Rentas | `/clasificados/rentas` | `RentasLandingHub` | Scenic hero padding reduced; custom search |
| Empleos | `/clasificados/empleos` | `EmpleosLandingPageClient` | Hero panel height reduced |
| Bienes Raíces | `/clasificados/bienes-raices` | `BienesRaicesLandingView` | Immersive band min-heights reduced |
| Servicios | `/clasificados/servicios` | `ServiciosLandingPage` | Hero search min-heights reduced |
| Autos | `/clasificados/autos` | `AutosLandingPage` | Backdrop band reduced |
| Restaurantes | `/clasificados/restaurantes` | `CategoryHeroFrame` | Frame defaults lowered |
| Viajes | `/clasificados/viajes` | `ViajesLandingPage` | Hero max-heights reduced |
| Clases | `/clasificados/clases` | `CategoryStandardLandingBlock` | Full CAT-STD-1 block |
| Comunidad | `/clasificados/comunidad` | `CategoryStandardLandingBlock` | Full CAT-STD-1 block |
| Busco | `/clasificados/busco` | `CategoryStandardLandingBlock` | Full CAT-STD-1 block |
| Mascotas | `/clasificados/mascotas-y-perdidos` | `CategoryStandardLandingBlock` | Full (QA alias `/mascotas` redirects N/A in repo) |

## 4. Results pages audited

| Category | Results route | Standard level |
|----------|---------------|----------------|
| En Venta | `/clasificados/en-venta/results` | Listings-first header (no giant hero); custom filter form |
| Rentas | `/clasificados/rentas/results` | `CategoryStandardResultsPageShell` + existing top bar/filters |
| Empleos | `/clasificados/empleos/resultados` | Custom (not migrated to shared filter panel) |
| Bienes Raíces | `/clasificados/bienes-raices/resultados` | Custom |
| Servicios | `/clasificados/servicios/resultados` | `CategoryStandardResultsPageShell` + header |
| Autos | `/clasificados/autos/resultados` | Custom |
| Restaurantes | `/clasificados/restaurantes/resultados` | Custom |
| Viajes | `/clasificados/viajes/resultados` | Custom |
| Clases / Comunidad | `…/resultados` | `CommunityListingsResultsClient` + CAT_STD filters |
| Busco | `/clasificados/busco/resultados` | Shell + `CategoryStandardResultsFilterPanel` |
| Mascotas | `/clasificados/mascotas-y-perdidos/resultados` | Shell + CAT_STD filter panel |

## 5. Shared components changed

- `CategoryCompactHero`, `CategoryStandardSearchRow`, `CategoryStandardCtaRow`, `CategoryStandardLandingBlock`, `CategoryStandardLandingPageShell`
- `CategoryStandardResultsPageShell`, `CategoryStandardResultsHeader`, `CategoryStandardResultsFilterPanel`, `categoryStandardTheme.ts`, `categoryStandardStyles.ts`

## 6. Search/filter standard

- Landing: single-row GET search (`CategoryStandardSearchRow`) + optional `<details>` Más filtros on block landings.
- Results: compact q/city row + collapsed advanced filters (`CategoryStandardResultsFilterPanel`); burgundy primary / neutral secondary buttons (`CAT_STD_*`).

## 7. Category visual standard

- Per-category gradients + inline marks in `categoryStandardTheme.ts`; no full-bleed overpowering heroes on standard block landings.
- Legacy categories retain category-specific imagery with reduced min-heights / padding.

## 8. Mobile result

- Stacked search on small screens; `overflow-x-hidden` on standard results shell; filter drawer via `<details>`.

## 9. Desktop result

- Centered `max-w-6xl` (or `max-w-3xl` for Busco/Mascotas); horizontal search row where applicable.

## 10. Risks / deferred work

- Migrate En Venta, Rentas, Empleos, BR, Autos, Restaurantes, Viajes results filter UI to `CategoryStandardResultsFilterPanel` without changing query keys.
- Migrate remaining landings to `CategoryStandardLandingBlock` while preserving category-specific sections (featured bands, dealer tiles).
- Add category-specific subtle `imageSrc` assets where gradients alone are insufficient.
- QA alias: production checklist uses `/clasificados/mascotas`; app route is `mascotas-y-perdidos`.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Header files were not modified | TRUE | `Navbar.tsx` not in gate diff |
| Coming Soon V2 files were not modified | TRUE | CS V2 paths not in diff |
| Home page files were not modified | TRUE | `HomeMarketingClient.tsx` not in diff |
| Magazine page files were not modified | TRUE | Not in diff |
| Productos Promocionales page files were not modified | TRUE | Not in diff |
| Category landing pages were inspected | TRUE | §3 table |
| Category results pages were inspected | TRUE | §4 table |
| En Venta/Varios landing was standardized | PARTIAL | Compact hero; not full `CategoryStandardLandingBlock` |
| En Venta/Varios results were standardized | PARTIAL | Listings-first; custom filters |
| Rentas landing was standardized | PARTIAL | Padding/height reduction |
| Rentas results were standardized | PARTIAL | Standard shell only |
| Empleos landing was standardized | PARTIAL | Hero height reduction |
| Empleos results were standardized | FALSE | Custom shell — deferred |
| Bienes Raíces landing was standardized | PARTIAL | Band height reduction |
| Bienes Raíces results were standardized | FALSE | Custom — deferred |
| Servicios landing was standardized | PARTIAL | Hero compact pass |
| Servicios results were standardized | TRUE | `ServiciosResultsPageShell` |
| Autos landing was standardized | PARTIAL | Shell band reduced |
| Autos results were standardized | FALSE | Custom — deferred |
| Restaurantes landing was standardized | PARTIAL | `CategoryHeroFrame` defaults |
| Restaurantes results were standardized | FALSE | Custom — deferred |
| Viajes landing was standardized | PARTIAL | Hero max-height reduced |
| Viajes results were standardized | FALSE | Custom — deferred |
| Clases landing was standardized | TRUE | `CategoryStandardLandingBlock` |
| Clases results were standardized | TRUE | `CommunityListingsResultsClient` |
| Comunidad/Eventos landing was standardized | TRUE | `CategoryStandardLandingBlock` |
| Comunidad/Eventos results were standardized | TRUE | `CommunityListingsResultsClient` |
| Busco/Se busca landing was standardized | TRUE | `CategoryStandardLandingBlock` |
| Busco/Se busca results were standardized | TRUE | CAT_STD shell + filter panel |
| Mascotas/Perdidos landing was standardized | TRUE | `CategoryStandardLandingBlock` |
| Mascotas/Perdidos results were standardized | TRUE | CAT_STD shell + filter panel |
| Search bars are compact and usable | TRUE | Shared search row + en-venta/rentas compact passes |
| Filters are clean and not overwhelming | PARTIAL | `<details>` on standard clients; legacy grids remain |
| Results pages prioritize listings over hero visuals | TRUE | No scenic hero on standard results shells |
| Category visual flavor is subtle and relevant | PARTIAL | Theme marks/gradients; some legacy photos remain |
| No fake listings were added | TRUE | No new hardcoded listing rows |
| No fake businesses were added | TRUE | No new business fixtures |
| Existing publish routes were preserved | TRUE | Publish hrefs unchanged |
| Existing search/filter logic was preserved | TRUE | GET field names / handlers unchanged |
| Mobile layout has no horizontal overflow | TRUE | `overflow-x-hidden` on results shell |
| npm run build passed | TRUE | `npm run build` exit 0 (2026-06-03) |
