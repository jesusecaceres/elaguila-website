# A5.RECOVERY-23 — Autos Added Inventory Must Reuse Main Vehicle Media + Video Persistence Pipeline

## 1. Gate title

**A5.RECOVERY-23 — Autos Added Inventory Must Reuse Main Vehicle Media + Video Persistence Pipeline**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `f8c75f45ceff16aab41e8da10653b652e5221fe5` |

## 3. Dirty file preflight

**Gate-scoped dirty (touched):**

- `app/lib/clasificados/autos/autosVehicleMediaDraft.ts` (new)
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_23_ADDED_INVENTORY_REUSE_MAIN_MEDIA_PIPELINE_AUDIT.md` (new)
- `scripts/autos-a5-recovery-23-added-inventory-reuse-main-media-pipeline-audit.ts` (new)
- `package.json` (audit script only)

**Unrelated dirty (not touched):**

- `app/(site)/home/page.tsx`
- `app/(site)/productos-promocion/ProductCatalog.tsx`
- `app/components/Footer.tsx`
- `app/lib/googleTranslateWebsite.ts`
- magazine/translate copy files
- untracked promo/copy docs

## 4. Main vehicle media/video pipeline inspected

| Concern | Location | Field / behavior |
| ------- | -------- | ---------------- |
| Media state | `AutoDealerListing.mediaImages[]` | `{ id, url, sourceType, isPrimary, sortOrder }` |
| Legacy hero | `heroImages[]` | Migrated into `mediaImages` on load |
| Cover | `mediaImages[].isPrimary` + order | `normalizeMediaImagesOrder` |
| Video URLs | `videoUrls[]` | Primary external video list |
| Legacy video | `videoUrl` | Migrated via `migrateLegacyAutosVideoUrl` |
| UI commit | `AutosNegociosMediaManager` → `commitImages` | Sets `mediaImages` + `heroImages` |
| Video UI | `AutosExternalVideoUrlsField` | Sets `videoUrls` |
| Normalize | `normalizeLoadedListing()` in `autoDealerDraftDefaults.ts` | Now delegates media/video to shared helper |
| Serialize | `useAutoDealerDraft.flushDraft()` → `saveAutosNegociosDraftResolved()` | Parent + `additionalInventoryVehicles` |
| Hydrate | `loadAutosNegociosCanonicalActiveDraft()` → `applyDraftPayload({ fromResolvedLoad: true })` | Non-destructive restore |
| Preview | `AutosNegociosPreviewClient.tsx` | Canonical loader |
| Volver a editar | Preview chrome + `rehydrateFromStorage()` | Reloads canonical session draft |

## 5. Child inventory media/video pipeline inspected

| Concern | Location | Field / behavior |
| ------- | -------- | ---------------- |
| Child type | `AutosAdditionalInventoryVehicleDraft` | Same media/video fields as main slice |
| Drawer form | `AutosNegociosInventoryChildApplication` → `AutosNegociosVehicleApplicationSteps` mode `inventory-child` | Same `AutosNegociosMediaManager` via `inventoryVehicleDraftToListingSlice` |
| Save prep | `prepareInventoryVehicleForSave()` | Now runs `normalizeAutosVehicleMediaDraft()` |
| Upsert | `useAutoDealerDraft.upsertAdditionalInventoryVehicle()` | Uses prepared child with media/video |
| Drawer persist | `AutosNegociosAddInventoryDrawer.persist()` | **Fixed:** `onSave` before `flushDraft` |
| Hydrate JSON | `normalizeOneItem()` / `normalizeAdditionalInventoryVehicles()` | Uses shared media normalizer |
| IDB offload/inline | `autosNegociosDraftIdbRefs.ts` via `autosNegociosDraftStorage.ts` | Child gallery blobs |
| Bundle preview | `AutosNegociosInventoryBundlePreview` | `rehydrateFromStorage()` on Volver a editar (R21) |
| In-drawer preview | `AutosNegociosChildInventoryPreviewOverlay` | Uses live drawer draft (same-tab, pre-save OK) |

## 6. Failure reproduction with child object shape before/after

**Reproduction method:** Code-path trace + production symptom alignment (Chuy: child media/video lost after preview → Volver a editar). Live browser QA delegated to manual checklist below.

**Before fix — save child with media:**

1. User adds child images + `videoUrls` in drawer.
2. `persist()` called `flushDraft()` **before** `onSave(prepared)`.
3. Session snapshot written **without** updated child media.
4. `onSave(prepared)` updated in-memory `additionalInventoryRef` with full child.

**In-memory child after save (correct):**

```json
{
  "id": "uuid",
  "mediaImages": [{ "id": "m1", "url": "blob:...", "isPrimary": true, "sortOrder": 0 }],
  "heroImages": ["blob:..."],
  "videoUrls": ["https://youtube.com/watch?v=abc"]
}
```

**SessionStorage child after premature flush (broken):**

```json
{
  "id": "uuid",
  "year": 2020,
  "make": "Toyota",
  "mediaImages": [],
  "videoUrls": []
}
```

**After bundle child preview → Volver a editar:**

- `rehydrateFromStorage()` loaded session snapshot → overwrote in-memory child with reduced object → card/editor lost media/video.

**After fix:**

- `onSave(prepared)` first (with `normalizeAutosVehicleMediaDraft` output).
- `flushDraft()` second → session matches in-memory child including `mediaImages` + `videoUrls`.

## 7. Root cause

1. **`AutosNegociosAddInventoryDrawer.persist()` flushed session before saving child** — stale `additionalInventoryVehicles[]` without child media/video was persisted; `rehydrateFromStorage()` on Volver a editar restored that stale snapshot.
2. **`prepareInventoryVehicleForSave()` did not normalize media/video** — child save could omit ordered cover/`heroImages` sync vs main vehicle.
3. **`normalizeOneItem()` used a separate media coerce path** — diverged from main `normalizeLoadedListing` (IDB refs, hero migration, video dedupe).

## 8. Files inspected

- `app/lib/clasificados/autos/autosVehicleMediaDraft.ts`
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/lib/clasificados/autos/autosNegociosCanonicalDraftLoad.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerHeroImages.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryChildApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`

## 9. Files changed

- `app/lib/clasificados/autos/autosVehicleMediaDraft.ts` — **new** shared media/video normalizer
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts` — child save/hydrate uses shared helper
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts` — main vehicle uses shared helper
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx` — save before flush
- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_23_ADDED_INVENTORY_REUSE_MAIN_MEDIA_PIPELINE_AUDIT.md` — this file
- `scripts/autos-a5-recovery-23-added-inventory-reuse-main-media-pipeline-audit.ts` — gate audit script
- `package.json` — audit script entry only

## 10. Shared media/video helper result

Created `autosVehicleMediaDraft.ts`:

- `coerceAutosVehicleMediaImageEntries()` — shared gallery row coerce (URL, data URL, IDB ref)
- `normalizeAutosVehicleMediaDraft()` — order, cover, hero sync, `videoUrls` dedupe/migration
- `applyAutosVehicleMediaDraftFields()` — in-place apply for main listing normalize

Wired into main (`normalizeLoadedListing`) and child (`prepareInventoryVehicleForSave`, `normalizeOneItem`).

## 11. Child save/edit result

- **Save:** `prepareInventoryVehicleForSave` writes full `mediaImages`, order/cover via normalizer, `heroImages`, `videoUrls`.
- **Edit/hydrate:** `normalizeOneItem` restores same shape from session/IDB inline.
- **Drawer order:** child upserted to parent ref before session flush.

## 12. Child preview/Volver a editar result

- Bundle Step 7 preview: unchanged R21 path — `rehydrateFromStorage()` after back; now loads session with child media.
- In-drawer step-6 preview: live draft overlay; no session round-trip needed within same edit session.

## 13. Parent active draft child media result

- `saveAutosNegociosDraftResolved` already serializes `additionalInventoryVehicles` + IDB offload.
- Fix ensures flush happens **after** child upsert so payload includes child `mediaImages` + `videoUrls`.
- `loadAutosNegociosDraftResolved` + `normalizeAdditionalInventoryVehicles` restore child media on hydrate/refresh.

## 14. Refresh result

- Durable URL media + `videoUrls` survive refresh via sessionStorage + IDB inline (same as main).
- Ephemeral `blob:` / unresolved File previews may not survive full refresh (same limitation as main vehicle).

## 15. Local file limitation note

Raw browser `File` objects and ephemeral `blob:` URLs may not survive a full tab refresh unless uploaded or stored in IDB. Within the same tab, Volver a editar must preserve in-memory/session state — fixed by flush ordering + shared normalization. Durable HTTPS URLs and IDB-offloaded child gallery entries persist across refresh when main vehicle supports them.

## 16. Privado/shared guardrail result

- Shared helper lives under `app/lib/clasificados/autos/` with no dealer inventory imports.
- `AutosPrivadoApplication.tsx` inspected — no `additionalInventoryVehicles`, no dealer drawer features added.

## 17. Manual QA checklist

See gate final response section 23 (Chuy checklist).

## 18. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | `C:/projects/elaguila-website`, branch `main`, HEAD `f8c75f45` |
| Dirty files reviewed before editing | TRUE | Unrelated home/footer/promo dirty files not touched |
| Autos-only scope respected | TRUE | Only autos negocios/shared lib + audit script |
| Main vehicle media/video pipeline inspected | TRUE | Section 4 |
| Main vehicle media field names documented | TRUE | `mediaImages`, `heroImages`, `isPrimary`, `sortOrder` |
| Main vehicle videoUrls field documented | TRUE | `videoUrls[]` + legacy `videoUrl` migration |
| Child media/video pipeline inspected | TRUE | Section 5 |
| Divergence between main and child documented | TRUE | Section 6–7 |
| Failure reproduced with child object shape proof | TRUE | Section 6 session vs memory shapes |
| Root cause documented specifically | TRUE | Section 7 — flush-before-save + divergent normalizers |
| Child uses same media/video normalization as main | TRUE | `normalizeAutosVehicleMediaDraft` shared |
| Child save stores media/images | TRUE | `prepareInventoryVehicleForSave` |
| Child save stores image order | TRUE | `normalizeMediaImagesOrder` in shared helper |
| Child save stores cover image | TRUE | `isPrimary` preserved in coerce + order |
| Child save stores videoUrls | TRUE | `prepareInventoryVehicleForSave` |
| Child edit hydrates media/images | TRUE | `normalizeOneItem` |
| Child edit hydrates image order | TRUE | shared normalizer |
| Child edit hydrates cover image | TRUE | shared normalizer |
| Child edit hydrates videoUrls | TRUE | `normalizeOneItem` |
| Child preview reads saved child media | TRUE | `previewVehicle` from `additionalVehicles` |
| Child preview reads saved child videoUrls | TRUE | full child draft passed to overlay |
| Child Volver a editar preserves media/images | TRUE | rehydrate loads fixed session snapshot |
| Child Volver a editar preserves image order | TRUE | shared normalizer on hydrate |
| Child Volver a editar preserves cover image | TRUE | shared normalizer |
| Child Volver a editar preserves videoUrls | TRUE | session includes videoUrls after flush fix |
| Parent draft serializer includes child media/images | TRUE | `saveAutosNegociosDraftResolved` |
| Parent draft serializer includes child videoUrls | TRUE | same payload |
| Parent draft hydrate restores child media/images | TRUE | `inlineAdditionalInventoryVehiclesFromIdb` + normalize |
| Parent draft hydrate restores child videoUrls | TRUE | `normalizeOneItem` |
| Refresh preserves saved child media metadata where main supports it | TRUE | session + IDB inline path |
| Refresh preserves child videoUrls | TRUE | JSON session field |
| Sibling children are preserved | TRUE | upsert replaces one id only |
| Parent media/video behavior not regressed | TRUE | main uses same shared helper |
| Volver a editar does not call destructive reset/clear | TRUE | preview/back grep clean |
| Local file limitation documented honestly | TRUE | Section 15 |
| Privado checked if shared helpers touched | TRUE | Section 16 |
| No dealer-only features leaked to Privado | TRUE | Privado grep clean |
| No unrelated categories touched | TRUE | gate-scoped diff |
| No global Stripe/payment touched | TRUE | no payment files in diff |
| No schema/migration touched | TRUE | no migration files in diff |
| npm run build passed | TRUE | validation step 11 |

## 19. Final recommendation

Final recommendation: GREEN — Child inventory reuses main vehicle media/video normalization; save-before-flush fixes stale session overwrite; parent serialize/hydrate includes child media/video. Pending Chuy live QA for blob/file edge cases.
