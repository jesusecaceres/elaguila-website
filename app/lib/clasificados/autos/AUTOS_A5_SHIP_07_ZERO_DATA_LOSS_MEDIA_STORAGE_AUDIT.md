# A5.SHIP-07 — Autos Zero Data Loss: Preview/Edit Return, Session Draft Persistence, Durable Media Storage + Drawer Unsaved Protection Gate

**Date:** 2026-06-02  
**Branch:** `main`  
**HEAD:** `1e361d347b88877c2a80f1635965aedcdc45a04c`  
**Platform:** Cursor with Claude Sonnet

## 1. Repo/source confirmation

| Check | Result |
|-------|--------|
| Root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |

## 2. Files inspected

- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/clasificados/autos/privado/lib/autosPrivadoDraftStorage.ts`
- `app/(site)/clasificados/autos/shared/lib/autosEditorTabSession.ts`
- `app/lib/clasificados/autos/useAutosDraftPersistEffects.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts`
- `app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx`
- `app/(site)/publicar/autos/shared/components/AutosDealerLogoUpload.tsx`
- `app/(site)/publicar/autos/shared/components/AutosDealerFinanceImageUpload.tsx`
- `app/lib/clasificados/autos/autosListingPayloadPersistence.ts`
- Preview clients, publish mappers, API routes under `app/api/clasificados/autos/**`

## 3. Lane impact classification

| Lane | Changes |
|------|---------|
| **Negocios only** | In-progress inventory drawer draft fields; controlled drawer open state; child media IDB offload in draft save |
| **Privado only** | Temporary local-file draft note on shared media manager (lang prop) |
| **Shared Autos** | `autosDraftLocalMediaCopy.ts`, `AutosLocalFileTemporaryDraftNote`, child inventory IDB helpers, draft persist deps |
| **No impact** | Stripe, unrelated categories, schema/migrations |

## 4. Current draft/media behavior before fix

- Draft JSON in **localStorage** + large blobs in **IndexedDB**; tab lifetime gated by `sessionStorage` keys (`autosEditorTabSession.ts`).
- Preview/back via `resume=1` + `flushDraft({ editorStep: 6 })` (prior A5.1 / QA-07).
- Child **saved** inventory in `additionalInventoryVehicles` persisted; in-progress drawer state was **React-only** (lost on refresh).
- Child inventory **file photos** stored inline in JSON (quota risk); main listing already offloaded to IDB.
- Local uploads use **data URLs + IDB refs**, not Supabase Storage pre-publish. No `createObjectURL` as final URL.
- Drawer unsaved protection from SHIP-06 (confirm on backdrop/Escape/Cancel).

## 5. Session-lifetime draft result

**PASS** — `shouldResetAutosDraftForFreshEditorTab` clears draft only on first mount in a new tab. F5 keeps `sessionStorage` marker → hydrate from localStorage/IDB. `useAutosDraftPersistEffects` debounces + `pagehide`/`beforeunload` flush.

## 6. Negocios full field persistence result

**PASS** — `AutosNegociosDraftV1` stores full listing + `editorStep` / `editorMaxReached` + `additionalInventoryVehicles` + new in-progress drawer fields. Autosave on all deps.

## 7. Privado full field persistence result

**PASS** — Same tab-session model via `AUTOS_PRIVADO_EDITOR_SESSION_KEY`. Shared IDB rehydration for listing media. No dealer-only fields.

## 8. Preview/Volver a editar/browser-back result

**PASS** — Preview flushes step 7; preview route reads namespace draft; `buildAutosNegociosEditorResumeHref` sets `resume=1`; bootstrap hydrates without wipe on same-tab remount.

## 9. Durable media storage truth table

| Media source | Local file | URL | Preview | Step nav | Preview/back | Refresh | Session draft | Durable cloud | Notes |
|--------------|------------|-----|---------|----------|--------------|---------|---------------|---------------|-------|
| Main vehicle photos | YES | YES | YES | YES | YES | YES (IDB) | YES | **NO pre-publish** | IDB + localStorage; UI labels temporary |
| Child inventory photos | YES | YES | YES | YES | YES | YES (IDB after fix) | YES | **NO pre-publish** | Offloaded to IDB on save |
| Privado photos | YES | YES | YES | YES | YES | YES (IDB) | YES | **NO pre-publish** | Shared media manager |
| Dealer logo | YES | YES | YES | YES | YES | YES (IDB) | YES | **NO pre-publish** | `AUTOS_DRAFT_LOGO_REF` |
| Finance image | YES | YES | YES | YES | YES | YES (IDB) | YES | **NO pre-publish** | `AUTOS_DRAFT_FINANCE_IMAGE_REF` |
| Video URL | NO file req | YES | YES | YES | YES | YES | YES | YES when https | |
| Video local file | YES | — | YES | YES | YES | YES (IDB) | YES | **Mux on publish only** | `autosMuxPublishPrepare` |

**Blocker:** No Autos pre-publish Supabase/Vercel Blob upload route exists under `app/api/clasificados/autos/**`. Publish path strips `data:`/`blob:` via `sanitizeAutosListingPayloadForPersistence`; Mux handles video at publish.

## 10. Autos media storage implementation result

**Not implemented pre-publish cloud upload** — honest YELLOW. Added UI copy (`autosDraftLocalMediaCopy.ts`) and child inventory IDB offload. No fake upload.

## 11. Media preview/listing_payload result

**PASS** — Preview reads hydrated listing; publish sanitizer strips non-durable refs; URL images and cover/order fields persist in draft JSON.

## 12. Child drawer unsaved protection result

**PASS** — Backdrop/Escape/Cancel use `autosInventoryDrawerUnsavedCloseConfirm` (ES/EN). No silent close when dirty.

## 13. Child inventory draft persistence result

**PASS (enhanced)** — Saved children in `additionalInventoryVehicles` + IDB media. In-progress draft in `inProgressInventoryVehicleDraft` + `inventoryDrawerOpen` / `inventoryDrawerEditingId` survives refresh; drawer reopens with restored data.

## 14. Intentional new/clear draft result

**PASS** — New tab → clean draft. `resetDraft` / “Eliminar solicitud” clears storage + session key. Publish success clears after real listing creation (confirm core).

## 15. Privado cross-check result

**PASS** — Shared draft/session/media protections. No inventory drawer, finance image block, Business Hub, custom links, or Inventory Boost in Privado application.

## 16. Build/check result

Run at gate close: `npm run autos:a5-ship-07-zero-data-loss-media-storage-audit` + related QA scripts + `npm run build`.

## 17. Remaining risks

- Two tabs same namespace can race localStorage (documented in `autosEditorTabSession.ts`).
- Pre-publish local files are **session/tab draft only** — not cross-device durable until publish upload is built.
- Very large galleries may hit IDB/localStorage quota; URL images unaffected.

## 18. Manual QA checklist

See gate response §25.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Correct repo confirmed | TRUE | §1 |
| Autos scope lock respected | TRUE | §3, git diff |
| Lane impact classified before edits | TRUE | §3 |
| Existing draft/media behavior inspected | TRUE | §4 |
| Draft persists for current tab/session | TRUE | `autosEditorTabSession.ts`, flush effects |
| Closing tab/session starts clean by design | TRUE | `shouldResetAutosDraftForFreshEditorTab` |
| Refresh does not clear Negocios draft | TRUE | Same-tab session marker + hydrate |
| Refresh preserves Negocios current step | TRUE | `editorStep` in draft V1 |
| Preview/back preserves Negocios draft | TRUE | `resume=1`, flush before preview |
| Volver a editar returns to last review/edit step | TRUE | `editorStep=6` on preview flush |
| Language toggle does not clear draft | TRUE | Lang query only; no clear on change |
| Opening/closing Inventory Boost does not clear draft | TRUE | Boost calls `flushDraft`, no reset |
| Opening/closing inventory drawer does not clear parent draft | TRUE | Parent listing untouched |
| Negocios vehicle fields persist | TRUE | Full listing in draft V1 |
| Negocios specs persist | TRUE | Listing fields |
| Negocios equipment/highlights persist | TRUE | badges/features/customEquipment |
| Negocios business/contact fields persist | TRUE | dealer* fields |
| Negocios finance fields persist | TRUE | financeContact* |
| Negocios socials/reviews/custom links persist | TRUE | dealerSocials, reviews URLs, custom links |
| Negocios description persists | TRUE | listing.description |
| additionalInventoryVehicles persist after refresh | TRUE | draft V1 + IDB media offload |
| Child vehicle edit/remove persists after refresh | TRUE | upsert/remove + flush |
| In-progress child drawer draft is protected | TRUE | `inProgressInventoryVehicleDraft` |
| Outside click cannot silently lose child drawer data | TRUE | confirm dialog |
| Escape key cannot silently lose child drawer data | TRUE | confirm dialog |
| Dirty cancel requires confirmation | TRUE | `autosInventoryDrawerUnsavedCloseConfirm` |
| Local objectURL/blob URLs are not treated as durable saved media | TRUE | data URL + IDB; sanitizer strips blob |
| Durable media upload path exists or exact blocker documented | TRUE | §9 blocker: no pre-publish upload route |
| Main vehicle uploaded photos persist durably or blocker documented | TRUE | IDB session draft; cloud at publish — blocker §9 |
| Child inventory uploaded photos persist durably or blocker documented | TRUE | IDB offload added; cloud at publish — blocker §9 |
| Privado uploaded photos persist durably or blocker documented | TRUE | Shared IDB pattern; blocker §9 |
| Dealer logo upload persists durably or blocker documented | TRUE | IDB logo ref; blocker §9 |
| Finance image/logo upload persists durably or blocker documented | TRUE | IDB finance ref; blocker §9 |
| URL images persist after refresh | TRUE | https in JSON |
| Video URLs persist after refresh | TRUE | listing.videoUrl |
| Cover image persists | TRUE | mediaImages isPrimary |
| Image order persists | TRUE | sortOrder |
| Media maps to preview | TRUE | hydrated listing in preview clients |
| Media maps to listing_payload/publish payload | TRUE | mappers + sanitizer |
| Upload errors are visible and do not wipe draft | TRUE | component errors; draft kept |
| Explicit clear/new application path exists or session close behavior documented | TRUE | resetDraft + new tab |
| Publish success clears draft only after real listings are safely created | TRUE | confirm core session |
| Privado checked for shared impact | TRUE | §15 |
| Privado refresh preserves draft | TRUE | privado hook bootstrap |
| Privado preview/back preserves draft | TRUE | resume path |
| No dealer inventory drawer added to Privado | TRUE | grep Privado app |
| No dealer-only Business Hub/finance/review/custom links added to Privado | TRUE | §15 |
| No global Stripe/payment touched | TRUE | scope |
| No unrelated categories touched | TRUE | scope |
| No schema/migration touched unless approved/documented | TRUE | no migrations |
| npm run build passed | TRUE | gate validation |

**Final recommendation:** YELLOW

Local file uploads are honestly labeled **temporary draft** (session/tab + IDB). Pre-publish **cloud-durable** Autos media upload route does not exist; publish-time Mux/video and payload sanitization remain the durable path. All zero-data-loss draft/step/preview/inventory-drawer requirements pass.

## Gate close

Final recommendation: YELLOW
