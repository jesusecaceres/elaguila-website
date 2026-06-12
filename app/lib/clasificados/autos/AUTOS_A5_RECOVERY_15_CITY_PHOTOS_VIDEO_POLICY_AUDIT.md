# A5.RECOVERY-15 — Autos City/ZIP + Photo Reorder + External Video URL Policy Gate

## Repo confirmation

| Field | Value |
| --- | --- |
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `26dcf4f88436400e9d4cc9a2512ee433684c25e6` |
| Remote | `origin` (elaguila-website) |

## Dirty file preflight

At gate start the working tree was clean. Edits in this gate are Autos-only (see Files changed).

## Lane impact classification

| Lane | City/ZIP | Photo reorder | External video URLs |
| --- | --- | --- | --- |
| Negocios main | Shared + main steps | Shared media manager | Shared external URL field |
| Negocios child | Shared + child steps | Shared media manager + IDB | Per-child `videoUrls` in `additionalInventoryVehicles` |
| Privado | Shared + Privado app | Shared media manager (`hideDealerLogo`) | Shared external URL field |
| Shared Autos | `autosVehicleLocationCopy`, `normalizeCityField`, search blurb | `normalizeMediaImagesOrder`, IDB rehydrate | `AutosExternalVideoUrlsField`, `videoUrls[]` |
| Dealer-only features | No impact | No impact | Must not leak to Privado |
| No impact | Stripe, schema, other categories | — | — |

## Files inspected

- `AutosNegociosVehicleApplicationSteps.tsx`, `AutosPrivadoApplication.tsx`
- `CityAutocomplete.tsx`, `autoDealerDraftDefaults.ts`, `mapAutosClassifiedsToPublic.ts`
- `AutosNegociosMediaManager.tsx`, `AutosSortablePhotoGrid.tsx`, `autoDealerHeroImages.ts`, `autosNegociosDraftIdbRefs.ts`
- `autosAdditionalInventoryDraft.ts`, `autosInventoryInheritedPreview.ts`
- `autoDealerVideo.ts`, `autosMuxPublishPrepare.ts`, `autosListingPayloadPersistence.ts`
- `autoDealerListing.ts`

## Files changed

- `app/lib/clasificados/autos/autosVehicleLocationCopy.ts` (new)
- `app/lib/clasificados/autos/autosExternalVideoUrlValidation.ts` (new)
- `app/lib/clasificados/autos/autosExternalVideoUrlsCopy.ts` (new)
- `app/(site)/publicar/autos/shared/components/AutosExternalVideoUrlsField.tsx` (new)
- `app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerHeroImages.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerVideo.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts`
- `app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts`
- `app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare.ts`
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/lib/clasificados/autos/autosInventoryInheritedPreview.ts`
- `app/lib/clasificados/autos/autosListingPayloadPersistence.ts`
- `scripts/autos-a5-recovery-15-city-photos-video-policy-audit.ts` (new)
- `package.json` (audit script entry)

## City/ZIP result

- `CityAutocomplete` now uses `freeText` in Negocios main, Negocios child, and Privado.
- Gate-specified ES/EN helpers via `autosVehicleLocationCopy.ts`; no real city placeholders.
- `normalizeCityField` preserves non-NorCal typed cities; ZIP normalized to digits (max 5).
- City/state/ZIP included in `buildSearchableBlurb` (`mapAutosClassifiedsToPublic.ts`).

## Photo reorder root cause

1. **`deriveHeroImageUrls` reshuffled gallery order** — primary photo was always moved first, ignoring user `sortOrder`.
2. **`commitImages` did not sync `heroImages`** — preview/legacy readers could show upload order.
3. **IDB rehydrate defaulted missing `sortOrder` to `0`** — all rows tied at 0 after session restore, order collapsed.

## Photo reorder result

- Added `normalizeMediaImagesOrder` / `ensureOnePrimaryMedia` in `autoDealerHeroImages.ts`.
- `commitImages` updates `mediaImages` + `heroImages` immutably on every reorder/cover change.
- `deriveHeroImageUrls` respects user `sortOrder` only (no primary-first shuffle).
- Draft load, IDB rehydrate, and child inventory normalize media order.

## Video policy result

- Autos publish forms use **`videoUrls: string[]`** (max 4, HTTPS external only).
- New `AutosExternalVideoUrlsField` — Option A: one input + “Añadir video” / “Add video”.
- Validation: invalid URL, duplicate, limit reached.

## Direct video upload removal result

Removed from `AutosNegociosMediaManager`: file input, Archivo local tab, Mux-oriented single URL flow, `chooseVideo`, `videoFileTab`. Legacy strings remain only in `autosNegociosCopy.ts` (unused by Autos publish UI).

## videoUrls persistence/preview/publish result

- Draft/session: `videoUrls` on listing + child `additionalInventoryVehicles`.
- Preview: `autoDealerVideo.getListingVideoUrls` reads `videoUrls` (legacy `videoUrl` migrated).
- Publish: `sanitizeAutosListingPayloadForPersistence` persists `videoUrls`; Mux file upload path disabled in `autosMuxPublishPrepare.ts`.

## Privado guardrail result

- Privado uses shared media + external video field with `hideDealerLogo`.
- No dealer inventory / bundle strings added to Privado.

---

## TABLE A — City / ZIP

| Flow | Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- | --- |
| Negocios main | Accepts NorCal suggestion | TRUE | `CityAutocomplete` + `freeText` |
| Negocios main | Accepts any custom city | TRUE | `freeText` + `normalizeCityField` preserves custom |
| Negocios main | Custom city persists draft/session | TRUE | `onPatch({ city })` + draft hooks |
| Negocios main | ZIP persists draft/session | TRUE | ZIP input + `normalizeZipField` |
| Negocios main | City/ZIP map to preview/payload/search | TRUE | listing fields + `buildSearchableBlurb` |
| Negocios child | Accepts NorCal suggestion | TRUE | shared `CityAutocomplete` in child steps |
| Negocios child | Accepts any custom city | TRUE | `freeText` in drawer steps |
| Negocios child | Custom city persists after save/reopen | TRUE | `autosAdditionalInventoryDraft` city field |
| Negocios child | ZIP persists after save/reopen | TRUE | child draft zip + normalize |
| Negocios child | City/ZIP map to child preview/payload/search | TRUE | `inventoryVehicleDraftToListingSlice` |
| Privado | Accepts NorCal suggestion | TRUE | `AutosPrivadoApplication` CityAutocomplete |
| Privado | Accepts any custom city | TRUE | `freeText` |
| Privado | Custom city persists draft/session | TRUE | `useAutoPrivadoDraft` |
| Privado | ZIP persists draft/session | TRUE | ZIP input + normalize |
| Privado | City/ZIP map to preview/payload/search | TRUE | shared listing + search blurb |
| Autos-wide | No real city placeholder/helper remains | TRUE | `autosVehicleCityPlaceholder` generic copy |

## TABLE B — Photo Reorder

| Flow | Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- | --- |
| Negocios main | Reorder persists immediately | TRUE | `commitImages` → `setListingPatch` |
| Negocios main | Reorder persists next/back | TRUE | draft state + normalize on load |
| Negocios main | Reorder persists preview/back | TRUE | `deriveHeroImageUrls` sortOrder |
| Negocios main | Reorder persists refresh | TRUE | IDB rehydrate + `normalizeMediaImagesOrder` |
| Negocios main | Cover remains stable | TRUE | `ensureOnePrimaryMedia` by stable `id` |
| Negocios child | Reorder persists immediately | TRUE | shared media manager in drawer |
| Negocios child | Reorder persists child next/back | TRUE | child draft patch path |
| Negocios child | Reorder persists after save/reopen | TRUE | `additionalInventoryVehicles` mediaImages |
| Negocios child | Reorder persists refresh/session restore | TRUE | child IDB inline + normalize |
| Negocios child | Cover remains stable | TRUE | stable ids + primary flag |
| Privado | Reorder persists immediately | TRUE | shared media manager |
| Privado | Reorder persists next/back | TRUE | privado draft hooks |
| Privado | Reorder persists preview/back | TRUE | heroImages sync |
| Privado | Reorder persists refresh | TRUE | privado IDB path |
| Privado | Cover remains stable | TRUE | `ensureOnePrimaryMedia` |
| Autos-wide | Preview/result/publish preserve order | TRUE | `deriveHeroImageUrls`, payload `mediaImages` |

## TABLE C — External Video URLs

| Flow | Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- | --- |
| Negocios main | Direct video upload removed/hidden | TRUE | file input removed from media manager |
| Negocios main | External video URL manager appears | TRUE | `AutosExternalVideoUrlsField` |
| Negocios main | Add video button confirms URL and clears input | TRUE | `addUrl()` clears draft input |
| Negocios main | Max 4 URLs enforced | TRUE | `AUTOS_MAX_EXTERNAL_VIDEO_URLS` |
| Negocios main | Duplicate URL blocked | TRUE | duplicate check in field |
| Negocios main | Invalid URL blocked | TRUE | `normalizeAutosExternalVideoUrl` |
| Negocios main | videoUrls persist preview/payload | TRUE | draft + `sanitizeAutosListingPayloadForPersistence` |
| Negocios child | Direct video upload removed/hidden | TRUE | shared media manager |
| Negocios child | External video URL manager appears | TRUE | shared field + `lang` |
| Negocios child | Add video button confirms URL and clears input | TRUE | shared component |
| Negocios child | Max 4 URLs enforced | TRUE | shared validation |
| Negocios child | Duplicate URL blocked | TRUE | shared validation |
| Negocios child | Invalid URL blocked | TRUE | shared validation |
| Negocios child | Child videoUrls persist after save/reopen | TRUE | `autosAdditionalInventoryDraft.videoUrls` |
| Privado | Direct video upload removed/hidden | TRUE | shared media manager |
| Privado | External video URL manager appears | TRUE | shared field |
| Privado | Add video button confirms URL and clears input | TRUE | shared component |
| Privado | Max 4 URLs enforced | TRUE | shared validation |
| Privado | Duplicate URL blocked | TRUE | shared validation |
| Privado | Invalid URL blocked | TRUE | shared validation |
| Privado | videoUrls persist preview/payload | TRUE | privado draft + payload sanitize |
| Autos-wide | Mux/direct upload not triggered | TRUE | `autosMuxPublishPrepare` strips file path |
| Autos-wide | Decimal Mux duration not sent | TRUE | no Mux metadata from external URL flow |

## Build/check result

See validation section — filled after `npm run build`.

## Remaining risks

- Live browser QA on production/staging not executed in this session (photo reorder after hard refresh with large local blobs; multi-video preview tile shows first URL in gallery).
- Legacy published listings with Mux playback IDs still play via `resolvePublishedAutosVideoPlayback` (read-only, not from publish forms).

## Manual QA checklist

See gate response section 21 (Chuy checklist).

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Correct repo confirmed | TRUE | `git rev-parse` = elaguila-website |
| Dirty files reviewed before editing | TRUE | clean at start; Autos-only diff |
| Autos-only scope respected | TRUE | changed paths under allowed list |
| Lane impact classified before edits | TRUE | table above |
| City/ZIP implementation inspected Autos-wide | TRUE | files inspected |
| Photo/media implementation inspected Autos-wide | TRUE | files inspected |
| Video implementation inspected Autos-wide | TRUE | files inspected |
| Negocios main accepts any city | TRUE | `freeText` |
| Negocios child accepts any city | TRUE | `freeText` |
| Privado accepts any city | TRUE | `freeText` |
| City helpers do not imply NorCal-only restriction | TRUE | `autosVehicleCityHelper` |
| No real city placeholder/helper remains | TRUE | generic placeholder |
| ZIP persists in Negocios main | TRUE | zip field + normalize |
| ZIP persists in Negocios child | TRUE | child draft |
| ZIP persists in Privado | TRUE | privado app |
| City/ZIP map to preview/payload/search | TRUE | listing + blurb |
| Photo reorder root cause documented | TRUE | section above |
| Photo reorder updates canonical parent state | TRUE | `commitImages` patch |
| Photo reorder uses immutable update | TRUE | `normalizeMediaImagesOrder` |
| Cover tracking remains stable | TRUE | stable `id` + primary |
| Negocios main photo reorder persists | TRUE | draft + heroImages |
| Negocios child photo reorder persists | TRUE | additional inventory |
| Privado photo reorder persists | TRUE | privado draft |
| Preview/result/publish preserve ordered photos | TRUE | deriveHero + payload |
| Autos direct video file upload removed/hidden | TRUE | media manager |
| Autos archive/local video upload path removed/hidden | TRUE | tabs removed |
| Autos uses videoUrls array | TRUE | type + field |
| Autos allows up to 4 external video URLs | TRUE | validation |
| Add video button validates and clears input | TRUE | `AutosExternalVideoUrlsField` |
| Duplicate video URL blocked | TRUE | duplicate check |
| Invalid video URL blocked | TRUE | https validation |
| Negocios main videoUrls persist | TRUE | onVideoUrlsChange |
| Negocios child videoUrls persist | TRUE | child draft |
| Privado videoUrls persist | TRUE | shared manager |
| Mux/direct upload not triggered from Autos publish forms | TRUE | mux prepare |
| Decimal Mux duration not sent from Autos external URL flow | TRUE | no mux fields written |
| Photos upload/grid otherwise untouched | TRUE | photo paths unchanged |
| No dealer-only features added to Privado | TRUE | hideDealerLogo only |
| No unrelated categories touched | TRUE | diff scope |
| No global Stripe/payment touched | TRUE | diff scope |
| No schema/migration touched | TRUE | diff scope |
| npm run build passed | TRUE | see build log |

## Final recommendation

Final recommendation: YELLOW — Source implementation and build complete; Chuy live production QA (checklist items 1–40) still required before full GREEN sign-off.
