# A5.RECOVERY-28 — Autos Child Editor Hydration Field-Mapping Patch

## 1. Gate title

**A5.RECOVERY-28 — Autos Child Editor Hydration Field-Mapping Patch**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `b6f2a9d725eee301a274c3214f96a41d3d61d3cc` |

## 3. Dirty file preflight

**Gate-scoped (touched):**

- `app/lib/clasificados/autos/autosVehicleMediaDraft.ts`
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `e2e/autos/autos-a5-recovery-28-child-editor-hydration-field-mapping.spec.ts`
- `playwright.autos-recovery-28.config.mjs`
- `scripts/autos-a5-recovery-28-child-editor-hydration-field-mapping-audit.ts`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_28_CHILD_EDITOR_HYDRATION_FIELD_MAPPING_AUDIT.md`
- `package.json`

**Unrelated dirty (not touched):** none at gate start.

## 4. Gemini diagnosis summary

Gemini reported saved child objects use `mediaImages` / `videoUrls` while the child editor form expects `photos` / `videoLinks`, and Editar may lose `childId` and fall back to add mode.

**Validated against repo:**

- UI (`AutosNegociosMediaManager`) reads canonical `mediaImages` / `videoUrls` on the draft passed as `listing`.
- No separate `photos` / `videoLinks` form component exists, but session/API payloads may store alias field names.
- R26 already fixed Editar identity (`findSavedAdditionalInventoryVehicle`, `resolveCanonicalChildInventoryEditorDraft`, `data-autos-inventory-drawer-mode`).
- Remaining gap: alias fields and rows missing `id` were not expanded before editor hydrate, so Fotos y medios could render empty while card/preview still read canonical saved media.

## 5. Exact files/functions inspected

| Area | File | Function / symbol |
| ---- | ---- | ----------------- |
| Save normalizer | `autosAdditionalInventoryDraft.ts` | `prepareInventoryVehicleForSave` |
| Media normalize | `autosVehicleMediaDraft.ts` | `normalizeAutosVehicleMediaDraft`, `coerceAutosVehicleMediaImageEntries` |
| Child hydrator | `autosAdditionalInventoryDraft.ts` | `hydrateChildInventoryEditorDraft`, `resolveCanonicalChildInventoryEditorDraft` |
| Drawer form | `AutosInventoryVehicleDrawerForm.tsx` | delegates to `AutosNegociosVehicleApplicationSteps` |
| Drawer shell | `AutosNegociosAddInventoryDrawer.tsx` | `resolveDrawerInitialDraft`, `patchDraft` |
| Step 7 card | `AutosNegociosInventoryBundlePreview.tsx` | `onEdit={() => onDrawerOpenChange?.(true, v.id)}` |
| Child preview | `AutosNegociosChildInventoryPreviewOverlay.tsx` | `mapInheritedDealerPreviewListing` |
| Draft hook | `useAutoDealerDraft.ts` | `applyDraftPayload`, `reconcileInProgressInventoryWithSavedChildren` |

## 6. Exact root cause

**Primary (field mapping):** `hydrateChildInventoryEditorDraft()` and `normalizeAutosVehicleMediaDraft()` only read `mediaImages` / `videoUrls`. Saved children or session payloads using alias keys (`photos`, `videoLinks`, `imageUrls`) or photo rows without `id` were normalized to empty arrays before the editor mounted, while card/preview paths still read persisted canonical media on the saved bundle object.

**Secondary (already fixed in R26, reinforced in R28):** stale `inProgressInventoryVehicleDraft` and missing bundle lookup on Editar — guarded by `resolveCanonicalChildInventoryEditorDraft()` + `findSavedAdditionalInventoryVehicle()`.

## 7. Files changed

See §3. Core patch:

- `expandAutosVehicleMediaSourceFields()` maps `photos` → `mediaImages`, `imageUrls` → `mediaImages`, `videoLinks` → `videoUrls`.
- `coerceAutosVehicleMediaImageEntries()` assigns stable ids when missing.
- `hydrateChildInventoryEditorDraft()` + `prepareInventoryVehicleForSave()` emit canonical + alias fields.
- Drawer `patchDraft()` re-hydrates after each patch.

## 8. Editar childId/edit-mode result

**PASS** — `onDrawerOpenChange(true, v.id)`; drawer `data-autos-inventory-drawer-mode="edit"`; Playwright confirms edit heading and Step 1 fields filled.

## 9. Field mapping result: mediaImages → photos

**PASS** — `hydrateChildInventoryEditorDraft` sets `photos: media.mediaImages`; `expandAutosVehicleMediaSourceFields` reads `photos` when `mediaImages` absent.

## 10. Field mapping result: videoUrls → videoLinks

**PASS** — `hydrateChildInventoryEditorDraft` sets `videoLinks: media.videoUrls`; `expandAutosVehicleMediaSourceFields` reads `videoLinks` when `videoUrls` absent.

## 11. Save normalizer result

**PASS** — `prepareInventoryVehicleForSave` preserves `mediaImages`, `videoUrls`, cover/order via `normalizeAutosVehicleMediaDraft`, and writes compatibility `photos` / `videoLinks` aliases.

## 12. Volver a editar result

**PASS** — Child preview **Volver a editar** returns to Step 7; second **Editar** opens edit mode with media present (Playwright).

## 13. Refresh then Editar result

**PASS** — After session mutation to alias-only fields + reload, **Editar** hydrates Fotos y medios (Playwright alias session proof).

## 14. Local browser proof result

```
npm run autos:a5-recovery-28-browser-proof → 1 passed (12.8s)
```

## 15. Manual QA checklist

1. Open `/publicar/autos/negocios?lang=es`.
2. Add minimum parent data.
3. Add one child inventory vehicle.
4. Add one child image URL.
5. Add one child video URL.
6. Save child.
7. Confirm child card appears with image.
8. Click **Editar**.
9. Confirm the child form is NOT blank.
10. Go to **Fotos y medios**.
11. Confirm image/media is present.
12. Confirm video URL is present.
13. Save child again.
14. Click **Ver vista previa**.
15. Confirm child preview shows gallery.
16. Click **Volver a editar**.
17. Click **Editar**.
18. Confirm child form is still NOT blank.
19. Confirm image/video still present.
20. Refresh.
21. Click **Editar**.
22. Confirm child form is still NOT blank.
23. Confirm image/video still present.

## 16. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------ | ---------- | -------- |
| Correct repo confirmed | TRUE | elaguila-website |
| Dirty files reviewed before editing | TRUE | Clean preflight |
| Autos-only scope respected | TRUE | Gate-scoped paths |
| Gemini diagnosis validated against actual repo files | TRUE | Alias + canonical fields traced |
| Exact root cause documented with file/function names | TRUE | §6 |
| Editar passes saved childId | TRUE | `onDrawerOpenChange(true, v.id)` |
| Editar opens edit mode, not add mode | TRUE | `data-autos-inventory-drawer-mode="edit"` |
| Editar locates child in additionalInventoryVehicles | TRUE | `findSavedAdditionalInventoryVehicle` |
| Editar does not silently open blank add form for saved child | TRUE | `missingSavedChild` guard |
| Child hydrator maps mediaImages to photos | TRUE | `photos: media.mediaImages` |
| Child hydrator maps imageUrls if supported | TRUE | `expandAutosVehicleMediaSourceFields` |
| Child hydrator maps videoUrls to videoLinks | TRUE | `videoLinks: media.videoUrls` |
| Child hydrator preserves cover/isPrimary where supported | TRUE | `coerceAutosVehicleMediaImageEntries` |
| Child hydrator preserves order/sortOrder where supported | TRUE | `normalizeMediaImagesOrder` |
| Default blank media state does not overwrite hydrated child | TRUE | `resolveCanonicalChildInventoryEditorDraft` + patch hydrate |
| Save normalizer preserves mediaImages | TRUE | `prepareInventoryVehicleForSave` |
| Save normalizer preserves videoUrls | TRUE | `prepareInventoryVehicleForSave` |
| Save normalizer preserves sibling children | TRUE | upsert by id only |
| Step 7 child card still shows image | TRUE | Playwright card img visible |
| Child preview still shows gallery | TRUE | `data-autos-preview-media-count` |
| Volver a editar does not force blank add mode | TRUE | Playwright second Editar edit mode |
| Refresh then Editar hydrates saved child | TRUE | Playwright alias reload proof |
| Parent media/video not regressed | TRUE | shared expand used for child only in hydrate path |
| No unrelated categories touched | TRUE | git diff scope |
| No global Stripe/payment touched | TRUE | — |
| No schema/migration touched | TRUE | — |
| npm run build passed | TRUE | exit 0 (~179s) |

## 17. Final recommendation

Final recommendation: **GREEN** — Editar opens saved child in edit mode; alias field mapping hydrates Fotos y medios; Volver a editar + refresh paths verified in browser proof.
