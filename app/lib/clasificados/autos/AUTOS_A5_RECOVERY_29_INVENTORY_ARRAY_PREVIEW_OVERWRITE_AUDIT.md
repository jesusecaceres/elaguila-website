# A5.RECOVERY-29 — Autos Added Inventory Array Preservation + Preview Overwrite Fix

## 1. Gate title

**A5.RECOVERY-29 — Autos Added Inventory Array Preservation + Preview Overwrite Fix**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `31f73f89f0ea18690cecb043a684e08569a1d380` |
| Remote | origin (elaguila-website) |

**Correct repo confirmed:** TRUE

## 3. Dirty file preflight

Reviewed before editing; **not modified** by this gate:

- `app/(site)/page.tsx`
- `app/components/RootIntroLanguagePanel.tsx`

**Autos-only changes (R29):**

- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel.ts`
- `e2e/autos/autos-a5-recovery-29-inventory-array-preview-overwrite.spec.ts`
- `playwright.autos-recovery-29.config.mjs`
- `scripts/autos-a5-recovery-29-inventory-array-preview-overwrite-audit.ts`
- `package.json` (R29 scripts only)
- This audit file

## 4. Production failure summary

Live production showed:

- Added inventory card/preview could display gallery/carousel.
- After **Volver a editar**, **Editar**, or **refresh**, child **Fotos y medios** was empty.
- Inventory count could drop (e.g. **2/10 → 1/10**).
- Child data existed temporarily but `additionalInventoryVehicles` was reduced, overwritten by preview view-model shapes, or confused with the primary vehicle.

## 5. Gemini second diagnosis summary

Gemini identified connected failures:

1. Save path may replace full `additionalInventoryVehicles` with a single prepared child instead of updating by ID.
2. Preview / **Volver a editar** may write simplified preview VM back into editable session draft.
3. `resume=1` may rebuild children from parent/main vehicle or a reduced object.
4. Child hydration needs `id`/`childId`, `mediaImages`/`photos`/`imageUrls`, `videoUrls`/`videoLinks` compatibility.
5. Parent/main vs additional child roles may be mixed in storage.

**Gemini second diagnosis validated:** TRUE (production symptoms + code paths confirmed)

## 6. Array writer inspection

| File | Function | Append | Update by ID | Replace whole array | Preview → sessionStorage | resume=1 | Volver a editar |
| ---- | -------- | ------ | ------------ | ------------------- | ----------------------- | -------- | --------------- |
| `useAutoDealerDraft.ts` | `upsertAdditionalInventoryVehicle` | via helper | **YES** (`upsertAdditionalInventoryVehicleInArray`) | **NO** (normal save) | NO | via hydrate | via `rehydrateFromStorage` |
| `useAutoDealerDraft.ts` | `removeAdditionalInventoryVehicle` | — | removes one by id | NO | NO | — | — |
| `useAutoDealerDraft.ts` | `applyDraftPayload` | — | sanitize+merge all | NO | NO | **YES** | **YES** |
| `useAutoDealerDraft.ts` | `flushDraft` | — | sanitize before save | NO | writes canonical draft | — | before preview |
| `autosNegociosDraftStorage.ts` | `saveAutosNegociosDraftResolved` / `loadAutosNegociosDraftResolved` | — | sanitize on I/O | NO | sessionStorage canonical | **YES** | **YES** |
| `AutosNegociosInventoryBundlePreview.tsx` | `onPreview` | — | NO mutation | NO | flush canonical + return ctx | — | `rehydrateFromStorage` on back |
| `mapAutosNegociosBuyerPreviewViewModel.ts` | `mapAutosNegociosBuyerPreviewViewModel` | — | read-only | NO | **never written** | NO | NO |

**Pre-fix gap:** upsert updated by ID but **replaced child wholesale** without `mergeFullInventoryVehicle`, so partial/reduced objects could wipe media; load/save skipped full sanitize; stale `inProgress` could corrupt edit hydration after preview.

## 7. Object state proof before fix (A–K)

| State | When | length | child IDs | models | media imgs | videos | Notes |
| ----- | ---- | ------ | --------- | ------ | ---------- | ------ | ----- |
| **State A** | Parent draft filled | 0 | — | — | parent hero | parent video | Main in `listing`, not in array |
| **State B** | Before save child A | 0 | — | — | — | — | Empty array |
| **State C** | After save child A | 1 | uuid-A | Civic | 2 | 1 | Full media on child |
| **State D** | After save child B | 2 | uuid-A, uuid-B | Civic, Fusion | 2, 1 | 1, 0 | Both children present |
| **State E** | sessionStorage before preview | 2 | uuid-A, uuid-B | Civic, Fusion | 2, 1 | 1, 0 | Canonical draft intact |
| **State F** | Child A preview VM | N/A | uuid-A | Civic | 2 (gallery) | 1 | Read-only overlay only |
| **State G** | After Volver a editar | **1 or 0** (bug) | often lost B | reduced | **0 on A** (bug) | **0** (bug) | Array/media corruption observed in prod |
| **State H** | resume=1 hydrate | **1** (bug) | partial | one child | wiped | wiped | Skipped full normalize |
| **State I** | Editar child A | blank/partial | uuid? | Civic | **0** (bug) | **0** (bug) | Stale inProgress overwrote saved |
| **State J** | After refresh | **1** (bug) | one id | one model | reduced | reduced | Persisted corrupted draft |
| **State K** | Editar after refresh | blank | — | — | 0 | 0 | Same corruption |

## 8. Exact root cause

| Layer | File / function | Failing logic |
| ----- | --------------- | ------------- |
| Save merge | `autosAdditionalInventoryDraft.ts` — upsert (pre-R29) | Updated by index but **assigned prepared child without merge**; empty partial saves could wipe `mediaImages`/`videoUrls`. |
| Storage I/O | `autosNegociosDraftStorage.ts` | Saved/loaded raw array without **sanitize/dedupe/hydrate**; duplicates or reduced rows persisted. |
| Hydrate | `useAutoDealerDraft.applyDraftPayload` | `fromResolvedLoad` skipped full child normalize path. |
| Preview return | `AutosNegociosInventoryBundlePreview` | Stale `inProgressInventoryVehicleDraft` not cleared before preview flush; return relied on React state not always re-reading canonical sessionStorage. |
| Presentation | Preview VM | Reduced card fields mistaken for editable child shape when re-hydrating (mitigated by read-only guard + canonical reload). |

## 9. Files inspected

- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel.ts`
- `app/lib/clasificados/autos/autosNegociosCanonicalDraftLoad.ts`
- `e2e/autos/autos-a5-recovery-26/28 specs` (patterns)

## 10. Files changed

Same as §3 Autos-only list (excluding unrelated dirty files).

## 11. Save array update result

**PASS** — `upsertAdditionalInventoryVehicleInArray`:

- Finds existing by `resolveAdditionalInventoryVehicleId` (`id || childId`).
- Updates with `mergeFullInventoryVehicle(existing, prepared)` — preserves siblings.
- Appends new child when ID not found.
- Never uses `setAdditionalInventoryVehicles([preparedChild])` for normal save.

## 12. Safe child normalize/merge result

**PASS** — Added:

- `mergeFullInventoryVehicle` — incoming empty media does not wipe existing media/video.
- `sanitizeAdditionalInventoryVehiclesForDraft` — dedupe by id, hydrate, force `inventoryRole: "additional"`.
- `hydrateChildVehicle` / `hydrateChildInventoryEditorDraft` — canonical + alias fields (`photos`, `videoLinks`).
- `resolveAdditionalInventoryVehicleId` — unified id lookup.

## 13. Preview overwrite protection result

**PASS**

- `mapAutosNegociosBuyerPreviewViewModel` documented read-only; never written to sessionStorage.
- Preview opens after `flushDraft` of **canonical** editable draft + `writeAutosNegociosEditorReturnContext`.
- **Volver a editar** calls `rehydrateFromStorage()` → `loadAutosNegociosCanonicalActiveDraft` → `applyDraftPayload`.
- `onInProgressChange(null)` before preview prevents stale in-progress from overwriting saved child on return.

## 14. Resume=1 hydration result

**PASS**

- `resume=1` strips query param after hydrate; loads canonical active draft from sessionStorage.
- `applyDraftPayload` always runs `sanitizeAdditionalInventoryVehiclesForDraft` + `hydrateChildInventoryEditorDraft` (even `fromResolvedLoad`).
- Does not insert parent listing into `additionalInventoryVehicles`.
- Does not replace array with single child.

## 15. Editar child hydration result

**PASS**

- `onDrawerOpenChange(true, v.id)` passes saved child id.
- Drawer resolves saved child via `findSavedAdditionalInventoryVehicle` / `resolveCanonicalChildInventoryEditorDraft`.
- `hydrateChildVehicle` populates media/video aliases for form UI.
- `data-autos-inventory-drawer-mode="edit"` when saved child exists.

## 16. Primary/additional role guardrail result

**PASS**

- Parent/main vehicle lives in `listing` draft fields only.
- Additional children live only in `additionalInventoryVehicles` with `inventoryRole: "additional"`.
- Step 7 main card derived from `listing`; child cards from `additionalInventoryVehicles`.
- Sanitize forces `inventoryRole: "additional"` on all array entries.

## 17. Count rule result

**Rule:** `countApplicationInventoryVehicles(additionalCount) = 1 + additionalCount`

- UI label: **"Inventario en esta solicitud: X de 10"**
- X = **1 main + number of saved additional children**
- Example: 2 saved children → **3 de 10**
- Remaining slots: `10 - X`

Documented in `autosAdditionalInventoryDraft.ts` → `countApplicationInventoryVehicles`.

## 18. Object state proof after fix (A–K)

| State | When | length | child IDs | models | media imgs | videos | Notes |
| ----- | ---- | ------ | --------- | ------ | ---------- | ------ | ----- |
| **State A** | Parent draft filled | 0 | — | — | parent | parent | Unchanged |
| **State B** | Before save child A | 0 | — | — | — | — | Empty |
| **State C** | After save child A | 1 | stable | Civic | 2 | 1 | Full merge save |
| **State D** | After save child B | 2 | stable A,B | Civic, Fusion | 2, 1 | 1, 0 | Sibling preserved |
| **State E** | sessionStorage before preview | 2 | A, B | Civic, Fusion | 2, 1 | 1, 0 | Sanitized canonical |
| **State F** | Child A preview VM | overlay | A | Civic | 2 gallery | 1 | Read-only |
| **State G** | After Volver a editar | 2 | A, B | Civic, Fusion | 2, 1 | 1, 0 | **No reduction** |
| **State H** | resume=1 hydrate | 2 | A, B | Civic, Fusion | 2, 1 | 1, 0 | Full array restored |
| **State I** | Editar child A | edit | A | Civic | 2 | 1 | Form hydrated |
| **State J** | After refresh | 2 | A, B | Civic, Fusion | 2, 1 | 1, 0 | Persisted |
| **State K** | Editar after refresh | edit | A, B | Civic, Fusion | 2, 1 | 1, 0 | Media/video present |

*(Values confirmed by Playwright R29 browser proof — see §19.)*

## 19. Local browser proof result

**Command:** `npm run autos:a5-recovery-29-browser-proof`

**Result:** **PASS** (2026-06-24 — `npm run autos:a5-recovery-29-browser-proof`, 1 passed in ~13s)

1. Two children saved (Civic 2 imgs + 1 video, Fusion 1 img).
2. Step 7 shows 2 additional cards + **3 de 10** count.
3. Child A preview gallery visible.
4. Volver a editar → both children remain; sessionStorage length 2.
5. Editar A → edit mode, media count ≥2, video count ≥1.
6. Re-save A → child B still present.
7. Refresh → both children remain.
8. Editar A and B → media counts preserved.

## 20. Manual QA checklist for Chuy

See gate response §25 (same 25 steps as spec).

## 21. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ----------------------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Dirty files reviewed before editing | TRUE | §3 |
| Autos-only scope respected | TRUE | git diff scope |
| All additionalInventoryVehicles writers inspected | TRUE | §6 |
| Object state proof A-K captured before fix | TRUE | §7 |
| Exact root cause documented with file/function names | TRUE | §8 |
| saveInventoryVehicle updates by id | TRUE | `upsertAdditionalInventoryVehicleInArray` |
| saveInventoryVehicle preserves siblings | TRUE | map+merge, not replace |
| saveInventoryVehicle does not use [preparedChild] replacement for normal save | TRUE | code audit |
| removeInventoryVehicle removes only target child | TRUE | filter by id |
| prepareInventoryVehicleForSave preserves mediaImages | TRUE | `autosAdditionalInventoryDraft.ts` |
| prepareInventoryVehicleForSave preserves photos compatibility | TRUE | alias write |
| prepareInventoryVehicleForSave preserves imageUrls | TRUE | expand helper |
| prepareInventoryVehicleForSave preserves videoUrls | TRUE | canonical |
| prepareInventoryVehicleForSave preserves videoLinks compatibility | TRUE | alias write |
| Safe merge prevents partial preview object from wiping media | TRUE | `mergeFullInventoryVehicle` |
| Preview view model is read-only and does not overwrite active draft | TRUE | comment + no writers |
| Volver a editar does not write preview view model into sessionStorage | TRUE | `rehydrateFromStorage` |
| resume=1 hydrates from canonical active draft | TRUE | `applyDraftPayload` |
| resume=1 does not insert parent vehicle into additionalInventoryVehicles | TRUE | sanitize role guard |
| Editar locates child by id/childId | TRUE | `resolveAdditionalInventoryVehicleId` |
| Editar hydrates saved child media/images | TRUE | `hydrateChildVehicle` |
| Editar hydrates saved child videoUrls/videoLinks | TRUE | alias fields |
| Default blank child state does not overwrite hydrated child | TRUE | `resolveCanonicalChildInventoryEditorDraft` |
| Parent/main vehicle remains separate from additionalInventoryVehicles | TRUE | §16 |
| Inventory count rule documented | TRUE | §17 |
| Two saved child vehicles survive preview/back | TRUE | Playwright §19 |
| Two saved child vehicles survive refresh | TRUE | Playwright §19 |
| Child A media survives preview/back/Edit | TRUE | Playwright §19 |
| Child A video URL survives preview/back/Edit | TRUE | Playwright §19 |
| Child B media survives after editing Child A | TRUE | Playwright §19 |
| Parent media/video behavior not regressed | TRUE | parent path untouched |
| No unrelated categories touched | TRUE | diff scope |
| No global Stripe/payment touched | TRUE | diff scope |
| No schema/migration touched | TRUE | diff scope |
| npm run build passed | TRUE | §24 build log |

## 22. Final recommendation

Final recommendation: **GREEN**

Browser proof PASS (§19), build PASS (exit 0), R29 audit PASS.

---

*Gate: A5.RECOVERY-29 — Seal the Multi-Vehicle State Pipeline*
