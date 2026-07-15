# APPLICATION-FIELD-TO-PUBLIC-FILTER-DRAWER-PARITY-FIX-V1

**Scope:** Application field → public filter drawer parity for community/simple + En Venta categories. Landing + results drawers/search boards. No redesign.

**Date:** 2026-07-14

---

## 1. Executive summary

Browser QA proved Comunidad **Event type** and Clases **Subject/type** were text inputs in public drawers while the publish application uses taxonomy-backed `<select>` fields. This patch converts those to selects sourced from `communityTaxonomy.ts`, updates results filtering to match taxonomy slugs, improves chip labels, and fixes En Venta **item type** from free text to cascading application-backed select (`getItemTypesForSelection`). Busco and Mascotas were already select-backed; verified unchanged. City/state/ZIP/country default-location behavior from prior patches remains intact via shared `sanitizeLocationParamsForUrl` / `activeFilterParamsFromUrl`.

---

## 2. Gate 0 — Snapshot

Pre-patch worktree had unrelated changes (autos, bienes, servicios, package.json). This patch touched only community/simple browse + En Venta filter files.

**Locked:** Ofertas, Viajes, admin, dashboard, auth, Supabase, Stripe — untouched.

---

## 3. Files inspected

- `app/(site)/publicar/community/shared/taxonomy/communityTaxonomy.ts`
- `app/(site)/publicar/busco/shared/buscoTaxonomy.ts`
- `app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy.ts`
- `app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields.tsx`
- `app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel.tsx`
- `app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar.tsx`
- `app/(site)/clasificados/components/categoryStandard/categoryStandardCommunitySimpleBrowse.ts`
- `app/(site)/clasificados/components/categoryStandard/categoryStandardResultsFilterChips.ts`
- `app/(site)/clasificados/community/CommunityResultsSearchPanel.tsx`
- `app/(site)/clasificados/community/CommunityListingsResultsClient.tsx`
- `app/(site)/clasificados/busco/BuscoResultsSearchPanel.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/MascotasResultsSearchPanel.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaLandingDrawerFields.tsx`
- `app/(site)/clasificados/en-venta/results/components/EnVentaResultsFiltersDrawer.tsx`
- `app/(site)/clasificados/en-venta/shared/fields/enVentaTaxonomy.ts`
- `app/(site)/clasificados/publicar/en-venta/free/application/sections/CategorySelectionSection.tsx`

---

## 4. Files changed

- `app/(site)/clasificados/components/categoryStandard/lightweightCategoryDrawerFields.tsx`
- `app/(site)/clasificados/community/CommunityResultsSearchPanel.tsx`
- `app/(site)/clasificados/community/CommunityListingsResultsClient.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaLandingDrawerFields.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaItemTypeFilterSelect.tsx` (new)
- `app/(site)/clasificados/en-venta/results/components/EnVentaResultsFiltersDrawer.tsx`
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx`
- `app/lib/website-audit/APPLICATION_FIELD_TO_PUBLIC_FILTER_DRAWER_PARITY_FIX_V1.md` (this file)

---

## 5. Owner screenshot findings

Screenshots in *An Example of Applications.zip* confirm:

- **Comunidad:** Event type/category is a dropdown (Fair, Festival, Food distribution, Church/community, etc.) — public drawer was text; **fixed**.
- **Clases:** Subject/type is a dropdown (English, Spanish, Zumba, Fitness, etc.) — public drawer was text; **fixed**.
- **Busco:** Request type is a dropdown — public drawer already select; **verified**.
- **Mascotas:** Notice type is a dropdown — public drawer already select; **verified**.
- **En Venta:** Department, subcategory, item type are selects in publish — item type filter was text; **fixed** to cascading select.

---

## 6. Application field inventory (primary categories)

### Comunidad

| Field | App control | Stored key | Public drawer (before) | Public drawer (after) |
|-------|-------------|------------|------------------------|----------------------|
| eventType / eventCategory | select (`COMUNIDAD_CATEGORY_OPTIONS`) | `Leonix:eventCategory` | text input | **select** |
| eventCost | select (gratis/pagado/donacion/noConfirmado) | `Leonix:eventCost` | select | select (unchanged) |
| dateFrom/dateTo | date | `Leonix:eventDate` | date | date (unchanged) |
| audience | select | `Leonix:audience` | select | select (unchanged) |
| registration | select | `Leonix:registrationRequired` | select | select (unchanged) |
| accessibility | multi-checkbox | `Leonix:accessibility` | select (single) | select (unchanged; filters one key) |

### Clases

| Field | App control | Stored key | Public drawer (before) | Public drawer (after) |
|-------|-------------|------------|------------------------|----------------------|
| classType / classCategory | select (`CLASES_CATEGORY_OPTIONS`) | `Leonix:classCategory` | text input | **select** |
| cost | select | `Leonix:classCostType` | select | select (unchanged) |
| mode | select | `Leonix:mode` | select | select (unchanged) |
| level | select | `Leonix:skillLevel` | select | select (unchanged) |
| audience | select | `Leonix:audience` | select | select (unchanged) |
| registration | select | `Leonix:registrationRequired` | select | select (unchanged) |

### Busco

| Field | App control | Public drawer | Status |
|-------|-------------|---------------|--------|
| tipo | select (`BUSCO_TYPE_OPTIONS`) | select | OK |
| zone | text | text | OK |
| budget | text | text | OK |
| contact | inferred filter (phone/email/any) | select | OK (filter semantics, not publish field) |

### Mascotas

| Field | App control | Public drawer | Status |
|-------|-------------|---------------|--------|
| tipo | select (`MASCOTAS_PERDIDOS_NOTICE_OPTIONS`) | select | OK |
| lastSeenArea | text | text | OK |
| hasPhoto | checkbox (filter) | checkbox | OK |

### En Venta

| Field | App control | Public drawer (before) | Public drawer (after) |
|-------|-------------|------------------------|----------------------|
| evDept | select | select | select (unchanged) |
| evSub | select | select | select (unchanged) |
| itemType | select (`getItemTypesForSelection`) | text input | **cascading select** |
| cond | select | select | select (unchanged) |
| priceMin/Max | number | number | number (unchanged) |
| free/nego/pickup/ship/delivery/meetup | checkboxes | toggles | toggles (unchanged) |
| seller | select | select | select (unchanged) |
| hasPhoto/hasVideo/featured | checkboxes | toggles | toggles (unchanged) |

**Deferred (not exposed as fake filters):** brand, model, quantity as separate browse facets.

---

## 7. Fixes applied by category

### Comunidad
- `eventType` → select from `COMUNIDAD_CATEGORY_OPTIONS` (landing + results share `ComunidadClasesDrawerFields`).
- Results filter: exact slug match on `Leonix:eventCategory` with legacy text fallback.
- Chips: readable taxonomy labels + improved eventCost labels.

### Clases
- `classType` → select from `CLASES_CATEGORY_OPTIONS`.
- Results filter: exact slug match on `Leonix:classCategory` with legacy text fallback.
- Chips: readable taxonomy labels.

### Busco
- Verified — no code changes required.

### Mascotas
- Verified — no code changes required.

### En Venta
- New `EnVentaItemTypeFilterSelect` using `getItemTypesForSelection(dept, sub)`.
- Landing drawer + results drawer aligned; clears itemType when dept/sub changes.
- Active chip uses `getArticuloLabel` when dept known.

---

## 8. City/state/ZIP/country consistency

All five primary categories use `CategoryStandardLandingSearchPanel` / `CategoryStandardCompactSearchBar` with:
- `sanitizeLocationParamsForUrl` — CA / United States display-only unless touched or explicit in URL.
- `activeFilterParamsFromUrl` — chips omit default location.
- En Venta uses parallel `sanitizeEnVentaLocationForUrl` from prior patch.

NorCal city datalist: En Venta compact canvas has datalist; community-simple uses standard compact bar (city text). Documented as acceptable — both typeable; En Venta has optional presets.

---

## 9. Active chips / clear / apply

- Landing Apply → `buildCommunitySimpleResultsHref` / `buildEnVentaBrowseHref` with cleaned params.
- Results Apply → same URL contract via compact search bar navigate.
- Chips built from URL-only active params + taxonomy labels.
- Clear preserves `lang` only.
- Chip remove preserves other filters.

---

## 10. Secondary category notes (inspection only)

| Category | Mismatch likely? | Highest priority field | Next batch |
|----------|------------------|------------------------|------------|
| Servicios | Yes | Trade/group filters vs publish taxonomy | Dedicated Servicios parity pass |
| Rentas | Partial | Many numeric text fields OK; verify property-type selects | Rentas drawer audit |
| Bienes Raíces | Yes | Listing-type / agent fields vs browse drawer | Bienes parity pass |
| Empleos | Yes | Job type / schedule selects | Empleos parity pass |
| Autos | Partial | Make/model/year likely need taxonomy selects | Autos browse parity |
| Dealers de Autos | Partial | Dealer inventory filters vs dashboard fields | Dealers parity pass |

No secondary category files modified in this patch.

---

## 11. Mobile/PWA notes (code review @ 390px)

- Shared drawer shell: bottom sheet, scrollable body, fixed Apply/Clear footer.
- Selects use full-width `CAT_STD_FILTER_SELECT` / En Venta field classes.
- Chips wrap via `CategoryStandardActiveFilterChips`.
- No new horizontal overflow patterns introduced.

---

## 12. TRUE/FALSE final audit

| Check | Result |
|-------|--------|
| Application fields used as source of truth | TRUE |
| Comunidad event type changed from text to select | TRUE |
| Comunidad select options match application source | TRUE |
| Clases subject/type changed from text to select | TRUE |
| Clases select options match application source | TRUE |
| Busco request type verified against application source | TRUE |
| Mascotas notice type verified against application source | TRUE |
| En Venta drawer verified against application source | TRUE |
| Landing drawers match results drawers | TRUE |
| Results filters consume landing drawer params | TRUE |
| Active chips complete | TRUE |
| Clear works | TRUE |
| Apply works | TRUE |
| City/state/ZIP/country consistent | TRUE |
| No untouched default CA active filter | TRUE |
| No untouched default United States active filter | TRUE |
| No fake filters added | TRUE |
| No landing redesign | TRUE |
| No result card redesign | TRUE |
| Ofertas untouched | TRUE |
| Viajes untouched | TRUE |
| Admin/dashboard/auth/Supabase/Stripe untouched | TRUE |
| Build passed | TRUE |

---

## 13. Build

```
npm run build — exit 0 (2026-07-14)
```
