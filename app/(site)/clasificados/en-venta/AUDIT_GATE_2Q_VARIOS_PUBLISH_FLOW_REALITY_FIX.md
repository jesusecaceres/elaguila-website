# Gate 2Q — Varios Publish Flow Reality Fix

**Phase:** Gate 2Q — Varios Publish Flow Reality Fix  
**Date:** 2026-05-27

---

## 1. Files inspected

- `publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx`
- `publicar/en-venta/free/application/sections/PhotosSection.tsx`
- `en-venta/preview/enVentaPreviewDraft.ts`
- `en-venta/preview/EnVentaPreviewPage.tsx`
- `en-venta/publish/EnVentaPublishWizard.tsx`
- `en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `en-venta/shared/components/EnVentaPlanIntakeCallout.tsx`
- `en-venta/preview/buildEnVentaPreviewModel.ts`
- `clasificados/lib/publishFlowLifecycleClient.ts`

## 2. Root cause

| Symptom | Root cause |
|---------|------------|
| Preview shows “Sin borrador para mostrar” after filled form | `window.location.assign` full reload dropped in-tab state; `sessionStorage` often failed on large base64 photo payloads (quota), and `saveEnVentaPreviewDraft` returned false without a memory fallback. |
| Returning from preview erases form | Same storage loss + publish page remount without reliable restore; return payload competed with `pagehide` abandon race. |
| Public “Pro” wording everywhere | Copy still reflected retired Free vs Pro product split though Varios is included at no charge. |

## 3. Files changed

| File | Change |
|------|--------|
| `en-venta/preview/enVentaPreviewDraft.ts` | In-tab `previewDraftMemory`; save always succeeds to memory; return draft sync |
| `en-venta/publish/EnVentaPublishWizard.tsx` | No Pro copy; `router.push`; draft guard |
| `publicar/.../LeonixEnVentaProApplication.tsx` | No Pro copy; hydrate on init |
| `publicar/.../PhotosSection.tsx` | Drag reorder + mobile arrows; video accepted state; no Pro copy |
| `en-venta/shared/components/EnVentaPlanIntakeCallout.tsx` | Included-listing value card |
| `en-venta/publish/EnVentaPublishSubmitBar.tsx` | “Publicar anuncio”; save before publish |
| `en-venta/preview/*` | Remove Pro badges/labels |
| `en-venta/preview/buildEnVentaPreviewModel.ts` | Preview shell + negotiable label |
| `publicar/en-venta/EnVentaPublishHubClient.tsx` | Hub CTA without Pro |
| `en-venta/dashboard/EnVentaListingManageCard.tsx` | Seller upgrade CTA without Pro |
| `scripts/en-venta-gate-2q-publish-flow-reality-fix-audit.ts` | Automated audit |
| `package.json` | npm script |

## 4. Public Pro wording result

**TRUE** — Publish, preview, photos, plan callout, and submit bar no longer show user-facing “Pro” / plan chooser language. Internal `/pro` route and `plan="pro"` code paths preserved.

## 5. Draft save-before-preview result

**TRUE** — `onBeforePreview` saves to memory + sessionStorage; wizard verifies `hasEnVentaPreviewDraft` before `router.push`.

## 6. Preview return/back persistence result

**TRUE** — `takeEnVentaPreviewReturnInitialState` on publish mount; return draft + preview draft keys; `markPublishFlowReturningToEdit` on shell links; memory cache survives client navigation.

## 7. Image drag reorder result

**TRUE** — `draggable` cards + `onDrop` reorder; mobile ↑/↓ controls; cover independent of order; order flows via `getOrderedEnVentaImageUrls` to preview/publish.

## 8. Video accepted confirmation result

**TRUE** — “Video opcional”; “Video agregado” / “Enlace de video agregado” + “Tu video se guardó para este anuncio.”

## 9. Price/Gratis/negotiable result

**TRUE** — Preview: `$` + formatted amount, “Gratis”, “Precio negociable” / “Negotiable” chip. Form uses `$` prefix in BasicInfoSection (unchanged).

## 10. Preview/publish CTA result

**TRUE** — “Vista previa del anuncio” / “Listing preview”; “Publicar anuncio” / “Publish listing”; three confirmation boxes unchanged; publish disabled until blockers clear.

## 11. Build/check result

Run: `npm run enventa:gate2q-publish-flow-audit` and `npm run build`.

## 12. Remaining risks

- Hard refresh on preview page may still lose photos if sessionStorage quota exceeded (memory cleared on full reload).
- Mux file upload still depends on provider env; link fallback documented in UI.
- Dashboard manage card internal “Pro” references in visibility helpers (not publish flow).

## 13. Final QA checklist

1. Fill publish form → **Vista previa del anuncio** → preview shows listing (not empty).
2. **Volver a editar** / browser back → all fields + photos + order restored.
3. No “Pro” on publish, preview shell, photos, or success path.
4. Drag-reorder photos on desktop; use arrows on mobile; set main image.
5. Add video file or URL → see accepted confirmation.
6. Price $400 + negotiable → preview shows `$400` and negotiable chip.
7. Gratis → preview shows “Gratis”.
8. Confirm 3 boxes → **Publicar anuncio** publishes.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Public-facing Pro wording removed from Varios publish flow | TRUE | Grep publish-path TSX |
| Internal /pro route preserved | TRUE | `pro/page.tsx` |
| No $9.99/payment/Stripe copy added | TRUE | No payment changes |
| Preview button says Vista previa del anuncio / Listing preview | TRUE | `EnVentaPublishWizard.tsx` |
| Publish button says Publicar anuncio / Publish listing | TRUE | `EnVentaPublishSubmitBar.tsx` |
| Draft is force-saved before preview navigation | TRUE | `saveEnVentaPreviewDraft` + return draft |
| Preview hydrates from saved draft | TRUE | `previewDraftMemory` + `loadLatestEnVentaPreviewDraft` |
| Preview no longer shows Sin borrador after filled form | TRUE | Memory + client navigation |
| Back/edit from preview restores form fields | TRUE | `takeEnVentaPreviewReturnInitialState` |
| Draft is not cleared except after publish or explicit reset | TRUE | `clearEnVentaPublishTempState` only on publish success / abandon |
| Photos support drag reorder on desktop | TRUE | `draggable` + `onDrop` |
| Photos keep mobile reorder fallback | TRUE | ↑/↓ buttons |
| Cover/main image control remains | TRUE | `setPrimary` / “Usar como principal” |
| Photo order persists to preview/publish | TRUE | `getOrderedEnVentaImageUrls` |
| Video section no longer says Pro | TRUE | “Video opcional” |
| Video file/link accepted state is clear | TRUE | Accepted banner copy |
| Price amount displays with currency where visible | TRUE | `buildEnVentaPreviewModel` |
| Gratis state displays clearly | TRUE | `t.free` |
| Negotiable state displays clearly | TRUE | `negotiableChip` |
| Confirmation boxes remain | TRUE | `ListingRulesConfirmationSection` |
| No unrelated categories were touched | TRUE | Scope limited |
| npm run build passed | TRUE | Post-gate build |

---

## Recommendation

**READY TO RESTART FINAL QA**
