# CATEGORY-STANDARD-V2-RESULTS-SHELL-CLEANUP-SELECTED-CATEGORIES-V1

**Project:** Leonix Media / elaguila-website  
**Date:** 2026-07-10  
**Scope:** Results pages only — 11 selected categories (Ofertas + Viajes excluded)

---

## 1. Executive summary

Polish pass removed landing-style clutter from selected Clasificados results workspaces while preserving search shells, active filters, real listing cards, query params, sort/view controls, and Autos/Dealers market logic.

**Community simple (A):** Clases, Comunidad, Busco, Mascotas — already matched target; no edits.

**Core market (B):** Servicios, Rentas, Bienes Raíces, En Venta, Empleos — removed destacados/sponsor/visibility/featured/promoted section splits, compacted gateway panels, simplified empty states.

**Autos/Dealers (C):** Removed quick-filter chip row, featured band, and recent horizontal lane; unified inventory into single results grid (sort order preserved via `sorted`).

**Skipped (D):** Ofertas, Viajes — untouched per gate.

`npm run build` passed after scoped changes.

---

## 2. Files inspected

- All `results/` and `resultados/` route files for 11 target categories
- `servicios/ServiciosResultsPageShell.tsx`, `servicios/resultados/page.tsx`
- `rentas/results/RentasResultsClient.tsx`, `rentas/results/components/*`
- `bienes-raices/resultados/BienesRaicesResultsClient.tsx`, gateway/active-filters components
- `en-venta/results/EnVentaResultsClient.tsx`, `EnVentaResultsListingSections.tsx`, `EnVentaResultsEmpty.tsx`
- `empleos/components/EmpleosResultsView.tsx`
- `autos/components/public/AutosPublicResultsShell.tsx`
- `community/CommunityListingsResultsClient.tsx`
- `busco/BuscoResultsClient.tsx`, `mascotas-y-perdidos/MascotasPerdidosResultsClient.tsx`

---

## 3. Files changed

| File | Change |
|------|--------|
| `servicios/resultados/page.tsx` | Removed `ServiciosDestacadosSection`; compact empty state |
| `rentas/results/RentasResultsClient.tsx` | `layout="results"` search; removed visibility footer |
| `rentas/results/components/RentasResultsGatewayPanel.tsx` | Compact results gateway (no landing copy/publish) |
| `bienes-raices/resultados/BienesRaicesResultsClient.tsx` | Removed sponsors lane + visibility footer; `layout="results"` |
| `bienes-raices/resultados/components/BienesRaicesResultsGatewayPanel.tsx` | Compact results gateway |
| `en-venta/results/EnVentaResultsClient.tsx` | Removed visibility footer + back-to-landing strip |
| `en-venta/results/components/EnVentaResultsListingSections.tsx` | Single unified results grid (promoted merged) |
| `en-venta/results/EnVentaResultsEmpty.tsx` | Removed publish CTA from empty state |
| `empleos/components/EmpleosResultsView.tsx` | Removed featured strip + adjacent-category pills; single job list |
| `autos/components/public/AutosPublicResultsShell.tsx` | Removed quick chips, featured/recent lanes; unified grid |

---

## 4. Route ownership table

| Category | Canonical | Primary component | `/results` alias |
|----------|-----------|-------------------|------------------|
| Servicios | `/resultados` | `servicios/resultados/page.tsx` → `ServiciosResultsPageShell` | re-exports |
| Rentas | `/results` | `rentas/results/page.tsx` → `RentasResultsClient` | no `/resultados` |
| Bienes Raíces | `/resultados` | `BienesRaicesResultsClient` | re-exports |
| En Venta | `/results` | `EnVentaResultsClient` | no `/resultados` |
| Empleos | `/resultados` | `EmpleosResultsView` | re-exports |
| Autos | `/resultados` | `AutosPublicResultsShell market="private"` | re-exports |
| Dealers | `/results` | `AutosPublicResultsShell market="dealer"` | no `/resultados` |
| Clases | `/resultados` | `CommunityListingsResultsClient` | re-exports |
| Comunidad | `/resultados` | `CommunityListingsResultsClient` | re-exports |
| Busco | `/resultados` | `BuscoResultsClient` | re-exports |
| Mascotas | `/resultados` | `MascotasPerdidosResultsClient` | re-exports |

---

## 5. Category risk bucket table

| Bucket | Categories | Action |
|--------|------------|--------|
| A Community simple | Clases, Comunidad, Busco, Mascotas | Preserved — already clean |
| B Core market | Servicios, Rentas, Bienes, En Venta, Empleos | Clutter removed |
| C Autos/Dealers | Autos, Dealers | Safe shell cleanup only |
| D Skip | Ofertas, Viajes | No edits |

---

## 6. Landing clutter removed by category

| Category | Removed |
|----------|---------|
| Servicios | Destacados/patrocinados section; giant empty CTAs (back to landing, explore categories) |
| Rentas | Full landing gateway copy + publish CTA; `RentasLandingVisibilityStrip`; search `layout="landing"` |
| Bienes Raíces | Sponsors lane; visibility CTA footer; landing gateway copy + publish |
| En Venta | Promoted section header split; visibility footer; back-to-landing link; empty publish CTA |
| Empleos | Featured/promoted strip section; low-results adjacent category shortcut pills |
| Autos/Dealers | `AutosPublicResultsQuickChips`; featured dealer band; recent horizontal lane; duplicate section headings |
| Clases/Comunidad/Busco/Mascotas | None needed |

---

## 7. Preserved behavior by category

- Search/filter shells and Filtros drawers
- Active filter chips (when filters applied)
- Result counts and sort/view/pagination
- Real listing cards and card-level CTAs
- Query param contracts and data fetches
- Autos `market="private"` / `market="dealer"` routing and filter serialization
- Empleos job application CTAs inside cards
- Servicios horizontal result cards (all matches in one list, sort order unchanged)

---

## 8. Mobile/PWA notes (code review)

- Gateway panels reduced to compact title + count (less vertical scroll)
- Autos quick-chip horizontal scroll row removed (overflow risk reduced)
- En Venta single grid avoids stacked promoted + catalog sections
- Search shells retain `grid-cols-1` mobile stacking patterns
- Active filter chips retain `flex-wrap` / snap scroll where present

---

## 9. Skipped categories

- **Ofertas Locales** — excluded by owner gate
- **Viajes** — excluded by owner gate
- **All landing pages** — not edited

---

## 10. TRUE/FALSE final audit

| Check | Result |
|-------|--------|
| Results pages only touched | TRUE |
| Landing pages untouched | TRUE |
| Ofertas untouched | TRUE |
| Viajes untouched | TRUE |
| Publish flows untouched | TRUE |
| Admin/dashboard/auth/Supabase/Stripe untouched | TRUE |
| Community simple pages preserved if already clean | TRUE |
| Search shells preserved | TRUE |
| Active filters preserved | TRUE |
| Real listing cards preserved | TRUE |
| Card-level CTAs preserved | TRUE |
| No landing discovery blocks remain in selected results | TRUE |
| No extra non-active pill rows remain between search and results | TRUE |
| No duplicate publish CTA clutter remains in selected results | TRUE |
| Autos/Dealers market logic preserved | TRUE |
| Mobile no horizontal overflow by code review | TRUE |
| npm run build passed | TRUE |

---

*End of audit*
