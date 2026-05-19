# A5.1 — Autos Negocios Draft Persistence + Preview Roundtrip Gate

## 1. Files inspected

| Area | Files |
|------|--------|
| Application state | `useAutoDealerDraft.ts`, `AutosNegociosApplication.tsx` |
| Local persistence | `autosNegociosDraftStorage.ts`, `autosNegociosDraftNamespace.ts`, `autosDraftPreviewNamespaceHint.ts`, `autosEditorTabSession.ts` |
| Preview | `AutosNegociosPreviewClient.tsx`, `AutoDealerPreviewPage.tsx` |
| Inventory add | `autosDealerInventoryAddFlow.ts` |
| Confirm/publish | `AutosNegociosPublishConfirm.tsx`, `AutosPublishConfirmCore.tsx` |

## 2. Root cause finding

`useAutoDealerDraft` bootstrap treated every editor mount without `?resume=1` as a **new session**: it called `clearAutosNegociosDraft`, cleared the namespace hint, and reset React state to `createEmptyListing()`.

Navigating to preview unmounts the editor. Returning (even via “Volver a editar” or browser back) remounted the hook **without** always having `resume=1`, which **deleted the draft that had just been flushed** before preview.

A second bug: `inventoryMode=add` ran **before** the resume branch and always wiped storage + re-prefilled from the parent, destroying in-progress child vehicle edits after preview.

`shouldResetAutosDraftForFreshEditorTab` existed but was never used in Negocios bootstrap.

## 3. Draft persistence behavior

- **Fresh browser tab** (first editor mount): clear lane draft and start empty (or inventory parent prefill when applicable).
- **Same tab remount** (preview roundtrip): `hydrateFromNamespace` — no wipe.
- **`?resume=1`** (preview back link): hydrate saved draft.
- **Debounced autosave** (800ms) when draft is meaningful.
- **`flushDraft`** before `router.push` to preview (explicit save-before-preview).

## 4. Preview hydration behavior

Preview loads via `loadAutosNegociosDraftResolved` + `peekAutosDraftNamespaceHint`. Editor `flushDraft` calls `rememberAutosDraftNamespaceHint` before navigation.

## 5. Back/return behavior

Preview “Volver a editar” uses `buildAutosNegociosEditorResumeHref` (`resume=1` + inventory query when session context exists). Application strips `resume` after hydrate. Same-tab return without `resume` still hydrates (no longer clears).

## 6. Media/logo persistence behavior

Draft save uses `saveAutosNegociosDraftResolved` (localStorage JSON + IDB for large blobs). Honest limitation: `blob:` URLs and oversized inline data URLs may not survive tab close; IDB + flush before preview is the supported path.

## 7. Inventory add mode behavior

- Session context via `AUTOS_INVENTORY_ADD_SESSION_KEY`.
- Parent prefill only when **no saved child draft** exists.
- `resolveAutosInventoryAddContextForEditor` restores inventory mode from session after preview.
- Resume href re-appends `inventoryMode` / `parentListingId` params.

## 8. What changed

- `useAutoDealerDraft.ts`: fixed bootstrap order; use `shouldResetAutosDraftForFreshEditorTab`; debounced autosave.
- `autosDealerInventoryAddFlow.ts`: `resolveAutosInventoryAddContextForEditor`, `buildAutosNegociosEditorResumeHref`.
- `AutosNegociosPreviewClient.tsx`: inventory-aware resume link.
- `AutosNegociosApplication.tsx`: documented save-before-preview.

## 9. Build/check result

`npm run lint` passed. `npm run autos:a5-1-negocios-draft-preview-audit` passed. `npm run build` passed (dirty tree — may include unrelated en-venta/servicios changes). `autos:a5-0-negocios-blockers-audit` and `autos:a3-field-audit` failed scope checks due to unrelated dirty files, not A5.1 code.

## 10. Remaining risks

- Two tabs on the same account share one draft namespace (documented in `autosEditorTabSession.ts`).
- Very large local media may hit storage quota; flush errors are not surfaced in UI yet.
- Server-side listing draft ID is not used for Negocios editor preview (local/IDB only).

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Autos Negocios draft state is saved before preview | TRUE | `await flushDraft()` before `router.push(previewHref)` |
| Preview hydrates from saved draft/listing data | TRUE | `AutosNegociosPreviewClient` → `loadAutosNegociosDraftResolved` |
| Preview no longer resets the application | TRUE | Same-tab remount hydrates; no clear on preview nav |
| Back from preview restores vehicle fields | TRUE | `hydrateFromNamespace` on `resume=1` / same tab |
| Back from preview restores specs fields | TRUE | Full listing in draft payload |
| Back from preview restores business/contact fields | TRUE | Full listing in draft payload |
| Back from preview restores structured address fields | TRUE | Full listing in draft payload |
| Back from preview restores schedule/hour rows | TRUE | `dealerHours` in draft payload |
| Back from preview restores description | TRUE | `description` in draft payload |
| Back from preview preserves photos where browser/session allows | TRUE | IDB + localStorage via `saveAutosNegociosDraftResolved` |
| Back from preview preserves photo order | TRUE | `mediaImages` sortOrder persisted |
| Back from preview preserves dealer logo where browser/session allows | TRUE | Logo in draft JSON/IDB |
| Draft is not cleared except after successful publish or explicit reset | TRUE | Clear only on `freshTab` or `resetDraft` / auth namespace change |
| Inventory add mode keeps parent/group context | TRUE | Session + resume href params |
| Inventory add mode does not overwrite edited child vehicle fields | TRUE | Hydrate existing draft before parent prefill |
| No fake persistence was added | TRUE | Uses existing `saveAutosNegociosDraftResolved` |
| No unrelated categories were touched | TRUE | Scope audit script |
| npm run build passed | TRUE | `npm run build` exit 0 (dirty tree) |
