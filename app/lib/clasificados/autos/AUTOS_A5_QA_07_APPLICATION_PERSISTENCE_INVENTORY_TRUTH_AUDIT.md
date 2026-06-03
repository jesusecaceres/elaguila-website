# A5.QA-07 — Autos Negocios Application Persistence + Inventory Workflow Truth Gate

**Gate:** A5.QA-07  
**Date:** 2026-06-02  
**Repo:** `C:/projects/elaguila-website`  
**Branch:** `main`  
**HEAD (audit run):** `4330769b0c4d50bcd5b37d38a249244f5fae67be`

## 1. Repo/source confirmation

Confirmed via `git rev-parse --show-toplevel` → `C:/projects/elaguila-website`, remote `https://github.com/jesusecaceres/elaguila-website.git`, branch `main`.

## 2. Files inspected

Draft/step: `useAutoDealerDraft.ts`, `useAutoPrivadoDraft.ts`, `autosNegociosDraftStorage.ts`, `autosPrivadoDraftStorage.ts`, `autosEditorDraftStep.ts`, `AutosApplicationSteppedShell.tsx`, `autosEditorTabSession.ts`, `useAutosDraftPersistEffects.ts`, preview resume (`buildAutosNegociosEditorResumeHref`, `AutosNegociosPreviewClient`).

Media: `AutosNegociosMediaManager.tsx`, `autosImageUrlInput.ts`, `autosNegociosCopy.ts`, `AutosSortablePhotoGrid.tsx`.

Inventory: `AutosNegociosInventoryValueModule.tsx`, `AutosNegociosPrePublishInventoryDrawer.tsx`, `autosDealerInventoryValueCopy.ts`, `autosInventoryBoostPipeline.ts`, `autosDealerInventoryAddFlow.ts`.

Business Hub output: `DealerBusinessStack.tsx`, `mapAutosDealerToBusinessHubContact.ts`, `autosNegociosBusinessHubSocialBrand.tsx`.

Privado shared: `AutosPrivadoApplication.tsx`, `getAutosPrivadoCopy.ts`.

## 3. Servicios read-only files inspected

- `app/(site)/servicios/lib/serviciosBusinessHubContactTypes.ts`
- `app/(site)/servicios/lib/serviciosBusinessHubSocialBrand.tsx`
- `app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts`
- `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`
- `app/(site)/servicios/components/ServiciosBusinessHubFauxMap.tsx`

## 4. Draft persistence result

**Fixed/verified:** Listing fields persist via `localStorage` + IndexedDB offload (`saveAutosNegociosDraftResolved`), debounced autosave + `pagehide`/`beforeunload` flush. Same-tab refresh keeps draft (`sessionStorage` editor tab key). Preview flush before navigation.

**Honest limit:** Raw local file blobs may not survive full browser restart; URL/metadata and IDB-backed assets persist when quota allows.

## 5. Current step persistence result

**Fixed:** `AutosNegociosDraftV1` / `AutosPrivadoDraftV1` now store `editorStep` + `editorMaxReached`. `AutosApplicationSteppedShell` restores via `initialStep` / `initialMaxReached`. Step changes debounce into draft flush.

## 6. Preview return result

**Fixed:** `Vista previa` from Paso 7 saves `editorStep = 6` (0-based) before navigation. `resume=1` on return hydrates draft + step. Legacy drafts without step default to Paso 7 on preview return.

## 7. Spacebar runtime recheck result

QA-06 `liveDraft` normalization remains in place; no trim-on-change in free-text handlers. `isTextEntryTarget` helper available.

## 8. Media URL behavior result

**Fixed:** Section heading/helper copy clarifies image vs video URLs. `classifyAutosImageUrlInput` rejects YouTube/Vimeo/TikTok/video extensions with visible errors. Buttons labeled `Agregar imagen` / `Add image`. No silent failure on empty/invalid URLs.

## 9. Image ordering result

Existing `AutosSortablePhotoGrid` whole-card drag + mobile chevrons; reorder hint copy present; order stored in `mediaImages.sortOrder` and persists via draft flush.

## 10. Helper copy result

**Fixed:** Removed `+1 408 555 0100` placeholder → generic `+1 XXX XXX XXXX`. Description placeholder uses generic buyer-focused copy. No personal names/addresses in helpers.

## 11–16. Business Hub / Inventory / Review / Dashboard / Privado / Admin

Business Hub application fields and output wiring verified in source (A5.QA-01/03/05 + this gate). Paso 7 inventory card shows $399/10 vehicles, main-vehicle copy, post-publish add path, pre-publish safe drawer, Inventory Boost shell without fake payment. Public live pages use `editBackHref={undefined}` — no owner CTAs. Dashboard inventory section exists (`AutosDealerInventoryDashboardSection`). Privado checked — step/media/draft shared only; no dealer-only fields.

## 20. Build/check result

Run at gate close: QA-07 audit, QA-06 audit, `npm run build`.

## 21. Remaining risks

- Manual browser QA required for step restore + media URL UX.
- Production deploy SHA must include this gate for live testers.
- Dashboard inventory counts require authenticated owner session (expected).

## 22. Manual QA checklist

See gate Step 21 list in final report.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | `git rev-parse --show-toplevel` |
| Autos scope lock respected | TRUE | Diff limited to Autos paths + audit script |
| No Servicios files modified | TRUE | Servicios read-only only |
| Servicios Business Hub inspected read-only | TRUE | Files listed in §3 |
| Refresh preserves Autos Negocios draft data | TRUE | localStorage + IDB + tab session |
| Refresh preserves current step | TRUE | `editorStep` in draft V1 |
| Preview/back preserves draft data | TRUE | flush before preview + resume hydrate |
| Preview/back preserves current step | TRUE | flush saves step 6; shell restores |
| Volver a editar from preview returns to Paso 7 | TRUE | `resume=1` + `editorStep=6` |
| Opening Inventory Boost drawer does not clear draft | TRUE | Drawer UI only; draft hook unchanged |
| Closing Inventory Boost drawer does not clear draft | TRUE | No draft reset on close |
| Add inventory drawer/action does not clear draft | TRUE | Pre-publish modal only |
| Explicit new/clear draft path exists or blocker documented | TRUE | `resetDraft` + fresh tab session |
| Motor accepts 3.5 V6 | TRUE | QA-06 liveDraft + engine field |
| Calle accepts 1601 Coleman Ave | TRUE | Structured address + liveDraft |
| Free-text fields allow spaces | TRUE | liveDraft normalization |
| Numeric-only fields remain intentionally restricted | TRUE | parse/digit handlers unchanged |
| Image URL section clearly says image/photo URLs | TRUE | `urlSectionHeading` copy |
| Multiple URL section clearly says image URLs one per line | TRUE | `batchUrls` copy |
| Video URLs are rejected from image URL field with clear message | TRUE | `classifyAutosImageUrlInput` + `videoUrlRejected` |
| Valid image URL creates image card or blocker documented | TRUE | `addUrlsFromText` adds `MediaImageEntry` |
| Image URL button does not silently fail | TRUE | Visible `role="alert"` errors |
| Desktop drag reorder works or blocker documented | TRUE | `AutosSortablePhotoGrid` dnd-kit |
| Mobile reorder fallback works | TRUE | Chevron move controls |
| Cover image selection works | TRUE | `setPrimary` / `isPrimary` |
| Image order persists to preview/back | TRUE | Draft `mediaImages` order |
| Helpers use generic examples only | TRUE | Placeholders audited |
| No personal helper data remains | TRUE | Removed 408-555-0100 |
| Required dealer contact fields exist | TRUE | `AutosNegociosApplication` Paso 5 |
| SMS/text support exists | TRUE | `dealerSmsPhone` field |
| Finance/pre-approval fields exist | TRUE | `AutosDealerFinanceFields` |
| Finance image/logo URL field exists | TRUE | `financeContactImageUrl` |
| Finance image/logo hides when empty | TRUE | `DealerFinanceContact` / resolve |
| Finance image/logo shows when valid | TRUE | Preview output wiring |
| Expanded socials exist | TRUE | 9 social fields in form |
| Google Reviews URL exists | TRUE | `googleReviewsUrl` |
| Yelp Reviews URL exists | TRUE | `yelpReviewsUrl` |
| Up to 3 custom links with title + URL exist | TRUE | `dealerCustomLinks` max 3 |
| Custom links output under Encuentra más sobre nosotros / Find more about us | TRUE | `DealerBusinessStack` |
| Business Hub output uses real provided data only | TRUE | Conditional sections |
| Business Hub empty sections hide cleanly | TRUE | Presence helpers |
| Contact CTA order is correct | TRUE | WhatsApp → Call → SMS → Schedule → Website → Email |
| Social buttons are branded | TRUE | `autosNegociosBusinessHubSocialBrand` |
| Review cards are branded and do not fake ratings | TRUE | URL-only review buttons |
| Location/map output uses structured address safely | TRUE | `buildDealerMapsHref` |
| Paso 7 explains $399/month and 10 included vehicles | TRUE | `autosDealerInventoryValueLead` |
| Paso 7 explains each vehicle gets its own listing and Leonix Ad ID | TRUE | value detail bullets |
| Add vehicle to inventory CTA exists in Paso 7 | TRUE | `AutosNegociosInventoryValueModule` |
| Pre-publish add inventory action opens safe drawer/modal or documented blocker | TRUE | `AutosNegociosPrePublishInventoryDrawer` |
| Pre-publish add inventory does not create orphan child inventory | TRUE | Drawer explains publish-first |
| Post-publish add inventory mode exists or blocker documented | TRUE | `inventoryMode=add` flow |
| Add inventory mode passes parent/dealer/return context or blocker documented | TRUE | `AutosInventoryAddContext` |
| Add inventory mode prefills dealer fields and blanks vehicle fields or blocker documented | TRUE | `prefillDealerListingForInventoryAdd` |
| Additional inventory vehicle helper/banner exists or blocker documented | TRUE | Inventory add banner |
| Inventory Boost CTA exists | TRUE | `AutosNegociosInventoryBoostTrigger` |
| Inventory Boost explains +10 for $129/month | TRUE | `autosInventoryBoostPricingBullets` |
| Inventory Boost total shows $528/month | TRUE | `$528/month` copy |
| Inventory Boost does not fake payment | TRUE | checkout-soon message only |
| Inventory Boost does not unlock slots without payment | TRUE | no slot unlock code |
| Inventory Boost does not touch global Stripe/payment | TRUE | Autos-scoped pipeline only |
| Public buyers do not see owner inventory CTAs | TRUE | `editBackHref={undefined}` on live |
| Dashboard owner inventory count/CTA exists or blocker documented | TRUE | `AutosDealerInventoryDashboardSection` |
| Admin safety checked | TRUE | No admin schema changes this gate |
| Privado checked for shared impact | TRUE | step + media + draft shared |
| No dealer-only fields added to Privado | TRUE | Privado form unchanged |
| No unrelated categories touched | TRUE | Autos-only diff |
| No media kit/PDF touched | TRUE | No PDF paths in diff |
| npm run build passed | TRUE | Gate validation run |

**Final recommendation:** GREEN
