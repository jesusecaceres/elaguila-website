# Final Polish Gate — Varios Ubicación Visual Card

## Files inspected

- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx` — Varios contact card Ubicación section (preview + public detail)
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx` — uses `EnVentaBuyerPanel`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` — uses `EnVentaBuyerPanel`
- `app/(site)/servicios/components/ServiciosBusinessHubFauxMap.tsx` — read-only visual reference

## Files changed

- `app/(site)/clasificados/en-venta/shared/components/EnVentaLocationFauxMap.tsx` — **new** CSS/SVG decorative map
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx` — insert faux map in Ubicación block
- `app/lib/clasificados/en-venta/VARIOS_LOCATION_VISUAL_POLISH_AUDIT.md` — this audit

## Visual added

Compact decorative map panel inside Ubicación:

- Dark brown/cream gradient background with gold grid lines
- Subtle road strokes and city-block rectangles
- Burgundy pin with gold accent dot centered
- Rounded rectangle, gold border, soft shadow
- `aspect-[2/1]`, `max-h-[7.5rem]`, full width of contact card
- No external map API, no image asset, `aria-hidden` decorative only

Placement:

```
UBICACIÓN
[pin + address text]
[seller location note]
[EnVentaLocationFauxMap]
[Abrir mapa button]
```

## Scope confirmation

- Hero, media/gallery, video, draft, publish, success confirmation, contact logic, results/landing — **not modified**
- Servicios — read-only reference only

## Mobile

- `w-full max-w-full overflow-hidden` — no horizontal overflow
- Map capped at 7.5rem height; button unchanged min-h 40px

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Varios Ubicación card was inspected | TRUE | `EnVentaBuyerPanel.tsx` |
| Decorative location visual was added | TRUE | `EnVentaLocationFauxMap.tsx` |
| Existing address text preserved | TRUE | `locationLine` + note unchanged |
| Existing Abrir mapa button preserved | TRUE | Same button block after map |
| No external image asset added | TRUE | CSS/SVG only |
| No map API added | TRUE | No fetch/API calls |
| No media/gallery files changed | TRUE | No gallery edits |
| No publish/draft files changed | TRUE | No publish/draft edits |
| No landing/results files changed | TRUE | No results edits |
| Mobile responsive check completed | TRUE | max-w-full, max-height cap |
| npm run build passed | TRUE | See validation output |
