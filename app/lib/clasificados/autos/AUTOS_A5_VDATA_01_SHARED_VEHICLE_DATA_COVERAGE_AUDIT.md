# A5.VDATA-01 — Autos Shared Vehicle Data Coverage Audit

Gate: structured dropdown foundation + coverage audit for Year → Make → Model → Trim → Engine.

## 1. Repo/source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | recorded at gate run |

## 2. Current vehicle data inventory

### Structured today

| Layer | Location | Coverage |
|-------|----------|----------|
| Years | `getAutosVehicleYearOptions()` | 1985 → current year + 1 |
| Makes | `AUTOS_VEHICLE_MAKES` | 26 US-oriented makes |
| Models | `MODELS_BY_MAKE` | Per-make model lists |
| Trims | `TRIMS_BY_MAKE_MODEL` + `autosVehicleStructuredSeed.ts` | Partial — 10 high-volume models with rich trim data |
| Engines | `autosVehicleEngineOptions.ts` + structured seed | Partial — trim-linked for seeded models |
| Spec hints | `autosVehicleSpecHints.ts` | transmission/drivetrain/fuel/bodyStyle from seed |

### Free text today

- Unlisted make (`__unlisted_make__`)
- Model when make has no catalog models
- Trim custom mode + free-text when no trims or user chooses manual
- Engine custom mode + free-text when no engine catalog
- Custom title, equipment, description unchanged

### Trim dropdown population

| Model | Structured trims |
|-------|------------------|
| Toyota Camry/Corolla/RAV4 | Yes |
| Honda Civic/Accord/CR-V | Yes |
| Ford F-150 | Yes |
| Chevrolet Silverado 1500 | Yes (partial confidence) |
| Nissan Altima | Yes (partial confidence) |
| Tesla Model 3 | Yes |
| Most other models | No — free-text trim with helper |

### Engine

- Structured dropdown when trim/model has seed/legacy engines
- Free-text fallback always available
- `engineNormalized` set for catalog picks

### Shared helpers

- Negocios main + inventory drawer: `AutosVehicleIdentityFields`, `AutosVehicleEngineField`, `useAutosVehicleStructuredSpecFill`
- Privado: `AutosVehicleIdentityFields` only (no engine field in Privado specs — intentional)

## 3. Negocios main form result

**Shared Autos** — Uses shared identity + engine fields. Spec pre-fill hook wired. Custom fallbacks preserved.

## 4. Negocios inventory drawer result

**Negocios only** — Reuses same shared components + spec fill hook. Child vehicle draft stores structured and custom values via existing draft persistence.

## 5. Privado result

**Shared Autos (identity only)** — `AutosVehicleIdentityFields` receives trim structured/fallback behavior. No engine field (Privado-only simplified flow). No dealer-only fields added.

## 6. Shared Autos helper result

New/updated:

- `autosVehicleDataTypes.ts`
- `autosVehicleStructuredSeed.ts`
- `autosVehicleSpecHints.ts`
- `autosVehicleSearchNormalize.ts`
- `AUTOS_VEHICLE_DATA_POLICY.md`

## 7. Free-text fallback result

All custom paths preserved: unlisted make, manual trim, manual engine, custom title/equipment/description.

## 8. Search/filter readiness result

`buildAutosVehicleNormalizedIdentity()` produces `normalizedMake`, `normalizedModel`, `normalizedTrim`, `normalizedEngine`, `aliases`, `keywords`. Not wired to live filter UI this gate.

## 9. Data source audit note

Documented in `AUTOS_VEHICLE_DATA_POLICY.md`. No external paid APIs or scraping added. Manual curated seed only.

## 10. Build/check result

See gate validation run output.

## 11. Remaining risks

- Trim/engine coverage is partial (10 models enriched; most models still free-text trim).
- Spec pre-fill uses first hint value only; multi-option trims may need user adjustment.
- `buildAutosVehicleNormalizedIdentity` not yet consumed by public search API.
- Future VIN decode integration needs licensing/API review.

## 12. Manual QA checklist

- [ ] Negocios: Toyota Camry → trim dropdown → pick LE → engine dropdown → pick 2.5L I4
- [ ] Negocios: verify empty transmission/fuel may pre-fill; edit one field — refresh — user value kept
- [ ] Negocios: model without trims (e.g. Toyota Tacoma) shows ES/EN no-structured-trim helper
- [ ] Negocios: custom trim + custom engine persist through preview/back
- [ ] Inventory drawer: same trim/engine behavior on child vehicle
- [ ] Privado: year/make/model/trim works; no engine dropdown; no dealer inventory UI
- [ ] Unlisted make still works end-to-end

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------------ | ---------- | -------- |
| Correct repo confirmed | TRUE | git rev-parse |
| Current Autos vehicle data inspected | TRUE | §2 |
| Current trim dropdown behavior inspected | TRUE | AutosVehicleIdentityFields |
| Current engine field behavior inspected | TRUE | AutosVehicleEngineField |
| Shared Autos vehicle data policy created/updated | TRUE | AUTOS_VEHICLE_DATA_POLICY.md |
| Normalized vehicle data shape exists or documented | TRUE | autosVehicleDataTypes.ts |
| Free-text trim fallback remains | TRUE | TRIM_CUSTOM + free-text input |
| Free-text engine fallback remains | TRUE | ENGINE_CUSTOM + free-text input |
| Custom vehicle values persist to draft | TRUE | existing draft persistence |
| Custom vehicle values appear in preview | TRUE | autosListingDisplayIdentity |
| Negocios main form uses shared vehicle helper or documented blocker | TRUE | AutosNegociosApplication |
| Negocios inventory drawer uses same vehicle helper or documented blocker | TRUE | AutosInventoryVehicleDrawerForm |
| Privado checked for shared vehicle field impact | TRUE | AutosPrivadoApplication |
| Privado receives shared vehicle dropdown behavior if affected | TRUE | AutosVehicleIdentityFields |
| No dealer-only fields added to Privado | TRUE | no Privado file changes for dealer fields |
| Known trim dropdown appears when data exists | TRUE | getTrimOptionsForMakeModel |
| Missing trim data falls back to free text | TRUE | noStructuredTrimHint copy |
| Known engine dropdown appears when data exists | TRUE | getEngineOptionsForVehicle |
| Missing engine data falls back to free text | TRUE | options.length === 0 branch |
| User-edited specs are not overwritten without confirmation | TRUE | buildSafeAutosVehicleSpecHintPatch |
| Search/filter readiness documented | TRUE | autosVehicleSearchNormalize.ts + policy |
| Data source audit note included | TRUE | policy § Data sources |
| No external paid API key added | TRUE | static seed only |
| No dealership website scraping added | TRUE | no scraper code |
| No global Stripe/payment files touched | TRUE | git diff scope |
| No unrelated categories touched | TRUE | autos scope only |
| npm run build passed | TRUE | gate validation |
