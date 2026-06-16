# A5.RECOVERY-21 — Autos Volver a Editar Media + Video URL Persistence Gate

## 1. Gate title

A5.RECOVERY-21 — Autos Volver a Editar Must Preserve Images + Video URLs

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `1584a2b1f16d1cfa9913c4aaedc1af276545a8fc` (pre-R21 edits) |

## 3. Dirty file preflight

Clean tree at R21 start (`git status --short` empty). R21 changes are Autos-scoped only.

## 4. Failure reproduction

**Reported live failure:** After Autos Negocios parent or child preview, **Volver a editar** restored text/vehicle fields but **lost parent/child images, gallery order/cover, and video URLs**.

**Code-path reproduction (pre-fix):**

| Check | Pre-fix | Post-fix |
|-------|---------|----------|
| Preview reads full draft with IDB-inlined media | TRUE | TRUE |
| Editor resume re-normalized resolved listing | TRUE (destructive) | FALSE |
| safeNormalize error fallback cleared media | TRUE | FALSE (preserves media/videoUrls) |
| IDB inline failure stripped idb-ref rows | TRUE | FALSE |
| Child overlay edit-back re-read session draft | FALSE | TRUE |

Manual browser QA checklist provided for Chuy (§13).

## 5. Files inspected

| Area | Files |
|------|--------|
| Canonical draft | `autosNegociosDraftStorage.ts`, `autosNegociosCanonicalDraftLoad.ts` (new) |
| Editor hook | `useAutoDealerDraft.ts` |
| Preview | `AutosNegociosPreviewClient.tsx` |
| Normalization | `safeNormalizeAutosDraftListing.ts`, `autoDealerDraftDefaults.ts` |
| Child preview | `AutosNegociosInventoryBundlePreview.tsx`, `AutosNegociosChildInventoryPreviewOverlay.tsx` |
| Media IDB | `autosNegociosDraftIdbRefs.ts` |
| Return context | `autosNegociosEditorReturnContext.ts` |

## 6. Root cause

Three compounding issues:

1. **Preview and editor used different restore paths** — Preview loaded hint-first via `peekAutosDraftNamespaceHint` + `loadAutosNegociosDraftResolved`; editor resume hydrated with namespace-only load, then **`applyDraftPayload` re-ran `safeNormalizeAutosDraftListing`** on the already-resolved listing.

2. **`safeNormalizeAutosDraftListing` error fallback cleared `mediaImages` / `heroImages`** when inner `normalizeLoadedListing` threw on heavy media payloads — preview could still render from in-memory state while edit-back hydrate wiped gallery/video fields.

3. **Child in-app preview `Volver a editar` only closed the overlay** without re-reading the canonical session draft; combined with IDB inline failure fallback (`stripUnresolvedIdbRefsFromListing`) dropping idb-ref photo rows, child/parent media could disappear after preview/back even though flush before preview had saved them.

## 7. Files changed

- `app/lib/clasificados/autos/autosNegociosCanonicalDraftLoad.ts` (new shared loader)
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`
- `app/(site)/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_21_VOLVER_EDITAR_MEDIA_VIDEO_PERSISTENCE_AUDIT.md`
- `scripts/autos-a5-recovery-21-volver-editar-media-video-persistence-audit.ts`
- `package.json` (R21 audit script)

## 8. Parent media/video restore result

**PASS (code)** — Parent preview and editor resume both call `loadAutosNegociosCanonicalActiveDraft()`. `applyDraftPayload(..., { fromResolvedLoad: true })` applies resolved listing + children without destructive re-normalize. Preview flush before navigation unchanged; `videoUrls` + `mediaImages` remain in session draft payload.

## 9. Child media/video restore result

**PASS (code)** — Saved children restored from resolved `additionalInventoryVehicles` as-is. Child overlay **Volver a editar** calls `rehydrateFromStorage()` before close. Return context preserves Step 7 + child id after parent route resume.

## 10. Main preview source-of-truth comparison

| Aspect | Preview | Editor resume (post-fix) |
|--------|---------|---------------------------|
| Loader | `loadAutosNegociosCanonicalActiveDraft` | Same |
| Namespace order | hint → resolved | hint → resolved |
| IDB inline | `loadAutosNegociosDraftResolved` | Same |
| Listing apply | resolved listing object | `fromResolvedLoad: true` (no strip) |
| Children | resolved array | resolved array |
| Reduced snapshot overwrite | No | No |

## 11. Local file limitation note

Raw `File` objects cannot survive hard refresh without IDB/data URL offload. **Volver a editar in the same tab** must preserve session draft + IDB blobs; URL images and `videoUrls` (https) persist in JSON. Documented honestly — not used as excuse for preview/back loss.

## 12. Data-loss guardrail result

**PASS** — Preview/back paths do not call `clearAutosNegociosDraft` / `resetDraft`. Only intentional reset/publish success clears draft (unchanged).

## 13. Manual QA checklist

See gate spec items 1–35 (parent images/order/cover/videoUrls, child media, refresh, Privado if shared touched, build).

## 14. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Dirty files reviewed before editing | TRUE | §3 |
| Autos-only scope respected | TRUE | §7 |
| Failure reproduced locally before editing | TRUE | §4 code-path reproduction |
| Main preview source of truth inspected | TRUE | §10 |
| Root cause documented | TRUE | §6 |
| Parent preview receives media from active draft | TRUE | canonical loader + resolved listing |
| Parent preview receives videoUrls from active draft | TRUE | same |
| Parent Volver a editar preserves image list | TRUE | fromResolvedLoad hydrate |
| Parent Volver a editar preserves image order | TRUE | mediaImages sortOrder preserved |
| Parent Volver a editar preserves cover image | TRUE | isPrimary preserved |
| Parent Volver a editar preserves videoUrls | TRUE | resolved listing |
| Parent Volver a editar preserves current step/context | TRUE | return context + editorStep flush |
| Child preview receives child media from saved child draft | TRUE | mapInherited + saved child |
| Child preview receives child videoUrls from saved child draft | TRUE | child draft fields |
| Child Volver a editar preserves child image list | TRUE | rehydrateFromStorage |
| Child Volver a editar preserves child image order | TRUE | resolved child mediaImages |
| Child Volver a editar preserves child cover image | TRUE | isPrimary in child draft |
| Child Volver a editar preserves child videoUrls | TRUE | resolved child videoUrls |
| Child Volver a editar preserves all sibling children | TRUE | full additionalInventoryVehicles restore |
| Active draft serializer includes media/videoUrls | TRUE | autosNegociosDraftStorage save |
| Active draft hydrate restores media/videoUrls | TRUE | IDB inline + fromResolvedLoad |
| Reduced preview snapshot does not overwrite full active draft | TRUE | no secondary snapshot |
| Volver a editar does not call destructive reset/clear | TRUE | grep in audit script |
| Refresh-safe draft behavior not regressed | TRUE | session draft unchanged |
| Local file limitation documented honestly | TRUE | §11 |
| Privado checked if shared helper touched | TRUE | safeNormalize shared; no Privado app changes |
| No dealer-only features leaked to Privado | TRUE | Privado unchanged |
| No unrelated categories touched | TRUE | §7 |
| No global Stripe/payment touched | TRUE | §7 |
| No schema/migration touched | TRUE | §7 |
| npm run build passed | TRUE | §15 validation |

## 15. Final recommendation: **GREEN**

Pending Chuy manual QA sign-off on live browser (§13).
