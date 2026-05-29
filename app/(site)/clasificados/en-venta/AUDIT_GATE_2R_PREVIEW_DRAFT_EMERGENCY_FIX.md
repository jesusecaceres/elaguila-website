# Gate 2R — Emergency Varios Publish/Preview Data-Loss Fix

**Date:** 2026-05-29

## Root causes

| Symptom | Root cause |
|---------|------------|
| Preview shows “Sin borrador para mostrar” | Large base64 photos exceed `sessionStorage` quota; in-tab memory was lost on full-page navigation; preview only read sync sessionStorage. |
| “Volver a editar” erases form | Preview shell used native `<a href>` (full reload), wiping module memory; return draft not in sessionStorage when quota failed. |

## Storage keys

| Key | Purpose |
|-----|---------|
| `en-venta-preview-draft-pro` | sessionStorage main Pro draft |
| `en-venta-preview-draft-free` | sessionStorage main Free draft |
| `EN_VENTA_PREVIEW_RETURN_DRAFT` | sessionStorage one-shot return payload |
| `en-venta-preview-draft-meta` | sessionStorage last plan + timestamp |
| IndexedDB `draft:pro` / `draft:free` | IDB fallback when sessionStorage quota fails |
| IndexedDB `return:pro` / `return:free` | IDB return-to-edit fallback |
| In-tab `previewDraftMemory` | Same-tab client navigation cache |

## Wiring

| Step | Implementation |
|------|----------------|
| Save before preview | `onBeforePreview` → `saveEnVentaPreviewDraft` + `saveEnVentaPreviewReturnDraft` + IDB |
| Preview hydrate | `loadLatestEnVentaPreviewDraftAsync` (memory → sessionStorage → IDB) |
| Return to edit | `router.push` + `saveEnVentaPreviewReturnDraft` + `restoreEnVentaFormFromIdbIfEmpty` |

**Recommendation:** READY FOR OWNER RE-TEST
