# CLASIFICADOS-APPLICATION-FIELD-FILTERS-RENTAS-SHELL-STANDARD-V1

**Audit date:** 2026-07-06  
**Branch at start:** `main` (clean @ `9443f029`)  
**Classification:** BATTLEFIELD SCOPED BUILD — landing/results shell consistency + application-derived filters only  
**Visual model:** Rentas landing/results (`RentasLandingHub`, `RentasCompactSearchCanvas`, `RentasFiltersDrawer`, `RentasResultsClient`)  
**Source-of-truth order:** publish form → storage/mapper → filter contract → landing chips → results drawer → URL keys

---

## 1. Task classification

| Item | Value |
|---|---|
| Scope | 12 Clasificados categories — browse landing + results filter UI |
| Out of scope (locked) | auth, middleware, Supabase schema/migrations, Stripe, admin/user dashboard, publish save, monetization, global nav/footer, home, magazine, productos, coming soon |
| Primary fixes this gate | Bienes Raíces top junk removal, application-derived filter grouping, Rentas shell alignment, audit documentation |
| Rentas | Protected reference — no redesign |

---

## 2. Rentas visual standard (reference — do not regress)

### Landing (`RentasLandingHub`)

- `RentasLandingShell` — centered premium max-width gateway
- Hero + intent tiles + compact search (`RentasCompactSearchCanvas`) visible immediately
- Publish CTA in shell; shortcut chips/sections close below search
- No giant whitespace; no tiny floating card

### Results (`RentasResultsClient`)

- Subtle `RentasResultsTopBar` breadcrumb + login (small, not directory-style)
- Title + count; compact search shell in refine panel
- Filter button + search; type/quick chips; sort/view row; listings directly below
- Promo/visibility lower (`CategoryVisibilityCta`)

### Rentas application-derived filters

**Source:** privado/negocio publish forms → `rentasBrowseFilters.ts` / `rentasResultsQueryKeys.ts` → `RentasFiltersDrawer`

| Field | Publish-backed | URL key |
|---|---|---|
| q / title | yes | `q` |
| city, state, zip, country | yes | `city`, `state`, `zip`, `country` |
| rent min/max | yes | `rentMin`, `rentMax`, `precio` band |
| bedrooms, baths, sqft | yes | `recs`, room bath/kitchen |
| furnished, pets, pool | yes | `amueblado`, `mascotas`, highlights |
| lease term, deposit | partial | deferred in drawer if not universally stored |
| subtype / space type | yes | `subtype`, `branch` |
| private/business | yes | `branch` |
| availability | partial | deferred unless publish field confirmed |

---

## 3. Application field inventory (all categories)

| Category | Application form/source | Captured fields | Stored keys | Searchable fields | Filterable fields | Sortable fields | Should appear on landing | Should appear in results drawer | Fake/unsupported fields to remove |
|---|---|---|---|---|---|---|---|---|---|
| Bienes Raíces | `BienesRaicesPrivadoForm`, `bienesRaicesNegocioFormState`, `brFilterContract.ts` | q, city, state, zip, country, operation, property type, price, beds, baths, pets, pool, furnished, seller | `listings.*`, `Leonix:*` machine pairs | q, city, description blob | all canonical in `BR_CANONICAL_QUERY_KEYS` | reciente, precio | q, city, operation, property type chips | full 7-section drawer | parking (reserved), sqft filter (deferred), radius |
| Empleos | empleos publish envelope, `empleosFilterContract.ts` | q, city, state, zip, category, jobType, modality, salary, experience, companyType, featured, recent, quickApply, verified, bilingual, industry, lane | `empleos_public_listings` + snapshot | title, company, summary | contract keys | relevance, date, salary | q, category pills | 6 question groups | radiusKm (removed from URL) |
| Rentas | privado/negocio rentas forms, `rentasBrowseFilters.ts` | q, location, rent, beds, baths, furnished, pets, pool, branch, subtype | listing payload + mapper | q, city | browse contract keys | reciente, precio | search + intent tiles | grouped drawer | geo radius (deferred) |
| En Venta | enVenta publish schema, `enVentaResultsUrlParams.ts` | q, city, evDept, evSub, price, free, cond, seller, pickup/ship/delivery | `listings` + Leonix pairs | `buildEnVentaSearchText` | URL params in contract | newest, price | dept chips | drawer (preserved) | autos cross-filters, brand/model facets |
| Autos | `AutosPrivadoApplication`, `autosBrowseFilterContract.ts` | q, city, zip, make, model, year, price, mileage, condition, body, trans, fuel, seller | `listing_payload` | searchable blurb | contract keys | price, year, mileage | search + seller chips | drawer | radiusMiles (parsed, not applied) |
| Servicios | `ClasificadosServiciosApplication`, `serviciosDiscoveryContract.ts` | q, city, group, contact flags, verified, licensed | discovery contract | q, city | contract keys | relevance | search | drawer | stale contract comments only |
| Restaurantes | restaurante publish, `restaurantesDiscoveryContract.ts` | q, city, cuisine, svc, hours-derived open | contract | q, name, cuisine | contract keys | rating/top | search | drawer | `country` until publish ships; `near` without geo |
| Viajes | viajes privado/negocio, `viajesBrowseContract.ts` | dest, from, trip type, budget, audience, season, duration | browse state | q, dest | mapped keys | reciente | hero + search | filter rail | zip/radius/nearMe (reserved) |
| Clases | `publicar/clases/quick`, `CommunityListingsResultsClient` | q, city, classType, cost, mode, level, audience | lightweight browse | q, city | lightweight keys | reciente | search | lightweight drawer | accessibility (not exposed) |
| Comunidad | `publicar/comunidad/quick`, community client | q, city, eventType, cost, dates, audience, accessibility | lightweight browse | q, city | lightweight keys | reciente | search | lightweight drawer | — |
| Busco | `publicar/busco/quick`, `BuscoResultsClient` | q, city, tipo, zone, budget, contact | lightweight browse | q, city | lightweight keys | reciente | search | drawer | — |
| Mascotas y Perdidos | quick publish, `MascotasPerdidosResultsClient` | q, city, tipo, lastSeenArea, hasPhoto | lightweight browse | q, city (partial) | tipo, lastSeen, photo | reciente | search | drawer | state/zip/country in bar but filter applies city only — **deferred wiring** |

---

## 4. Category filter source-of-truth table (Table A)

| Category | Application/source inspected | Real filter fields | Unsupported fields removed/deferred | Status |
|---|---|---|---|---|
| Bienes Raíces | YES — privado/negocio forms, `brFilterContract`, `filterBrListings` | q, location, operation, property type, price, beds/baths, pets/pool/furnished, seller | parking UI; sqft facet; directory TopBar (logo/badge/login/radius) | **FIXED** |
| Empleos | YES — envelope, `empleosFilterContract`, drawer fields | q, location, category, jobType, modality, salary, experience, companyType, featured/recent/quickApply/verified/bilingual | radiusKm; verified helper clarifies admin-only | **PASS** |
| Rentas | YES — browse filters, drawer | all mapped browse keys | geo radius | **PASS (model)** |
| En Venta | YES — preserved | contract params | autos filters | **PASS (preserved)** |
| Autos | YES | `autosBrowseFilterContract` keys | radiusMiles | **PASS** |
| Servicios | YES | discovery contract | — | **PASS** |
| Restaurantes | YES | discovery contract | country UI until publish; near intent | **DOCUMENTED** |
| Viajes | YES | `viajesBrowseContract` | reserved geo keys | **PASS** |
| Clases | YES | lightweight browse | accessibility facet | **PASS** |
| Comunidad | YES | lightweight browse | — | **PASS** |
| Busco | YES | lightweight browse | — | **PASS** |
| Mascotas y Perdidos | YES | lightweight browse | state/zip/country filter apply | **DEFERRED** |

---

## 5. Removed fake/deferred filters (Table D)

| Category | Field/control | Reason removed/deferred | Future requirement |
|---|---|---|---|
| Bienes Raíces | `BienesRaicesResultsTopBar` (logo, Negocio badge, create account, radius hint) | Directory-style junk above search shell | Optional subtle breadcrumb only |
| Bienes Raíces | match count chip on filter chips | Unexplained duplicate of header count | Use title count line only |
| Bienes Raíces | parking filter | `BR_RESERVED_QUERY_KEYS` — stored but no UI | Add when filter helper wired |
| Bienes Raíces | sqft min/max facet | Stored in detail_pairs; not safely filterable | Index or machine pair filter |
| Empleos | radiusKm | No geo index (`empleosFilterContract`) | Geo index |
| Empleos | verified (misleading) | Not set at publish; admin-only | Helper copy added; filter kept for admin-verified rows |
| Autos | radiusMiles | Parsed, not applied | Geo index |
| Viajes | zip, radiusMiles, nearMe | Reserved in contract | Geo index |
| Restaurantes | country (partial) | Publish field pending | Add when publish captures country |
| Mascotas | state/zip/country narrow | Search bar accepts; filter only uses city | Extend `MascotasPerdidosResultsClient` filter |

---

## 6. Results top junk removal (Gate 11)

| Category | Removed/hidden | Kept | Status |
|---|---|---|---|
| Bienes Raíces | `BienesRaicesResultsTopBar` (heavy directory header) | Subtle text breadcrumb + title/count + refine shell | **FIXED** |
| Bienes Raíces | `BienesRaicesCategoryNav` (prior gate) | — | Already removed |
| Rentas | — (model) | `RentasResultsTopBar` subtle breadcrumb | **NO CHANGE** |
| Empleos | giant empty hero (prior gate) | compact empty state | **PASS** |
| En Venta | — | standard shell | **PASS** |
| Busco / Mascotas | — | small breadcrumb in shell layout (Rentas-like) | **ACCEPTABLE** |
| Viajes | custom editorial strips lower | breadcrumb in shell | **PASS** |

---

## 7. Landing shell consistency (Table B partial)

| Category | Landing matches Rentas standard | CTAs top-visible | Status |
|---|---|---|---|
| Bienes Raíces | Compact gateway + search + chips; added Ver propiedades CTA | Buscar, Ver, Publicar negocio/privado | **IMPROVED** |
| Empleos | Rentas-style hub (prior gates) | Publicar vacante | **PASS** |
| Rentas | Reference | Publish privado | **PASS** |
| En Venta | Preserved | — | **PASS** |
| Others | CategoryStandard / custom hubs | publish links where applicable | **ACCEPTABLE** |

---

## 8. Results shell consistency (Table B)

| Category | Results copies landing shell | Top junk removed | Status |
|---|---|---|---|
| Bienes Raíces | Compact search canvas + refine panel + chips + sort | YES | **FIXED** |
| Empleos | CategoryStandard chrome + drawer | YES | **PASS** |
| Rentas | Model | N/A (subtle top bar intentional) | **PASS** |
| En Venta | Prior gate alignment | YES | **PASS** |
| Others | CategoryStandard or category shell | Mostly subtle breadcrumbs only | **PASS** |

---

## 9. Filter drawer standard (Table C)

| Category | Application-derived filters | Grouped by question | Sticky apply/clear | URL preserved | Status |
|---|---|---|---|---|---|
| Bienes Raíces | YES — `BR_KEY_PUBLISH_FIELD_HINTS` | 7 sections incl. ¿Operación y tipo? | YES (`BienesRaicesResultsFilterDrawer`) | YES | **FIXED** |
| Empleos | YES — `empleosFilterContract` | 6 sections | YES | YES | **PASS** |
| Rentas | YES | practical groups | YES | YES | **PASS** |
| En Venta | YES | preserved | YES | YES | **PASS** |
| Autos / Servicios / Restaurantes / Viajes | YES per contract | category drawers | YES | YES | **PASS** |
| Clases / Comunidad / Busco / Mascotas | lightweight real fields | lightweight groups | YES | YES | **PASS** |

---

## 10. Mobile check table

| Surface | Check | Status |
|---|---|---|
| BR landing search | single column, chips scroll | PASS |
| BR results drawer | 440px shell, 1-col sections | PASS |
| BR filter chips | wrap + snap scroll | PASS |
| Empleos drawer | grouped, sticky footer | PASS |
| Rentas | reference — no regression | PASS |

---

## 11. Files changed this gate

| Category | Files changed |
|---|---|
| Bienes Raíces | `resultados/BienesRaicesResultsClient.tsx`, `resultados/components/BienesRaicesFilterChips.tsx`, `resultados/components/BienesRaicesResultsFilters.tsx`, `resultados/bienesRaicesResultsCopy.ts`, `landing/BienesRaicesLandingView.tsx` |
| Empleos | `components/EmpleosBrowseDrawerFields.tsx` |
| Audit | `app/lib/website-audit/CLASIFICADOS_APPLICATION_FIELD_FILTERS_RENTAS_SHELL_STANDARD_V1.md` |

---

## 12. Manual QA URLs

- https://leonixmedia.com/clasificados/bienes-raices?lang=es
- https://leonixmedia.com/clasificados/bienes-raices/resultados?lang=es
- https://leonixmedia.com/clasificados/empleos?lang=es
- https://leonixmedia.com/clasificados/empleos/results?lang=es
- https://leonixmedia.com/clasificados/rentas?lang=es
- https://leonixmedia.com/clasificados/rentas/results?lang=es
- https://leonixmedia.com/clasificados/en-venta?lang=es
- https://leonixmedia.com/clasificados/en-venta/results?lang=es

### Screenshot checklist

- BR landing: Rentas-quality gateway, four CTAs, search + chips close
- BR results: no directory TopBar; subtle breadcrumb; shell first; drawer sections 1–7
- Empleos results: compact shell; drawer with admin note on verified
- Rentas landing/results: no regression
- En Venta: preserved

---

## 13. Build

Run `npm run build` at gate close — see final report for PASS/FAIL.
