# Emergency Gate R11 — Unify Varios Preview/Public/Listing Shells

## 1. Files inspected

- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewResultsCardSample.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx` (Bienes Raíces only)
- `app/(site)/clasificados/anuncio/[id]/page.tsx`
- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts`
- `app/(site)/clasificados/en-venta/hub/EnVentaHubRecentListings.tsx`
- `app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaCardMedia.ts`
- `app/lib/clasificados/en-venta/varios-display-normalizer.ts`

## 2. Files changed

- `app/lib/clasificados/en-venta/varios-display-normalizer.ts` — **new** shared display/media contract
- `app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaCardMedia.ts` — delegates to lib normalizer
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` — Varios uses preview gallery + listingCanvas + always BuyerPanel
- `app/(site)/clasificados/anuncio/[id]/page.tsx` — passes `publishedSourceRow` for Varios re-resolve
- `scripts/varios-r11-unify-preview-public-shells-smoke-test.ts` — **new**
- `package.json` — audit script
- `app/lib/clasificados/en-venta/VARIOS_R11_UNIFY_PREVIEW_PUBLIC_SHELLS_AUDIT.md` — this file

## 3. Approved preview listing card component/file

`EnVentaPreviewResultsCardSample` → `buildEnVentaResultsCardModelFromDraftState` → `EnVentaResultListingCard`

## 4. Approved preview full-detail component/file

`EnVentaPreviewPage` — grid: `EnVentaPreviewGallery` + `EnVentaListingHero` + `EnVentaBuyerPanel` + `EnVentaDetailContentStack` inside `EN_VENTA_SURFACE.listingCanvas`

## 5. Old published detail shell component/file

`EnVentaAnuncioLayout` used `EnVentaMediaGallery` (smaller frame, no lightbox/thumb strip parity) and skipped `EnVentaBuyerPanel` for business listings with `negocioDisplay`, falling back to legacy yellow contact + `EnVentaSellerCard` block.

## 6. Landing/latest card component/file

`EnVentaHubRecentListings` → `buildEnVentaResultsCardModel(dto, { row })` → `EnVentaResultListingCard`

## 7. Results card component/file

`EnVentaResultsListingSections` → same card model path as hub

## 8. Media/data differences found

| Surface | Data source | Media resolver |
| --- | --- | --- |
| Preview card/detail | Draft/session | `getOrderedEnVentaImageUrls` / `buildEnVentaPreviewModel` |
| Published detail (before) | Mapped `listing.images` only in layout | `resolveEnVentaListingImageUrls` at map time; layout could miss re-resolve |
| Published detail (after) | `publishedSourceRow` + lib normalizer | `normalizeVariosDisplayMediaFromRow` → `buildVariosGalleryViewProps` |
| Landing/results | Browse row + DTO | `normalizeEnVentaCardMedia` → lib |

## 9. Root cause

1. **Published Varios detail used `EnVentaMediaGallery` instead of approved `EnVentaPreviewGallery`** — different shell (no preview lightbox, thumb strip, `listingCanvas` wrapper).
2. **Business published listings skipped `EnVentaBuyerPanel`** — fell through to legacy contact/seller card UI.
3. **Card/detail media already fixed in R10** via row normalizer; R11 aligns detail gallery + contact shell with preview.

## 10. Normalizer/display contract result

`varios-display-normalizer.ts` exports `VariosDisplayMedia`, `normalizeVariosDisplayMediaFromRow`, `normalizeVariosDisplayMediaFromDraft`, `buildVariosGalleryViewProps`, plan resolvers. Card helper re-exports via `normalizeEnVentaCardMedia`.

## 11. Public detail replacement result

Varios (`surface === "en-venta" && !premiumBr`): `EnVentaPreviewGallery` + `listingCanvas` + `EnVentaBuyerPanel` for all sellers. `publishedSourceRow` passed from `anuncio/[id]/page.tsx`. Bienes Raíces unchanged (`EnVentaMediaGallery`).

## 12. Landing/results card media result

Unchanged R10 path: `row` → `normalizeEnVentaCardMedia` (lib-backed) → `heroImage` on `EnVentaResultListingCard`.

## 13. Current live test ad expected result

`SALE-2026-000076` / `f9dc7c3a-c50c-4bcc-9c91-e6f0518baa5e` (manual QA only): after deploy, detail should match preview gallery; landing/results cards show uploaded photos when row has URLs in `images`/`description`.

## 14. Smoke test result

`npm run varios:r11-unify-preview-public-shells-smoke-test`

## 15. Build result

`npm run build`

## 16. Remaining risks

- Manual QA required on production/staging with owner listing.
- `EnVentaRelatedRail` remains on Varios detail (preview does not show it; not removed per scope).
- Live DB not inspected in CI.

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Approved preview listing card shell was identified | TRUE | §3 |
| Approved preview full-detail shell was identified | TRUE | §4 |
| Current old published detail shell was identified | TRUE | §5 |
| Landing/latest card shell was identified | TRUE | §6 |
| Results card shell was identified | TRUE | §7 |
| Data/media differences were documented before editing | TRUE | §8 |
| Root cause was documented before editing | TRUE | §9 |
| Varios display/media normalizer or equivalent contract exists | TRUE | `varios-display-normalizer.ts` |
| Public detail Varios path uses approved preview-equivalent display shell | TRUE | `EnVentaPreviewGallery` in layout |
| Old tiny Varios public detail shell is no longer used | TRUE | Varios branch excludes `EnVentaMediaGallery` |
| Public detail still uses same public URL | TRUE | no route change |
| Public detail shows uploaded primary/first photo when photos exist | TRUE | lib normalizer + gallery props |
| Public detail still shows video when video exists | TRUE | `showVideo` in gallery props |
| Public detail video does not suppress photos | TRUE | `resolveEnVentaHeroImageUrl` |
| Public detail contact card still shows WhatsApp only when provided | TRUE | `EnVentaBuyerPanel` + contact actions |
| Public detail location mini-map still shows | TRUE | `EnVentaBuyerPanel` |
| Public detail lower content stack still shows | TRUE | `EnVentaDetailContentStack` |
| Landing/latest card uses uploaded primary/first photo when photos exist | TRUE | R10 + lib |
| Results card uses uploaded primary/first photo when photos exist | TRUE | R10 + lib |
| Landing/results video badge remains when video exists | TRUE | `showVideoBadge` |
| Placeholder appears only when no usable photo exists | TRUE | card + gallery |
| Photo order remains respected | TRUE | `resolveEnVentaListingImageUrls` |
| Preview media was not regressed | TRUE | preview files untouched |
| Preview full-detail layout was not regressed | TRUE | preview files untouched |
| Media upload UI was not changed | TRUE | scope |
| Image reorder UI was not changed | TRUE | scope |
| Draft behavior was not changed | TRUE | scope |
| Publish behavior was not changed | TRUE | scope |
| Publish success confirmation was not changed | TRUE | scope |
| Dashboard layout was not changed | TRUE | scope |
| No fake image URL was added | TRUE | smoke test |
| No hardcoded test listing ID was added to app code | TRUE | smoke test |
| No unrelated categories were edited | TRUE | scope |
| No global layout/theme files were edited | TRUE | scope |
| No Stripe/payment files were edited | TRUE | scope |
| No Supabase migrations/schema were edited | TRUE | scope |
| npm run varios:r11-unify-preview-public-shells-smoke-test passed | TRUE | validation |
| npm run build passed | TRUE | validation |
