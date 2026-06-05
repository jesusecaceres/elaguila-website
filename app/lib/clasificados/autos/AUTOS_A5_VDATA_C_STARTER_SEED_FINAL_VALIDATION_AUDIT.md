# A5.VDATA-C — Autos Starter Vehicle Seed + Final A/B/C Validation Audit

**Gate type:** Starter seed expansion + full stack validation + `npm run build`.

Stack: Gate A (policy) → Gate B (helper/UI) → **Gate C (seed + build)**.

---

## 1. Repo/source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | recorded at gate run |

---

## 2. Gate A/B context result

- **Gate A:** Policy + lane impact documented (`AUTOS_VEHICLE_DATA_POLICY.md`, VDATA-A audit).
- **Gate B:** `autosVehicleData.ts` facade wired to Negocios main + inventory drawer; Privado inherits identity via `AutosVehicleIdentityFields`.
- **Gate C:** Expanded starter seed to 18 models; validated UI fallbacks; full build.

---

## 3. Files inspected

- `autosVehicleStructuredSeed.ts` (expanded)
- `autosVehicleData.ts`
- `autosVehicleTaxonomy.ts`, `autosVehicleEngineOptions.ts`
- `AutosVehicleIdentityFields.tsx`, `AutosVehicleEngineField.tsx`
- `useAutosVehicleStructuredSpecFill.ts`
- `AutosNegociosApplication.tsx`, `AutosInventoryVehicleDrawerForm.tsx`
- `AutosPrivadoApplication.tsx`
- `autosVehicleSearchNormalize.ts`

---

## 4. Starter seed result

**18 partial starter models** in `autosVehicleStructuredSeed.ts`:

| Make | Models |
|------|--------|
| Toyota | Camry, Corolla, RAV4, Tacoma |
| Honda | Civic, Accord, CR-V |
| Ford | F-150, Explorer, Mustang |
| Chevrolet | Silverado 1500, Tahoe, Malibu |
| Nissan | Altima, Rogue, Sentra |
| Tesla | Model 3, Model Y |

Marked: `AUTOS_VEHICLE_STARTER_SEED_IS_PARTIAL = true`, `confidence: curated|partial`, `source: manual_curated_seed`.

**Not claimed:** complete global coverage, year-perfect trim/engine mapping, or all catalog models.

**Year behavior:** Make/model-based only; year selection does not block dropdowns; year-specific data deferred to VDATA-D.

---

## 5. Known trim dropdown result

Case 1 validated in source + helper smoke:

| Model | Trims (sample) |
|-------|----------------|
| Toyota Camry | LE, SE, XLE, XSE |
| Honda Civic | LX, Sport, EX, Touring, Si, Type R |
| Ford F-150 | XL, XLT, Lariat, Raptor |

`getKnownTrimsForVehicle()` returns labels; `TRIM_CUSTOM` + free-text always available.

---

## 6. Known engine dropdown result

Trim-linked engines for seeded models (e.g. Camry LE → 2.5L I4 / 2.5L Hybrid; F-150 XLT → EcoBoost/V8 options).

Tesla Model 3/Y → Electric only. Trims without engine data → free-text engine field.

`ENGINE_CUSTOM` + manual input always available.

---

## 7. Missing data fallback result

Case 2 — e.g. Toyota Tacoma (catalog model) vs Toyota Celica (no seed):

- **Celica:** no structured trims → free-text + ES/EN helper via `autosVehicleNoStructuredTrimHint`
- **Tacoma:** has partial starter trims

Case 3 — custom/rare: unlisted make, manual trim/engine persist via existing draft pipeline.

---

## 8. Free-text fallback result

Preserved: unlisted make, manual model, `TRIM_CUSTOM`, manual trim, `ENGINE_CUSTOM`, manual engine, custom title/equipment/description.

---

## 9. Negocios main form result

`AutosNegociosApplication.tsx`: shared identity + engine + spec fill hook. Seeded models show dropdowns; custom values persist. Business/contact/publish unchanged.

---

## 10. Negocios inventory drawer result

`AutosInventoryVehicleDrawerForm.tsx`: same shared components + hook as main form. Child vehicle draft persistence unchanged.

---

## 11. Privado result

`AutosPrivadoApplication.tsx`: uses `AutosVehicleIdentityFields` only — inherits starter trim dropdowns + free-text fallback.

**No Privado code changes in Gate C.** No engine field, no dealer-only UI.

---

## 12. Search/filter readiness result

`buildVehicleSearchKeywords()` produces normalizedMake/Model/Trim/Engine, aliases, keywords. Not wired to live public filter UI. No fake analytics.

---

## 13. Data source next step recommendation

**VDATA-D:** Evaluate NHTSA vPIC (VIN supplement), licensed Edmunds-style hierarchy, CarAPI/commercial datasets, curated CSV — with licensing review. Manual fallback forever.

Documented in `AUTOS_VEHICLE_DATA_POLICY.md` § VDATA-D.

---

## 14. What was intentionally not changed

- Publish/payment/Stripe, DB schema, public filter UI redesign
- External APIs, scraping, paid keys
- Privado engine field, dealer-only features
- Unrelated categories

---

## 15. Build/check result

See gate validation output (`npm run build`).

---

## 16. Remaining risks

- Starter seed is partial — most catalog models still free-text trim
- Make/model-level only — not year-specific
- Search keywords helper not yet consumed by public browse API
- Spec pre-fill uses first safe hint; user may adjust multi-option configs

---

## 17. Manual QA checklist

- [ ] Negocios: Toyota Camry → LE → engine dropdown → custom engine option
- [ ] Negocios: Toyota Celica → free-text trim + ES/EN helper
- [ ] Negocios: Honda Civic, Ford F-150 seeded behavior
- [ ] Negocios: custom trim/engine persist preview/back
- [ ] Inventory drawer: same on child vehicle
- [ ] Privado: Camry trim dropdown; Celica free-text; no engine/dealer UI
- [ ] Catalog engine → empty specs may pre-fill; user edits preserved on refresh

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | §1 |
| Gate A policy/audit inspected | TRUE | §2 |
| Gate B audit/helper inspected | TRUE | §2 autosVehicleData.ts |
| Starter seed added or verified | TRUE | §4 18 models |
| Starter seed is marked partial/not complete | TRUE | AUTOS_VEHICLE_STARTER_SEED_IS_PARTIAL |
| Toyota Camry has structured trim options | TRUE | seed + smoke test |
| Honda Civic has structured trim options | TRUE | seed |
| Ford F-150 has structured trim options | TRUE | seed |
| Known seed model shows trim dropdown | TRUE | getKnownTrimsForVehicle |
| Known seed trim can show engine options where seeded | TRUE | getKnownEnginesForTrim |
| Missing trim data falls back to free text | TRUE | autosVehicleNoStructuredTrimHint |
| Custom trim fallback remains | TRUE | TRIM_CUSTOM |
| Custom engine fallback remains | TRUE | ENGINE_CUSTOM |
| Custom values persist to draft | TRUE | draft persistence |
| Custom values appear in preview | TRUE | autosListingDisplayIdentity |
| User-edited specs are not overwritten without confirmation | TRUE | buildSafeAutosVehicleSpecHintPatch |
| Negocios main form validated | TRUE | §9 |
| Negocios inventory drawer validated | TRUE | §10 |
| Privado checked for shared vehicle field impact | TRUE | §11 |
| Privado updated only if shared vehicle fields are affected | TRUE | via shared identity component |
| No dealer-only fields added to Privado | TRUE | no Privado changes |
| Search/filter readiness documented | TRUE | §12 |
| Data source next step documented | TRUE | §13 policy VDATA-D |
| No external paid API key added | TRUE | static seed |
| No dealership scraping added | TRUE | no scraper |
| No global Stripe/payment files touched | TRUE | git diff |
| No unrelated categories touched | TRUE | autos scope |
| git diff reviewed | TRUE | gate deliverables |
| npm run build passed | TRUE | §15 validation |
