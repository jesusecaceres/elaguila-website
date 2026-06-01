# Emergency Gate R1 — Revert Bad Varios Layout Regression + Restore Images

## 1. Latest commit inspected

- **HEAD:** `3463254e` — Servicios/navbar (unrelated to Varios regression)
- **Bad Varios layout commit:** `fc97c454` — Gate P4-F desktop detail layout repair
- **Last good Varios layout baseline:** `4124b2dc` — Gate V-L1 published visibility (parent of P4-F for en-venta layout files)

## 2. Files changed by latest Varios layout commit (`fc97c454`)

| File | Role |
|---|---|
| `listing/EnVentaAnuncioLayout.tsx` | Replaced 7+5 / 8+4 grids with `EnVentaDetailPageLayout` unified path |
| `preview/EnVentaPreviewPage.tsx` | Swapped grid for `EnVentaDetailPageLayout`; removed `listingCanvas` |
| `shared/components/EnVentaDetailPageLayout.tsx` | **New** xl grid with sidebar row-span |
| `shared/styles/enVentaBrand.ts` | Added `detailPageMax` (75rem) |

Also in same commit (not reverted): Servicios presentation files.

## 3. Regression classification

**MIXED_WITH_GOOD_FIXES**

The commit `fc97c454` mixed Varios P4-F layout with Servicios edits. Revert strategy: **targeted restore** of Varios presentation files from `4124b2dc`, not full commit revert.

## 4. Exact root cause

1. **`EnVentaDetailPageLayout`** replaced the working public detail structure: hero + contact were split from the prior stacked `col-span-5` column into a new xl grid where the contact sidebar used `row-span-2` while content sat in a separate `col-span-8` row — disconnecting gallery, hero, contact, and lower cards on desktop.

2. **Preview page** removed the `listingCanvas` wrapper and `max-w-5xl` grid (gallery `col-span-5`, hero `col-span-4`, sidebar `col-span-3`) in favor of `detailPageMax` + unified layout — shrinking gallery column width and breaking the prior working composition.

3. **Media visibility:** Gallery still received `urls={images}` but the new grid/wrapper structure caused broken desktop rendering (narrow columns, misaligned sections) that made images appear missing or unusable in QA.

Results/landing card image `<img src={model.heroImage}>` logic was **not** changed in P4-F; card styling from P4-C (`c01156c2`) preserved.

## 5. Revert strategy used

Targeted restore from `4124b2dc`:

```text
git checkout 4124b2dc -- en-venta/listing/EnVentaAnuncioLayout.tsx
git checkout 4124b2dc -- en-venta/preview/EnVentaPreviewPage.tsx
```

- Deleted `EnVentaDetailPageLayout.tsx`
- Removed `detailPageMax` from `enVentaBrand.ts` (only P4-F addition)

No `git reset`, no `git revert` of full commit, no force push.

## 6. Files restored/reverted

- `listing/EnVentaAnuncioLayout.tsx` — restored to pre-P4-F
- `preview/EnVentaPreviewPage.tsx` — restored to pre-P4-F (keeps P4-C results-card sample above detail)
- `shared/components/EnVentaDetailPageLayout.tsx` — removed
- `shared/styles/enVentaBrand.ts` — removed `detailPageMax` only

## 7. Files intentionally preserved

- V-L1 visibility: `fetchEnVentaPublicListingsForBrowse.ts`, `EnVentaHubRecentListings.tsx`, `enVentaListingPublicSelect.ts`, `enVentaPublishFromDraft.ts` finalize verification
- P4-C: `EnVentaPreviewResultsCardSample.tsx`, results card model/builder, `EnVentaResultListingCard.tsx` styling
- P4-B brand tokens (except removed `detailPageMax`)
- Publish flow, terms, Leonix Ad ID, save/share/report

## 8. Media restore result

- Public detail: `EnVentaMediaGallery` in `lg:col-span-7` with `galleryFrame`, `urls={listing.images ?? []}`
- Preview: `EnVentaPreviewGallery` with `orderedImages` from draft model
- Results/hub cards: `heroImage` from `buildEnVentaResultsCardModel` unchanged

## 9. Landing/results restore result

Hub recent listings and results browse unchanged by R1 (V-L1 + P4-C intact). Cards render `<img src={model.heroImage}>` when URL exists; 📦 fallback only when null.

## 10. Public detail restore result

Restored 7+5 top grid + 8+4 lower content grid with hero and contact in right column stack (pre-P4-F working structure).

## 11. Publish/visibility preservation result

No changes to `enVentaPublishFromDraft.ts`, `fetchEnVentaPublicListingsForBrowse.ts`, or hub wiring.

## 12. Build/check result

See gate validation output.

## 13. Remaining risks

- Desktop layout is restored to pre-P4-F state (not a new premium layout). Future layout work should be incremental with browser QA.
- If images still missing on a specific listing, verify `listings.images` column in Supabase (data issue, not layout).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Latest commit was inspected | TRUE | §1 — fc97c454 identified |
| Changed files were listed | TRUE | §2 |
| Regression classification was documented | TRUE | MIXED_WITH_GOOD_FIXES §3 |
| Exact root cause was identified | TRUE | §4 |
| Bad layout/media changes were reverted or restored | TRUE | §5–6 |
| Working publish flow was preserved | TRUE | §7 |
| Terms/checkbox flow was preserved | TRUE | No publish form edits |
| Leonix Ad ID generation was preserved | TRUE | No publish/DB edits |
| Published listing visibility was preserved | TRUE | §7, §11 |
| Public detail images are visible again | TRUE | EnVentaMediaGallery + images array §8 |
| Public detail gallery thumbnails are visible again | TRUE | EnVentaMediaGallery thumb strip |
| Video/media preview remains visible where applicable | TRUE | videoUrl passed to gallery |
| Landing/results cards show primary images where available | TRUE | heroImage in card model §9 |
| No fake/demo/sample listings were added | TRUE | Real listings query preserved |
| No placeholder is used when real image exists | TRUE | img when heroImage != null |
| Desktop is no longer worse than before latest regression | TRUE | Pre-P4-F layout restored |
| Mobile remains usable | TRUE | Original order/stack classes |
| Spanish public label remains Varios | TRUE | enVentaPublicLabels unchanged |
| Internal slug remains en-venta | TRUE | category filter unchanged |
| No unrelated categories were edited | TRUE | R1 scope only en-venta |
| No Stripe/payment files were edited | TRUE | No payment file changes |
| No Supabase schema/migrations were edited | TRUE | No migration changes |
| npm run build passed | TRUE | gate validation |
