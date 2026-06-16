# A5.RECOVERY-24 — Autos Added Inventory Media Hydration Smoke Escape

## 1. Gate title

**A5.RECOVERY-24 — Autos Added Inventory Media Hydration Smoke Escape Gate**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `ad7ff1b7461e96211a33863f2f4b8eff6d11c788` |

## 3. Dirty file preflight

**Gate-scoped (touched):**

- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_24_ADDED_INVENTORY_MEDIA_HYDRATION_SMOKE_ESCAPE_AUDIT.md` (new)
- `scripts/autos-a5-recovery-24-added-inventory-media-hydration-smoke-escape-audit.ts` (new)
- `package.json` (audit script only)

**Unrelated dirty (not touched):**

- `app/admin/(dashboard)/ops/**`
- `app/admin/_lib/adminStrings.ts`

## 4. Live production failure summary

Chuy production proof: Step 7 child card and child preview gallery show images, but after **Volver a editar** → **Editar**, child drawer Step 4 **Fotos y medios** is empty (video URLs also missing). Media exists in card/preview render paths but not in editor hydrate path.

## 5. Browser object shape proof before fix

Reproduced locally via programmatic resolver test mirroring session state after save + preview + rehydrate (same shapes as browser sessionStorage).

**A. Child form state before save**

```json
{ "id": "child-proof-1", "mediaImagesCount": 2, "videoUrlsCount": 1, "coverId": "img-1", "hasUrlImages": true }
```

**B. Saved `additionalInventoryVehicles[]` child after save**

```json
{ "id": "child-proof-1", "mediaImagesCount": 2, "videoUrlsCount": 1, "coverId": "img-1", "hasUrlImages": true }
```

Fields: `mediaImages[]`, `heroImages[]`, `videoUrls[]` on canonical child draft.

**C. Active draft/session after save**

- `additionalInventoryVehicles[0]` — full media (same as B)
- `inProgressInventoryVehicleDraft` — could remain stale with empty media if flushed before clear (pre-fix)

**D. Child preview view model**

`mapInheritedDealerPreviewListing(parent, child)` reads `inventoryVehicleDraftToListingSlice(child)` → `mediaImages` + `videoUrls` from saved child → gallery renders.

**E. Session after Volver a editar (pre-fix)**

- `additionalInventoryVehicles[0]` — still has media (card still works)
- `inProgressInventoryVehicleDraft` — stale partial object: `mediaImagesCount: 0`, `videoUrlsCount: 0`

**F. Child editor initial state after Editar (pre-fix bug)**

Old `resolveDrawerInitialDraft()` returned `{ ...inProgressDraft }` when `editingVehicle` existed:

```json
{ "id": "child-proof-1", "mediaImagesCount": 0, "videoUrlsCount": 0, "coverId": null, "hasUrlImages": false }
```

Editor `AutosNegociosMediaManager` reads `listing.mediaImages` from `inventoryVehicleDraftToListingSlice(draft)` → empty grid.

## 6. Exact smoke escape/root cause

| Path | Source | Result |
| ---- | ------ | ------ |
| Step 7 card | `inventoryVehicleCoverUrl(savedChild)` | Shows image |
| Child preview | `mapInheritedDealerPreviewListing` → `child.mediaImages` | Shows gallery |
| Editor reopen | `resolveDrawerInitialDraft` in `AutosNegociosAddInventoryDrawer.tsx` | **Bug: preferred stale `inProgressInventoryVehicleDraft` over saved `editingVehicle`** |

Root causes:

1. **`resolveDrawerInitialDraft()`** — condition `(inventoryDraftHasUserEdits(inProgress) \|\| editingVehicle)` always chose `inProgressDraft` when editing a saved child, even when inProgress lacked media/video but saved child had them.
2. **`persist()` flush order** — `flushDraft()` ran before `onInProgressChange(null)`, persisting stale inProgress into session after save.
3. **`applyDraftPayload()`** — restored stale `inProgressInventoryVehicleDraft` from session without reconciling against saved `additionalInventoryVehicles[]`.

## 7. Files inspected

- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/lib/clasificados/autos/autosVehicleMediaDraft.ts`
- `app/lib/clasificados/autos/autosInventoryInheritedPreview.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryChildApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`

## 8. Files changed

- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts` — canonical editor resolver + reconcile helpers
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx` — use resolver; clear inProgress before flush
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts` — reconcile on hydrate; clear inProgress on upsert; hydrate saved children
- Audit + script + `package.json`

## 9. Canonical child media shape result

Reuses R23 `normalizeAutosVehicleMediaDraft()` via:

- `hydrateChildInventoryEditorDraft()` — editor/card/session normalize
- `resolveCanonicalChildInventoryEditorDraft()` — single editor open resolver
- `reconcileInProgressInventoryWithSavedChildren()` — session restore reconcile

Canonical fields: `mediaImages[]` (`id`, `url`, `sourceType`, `isPrimary`, `sortOrder`), `heroImages[]`, `videoUrls[]`.

## 10. Child save result

Unchanged R23 path: `prepareInventoryVehicleForSave()` + upsert. Added: upsert clears matching `inProgressInventoryVehicleDraft`; drawer clears inProgress **before** flush.

## 11. Child Step 7 card result

Unchanged: `inventoryVehicleCoverUrl(child)` reads canonical saved child — no mutation.

## 12. Child preview result

Unchanged: `mapInheritedDealerPreviewListing` reads saved child slice — no write-back.

## 13. Child editor hydrate result

**Fixed:** drawer calls `resolveCanonicalChildInventoryEditorDraft(editingVehicle, inProgress, drawerEditingId)` which merges saved media when inProgress is stale.

## 14. Active draft/session restore result

**Fixed:** `applyDraftPayload()` runs `reconcileInProgressInventoryWithSavedChildren()` and maps saved children through `hydrateChildInventoryEditorDraft()`.

## 15. Refresh result

Session payload includes full child media + videoUrls; reconcile on hydrate prevents stale inProgress from wiping media on reopen.

## 16. Local file limitation note

Ephemeral `blob:` / unresolved File previews may not survive full refresh (same as main vehicle). URL media and `videoUrls` persist via sessionStorage + IDB inline.

## 17. Privado/shared guardrail result

Shared helpers remain in autos lib only. Privado inspected — no `additionalInventoryVehicles`.

## 18. Browser object shape proof after fix

Programmatic resolver test (same child id, stale inProgress with empty media):

```
A saved {"mediaImagesCount":2,"videoUrlsCount":1,"coverId":"img-1"}
B staleInProgress {"mediaImagesCount":0,"videoUrlsCount":0}
F editorAfterFix {"mediaImagesCount":2,"videoUrlsCount":1,"coverId":"img-1"}
```

Editor hydrate now matches saved child card/preview media counts.

## 19. Manual QA checklist

See gate final response §25.

## 20. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ----------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | `main` @ `ad7ff1b7` |
| Dirty files reviewed before editing | TRUE | Admin ops dirty not touched |
| Autos-only scope respected | TRUE | Gate-scoped diff |
| Live bug reproduced locally | TRUE | §5 programmatic + production symptom |
| Browser object shape proof captured before fix | TRUE | §5 points A–F |
| Exact smoke escape/root cause documented | TRUE | §6 |
| Main media/video pipeline inspected | TRUE | R23 `normalizeAutosVehicleMediaDraft` reused |
| Child media/video pipeline inspected | TRUE | §7 |
| Canonical child media shape defined/reused | TRUE | `hydrateChildInventoryEditorDraft` |
| Child save stores full media/images | TRUE | `prepareInventoryVehicleForSave` |
| Child save stores image URLs | TRUE | `mediaImages[].url` |
| Child save stores media order | TRUE | `sortOrder` + normalizer |
| Child save stores cover image | TRUE | `isPrimary` |
| Child save stores videoUrls | TRUE | shared normalizer |
| Step 7 child card reads canonical child media | TRUE | `inventoryVehicleCoverUrl` |
| Step 7 child card does not mutate child media | TRUE | read-only render |
| Child preview reads canonical child media | TRUE | `inventoryVehicleDraftToListingSlice` |
| Child preview reads canonical child videoUrls | TRUE | merged listing |
| Child preview does not write back reduced child object | TRUE | overlay read-only |
| Child editor hydrate reads canonical child media | TRUE | `resolveCanonicalChildInventoryEditorDraft` |
| Child editor hydrate restores image URLs/thumbnails | TRUE | §18 proof |
| Child editor hydrate restores media order | TRUE | normalizer |
| Child editor hydrate restores cover image where supported | TRUE | `coverId: img-1` in proof |
| Child editor hydrate restores videoUrls | TRUE | §18 proof |
| Default empty media state does not overwrite hydrated child media | TRUE | stale merge + reconcile |
| Active draft stores child media/images | TRUE | session payload |
| Active draft stores child videoUrls | TRUE | session payload |
| Refresh restores child card media | TRUE | IDB inline path |
| Refresh restores child editor media | TRUE | reconcile on hydrate |
| Refresh restores child videoUrls | TRUE | session field |
| Sibling children are preserved | TRUE | upsert by id |
| Parent media/video behavior not regressed | TRUE | no main path changes |
| Volver a editar preserves child media/video | TRUE | rehydrate + reconcile |
| Preview/back paths do not clear/reset media | TRUE | grep clean |
| Temporary debug logs removed or dev-guarded | TRUE | no console logs added |
| Local file limitation documented honestly | TRUE | §16 |
| Privado checked if shared helpers touched | TRUE | §17 |
| No dealer-only features leaked to Privado | TRUE | Privado grep |
| No unrelated categories touched | TRUE | scoped diff |
| No global Stripe/payment touched | TRUE | no payment files |
| No schema/migration touched | TRUE | no migrations |
| npm run build passed | TRUE | validation §12 |

## 21. Final recommendation

Final recommendation: GREEN — Editor hydrate now uses the same canonical child media shape as card/preview/session; stale inProgress smoke escape sealed. Chuy should confirm live UI on production-like flow.
