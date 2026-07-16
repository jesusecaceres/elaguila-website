# A5.POLISH-02 — Autos Negocios Unified Vehicle Preview Canvas Audit

## Gate title

A5.POLISH-02 — Autos Negocios Unified Vehicle Preview Canvas Surgical Patch

## Task classification

SCOPED SURGICAL POLISH PATCH

## Repo / branch / HEAD

- Repo: `elaguila-website`
- Branch: `main` (at patch time)
- Surgical composition patch only — no data/behavior changes

## Files changed

- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewEngagementStrip.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx` (wrapper/spacing only)
- Audit + verifier + `package.json` script

## Unified canvas result

One outer `data-autos-unified-vehicle-canvas` section (`MAIN_CARD`) contains:

1. **Header** — title left, price right; location + mileage/stock meta under title
2. **Specs strip** — `VehicleSpecsGrid` `variant="canvasStrip"` horizontal grid
3. **Gallery** — `GALERÍA` / `Gallery` label + `AutoGallery` `embeddedInCanvas`
4. **Utility row** — Like/Share left; compact highlights right

## Header result

- Large serif title (left)
- Location with map pin (under title)
- Price block (right on desktop, stacks on mobile)
- Mileage + stock meta line (no VIN in header; VIN remains in full specs section)
- Large condition chips removed from title area

## Specs strip result

- Single bordered horizontal grid (`data-autos-canvas-specs-strip`)
- Year, Make, Model, Trim, Transmission, Fuel, Drivetrain, Mileage, Body
- No pill/chip styling in canvas strip
- Full `VehicleSpecsGrid` (`variant="full"`) unchanged below canvas for extended specs

## Gallery preservation

- PHOTOS tab preserved
- VIDEO tab preserved
- VIEW ALL not reintroduced
- Photo/video modal and lightbox logic unchanged (`embeddedInCanvas` drops outer card only)

## Utility row result

- Like/Share in `data-autos-unified-canvas-utility` inside unified canvas
- Not floating between cards; not in dealer contact aside
- Compact highlights (`Destacados` / `Highlights`) in same utility area

## WhatsApp result

- Verified unchanged from A5.POLISH-01: `wa.me`, `target="_blank"`, `rel="noopener noreferrer"`
- Contact card not redesigned

## Top results preview card

**LOCKED / UNCHANGED**

## Mobile result

- Unified canvas uses responsive header stack, specs grid wrap (2→4→8 cols), utility row column stack

## Intentionally locked

- Autos Privado, media upload/hydration, dashboard, admin, Stripe, Supabase
- PHOTOS/VIDEO tab behavior, modal/lightbox, video embed helpers
- Dealer contact CTA behavior (except prior WhatsApp new-tab)
- Top results preview card
- Unrelated categories

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Main preview component found | TRUE |
| Unified outer canvas created | TRUE |
| Header inside unified canvas | TRUE |
| Specs strip inside unified canvas | TRUE |
| Gallery inside unified canvas | TRUE |
| Utility row inside unified canvas | TRUE |
| Large badges removed from title area | TRUE |
| Compact highlights moved below gallery | TRUE |
| Like/Share inside unified canvas | TRUE |
| Like/Share not floating | TRUE |
| Like/Share not in contact block | TRUE |
| PHOTOS tab preserved | TRUE |
| VIDEO tab preserved | TRUE |
| VIEW ALL not reintroduced | TRUE |
| Photo modal preserved | TRUE |
| Video modal preserved | TRUE |
| WhatsApp opens new tab/window | TRUE |
| Contact card not redesigned | TRUE |
| Top results card safe | TRUE |
| Mobile safe | TRUE |
| Autos Privado untouched | TRUE |
| Media upload untouched | TRUE |
| Dashboard untouched | TRUE |
| Admin untouched | TRUE |
| Stripe untouched | TRUE |
| Supabase untouched | TRUE |
| Unrelated categories untouched | TRUE |
| Build passed | TRUE |
| Ready for Chuy QA | TRUE |

## Final recommendation: GREEN
