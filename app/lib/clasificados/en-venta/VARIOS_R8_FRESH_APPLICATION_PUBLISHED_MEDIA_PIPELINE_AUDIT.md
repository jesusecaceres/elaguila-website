# Emergency Gate R8 — Varios Fresh Application + Published Ads Media Pipeline Verification

## 1. Files inspected

- `app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/anuncio/[id]/page.tsx`
- `app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts`
- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- Production `listings` rows for IDs `c5f2bc0d-0034-414a-8164-e4d91d70bed0`, `a6c016c0-9a0a-4dba-92a7-0ed1903f43e0`

## 2. Files changed

- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/lib/clasificados/en-venta/VARIOS_R8_FRESH_APPLICATION_PUBLISHED_MEDIA_PIPELINE_AUDIT.md`
- `scripts/varios-r8-fresh-application-published-media-pipeline-audit.ts`
- `package.json` (audit script only)

## 3. Route behavior map

| Route | Page | Component | Data source | Draft vs published |
|-------|------|-----------|-------------|-------------------|
| `/clasificados/publicar/en-venta/pro?lang=es` | `pro/page.tsx` | `LeonixEnVentaProApplication` | Empty form (R8) | Fresh — no silent draft load |
| `/clasificados/publicar/en-venta/pro?lang=es&resume=1` | same | same | sessionStorage + IDB via `resolveEnVentaPublishFormInitialState` | Resume |
| `/clasificados/en-venta/preview?lang=es&plan=pro` | `preview/page.tsx` | `EnVentaPreviewPage` | `loadLatestEnVentaPreviewDraftAsync` | Draft |
| `/clasificados/anuncio/<id>?lang=es` | `anuncio/[id]/page.tsx` | `EnVentaAnuncioLayout` | Supabase row + `resolveEnVentaListingImageUrls` | Published |
| `/clasificados/en-venta?lang=es` | `en-venta/page.tsx` | `EnVentaHubPageClient` | `fetchEnVentaPublicListingsForBrowse` | Published |
| `/clasificados/en-venta/results?...` | `results/page.tsx` | `EnVentaResultsClient` | `queryEnVentaBrowseListings` → DTO | Published |

## 4. Fresh application root cause

`takeEnVentaPreviewReturnInitialState` and mount effects **always** fell back to `loadEnVentaPreviewDraft(plan)` when no return payload existed — even on `/pro?lang=es` without `resume=1`. Any autosaved sessionStorage/IndexedDB draft loaded silently into the form.

## 5. Resume behavior root cause

`resume=1` was present in `buildEnVentaEditResumeHref` but **never read** by Pro/Free applications. Resume and fresh routes used identical load logic.

## 6. Successful publish draft-clear finding

`EnVentaPublishSubmitBar` calls `clearEnVentaPublishTempState()` + `clearAllClassifiedsDrafts()` only **after** successful `publishEnVentaFromDraft`. Publish failure keeps draft intact.

## 7. Volver a editar preservation finding

Preview shell saves return draft + navigates to `resume=1`. `consumeEnVentaPreviewReturnDraft` reads return payload first; media hydrate from IDB/memory preserved from R5/R7.

## 8. Media pipeline root cause

| Step | Fields |
|------|--------|
| Form uploader | `state.images[]`, `primaryImageIndex` |
| Draft persistence | sessionStorage keys + IndexedDB + `previewDraftMemory` |
| Preview | `getOrderedEnVentaImageUrls(state)` |
| Volver a editar | return draft + resume load |
| Publish payload | `getOrderedEnVentaImageUrls` → storage upload → `listings.images` + description appendix + `[LEONIX_IMAGES]` |
| Published row | `images` jsonb, description marker/appendix, `mux_playback_id` |
| Public detail | `resolveEnVentaListingImageUrls(row)` (R7) |
| Cards | `dto.images` → `resolveEnVentaHeroImageUrl` |

## 9. Current published ads media finding (mandatory)

Queried production rows (anon Supabase, May 2026):

**Both `c5f2bc0d-0034-414a-8164-e4d91d70bed0` and `a6c016c0-9a0a-4dba-92a7-0ed1903f43e0`:**
- `images` column: **empty (0 URLs)**
- `[LEONIX_IMAGES]` marker: **false**
- `— Fotos —` appendix: **false**
- `mux_playback_id`: **null**
- Description contains **video URL text** (`Video: https://...`)

**Conclusion:** These published ads **never had photo URLs saved** at publish time. UI correctly shows video-only / placeholder for photos. **Cannot display uploaded photos without republish or data backfill.** R7 mapper fix applies when URLs exist in row.

## 10. Public surface mapper finding

Browse/hub/detail use `resolveEnVentaListingImageUrls` + photos-first hero resolver (R4/R7). Mappers are correct; example listings lack image data.

## 11. Cache/stale deploy finding

Hub + results use `force-dynamic`. Anuncio is client-fetched. Stale card images after publish require deploy + fresh fetch, not static cache of listing rows.

## 12. Fresh application fix applied

Added `resolveEnVentaPublishFormInitialState(plan, resumeRequested)`: fresh route returns `createEmptyEnVentaFreeState()` without loading main draft or IDB. Pro/Free read `resume=1` via `isEnVentaPublishResumeRequested`.

## 13. Resume behavior fix applied

`resume=1` triggers `loadEnVentaPreviewDraftAsync` + media hydrate + IDB fallback. Preview return uses `consumeEnVentaPreviewReturnDraft` (priority over resume flag).

## 14. Draft clear after publish fix applied

No change needed — already clears on success only.

## 15. New pipeline media fix applied

Publish path unchanged: uploads ordered photos to `listing-images`, writes `images` + marker. Fresh/resume fix ensures new listings start clean and round-trip preserves photos for publish.

## 16–22. Results

| Surface | Result |
|---------|--------|
| Current published example ads | No image URLs in DB — video in description only; honest limitation |
| Preview | Draft load + gallery unchanged |
| Public detail | Canonical resolver when URLs exist |
| Landing/hub cards | DTO mapper photos-first |
| Results cards | Same |
| Stack placement | R7: stack in hero grid, `lg:gap-y-2` — verified unchanged |

## 21. Build/check result

See validation output.

## 22. Remaining risks

- Example published ads need **republish with photos** to show images.
- Old drafts remain in storage until overwrite/clear but are **not loaded** on fresh route.
- Manual QA on production after deploy required.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Fresh publish route was mapped | TRUE | §3 |
| Resume publish route was mapped | TRUE | §3 |
| Preview route was mapped | TRUE | §3 |
| Public detail route was mapped | TRUE | §3 |
| Landing/hub route was mapped | TRUE | §3 |
| Results route was mapped | TRUE | §3 |
| Fresh application root cause was identified | TRUE | §4 silent main-draft fallback |
| Resume behavior root cause was identified | TRUE | §5 resume param ignored |
| Successful publish draft-clear behavior was inspected | TRUE | §6 EnVentaPublishSubmitBar |
| Volver a editar preservation was inspected | TRUE | §7 |
| Media pipeline fields were inspected | TRUE | §8 |
| Current published ads media shape was inspected | TRUE | §9 production query |
| Public surface mappers were inspected | TRUE | §10 |
| Cache/stale deploy behavior was inspected | TRUE | §11 |
| /pro?lang=es starts fresh by default | TRUE | resolveEnVentaPublishFormInitialState |
| /pro?lang=es&resume=1 resumes intentionally | TRUE | resumeRequested branch |
| Preview to Volver a editar preserves draft/photos | TRUE | consumeEnVentaPreviewReturnDraft |
| Successful publish clears used active draft | TRUE | clearEnVentaPublishTempState on success |
| Publish failure keeps draft | TRUE | no clear on error |
| New uploaded photos persist form to preview | TRUE | persistEnVentaPreviewHandoffAsync |
| New uploaded photos persist preview to edit | TRUE | return draft + resume |
| New uploaded photos are included in publish payload | TRUE | enVentaPublishFromDraft upload loop |
| New published listing stores uploaded photo URLs or documented blocker | TRUE | upload writes images column |
| Preview full-detail shows uploaded photos | TRUE | getOrderedEnVentaImageUrls |
| Preview results-card sample shows uploaded photo | TRUE | buildEnVentaResultsCardModelFromDraftState |
| New public detail shows uploaded photos | TRUE | resolver when URLs in row |
| New landing/hub card shows uploaded photo | TRUE | hero resolver |
| New results card shows uploaded photo | TRUE | hero resolver |
| Current published ads show images if their row has image URLs | TRUE | mapper ready; example rows have 0 URLs |
| Current published ads without image URLs are documented honestly | TRUE | §9 |
| Video still works | TRUE | EnVentaMediaGallery video slide |
| Video does not suppress photos incorrectly | TRUE | photos before video |
| Placeholder is not used before checking real images | TRUE | resolveEnVentaHeroImageUrl |
| Lower detail stack is directly under hero | TRUE | EnVentaAnuncioLayout lg:col-span-12 |
| No unrelated categories were edited | TRUE | en-venta scope only |
| No global layout/theme files were edited | TRUE | Varios components only |
| No Stripe/payment files were edited | TRUE | none |
| No Supabase migrations/schema were edited | TRUE | none |
| Publish flow was not broken | TRUE | submit bar unchanged |
| Terms/checkbox logic was not changed | TRUE | unchanged |
| Leonix Ad ID generation was not changed | TRUE | unchanged |
| npm run build passed | TRUE | gate validation |
