# Autos Vehicle Data Policy (Shared)

Policy for the stacked **A5.VDATA-A / B / C** Autos vehicle data improvement sequence.

| Gate | Scope |
|------|-------|
| **A (this document)** | Audit + lane impact policy + normalized shape + Gate B/C plan |
| **B** | Shared UI behavior + `autosVehicleData.ts` facade (trim/engine dropdowns, spec pre-fill, fallback copy) |
| **C** | Partial curated seed expansion (18 starter models) + full `npm run build` validation |

---

## Principles

1. **Structured dropdowns are preferred** for Year → Make → Model → Trim/Submodel → Engine when curated data exists — they improve filters, search, and listing consistency.
2. **Free-text fallback must always remain** for every identity/spec field.
3. **Rare/custom/modified vehicles must not be blocked.** Unlisted makes, models, trims, and engines are allowed.
4. **Dropdown values should feed normalized search/filter fields** (`normalizedMake`, `normalizedModel`, `normalizedTrim`, `normalizedEngine`) in a future gate.
5. **Custom values should also feed keywords/search** so owner-entered text remains discoverable.
6. **Negocios main form, Negocios inventory drawer, and Privado should share vehicle identity helpers** where possible (`AutosVehicleIdentityFields`, `autosVehicleTaxonomy.ts`).
7. **Additional inventory drawer must not be a weaker vehicle form** — same identity/spec helpers as main Negocios application.
8. **Dealer-only features must never be added to Privado** (inventory bundle, Business Hub, finance advisor, boost, reviews, custom dealer links).
9. **Future VIN decode can supplement manual entry, not replace it.**

---

## Data sources

| Source | Role | Status |
|--------|------|--------|
| **NHTSA vPIC** | Useful for VIN decode and official manufacturer-reported baseline data; not always enough for dealership trim UX alone | Not integrated — evaluate for future supplement |
| **Edmunds-style APIs** | Strong Make → Model → Model Year → Trim → Style hierarchy | Requires access/licensing — not added |
| **CarAPI / CarListAPI / commercial vehicle datasets** | Likely better trim/engine dropdown coverage | Requires API/licensing review — not added |
| **Manual curated seed** | Acceptable only as **partial starter data** for high-volume models | **Gate C active** — 18 starter models; partial/not year-complete |

**Gate A rules:** No large dataset import. No dealership scraping. No paid API keys. No server-side external API calls unless already safely configured elsewhere.

---

## Normalized data shape (proposed — Gate B/C)

Types may be documented in `autosVehicleDataTypes.ts` when implemented. Proposed shared shape:

### `VehicleYearMakeModelData`

| Field | Notes |
|-------|-------|
| `year` | Optional — partial coverage by design |
| `make` | Canonical make |
| `model` | Canonical model |
| `trims[]` | Trim options (see below) |

### Trim option

| Field | Required | Notes |
|-------|----------|-------|
| `label` | yes | Display label |
| `normalizedValue` | yes | Filter/search token |
| `aliases[]` | no | Alternate spellings |
| `engines[]` | no | Linked engine options |
| `transmissions[]` | no | Spec hints |
| `drivetrains[]` | no | Spec hints |
| `bodyStyles[]` | no | Spec hints |
| `fuelTypes[]` | no | Spec hints |
| `source` | no | e.g. `manual_curated_seed` |
| `confidence` | no | `curated` / `partial` / `inferred` |

### Engine option

| Field | Required | Notes |
|-------|----------|-------|
| `label` | yes | Display label |
| `normalizedValue` | yes | Filter token (`engineNormalized`) |
| `displacementLiters` | no | When known |
| `cylinders` | no | When known |
| `fuelType` | no | When known |
| `aspiration` | no | When known |
| `hybridOrEv` | no | When known |
| `aliases[]` | no | Alternate spellings |

Partial data is allowed. Unknown fields gracefully fall back to free text.

---

## Gate B — UI behavior plan (not implemented in Gate A)

### When Year + Make + Model are selected

- Show known trim/submodel dropdown if available.
- Always keep custom trim / free-text option.
- If no known trims, show helper:
  - **ES:** No encontramos trims estructurados para este modelo. Puedes escribirlo manualmente.
  - **EN:** We do not have structured trims for this model yet. You can enter it manually.

### When Trim is selected

- Show known engine options if available (Negocios + inventory drawer).
- Always keep custom engine / free-text option.
- If no engine options, keep free-text engine/motor field.

### When Engine is selected

- Populate related specs (fuel, drivetrain, transmission, body style) **only when safe** — empty fields only.
- **Never overwrite user-edited fields** without explicit confirmation.
- Show helper:
  - **ES:** Puedes ajustar estos datos si tu vehículo tiene una configuración diferente.
  - **EN:** You can adjust these details if your vehicle has a different configuration.

---

## Gate C — seed plan (not implemented in Gate A)

Expand a **small partial test set** only (do not claim global coverage):

- Toyota Camry, Corolla, RAV4
- Honda Civic, Accord, CR-V
- Ford F-150
- Chevrolet Silverado 1500
- Nissan Altima
- Tesla Model 3

Rules: mark `source`/`confidence`, include aliases where helpful, keep custom fallback, do not manually fill every year/model.

---

## Search/filter readiness plan

Future normalized fields (helper-only in early gates):

| Field | Purpose |
|-------|---------|
| `normalizedMake` | Canonical make for filter matching |
| `normalizedModel` | Canonical model |
| `normalizedTrim` | Canonical trim/submodel |
| `normalizedEngine` | Canonical engine (`engineNormalized` already exists on listing type) |
| `aliases[]` | Alternate spellings for fuzzy match |
| `keywords[]` | Combined search tokens including custom free-text |

**Rules:**

- Structured values feed filters/search.
- Custom values remain searchable via keywords.
- No fake analytics.
- No dashboard metric changes in VDATA gates.

**Current public browse filters** (`autosPublicFilterTypes.ts`): `make`, `model`, `yearMin`/`yearMax`, `bodyStyle`, `transmission`, `drivetrain`, `fuelType` — string match on listing payload; no trim/engine filter UI yet.

---

## Lane impact — field checklist

| Area | Negocios main | Inventory drawer | Privado | Shared Autos action |
| ---- | ------------- | ---------------- | ------- | ------------------- |
| Year | Structured `<select>` | Same shared component | Same shared component | Keep shared `getAutosVehicleYearOptions()` |
| Make | Structured `<select>` + unlisted free-text | Same | Same | Keep shared `AUTOS_VEHICLE_MAKES` + unlisted fallback |
| Model | Structured `<select>` or free-text if unknown make | Same | Same | Keep shared `getModelsForMake()` |
| Trim/Submodel | Dropdown when curated; else free-text | Same | Same | Gate B: no-structured-trim helper copy |
| Engine/Motor | Structured when curated + custom; specs step | Same | **Not in Privado form** (intentional simplified flow) | Gate B: Negocios + drawer only |
| Transmission | `SelectWithOtherField` | Same | Same taxonomy options | No lane split |
| Drivetrain | `SelectWithOtherField` | Same | Same | No lane split |
| Fuel | `SelectWithOtherField` | Same | Same | No lane split |
| Free-text fallback | All identity + spec fields | Same | Identity + specs (no engine field) | Must never be removed |

---

## Lane classification

| Component / lib | Classification |
|-----------------|----------------|
| `AutosVehicleIdentityFields` | Shared Autos |
| `autosVehicleTaxonomy.ts` | Shared Autos |
| `AutosVehicleEngineField` | Shared Autos — used Negocios + drawer only |
| `useAutosVehicleStructuredSpecFill` (planned Gate B) | Negocios + inventory drawer |
| Dealer inventory / boost / finance / Business Hub | Negocios only |

---

## Privado impact summary

Privado **shares** `AutosVehicleIdentityFields` (year/make/model/trim) and benefits from any shared taxonomy/normalization improvements.

Privado **does not** include `AutosVehicleEngineField` in its application steps — engine is not collected in the Privado publish flow by design. **No Privado code changes required for engine dropdown work in Gate B** unless product later adds an engine step.

No dealer-only fields shall be added to Privado in any VDATA gate.

---

## Year behavior (Gate C)

Starter seed is **make/model-based**, not year-complete. Year `<select>` remains independent; selecting any year does not block trim/engine dropdowns when make/model match a starter entry. Full year-specific trim/engine variance is deferred to **VDATA-D**.

---

## VDATA-D recommended next step

Before production dependency on external vehicle data:

1. **NHTSA vPIC** — evaluate for VIN decode and manufacturer-reported baseline (supplement only).
2. **Edmunds-style licensed hierarchy** — make/model/year/trim/style for richer dealership UX.
3. **CarAPI / CarListAPI / commercial datasets** — broader trim/engine coverage; requires licensing/API review.
4. **Curated CSV import** — high-volume local inventory patterns from dealer exports.

Requirements for VDATA-D:

- Licensing/API review before production dependency.
- **Manual free-text fallback must remain forever.**
- No dealership website scraping.
- No paid API keys without explicit approval gate.

