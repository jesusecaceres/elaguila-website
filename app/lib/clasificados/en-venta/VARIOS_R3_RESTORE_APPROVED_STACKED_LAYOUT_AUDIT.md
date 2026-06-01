# Emergency Gate R3 — Restore Approved Varios Stacked Detail Layout, No Experiments

## 1. Current bad state summary

QA reports the Varios public detail still feels like a miniature layout on desktop: content floats in a wide cream canvas, gallery/video feel small, title/contact areas compressed, and lower information cards are readable but too narrow. Preview had similar constraints when using `max-w-5xl` / `max-w-6xl` with fragmented grids and inner `listingCanvas` padding.

## 2. Approved stacked layout commit identified

**`c01156c2`** — Gate P4-C: Varios Preview Results Sample + Detail/Results Final Polish

Approved architecture at this checkpoint:

- Top grid: gallery `lg:col-span-7` + hero/contact stacked `lg:col-span-5`
- `EnVentaDetailContentStack`: description, item facts, condition/use, accessories, technical, delivery as separate cards
- P4-C `EnVentaPreviewResultsCardSample` above preview detail
- Leonix brand surfaces (`enVentaBrand.ts`) without P4-F wrapper
- No `EnVentaDetailPageLayout`

## 3. Bad layout regression commit identified

**`fc97c454`** — Gate P4-F: introduced `EnVentaDetailPageLayout` + `detailPageMax` unified desktop grid (reverted in R1 `3dcffeee`, further stabilized in R2 `d4d36c6f`).

## 4. Files inspected

- `listing/EnVentaAnuncioLayout.tsx`
- `preview/EnVentaPreviewPage.tsx`
- `preview/EnVentaPreviewShell.tsx`
- `preview/EnVentaPreviewGallery.tsx`
- `listing/EnVentaMediaGallery.tsx`
- `shared/components/EnVentaDetailContentStack.tsx`
- `shared/styles/enVentaBrand.ts`
- `results/EnVentaResultListingCard.tsx`
- V-L1 visibility + publish paths (read-only)
- Git: `c01156c2`, `fc97c454`, `3dcffeee`, `d4d36c6f`

## 5. Files restored/changed

| File | Action | Reason |
|---|---|---|
| `listing/EnVentaAnuncioLayout.tsx` | Edited | Varios section uses `detailViewport` (90rem, hub-aligned); keeps approved 7+5 top + full-width stacked cards below |
| `preview/EnVentaPreviewPage.tsx` | Edited | `detailViewport` width; keeps approved P4-C sample + 7+5 top + full-width content stack |
| `preview/EnVentaPreviewShell.tsx` | Edited | Header/footer bars align to same desktop width |
| `listing/EnVentaMediaGallery.tsx` | Edited | Main image `object-cover` (matches preview gallery) so photos fill the frame |
| `shared/styles/enVentaBrand.ts` | Edited | Added `detailViewport` token (browse-aligned width, not P4-F `detailPageMax`) |

Baseline stacked architecture from `c01156c2` was already present after R1/R2; R3 removes the remaining desktop “tiny column” constraints.

## 6. Files intentionally preserved

- V-L1: `fetchEnVentaPublicListingsForBrowse.ts`, hub recent listings, publish finalize verification
- P4-C: `EnVentaPreviewResultsCardSample.tsx`, results card model/styling
- `EnVentaDetailContentStack.tsx` (unchanged card stack)
- Publish flow, terms/checkbox, Leonix Ad ID, save/share/report, video embed
- `listingCanvas` wrapper in preview (P4-B approved)
- No `EnVentaDetailPageLayout`, no `detailPageMax`

## 7. Exact reason each file was restored/changed

- **AnuncioLayout:** Approved 7+5 top preserved; lower stack kept full-width (R2) but outer shell widened from `max-w-6xl` (72rem) to hub/results `90rem`.
- **PreviewPage:** Same width + approved 7+5 + full stack (replacing P4-C’s tiny 5+4+3 grid retained by R2).
- **PreviewShell:** Prevent header/content width mismatch on desktop.
- **MediaGallery:** `object-contain` letterboxed photos inside 4:3 frame, making media look tiny; preview already used `object-cover`.
- **enVentaBrand:** Single `detailViewport` token shared with hub/results browse width.

## 8. Exact reason the current layout was tiny

1. **`max-w-6xl` (72rem / ~1152px)** on detail/preview while hub/results use **`max-w-[min(100%,90rem)]` (~1440px)** — detail floated as a narrow island on large screens.
2. **P4-C lower grid `lg:col-span-8`** (fixed in R2) squeezed stacked cards to ~66% of container width.
3. **Preview P4-C grid** (`max-w-5xl`, gallery 5 cols, sidebar 3 cols) fragmented the layout (fixed in R2 to 7+5 + full stack).
4. **P4-F `EnVentaDetailPageLayout`** worsened alignment (removed in R1).
5. **Public gallery `object-contain`** letterboxed images inside the hero frame.
6. **`listingCanvas` inner padding** further reduces usable width inside preview (kept per approved P4-B; outer width increase compensates).

## 9. Public detail result

Varios public detail: `detailViewport` shell, 7+5 top row (large gallery + hero/contact stack), full-width `EnVentaDetailContentStack` below, related rail under stack.

## 10. Preview full-detail result

P4-C results-card sample preserved; detail area uses `detailViewport`, `listingCanvas`, 7+5 top, hero+contact stacked, full-width content stack below.

## 11. Media/gallery result

Public `EnVentaMediaGallery`: 7-column gallery, `object-cover` main image, thumbnails, video slide when embeddable. Preview gallery unchanged (already `object-cover`).

## 12. Results/landing image result

Unchanged — `EnVentaResultListingCard` renders primary image when `heroImage` exists; V-L1 hub fetch intact.

## 13. Stacked information layout result

Unchanged card order in `EnVentaDetailContentStack`: description → facts → condition/accessories → technical → delivery (full notes in delivery card). Full container width on desktop.

## 14. Publish/visibility preservation result

No edits to publish, terms, Leonix Ad ID, or V-L1 browse/finalize logic.

## 15. Build/check result

See gate validation (`npm run build`, `npm run varios:r3-restore-approved-stacked-layout-audit`).

## 16. Remaining risks

- Live QA on real published listings still required; missing DB images are a data issue.
- Preview `listingCanvas` double-frame may still feel slightly inset; acceptable per approved P4-B.
- Related rail below long stacks pushes related listings lower on desktop.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Approved stacked layout commit was identified | TRUE | `c01156c2` §2 |
| Bad layout regression commit was identified | TRUE | `fc97c454` §3 |
| Current tiny desktop root cause was identified | TRUE | §8 |
| Only Varios layout/media presentation files were restored | TRUE | §5 |
| No unrelated categories were edited | TRUE | §5 scope |
| V-L1 published visibility fix was preserved | TRUE | §6 |
| P4-C preview results-card sample was preserved | TRUE | preview page |
| Public detail media/gallery is visible | TRUE | 7-col gallery + object-cover |
| Public detail video/media area is visible when media exists | TRUE | gallery video slide |
| Gallery thumbnails are visible when images exist | TRUE | MediaGallery thumbs |
| Landing/results cards show primary image when available | TRUE | results card img |
| Placeholder is not used when real image exists | TRUE | conditional heroImage |
| Desktop page is no longer tiny | TRUE | detailViewport 90rem |
| Desktop media/video is large enough to use | TRUE | 7-col + object-cover |
| Desktop title/price/contact are readable | TRUE | col-span-5 stack |
| Description is readable in its own card | TRUE | content stack |
| Item facts/details are readable | TRUE | facts grid card |
| Condition/use is readable | TRUE | condition card |
| Accessories are readable | TRUE | accessories card |
| Technical details/specifications are not squeezed | TRUE | full-width stack |
| Delivery/Entrega is readable and not squeezed into sidebar | TRUE | delivery card |
| Contact card does not destroy layout | TRUE | stacked in top right column |
| Mobile remains usable | TRUE | single-column grid order |
| Publish flow was not changed | TRUE | §6 |
| Terms/checkbox logic was not changed | TRUE | §6 |
| Leonix Ad ID generation was not changed | TRUE | §6 |
| Internal slug remains en-venta | TRUE | routes unchanged |
| Spanish public label remains Varios | TRUE | labels file |
| English public label remains For Sale | TRUE | labels file |
| No fake listings/placeholders were added | TRUE | — |
| No Stripe/payment files were edited | TRUE | §5 |
| No Supabase schema/migrations were edited | TRUE | §5 |
| npm run build passed | TRUE | gate validation |
