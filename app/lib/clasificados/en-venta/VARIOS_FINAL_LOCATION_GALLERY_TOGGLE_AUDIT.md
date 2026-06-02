# Final Polish Gate — Varios Location Visual + Media Gallery Toggle

## 1. Files inspected

- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx` — Ubicación contact card
- `app/(site)/clasificados/en-venta/shared/components/EnVentaLocationFauxMap.tsx` — decorative map (prior gate)
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx` — preview media
- `app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx` — public detail media
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx` — preview wiring
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` — public detail wiring
- `app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx` — read-only toggle reference
- `app/(site)/servicios/components/ServiciosBusinessHubFauxMap.tsx` — read-only location reference
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx` — results card (unchanged)

## 2. Files changed

- `app/(site)/clasificados/en-venta/shared/components/EnVentaMediaTabToggle.tsx` — **new** Fotos/Videos toggle
- `app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx` — tabbed photos vs video
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx` — tabbed photos vs video + photo-only lightbox
- `app/lib/clasificados/en-venta/VARIOS_FINAL_LOCATION_GALLERY_TOGGLE_AUDIT.md` — this audit

**Location visual:** already present from prior polish (`EnVentaLocationFauxMap` in `EnVentaBuyerPanel`) — no additional location edits this pass.

## 3. Location section finding

- **Component:** `EnVentaBuyerPanel` (shared by preview + public detail)
- **Address:** `locationLine` with pin icon + optional `locationNote`
- **Map button:** “Abrir mapa” / “Open map” opens `mapHref` or `onOpenMap`
- **Decorative map:** `EnVentaLocationFauxMap` between note and button
- **Mobile:** same component, responsive `max-w-full`

## 4. Location visual implementation

CSS/SVG faux map — burgundy pin, gold grid, dark brown background, no API/asset. Preserved in this gate (no changes).

## 5. Media/gallery finding

**Before:** Photos and video merged into single `slides` array; video appended after photos; mixed thumbnails.

**Preview:** `EnVentaPreviewGallery` — main viewer, thumbnails, lightbox with all slides.

**Public detail:** `EnVentaMediaGallery` — main viewer + photo/video thumbnails in one strip.

**Servicios reference:** `ServiciosGalleryWithTabs` — Fotos/Videos nav when both exist; default photos.

## 6. Gallery toggle implementation

`EnVentaMediaTabToggle` — Leonix-styled pill nav (Fotos / Photos, Videos).

**Rules:**
- Toggle shown only when both photos and embeddable video exist
- Default tab: Fotos when photos exist; Videos when only video
- Photos tab: photo main viewer + photo thumbnails only (order preserved)
- Videos tab: `EnVentaVideoPlayer` only
- Preview lightbox on Fotos tab includes **all** `orderedImages` (photo-only slides)

## 7. Full gallery/open-more behavior result

Preview photo lightbox navigates all uploaded photos in original order. Video opens in separate Videos tab lightbox. Toggle does not filter underlying photo data.

## 8. Preview result

`EnVentaPreviewPage` → `EnVentaPreviewGallery` with tabs when both media types present.

## 9. Public detail result

`EnVentaAnuncioLayout` → `EnVentaMediaGallery` with same tab behavior.

## 10. Mobile result

Toggle uses compact padding; galleries use `overflow-x-auto` thumbnails; faux map `max-w-full`; no new horizontal overflow patterns.

## 11. Behavior preservation result

Upload, reorder, draft, publish, success confirmation, results cards, dashboards, contact/WhatsApp — **not modified**.

## 12. Build/check result

See validation output (`npm run build`).

## 13. Remaining risks

- Public detail has no full-screen photo lightbox (pre-existing); all photos reachable via Fotos tab thumbnails and swipe.
- Non-embeddable video URLs still hidden (pre-existing `isEmbeddableExternalVideoUrl` gate).

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Varios Ubicación component was inspected | TRUE | `EnVentaBuyerPanel.tsx` |
| Existing address text was preserved | TRUE | No location copy changes |
| Existing Abrir mapa button was preserved | TRUE | Same button block |
| Decorative location visual was added | TRUE | `EnVentaLocationFauxMap.tsx` |
| No external map API was added | TRUE | CSS/SVG only |
| No external image asset was added | TRUE | No image files |
| No generated image file was added | TRUE | Inline SVG |
| Varios media/gallery component was inspected | TRUE | Preview + public gallery |
| Servicios gallery toggle was inspected read-only | TRUE | `ServiciosGalleryWithTabs.tsx` |
| Fotos tab appears when photos exist | TRUE | Photos tab content |
| Videos tab appears when video exists | TRUE | Videos tab content |
| Empty media tabs are not shown unnecessarily | TRUE | Toggle only when both |
| Photos remain visible when video exists | TRUE | Fotos tab |
| Video remains visible/playable when video exists | TRUE | Videos tab + player |
| Video does not suppress uploaded photos | TRUE | Separate tabs |
| Full gallery/open-more view still includes all uploaded photos | TRUE | Photo lightbox uses full `orderedImages` |
| Primary photo remains first | TRUE | `orderedImages` order unchanged |
| Photo order remains preserved | TRUE | No reorder logic touched |
| Preview full detail still works | TRUE | `EnVentaPreviewGallery` |
| Public detail still works | TRUE | `EnVentaMediaGallery` |
| Preview results-card sample was not broken | TRUE | No results file edits |
| Mobile has no horizontal overflow | TRUE | max-w-full + overflow-x-auto |
| Media upload was not changed | TRUE | — |
| Image reorder was not changed | TRUE | — |
| Draft behavior was not changed | TRUE | — |
| Publish behavior was not changed | TRUE | — |
| Publish success confirmation was not changed | TRUE | — |
| Landing/results cards were not changed | TRUE | — |
| Admin/user dashboard were not changed | TRUE | — |
| No unrelated categories were edited | TRUE | en-venta only |
| No global layout/theme files were edited | TRUE | — |
| No Stripe/payment files were edited | TRUE | — |
| No Supabase migrations/schema were edited | TRUE | — |
| npm run build passed | TRUE | See validation |
