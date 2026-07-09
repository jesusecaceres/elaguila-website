# Bienes Child Inventory Preview Media + Navigation Truth — Gate 01

## Executive Summary

Child full preview showed title/details but not photos because the parent inventory shell passed a **raw** draft to preview while the edit path used **media-bridge hydration**. This gate aligns preview with edit hydration and adds explicit overlay CTAs (close, edit, continue/save-return) — removing dead `editHref="#"`.

## Task Classification

**SCOPED GATED BUILD** — Bienes negocio/agente child inventory preview media + navigation truth fix.

## Files Inspected

- `BrNegocioChildInventoryFullPreviewOverlay.tsx`
- `BrNegocioPrePublishInventoryShell.tsx`
- `BrNegocioChildInventoryFullApplication.tsx`
- `brNegocioChildInventoryFormMapping.ts`
- `brNegocioAdditionalInventoryDraft.ts`
- `brNegocioInventoryDraftPersistence.ts`
- `brNegocioPrePublishInventoryShellCopy.ts`
- `AgenteIndividualResidencialPreviewPage.tsx`

## Files Changed

- `BrNegocioChildInventoryFullPreviewOverlay.tsx` — media hydration + CTAs, no dead editHref
- `BrNegocioPrePublishInventoryShell.tsx` — hydrated previewDraft + wired callbacks
- `BrNegocioChildInventoryFullApplication.tsx` — hydrated preview draft + safe child-app CTAs
- `brNegocioPrePublishInventoryShellCopy.ts` — EN/ES overlay CTA copy

## Current Root Cause

`previewDraft` used `items.find(...)` without `mergeChildInventoryWithMediaBridge`. Session-stored drafts strip `data:` photo blobs; the in-memory media bridge holds them. Edit path hydrated; preview path did not.

## Media Pipeline Before

Card preview → raw draft → `buildChildInventoryEditorState` → empty `fotosDataUrls` → “Add photos in the form.”

## Media Pipeline After

Card preview → `mergeChildInventoryWithMediaBridge` + `normalizeChildInventoryList` → overlay re-hydrates → `buildChildInventoryEditorState` → synced `fotosDataUrls`, `videoUrls`, tour/brochure/listado.

## Navigation Before

Single “Cerrar” + dead `editHref="#"` “Volver a editar” in embedded preview page.

## Navigation After

**Parent entry (final step card):**
- Close preview
- Edit this property → opens exact child editor
- Continue to parent publish step → closes overlay, scrolls to parent final step

**Child application entry (step 10):**
- Close preview
- Continue editing this property → closes overlay, stays in child app
- Save and return to parent publish step → `attemptSave("goToParentPreview")`

## Child Preview Entry Point A: Parent Final Step Card

`BrNegocioPrePublishInventoryShell` → hydrated `previewDraft` → overlay with `context="parentInventory"`.

## Child Preview Entry Point B: Child Application Step 10

`BrNegocioChildInventoryFullApplication` → `hydratedPreviewDraft` → overlay with `context="childApplication"`.

## Refresh / Same-Tab Persistence Result

Unchanged architecture: `setChildInventoryMediaBridge` on save + session draft merge on rehydrate. Hydration at preview time restores blobs from bridge after same-tab refresh when bridge is repopulated from persisted items on load.

**Boundary:** closing browser tab may clear in-memory bridge; same-tab refresh should hold when parent draft rehydrates and `onItemsChange` restores bridge.

## What Was Not Touched

Stripe, Revenue OS, webhooks, Supabase schema, auth, admin, dashboard, public results/detail, Autos, unrelated categories.

## Manual QA Checklist

- [ ] Start Bienes negocio/agente application
- [ ] Accept Inventory Pack; add child with photos + video URLs
- [ ] Save child; confirm card shows photo count/cover
- [ ] Preview child card; confirm full preview shows same photos
- [ ] Confirm video/tour/brochure URLs if added
- [ ] Close preview; parent final step remains
- [ ] Preview again; Edit this property opens exact child editor with media
- [ ] Save and return to parent publish step
- [ ] Refresh same tab; child + photos remain
- [ ] Preview again; no dead Back to edit
- [ ] Continue to parent publish step works
- [ ] Child app step 10: preview → continue editing / save and return

## Remaining Risks

- `AgenteIndividualResidencialPreviewClient` child preview uses overlay hydration but lacks edit/continue wiring (preview route only).
- Title-based dedupe N/A here; media bridge is session-scoped.
