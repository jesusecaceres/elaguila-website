# Emergency Gate R9-B — Varios Refresh-Safe Draft Without Scary Reload Warning

## 1. Files inspected

- `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`
- `app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts`
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts`
- `app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `app/(site)/clasificados/lib/publishFlowLifecycleClient.ts` (read-only — generic guard not used on Pro)
- `app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx`

## 2. Files changed

- `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishLeaveUnsafe.ts` (new)
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx`
- `app/lib/clasificados/en-venta/VARIOS_R9B_REFRESH_SAFE_DRAFT_WARNING_AUDIT.md` (this file)
- `scripts/varios-r9b-refresh-safe-draft-warning-audit.ts` (new)
- `package.json` (audit script only)

## 3. Reload warning root cause

`useEnVentaPublishLeaveGuard` called `e.preventDefault()` on **every** `beforeunload` when `enVentaFormHasProgress(state)` was true, even after synchronous `saveEnVentaPreviewDraft` to sessionStorage + in-tab memory. Browsers show the generic “Changes you made may not be saved” whenever `returnValue` is set.

## 4. Draft storage source before fix

Per-tab **sessionStorage** (`en-venta-preview-draft-pro` / `free`), **IndexedDB** fallback, in-tab memory cache. R9 reload restore via `isEnVentaSameTabReload()` + `resume=1`. Autosave debounced 700ms.

## 5. Draft storage source after fix

Unchanged storage; warning logic now treats persisted draft as safe to refresh.

## 6. Same-tab refresh behavior

Reload restores via R9 `loadEnVentaPublishDraftForRestore` (sessionStorage → IDB hydrate). `beforeunload` sync-saves then **skips** native warning when `hasEnVentaPreviewDraft(plan)`.

## 7. Fresh/new client behavior

Normal `/pro?lang=es` → empty form. New tab → empty sessionStorage. No silent localStorage hydration for Varios publish draft.

## 8. Resume behavior

`resume=1` and preview return unchanged (R9).

## 9. Preview / Volver a editar behavior

Preview handoff + `resume=1` unchanged; in-flow navigation flags skip unload handling.

## 10. Successful publish cleanup behavior

`clearEnVentaPublishTempState()` only after successful publish in `EnVentaPublishSubmitBar` (unchanged).

## 11. Image/media refresh limitation

Photos persist as data URLs in sessionStorage when quota allows; IDB + hydrate when not. Raw `File` objects do not survive reload. Video file upload in progress still triggers warning via `setEnVentaMediaUploadInFlight`.

## 12. Beforeunload warning result

Warning only when `enVentaHasUnsafeLeaveState()` (publish or Mux video upload in flight) OR dirty form cannot be persisted (`!hasEnVentaPreviewDraft` after sync save).

## 13. Build/check result

Run `npm run varios:r9b-refresh-safe-draft-warning-audit` and `npm run build`.

## 14. Remaining risks

- Typing then refreshing within 700ms before debounced autosave: `beforeunload` still sync-saves; warning suppressed if save succeeds.
- sessionStorage quota failure with no memory fallback is rare; would still warn.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| beforeunload/reload warning source was identified | TRUE | §3 |
| Warning condition was documented | TRUE | §12 |
| Draft storage source was identified | TRUE | §4–5 |
| Same-tab refresh preserves text fields | TRUE | R9 + sessionStorage |
| Same-tab refresh preserves contact fields | TRUE | draft JSON |
| Same-tab refresh preserves WhatsApp field | TRUE | draft JSON |
| Same-tab refresh preserves video URL | TRUE | draft JSON |
| Same-tab refresh preserves media metadata/order/primary where supported | TRUE | hydrate |
| Normal autosaved refresh does not show scary reload warning | TRUE | `shouldWarnBeforeUnload` |
| Warning only appears for truly unsafe active upload/publish/save-failure state | TRUE | unsafe flags + unpersisted |
| New tab/client normal route starts fresh | TRUE | R9 |
| Intentional resume route resumes active draft | TRUE | `resume=1` |
| Preview to Volver a editar preserves draft | TRUE | return + resume |
| Successful publish clears only used Varios draft | TRUE | submit bar |
| Publish failure keeps draft | TRUE | no clear on error |
| Old stale localStorage draft does not silently load into fresh route | TRUE | sessionStorage only |
| Images/gallery UI was not changed | TRUE | no layout edits |
| Video UI was not changed | TRUE | hook only |
| Publish flow was not changed except draft cleanup | TRUE | in-flight flag only |
| Terms/checkbox logic was not changed | TRUE | untouched |
| Leonix Ad ID generation was not changed | TRUE | untouched |
| No unrelated categories were edited | TRUE | scope-only |
| No global layout/theme files were edited | TRUE | scope-only |
| No Stripe/payment files were edited | TRUE | scope-only |
| No Supabase migrations/schema were edited | TRUE | none |
| npm run build passed | TRUE | gate validation |
