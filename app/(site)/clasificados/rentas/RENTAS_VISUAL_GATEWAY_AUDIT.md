# Rentas Visual Gateway Audit

Scoped gated build: `RENTAS-LANDING-INNER-STRUCTURE-REBUILD-V6`

## V6 inner structure rebuild

### Why V6 was needed

V5 (`data-rentas-gateway-scene="v5-visual-contract"`) deployed successfully but the landing still did not match the visual target because the **inner layout remained the old stacked structure**:

1. Hero text → separate search card → disconnected Publicar row → color-shift tile band
2. Each block rendered as its own module instead of one integrated gateway panel

### V6 changes

| Blocker (live DOM) | File | Action |
|---|---|---|
| `mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4` (disconnected Publicar row) | `RentasLandingHeroGateway.tsx` | **Removed** — Publicar moved into search action row |
| `border-t border-[#D6C7AD]/50 bg-[#FFFDF7]/55 backdrop-blur-[1px]` (tile band) | `RentasLandingIntentTiles.tsx` | **Removed** — transparent integrated tiles zone |
| Separate search form card | `RentasCompactSearchCanvas.tsx` | **Replaced** with hero search anchor inside gateway panel |
| `data-rentas-gateway-scene="v5-visual-contract"` | `RentasLandingSceneBand.tsx` | **Updated** to `v6-inner-structure` |

### V6 target structure

```
scene band (v6-inner-structure)
  integrated gateway panel (RENTAS_LANDING_GATEWAY_PANEL)
    hero text + tagline
    hero search anchor (fields + Buscar + Filtros + Ver todos + Publicar renta)
    intent tiles (transparent, gold accent line only)
```

### Scene marker

- **Exact marker:** `data-rentas-gateway-scene="v6-inner-structure"`
- **File:** `landing/RentasLandingSceneBand.tsx`
- **Method:** CSS-only inline SVG + gradients (unchanged from V5)

### Behavior preservation

- Buscar, Filtros, Ver todos, Publicar renta routes unchanged
- City/state/ZIP/country fields unchanged
- Tile links unchanged (`rentasLandingGateway.ts`)
- Results page untouched in V6

---

## Requirement checklist (V6)

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Disconnected Publicar row removed | TRUE | Grep no match for old class |
| Tile color-shift band removed | TRUE | Grep no match for old band classes |
| Scene marker v6-inner-structure | TRUE | `RentasLandingSceneBand.tsx` |
| Publicar integrated in search action row | TRUE | `RentasCompactSearchCanvas` publishHref prop |
| Tiles inside gateway panel | TRUE | `RentasLandingHub` tilesSlot |
| Search is hero anchor | TRUE | `RENTAS_LANDING_HERO_SEARCH_SHELL` |
| Results behavior untouched | TRUE | No results file changes |
| Build passed | TRUE | `npm run build` exit 0 (Gate 8) |
