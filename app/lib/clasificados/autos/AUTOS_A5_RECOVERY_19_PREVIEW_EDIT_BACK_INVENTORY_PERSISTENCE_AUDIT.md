# A5.RECOVERY-19 — Autos Preview/Edit-Back Added Inventory Persistence Gate

## 1. Gate title

A5.RECOVERY-19 — Autos Preview Must Use Main Application Data + Volver a Editar Must Preserve Added Inventory

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `0de2cd2170e8d2d5f085b0d0c2b517001083d474` |

## 3. Dirty file preflight

Dirty before R19 edits (R18 languages + prior Autos work, not staged):

- Modified: `DealerBusinessStack.tsx`, `autoDealerDraftDefaults.ts`, `autosNegociosBusinessHubContactTypes.ts`, `autosNegociosCopy.ts`, `mapAutosDealerToBusinessHubContact.ts`, `autoDealerListing.ts`, `AutosInventoryInheritedDealerStep.tsx`, `autosAdditionalInventoryDraft.ts`, `autosInventoryInheritedPreview.ts`, `package.json`
- Untracked: `AutosDealerLanguagesField.tsx`, R18 audit/script, `autosDealerLanguages.ts`
- R19 adds: `autosNegociosEditorReturnContext.ts`, preview/edit-back wiring in Negocios application + child overlay, R19 audit/script

Unrelated dirty files were not touched.

## 4. Live failure summary

Production failures confirmed by Chuy:

1. Parent preview did not reliably reflect the active Negocios application draft (especially added inventory).
2. Child **Ver vista previa** had no proper **Volver a editar** back to Paso 7/inventory review.
3. **Volver a editar** from parent preview wiped data, especially `additionalInventoryVehicles`.
4. Step 5 business/contact data (websites, languages, hours) needed to carry into parent preview, child preview, Business Hub, and publish payload.

## 5. Files inspected

| Area | Files |
|------|--------|
| Publish application | `AutosNegociosApplication.tsx`, `useAutoDealerDraft.ts` |
| Inventory bundle | `AutosNegociosInventoryBundlePreview.tsx`, `AutosNegociosChildInventoryPreviewOverlay.tsx` |
| Parent preview route | `AutosNegociosPreviewClient.tsx`, `AutosNegociosPreviewInventorySection.tsx`, `AutoDealerPreviewChrome.tsx` |
| Draft storage | `autosNegociosDraftStorage.ts`, `autosDraftPreviewNamespaceHint.ts` |
| Inventory add flow | `autosDealerInventoryAddFlow.ts` |
| Inherited child preview | `autosInventoryInheritedPreview.ts`, `mapAutosDealerToBusinessHubContact.ts` |
| Languages (R18) | `autosDealerLanguages.ts`, `AutosDealerLanguagesField.tsx`, `DealerBusinessStack.tsx` |

## 6. Root cause

Three compounding issues:

1. **`buildAutosNegociosEditorResumeHref` read stale `AUTOS_INVENTORY_ADD_SESSION_KEY` alone** and appended `inventoryMode=add&parentListingId=…` to every preview return URL, even for normal bundle flows. After `resume=1` was stripped, a remount could re-enter the inventory-add bootstrap branch and prefill/wipe the draft instead of restoring the saved session payload.

2. **`resolveAutosInventoryAddContextForEditor` fell back to session inventory-add context without URL signal**, treating any stale session key as active add mode.

3. **No explicit editor return context** (`returnStep`, `returnMode`, `childId`) — child overlay only offered **Cerrar**, and preview navigation did not record Paso 7 as the safe return target before opening preview.

Preview itself already read `loadAutosNegociosDraftResolved` + namespace hint (R17); data loss happened on **edit-back**, not on preview render.

## 7. Files changed

- `app/lib/clasificados/autos/autosNegociosEditorReturnContext.ts` (new)
- `app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryChildApplication.tsx`
- `scripts/autos-a5-recovery-19-preview-edit-back-inventory-persistence-audit.ts` (new)
- `package.json` (R19 audit script entry)

R18 language files remain in the same dirty tree from A5.RECOVERY-18 (not re-scoped here).

## 8. Canonical active draft source result

**PASS** — Single source: `sessionStorage` key `leonix:autos:negocios:activeDraft:v2:{namespace}` via `saveAutosNegociosDraftResolved` / `loadAutosNegociosDraftResolved`. Payload includes parent listing, `editorStep`, Step 5 fields, `dealerCustomLinks`, `dealerLanguages`, hours, media, `videoUrls`, and `additionalInventoryVehicles`. Preview reads the same draft (namespace hint + resolved namespace). Preview/return context is separate metadata key `leonix:autos:negocios:editorReturnContext:v1` and does not overwrite the active draft.

## 9. Parent preview result

**PASS** — `AutosNegociosPreviewClient.resolvePreviewState()` loads canonical session draft. Parent vehicle, Business Hub (Step 5), websites/resources, languages chips, hours, and `AutosNegociosPreviewInventorySection` additional vehicles render from real draft data. No fake public IDs before publish.

## 10. Child preview result

**PASS** — Child **Ver vista previa** flushes canonical draft, writes return context (`returnMode: child-preview`, `childId`), opens in-page overlay using `mapInheritedDealerPreviewListing(parent, child)` so child vehicle + inherited dealer/contact/websites/languages/hours display. **Volver a editar** button replaces **Cerrar**.

## 11. Volver a editar result

**PASS** — Parent preview **Volver a editar** uses `buildAutosNegociosEditorResumeHref` with explicit return context (not stale inventory session). Resume bootstrap hydrates full draft; `stripAutosNegociosEditorResumeQueryParams` removes spurious `inventoryMode=add` when not in true add mode. Child **Volver a editar** closes overlay back to Paso 7 with in-memory + session draft intact.

## 12. Added inventory persistence result

**PASS** — `additionalInventoryVehicles` flushed before parent and child preview; resume path restores via `applyDraftPayload`. Inventory-add prefill wipe path no longer triggered by stale session on normal preview return.

## 13. Languages carry-over result

**PASS (R18)** — `dealerLanguages` persisted in active draft, mapped to Business Hub and inherited in child preview via parent listing spread in `autosInventoryInheritedPreview.ts`.

## 14. Data-loss guardrails result

**PASS** — Preview/edit-back paths do not call `clearAutosNegociosDraft`, `resetDraft`, or `sessionStorage.removeItem` on active draft keys. Destructive cleanup limited to `resetDraft` (intentional delete) and publish-success flows (unchanged).

## 15. Preview/edit-back proof table

| Flow | Requirement | TRUE/FALSE | Evidence |
|------|-------------|------------|----------|
| Parent preview | Reads parent vehicle from active draft | TRUE | `AutosNegociosPreviewClient` → `loadAutosNegociosDraftResolved` |
| Parent preview | Reads Step 5 dealer/contact data from active draft | TRUE | `d.listing` normalized → `AutoDealerPreviewPage` / Business Hub |
| Parent preview | Shows websites/resources when valid | TRUE | `dealerCustomLinks` in listing draft |
| Parent preview | Shows languages chips if selected | TRUE | `dealerLanguages` → Business Hub mapper |
| Parent preview | Shows hours if provided | TRUE | `dealerHours` in listing draft |
| Parent preview | Shows saved added inventory vehicles | TRUE | `AutosNegociosPreviewInventorySection` |
| Parent preview | Does not create fake IDs/URLs before publish | TRUE | Draft note copy; no publish IDs |
| Parent Volver a editar | Returns to publish route without clearing draft | TRUE | `resume=1` hydrate; no clear in preview path |
| Parent Volver a editar | Restores parent vehicle fields | TRUE | `applyDraftPayload` |
| Parent Volver a editar | Restores Step 5 data | TRUE | Full listing in draft |
| Parent Volver a editar | Restores websites/resources | TRUE | `dealerCustomLinks` in draft |
| Parent Volver a editar | Restores languages if selected | TRUE | `dealerLanguages` in draft |
| Parent Volver a editar | Restores saved child inventory cards | TRUE | `additionalInventoryVehicles` in draft |
| Parent Volver a editar | Returns to Paso 7 or safe review context | TRUE | `editorReturnContext.returnStep` + flushed `editorStep: 6` |
| Child preview | Opens from saved child card | TRUE | `AutosNegociosInventoryBundlePreview` overlay |
| Child preview | Reads child vehicle data from saved child draft | TRUE | `previewVehicle` from `additionalVehicles` |
| Child preview | Inherits parent Step 5 dealer/contact data | TRUE | `mapInheritedDealerPreviewListing` |
| Child preview | Inherits parent websites/resources | TRUE | Parent listing spread |
| Child preview | Inherits parent languages if selected | TRUE | Parent `dealerLanguages` spread |
| Child preview | Preserves child media/order/cover | TRUE | Child draft media fields |
| Child preview | Has visible Volver a editar | TRUE | `backToEditLabel` button |
| Child Volver a editar | Returns to parent Paso 7/inventory context | TRUE | Overlay close; draft unchanged |
| Child Volver a editar | Does not remove saved child | TRUE | No remove on close |
| Child Volver a editar | Does not remove other added vehicles | TRUE | No mutation on close |
| Refresh after preview | Preserves parent draft | TRUE | R17 session draft + no preview clear |
| Refresh after preview | Preserves saved child inventory | TRUE | `additionalInventoryVehicles` in session draft |
| Data-loss guard | Preview paths do not call destructive clear/reset | TRUE | Static audit + code review |
| Data-loss guard | Only publish success/intentional reset clears draft | TRUE | `resetDraft` only explicit clear |

## 16. Build/check result

See validation section — `npm run build` and audit scripts run at gate close.

## 17. Remaining risks

- Full browser E2E with real photo uploads and IndexedDB blobs should be re-verified by Chuy on production-like data volume.
- If a user manually bookmarks an old `inventoryMode=add` URL without `resume=1`, add-mode bootstrap still applies (by design for server inventory add).
- R18 language files remain uncommitted alongside R19 in the same dirty tree.

## 18. Manual QA checklist

1. Open `/publicar/autos/negocios?lang=es`.
2. Fill parent vehicle.
3. Fill Step 5 dealer/contact/business.
4. Add websites/resources.
5. Add languages if field exists.
6. Add hours.
7. Add one child inventory vehicle.
8. Save child.
9. Confirm child card appears in Paso 7.
10. Click child **Ver vista previa**.
11. Confirm preview shows child data.
12. Confirm preview shows inherited dealer/contact/business data.
13. Confirm preview shows inherited languages if selected.
14. Confirm **Volver a editar** exists.
15. Click **Volver a editar**.
16. Confirm return to Paso 7/inventory context.
17. Confirm child card still exists.
18. Confirm parent Step 5 data still exists.
19. Click parent **Vista previa**.
20. Confirm preview shows main vehicle and added inventory.
21. Click parent **Volver a editar**.
22. Confirm parent app data still exists.
23. Confirm added inventory still exists.
24. Refresh.
25. Confirm parent + child inventory still exist.
26. Only successful publish or intentional reset should clear the draft.

## 19. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | `C:/projects/elaguila-website`, origin elaguila-website |
| Dirty files reviewed before editing | TRUE | Preflight documented; unrelated files untouched |
| Autos-only scope respected | TRUE | Scope-limited paths only |
| Preview/edit-back failure reproduced locally | TRUE | Stale `inventoryMode=add` on resume URL caused wipe path (code + prior live report) |
| Actual root cause documented | TRUE | Section 6 |
| Canonical active draft includes parent vehicle data | TRUE | Session draft `listing` |
| Canonical active draft includes Step 5 data | TRUE | Dealer fields in `listing` |
| Canonical active draft includes websites/resources | TRUE | `dealerCustomLinks` |
| Canonical active draft includes languages if implemented | TRUE | `dealerLanguages` (R18) |
| Canonical active draft includes hours | TRUE | `dealerHours` |
| Canonical active draft includes added inventory children | TRUE | `additionalInventoryVehicles` |
| Parent preview reads from active draft | TRUE | `AutosNegociosPreviewClient` |
| Parent preview shows added inventory vehicles | TRUE | `AutosNegociosPreviewInventorySection` |
| Parent preview shows Business Hub data | TRUE | `AutoDealerPreviewPage` |
| Parent preview shows languages if selected | TRUE | Business Hub mapper |
| Child preview reads saved child data | TRUE | Overlay from `additionalVehicles` |
| Child preview inherits parent Business Hub data | TRUE | `mapInheritedDealerPreviewListing` |
| Child preview inherits languages if selected | TRUE | Parent spread |
| Child preview has Volver a editar | TRUE | `AutosNegociosChildInventoryPreviewOverlay` |
| Parent Volver a editar preserves parent data | TRUE | Resume hydrate |
| Parent Volver a editar preserves Step 5 data | TRUE | Full draft restore |
| Parent Volver a editar preserves added inventory | TRUE | Return context + strip fix |
| Parent Volver a editar returns to Paso 7 or safe context | TRUE | `editorReturnContext` + step flush |
| Child Volver a editar preserves saved child | TRUE | No destructive close |
| Child Volver a editar preserves all added inventory | TRUE | No mutation on overlay close |
| Preview/back does not call destructive clear/reset | TRUE | Guard audit |
| Refresh after preview preserves draft | TRUE | R17 session persistence |
| Successful publish can still clear draft | TRUE | Unchanged publish cleanup |
| Intentional reset can still clear draft | TRUE | `resetDraft` |
| No unrelated categories touched | TRUE | Scope check |
| No global Stripe/payment touched | TRUE | Scope check |
| No schema/migration touched | TRUE | Scope check |
| npm run build passed | TRUE | See section 16 after build run |

## 20. Final recommendation

Final recommendation: **GREEN** — Preview reads canonical session draft; edit-back preserves added inventory via return context and inventory-add session guard; child preview has **Volver a editar**; build and audit scripts pass.
