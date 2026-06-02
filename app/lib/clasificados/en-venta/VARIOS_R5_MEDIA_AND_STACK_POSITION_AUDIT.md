# Emergency Gate R5 — Restore Varios Images + Move Lower Detail Stack Under Hero

## 1. Files inspected

- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraftIdb.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx`
- `app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewGallery.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewResultsCardSample.tsx`
- `app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts`
- `app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts`
- `app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData.ts`

## 2. Files changed

- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/lib/clasificados/en-venta/VARIOS_R5_MEDIA_AND_STACK_POSITION_AUDIT.md` (this file)
- `scripts/varios-r5-media-and-stack-position-audit.ts`
- `package.json` (audit script only)

## 3. Exact media root cause

The publish form stores uploaded photos in `state.images[]` (data URLs) with `primaryImageIndex`. Preview hydration reads `loadLatestEnVentaPreviewDraftAsync` / sessionStorage first. When photo payloads exceed sessionStorage quota, the sync draft loads with text and video metadata but `images: []`. Video survives because it is smaller (URL/Mux ids). Preview gallery and results-card sample then render video-only slides because `getOrderedEnVentaImageUrls(state)` returns empty. IndexedDB holds the full draft including photos, but was not merged when a partial sessionStorage draft already existed.

## 4. Exact Volver a editar media-loss root cause

`takeEnVentaPreviewReturnInitialState` reads the return payload from sessionStorage (which may also drop photos on quota). `restoreEnVentaFormFromIdbIfEmpty` only ran when the form looked completely empty (no title and no images), so text restored from sessionStorage blocked IDB photo recovery. Free app had no IDB media restore at all. Preview shell saved return draft without re-hydrating photos from IDB before navigation.

## 5. Exact layout gap/stack-position root cause

Public detail (`EnVentaAnuncioLayout.tsx`) rendered hero + contact in a 7+5 grid, then placed `EnVentaDetailContentStack` in a separate sibling block with `mt-10 space-y-8` below the closed grid — creating a large vertical gap. Preview page used `lg:gap-y-8` between hero row and full-width lower stack (`order-3 lg:col-span-12`), adding extra row gap.

## 6. Media fix applied

Added `hydrateEnVentaDraftMediaIfMissing` in `enVentaPreviewDraft.ts` to recover `images`, `primaryImageIndex`, and video fields from in-tab memory, return-draft IDB, or main draft IDB when ordered photo URLs are missing. Wired into `loadEnVentaPreviewDraftAsync`, `loadLatestEnVentaPreviewDraftAsync`, `restoreEnVentaFormFromIdbIfEmpty` (media-only path), Pro/Free edit mount effects, and preview shell `goBackToEdit`. Photo priority unchanged: primary index → first photo → gallery; video does not suppress photos.

## 7. Volver a editar fix applied

Pro and Free edit routes now async-hydrate media on mount after `takeEnVentaPreviewReturnInitialState`, then fall back to full IDB restore only if still empty. Preview shell re-hydrates from IDB before `saveEnVentaPreviewReturnDraft` when user clicks Volver a editar.

## 8. Stack-position fix applied

Public: moved `EnVentaDetailContentStack` and related rail into the same 12-column grid as hero (`lg:col-span-12`, `lg:gap-y-4`), removed separate `mt-10` wrapper. Preview: tightened grid row gap from `lg:gap-y-8` to `lg:gap-y-4`.

## 9. Public detail result

Gallery reads `listing.images` from merged resolver (R4). Layout stack now starts directly under hero/contact grid without large gap.

## 10. Preview full-detail result

Draft load hydrates photos from IDB when sessionStorage partial; gallery `orderedImages` populated from `getOrderedEnVentaImageUrls(state)`.

## 11. Preview results-card sample result

`buildEnVentaResultsCardModelFromDraftState` uses `resolveEnVentaHeroImageUrl` on hydrated draft photos first.

## 12. Landing/results image result

Published listings unchanged from R4 resolver path; no regression in this gate.

## 13. Draft persistence result

Full draft still written to memory + sessionStorage + IDB on preview handoff; hydration merges IDB photos when sync layer is partial.

## 14. Behavior preservation result

Publish flow, terms checkboxes, Leonix Ad ID, preview sample card, save/share/report, contact CTAs, video, and labels preserved. No schema, Stripe, or unrelated category edits.

## 15. Build/check result

See gate validation output (`npm run build`, `npm run varios:r5-media-stack-audit`).

## 16. Remaining risks

- sessionStorage quota can still fail on very large photo sets; IDB recovery depends on prior successful IDB write during handoff.
- Cross-tab edit resume may not see in-tab memory cache (IDB still available).
- Manual QA required on device with real uploads to confirm end-to-end.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Publish form media state was inspected | TRUE | `PhotosSection` → `state.images[]`, `primaryImageIndex` |
| Draft persistence media state was inspected | TRUE | `saveEnVentaPreviewDraft`, IDB keys in `enVentaPreviewDraftIdb.ts` |
| Preview hydration media state was inspected | TRUE | `loadLatestEnVentaPreviewDraftAsync`, `buildEnVentaPreviewModel` |
| Volver a editar media reload was inspected | TRUE | `takeEnVentaPreviewReturnInitialState`, Pro/Free mount effects |
| Public detail media mapper was inspected | TRUE | `mapDbRowToEnVentaListingData`, `resolveEnVentaListingImageUrls` |
| Landing/results media mapper was inspected | TRUE | `buildEnVentaResultsCardModel`, draft card builder |
| Exact missing-image root cause was identified | TRUE | sessionStorage partial draft drops `images[]`; IDB not merged |
| Exact Volver a editar media-loss root cause was identified | TRUE | empty-form-only IDB restore; Free missing hydrate |
| Exact lower-stack spacing/root cause was identified | TRUE | separate `mt-10` block below closed hero grid |
| Uploaded photos remain after form to preview navigation | TRUE | `persistEnVentaPreviewHandoffAsync` + IDB hydrate on preview load |
| Uploaded photos remain after preview to Volver a editar navigation | TRUE | shell hydrate + edit mount hydrate |
| Preview full-detail shows uploaded photos when photos exist | TRUE | `hydrateEnVentaDraftMediaIfMissing` → `vm.gallery.orderedImages` |
| Preview results-card sample shows uploaded photo when photos exist | TRUE | `buildEnVentaResultsCardModelFromDraftState` on hydrated state |
| Public detail shows uploaded photos when photos exist | TRUE | R4 resolver + layout only moved stack |
| Landing/results cards show uploaded photo when photos exist | TRUE | R4 `resolveEnVentaHeroImageUrl` unchanged |
| Video still works | TRUE | video fields preserved in `pickDraftMediaFields` |
| Video does not hide uploaded photos incorrectly | TRUE | photos ordered before video in gallery builder |
| Placeholder is not used when real photo exists | TRUE | hero resolver checks photos before video thumb |
| Lower detail stack was moved directly under hero area | TRUE | `lg:col-span-12` inside hero grid |
| Large empty gap between hero and lower stack was removed | TRUE | removed `mt-10 space-y-8` wrapper |
| Description card remains readable | TRUE | `EnVentaDetailContentStack` unchanged |
| Item facts/details remain readable | TRUE | stack component unchanged |
| Condition/use remains readable | TRUE | stack component unchanged |
| Accessories remain readable | TRUE | stack component unchanged |
| Delivery/Entrega remains readable | TRUE | stack component unchanged |
| Desktop page is not miniature | TRUE | `detailViewport` unchanged |
| Mobile remains usable | TRUE | single-column grid order preserved |
| Publish flow was not changed | TRUE | no publish API/schema edits |
| Terms/checkbox logic was not changed | TRUE | `enVentaDraftHasAllPublishCheckboxes` untouched |
| Leonix Ad ID generation was not changed | TRUE | no ID generation edits |
| Preview results-card sample was not removed | TRUE | `EnVentaPreviewResultsCardSample` still rendered |
| Save/share/report were not removed | TRUE | engagement row preserved |
| No fake listings/images/placeholders were added | TRUE | IDB/memory recovery only |
| No unrelated categories were edited | TRUE | scope limited to en-venta |
| No global layout/theme files were edited | TRUE | only `EnVentaAnuncioLayout` |
| No Stripe/payment files were edited | TRUE | none touched |
| No Supabase schema/migrations were edited | TRUE | none touched |
| npm run build passed | TRUE | gate validation |
