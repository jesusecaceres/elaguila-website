# Clasificados All-Category Landing + Results Shell Standard V1

**Task:** `CLASIFICADOS-ALL-CATEGORY-LANDING-RESULTS-SHELL-STANDARD-V1`  
**Date:** 2026-07-02  
**Model:** Rentas V7 (`RENTAS-LANDING-RESULTS-SHELL-FINAL-STANDARD-V7`)

## 1. Task classification

| Field | Value |
|---|---|
| Classification | BATTLEFIELD ARCHITECTURE BUILD — GATED CATEGORY STANDARDIZATION |
| Why | Multi-category landing/results shell alignment using Rentas as working standard |
| Scope expanded | NO — shared standard + low-risk results refine panel only; high-risk custom shells deferred |

## 2. Rentas standard summary (baseline — do not redesign)

| Surface | Question | Pattern |
|---|---|---|
| Landing | “What are you looking for?” | Integrated gateway panel, search anchor, intent tiles, budget/practical chips |
| Results | “Let me narrow it down…” | `RENTAS_RESULTS_REFINE_PANEL`: search → active filters → branch chips → toolbar → listings → pagination footer |

Rentas uses custom components (`RentasLandingHub`, `RentasCompactSearchCanvas`, `RentasFiltersDrawer`). Other categories inherit shared `categoryStandard/*` tokens aligned to Rentas burgundy/gold/cream.

## 3. Category map (from `catStd1aPipelineRegistry.ts`)

| Slug | Landing route | Results route | Shell status | Risk | Pagination |
|---|---|---|---|---|---|
| en-venta | `/clasificados/en-venta` | `/clasificados/en-venta/results` | partial | MEDIUM | page (24) |
| rentas | `/clasificados/rentas` | `/clasificados/rentas/results` | custom (V7) | HIGH | page |
| empleos | `/clasificados/empleos` | `/clasificados/empleos/results` | partial | HIGH | none |
| autos | `/clasificados/autos` | `/clasificados/autos/results` | partial | HIGH | page (12) |
| bienes-raices | `/clasificados/bienes-raices` | `/clasificados/bienes-raices/results` | partial | HIGH | page (9) |
| servicios | `/clasificados/servicios` | `/clasificados/servicios/results` | partial | MEDIUM | none |
| restaurantes | `/clasificados/restaurantes` | `/clasificados/restaurantes/results` | partial | MEDIUM | load-more (9) |
| viajes | `/clasificados/viajes` | `/clasificados/viajes/results` | partial | MEDIUM | none |
| comunidad | `/clasificados/comunidad` | `/clasificados/comunidad/results` | full | LOW | none |
| clases | `/clasificados/clases` | `/clasificados/clases/results` | full | LOW | none |
| busco | `/clasificados/busco` | `/clasificados/busco/results` | full | LOW | none |
| mascotas-y-perdidos | `/clasificados/mascotas-y-perdidos` | `/clasificados/mascotas-y-perdidos/results` | full | LOW | none |

## 4. Category question map

| Category | Landing question | Results question |
|---|---|---|
| en-venta | What are you buying, selling, or giving away? | Narrow by dept, condition, price, location, seller type |
| autos | What kind of vehicle are you looking for? | Narrow by make/model, price, year, body, dealer/private |
| bienes-raices | Buying, selling, or looking for property? | Narrow by operation, city, property type, price, beds |
| servicios | What service do you need? | Narrow by group, city, verified, provider type |
| restaurantes | What are you craving? | Narrow by cuisine, city/zip, service type |
| empleos | What kind of work are you looking for? | Narrow by category, modality, salary, location |
| viajes | Where do you want to go? | Narrow by destination, origin, budget, audience |
| clases | What do you want to learn? | Narrow by class type, level, cost, mode, audience |
| comunidad | What is happening in the community? | Narrow by event type, date, cost, audience |
| busco | What are you looking for or asking help with? | Narrow by tipo, city, zone, budget, contact |
| mascotas-y-perdidos | What needs to be found, helped, or adopted? | Narrow by tipo, city |
| rentas | What are you looking for? (space type) | Let me narrow it down (exact rental) |

## 5. CTA map (category-specific, truthful)

| Category | Primary search | Browse | Publish |
|---|---|---|---|
| en-venta | Buscar artículos | Ver todos los anuncios | Publicar artículo |
| autos | Buscar autos | Ver autos | Publicar auto |
| bienes-raices | Buscar propiedades | Ver propiedades | Publicar propiedad |
| servicios | Buscar servicios | Ver servicios | Publicar servicio |
| restaurantes | Buscar restaurantes | Ver restaurantes | Publicar restaurante |
| empleos | Buscar empleos | Ver empleos | Publicar empleo |
| viajes | Buscar viajes | Ver ofertas | Publicar oferta |
| clases | Buscar clases | Ver clases | Publicar clase |
| comunidad | Buscar eventos | Ver comunidad | Publicar aviso |
| busco | Buscar solicitudes | Ver solicitudes | Publicar búsqueda |
| mascotas | Buscar avisos | Ver avisos | Publicar aviso |
| rentas | Buscar | Ver todos los anuncios | Publicar renta |

## 6. Files changed (V1 pass)

| File | Purpose |
|---|---|
| `categoryStandard/categoryStandardStyles.ts` | V7 refine panel + Leonix search/button tokens |
| `categoryStandard/CategoryStandardSearchRow.tsx` | Search shell aligned to Rentas DNA |
| `categoryStandard/CategoryStandardResultsChrome.tsx` | Refine panel; visibility CTA footer; landing eyebrow |
| `categoryStandard/CategoryStandardResultsHeader.tsx` | Count line; publish CTA; no competing visibility |
| `categoryStandard/CategoryStandardActiveFilterChips.tsx` | Leonix green active filter heading |
| `community/CommunityListingsResultsClient.tsx` | Refine panel for clases + comunidad results |
| `busco/BuscoResultsClient.tsx` | Refine panel wrap for busco results search |
| `mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx` | Refine panel wrap for mascotas results search |
| `autos/components/public/AutosPublicResultsShell.tsx` | Remove invalid `category` prop on shared header (build fix) |
| `empleos/components/EmpleosResultsView.tsx` | Remove invalid `category` prop on shared header (build fix) |
| `servicios/ServiciosResultsPageShell.tsx` | Remove invalid `category` prop on shared header (build fix) |
| `restaurantes/resultados/RestaurantesResultsShell.tsx` | V2 refine panel on search canvas |
| `viajes/components/ViajesResultsShell.tsx` | V2 refine panel on top search section |
| `bienes-raices/resultados/BienesRaicesResultsClient.tsx` | V2 refine panel on search canvas |
| `en-venta/results/EnVentaResultsClient.tsx` | V2 refine panel on search + sort/view |
| `autos/components/public/AutosPublicResultsShell.tsx` | V2 refine panel + burgundy search CTA |
| `empleos/components/EmpleosResultsView.tsx` | V2 refine panel on compact search row |
| `CLASIFICADOS_ALL_SHELL_STANDARD_V1.md` | This audit |

## 7. Filter truth table (sample — all categories use real query keys from registry)

| Category | Surface | Visible control | Query key / field | Backed? | Action |
|---|---|---|---|---|---|
| en-venta | results | q | `q` | YES | Keep |
| en-venta | results | evDept | `evDept` | YES | Keep |
| en-venta | results | free | `free` | YES | Keep |
| rentas | landing | Cuarto tile | `subtype=cuarto-privado` | YES | Keep |
| rentas | landing | Garage tile | `q=garage` | YES (keyword) | Keep |
| empleos | results | salaryMin | `salaryMin` | YES | Keep |
| autos | results | make | browse contract | YES | Keep |
| autos | results | radiusMiles | URL param | NO (scaffold) | Deferred — not shown as active filter |
| servicios | results | verified | `verified` | YES if listing field | Keep |
| restaurantes | results | open now | — | NO hours logic | Not added |
| viajes | results | dest | `dest` | YES | Keep |
| comunidad | results | eventType | `eventType` | YES | Keep |
| clases | results | classType | `classType` | YES | Keep |
| busco | results | tipo | `tipo` | YES | Keep |
| busco | results | contact | `contact` | YES (client filter) | Keep |
| mascotas | results | tipo | `tipo` | YES | Keep |

## 8. Landing status by category

| Category | Landing shell standard | CTAs correct | Quick chips real | Routes preserved | Notes |
|---|---|---|---|---|---|
| en-venta | Standard block | YES | YES (dept shortcuts) | YES | Custom hub below hero |
| rentas | Custom V7 | YES | YES | YES | Reference only |
| empleos | Standard page | YES | YES | YES | — |
| autos | Standard page | YES | YES | YES | Custom hero search |
| bienes-raices | Standard page | YES | YES | YES | Dual publish links |
| servicios | Standard page | YES | YES | YES | — |
| restaurantes | Standard page | YES | YES | YES | — |
| viajes | Standard page | YES | YES | YES | — |
| comunidad | Standard page | YES | YES | YES | Landing eyebrow V1 |
| clases | Standard page | YES | YES | YES | Shared with comunidad client |
| busco | Standard page | YES | YES | YES | — |
| mascotas | Standard page | YES | YES | YES | — |

## 9. Results status by category

| Category | Results refine standard | Active filters | Drawer/details | Sort/view | Pagination | Real data | Notes |
|---|---|---|---|---|---|---|---|
| en-venta | **V2 refine panel** | chips row | drawer | sort/view | page | YES | V2 closeout |
| rentas | V7 refine panel | YES | drawer | sort/view | page | YES | Baseline |
| empleos | **V2 refine panel** | partial | drawer | sort | none | YES | V2 closeout |
| autos | **V2 refine panel** | partial | drawer | sort/view | page | YES | V2 closeout — no desktop rail |
| bienes-raices | **V2 refine panel** | partial | BR drawer | sort | page | YES | V2 token alignment |
| servicios | Servicios shell | partial | drawer | sort | none | YES | V1 only |
| restaurantes | **V2 refine panel** | partial | inline drawer | sort | load-more | YES | V2 closeout |
| viajes | **V2 refine panel** | summary line | drawer | sort | none | YES | V2 closeout |
| comunidad | **V1 refine panel** | search panel | collapsed filters | — | none | YES | This pass |
| clases | **V1 refine panel** | search panel | collapsed filters | — | none | YES | This pass |
| busco | Custom shell | inline panel | inline | — | none | YES | **V1 refine panel** |
| mascotas | Custom shell | inline panel | inline | — | none | YES | **V1 refine panel** |

## 10. Rentas shell standard for replication

- Landing asks broad intent questions
- Results carries the same search shell and narrows with drawer
- CTAs keep Leonix burgundy/gold/cream language
- Category-specific filters live in drawer or collapsed details
- Top tools include active filters, branch/type chips, sort, view toggle when real
- Pagination remains bottom when real
- Every filter must map to application/listing fields
- No fake filters/data/analytics

## 11. Mobile/PWA code check

- Shared search row: `flex-col` stack on mobile, `min-h-[2.875rem]` tappable buttons
- Refine panel: `overflow-x-hidden` via page shell
- Active filter chips: `flex-wrap`
- Drawer: bottom sheet on mobile (`RentasFiltersDrawer`, `CategoryStandardFiltersDrawerShell` pattern)
- No horizontal overflow introduced in V1 shared changes

## 12. Remaining risks / deferred

| Item | Category | Status |
|---|---|---|
| Heavy inline filter form | empleos | **Closed V2** — drawer holds deep fields; refine panel on search row |
| Desktop sidebar rail | autos | **Closed V2** — rail is drawer-only; top refine panel strengthened |
| Full refine panel wrap | restaurantes, viajes, en-venta | **Closed V2** |
| Refine panel | busco, mascotas | Done V1 |
| BR custom filter UI | bienes-raices | **Closed V2** — refine panel on search; custom chips/filters preserved |
| Rentas | — | No changes |

## 13. Requirement checklist

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Rentas used as baseline | TRUE | V7 audit + no Rentas edits |
| Category registry inspected | TRUE | `catStd1aPipelineRegistry.ts` |
| Shared standard components inspected | TRUE | `categoryStandard/*` |
| All 12 category landing routes mapped | TRUE | Section 3 |
| All 12 category results routes mapped | TRUE | Section 3 |
| Category-specific landing questions documented | TRUE | Section 4 |
| Category-specific results questions documented | TRUE | Section 4 |
| Category-specific CTA map documented | TRUE | Section 5 |
| Landing starter filters map documented | TRUE | Registry queryParamNotes |
| Results/drawer filters map documented | TRUE | Section 7 |
| No fake filters added | TRUE | No new filter params |
| Real data sources preserved | TRUE | No data layer changes |
| Publish routes preserved | TRUE | No publish logic changes |
| Detail routes preserved | TRUE | No route changes |
| ES/EN preserved | TRUE | lang query unchanged |
| Lang query preserved | TRUE | hidden `lang` in forms |
| Results top tools standardized where safe | TRUE | Shared chrome + comunidad/clases |
| Pagination/load-more preserved where real | TRUE | No pagination logic changed |
| Mobile/PWA safe by code inspection | TRUE | Section 11 |
| Global header untouched | TRUE | No layout/nav edits |
| Footer untouched | TRUE | Site footer unchanged |
| Auth untouched | TRUE | — |
| Middleware untouched | TRUE | — |
| Supabase schema untouched | TRUE | — |
| Migrations untouched | TRUE | — |
| Stripe untouched | TRUE | — |
| Admin/dashboard untouched | TRUE | — |
| No image generation | TRUE | — |
| No remote images | TRUE | — |
| Build passed | TRUE | Gate 12 `npm run build` (V1); V2 re-validated Gate 10 |

## 14. V2 Deferred Results Refine Closeout

### What V1 completed
- Shared Leonix refine tokens (`CAT_STD_RESULTS_REFINE_PANEL`, search row, results chrome)
- Low-risk refine wraps: comunidad, clases, busco, mascotas-y-perdidos
- Build fixes: invalid `category` prop removed from `CategoryStandardResultsHeader` callers

### What V1 deferred
- En Venta: full refine panel wrap
- Autos: desktop sidebar rail dominance / stronger top refine shell
- Empleos: heavy inline filter form compaction
- Restaurantes: custom shell refine wrap
- Viajes: custom shell refine wrap
- Bienes Raíces: token alignment only

### V2 closeout table

| Category | V1 deferred issue | V2 action | Closed | If not closed, blocker | Evidence |
|---|---|---|---|---|---|
| en-venta | Full refine panel wrap | Wrapped search + sort/view in `CAT_STD_RESULTS_REFINE_PANEL` + eyebrow | TRUE | — | `EnVentaResultsClient.tsx` |
| autos | Sidebar rail dominates | Top refine panel + burgundy search CTA; rail is drawer-only (no desktop sidebar) | TRUE | Desktop persistent rail already removed in current shell | `AutosPublicResultsShell.tsx` |
| empleos | Heavy inline form | Wrapped compact search row in refine panel; deep filters remain in drawer | TRUE | Full accordion migration deferred — drawer already holds all fields | `EmpleosResultsView.tsx` |
| restaurantes | Custom refine wrap | Wrapped `RestaurantesCompactSearchCanvas` in refine panel | TRUE | — | `RestaurantesResultsShell.tsx` |
| viajes | Custom refine wrap | Applied shared refine panel + eyebrow to top search section | TRUE | Filter rail remains drawer-only (by design) | `ViajesResultsShell.tsx` |
| bienes-raices | Token alignment | Refine panel wrap on search canvas; custom chips/filters/cards unchanged | TRUE | Major layout restructure intentionally avoided | `BienesRaicesResultsClient.tsx` |

### Readiness language (corrected)
- **Build green:** YES after V2 Gate 10
- **Safe to QA:** YES — all six deferred categories received V2 refine closeout
- **Ready to commit:** After manual QA on deferred category results routes
- **Fully visually complete:** Partial — category-owned cards/hero atmospheres unchanged by design

### Remaining non-blockers (future gates)
- Empleos: optional visual polish on drawer field grouping
- Autos: optional desktop inline filter summary expansion (drawer remains source of truth)
- En Venta / Restaurantes / Viajes: optional landing hero alignment (out of V2 scope)
