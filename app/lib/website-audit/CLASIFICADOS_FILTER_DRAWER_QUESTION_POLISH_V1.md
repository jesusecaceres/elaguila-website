# CLASIFICADOS — Filter Drawer Question Polish V1

**Task:** `CLASIFICADOS-FILTER-DRAWER-QUESTION-POLISH-V1`  
**Date:** 2026-07-06  
**Scope:** Filter drawer/open filter views only — no landing redesign, no performance routing.

---

## 1. Task classification

- **Classification:** SCOPED GATED BUILD — FILTER DRAWER PRODUCT POLISH
- **Why:** User-approved landing/results direction; open filter drawer (especially Bienes Raíces) was cramped, poorly grouped, and failed the “tell me exactly what you need” product test.

---

## 2. Filter drawer question standard

The open filter view must answer: **“Tell me exactly what you need.”**

### Question groups (when filters exist)

1. **What are you searching for?** — keyword, title, category/type/subtype  
2. **Where?** — city, state, ZIP, country, zone/radius (if real)  
3. **What kind/type?** — category-specific type, branch, operation, job type, cuisine, etc.  
4. **What budget/range?** — price/rent/salary min/max, deposit, free/paid  
5. **What features/needs?** — beds/baths, pets, furnished, pool, delivery, remote, etc.  
6. **Who is posting?** — private/business/dealer/agency (if real)  
7. **How should results be ordered?** — sort/view/page (if real)

### Visual standard

- No cramped 5–6 column grids inside drawer width (~440px desktop)  
- 1 column on mobile/drawer; 2 columns only for safe pairs (min/max, beds/baths)  
- Labels must not wrap awkwardly; helper copy spans full width, short lines  
- Checkbox filters as tappable chips in flex-wrap rows  
- Clear section headings; sticky Apply/Clear at bottom  
- No fake filters

---

## 3. Files inspected

**Shared drawer:** `CategoryStandardFiltersDrawerShell.tsx`, `categoryStandardStyles.ts`, `CategoryStandardResultsFilterPanel.tsx`, `CategoryStandardResultsChrome.tsx`

**Bienes Raíces:** `BienesRaicesResultsFilters.tsx`, `BienesRaicesResultsFilterDrawer.tsx`, `bienesRaicesResultsCopy.ts`, `brResultsUrlState.ts`

**Rentas:** `RentasFiltersDrawer.tsx` (already question-grouped)

**En Venta:** `EnVentaResultsFiltersDrawer.tsx`

**Servicios:** `ServiciosResultsFilters.tsx`, `ServiciosResultsAdvancedFilterFields.tsx` (already grouped shells)

**Restaurantes:** `RestauranteResultsClient.tsx`, filter files via glob

**Empleos:** `EmpleosBrowseDrawerFields.tsx`, `EmpleosResultsView.tsx`

**Autos:** `AutosPublicFilterRail.tsx`

**Viajes:** `ViajesResultsFilterRail.tsx`, `ViajesResultsShell.tsx`

**Low-risk:** `CommunityListingsResultsClient.tsx`, `BuscoResultsClient.tsx`, `MascotasPerdidosResultsClient.tsx`

---

## 4. Files changed

| File | Reason |
|------|--------|
| `bienes-raices/.../BienesRaicesResultsFilters.tsx` | Full question-based drawer layout; chip amenities |
| `bienes-raices/.../bienesRaicesResultsCopy.ts` | Section headings + shortened amenity hint |
| `bienes-raices/.../BienesRaicesResultsFilterDrawer.tsx` | Wider drawer (440px) |
| `categoryStandard/CategoryStandardFiltersDrawerShell.tsx` | 440px width; section spacing |
| `categoryStandard/categoryStandardStyles.ts` | Shared section heading, chip, helper tokens |
| `rentas/components/RentasFiltersDrawer.tsx` | Drawer width 440px (alignment) |
| `en-venta/.../EnVentaResultsFiltersDrawer.tsx` | Question headings; chip checkboxes; dedupe sections |
| `empleos/.../EmpleosBrowseDrawerFields.tsx` | Question headings; chip toggles |

---

## 5. Category filter question map

| Category | Drawer question | Groups used | Filters verified real |
|----------|-----------------|-------------|----------------------|
| bienes-raices | ¿Qué propiedad necesitas? | Qué buscas / Dónde / Presupuesto / Tamaño / Necesidades / Quién publica | YES — all map to `brResultsUrlState` |
| rentas | ¿Qué renta exacta necesitas? | Tipo / Presupuesto / Dónde / Para quién / Espacio / Condiciones / Quién publica | YES — existing query keys |
| en-venta | ¿Qué compras o buscas? | Artículo / Dónde / Presupuesto / Condición / Vendedor+entrega / Medios / Orden | YES — form fields unchanged |
| servicios | ¿Qué servicio y dónde? | Ubicación / Categoría / Contacto / Confianza (advanced) | YES — wired in `serviciosResultsFilter` |
| restaurantes | ¿Qué antojo y dónde? | Inline rail + mobile drawer | YES — audited, no fake open-now |
| empleos | ¿Qué trabajo buscas? | Dónde / Qué trabajo / Modalidad / Salario / Experiencia / Confianza | YES — drawer values → URL |
| autos | ¿Qué vehículo? | Filter rail groups (make/price/seller) | YES — `autosBrowseFilterContract` |
| viajes | ¿A dónde y qué viaje? | Destination / origin / type / budget | YES — `ViajesResultsFilterRail` |
| clases | ¿Qué quieres aprender? | CAT-STD inline panel (q, city, type) | YES |
| comunidad | ¿Qué pasa cerca? | CAT-STD inline panel | YES |
| busco | ¿Qué buscas o pides? | CAT-STD inline panel | YES |
| mascotas | ¿Qué hay que encontrar? | City + tipo chips + q | YES |

---

## 6. Drawer polish table

| Category | Filter view exists | Grouped by question | Alignment fixed | Helper copy safe | Mobile safe | Status |
|----------|-------------------|---------------------|-----------------|------------------|-------------|--------|
| bienes-raices | YES drawer | YES — rebuilt | YES | YES — short hint | YES | **Fixed** |
| rentas | YES drawer | YES — pre-existing | OK | OK | YES | OK + width |
| en-venta | YES drawer | YES — improved | YES | N/A | YES | **Polished** |
| servicios | YES drawer | YES — GroupShell | OK | OK | YES | OK — deferred deep restyle |
| restaurantes | YES panel | Partial | OK | OK | YES | OK — audited |
| empleos | YES drawer | YES — improved | YES | OK | YES | **Polished** |
| autos | YES rail | YES | OK | OK | YES | OK — audited |
| viajes | YES rail/mobile | YES | OK | OK | YES | OK — audited |
| clases/comunidad/busco/mascotas | YES inline | CAT-STD panel | OK | OK | YES | OK — audited |

---

## 7. Filter truth table (sample)

| Category | Visible filter | Query key | Real | Action |
|----------|----------------|-----------|------|--------|
| bienes-raices | Mascotas | `pets=true` | TRUE | Kept — chip |
| bienes-raices | Amueblado | `furnished=true` | TRUE | Kept — chip |
| bienes-raices | Piscina | `pool=true` | TRUE | Kept — chip |
| servicios | Open now | `openNow=1` | TRUE (if hours data) | Kept — not fake |
| en-venta | Autos dept | — | N/A | Not in En Venta taxonomy |

---

## 8. Active chip/result connection

| Category | Apply updates URL | Active chip/summary | Clear works | Results update | Status |
|----------|-------------------|---------------------|-------------|----------------|--------|
| bienes-raices | YES — `onPatch` unchanged | YES — `BienesRaicesResultsActiveFilters` | YES | YES | OK |
| rentas | YES — drawer apply | YES — `RentasResultsActiveFilters` | YES | YES | OK |
| en-venta | YES — form submit | YES — client chips | YES | YES | OK |
| empleos | YES — drawer apply | YES | YES | YES | OK |

---

## 9. Mobile drawer check

- Drawer width 440px desktop; full-width bottom sheet mobile  
- No horizontal overflow on filter grids (1-col default in drawer)  
- Bottom Apply/Clear sticky in all drawer shells  
- Chips min-height 2.5rem — thumb-friendly  

---

## 10. Remaining blockers

- **Servicios / Restaurantes:** Advanced filter field count is high; grouped but not fully re-chipped (safe deferral — already usable).  
- **Autos / Viajes:** Desktop filter rail (not drawer) — acceptable; mobile drawers audited.  

No blockers for manual filter QA on primary fixed categories.

---

## 11. Build validation

Run `npm run build` — see final report.
