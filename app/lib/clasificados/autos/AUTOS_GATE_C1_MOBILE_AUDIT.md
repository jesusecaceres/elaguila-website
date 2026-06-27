# AUTOS-GATE-C1-MOBILE Audit

## Files Inspected
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleHighlights.tsx`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx` (read-only)
- `app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx` (read-only)
- `app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx` (read-only)
- `app/components/cta/CtaActionSheet.tsx` (read-only)

## Files Changed
- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleHighlights.tsx`
- `app/lib/clasificados/autos/AUTOS_GATE_C1_MOBILE_AUDIT.md`
- `scripts/autos-gate-c1-mobile-audit.ts`
- `package.json`

## Desktop Preservation Result
Desktop remains the same or nearly the same. Specs and equipment still render full grids from the `sm` breakpoint upward. Gallery keeps its existing desktop layout and side thumbnail/video column at larger breakpoints.

## Mobile Pain Points Found
The largest mobile scroll contributors were full-height specs and equipment grids. Gallery already had a horizontal thumbnail row, and related dealer inventory already used a mobile snap shelf.

## Gallery Mobile Result
Mobile gallery padding is tighter and the main image uses a shorter mobile-only `16/9` aspect. The existing photo/video/view-all controls, lightbox, published video handling, and external video fallback remain unchanged.

## Specs Mobile Result
Mobile now shows the first six vehicle specs up front and places the remaining specs in a native disclosure labeled `Ver más especificaciones` / `View more specs`. All fields remain accessible. Desktop continues to show the full responsive grid.

## Equipment Mobile Result
Mobile now shows the first six equipment items up front and places the remaining items in a native disclosure labeled `Ver todo el equipo` / `View all equipment`. Desktop continues to show the full equipment grid.

## Dealer Contact Access Result
Contact remains easy to reach: on mobile both Negocios and Privado place the engagement/contact aside before specs/equipment. Existing CTA behavior remains routed through the locked Autos CTA sheet/link system.

## Related Inventory Carousel Result
Related inventory already uses mobile horizontal snap behavior through `autosRelatedInventoryShelfScrollClass` and `autosRelatedInventoryShelfCardShellClass`, with cards around `84vw` and the next card peeking. No change was needed.

## Sticky Action Result
Skipped intentionally. The existing live detail mobile order already places Like/Share and contact before specs/equipment, and adding a sticky CTA row would duplicate CTAs and risk covering content. Existing CTAs remain available and untouched.

## Privado Parity Result
Privado uses the same shared gallery, specs, equipment, and engagement row components, so it receives the same mobile compression. It keeps `PrivadoContactStrip` and does not receive dealer Business Hub, reviews, financing, dealer resources, or inventory.

## Risks / Deferred Work
- Native `<details>` disclosure styling is intentionally minimal to avoid a new design pattern.
- Sticky mobile action bar remains deferred unless QA proves contact is still hard to reach.

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Desktop was preserved | TRUE | Full specs/equipment grids remain active at `sm` and above; gallery desktop classes unchanged. |
| Mobile scroll burden was reduced | TRUE | Specs and equipment now show six items first, with remaining data collapsed. |
| Gallery is more compact on mobile | TRUE | Mobile gallery uses tighter padding and shorter `16/9` image aspect. |
| Specs are more compact on mobile | TRUE | `VehicleSpecsGrid` uses mobile primary rows plus disclosure. |
| Equipment is more compact on mobile | TRUE | `VehicleHighlights` uses mobile first six plus disclosure. |
| Contact/dealer actions remain easy to reach | TRUE | Engagement/contact aside remains before specs/equipment on mobile. |
| Existing CTA business-card behavior preserved | TRUE | Locked CTA files were not edited. |
| Like/share row preserved | TRUE | `AutosEngagementRow` unchanged and remains used by both live detail lanes. |
| Related inventory uses mobile carousel/snap behavior | TRUE | Existing related inventory token uses snap-x, `84vw` cards, and peeking shelf. |
| Privado received mobile parity | TRUE | Privado consumes the same compressed shared gallery/specs/equipment components. |
| Privado did not receive dealer Business Hub features | TRUE | `PrivadoContactStrip` remains the private seller surface; no dealer-only sections added. |
| No fake analytics added | TRUE | No analytics logic changed. |
| No publish logic changed | TRUE | No publish files or APIs changed. |
| No DB/schema changed | TRUE | No Supabase files changed. |
| No Stripe/payment changed | TRUE | No Stripe/payment files changed. |
| No unrelated categories changed | TRUE | Audit script checks diff paths. |
