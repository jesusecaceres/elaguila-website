# CATEGORY-STANDARD-V2-RESULTS-ROUTE-OWNERSHIP-AUDIT-V1

**Date:** 2026-07-09  
**Mode:** Audit only — no code changes to results UI, landings, publish, admin, or backend  
**Repo:** `elaguila-website`

---

## 1. Executive summary

Clasificados results routing is split across **two URL conventions**:

| Pattern | Categories |
|---------|------------|
| **`/results` only (canonical)** | `rentas`, `dealers-de-autos`, `ofertas-locales`, `en-venta` |
| **`/resultados` canonical + `/results` re-export** | `bienes-raices`, `autos`, `restaurantes`, `servicios`, `empleos`, `clases`, `comunidad`, `busco`, `mascotas-y-perdidos`, `viajes` |

**V2 results shell maturity is uneven:**

- **Already on `LeonixCategoryResultsShell` (V2):** Ofertas Locales, Restaurantes (results mode).
- **Custom but results-shaped shells:** Rentas, Bienes Raíces, Autos/Dealers, En Venta, Viajes.
- **Older `CategoryStandardResultsPageShell`:** Empleos, Servicios, Clases, Comunidad, Busco, Mascotas.

**Landing clutter still present inside some results pages:**

| Component | Categories affected |
|-----------|---------------------|
| `RentasLandingVisibilityStrip` | Rentas results |
| `BienesRaicesSponsorsLane` + `CategoryVisibilityCta` | Bienes results |
| `CategoryVisibilityCta` | En Venta, Viajes results |
| `ServiciosDestacadosSection` | Servicios results (paid visibility band) |
| `ViajesResultsDiscoveryStrip` + `ViajesTrustStrip` | Viajes results |
| `AutosMarketPeerCrossLink` | Autos + Dealers results (peer lane link — intentional, not landing grid) |
| Empleos featured/promoted strip | Empleos results (results-intent, but marketing-heavy) |

**Safest next polish order:** V2-aligned business results (Restaurantes/Ofertas touch-ups) → community simple batch → Rentas/Bienes strip cleanup → Autos/Dealers isolation → hold Viajes.

---

## 2. Route table (every category)

| # | Category | `/results` | `/resultados` | Redirect / alias | Route page file | Primary component | Server / client |
|---|----------|------------|---------------|------------------|-----------------|-------------------|-----------------|
| 1 | **Rentas** | ✅ canonical | ❌ | — | `rentas/results/page.tsx` | `RentasResultsClient` | Server prefetch listings → client |
| 2 | **Bienes Raíces** | ✅ alias | ✅ canonical | `results/page.tsx` → `../resultados/page` | `bienes-raices/resultados/page.tsx` | `BienesRaicesResultsClient` | Client (live fetch in client) |
| 3 | **Autos privado** | ✅ alias | ✅ canonical | `autos/results/page.tsx` → `../resultados/page` | `autos/resultados/page.tsx` | `AutosPublicResultsShell market="private"` | Client |
| 4 | **Dealers de Autos** | ✅ canonical | ❌ | — | `dealers-de-autos/results/page.tsx` | `AutosPublicResultsShell market="dealer"` | Client |
| 5 | **Ofertas Locales** | ✅ canonical | ❌ | — | `ofertas-locales/results/page.tsx` | `OfertasLocalesPublicSearchClient mode="results"` | Client (API fetch) |
| 6 | **Restaurantes** | ✅ alias | ✅ canonical | `results/page.tsx` → `../resultados/page` | `restaurantes/resultados/page.tsx` | `RestaurantesResultsShell` | Server inventory → client shell |
| 7 | **Servicios** | ✅ alias | ✅ canonical | `results/page.tsx` → `../resultados/page` | `servicios/resultados/page.tsx` | `ServiciosResultsPageShell` + inline page logic | Server list + client shell |
| 8 | **En Venta** | ✅ canonical | ❌ | — | `en-venta/results/page.tsx` | `EnVentaResultsClient` | Client (Supabase browser) |
| 9 | **Empleos** | ✅ alias | ✅ canonical | `empleos/results/page.tsx` → `../resultados/page` | `empleos/resultados/page.tsx` | `EmpleosResultsView` | Server props → client fetch |
| 10 | **Clases** | ✅ alias | ✅ canonical | `clases/results/page.tsx` → `../resultados/page` | `clases/resultados/page.tsx` | `CommunityListingsResultsClient category="clases"` | Client |
| 11 | **Comunidad** | ✅ alias | ✅ canonical | `comunidad/results/page.tsx` → `../resultados/page` | `comunidad/resultados/page.tsx` | `CommunityListingsResultsClient category="comunidad"` | Client |
| 12 | **Busco** | ✅ alias | ✅ canonical | `busco/results/page.tsx` → `../resultados/page` | `busco/resultados/page.tsx` | `BuscoResultsClient` | Client |
| 13 | **Mascotas y Perdidos** | ✅ alias | ✅ canonical | `mascotas-y-perdidos/results/page.tsx` → `../resultados/page` | `mascotas-y-perdidos/resultados/page.tsx` | `MascotasPerdidosResultsClient` | Client |
| 14 | **Viajes** | ✅ alias | ✅ canonical | `viajes/results/page.tsx` → `../resultados/page` | `viajes/resultados/page.tsx` | `ViajesResultsShell` | Server merged rows → client |

### Autos / Dealers route ownership note

- Market paths are centralized in `app/lib/clasificados/autos/autosPublicMarket.ts`:
  - Private: `/clasificados/autos/results`
  - Dealer: `/clasificados/dealers-de-autos/results`
- **`/clasificados/autos/results?seller=dealer` is NOT redirected** to dealers route. `AutosPublicResultsShell` only injects default `seller` when param is missing; explicit `seller=dealer|private` is respected on whichever results URL was opened.
- Peer cross-link (`AutosMarketPeerCrossLink`) links private ↔ dealer results/landing intentionally.

---

## 3. Results file ownership map (per category)

### Rentas
| Layer | Files |
|-------|-------|
| Route | `rentas/results/page.tsx` |
| Client | `rentas/results/RentasResultsClient.tsx` |
| Shell | `rentas/results/components/RentasResultsShell.tsx`, `RentasResultsGatewayPanel.tsx`, `RentasResultsTopBar.tsx`, `RentasResultsToolbar.tsx` |
| Filters | `rentas/filters/*`, `parseRentasBrowseParams`, `filterRentasPublicListings`, `sortRentasPublicListings` |
| Data | `fetchRentasPublicListingsForBrowse`, `useRentasPublicBrowseInventory`, demo pool via `rentasPublicIncludeDemoPool` |
| Card | `rentas/results/cards/RentasResultCard.tsx` |
| Empty | Inline in `RentasResultsClient` |
| Pagination | Inline prev/next (`RENTAS_RESULTS_PAGE_SIZE`) |
| **Clutter risk** | `RentasLandingVisibilityStrip` imported in results client |

### Bienes Raíces
| Layer | Files |
|-------|-------|
| Route | `bienes-raices/resultados/page.tsx`, alias `bienes-raices/results/page.tsx` |
| Client | `bienes-raices/resultados/BienesRaicesResultsClient.tsx` |
| Shell | `bienes-raices/resultados/components/BienesRaicesResultsShell.tsx`, `BienesRaicesResultsGatewayPanel.tsx`, `BienesRaicesResultsHeader.tsx`, `BienesRaicesResultsTopBar.tsx` |
| Filters | `bienes-raices/resultados/lib/brResultsUrlState.ts`, `brResultsFilters.ts`, `BienesRaicesResultsFilters.tsx`, `BienesRaicesResultsActiveFilters.tsx` |
| Data | `fetchBrPublishedListingsForBrowse`, optional `buildBrDemoListingPool` + `brShouldMergeDemoInventoryWithLive` |
| Card | `bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx` |
| Empty | Inline clear-filters CTA |
| Pagination | Inline prev/next |
| **Clutter risk** | `BienesRaicesSponsorsLane`, `CategoryVisibilityCta surface="results"` |

### Autos privado + Dealers
| Layer | Files |
|-------|-------|
| Routes | `autos/resultados/page.tsx` (private), `dealers-de-autos/results/page.tsx` (dealer), alias `autos/results/page.tsx` |
| Client shell | `autos/components/public/AutosPublicResultsShell.tsx` |
| Filters | `autos/filters/autosBrowseFilterContract.ts`, `autosPublicFilterTypes.ts`, `autosPublicFilters.ts`, `AutosPublicFilterRail.tsx`, `AutosPublicResultsActiveFilters.tsx`, `AutosPublicResultsQuickChips.tsx` |
| Data | `useAutosPublicListingsFetch` → `/api/clasificados/autos/public/listings`, fallback `resolveAutosLandingInventory` |
| Cards | `AutosPublicFeaturedCard.tsx`, `AutosPublicStandardCard.tsx` |
| Empty | Inline no-matches |
| Pagination | Page window + load-more link |
| Market helpers | `app/lib/clasificados/autos/autosPublicMarket.ts` |
| **Clutter risk** | `AutosMarketPeerCrossLink` (peer lane — keep but isolate edits) |

### Ofertas Locales
| Layer | Files |
|-------|-------|
| Route | `ofertas-locales/results/page.tsx` |
| Client | `ofertas-locales/OfertasLocalesPublicSearchClient.tsx` (`mode="results"`) |
| V2 shell | `LeonixCategoryResultsShell`, `LeonixCategoryActiveFilters`, `LeonixCategoryResultsToolbar`, `LeonixCategoryCompactEmptyState` |
| Filters | URL params + `OfertasLocalesFiltersDrawer.tsx` |
| Data | `/api/ofertas-locales/public-offers`, `/api/ofertas-locales/public-search` |
| Cards | `OfertasLocalesPublicOfferCard.tsx`, `OfertasLocalesPublicItemCard.tsx` |
| **Clutter risk** | **LOW** — landing sections gated off when `mode="results"` |

### Restaurantes
| Layer | Files |
|-------|-------|
| Route | `restaurantes/resultados/page.tsx`, alias `restaurantes/results/page.tsx` |
| Client | `restaurantes/resultados/RestaurantesResultsShell.tsx` |
| V2 shell | `LeonixCategoryPageShell surface="results"`, `LeonixCategoryResultsShell`, toolbar, active filters, compact empty |
| Filters | `restaurantesDiscoveryContract.ts`, `filterRestaurantesBlueprintRows.ts` |
| Data | `loadRestaurantesResultsInventoryForPage` (server), visibility ranking |
| Card | `RestaurantePublishedListingCard.tsx` |
| Pagination | Client slice `perPage` / `page` |
| **Clutter risk** | **LOW** — V2 results shell |

### Servicios
| Layer | Files |
|-------|-------|
| Route | `servicios/resultados/page.tsx`, alias `servicios/results/page.tsx` |
| Shell | `servicios/ServiciosResultsPageShell.tsx` + logic in `servicios/resultados/page.tsx` |
| Filters | `ServiciosResultsFilters.tsx`, `ServiciosResultsActiveSummary.tsx` |
| Data | `listServiciosPublicListingsRaw`, entitlement overlay |
| Card | `ServiciosHorizontalResultCard.tsx` |
| Pagination | `CategoryStandardPagination.tsx` |
| **Clutter risk** | `ServiciosDestacadosSection` (featured/paid band above grid) |

### En Venta
| Layer | Files |
|-------|-------|
| Route | `en-venta/results/page.tsx` |
| Client | `en-venta/results/EnVentaResultsClient.tsx` |
| Sections | `EnVentaResultsListingSections.tsx`, `EnVentaResultsChipsRow.tsx`, `EnVentaResultsFiltersDrawer.tsx` |
| Filters | `enVentaResultsUrlParams`, `buildEnVentaResultsUrl`, location match helpers |
| Data | Supabase `queryEnVentaBrowseListings`, `mapDbRowToEnVentaAnuncioDTO` |
| Card | `EnVentaResultListingCard.tsx` |
| Empty | `EnVentaResultsEmpty.tsx` |
| Pagination | Inline in listing sections |
| **Clutter risk** | `CategoryVisibilityCta surface="results"` |

### Empleos
| Layer | Files |
|-------|-------|
| Route | `empleos/resultados/page.tsx`, alias `empleos/results/page.tsx` |
| Client | `empleos/components/EmpleosResultsView.tsx` |
| Shell | `CategoryStandardResultsPageShell`, `CategoryStandardResultsHeader`, `CategoryStandardFiltersDrawerShell` |
| Filters | `empleosResultsQuery.ts`, `buildEmpleosResultadosUrl`, `EmpleosBrowseDrawerFields.tsx` |
| Data | `/api/clasificados/empleos/listings`, `mergeEmpleosSeedWithLiveJobs`, `empleosOmitMarketingSeedCatalog` |
| Card | `EmpleosJobResultCard.tsx` |
| **Clutter risk** | Featured/promoted strip block; seed catalog policy; no pagination |

### Clases + Comunidad (shared client)
| Layer | Files |
|-------|-------|
| Routes | `clases/resultados/page.tsx`, `comunidad/resultados/page.tsx` (+ `/results` aliases) |
| Client | `community/CommunityListingsResultsClient.tsx` |
| Search | `community/CommunityResultsSearchPanel.tsx` |
| Shell | `CategoryStandardResultsPageShell`, `CategoryStandardResultsHeader` |
| Data | `fetchPublishedCommunityCategoryListings` |
| Card | `community/CommunityDiscoveryListingCard.tsx` |
| Filters | URL params + `lightweightLocationMatchesFilter`; comunidad adds event expiration sort |
| **Clutter risk** | **LOW** — header publish CTA only; no landing grids |

### Busco
| Layer | Files |
|-------|-------|
| Route | `busco/resultados/page.tsx`, alias `busco/results/page.tsx` |
| Client | `busco/BuscoResultsClient.tsx` |
| Shell | `busco/shared/BuscoShellLayout.tsx`, `BuscoResultsSearchPanel.tsx` |
| Data | `fetchPublishedBuscoListings` |
| Card | `busco/BuscoRequestCard.tsx` |
| **Clutter risk** | **LOW** — back link in shell header |

### Mascotas y Perdidos
| Layer | Files |
|-------|-------|
| Route | `mascotas-y-perdidos/resultados/page.tsx`, alias `mascotas-y-perdidos/results/page.tsx` |
| Client | `mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx` |
| Shell | `mascotas-y-perdidos/shared/MascotasPerdidosShellLayout.tsx`, `MascotasResultsSearchPanel.tsx` |
| Data | `fetchPublishedMascotasPerdidosListings` |
| Card | `mascotas-y-perdidos/MascotasPerdidosNoticeCard.tsx` |
| **Clutter risk** | **LOW** |

### Viajes (audit only — hold edits)
| Layer | Files |
|-------|-------|
| Route | `viajes/resultados/page.tsx`, alias `viajes/results/page.tsx` |
| Client | `viajes/components/ViajesResultsShell.tsx` |
| Data | `fetchViajesPublicBrowseRowsMerged`, staged row mappers |
| Cards | `ViajesResultsAffiliateCard`, `ViajesResultsBusinessCard`, `ViajesResultsEditorialCard` |
| **Clutter risk** | **HIGH** — `ViajesResultsDiscoveryStrip`, `ViajesTrustStrip`, `CategoryVisibilityCta` |

---

## 4. Shared component map

| Component | Path | Used by | Safe to edit globally? |
|-----------|------|---------|------------------------|
| `LeonixCategoryResultsShell` | `components/categoryStandardV2/LeonixCategoryResultsShell.tsx` | Ofertas, Restaurantes | **Cautious** — V2 contract; blocks landing props by design |
| `LeonixCategoryResultsToolbar` | `categoryStandardV2/` | Ofertas, Restaurantes | **Cautious** |
| `LeonixCategoryActiveFilters` | `categoryStandardV2/` | Ofertas, Restaurantes | **Cautious** |
| `LeonixCategoryCompactEmptyState` | `categoryStandardV2/` | Ofertas, Restaurantes | **Safer** — empty state only |
| `LeonixCategoryPageShell` | `categoryStandardV2/` | Ofertas, Restaurantes (+ landings) | **Dangerous** — dual surface |
| `CategoryStandardResultsPageShell` | `components/categoryStandard/CategoryStandardResultsPageShell.tsx` | Empleos, Servicios, Clases, Comunidad, Busco, Mascotas, Autos (partial) | **Dangerous** — 6+ categories |
| `CategoryStandardResultsHeader` | `categoryStandard/` | Empleos, Servicios, community, Busco, Mascotas | **Dangerous** |
| `CategoryStandardPagination` | `categoryStandard/` | Servicios | **Safer** — single primary consumer |
| `CategoryVisibilityCta` | `categoryStandard/CategoryVisibilityCta.tsx` | Bienes, En Venta, Viajes results; optional in `CategoryStandardResultsChrome` | **Dangerous** — edit per-category call sites |
| `CategoryStandardResultsChrome` | `categoryStandard/CategoryStandardResultsChrome.tsx` | Legacy chrome wrapper | **Dangerous** |
| `lightweightLocationMatchesFilter` | `categoryStandard/lightweightBrowseLocation.ts` | Community, Busco, Mascotas | **Cautious** |
| `CommunityListingsResultsClient` | `community/CommunityListingsResultsClient.tsx` | Clases + Comunidad only | **Safer** — two categories, same family |
| `AutosPublicResultsShell` | `autos/components/public/AutosPublicResultsShell.tsx` | Autos + Dealers only | **Safer** — isolate to autos batch |
| `RentasResultsClient` | `rentas/results/RentasResultsClient.tsx` | Rentas only | **Safe** — category-local |
| `BienesRaicesResultsClient` | `bienes-raices/resultados/` | Bienes only | **Safe** — category-local |
| `EnVentaResultsClient` | `en-venta/results/` | En Venta only | **Safe** — category-local |
| `OfertasLocalesPublicSearchClient` | `ofertas-locales/` | Ofertas landing + results | **Cautious** — dual mode; results branch is isolated |

**V2 landing components with `surface === "results"` hard null:**  
`LeonixCategoryDiscoveryGrid`, `LeonixCategoryPartnerSection`, `LeonixCategoryVisibilityStrip`, `LeonixCategoryShortcutSection` — safe by contract when `surface="results"`, but **Ofertas/Restaurantes still share one client file with landing**.

---

## 5. Category risk table (cleanliness audit)

Legend: ✅ TRUE = passes / present · ❌ FALSE = fails / absent · ⚠️ = partial / risky

| Category | Clean shell | Landing sections in results | Sponsor/partner in results | Discovery in results | Visibility strip in results | Dup publish CTAs | Extra non-filter pills | Fake data | Real fetch | Compact empty | Working URL filters | Pagination | Mobile-safe | Safe to polish batch | High-risk isolate |
|----------|-------------|----------------------------|---------------------------|---------------------|----------------------------|------------------|----------------------|-----------|------------|---------------|---------------------|------------|-------------|-------------------|-------------------|
| Rentas | ⚠️ custom | ❌ visibility strip | ❌ | ✅ | ❌ landing strip | ⚠️ search publish | ⚠️ quick chips | ⚠️ demo pool | ✅ | ⚠️ inline | ✅ | ✅ | ✅ | ⚠️ strip removal | ⚠️ |
| Bienes | ⚠️ custom | ❌ | ❌ sponsors lane | ✅ | ❌ visibility CTA | ⚠️ | ⚠️ | ⚠️ demo merge | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Autos | ⚠️ custom | ✅ | ✅ | ✅ | ✅ | ⚠️ header publish | ⚠️ quick chips | ⚠️ fallback inventory | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Dealers | same as Autos | same | same | same | same | same | same | same | same | same | same | same | same | ❌ | ✅ |
| Ofertas | ✅ V2 | ✅ | ✅ | ✅ | ✅ | ✅ suppressed | ✅ filter-driven | ✅ live API | ✅ | ✅ V2 empty | ✅ | ❌ none | ✅ | ✅ | ❌ |
| Restaurantes | ✅ V2 | ✅ | ✅ | ✅ | ✅ | ⚠️ hero publish | ✅ | ✅ live | ✅ | ✅ V2 empty | ✅ | ✅ client slice | ✅ | ✅ | ❌ |
| Servicios | ⚠️ CAT-STD | ✅ | ⚠️ destacados | ✅ | ✅ | ⚠️ header publish | ⚠️ | ✅ live | ✅ | ⚠️ dashed | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| En Venta | ⚠️ custom | ✅ | ✅ | ✅ | ❌ visibility CTA | ⚠️ | ⚠️ chips row | ✅ live Supabase | ✅ | ✅ dedicated | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Empleos | ⚠️ CAT-STD | ✅ | ⚠️ featured strip | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ seed policy | ✅ API | ⚠️ | ✅ | ❌ | ✅ | ⚠️ | ⚠️ |
| Clases | ⚠️ CAT-STD | ✅ | ✅ | ✅ | ✅ | ⚠️ header publish | ✅ | ✅ live | ✅ | ⚠️ inline | ✅ | ❌ | ✅ | ✅ | ❌ |
| Comunidad | ⚠️ CAT-STD | ✅ | ✅ | ✅ | ✅ | ⚠️ header publish | ✅ | ✅ live | ✅ | ⚠️ inline | ✅ | ❌ | ✅ | ✅ | ❌ |
| Busco | ⚠️ CAT-STD | ✅ | ✅ | ✅ | ✅ | ⚠️ empty post CTA | ✅ | ✅ live | ✅ | ⚠️ dashed | ✅ | ❌ | ✅ | ✅ | ❌ |
| Mascotas | ⚠️ CAT-STD | ✅ | ✅ | ✅ | ✅ | ⚠️ empty post CTA | ✅ | ✅ live | ✅ | ⚠️ dashed | ✅ | ❌ | ✅ | ✅ | ❌ |
| Viajes | ⚠️ custom | ❌ discovery strip | ⚠️ trust | ❌ discovery strip | ❌ visibility CTA | ⚠️ | ⚠️ | ⚠️ staged merge | ✅ | ⚠️ | ✅ | ❌ | ✅ | ❌ HOLD | ✅ |

---

## 6. Landing-only clutter found inside results

| File | Clutter | Severity |
|------|---------|----------|
| `rentas/results/RentasResultsClient.tsx` | `RentasLandingVisibilityStrip` | **High** — literal landing component |
| `bienes-raices/resultados/BienesRaicesResultsClient.tsx` | `BienesRaicesSponsorsLane`, `CategoryVisibilityCta` | **High** |
| `en-venta/results/EnVentaResultsClient.tsx` | `CategoryVisibilityCta surface="results"` | **Medium** |
| `servicios/resultados/page.tsx` | `ServiciosDestacadosSection` | **Medium** — monetization band (may be intentional) |
| `viajes/components/ViajesResultsShell.tsx` | `ViajesResultsDiscoveryStrip`, `ViajesTrustStrip`, `CategoryVisibilityCta` | **High** — hold |
| `empleos/components/EmpleosResultsView.tsx` | Featured/promoted strip above full list | **Low–Medium** — results feature, not landing grid |
| `autos/components/public/AutosPublicResultsShell.tsx` | `AutosMarketPeerCrossLink` | **Low** — lane switcher, not landing clutter |

**Not clutter (correctly gated):**  
`OfertasLocalesPublicSearchClient` landing blocks only render when `mode !== "results"`.

---

## 7. Exact files likely needed for next results prompts

### Batch A — Ready / V2-aligned touch-ups
- `ofertas-locales/OfertasLocalesPublicSearchClient.tsx` (results branch only)
- `restaurantes/resultados/RestaurantesResultsShell.tsx`
- `components/categoryStandardV2/LeonixCategoryResultsShell.tsx` (only if tightening shared V2 contract)

### Batch B — Business results
- `servicios/resultados/page.tsx`
- `servicios/ServiciosResultsPageShell.tsx`
- `servicios/components/ServiciosDestacadosSection.tsx` (decide keep/remove on results)

### Batch C — Rentas + Bienes (clean family, custom shells)
- `rentas/results/RentasResultsClient.tsx`
- `rentas/results/components/RentasResultsShell.tsx`
- `bienes-raices/resultados/BienesRaicesResultsClient.tsx`
- `bienes-raices/resultados/components/BienesRaicesResultsShell.tsx`

### Batch D — Autos / Dealers
- `autos/components/public/AutosPublicResultsShell.tsx`
- `autos/resultados/page.tsx`
- `dealers-de-autos/results/page.tsx`
- `app/lib/clasificados/autos/autosPublicMarket.ts`
- `autos/filters/autosBrowseFilterContract.ts`

### Batch E — Community simple
- `community/CommunityListingsResultsClient.tsx`
- `community/CommunityResultsSearchPanel.tsx`
- `busco/BuscoResultsClient.tsx`
- `busco/shared/BuscoShellLayout.tsx`
- `mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx`
- `mascotas-y-perdidos/shared/MascotasPerdidosShellLayout.tsx`

### Batch F — En Venta + Empleos (medium complexity)
- `en-venta/results/EnVentaResultsClient.tsx`
- `en-venta/results/components/*`
- `empleos/components/EmpleosResultsView.tsx`

### Hold — Viajes
- `viajes/components/ViajesResultsShell.tsx` (read-only until dedicated Viajes prompt)

---

## 8. Recommended batch order

1. **A — READY SIMPLE (V2-aligned):** Restaurantes results micro-polish; Ofertas results verify-only (already clean). Low regression risk.
2. **E — COMMUNITY SIMPLE:** Clases, Comunidad, Busco, Mascotas — shared patterns, small shells, live fetch, no landing grids. Good confidence builder.
3. **C — RENTAS + BIENES STRIP CLEANUP:** Remove/replace landing visibility + sponsor lanes; keep custom shells; do **not** merge categories.
4. **B — SERVICIOS BUSINESS:** Address `ServiciosDestacadosSection` placement; optional migration toward V2 results shell.
5. **F — EN VENTA + EMPLEOS:** Category-local files; visibility CTA + featured strip decisions.
6. **D — AUTOS / DEALERS:** Highest routing/market complexity; edit only `AutosPublicResultsShell` + market helpers together.
7. **HOLD — VIAJES:** Audit complete; no edits until separate special prompt.

---

## 9. Locked files warning (do not edit in standard results batches)

- All `**/publicar/**` publish flows
- All `**/admin/**`, `**/dashboard/**`
- `app/(site)/clasificados/**/page.tsx` landing routes (unless explicit landing+results shared client with mode guard)
- `viajes/**` (until dedicated prompt)
- Global header/footer/layout
- Supabase migrations, Stripe, auth API routes
- `CategoryRecentListings.tsx` and other landing-only components

**Dangerous shared edits:**  
`CategoryStandardResultsPageShell`, `CategoryStandardResultsHeader`, `CategoryVisibilityCta`, `LeonixCategoryPageShell` — prefer per-category call-site changes or category-local wrappers.

---

## 10. TRUE / FALSE final audit

| Item | Result |
|------|--------|
| All 14 category results routes documented | **TRUE** |
| `/results` vs `/resultados` aliases documented | **TRUE** |
| Autos/Dealers market routing documented | **TRUE** |
| Shared component risk classified | **TRUE** |
| Landing clutter inside results identified | **TRUE** |
| Viajes audited but not recommended for edit | **TRUE** |
| Next batch order provided | **TRUE** |
| No results UI code edited in this gate | **TRUE** |
| No landing pages edited | **TRUE** |
| No publish/admin/backend edited | **TRUE** |
| Audit doc created | **TRUE** |

---

## Next exact prompt recommendation

**`CATEGORY-STANDARD-V2-RESTAURANTES-OFERTAS-RESULTS-MICRO-POLISH-V1`**  
Scope: verify/polish V2 `LeonixCategoryResultsShell` results pages only (Ofertas + Restaurantes). No shared `CategoryStandardResultsPageShell` changes. No Viajes. No Autos.

Follow with **`CATEGORY-STANDARD-V2-COMMUNITY-SIMPLE-RESULTS-V1`** (Clases, Comunidad, Busco, Mascotas) using `CommunityListingsResultsClient` + shell layouts as the isolation unit.
