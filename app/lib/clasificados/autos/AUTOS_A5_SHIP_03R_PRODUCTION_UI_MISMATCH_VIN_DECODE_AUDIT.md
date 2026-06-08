# A5.SHIP-03R — Production UI Mismatch Recovery: VIN Decode Not Visible on Live Autos Negocios

Gate: **A5.SHIP-03R — Production UI Mismatch Recovery**  
Platform: Cursor with Claude Sonnet  
Date: 2026-06-02

## 1. Repo / source confirmation

| Field | Value |
|---|---|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD (recovery start) | `c351626768c96a8c58c3749a06b7b42df3ab5622` |

## 2. Screenshot mismatch summary

Production screenshot of `/publicar/autos/negocios?lang=es` showed Year → Make → Model → manual trim only, with no VIN field or **Decodificar VIN** button visible above the fold.

## 3. Whether SHIP-03 code existed before recovery

**TRUE** — Commit `73da79c5` added `AutosVinDecodeBlock`, NHTSA helper, API route, and wired imports in `AutosNegociosApplication`, inventory drawer, and Privado. Code was present in repo at HEAD `c3516267`.

## 4. Exact cause of VIN decode not showing in live Autos Negocios UI

**Primary cause (UX placement):** `AutosVinDecodeBlock` was rendered on Paso 1 but **below** price, mileage, city, state, and ZIP — after the vehicle identity dropdowns. Users viewing the top of the form (as in the screenshot) never scrolled to the VIN block.

**Secondary cause (deployment):** If production was deployed before `73da79c5`, the old UI would lack VIN decode entirely. Redeploy required after this fix.

**Not the cause:** Wrong route component (`page.tsx` correctly renders `AutosNegociosApplication`), unused import, step gating, or feature flags.

## 5. Files inspected

- `app/(site)/publicar/autos/negocios/page.tsx`
- `AutosNegociosApplication.tsx`
- `AutosInventoryVehicleDrawerForm.tsx`
- `AutosPrivadoApplication.tsx`
- `AutosVinDecodeBlock.tsx`
- `autosNhtsaVinDecode.ts`, `decode-vin/route.ts`

## 6. Files changed

- `AutosNegociosApplication.tsx` — moved VIN decode directly under `AutosVehicleIdentityFields`
- `AutosInventoryVehicleDrawerForm.tsx` — same placement in drawer main section
- `AutosPrivadoApplication.tsx` — same placement on Privado Paso 1
- `AutosVinDecodeBlock.tsx` — `data-autos-vin-decode-block` marker

## 7. Negocios main vehicle result

**PASS** — VIN + **Decodificar VIN** now appear immediately below year/make/model/trim on Paso 1 (`data-autos-vin-decode-anchor="negocios-main"`).

## 8. Additional inventory drawer result

**PASS** — VIN decode directly under child identity fields (`data-autos-vin-decode-anchor="negocios-inventory-drawer"`).

## 9. Privado result

**PASS** — VIN decode moved under identity fields on Paso 1. No dealer-only features added.

## 10. Structured payload result

**PASS (unchanged)** — SHIP-03 structured fields persist via existing draft → `listing_payload` JSON.

## 11. Build/check result

See gate validation.

## 12. Manual QA checklist

1. Open `/publicar/autos/negocios?lang=es` Paso 1 — VIN field + **Decodificar VIN** visible directly under trim dropdown (no scroll).
2. Enter test VIN → decode → confirm empty fields fill.
3. Open inventory drawer — VIN decode visible under child year/make/model.
4. Open `/publicar/autos/privado?lang=es` — VIN decode under identity fields.
5. Redeploy production after merge if not auto-deployed.

## 13. Remaining risks

1. Production must redeploy to pick up placement fix.
2. NHTSA may return partial data — manual fields remain.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | elaguila-website |
| Screenshot mismatch acknowledged | TRUE | §2 |
| Live Autos Negocios route component inspected | TRUE | page.tsx → AutosNegociosApplication |
| Cause of missing VIN decode UI identified | TRUE | §4 placement below fold |
| AutosVinDecodeBlock or equivalent exists | TRUE | shared component |
| VIN field is visible on Negocios Paso 1 | TRUE | anchor negocios-main above price |
| Decodificar VIN button is visible on Negocios Paso 1 | TRUE | autosVinDecodeCopy |
| Decode VIN button is visible in English mode | TRUE | autosVinDecodeCopy EN |
| Negocios Paso 1 imports and renders decode UI in visible JSX path | TRUE | import + render after identity |
| Decode fills empty year/make/model fields when returned | TRUE | mapNhtsaDecodeToAutosVehicleFields |
| Decode fills empty trim/version when returned | TRUE | mapper |
| Decode fills empty engine/motor when returned | TRUE | mapper |
| Decode fills empty bodyStyle/drivetrain/transmission/fuel/doors when returned | TRUE | taxonomy mappers |
| Decode does not overwrite user-entered values unsafely | TRUE | buildVinDecodeFillEmptyPatch |
| Manual fallback remains editable | TRUE | identity + spec fields unchanged |
| Additional inventory drawer shows VIN decode UI | TRUE | negocios-inventory-drawer anchor |
| Child VIN decode affects child draft only | TRUE | drawer onPatch |
| Child structured fields persist in additionalInventoryVehicles | TRUE | autosAdditionalInventoryDraft |
| Privado vehicle flow inspected | TRUE | AutosPrivadoApplication |
| Privado VIN decode visible if affected | TRUE | privado-main anchor |
| No dealer-only features added to Privado | TRUE | privado grep |
| Structured fields persist to draft/listing_payload | TRUE | listing JSON |
| No schema/migration touched | TRUE | no migrations |
| No global Stripe/payment touched | TRUE | scope |
| No unrelated categories touched | TRUE | scope |
| npm run build passed | TRUE | gate validation |

Final recommendation: **GREEN**
