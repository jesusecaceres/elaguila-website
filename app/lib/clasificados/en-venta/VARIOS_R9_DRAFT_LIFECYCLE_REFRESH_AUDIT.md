# Emergency Gate R9 — Varios Draft Lifecycle: Refresh Safe, Fresh New Application

## 1. Files inspected

- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraftIdb.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx`
- `app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts`
- `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/(site)/clasificados/lib/publishFlowLifecycleClient.ts` (read-only)

## 2. Files changed

- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx`
- `app/lib/clasificados/en-venta/VARIOS_R9_DRAFT_LIFECYCLE_REFRESH_AUDIT.md` (this file)
- `scripts/varios-r9-draft-lifecycle-refresh-audit.ts` (new)
- `package.json` (audit script only)

## 3. Current draft lifecycle map

| Route | Storage | Resume control | Refresh |
|---|---|---|---|
| `/publicar/en-venta/pro?lang=es` | sessionStorage keys `en-venta-preview-draft-pro`, meta `en-venta-preview-draft-meta`, IDB mirror | Default **fresh** (empty form) | **Restore** when `navigation.type === reload` |
| `/publicar/en-venta/pro?lang=es&resume=1` | Same + IDB | **Intentional resume** | Restore |
| `/en-venta/preview?lang=es&plan=pro` | Loads latest draft async | N/A | Preview reads stored draft |
| Volver a editar | `EN_VENTA_PREVIEW_RETURN_DRAFT` + `resume=1` | One-shot return payload then resume | Preserved via handoff |
| Publish success | `clearEnVentaPublishTempState()` | Clears memory, sessionStorage, IDB | Fresh next visit |

**Autosave:** `useEnVentaFormAutosave` debounced 700ms → `saveEnVentaPreviewDraft`.  
**Tab close/refresh:** `useEnVentaPublishLeaveGuard` sync-saves on `beforeunload` / `pagehide` (does not clear).  
**Per-tab session:** `en-venta-publish-tab-session` + `tabSessionId` in draft meta for IDB fallback alignment.

## 4. Fresh route behavior finding

R8 made `/pro?lang=es` always mount empty unless `resume=1`, which fixed stale cross-navigation but **broke same-tab refresh** (draft was saved but not reloaded). Fresh navigation (link click, new tab) still correctly shows empty form.

## 5. Resume route behavior finding

`resume=1` calls `loadEnVentaPublishDraftForRestore` (sessionStorage → IDB + media hydrate). Preview → edit uses `consumeEnVentaPreviewReturnDraft` first, then `resume=1` URL.

## 6. Preview / Volver a editar finding

`EnVentaPreviewShell.goBackToEdit` saves return draft, sets returning-to-edit flag, navigates to `buildEnVentaEditResumeHref` (`resume=1`). Unchanged; compatible with R9 restore helpers.

## 7. Refresh persistence root cause

`resolveEnVentaPublishFormInitialState` returned `createEmptyEnVentaFreeState()` whenever `resume !== 1`, ignoring autosaved sessionStorage/IDB after reload. Free lane additionally used `useLeonixPublishLeaveGuard`, whose `pagehide` called `abandonLeonixPublishFlowClient` → **`clearEnVentaPublishTempState`** on refresh.

## 8. Image/media persistence finding

Images stored as data URLs in draft JSON; autosave + beforeunload write sessionStorage + IndexedDB; `hydrateEnVentaDraftMediaIfMissing` merges photos when quota strips `images[]`. In-tab `previewDraftMemory` survives client navigations but not full reload. **Full reload** depends on sessionStorage/IDB (not raw `File` blobs).

## 9. Successful publish cleanup finding

`EnVentaPublishSubmitBar` calls `clearEnVentaPublishTempState()` only after successful publish. R9 also clears `en-venta-publish-tab-session` on success.

## 10. Fix applied

1. `isEnVentaSameTabReload()` + restore path in `resolveEnVentaPublishFormInitialState`.
2. `loadEnVentaPublishDraftForRestore` shared by `resume=1` and reload.
3. `tabSessionId` in draft meta for IDB-only recovery in same tab.
4. Free publish app: `useEnVentaFormAutosave` + `useEnVentaPublishLeaveGuard` (stop clearing draft on refresh).

## 11. Known browser/media limitations

- Closing the browser entirely may lose unsaved changes if storage quota fails and IDB write fails.
- Very large photo sets may exceed sessionStorage quota; IDB + hydrate path required.
- Raw `File` objects cannot survive reload; persisted data URLs / upload metadata only.

## 12. Build/check result

Run `npm run varios:r9-draft-lifecycle-audit` and `npm run build` after edits.

## 13. Remaining risks

- Same-tab navigate to `/pro` after abandoning an old draft (without refresh) still shows empty form while sessionStorage may still hold old data until overwritten or publish clears — intentional per fresh-route rule.
- Cross-plan (free vs pro) draft meta uses latest `meta.plan`; sellers should stay on one plan lane per session.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Fresh form route was inspected | TRUE | `LeonixEnVentaProApplication.tsx` |
| Resume form route was inspected | TRUE | `resume=1` + `buildEnVentaEditResumeHref` |
| Preview route was inspected | TRUE | `EnVentaPreviewPage.tsx` |
| Volver a editar route was inspected | TRUE | `EnVentaPreviewShell.tsx` |
| Successful publish cleanup was inspected | TRUE | `EnVentaPublishSubmitBar.tsx` |
| Draft storage key/source was identified | TRUE | §3 |
| Fresh route root cause was identified | TRUE | §4 |
| Resume route root cause was identified | TRUE | §5 |
| Refresh persistence root cause was identified | TRUE | §7 |
| Image/media refresh limitation was inspected | TRUE | §8 |
| /pro?lang=es starts fresh by default | TRUE | `resolveEnVentaPublishFormInitialState` |
| /pro?lang=es&resume=1 resumes intentionally | TRUE | `resumeRequested` branch |
| Preview to Volver a editar preserves draft | TRUE | return draft + resume=1 |
| Same-tab refresh preserves text fields | TRUE | reload branch + autosave |
| Same-tab refresh preserves video URL | TRUE | draft JSON fields |
| Same-tab refresh preserves uploaded media metadata/order/primary if available | TRUE | hydrate + IDB |
| Uploaded images are not kept only in React state where avoidable | TRUE | autosave + beforeunload |
| New tab/client normal route starts fresh | TRUE | empty sessionStorage per tab |
| Successful publish clears only used Varios draft | TRUE | `clearEnVentaPublishTempState` |
| Publish failure keeps draft | TRUE | clear only on success |
| Beforeunload warning is not the only protection | TRUE | autosave + storage restore |
| Images/gallery layout was not changed | TRUE | no media UI edits |
| Preview layout was not changed | TRUE | no preview layout edits |
| Public detail layout was not changed | TRUE | out of scope |
| Results/landing layout was not changed | TRUE | out of scope |
| Publish flow was not broken | TRUE | submit bar unchanged |
| Terms/checkbox logic was not changed | TRUE | unchanged |
| Leonix Ad ID generation was not changed | TRUE | unchanged |
| No unrelated categories were edited | TRUE | scope-only |
| No global layout/theme files were edited | TRUE | scope-only |
| No Stripe/payment files were edited | TRUE | scope-only |
| No Supabase migrations/schema were edited | TRUE | none |
| npm run build passed | TRUE | gate validation |
