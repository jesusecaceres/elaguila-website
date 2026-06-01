# Emergency Gate R2 — Restore Varios Stacked Detail Layout + Visible Media

## 1. Current bad state summary

After Gate P4-F (`fc97c454`), Varios public detail and preview used `EnVentaDetailPageLayout` with a disconnected xl grid: gallery, hero, contact, and lower cards were scattered; desktop felt tiny and media appeared missing. Gate R1 (`3dcffeee`) reverted P4-F files but QA still reported:

- Preview page constrained to `max-w-5xl` with a fragmented 5+4+3 grid (gallery squeezed to five columns, contact in a narrow sticky sidebar, content stack in nine columns beside rail).
- Public detail lower section used `lg:col-span-8` beside `EnVentaRelatedRail` in `col-span-4`, squeezing stacked information cards (description, facts, condition, accessories, technical, delivery).

## 2. Last good stacked layout commit identified

**`c01156c2`** — Gate P4-C: Varios Preview Results Sample + Detail/Results Final Polish

This checkpoint has:

- `EnVentaDetailContentStack` with separate cards for description, item facts, condition/use, accessories, technical, delivery
- Public detail top grid `lg:col-span-7` gallery + `lg:col-span-5` hero/contact stack
- P4-C preview results-card sample
- Leonix brand tokens (P4-B)
- No `EnVentaDetailPageLayout`

## 3. Bad layout regression commit identified

**`fc97c454`** — Gate P4-F: Desktop detail layout repair

Introduced `EnVentaDetailPageLayout.tsx`, `detailPageMax` token, and replaced working grids in `EnVentaAnuncioLayout.tsx` and `EnVentaPreviewPage.tsx`.

## 4. Files inspected

- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaDetailContentStack.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx`
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewResultsCardSample.tsx`
- `app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts`
- `app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/anuncio/[id]/page.tsx`
- Git history: `c01156c2`, `4124b2dc`, `fc97c454`, `3dcffeee`

## 5. Files restored/changed

| File | Action | Reason |
|---|---|---|
| `listing/EnVentaAnuncioLayout.tsx` | **Edited (R2 stabilize)** | Varios (`en-venta`) lower section: full-width `EnVentaDetailContentStack` + related rail below instead of 8+4 squeeze |
| `preview/EnVentaPreviewPage.tsx` | **Edited (R2 stabilize)** | Align preview with public detail: `max-w-6xl`, gallery `col-span-7`, hero+contact stacked `col-span-5`, content stack full `col-span-12` |

R1 (`3dcffeee`) had already restored P4-F regressions via checkout from `4124b2dc` for layout files and deleted `EnVentaDetailPageLayout.tsx`.

## 6. Files intentionally preserved

- V-L1 visibility: `fetchEnVentaPublicListingsForBrowse.ts`, `EnVentaHubRecentListings.tsx`, `enVentaListingPublicSelect.ts`, `enVentaPublishFromDraft.ts`
- P4-C: `EnVentaPreviewResultsCardSample.tsx`, `buildEnVentaResultsCardModel.ts`, `EnVentaResultListingCard.tsx`
- P4-B brand tokens in `enVentaBrand.ts` (no `detailPageMax`)
- `EnVentaDetailContentStack.tsx` — unchanged stacked card architecture
- Publish flow, terms/checkbox, Leonix Ad ID, save/share/report engagement
- Media URL mapping (`urls={images}`, `orderedImages` from draft)

## 7. Exact restore strategy used

1. **Checkpoint identification:** `c01156c2` = last good stacked layout; `fc97c454` = bad P4-F regression (reverted in R1).
2. **No branch reset / no force push / no full commit revert.**
3. **R2 targeted stabilize** (not a new wrapper): mirror approved public-detail composition in preview and give Varios public detail full-width stacked cards below the hero row.

## 8. Media/gallery result

- Public detail: `EnVentaMediaGallery` in `lg:col-span-7` with `galleryFrame`, `urls={listing.images ?? []}`, thumbnails when multiple slides
- Preview: `EnVentaPreviewGallery` in `lg:col-span-7` (widened from five columns), same draft image/video model
- Video embed via `EnVentaVideoPlayer` when URL is embeddable

## 9. Results/landing card image result

Unchanged by R2. `EnVentaResultListingCard` renders `<img src={model.heroImage}>` when URL exists; hub recent listings use V-L1 fetch. Placeholder only when no image.

## 10. Stacked information layout result

`EnVentaDetailContentStack` renders vertically stacked cards:

1. Description
2. Item facts grid
3. Condition/use + accessories (side-by-side when both present)
4. Technical details
5. Delivery/Entrega with full notes in delivery card

R2 change: public Varios detail uses **full container width** for this stack; related listings rail moves below the stack instead of beside it.

## 11. Publish/visibility preservation result

No edits to `enVentaPublishFromDraft.ts`, `fetchEnVentaPublicListingsForBrowse.ts`, publish forms, terms, or Leonix Ad ID wiring.

## 12. Build/check result

See gate validation output (`npm run build`, `npm run varios:r2-restore-stacked-layout-audit`).

## 13. Remaining risks

- Live QA must confirm real published listings have images in Supabase `images` column (data issue vs layout).
- `object-contain` on main gallery image preserves aspect ratio but may letterbox; not changed in this gate.
- Related rail below stack may push related listings further down on long listings (acceptable tradeoff for readable cards).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Last good stacked layout commit was identified | TRUE | `c01156c2` §2 |
| Bad layout regression commit was identified | TRUE | `fc97c454` §3 |
| Only Varios layout/media presentation files were restored | TRUE | §5 — two en-venta layout files only |
| No unrelated categories were edited | TRUE | §5 scope |
| V-L1 published visibility fix was preserved | TRUE | §6 — no visibility file edits |
| P4-C preview results-card sample was preserved or blocker documented | TRUE | `EnVentaPreviewResultsCardSample` still in preview page |
| Public detail media/gallery is visible | TRUE | `lg:col-span-7` gallery + `EnVentaMediaGallery` |
| Public detail video/media area is visible when media exists | TRUE | `EnVentaMediaGallery` video slide |
| Gallery thumbnails are visible when images exist | TRUE | thumbnail row in `EnVentaMediaGallery.tsx` |
| Landing/results cards show primary image when available | TRUE | `EnVentaResultListingCard` heroImage img |
| Placeholder is not used when real image exists | TRUE | conditional render on `model.heroImage` |
| Description is readable in its own stack/card | TRUE | `EnVentaDetailContentStack` description section |
| Item facts/details are readable | TRUE | Item facts grid card |
| Condition/use is readable | TRUE | condition/use card |
| Accessories are readable | TRUE | accessories card |
| Technical details/specifications are not squeezed | TRUE | full-width stack §10 |
| Delivery/Entrega is readable and not squeezed into sidebar | TRUE | delivery card in stack; chips only in contact |
| Contact card does not destroy layout | TRUE | hero+contact in `col-span-5` top column |
| Desktop is no longer tiny/scattered | TRUE | preview `max-w-6xl` + 7+5 grid; public full-width stack |
| Mobile remains usable | TRUE | single-column grid order preserved |
| Publish flow was not changed | TRUE | §6 |
| Terms/checkbox logic was not changed | TRUE | §6 |
| Leonix Ad ID generation was not changed | TRUE | §6 |
| Internal slug remains en-venta | TRUE | routes unchanged |
| Spanish public label remains Varios | TRUE | `enVentaPublicLabels.ts` |
| English public label remains For Sale | TRUE | `enVentaPublicLabels.ts` |
| No fake listings/placeholders were added | TRUE | no demo data added |
| No Stripe/payment files were edited | TRUE | §5 scope |
| No Supabase schema/migrations were edited | TRUE | §5 scope |
| npm run build passed | TRUE | gate validation |
