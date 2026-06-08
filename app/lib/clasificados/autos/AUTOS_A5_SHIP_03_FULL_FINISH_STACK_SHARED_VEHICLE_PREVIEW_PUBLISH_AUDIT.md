# A5.SHIP-03 — Autos Full Finish Stack: Shared Vehicle Data + True Preview + Publish QA Readiness Audit

Gate: **A5.SHIP-03 — Autos Full Finish Stack: Shared Vehicle Data + True Preview + Publish QA Readiness Gate**  
Platform: Cursor with Claude Sonnet  
Date: 2026-06-02

## 1. Repo / source confirmation

| Field | Value |
|---|---|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (gate start) | `9609722d0993d96b85aa33ce4374d0705ecaa0f3` |

## 2. Initial git status / diff

Gate start: clean working tree (SHIP-01 committed). This gate adds VIN decode + structured vehicle data uncommitted.

## 3. Files inspected

Prior audits: SHIP-01, 08E, 08B, 08A2, 08A3, 08P, AUTOS_SHARED_IMPACT_POLICY.md  
Vehicle flow: `AutosNegociosApplication`, `AutosInventoryVehicleDrawerForm`, `AutosPrivadoApplication`, `AutosVehicleIdentityFields`, `autosVehicleData.ts`, `autosAdditionalInventoryDraft.ts`  
Preview: `AutosNegociosPreviewClient`, `AutoDealerPreviewPage`, `DealerBusinessStack`  
Publish: `AutosPublishConfirmCore`, `checkout/route.ts`, `autosClassifiedsListingService.ts`, `autosNegociosBundlePublish.ts`

## 4. Lane impact classification

**Negocios:** VIN decode on main step + inventory drawer; true preview unchanged (SHIP-01)  
**Privado:** Shared `AutosVinDecodeBlock` on main vehicle step  
**Shared Autos:** `autosVehicleStructuredData.ts`, `autosNhtsaVinDecode.ts`, `autosVinDecodeCopy.ts`, `AutosVinDecodeBlock.tsx`, `decode-vin` API, type extensions on `AutoDealerListing`  
**No impact:** Stripe, migrations, unrelated categories

## 5. Current vehicle data behavior (before)

- Year → Make → Model → trim dropdown/free-text via `AutosVehicleIdentityFields`
- VIN field existed but no decode
- Spec fields manual or seed hints via `useAutosVehicleStructuredSpecFill`
- Child inventory used same identity fields without VIN decode

## 6. Shared vehicle data result

**PASS** — `autosVehicleStructuredData.ts` defines shared structured fields, fill-empty-only merge, filter key list.

## 7. NHTSA/vPIC helper result

**PASS** — `autosNhtsaVinDecode.ts` calls `DecodeVinValues`, maps to Autos fields, graceful errors.

## 8. API route result

**PASS** — `POST /api/clasificados/autos/decode-vin` (Autos-scoped, no auth, no API key).

## 9. Autos Negocios main vehicle result

**PASS** — `AutosVinDecodeBlock` in Step 1 with ES/EN copy, loading/success/partial/error states, fill-empty-only.

## 10. Autos Negocios additional inventory drawer result

**PASS** — Same block in `AutosInventoryVehicleDrawerForm`; patches child draft only.

## 11. Autos Privado result

**PASS** — `AutosVinDecodeBlock` in Privado Step 1; no dealer-only features added.

## 12. Structured draft/payload result

**PASS** — Extended `AutoDealerListing` + `AutosInventoryVehicleFields` with `version`, `motor`, `engineCylinders`, `displacementL`, `vehicleType`, `manufacturer`, `plantCountry`. Full listing JSON persists via existing `listing_payload` (no DB migration).

## 13. True preview result

**PASS** — SHIP-01 preview intact: capture banner, results card, inventory section, Business Hub/finance via `AutoDealerPreviewPage`.

## 14. Publish path result

**PASS (code)** — SHIP-01/08E: production columns, bundle publish, QA allowlist; child DB role `inventory_vehicle` (conceptual "additional").

## 15. Privado contamination check

**PASS** — No inventory drawer, boost, finance image, reviews, Business Hub in `AutosPrivadoApplication.tsx`.

## 16. Build/check result

See gate validation.

## 17. Remaining risks

1. NHTSA data is manufacturer-reported hints — manual override required for edge cases.
2. Live Supabase publish proof still manual (Chuy + SQL checklist).
3. Taxonomy mapping may use `Otro` + custom for uncommon NHTSA values.

## 18. Manual QA checklist for Chuy

See gate Step 18 in final response.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | elaguila-website |
| git diff reviewed before editing | TRUE | clean at gate start |
| Autos scope lock respected | TRUE | §4 |
| Lane impact classified before edits | TRUE | §4 |
| Negocios vehicle flow inspected | TRUE | AutosNegociosApplication |
| Negocios additional inventory drawer inspected | TRUE | AutosInventoryVehicleDrawerForm |
| Privado vehicle flow inspected | TRUE | AutosPrivadoApplication |
| Shared vehicle data helper exists or equivalent documented | TRUE | autosVehicleStructuredData.ts |
| NHTSA/vPIC decode helper exists or equivalent documented | TRUE | autosNhtsaVinDecode.ts |
| VIN normalization exists | TRUE | normalizeVinInput |
| VIN validation does not block typing | TRUE | free-text input; validate on decode click |
| Decode button exists in Negocios main vehicle step | TRUE | AutosVinDecodeBlock |
| Decode button exists in Negocios additional inventory drawer | TRUE | drawer form |
| Privado VIN decode added if affected or exact blocker documented | TRUE | Privado AutosVinDecodeBlock |
| Decode loading/success/error states exist | TRUE | autosVinDecodeCopy + block |
| Decode fills year when returned | TRUE | mapNhtsaDecodeToAutosVehicleFields |
| Decode fills make when returned | TRUE | mapper |
| Decode fills model when returned | TRUE | mapper |
| Decode fills trim/version when returned | TRUE | mapper |
| Decode fills engine/motor when returned | TRUE | mapper |
| Decode fills body style when returned | TRUE | mapBodyStyle |
| Decode fills drivetrain when returned | TRUE | mapDrivetrain |
| Decode fills transmission when returned | TRUE | mapTransmission |
| Decode fills fuel when returned | TRUE | mapFuel |
| Decode fills doors when returned | TRUE | mapper |
| Manual override remains in Negocios | TRUE | identity + spec fields unchanged |
| Manual override remains in Privado | TRUE | same |
| Empty NHTSA fields keep manual fallback | TRUE | fill-empty-only |
| Existing user-entered fields are not overwritten unsafely | TRUE | buildVinDecodeFillEmptyPatch |
| Child VIN decode affects child vehicle only | TRUE | drawer onPatch |
| Decoded child data persists in additionalInventoryVehicles | TRUE | draft fields extended |
| Structured fields persist in Negocios draft | TRUE | listing type + draft storage |
| Structured fields persist in Privado draft if affected | TRUE | shared listing type |
| Structured fields map to listing_payload | TRUE | JSON payload unchanged architecture |
| Structured fields are available for future filters/search | TRUE | autosVehicleSearchNormalize |
| Negocios true preview renders main vehicle | TRUE | AutosNegociosPreviewClient |
| Negocios true preview renders added inventory vehicles | TRUE | PreviewInventorySection |
| Negocios true preview renders Business Hub from real draft | TRUE | DealerBusinessStack |
| Negocios true preview renders finance image/logo when provided | TRUE | DealerFinanceContact |
| Negocios preview does not fake public URLs | TRUE | SHIP-01 |
| Negocios preview does not fake Leonix IDs before publish | TRUE | results card note |
| Negocios preview does not fake analytics | TRUE | publicPlaybackOnly gate |
| Publish path inspected | TRUE | checkout + bundle publish |
| Publish path uses production column names | TRUE | autosClassifiedsListingService |
| Code does not require slug column | TRUE | UUID detail routes |
| Main publish mapping writes lane negocios | TRUE | listing service |
| Main publish mapping writes inventory_role main | TRUE | promoteNegociosMainInventoryListing |
| Child publish mapping writes inventory_role additional | TRUE | DB value inventory_vehicle |
| Child publish mapping shares dealer_inventory_group_id | TRUE | bundle publish |
| Child publish mapping writes dealer_inventory_parent_listing_id | TRUE | createAutosClassifiedsListingWithInventoryParent |
| Each published row gets unique leonix_ad_id | TRUE | listing service |
| Success does not show on failed insert | TRUE | checkout bundle error 500 |
| Privado checked after shared changes | TRUE | §15 |
| No dealer-only inventory drawer added to Privado | TRUE | privado grep |
| No Inventory Boost added to Privado | TRUE | privado grep |
| No finance image/logo added to Privado | TRUE | privado grep |
| No dealer reviews/custom links added to Privado | TRUE | privado grep |
| No dealer Business Hub added to Privado | TRUE | privado grep |
| No database/schema/migration files touched | TRUE | no migrations |
| No global Stripe/payment files touched | TRUE | scope |
| No unrelated categories touched | TRUE | scope |
| npm run build passed | TRUE | gate validation |

Final recommendation: **GREEN**
