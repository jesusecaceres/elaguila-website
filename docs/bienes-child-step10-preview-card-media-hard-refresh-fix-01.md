# Bienes Child Step 10 Preview Card — Hard Refresh Media Source Fix

## Executive Summary

Child inventory editor Step 3 showed photos and video URLs after same-tab hard refresh, but Step 10 “Property preview” card showed **No photo**. Parent inventory cards and main preview showed the correct cover and photo count after save. This gate adds a **canonical live child preview draft builder** that prefers current editor media, falls back to saved draft + media bridge, and resolves IndexedDB photo refs before the Step 10 card and full child preview overlay render.

## Task Classification

**SCOPED GATED BUILD** — Bienes Raíces negocio / agente individual child inventory Step 10 preview-card media source fix only.

## User Browser Proof

1. Step 3: photos visible after hard refresh.
2. Step 3: video URLs visible after hard refresh.
3. Step 10: small Property preview card showed **No photo**.
4. After save: parent inventory card showed child cover + **5 photos**.
5. Main preview route showed same child card with image + **5 photos**.

Conclusion: child media was not lost globally; Step 10 read a weaker/stale path than Step 3 and parent cards.

## Files Inspected

- `BrNegocioChildInventoryFullApplication.tsx`
- `BrNegocioPrePublishInventoryShell.tsx`
- `brNegocioInventoryDraftPersistence.ts`
- `brNegocioChildInventoryFormMapping.ts`
- `brNegocioAdditionalInventoryDraft.ts`
- `brNegocioInventoryCardModel.ts`
- `brNegocioChildInventoryEditorSession.ts`
- `brAgenteResDraftMedia.ts`

## Files Changed

- `brNegocioChildInventoryFormMapping.ts` — `buildLiveChildInventoryPreviewDraft`, improved session/draft photo merge
- `BrNegocioChildInventoryFullApplication.tsx` — Step 10 card + overlay wired to canonical draft; IDB resolve hook
- `brNegocioChildInventoryEditorSession.ts` — `resolveChildPropertySliceMediaFromIdb`, IDB detection helper
- `docs/bienes-child-step10-preview-card-media-hard-refresh-fix-01.md`
- `scripts/verify-bienes-child-step10-preview-card-media-hard-refresh-fix-01.mjs`
- `package.json` — verifier script entry

## Root Cause

After hard refresh:

- Step 3 reads live `state.fotosDataUrls` (rehydrated from child editor session + IndexedDB via `loadChildInventoryEditorSessionResolved`).
- Step 10 previously built `previewDraft` via `childInventoryDraftFromEditorState` → `mergeChildInventoryWithMediaBridge` only.
- The in-memory `childInventoryMediaBridge` is cleared on refresh, so bridge merge could not restore `data:` blobs.
- When editing an existing child, `initialDraft` from parent storage is **session-stripped** (no `data:` blobs). The old preview path did not apply the same `mergeChildEditorSessionWithDraft` logic used at editor boot, so live editor photos could lose to an empty/stale saved draft during `syncChildInventoryDraftMedia` / `isDurablePhotoUrl` filtering.
- IndexedDB refs (`__LX_BR_AGENTE_IDB__|…`) in editor state are not displayable URLs; card model `safePhotoUrl` rejects them unless inlined first.

## Step 3 Media Source

- Live React editor state: `state.fotosDataUrls`, `state.fotoPortadaIndex`, `state.videoUrls`, `state.videoUrl`, `state.tourUrl`, `state.brochureUrl`, `state.listadoUrl`.
- Persisted via `persistChildInventoryEditorSession` → sessionStorage (HTTP-only) + IndexedDB offload (`MAIN_PHOTO` segment).
- Reload via `loadChildInventoryEditorSessionResolved` → `inlineBrAgenteResHeavyMediaFromIdb`.

## Step 10 Old Preview Card Source

```text
previewDraft = childInventoryDraftFromEditorState(parentHub, state, initialDraft)
hydratedPreviewDraft = mergeChildInventoryWithMediaBridge([previewDraft])[0]
previewCard = mapAdditionalDraftToInventoryCard(hydratedPreviewDraft)
```

This skipped boot-time `mergeChildEditorSessionWithDraft` and could not restore blobs after refresh.

## New Canonical Preview Draft Source

```text
buildLiveChildInventoryPreviewDraft({ parentHub, state, initialDraft, lang })
  → childInventoryDraftFromEditorState (stable id + live fields)
  → mergeChildEditorSessionWithDraft(live slice, hydrated initialDraft OR editor draft)
  → applyLiveChildEditorFieldsToPreviewDraft
  → mergeChildInventoryWithMediaBridge
  → syncChildInventoryDraftMedia

If editor slice still has IDB refs:
  resolveChildPropertySliceMediaFromIdb(slice) → rebuild preview with inlined photos
```

Step 10 card and full child preview overlay both use `canonicalPreviewDraft`.

Save flow unchanged: still uses `childInventoryDraftFromEditorState` directly.

## Hard Refresh Behavior

- Child editor session survives refresh (sessionStorage + IndexedDB).
- Step 3 continues to show photos/videos from rehydrated editor state.
- Step 10 now uses the same canonical builder as boot merge logic, plus async IDB inline when refs remain.
- Parent cards after save still use `mergeChildInventoryWithMediaBridge` on saved items (unchanged).

## What Was Not Touched

- Stripe / Revenue OS / webhooks
- Supabase migrations / schema / RLS
- Auth, admin, dashboard
- Public results / public detail polish
- Autos, Restaurantes, Servicios, Rentas, En Venta, Empleos, unrelated categories
- `.env` / secrets

## Manual QA Checklist

- [ ] Open Bienes negocio/agente application.
- [ ] Accept Inventory Pack.
- [ ] Add/edit child property.
- [ ] Add 5 child photos.
- [ ] Add 4 video URLs.
- [ ] Hard refresh while still in child editor.
- [ ] Confirm Step 3 still shows all 5 photos and 4 video URLs.
- [ ] Go to Step 10.
- [ ] Confirm Property preview card shows cover image.
- [ ] Confirm card shows 5 photos or equivalent.
- [ ] Click Preview this property.
- [ ] Confirm full child preview shows same media.
- [ ] Save property.
- [ ] Confirm parent final step child card shows same cover and 5 photos.
- [ ] Open main preview.
- [ ] Confirm inventory child card shows same cover and 5 photos.
- [ ] Do not publish until this passes.

## Remaining Risks

- Brief Step 10 flash of “No photo” if IDB inline is still resolving (async); should settle within one frame cycle after IDB read.
- Cross-tab hard refresh cannot restore in-memory media bridge; relies on IndexedDB + sessionStorage pattern (same as parent media).
- New unsaved child still generates a local draft id on first save only; preview before first save depends on editor session, not parent `initialDraft`.
