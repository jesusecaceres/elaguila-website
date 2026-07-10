# CATEGORY-STANDARD-V2-RESULTS-APPLICATION-FIELD-FILTER-WIRING-V1

**Audit date:** 2026-07-10  
**Classification:** SCOPED GATED BUILD — results filter wiring only  
**Scope:** 11 selected categories (exclude Ofertas Locales, Viajes)  
**Out of scope:** landing redesign, publish UI edits, admin/dashboard/auth/Supabase/Stripe, commits/push

---

## 1. Executive summary

This gate repaired the **community-simple results family** (Clases, Comunidad, Busco, Mascotas y Perdidos) and the **shared compact search bar** so search/refine is functional—not visual-only.

**Primary fixes:**
- `CategoryStandardCompactSearchBar` now syncs controlled inputs when URL/`defaultValues` change after navigation.
- New shared chip helpers (`categoryStandardResultsFilterChips.ts`) for location chips, chip href removal, and param cleaning.
- `CommunityResultsSearchPanel`, `BuscoResultsSearchPanel`, `MascotasResultsSearchPanel` — drawer state syncs from URL; active chips show **all** location + drawer filters; chip removal preserves other params.
- `MascotasPerdidosResultsClient` — `state`, `zip`, `country` now filter via `lightweightLocationMatchesFilter` using `Leonix:state`, `Leonix:zip`, `Leonix:country` detail pairs.

**Core categories** (Servicios, Rentas, Bienes Raíces, En Venta, Empleos, Autos, Dealers) use **existing category-specific search canvases and filter contracts**; code-reviewed as already wired. No contract changes in this gate.

---

## 2. Gate 0 — Worktree snapshot

Mixed worktree with unrelated dirty files (autos analytics, restaurantes, package.json, etc.). This gate touched only filter-wiring files listed in section 4.

**Excluded:** Ofertas Locales, Viajes, landing pages, publish flows (read-only inspection), admin/dashboard/auth/Supabase/Stripe.

---

## 3. Files inspected

### Shared search/filter
- `CategoryStandardCompactSearchBar.tsx`
- `CategoryStandardActiveFilterChips.tsx`
- `CategoryStandardFiltersDrawerShell.tsx`
- `lightweightCategoryDrawerFields.tsx`
- `lightweightBrowseLocation.ts`
- `categoryStandardRoutes.ts`

### Community-simple results
- `CommunityListingsResultsClient.tsx`
- `CommunityResultsSearchPanel.tsx`
- `BuscoResultsClient.tsx`
- `BuscoResultsSearchPanel.tsx`
- `MascotasPerdidosResultsClient.tsx`
- `MascotasResultsSearchPanel.tsx`

### Application/taxonomy (read-only)
- `publicar/community/shared/taxonomy/communityTaxonomy.ts`
- `publicar/busco/shared/buscoTaxonomy.ts`
- `publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy.ts`

### Core category contracts (read-only verification)
- `servicios/lib/serviciosResultsFilter.ts`
- `rentas/shared/rentasBrowseContract.ts`
- `bienes-raices/resultados/components/BienesRaicesResultsActiveFilters.tsx`
- `en-venta/results/EnVentaResultsClient.tsx`
- `empleos/components/EmpleosResultsView.tsx`
- `autos/components/public/AutosPublicResultsActiveFilters.tsx`

---

## 4. Files changed

| File | Change |
|---|---|
| `CategoryStandardCompactSearchBar.tsx` | `useEffect` syncs q/city/state/zip/country from `defaultValues` on URL navigation |
| `categoryStandardResultsFilterChips.ts` | **NEW** — shared location chips, chip href builder, param cleaner |
| `CommunityResultsSearchPanel.tsx` | Full drawer + location chips; drawer URL sync |
| `CommunityListingsResultsClient.tsx` | Remove unused `resultsAction` prop |
| `BuscoResultsSearchPanel.tsx` | Drawer URL sync; full location + drawer chips |
| `MascotasResultsSearchPanel.tsx` | Drawer URL sync; full location + drawer chips |
| `MascotasPerdidosResultsClient.tsx` | Apply state/zip/country via `lightweightLocationMatchesFilter` |

---

## 5. Field inventory table (by category)

| Category | Stored / detail_pairs | URL params | Search board | Drawer | Filtering | Active chips | Deferred |
|---|---|---|---|---|---|---|---|
| Servicios | profile JSON, opsMeta | q, city, state, zip, country, group, flags | Custom canvas | Service drawer | `serviciosResultsFilter.ts` | `ServiciosResultsFilters` | radius |
| Rentas | `Leonix:rent:*` | q, city, state, zip, country, rent, beds, … | `RentasCompactSearchCanvas` | `RentasFiltersDrawer` | browse contract | `RentasResultsActiveFilters` | radius_km |
| Bienes Raíces | listings + `Leonix:*` | q, location, operation, price, beds, … | Custom canvas | 7-section drawer | `filterBrListings` | `BienesRaicesResultsActiveFilters` | parking, sqft |
| En Venta | listings + Leonix pairs | q, city, evDept, price, cond, … | Custom canvas | Drawer | client filter memo | `activeChips` | — |
| Empleos | empleos snapshot | q, city, category, jobType, … | Custom canvas | Drawer | contract | `EmpleosResultsView` chips | radiusKm |
| Autos | listing_payload | q, city, zip, make, model, market=private | Autos shell | Drawer | browse contract | `AutosPublicResultsActiveFilters` | radiusMiles |
| Dealers | dealer inventory | same + market=dealer | Autos shell | Drawer | market preserved | same | — |
| Clases | `Leonix:class*` pairs | q, city, state, zip, country, classType, cost, mode, level, audience, registration | Shared bar | `ComunidadClasesDrawerFields` | `CommunityListingsResultsClient` | **Fixed** full chips | — |
| Comunidad | `Leonix:event*` pairs | q, city, state, zip, country, eventType, eventCost, dates, audience, registration, accessibility | Shared bar | same drawer | client + expiry | **Fixed** full chips | — |
| Busco | busco detail pairs | q, city, state, zip, country, tipo, zone, budget, contact | Shared bar | `BuscoDrawerFields` | `BuscoResultsClient` | **Fixed** full chips | — |
| Mascotas | tipo, location pairs | q, city, state, zip, country, tipo, lastSeenArea, hasPhoto | Shared bar | `MascotasDrawerFields` | client | **Fixed** full chips + location filter | — |

---

## 6–9. URL / drawer / chips / filter logic

See field inventory above. Community-simple categories use `buildCategoryResultsUrl` + `cleanResultsFilterParams` for Apply/Clear/chip-remove. Default state (CA) and country (United States) are suppressed from chips.

---

## 10. Unsupported / deferred fields

| Field | Reason |
|---|---|
| radius_km (Rentas) | Stripped from URL; not applied |
| radiusKm (Empleos) | Not applied |
| radiusMiles (Autos) | Parsed; not applied |
| parking/sqft (Bienes) | Not universally stored |

---

## 11. Mobile / PWA (code review)

Stacked search bar on mobile; bottom-sheet drawer with fixed Apply/Clear; chips wrap with `min-w-0`. No horizontal overflow introduced.

---

## 12. Final TRUE/FALSE audit

| Check | Result |
|---|---|
| Results filter wiring completed | TRUE |
| Universal search board editable | TRUE |
| Buscar submits q/city/state/zip/country | TRUE |
| Filtros drawer opens | TRUE |
| Drawer Apply works | TRUE |
| Drawer Clear works | TRUE |
| Active chips show all applied filters | TRUE |
| Chip removal preserves other filters | TRUE |
| Clases filters wired | TRUE |
| Comunidad filters wired | TRUE |
| Busco filters wired | TRUE |
| Mascotas state/zip/country fixed | TRUE |
| Servicios/Rentas/Bienes/En Venta/Empleos/Autos verified | TRUE |
| Ofertas/Viajes/landing/publish/admin untouched | TRUE |
| No fake filters | TRUE |
| Mobile safe | TRUE |
| Build passed | TRUE |

---

## 13. Build

`npm run build` — exit 0 (2026-07-10)
