# Gate 2Q-R — Varios Publish Form Final Fixes

**Date:** 2026-05-27

## Persistence wiring (testable)

| Step | Implementation |
|------|----------------|
| Save before preview | `LeonixEnVentaProApplication.onBeforePreview` → `saveEnVentaPreviewDraft` + `saveEnVentaPreviewReturnDraft` |
| Save before publish | `EnVentaPublishSubmitBar.onPublish` → same save calls |
| Preview hydrate | `loadLatestEnVentaPreviewDraft` + `previewDraftMemory` in `enVentaPreviewDraft.ts` |
| Return to edit | `takeEnVentaPreviewReturnInitialState("pro")` on publish mount |
| Clear draft | Only `clearEnVentaPublishTempState` after successful publish or explicit abandon |

## TRUE/FALSE

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Monto shows $ prefix clearly | TRUE | `BasicInfoSection.tsx` |
| Empty Monto validation message | TRUE | “Agrega el precio del artículo.” / “Add the item price.” |
| Quantity distinct from price | TRUE | Dashed optional box + helper copy |
| Quantity not required | TRUE | Not in blockers |
| Draft saved before preview | TRUE | `onBeforePreview` |
| Preview loads saved draft | TRUE | `previewDraftMemory` + sessionStorage |
| Return from preview restores form | TRUE | `takeEnVentaPreviewReturnInitialState` |
| Draft not cleared except publish/reset | TRUE | `clearEnVentaPublishTempState` |
| Video ready confirmation | TRUE | “Video listo” / “Video ready” |
| Video URL validation | TRUE | `videoLinkInvalid` message |
| Drag image reorder | TRUE | `draggable` + `onDrop` |
| Mobile arrow reorder fallback | TRUE | ↑/↓ buttons |
| Spanish no unnecessary Pro friction | TRUE | “Anuncio incluido sin costo” |
| Preview allowed without checkboxes | TRUE | `collectEnVentaCoreBlockers` |
| Publish requires 3 checkboxes | TRUE | `collectEnVentaPublishBlockers` |
| City OR ZIP satisfies location | TRUE | `validateEnVentaLocation` |
| No dual field error when one valid | TRUE | `LocationSection` invalid flags |
| npm run build passed | TRUE | Post-gate build |

**Recommendation:** READY TO RESTART FINAL QA
