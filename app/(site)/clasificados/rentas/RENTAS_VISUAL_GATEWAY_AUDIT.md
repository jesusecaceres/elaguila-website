# Rentas Visual Gateway Audit

Scoped gated build: `RENTAS-LANDING-RESULTS-SHELL-FINAL-STANDARD-V7`

## Product question model

| Surface | Question | User job |
|---|---|---|
| **Landing** | “What are you looking for?” | Start with space type, keyword, city/state/ZIP/country, budget bands, practical needs |
| **Results** | “Let me narrow it down and help you find the exact rental.” | Same base search shell + active filters + drawer + branch chips + sort/view + pagination |

**Filter rule:** Every visible filter must map to real Rentas query/application/listing fields. No fake filters, data, or analytics.

---

## V7 — Landing/results shell final standard

### What changed

| Area | Change |
|---|---|
| Results refine panel | `RENTAS_RESULTS_REFINE_PANEL` wraps title, search, active filters, branch chips, toolbar |
| Search shell carryover | `layout="results"` uses same `RENTAS_SHARED_SEARCH_ANCHOR` as landing |
| Toolbar | Integrated inside refine panel (`integrated` prop) |
| Filter drawer | Question-oriented group labels + results intro copy |
| Landing | **No redesign** — V6 integrated gateway preserved |

### Results structure (V7)

```
RentasResultsTopBar (breadcrumb)
RENTAS_RESULTS_REFINE_PANEL
  title + count + Publicar renta
  “Afina tu búsqueda” eyebrow
  RentasCompactSearchCanvas layout="results"
  RentasResultsActiveFilters
  branch chips (Todas / Privado / Negocio)
  divider
  RentasResultsToolbar (sort + view + count)
listings + bottom pagination
visibility strip footer
```

### Landing structure (unchanged V6)

```
scene band (v6-inner-structure)
  integrated gateway panel
    hero + search (layout="landing") + tiles
budget/practical shortcuts
visibility strip
```

---

## Rentas shell standard for replication

Use this pattern when building other Clasificados categories:

- **Landing** asks broad intent questions (“What are you looking for?”)
- **Results** carries the same search shell and narrows with the drawer (“Let me narrow it down…”)
- **CTAs** keep Leonix burgundy / gold / cream language
- **Category-specific filters** live in the drawer
- **Top tools** include active filters, branch/type chips, sort, view toggle
- **Pagination** remains at the bottom
- **Every filter** must map to application/listing fields
- **No fake filters, data, or analytics**

---

## Prior passes (reference)

### V6 inner structure

- Removed disconnected Publicar row and tile color-shift band
- Scene marker: `data-rentas-gateway-scene="v6-inner-structure"`
- Publicar integrated into landing search action row

### V5 visual contract

- CSS-only scene; left/right image contract mapping
- No fake listing data from design target

---

## V7 requirement checklist

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Landing search shell clean | TRUE | V6 gateway unchanged |
| Results carries landing shell language | TRUE | `RENTAS_SHARED_SEARCH_ANCHOR` + `layout="results"` |
| Real listings preserved | TRUE | `useRentasPublicBrowseInventory` unchanged |
| No fake filters | TRUE | Drawer + gateway wired to contract keys |
| Filter drawer question groups | TRUE | Updated GroupLabel copy |
| Pagination bottom | TRUE | `RentasResultsClient` nav unchanged |
| Build passed | TRUE | `npm run build` exit 0 (Gate 9) |
