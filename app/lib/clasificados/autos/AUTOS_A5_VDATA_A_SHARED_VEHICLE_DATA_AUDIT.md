# A5.VDATA-A — Autos Shared Vehicle Data Audit + Lane Impact Policy

**Gate type:** Audit-only (no UI implementation, no seed import, no build).

Stack position: **Gate A** of A/B/C. Gate B = UI behavior. Gate C = partial seed + full build.

---

## 1. Repo/source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `80f73702aa12028b269db8cad0b51ec7c544dff2` |

---

## 2. Current vehicle data inventory

### Data files

| File | Role |
|------|------|
| `autosVehicleTaxonomy.ts` | Static makes, models, year range, trim strings; `coerceVehicleIdentityFromTaxonomy()` |
| `autosVehicleEngineOptions.ts` | Curated engine map; `getEngineOptionsForVehicle()`, `coerceEngineFromCatalog()`, `engineNormalized` |
| `autoDealerTitle.ts` | `normalizeVehicleSegment()`, `buildVehicleTitle()` |
| `autosListingDisplayIdentity.ts` | Display-boundary normalization |
| `autosVehicleDataTypes.ts` | Proposed normalized types (exists in working tree — document only for Gate A) |
| `autosVehicleStructuredSeed.ts` | Partial seed prototype (exists in working tree — Gate C scope) |

### Structured today

| Field | Mechanism | Coverage |
|-------|-----------|----------|
| **Year** | `<select>` via `getAutosVehicleYearOptions()` | 1985 → current+1 |
| **Make** | `<select>` 26 makes + `__unlisted_make__` free-text | Broad US-oriented list |
| **Model** | `<select>` when make has catalog models; else free-text | ~10–15 models per major make |
| **Trim** | `<select>` when `getTrimOptionsForMakeModel()` returns options; else free-text + manual option | **Partial** — see table below |
| **Engine** | `<select>` when `getEngineOptionsForVehicle()` returns options; else free-text | **Partial** — Negocios + drawer only |
| **Transmission / Drivetrain / Fuel / Body** | `SelectWithOtherField` with taxonomy enums + custom | Structured enum + free-text other |

### Free text today

- Unlisted make (`__unlisted_make__` → text input)
- Model when make has no catalog list
- Trim via `TRIM_CUSTOM` or direct text when no curated trims
- Engine via `ENGINE_CUSTOM` or direct text when no curated engines
- All `*Custom` spec fields, custom title override, equipment, description

### Models with trim dropdown data today

| Make | Model | Trims (curated) |
|------|-------|-----------------|
| Toyota | Camry, Corolla, RAV4 | Yes |
| Honda | Civic, Accord, CR-V | Yes |
| Ford | F-150, Mustang | Yes |
| Chevrolet | Silverado 1500 | Yes |
| Nissan | Altima | Yes |
| Tesla | Model 3 | Yes |
| All other catalog models | — | **No** — free-text trim |

### Engine behavior

- **Negocios main + inventory drawer:** `AutosVehicleEngineField` — catalog select when trim/model mapped; free-text fallback; sets `engineNormalized` on catalog pick.
- **Privado:** No engine field in publish application (intentional).

### Shared helpers

| Helper | Negocios main | Inventory drawer | Privado |
|--------|---------------|------------------|---------|
| `AutosVehicleIdentityFields` | Yes | Yes | Yes |
| `AutosVehicleEngineField` | Yes | Yes | No |
| `autosVehicleTaxonomy.ts` | Yes | Yes | Yes |
| `coerceVehicleIdentityFromTaxonomy` | Yes (draft load) | Yes | Yes |

Inventory drawer reuses the same shared identity/engine components as main application — not a weaker mini-form.

### Public results filters (Autos-scoped)

`app/(site)/clasificados/autos/filters/autosPublicFilterTypes.ts`:

- Filters: `make`, `model`, `yearMin`/`yearMax`, `bodyStyle`, `transmission`, `drivetrain`, `fuelType`, plus price/mileage/location/seller type.
- **No trim or engine filter** in public URL contract today.
- Matching is string-based on listing payload fields — normalization at publish/display helps consistency but filter wiring for `normalizedTrim`/`normalizedEngine` is future work.

---

## 3. Negocios main form result

**Inspected:** `AutosNegociosApplication.tsx`

- Step A (Principal): `AutosVehicleIdentityFields` for year/make/model/trim.
- Step B (Specs): `AutosVehicleEngineField` + transmission/drivetrain/fuel/body via `SelectWithOtherField`.
- Uses `coerceVehicleIdentityFromTaxonomy` / `coerceEngineFromCatalog` on draft boundaries.
- **Gate A action:** Document only. Gate B will align trim/engine fallback copy and safe spec pre-fill.

---

## 4. Negocios inventory drawer result

**Inspected:** `AutosInventoryVehicleDrawerForm.tsx`

- Imports same `AutosVehicleIdentityFields` and `AutosVehicleEngineField` as main form.
- Full vehicle spec sections (not dealer-business fields).
- Child vehicle draft persists via `autosAdditionalInventoryDraft.ts`.
- **Gate A action:** Document parity requirement. Gate B must keep drawer at parity with main form.

---

## 5. Privado result

**Inspected:** `AutosPrivadoApplication.tsx`

- Step A: `AutosVehicleIdentityFields` only (year/make/model/trim).
- No `AutosVehicleEngineField`, no inventory drawer, no finance/Business Hub fields.
- Auto title built from year/make/model/trim for search consistency.
- **Gate A conclusion:** Privado receives shared identity improvements via `AutosVehicleIdentityFields` in Gate B. **No Privado engine changes needed** unless product adds engine step later. **No dealer-only fields present or planned.**

---

## 6. Shared Autos helper result

| Helper | Status at audit |
|--------|-----------------|
| `AutosVehicleIdentityFields.tsx` | Active — shared Negocios + Privado + drawer |
| `AutosVehicleEngineField.tsx` | Active — Negocios + drawer |
| `autosVehicleTaxonomy.ts` | Active static taxonomy |
| `autosVehicleEngineOptions.ts` | Active partial engine map |
| `autosListingDisplayIdentity.ts` | Display normalization |
| `buildAutosVehicleNormalizedIdentity()` (planned) | Documented in policy — Gate B/C helper |

---

## 7. Free-text fallback policy

Documented in `AUTOS_VEHICLE_DATA_POLICY.md`:

- Structured preferred; free-text always available.
- Unlisted make, manual trim, manual engine must persist to draft/preview/publish.
- Custom values included in future keyword generation.
- **Gate A: no free-text fields removed.**

---

## 8. Search/filter readiness plan

| Field | Current | Planned |
|-------|---------|---------|
| `normalizedMake` | Implicit via `resolveMakeToCanonical` | Explicit helper Gate B/C |
| `normalizedModel` | Implicit via `resolveModelToCanonical` | Explicit helper |
| `normalizedTrim` | `normalizeVehicleSegment` only | Structured trim `normalizedValue` |
| `normalizedEngine` | `engineNormalized` on listing type | Expand catalog coverage Gate C |
| `aliases` / `keywords` | Not persisted | Helper-only; no DB schema change |

Public filters already accept `make`/`model`/`year`/`bodyStyle`/`transmission`/`drivetrain`/`fuelType` — structured dropdown values should align with these enum strings where possible.

---

## 9. Data source recommendation

1. **Short term:** Manual curated partial seed (Gate C) for ~10 high-volume models.
2. **Medium term:** Evaluate NHTSA vPIC for VIN-assisted prefill (supplement only).
3. **Long term:** Licensed commercial dataset (Edmunds/CarAPI) if trim/engine coverage needs exceed manual curation ROI.

No scraping. No paid API keys in VDATA gates without separate licensing review gate.

---

## 10. Gate B implementation recommendation

1. Update `AutosVehicleIdentityFields` with no-structured-trim ES/EN helper when model selected but no trim catalog.
2. Ensure `AutosVehicleEngineField` keeps custom engine path; add spec-adjust helper on catalog engine pick.
3. Add `useAutosVehicleStructuredSpecFill` (or equivalent) — pre-fill **empty only** transmission/drivetrain/fuel/bodyStyle on catalog trim/engine select.
4. Wire hook in Negocios main + inventory drawer only.
5. Add `buildAutosVehicleNormalizedIdentity()` helper (no live filter wiring yet).
6. Verify Privado inherits identity changes only; no engine/dealer leakage.

---

## 11. Gate C seed recommendation

1. Create/expand `autosVehicleStructuredSeed.ts` with partial data for 10 high-volume models.
2. Mark every entry `source: manual_curated_seed`, `confidence: curated|partial`.
3. Merge seed into `getTrimOptionsForMakeModel` / `getEngineOptionsForVehicle`.
4. Run full audit suite + `npm run build`.
5. Do not claim complete global coverage in UI or docs.

---

## 12. Remaining risks

- Trim/engine coverage is partial — most models still free-text trim.
- Public browse has no trim/engine filter — normalization alone does not improve filter UX until wired.
- Spec pre-fill (Gate B) must not overwrite user edits — requires empty-field-only logic.
- Working tree may contain pre-Gate-B prototype files from exploratory work — Gate B should reconcile, not duplicate.

---

## 13. Manual QA checklist (post Gate B/C)

- [ ] Negocios: model with trims (Camry) → dropdown + manual option
- [ ] Negocios: model without trims (Tacoma) → free-text + ES/EN helper
- [ ] Negocios: engine catalog + custom engine persist
- [ ] Inventory drawer: same behavior as main form
- [ ] Privado: identity fields work; no engine dropdown; no dealer UI
- [ ] Custom make/model/trim persists preview/back/refresh
- [ ] Public results: make/model filter still works with catalog + custom values

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| -------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §1 git rev-parse |
| Current Autos vehicle data inspected | TRUE | §2 |
| Current trim dropdown behavior inspected | TRUE | AutosVehicleIdentityFields + getTrimOptionsForMakeModel |
| Current engine field behavior inspected | TRUE | AutosVehicleEngineField + autosVehicleEngineOptions |
| Negocios main vehicle fields inspected | TRUE | §3 AutosNegociosApplication |
| Negocios inventory drawer vehicle fields inspected | TRUE | §4 AutosInventoryVehicleDrawerForm |
| Privado vehicle fields inspected | TRUE | §5 AutosPrivadoApplication |
| Shared Autos helpers inspected | TRUE | §6 |
| Vehicle data policy created | TRUE | AUTOS_VEHICLE_DATA_POLICY.md |
| Normalized data shape documented | TRUE | Policy § Normalized data shape |
| Free-text fallback policy documented | TRUE | Policy § Principles + § Gate B |
| Search/filter readiness documented | TRUE | §8 + Policy § Search/filter |
| Data source recommendation documented | TRUE | §9 + Policy § Data sources |
| Privado lane impact documented | TRUE | §5 + Policy lane checklist |
| No dealer-only fields added to Privado | TRUE | §5 — no Privado changes in Gate A |
| No external paid API key added | TRUE | Gate A audit-only |
| No dealership scraping added | TRUE | Gate A audit-only |
| No unrelated categories touched | TRUE | Gate A scope — autos lib/docs/script only |
| No global Stripe/payment files touched | TRUE | Gate A scope |
| git diff reviewed | TRUE | Gate A deliverables only |

---

## Gate A deliverables (this gate)

| File | Action |
|------|--------|
| `AUTOS_VEHICLE_DATA_POLICY.md` | Created/updated |
| `AUTOS_A5_VDATA_A_SHARED_VEHICLE_DATA_AUDIT.md` | Created |
| `scripts/autos-a5-vdata-a-shared-vehicle-data-audit.ts` | Created |
| `package.json` | Audit script entry only |

**Intentionally not changed in Gate A:** UI components, seed data files, publish/payment, DB schema, unrelated categories.
