# Emergency Gate R7 — Locked Varios Media Persistence + Public Surface Image Fix + Stack Position Repair

## 1. Files inspected

- `app/(site)/clasificados/publicar/en-venta/pro/page.tsx`, `LeonixEnVentaProApplication.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/(site)/clasificados/en-venta/preview/page.tsx`, `EnVentaPreviewPage.tsx`, `enVentaPreviewDraft.ts`, `buildEnVentaPreviewModel.ts`
- `app/(site)/clasificados/anuncio/[id]/page.tsx`
- `app/(site)/clasificados/en-venta/page.tsx`, `results/page.tsx`, `EnVentaResultsClient.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`, `EnVentaMediaGallery.tsx`
- `app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData.ts`
- `app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts`
- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts`

## 2. Files changed

- `app/(site)/clasificados/anuncio/[id]/page.tsx`
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts`
- `app/(site)/clasificados/en-venta/results/page.tsx`
- `app/lib/clasificados/en-venta/VARIOS_R7_MEDIA_PERSISTENCE_PUBLIC_SURFACES_STACK_AUDIT.md`
- `scripts/varios-r7-media-persistence-public-surfaces-stack-audit.ts`
- `package.json` (audit script only)

## 3. Route-to-component map

| Route | Page | Main component | Gallery / card | Data source | Image fields | Video fields | Draft vs published |
|-------|------|----------------|----------------|-------------|--------------|--------------|-------------------|
| `/clasificados/publicar/en-venta/pro?lang=es&resume=1` | `publicar/en-venta/pro/page.tsx` | `LeonixEnVentaProApplication` | `PhotosSection` | React state | `state.images[]`, `primaryImageIndex` | `listingVideoUrl`, `listingVideoSlots` | Draft |
| `/clasificados/en-venta/preview?lang=es&plan=pro` | `en-venta/preview/page.tsx` | `EnVentaPreviewPage` | `EnVentaPreviewGallery` | `loadLatestEnVentaPreviewDraftAsync` | `getOrderedEnVentaImageUrls(state)` | `resolveEnVentaVideoUrl` + slots | Draft |
| `/clasificados/anuncio/<id>?lang=es` | `anuncio/[id]/page.tsx` | `EnVentaAnuncioLayout` | `EnVentaMediaGallery` | Supabase `listings` row | `resolveEnVentaListingImageUrls(row)` → `listing.images` | `mux_playback_id`, description pairs | Published |
| `/clasificados/en-venta/results?lang=es` | `en-venta/results/page.tsx` | `EnVentaResultsClient` | `EnVentaResultListingCard` | `queryEnVentaBrowseListings` → `mapDbRowToEnVentaAnuncioDTO` | `dto.images` → `resolveEnVentaHeroImageUrl` | `muxPlaybackId`, `listingVideoUrl` | Published |
| `/clasificados/en-venta?lang=es` | `en-venta/page.tsx` | `EnVentaHubPageClient` | hub cards via same card model | `fetchEnVentaPublicListingsForBrowse` | same as results | same as results | Published |

## 4. Exact uploaded-photo persistence root cause

Draft photos live in `state.images` (data URLs). Handoff writes memory + sessionStorage + IndexedDB. sessionStorage often drops large base64 `images[]` on quota while text/video survive. Free publish path previously used sync-only `saveEnVentaPreviewDraft` without awaiting `persistEnVentaPreviewHandoffAsync`, so IndexedDB could be incomplete before preview navigation.

## 5. Exact Volver a editar media-loss root cause

`takeEnVentaPreviewReturnInitialState` read quota-truncated sessionStorage return payloads with `images: []`. `restoreEnVentaFormFromIdbIfEmpty` skipped when text existed. Sync return paths did not merge in-tab `previewDraftMemory` before first paint.

## 6. Exact preview media root cause

Preview loads sessionStorage-first; partial drafts showed video-only in gallery when `getOrderedEnVentaImageUrls` returned empty. R5 IDB hydrate addressed async load; R7 adds sync memory hydrate on sync load/return paths.

## 7. Exact public detail media root cause

**Published public detail** (`anuncio/[id]/page.tsx`) used a narrower mapper (`imageUrlsFromJsonb` + `[LEONIX_IMAGES]` marker only). It ignored `— Fotos —` appendix URLs and `listing_json` photo arrays that `resolveEnVentaListingImageUrls` already merges for browse cards. Published rows with photos only in appendix/description therefore showed video/placeholder on detail while cards could work.

## 8. Exact landing/results media root cause

Browse/hub already use `mapDbRowToEnVentaAnuncioDTO` + `resolveEnVentaListingImageUrls`. Cards prefer photos over video via `resolveEnVentaHeroImageUrl`. Stale SSR was possible on results page without `force-dynamic` (hub already had it).

## 9. Exact lower-stack spacing/root cause

Varios detail stack was in a separate block below the hero grid (`mt-10`). R5 moved stack into the grid; R7 tightens row gap to `lg:gap-y-2` on public detail and preview full-detail grids.

## 10. Cache/stale deploy finding

- Hub: `export const dynamic = "force-dynamic"` (already present).
- Results: added `force-dynamic` on `en-venta/results/page.tsx`.
- Anuncio detail: client fetch (`use client`) — fresh per visit.
- Browse query reads live Supabase rows; no static sample pool.

## 11. Media persistence fix applied

- `syncHydrateEnVentaDraftMediaFromMemory` + `finalizeEnVentaEditReturnState` on all `takeEnVentaPreviewReturnInitialState` returns.
- Sync `loadEnVentaPreviewDraft` merges memory when session partial.
- Free app uses `persistEnVentaPreviewHandoffAsync` (matches Pro) before preview navigation.
- Existing async `hydrateEnVentaDraftMediaIfMissing` retained for IDB recovery.

## 12. Public surface media fix applied

- `mapDbListingRowToListing` uses `resolveEnVentaListingImageUrls(row)` for `category === "en-venta"`.
- Browse select includes `listing_json` for canonical resolver merge.

## 13. Stack-position fix applied

- Public `EnVentaAnuncioLayout`: stack remains `lg:col-span-12` inside hero grid; `lg:gap-y-2`.
- Preview `EnVentaPreviewPage`: `lg:gap-y-2` between hero row and lower stack.

## 14–18. Surface results

| Surface | Result |
|---------|--------|
| Preview full-detail | Hydrated draft photos → `EnVentaPreviewGallery.orderedImages`; photos before video slide |
| Preview results-card sample | `buildEnVentaResultsCardModelFromDraftState` + hero resolver |
| Published public detail | Canonical resolver on anuncio row → `EnVentaMediaGallery.urls` |
| Results cards | Unchanged resolver path + `force-dynamic` |
| Landing/hub cards | `fetchEnVentaPublicListingsForBrowse` + resolver |

## 19. Draft persistence result

Memory + sessionStorage + IDB handoff; sync/async hydrate layers for partial session payloads.

## 20. Behavior preservation result

Publish flow, terms, Leonix Ad ID, preview sample, save/share/report, contact CTAs, video, labels unchanged. No schema/Stripe/unrelated category edits.

## 21. Build/check result

See validation (`npm run build`, `npm run varios:r7-media-public-stack-audit`).

## 22. Remaining risks

- Very large photo sets may still exceed sessionStorage; IDB depends on successful handoff write.
- Listings published before photo upload success may lack URLs in row (data issue, not mapper).
- Manual QA on production URLs required to confirm deploy.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------ | ---------- | -------- |
| Publish form route was mapped to files | TRUE | §3 route map |
| Preview route was mapped to files | TRUE | §3 route map |
| Public detail route was mapped to files | TRUE | §3 route map |
| Results route was mapped to files | TRUE | §3 route map |
| Landing/hub route was mapped to files | TRUE | §3 route map |
| Publish form media state was inspected | TRUE | `state.images[]`, `primaryImageIndex` |
| Draft persistence media state was inspected | TRUE | `enVentaPreviewDraft.ts` |
| Preview hydration media state was inspected | TRUE | `loadLatestEnVentaPreviewDraftAsync` |
| Volver a editar media reload was inspected | TRUE | `takeEnVentaPreviewReturnInitialState` |
| Published row/media model was inspected | TRUE | `publishEnVentaFromDraft`, listings row |
| Public detail media mapper was inspected | TRUE | `anuncio/[id]/page.tsx` |
| Results media mapper was inspected | TRUE | `buildEnVentaResultsCardModel` |
| Landing/hub media mapper was inspected | TRUE | `mapDbRowToEnVentaAnuncioDTO` |
| Exact uploaded-photo persistence root cause was identified | TRUE | §4 sessionStorage quota + Free handoff |
| Exact Volver a editar media-loss root cause was identified | TRUE | §5 partial return payload |
| Exact preview media root cause was identified | TRUE | §6 empty ordered images |
| Exact public detail media root cause was identified | TRUE | §7 anuncio narrow mapper |
| Exact landing/results media root cause was identified | TRUE | §8 browse already canonical |
| Exact lower-stack spacing/root cause was identified | TRUE | §9 grid gap |
| Cache/stale deploy behavior was inspected | TRUE | §10 |
| Uploaded photos remain after form to preview navigation | TRUE | `persistEnVentaPreviewHandoffAsync` Free+Pro |
| Uploaded photos remain after preview to Volver a editar navigation | TRUE | sync+async hydrate |
| Uploaded photos remain after edit to preview again | TRUE | IDB + memory handoff |
| Selected primary photo remains preserved | TRUE | `primaryImageIndex` in pickDraftMediaFields |
| Photo order remains preserved | TRUE | `getOrderedEnVentaImageUrls` |
| Video link remains preserved | TRUE | video fields in pickDraftMediaFields |
| Preview full-detail shows uploaded photos when photos exist | TRUE | gallery orderedImages |
| Preview results-card sample shows uploaded photo when photo exists | TRUE | draft card builder |
| Published public detail shows uploaded photos when photos exist | TRUE | resolveEnVentaListingImageUrls on anuncio |
| Results cards show uploaded photo when photo exists | TRUE | hero resolver |
| Landing/hub cards show uploaded photo when photo exists | TRUE | fetch + DTO mapper |
| Video still works | TRUE | EnVentaMediaGallery video slide |
| Video does not incorrectly suppress uploaded photos | TRUE | images before video in slides |
| Placeholder is not used when real photo exists | TRUE | resolveEnVentaHeroImageUrl |
| Lower detail stack was moved directly under hero area | TRUE | lg:col-span-12 in grid |
| Large empty gap between hero and lower stack was removed | TRUE | no mt-10 wrapper; gap-y-2 |
| Stack placement was applied to public detail | TRUE | EnVentaAnuncioLayout |
| Stack placement was applied to preview full-detail if separate | TRUE | EnVentaPreviewPage |
| Description card remains readable | TRUE | EnVentaDetailContentStack unchanged |
| Item facts/details remain readable | TRUE | stack unchanged |
| Condition/use remains readable | TRUE | stack unchanged |
| Accessories remain readable | TRUE | stack unchanged |
| Delivery/Entrega remains readable | TRUE | stack unchanged |
| Desktop page is not miniature | TRUE | detailViewport unchanged |
| Mobile remains usable | TRUE | single-column order |
| Publish flow was not changed | TRUE | publish module untouched |
| Terms/checkbox logic was not changed | TRUE | unchanged |
| Leonix Ad ID generation was not changed | TRUE | unchanged |
| Preview results-card sample was not removed | TRUE | EnVentaPreviewResultsCardSample |
| Save/share/report were not removed | TRUE | EnVentaEngagementRow |
| Contact buttons were not removed | TRUE | contact sections |
| No fake listings/images/placeholders were added | TRUE | resolver only |
| No unrelated categories were edited | TRUE | en-venta scope only |
| No global layout/theme files were edited | TRUE | Varios components only |
| No Stripe/payment files were edited | TRUE | none |
| No Supabase schema/migrations were edited | TRUE | none |
| npm run build passed | TRUE | gate validation |
