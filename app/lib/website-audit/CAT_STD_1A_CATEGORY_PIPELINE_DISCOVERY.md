# Gate CAT-STD-1A — Category Pipeline Discovery + Standard Shell Foundation Only

**Date:** 2026-05-29  
**Scope:** Discovery + read-only foundation only. No category page rollout, no search/filter behavior changes.

---

## 1. Files inspected

- `app/(site)/clasificados/**` — all `page.tsx` routes, landing/results clients, contracts
- `app/(site)/clasificados/components/categoryStandard/**` (existing CAT-STD shell)
- `app/(site)/clasificados/components/categoryLanding/**`
- `app/(site)/clasificados/community/**`
- `app/(site)/clasificados/components/categoryPipeline/**`
- `app/(site)/iglesias/page.tsx`
- En Venta publish/schema (read-only): `enVentaPublishContract.ts`, `enVentaFreeFormState.ts`, `enVentaResultsUrlParams.ts`

---

## 2. Files changed (this gate)

| File | Purpose |
|------|---------|
| `app/lib/website-audit/CAT_STD_1A_CATEGORY_PIPELINE_DISCOVERY.md` | This report |
| `app/(site)/clasificados/components/categoryPipeline/catStd1aPipelineRegistry.ts` | Read-only pipeline registry (updated) |
| `app/(site)/clasificados/components/categoryPipeline/catStd1aFilterMap.ts` | Read-only En Venta filter map + per-category param summary (new) |

**No category `page.tsx`, client, API, DB, or publish files edited.**

---

## 3. Dirty file classification (preflight)

| Classification | Paths |
|----------------|-------|
| **CAT_1A_ALLOWED_AUDIT** | Foundation files in `categoryPipeline/` and this markdown (if modified in this gate) |
| **LOCKED_DO_NOT_TOUCH** | `package.json` (explicitly locked in gate prompt) |
| **UNRELATED_PARALLEL_WORK** | `comida-local/**`, `bienes-raices/BR_INV_A_SUPABASE_BACKING_AUDIT.md`, `app/lib/analytics/**`, `scripts/*-audit.ts`, untracked analytics/comida-local files |

Gate 1A did **not** overwrite unrelated parallel work.

---

## 4. Category route inventory

| Category | Canonical slug | Alias slugs | Landing route | Landing file | Results route | Results file | Status | Risk |
|----------|----------------|-------------|---------------|--------------|---------------|--------------|--------|------|
| En Venta | `en-venta` | `varios`, `for-sale` (label/SEO) | `/clasificados/en-venta` | `en-venta/page.tsx` | `/clasificados/en-venta/results` | `en-venta/results/page.tsx` | OK | MEDIUM |
| Rentas | `rentas` | — | `/clasificados/rentas` | `rentas/page.tsx` | `/clasificados/rentas/results` | `rentas/results/page.tsx` | OK | HIGH |
| Empleos | `empleos` | — | `/clasificados/empleos` | `empleos/page.tsx` | `/clasificados/empleos/results` | `empleos/resultados/page.tsx` (+ `results/` re-export) | OK | HIGH |
| Autos | `autos` | — | `/clasificados/autos` | `autos/page.tsx` | `/clasificados/autos/results` | `autos/resultados/page.tsx` (+ re-export) | OK | HIGH |
| Bienes Raíces | `bienes-raices` | — | `/clasificados/bienes-raices` | `bienes-raices/page.tsx` | `/clasificados/bienes-raices/results` | `bienes-raices/resultados/page.tsx` | OK | HIGH |
| Servicios | `servicios` | — | `/clasificados/servicios` | `servicios/page.tsx` | `/clasificados/servicios/results` | `servicios/resultados/page.tsx` | OK | MEDIUM |
| Restaurantes | `restaurantes` | — | `/clasificados/restaurantes` | `restaurantes/page.tsx` | `/clasificados/restaurantes/results` | `restaurantes/resultados/page.tsx` | OK | MEDIUM |
| Comunidad | `comunidad` | `comunidad-y-eventos` (label only) | `/clasificados/comunidad` | `comunidad/page.tsx` | `/clasificados/comunidad/results` | `comunidad/resultados/page.tsx` | OK | LOW |
| Clases | `clases` | — | `/clasificados/clases` | `clases/page.tsx` | `/clasificados/clases/results` | `clases/resultados/page.tsx` | OK | LOW |
| Busco | `busco` | `se-busca` (label) | `/clasificados/busco` | `busco/page.tsx` | `/clasificados/busco/results` | `busco/resultados/page.tsx` | OK | LOW |
| Mascotas | `mascotas-y-perdidos` | — | `/clasificados/mascotas-y-perdidos` | `mascotas-y-perdidos/page.tsx` | `…/results` | `…/resultados/page.tsx` | OK | LOW |
| Viajes | `viajes` | `travel` (legacy folder) | `/clasificados/viajes` | `viajes/page.tsx` | `/clasificados/viajes/results` | `viajes/resultados/page.tsx` | OK | MEDIUM |
| Iglesias | `iglesias` | — | `/iglesias` | `iglesias/page.tsx` | — | — | Landing only | LOW |

**Out of marketplace scope (discovered, not standardized in 1A):** `comida-local`, `negocios` (redirect to cuenta), hub `clasificados/page.tsx`, publish subtree, previews, payment routes.

---

## 5. Category implementation map

See `catStd1aPipelineRegistry.ts` for machine-readable rows. Summary per category:

### En Venta (MEDIUM)
- **Landing:** `EnVentaHubPageClient` + `CategoryStandardLandingBlock` + custom `searchSlot`
- **Results:** `EnVentaResultsClient`, chips, listing sections
- **Card:** `EnVentaResultListingCard.tsx`
- **Params:** `EV_RESULTS_PARAM` — q, city, zip, evDept, evSub, cond, priceMin/Max, pickup, ship, delivery, seller, free, nego, meetup, sort, view, page, featured
- **Pagination:** `page`, default **24**, no perPage
- **Publish:** `/clasificados/publicar/en-venta`
- **Data:** Supabase `listings` client fetch cap **800**, client-side filter/sort/page
- **Empty:** `EnVentaResultsEmpty.tsx`

### Rentas (HIGH)
- **Landing:** `RentasLandingHub.tsx`
- **Results:** `RentasResultsClient.tsx`
- **Params:** `rentasBrowseContract` / `RENTAS_QUERY_*` (incl. geo radius)
- **Pagination:** `page`, default **6**
- **Publish:** `/clasificados/publicar/rentas`
- **Data:** Supabase cap **5000**, client filter

### Empleos (HIGH)
- **Landing:** `EmpleosLandingPageClient.tsx`
- **Results:** `EmpleosResultsView.tsx`
- **Params:** q, city, jobType, modality, salary, featured, sort, lane, etc.
- **Pagination:** none (full filtered list)
- **Publish:** `/clasificados/publicar/empleos`
- **Data:** `/api/clasificados/empleos/listings`

### Autos (HIGH)
- **Landing:** `AutosPublicLanding.tsx`, `AutosHeroSearch.tsx`
- **Results:** `AutosPublicResultsShell.tsx` + desktop filter rail
- **Params:** `AUTOS_BROWSE_URL_KEYS` — radiusMiles scaffolded not applied
- **Pagination:** `page`, default **12**
- **Publish:** `/clasificados/publicar/autos`

### Bienes Raíces (HIGH)
- **Landing:** `BienesRaicesLandingHub.tsx`
- **Results:** `BienesRaicesResultsClient.tsx`
- **Pagination:** `page`, default **9**
- **Publish:** `/clasificados/publicar/bienes-raices`

### Servicios (MEDIUM)
- **Landing:** `ServiciosLandingPage.tsx`
- **Results:** RSC `servicios/resultados/page.tsx` + `ServiciosResultsFilterQuery`
- **Pagination:** none
- **Publish:** `/clasificados/publicar/servicios`

### Restaurantes (MEDIUM)
- **Landing:** `RestaurantesLandingPage.tsx`
- **Results:** `RestaurantesResultsShell.tsx`
- **Pagination:** load-more, chunk **9**
- **Publish:** `/clasificados/restaurantes/publicar` (non-standard path)

### Comunidad + Clases (LOW)
- **Landing:** `CategoryStandardLandingPage`
- **Results:** shared `CommunityListingsResultsClient.tsx`
- **Params:** q, city + category-specific (eventType, classType, dates, etc.)
- **Pagination:** none (fetch limit 160)
- **Publish:** `/clasificados/publicar/comunidad` | `/clasificados/publicar/clases`

### Busco + Mascotas (LOW)
- **Landing:** `CategoryStandardLandingPage` + recent listings
- **Results:** `BuscoResultsClient` | `MascotasPerdidosResultsClient`
- **Params:** q, tipo, city (+ zone/budget/contact for busco)
- **Pagination:** none
- **Publish:** `/publicar/busco/quick` | `/clasificados/publicar/mascotas-y-perdidos`

### Viajes (MEDIUM)
- **Landing:** `ViajesLandingPage.tsx`
- **Results:** `ViajesResultsShell.tsx`
- **Params:** `viajesBrowseContract` (dest, q, from, t, budget, audience, sort)
- **Publish:** `/clasificados/publicar/viajes`

### Iglesias (LOW)
- **Landing:** `IglesiasPageClient.tsx` (CMS)
- **No results pipeline**

---

## 6. Missing route report

| Expected alias | Repo reality |
|----------------|--------------|
| `/clasificados/varios` | **Missing** — `en-venta` canonical |
| `/clasificados/mascotas` | **Missing** — use `mascotas-y-perdidos` |
| `/clasificados/mascotas-perdidos` | **Missing** |
| `/clasificados/comunidad-y-eventos` | **Missing** — `comunidad` canonical |
| `/clasificados/en-venta/resultados` | **Missing** — en-venta uses `/results` only |
| `/clasificados/rentas/resultados` | May re-export; canonical segment differs from en-venta |
| `/iglesias/results` | **Missing** — not required for 1A |

---

## 7. En Venta deep filter audit

Full machine-readable maps: `catStd1aFilterMap.ts` (`EN_VENTA_VISIBLE_CONTROLS`, `EN_VENTA_FIELD_TO_FILTER_MAP`).

### A. Visible controls classification

| Control | Wiring |
|---------|--------|
| Search `q` | REAL_AND_WIRED |
| City | REAL_AND_WIRED |
| ZIP | REAL_AND_WIRED (results only) |
| Department grid / `evDept` | REAL_AND_WIRED |
| Subcategory `evSub` | REAL_AND_WIRED |
| Condition, price, fulfillment, seller, free, nego, meetup | REAL_AND_WIRED |
| Sort, view, page | REAL_AND_WIRED |
| Use my location | REAL_AND_WIRED |
| Clear / active chips / mobile drawer | REAL_AND_WIRED |
| Results per page | REAL_FIELD_NOT_WIRED |
| `featured=1` | SAFE_TO_KEEP — wired to `admin_promoted` + `Leonix:promoted`; copy implies republish window |
| Map/radius details | SHOULD_REMOVE_OR_HIDE |
| `CategoryStandardQuickFilterChips` | REAL_FIELD_NOT_WIRED — not rendered when `searchSlot` set |

### B. Fake/dead controls

1. Map/radius panel — informational only  
2. Featured checkbox/chip — mislabeled vs `enVentaVisibilityRenewal.ts`  
3. Quick filter chips — dead on landing (not rendered)  
4. Landing lacks `zip` — results inconsistency  

### C. Pagination / per-page

| Item | Value |
|------|-------|
| Default page size | **24** |
| `page` param | Yes |
| `limit`/`perPage` | **No** |
| Filters survive page/sort/view | **Yes** (`pushParams`) |
| 12/24/48 without schema | **Accepted** — client slice only; add `limit` param |

### D. Smoke test truth table

| Check | Result |
|-------|--------|
| Landing route exists | TRUE |
| Results route exists | TRUE |
| `q` from landing → results | TRUE |
| City from landing → results | TRUE |
| Search navigates with params | TRUE |
| Ver todos → results (lang only) | TRUE |
| Publish CTA unchanged | TRUE |
| Results reads `q`, `city` | TRUE |
| Filters preserved on sort/page | TRUE |
| Real pagination | TRUE |
| Can support 12/24/48 | TRUE (needs param) |
| Every visible filter maps or flagged | FALSE (map/radius, featured label) |
| No fake chips on results | TRUE |
| No locked files edited | TRUE |

---

## 8. Existing visual/system issues

- Dual results segments: `results` (EN QA) + `resultados` (ES links) — preserve both
- En Venta + Rentas use `/results` natively; others use `resultados` as primary file
- Heavy filter UI: Empleos, Autos rail, Rentas, BR
- Inconsistent page sizes: 6, 9, 12, 24, load-more, none
- No cross-category `limit`/`perPage` standard
- `CategoryStandardQuickFilterChips` uses `q=label` not facet params
- External Unsplash on some category heroes (Servicios, Restaurantes, Viajes)

---

## 9. Shared standard foundation result

**Created/updated (read-only, not imported by pages):**

- `categoryPipeline/catStd1aPipelineRegistry.ts`
- `categoryPipeline/catStd1aFilterMap.ts`
- This audit document

**Existing foundation (not duplicated):**

- `components/categoryStandard/*` — `CategoryStandardLandingPage`, `CategoryCompactHero`, `CategoryStandardSearchRow`, `CategoryStandardResultsPageShell`, `CategoryStandardResultsHeader`, `categoryStandardTheme.ts`, `categoryStandardRoutes.ts`

---

## 10. Recommended compact search/filter UI standard

### Landing
- **Always visible:** `q`, `city`, Buscar, Publicar, Ver todos
- **Quick chips:** real facet params only (sort, fulfillment, seller) — not `q=label`
- **Más filtros:** zip, dept, price, condition, advanced fulfillment
- **Mobile:** stacked search row; chips wrap; sticky publish/browse optional

### Results
- **Compact row:** q, city, zip, sort, view, count
- **Active chips** for all URL params
- **Per-page:** 12/24/48 dropdown (En Venta first)
- **Más filtros drawer:** dept/sub, condition, price, fulfillment, seller
- **Empty:** reset CTA + publish link

### Mobile
- Search + sort above fold; refine in bottom sheet (En Venta pattern exists)
- No map/radius in primary UI

---

## 11. Category visual flavor plan

| Category | Accent |
|----------|--------|
| En Venta | Gold marketplace warmth |
| Rentas | Housing green |
| Empleos | Blue-gray opportunity |
| Autos | Automotive green/charcoal |
| Bienes Raíces | Bronze property |
| Servicios | Neutral service |
| Restaurantes | Warm dining |
| Comunidad / Clases | Community green / learning blue-green |
| Busco | Amber-green help |
| Mascotas | Compassionate pet tones |
| Viajes | Sky/teal |
| Iglesias | CMS faith shell |

Rule: `categoryStandardTheme.ts` gradients + line marks; no global lion hero.

---

## 12. Query-param preservation notes

- Never rename slug-specific keys (`EV_RESULTS_PARAM`, `RENTAS_QUERY_*`, `AUTOS_BROWSE_URL_KEYS`, etc.)
- Always preserve `lang`
- `CommunityListingsResultsClient` detects `results` vs `resultados` for form action
- Page/sort/view changes must merge existing params (`pushParams` pattern)

---

## 13. Recommended next safe gates

### CAT-STD-1B — Low-risk landings
Comunidad, Clases, Busco, Mascotas-y-perdidos; Iglesias optional shell alignment

### CAT-STD-1C — Marketplace landings
En Venta, Servicios, Restaurantes, Autos — hero/search slot only

### CAT-STD-1D — Complex transactional landings
Rentas, Bienes Raíces, Empleos — `searchSlot` only; no contract changes

### CAT-STD-1E — Results standardization
1. En Venta (after filter semantics fix + `limit` param)  
2. Comunidad family, Busco, Mascotas  
3. Servicios, Restaurantes, Viajes  
4. Rentas, Empleos, Autos, BR  

### CAT-STD-1F — Validation
`npm run build`, route QA, mobile checklist

---

## 14. Build result

**Skipped by safe-stack plan** — foundation files are read-only documentation types; not imported by pages. Final build reserved for **CAT-STD-1F** or first gate editing page TSX.

---

## 15. Manual QA links

See gate prompt §17 (`leonixmedia.com/clasificados/...` and `/iglesias?lang=es`).

---

## 16. Confirmations

All locked areas untouched; no route slug changes; no search/filter logic changes; no staging/commit/push.

---

## 17. TRUE/FALSE audit table

| Requirement | TRUE/FALSE |
|-------------|------------|
| Category routes discovered from repo | TRUE |
| Every found landing route listed | TRUE |
| Every found results route listed | TRUE |
| Query params inspected | TRUE |
| Filter params inspected | TRUE |
| Pagination/page/perPage inspected | TRUE |
| Publish routes inspected read-only | TRUE |
| En Venta fields inspected read-only | TRUE |
| Listing card components inspected | TRUE |
| Data sources inspected | TRUE |
| Missing routes reported | TRUE |
| En Venta visible controls classified | TRUE |
| En Venta field-to-filter mapping produced | TRUE |
| Results-per-page feasibility assessed | TRUE |
| 12/24/48 accepted with evidence | TRUE |
| No locked files changed | TRUE |
| No category logic changed | TRUE |
| No search/filter logic changed | TRUE |
| No publish flow logic changed | TRUE |
| No application/form/preview files changed | TRUE |
| No DB/schema files changed | TRUE |
| No fake listings/stats/filters added | TRUE |
| Next safe gate plan produced | TRUE |
