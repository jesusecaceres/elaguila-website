# A5.VDATA-B — Autos Shared Vehicle Helper + Dropdown Wiring Audit

**Gate type:** Implementation (shared helper + UI wiring). No large dataset. Build deferred to Gate C.

---

## 1. Repo/source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | recorded at gate run |

---

## 2. Gate A policy read result

Read `AUTOS_VEHICLE_DATA_POLICY.md` and `AUTOS_A5_VDATA_A_SHARED_VEHICLE_DATA_AUDIT.md`.

Implemented per policy:
- Structured dropdowns preferred; free-text always available
- Gate B starter data: Toyota Camry, Honda Civic, Ford F-150 only
- Negocios + drawer share helpers; Privado identity-only
- Safe spec pre-fill (empty fields only)
- No external APIs / scraping / paid keys

---

## 3. Files inspected

- `app/lib/clasificados/autos/autosVehicleData.ts` (new facade)
- `app/lib/clasificados/autos/autosVehicleDataTypes.ts`
- `app/lib/clasificados/autos/autosVehicleStructuredSeed.ts`
- `app/lib/clasificados/autos/autosVehicleTaxonomy.ts`
- `app/lib/clasificados/autos/autosVehicleEngineOptions.ts`
- `app/lib/clasificados/autos/autosVehicleSpecHints.ts`
- `app/lib/clasificados/autos/autosVehicleSearchNormalize.ts`
- `app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx`
- `app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx`
- `app/(site)/publicar/autos/shared/components/useAutosVehicleStructuredSpecFill.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`

---

## 4. Shared helper result

**Created:** `autosVehicleData.ts` — unified Autos-scoped facade.

| Function | Purpose |
|----------|---------|
| `getKnownTrimsForVehicle(year, make, model)` | Trim labels; `[]` when unknown |
| `getKnownEnginesForTrim(year, make, model, trim)` | Engine labels; `[]` when unknown |
| `normalizeVehicleMake/Model/Trim/Engine` | Normalization preserving custom values |
| `buildVehicleSearchKeywords(selection)` | `normalizedMake/Model/Trim/Engine`, aliases, keywords |
| `autosVehicleNoStructuredTrimHint(lang)` | ES/EN no-trim-data copy |
| `autosVehicleSpecAdjustHelper(lang)` | ES/EN spec adjust copy |

Types exported: `AutosVehicleYearMakeModelData`, `AutosVehicleTrimOption`, `AutosVehicleEngineOption`, `AutosVehicleStructuredSelection`.

---

## 5. Structured trim behavior result

- `AutosVehicleIdentityFields` uses `getKnownTrimsForVehicle(year, make, model)`
- Catalog trim `<select>` when data exists + `TRIM_CUSTOM` manual option
- No data → free-text input + `autosVehicleNoStructuredTrimHint`
- Starter trims: Camry (LE/SE/XLE/XSE), Civic (LX/Sport/EX/Touring/Si/Type R), F-150 (XL/XLT/Lariat/Raptor)

---

## 6. Structured engine behavior result

- `AutosVehicleEngineField` uses `getKnownEnginesForTrim(year, make, model, trim)`
- Catalog engine `<select>` when data exists + `ENGINE_CUSTOM` manual option
- No data → free-text engine field
- Spec-adjust helper shown on catalog engine pick
- `useAutosVehicleStructuredSpecFill` pre-fills empty transmission/drivetrain/fuel/bodyStyle only

---

## 7. Free-text fallback result

**Preserved:**
- `__unlisted_make__`, manual model, `TRIM_CUSTOM`, manual trim input
- `ENGINE_CUSTOM`, manual engine input
- Custom title, equipment, description unchanged
- Custom values persist via existing draft/preview pipeline

---

## 8. Negocios main form result

**Shared Autos + Negocios** — `AutosNegociosApplication.tsx`:
- `AutosVehicleIdentityFields` + `AutosVehicleEngineField` + `useAutosVehicleStructuredSpecFill`
- `year` passed to engine field
- Business/contact fields untouched

---

## 9. Negocios inventory drawer result

**Negocios only** — `AutosInventoryVehicleDrawerForm.tsx`:
- Same shared components + spec fill hook as main form
- `year={draft.year}` on engine field
- No dealer-business fields added to drawer

---

## 10. Privado result

**Shared Autos (identity only)** — `AutosPrivadoApplication.tsx`:
- Uses `AutosVehicleIdentityFields` → inherits Gate B trim behavior automatically
- **No code changes required** — Privado intentionally omits engine field and all dealer-only UI
- **No dealer-only fields added**

---

## 11. Search/filter readiness result

- `buildVehicleSearchKeywords()` in `autosVehicleData.ts` wraps `buildAutosVehicleNormalizedIdentity()`
- Produces `normalizedMake`, `normalizedModel`, `normalizedTrim`, `normalizedEngine`, `aliases`, `keywords`
- Not wired to live public filter UI (Gate C / future)
- No fake analytics

---

## 12. What was intentionally not changed

- Publish/payment/Stripe flows
- DB schema/migrations
- Public search/results filter UI
- Large vehicle dataset import (Gate C)
- Privado engine field (not in product flow)
- Unrelated categories
- **`npm run build`** — deferred to Gate C

---

## 13. Remaining risks

- Only 3 starter models have structured trim/engine data
- Spec pre-fill uses first hint value; user may need to adjust multi-option trims
- `buildVehicleSearchKeywords` not yet consumed by public browse API
- Gate C must expand seed and run full build

---

## 14. Manual QA checklist

- [ ] Negocios: Toyota Camry → trim dropdown → LE → engine dropdown
- [ ] Negocios: Toyota Tacoma → free-text trim + ES/EN no-data helper
- [ ] Negocios: custom trim + custom engine persist preview/back
- [ ] Inventory drawer: same Camry/Tacoma behavior on child vehicle
- [ ] Privado: Camry trim dropdown works; Tacoma free-text; no engine field
- [ ] Edit catalog engine → empty fuel/transmission may pre-fill; edit one → refresh keeps user value
- [ ] Unlisted make still works end-to-end

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | §1 |
| Gate A policy/audit inspected | TRUE | §2 |
| Shared Autos vehicle helper exists | TRUE | autosVehicleData.ts |
| Helper supports structured trim lookup | TRUE | getKnownTrimsForVehicle |
| Helper supports structured engine lookup | TRUE | getKnownEnginesForTrim |
| Helper handles missing data gracefully | TRUE | returns [] |
| Helper preserves custom values | TRUE | normalize* + draft text |
| Free-text trim fallback remains | TRUE | TRIM_CUSTOM + input |
| Free-text engine fallback remains | TRUE | ENGINE_CUSTOM + input |
| Known trim dropdown appears when data exists | TRUE | Camry/Civic/F-150 |
| Missing trim data shows free-text helper copy | TRUE | autosVehicleNoStructuredTrimHint |
| Known engine dropdown appears when data exists | TRUE | trim-linked engines |
| Missing engine data keeps free-text engine field | TRUE | options.length === 0 |
| User-edited specs are not overwritten without confirmation | TRUE | buildSafeAutosVehicleSpecHintPatch |
| Negocios main form wired to shared helper | TRUE | AutosNegociosApplication |
| Negocios inventory drawer wired to same helper | TRUE | AutosInventoryVehicleDrawerForm |
| Privado checked for shared vehicle field impact | TRUE | §10 |
| Privado updated if shared vehicle fields are affected | TRUE | via AutosVehicleIdentityFields |
| No dealer-only fields added to Privado | TRUE | no Privado file changes |
| Custom trim/engine values persist to draft | TRUE | existing draft persistence |
| Custom trim/engine values appear in preview | TRUE | autosListingDisplayIdentity |
| Search/filter readiness values documented/prepared | TRUE | buildVehicleSearchKeywords |
| No external paid API key added | TRUE | static seed only |
| No dealership scraping added | TRUE | no scraper |
| No global Stripe/payment files touched | TRUE | git diff scope |
| No unrelated categories touched | TRUE | autos scope |
| git diff reviewed | TRUE | Gate B deliverables |
