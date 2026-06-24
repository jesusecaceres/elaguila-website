# A5.RECOVERY-26 — Autos Added Inventory Edit Hydrates Saved Child

## 1. Gate title

**A5.RECOVERY-26 — Autos Added Inventory Edit Must Hydrate Saved Child From Working Preview Source**

## 2. Repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `50e7785f9f594bca9c8aa9121f9acea1e462c469` |

## 3. Dirty file preflight

**Gate-scoped (touched):**

- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `e2e/autos/autos-a5-recovery-26-child-edit-hydrates-saved-inventory.spec.ts`
- `e2e/autos/autos-a5-recovery-25-child-media-persistence.spec.ts` (Editar identity assertions)
- `playwright.autos-recovery-26.config.mjs`
- `scripts/autos-a5-recovery-26-child-edit-hydrates-saved-inventory-audit.ts`
- `package.json`

**Unrelated dirty (not touched):** `en-venta/**`, `magazine/**`, `app/lib/magazine/**`, `app/lib/leonix/mediaKitRoutes.ts`

## 4. Production failure summary

Chuy production proof: Step 7 child card and child preview gallery show saved child + images, but **Editar** (and sometimes after child preview **Volver a editar**) opens blank **Agregar vehículo al inventario** form instead of hydrating the saved child.

## 5. Working preview/card child data source

| Surface | File / function | Child source |
| ------- | ---------------- | ------------ |
| Step 7 card | `AutosNegociosInventoryBundlePreview` → `additionalVehicles.map` | `additionalInventoryVehicles[]` via `inventoryVehicleCoverUrl(v)` |
| Child Ver vista previa | Same bundle → `previewVehicle = findSavedAdditionalInventoryVehicle(...)` | Same saved child object |
| Child preview gallery | `AutosNegociosChildInventoryPreviewOverlay` → `mapInheritedDealerPreviewListing(parent, child)` | `child.mediaImages`, `child.videoUrls` |
| Más vehículos preview section | `mapAutosNegociosBuyerPreviewViewModel` / related listings | `additionalInventoryVehicles` |

## 6. Broken edit path

1. **Editar** → `onDrawerOpenChange(true, v.id)` → `AutosNegociosAddInventoryDrawer` with `editingVehicle` from parent prop lookup only.
2. **`resolveCanonicalChildInventoryEditorDraft()`** when `editingVehicle === null` but `drawerEditingId` set → returned `createEmptyInventoryVehicleDraft()` instead of looking up saved child in `additionalInventoryVehicles`.
3. Drawer title fell back to **Agregar vehículo al inventario** because `isEditing = Boolean(editingVehicle?.id)` without bundle lookup.
4. Child preview **Volver a editar** left stale `inventoryDrawerEditingId` in session state from return-context apply (could confuse add/edit drawer routing).

## 7. Exact root cause

| Item | Detail |
| ---- | ------ |
| **File** | `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts` |
| **Function** | `resolveCanonicalChildInventoryEditorDraft()` |
| **Wrong source** | `editingVehicle` prop only (nullable when bundle lookup not repeated inside drawer/resolver) |
| **Missing step** | No `additionalInventoryVehicles.find(id === drawerEditingId)` — same lookup preview/card already use |
| **Drop point** | `if (!editingVehicle) return createEmptyInventoryVehicleDraft()` when `drawerEditingId` pointed at saved child |

Secondary: `AutosNegociosAddInventoryDrawer` used `isEditing = Boolean(editingVehicle?.id)` so edit mode UI showed add title on blank hydrate.

## 8. Files inspected

- `autosAdditionalInventoryDraft.ts`, `autosInventoryInheritedPreview.ts`, `autosNegociosEditorReturnContext.ts`
- `AutosNegociosInventoryBundlePreview.tsx`, `AutosNegociosAddInventoryDrawer.tsx`, `AutosNegociosChildInventoryPreviewOverlay.tsx`
- `useAutoDealerDraft.ts`, `AutosNegociosAddInventoryTrigger.tsx`
- R25/R26 Playwright specs

## 9. Files changed

Listed in §3 gate-scoped files.

## 10. Editar mode/childId result

**PASS** — Editar calls `onDrawerOpenChange(true, v.id)`. Drawer sets `data-autos-inventory-drawer-mode="edit"` and heading **Editar vehículo adicional** when saved child resolves.

## 11. Saved child hydration result

**PASS** — `findSavedAdditionalInventoryVehicle(additionalVehicles, drawerEditingId)` shared by card, preview, and editor. Step 1 fields (2021 Honda Civic, price) hydrate on Editar.

## 12. Media/video hydration result

**PASS** — Resolver hydrates full saved child (R24/R25 path preserved) including `mediaImages` + `videoUrls`. R25 spec asserts media on Editar after preview/back + refresh.

## 13. Child preview Volver a editar result

**PASS** — Overlay `onBackToEdit` runs `rehydrateFromStorage()` + `clearAutosNegociosEditorReturnContext()`. Does not auto-open add drawer. Step 7 card remains; user clicks Editar explicitly.

## 14. Refresh result

**PASS** — Session restores `additionalInventoryVehicles`; Editar after refresh opens edit mode with filled Step 1 fields.

## 15. Local browser proof

**PASS** — `npm run autos:a5-recovery-26-browser-proof` (Playwright, 25-step flow): save child with image URL + video URL → Editar (edit mode, Step 1 filled, Fotos y medios hydrated) → preview → Volver a editar → Editar (media present) → refresh → Editar (media present).

## 16. Manual QA checklist for Chuy

1. `/publicar/autos/negocios?lang=es` — minimum parent + one child with image URL + video URL
2. Save → card shows image
3. **Editar** → must show **Editar vehículo adicional**, Step 1 filled, Fotos y medios not empty
4. Ver vista previa → Volver a editar → **Editar** again → still not blank
5. Refresh → **Editar** → still not blank, media/video present

## 17. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ---------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Autos-only scope respected | TRUE | §9 |
| Working Step 7 child source inspected | TRUE | §5 |
| Working child preview source inspected | TRUE | §5 |
| Broken Editar path inspected | TRUE | §6 |
| Exact root cause documented | TRUE | §7 |
| Editar passes saved childId | TRUE | §10 |
| Editar opens edit mode, not add mode | TRUE | §10 Playwright |
| Editar locates child in additionalInventoryVehicles | TRUE | `findSavedAdditionalInventoryVehicle` |
| Editar hydrates Step 1 fields | TRUE | §11 Playwright |
| Editar hydrates images/media | TRUE | §12 Playwright |
| Editar hydrates image URLs | TRUE | §12 |
| Editar hydrates media order/cover where supported | TRUE | canonical normalizer |
| Editar hydrates videoUrls | TRUE | §12 Playwright |
| Editar does not create blank child when saved child exists | TRUE | §7 resolver + missing guard |
| Volver a editar preserves parent draft | TRUE | §13 |
| Volver a editar preserves saved child | TRUE | §13 |
| Volver a editar does not force blank add form | TRUE | §13 |
| Refresh preserves saved child | TRUE | §14 |
| Refresh then Editar hydrates saved child | TRUE | §14 Playwright |
| Sibling children are preserved | TRUE | upsert by id |
| Parent media/video behavior not regressed | TRUE | no main path edits |
| No unrelated categories touched | TRUE | §3 |
| No global Stripe/payment touched | TRUE | §3 |
| No schema/migration touched | TRUE | §3 |
| npm run build passed | TRUE | validation |

## 18. Final recommendation

Final recommendation: **GREEN** — Editar now hydrates from the same `additionalInventoryVehicles` saved child object that powers Step 7 card and child preview; local Playwright proof passes.
