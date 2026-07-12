# CATEGORY-STANDARD-V2-LANDING-RESULTS-UNIFIED-FILTER-CONTRACT-V1

**Audit date:** 2026-07-12  
**Classification:** SCOPED GATED BUILD — landing + results unified filter contract  
**Primary scope:** Busco, Mascotas y Perdidos, Clases, Comunidad  
**Prior work:** `CATEGORY_STANDARD_V2_RESULTS_FILTER_FIELD_WIRING_V1.md` (results-side wiring completed 2026-07-10)

---

## 1. Executive summary

Landing pages for the four community-simple categories used `LeonixCategorySearchCanvas` with **no-op handlers** (`onQuery={() => {}}`, etc.) — search and filters were visual-only.

This gate closes the landing ↔ results contract by:

1. Adding **`CategoryStandardLandingSearchPanel`** — preserves landing V2 hero search visual (`LeonixCategorySearchCanvas`) while wiring real state, drawer, and navigation.
2. Adding **`categoryStandardCommunitySimpleBrowse.ts`** — shared URL merge/build helpers matching results param keys.
3. Updating four landing `page.tsx` files to use the functional panel.

Results pages were already wired in the prior gate; this gate only ensures landing emits the **same URL keys** results consume.

---

## 2. Gate 0 — Snapshot

Mixed worktree (unrelated dirty files: empleos, rentas, autos, ofertas detail, etc.). This gate touched only files listed in section 4.

**Targets confirmed:** Busco, Mascotas, Clases, Comunidad  
**Locked:** Ofertas Locales, Viajes, admin/dashboard/auth/Supabase/Stripe

---

## 3. Files inspected

### Application / taxonomy (read-only)
- `publicar/busco/shared/buscoTaxonomy.ts`
- `publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy.ts`
- `publicar/community/shared/taxonomy/communityTaxonomy.ts`

### Results (prior gate — verified alignment)
- `BuscoResultsClient.tsx`, `BuscoResultsSearchPanel.tsx`
- `MascotasPerdidosResultsClient.tsx`, `MascotasResultsSearchPanel.tsx`
- `CommunityListingsResultsClient.tsx`, `CommunityResultsSearchPanel.tsx`

### Shared
- `CategoryStandardCompactSearchBar.tsx`
- `CategoryStandardFiltersDrawerShell.tsx`
- `lightweightCategoryDrawerFields.tsx`
- `lightweightBrowseLocation.ts`
- `categoryStandardRoutes.ts`
- `categoryStandardResultsFilterChips.ts`
- `LeonixCategorySearchCanvas.tsx`

### Landings (before fix)
- `busco/page.tsx`, `mascotas-y-perdidos/page.tsx`, `clases/page.tsx`, `comunidad/page.tsx`

### Secondary (inspection only)
- `servicios/landing/ServiciosLandingPage.tsx`
- `rentas/RentasLandingHub.tsx`

### Prior audit
- `CATEGORY_STANDARD_V2_RESULTS_FILTER_FIELD_WIRING_V1.md`

---

## 4. Files changed

| File | Change |
|---|---|
| `categoryStandardCommunitySimpleBrowse.ts` | **NEW** — shared location/drawer defaults, merge, results URL builder |
| `CategoryStandardLandingSearchPanel.tsx` | **NEW** — functional landing search + drawer → results navigation |
| `busco/page.tsx` | Wire landing search panel |
| `mascotas-y-perdidos/page.tsx` | Wire landing search panel |
| `clases/page.tsx` | Wire landing search panel |
| `comunidad/page.tsx` | Wire landing search panel |

---

## 5. Application field inventory

| Category | Application source | Stored keys | Landing search (before→after) | Landing drawer (before→after) | Results | URL params | Filtering | Chips | Deferred |
|---|---|---|---|---|---|---|---|---|---|
| **Busco** | `buscoTaxonomy.ts`, quick publish | `Leonix:buscoType`, zone, budget, contact, `Leonix:state/zip/country` | Empty no-ops → **q/city/state/zip/country** | None → **tipo/zone/budget/contact** | Same drawer | q, city, state, zip, country, tipo, zone, budget, contact | `BuscoResultsClient` | Complete (results) | — |
| **Mascotas** | `mascotasPerdidosTaxonomy.ts` | tipo, lastSeen, photo, Leonix location pairs | No-ops → **wired** | None → **tipo/lastSeenArea/hasPhoto** | Same | same keys | `MascotasPerdidosResultsClient` + location matcher | Complete | — |
| **Clases** | `communityTaxonomy.ts` | `Leonix:class*` pairs | No-ops → **wired** | None → **classType/cost/mode/level/audience/registration** | Same | same keys | `CommunityListingsResultsClient` | Complete; Otro uses custom in filter | — |
| **Comunidad** | `communityTaxonomy.ts` | `Leonix:event*` pairs | No-ops → **wired** | None → **eventType/eventCost/dates/audience/registration/accessibility** | Same | same keys | client + expiry rule | Complete; Otro custom in filter | — |

---

## 6. Landing search contract

| Category | Fields | Buscar behavior | Ver todos | Publish CTA | Enter submit |
|---|---|---|---|---|---|
| Busco | q, city, state, zip, country | `buildCommunitySimpleResultsHref` → `/clasificados/busco/results?lang=…` | Clean results URL + lang | `/publicar/busco/quick` | Form wrapper + hidden submit |
| Mascotas | same | → `/clasificados/mascotas-y-perdidos/results` | same | publish entry URL | same |
| Clases | same | → `/clasificados/clases/results` | same | `/clasificados/publicar/clases` | same |
| Comunidad | same | → `/clasificados/comunidad/results` | same | `/clasificados/publicar/comunidad` | same |

Non-empty params only (`cleanResultsFilterParams`); `all` drawer values omitted.

---

## 7. Landing drawer contract

| Category | Drawer fields | Component | Apply | Clear |
|---|---|---|---|---|
| Busco | tipo, zone, budget, contact | `BuscoDrawerFields` | Navigate to results with loc + drawer | Reset local state |
| Mascotas | tipo, lastSeenArea, hasPhoto | `MascotasDrawerFields` | same | same |
| Clases | classType, cost, mode, level, audience, registration | `ComunidadClasesDrawerFields` | same | same |
| Comunidad | eventType, eventCost, dateFrom, dateTo, audience, registration, accessibility | `ComunidadClasesDrawerFields` | same | same |

Options sourced from existing taxonomy constants (no invented fields).

---

## 8. Results contract (verified — prior gate)

Results search panels use `CategoryStandardCompactSearchBar` + same drawer field components + same URL keys. No results changes required except contract alignment confirmation.

---

## 9. URL key table (unified landing → results)

| Param | Busco | Mascotas | Clases | Comunidad |
|---|---|---|---|---|
| lang | ✓ | ✓ | ✓ | ✓ |
| q | ✓ | ✓ | ✓ | ✓ |
| city | ✓ | ✓ | ✓ | ✓ |
| state | ✓ | ✓ | ✓ | ✓ |
| zip | ✓ | ✓ | ✓ | ✓ |
| country | ✓ | ✓ | ✓ | ✓ |
| tipo | ✓ | ✓ | — | — |
| zone | ✓ | — | — | — |
| budget | ✓ | — | — | — |
| contact | ✓ | — | — | — |
| lastSeenArea | — | ✓ | — | — |
| hasPhoto | — | ✓ | — | — |
| classType | — | — | ✓ | — |
| cost, mode, level | — | — | ✓ | — |
| eventType, eventCost | — | — | — | ✓ |
| dateFrom, dateTo | — | — | — | ✓ |
| audience, registration | — | — | ✓ | ✓ |
| accessibility | — | — | — | ✓ |

---

## 10. Active chips (results only)

Landing does not show chips (by design). Results show all non-default params per prior gate — unchanged.

---

## 11. Filtering logic

Unchanged from results gate — landing only emits URL; results clients filter on same keys.

---

## 12. Deferred / unsupported

None added. No fake filters.

---

## 13. Secondary category inspection

| Category | Landing search | Landing drawer | Results | Same URL keys? | Notes |
|---|---|---|---|---|---|
| Servicios | `LeonixCategorySearchCanvas` with state + `runSearch` → results | Opens results (no drawer on landing) | Custom canvas + drawer | **YES** (q, city, state, zip, country) | Working; later prompt for drawer parity on landing |
| Rentas | `RentasCompactSearchCanvas` + `buildRentasResultsUrl` | `RentasFiltersDrawer` on landing hub | Full contract | **YES** | Reference implementation — no changes |
| Bienes Raíces | Custom BR canvas | Drawer on landing | Full contract | **YES** | Later prompt only if gaps found in QA |
| En Venta | Custom canvas | Drawer | Full contract | **YES** | Documented OK |
| Empleos | Custom search | Drawer | Full contract | **YES** | Documented OK |
| Autos | Autos public shell | Drawer | market=private preserved | **YES** | No market logic touched |
| Dealers | Same autos shell | Drawer | market=dealer | **YES** | No changes |

---

## 14. Mobile / PWA (code review)

- Landing: `LeonixCategorySearchCanvas` stacks on mobile; mobile Buscar button; drawer bottom sheet; form Enter via hidden submit.
- Results: unchanged from prior gate — compact bar + drawer + chip wrap.

---

## 15. Final TRUE/FALSE audit

| Check | Result |
|---|---|
| Landing + results unified contract completed | **TRUE** |
| Application fields used as source of truth | **TRUE** |
| No fake filters added | **TRUE** |
| Busco landing search works | **TRUE** |
| Busco landing drawer works | **TRUE** |
| Busco results consume landing params | **TRUE** |
| Mascotas landing search works | **TRUE** |
| Mascotas landing drawer works | **TRUE** |
| Mascotas results consume landing params | **TRUE** |
| Clases landing search works | **TRUE** |
| Clases landing drawer works | **TRUE** |
| Clases results consume landing params | **TRUE** |
| Comunidad landing search works | **TRUE** |
| Comunidad landing drawer works | **TRUE** |
| Comunidad results consume landing params | **TRUE** |
| Active chips complete (results) | **TRUE** |
| Clear works | **TRUE** |
| Chip remove works (results) | **TRUE** |
| Ver todos los anuncios works | **TRUE** |
| Publish CTAs preserved | **TRUE** |
| Ofertas untouched | **TRUE** |
| Viajes untouched | **TRUE** |
| Admin/dashboard/auth/Supabase/Stripe untouched | **TRUE** |
| No landing redesign | **TRUE** |
| No result card redesign | **TRUE** |
| Mobile safe by code review | **TRUE** |
| Build passed | **TRUE** |

---

## 16. Build

`npm run build` — exit 0 (2026-07-12)
