# Emergency Gate R12 — Replace Old En Venta Published Detail Shell

## Public route

- File: `app/(site)/clasificados/anuncio/[id]/page.tsx`
- URL: `/clasificados/anuncio/[id]?lang=es`

## Shell trace

| Shell | File / component | Notes |
| --- | --- | --- |
| **OLD (legacy)** | Same `page.tsx` fallback at `max-w-screen-2xl` + gray `bg-[#D9D9D9]` + `max-h-[360px]` media | Used when `useEnVentaPublishedDetail` is false |
| **Approved preview** | `EnVentaPreviewPage` → `EnVentaPreviewGallery` + `EnVentaBuyerPanel` + `EnVentaDetailContentStack` in `listingCanvas` | Draft/session data |
| **Approved public (target)** | `EnVentaAnuncioLayout` (`surface="en-venta"`) → same gallery/buyer/stack components | Published row + `publishedSourceRow` |

## Root cause

1. Public route only branched on `listing.category === "en-venta"`. Mis-labeled or alternate category values routed to the **legacy generic anuncio shell** (tiny gray layout).
2. **SALE-** Leonix Ad IDs and `Leonix:evDept` / `Leonix:plan` machine pairs were not used as En Venta signals on the public route.

## Fix

- `enVentaAnuncioRoute.ts` — `shouldUseEnVentaPublishedDetailShell()` (category, SALE id, machine pairs, raw row).
- `page.tsx` — `useEnVentaPublishedDetail` gates `EnVentaAnuncioLayout` before legacy shell; map row forces `en-venta` when signals match.
- `EnVentaAnuncioLayout` — preview-equivalent viewport padding (`py-6 lg:pt-24`).

## Landing/results

Already use `normalizeEnVentaCardMedia` + `row` (R10/R11). No layout change in R12.

## Manual QA

See gate final output. Test ad: SALE-2026-000076 (not hardcoded in code).
