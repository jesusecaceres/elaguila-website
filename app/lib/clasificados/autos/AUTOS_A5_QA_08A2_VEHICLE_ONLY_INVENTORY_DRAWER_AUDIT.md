# A5.QA-08A.2 — Autos Negocios Full Vehicle-Only Inventory Drawer Gate

**Date:** 2026-06-02  
**Platform:** Cursor with Claude Sonnet  
**Final recommendation:** GREEN

## 1. Repo/source confirmation

| Field | Value |
| ----- | ----- |
| Root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |

## 2. Files inspected

A5.QA-08A.1 drawer, `useAutoDealerDraft`, `autosNegociosDraftStorage`, main `AutosNegociosApplication` steps, `AutosNegociosMediaManager`, shared vehicle components, preview client, Privado (read-only).

## 3. Current drawer behavior before fix

Mini form with year/make/model/price/mileage/single image URL/description; specs/media/highlights were “coming soon” placeholders.

## 4. Vehicle-only drawer section result

`AutosInventoryVehicleDrawerForm` — full sections: Información principal, Especificaciones, Destacados y equipamiento, Fotos y medios (reuses `AutosNegociosMediaManager`), Descripción, Resumen antes de guardar.

## 5. Step 5 exclusion / inherited dealer data result

No dealer/contact/finance/social/review/hours fields in drawer. `autosInventoryInheritedBusinessNotice` shown in form + review.

## 6. Full additional inventory draft state result

`AutosAdditionalInventoryVehicleDraft` stores identity, specs, features, media, description, status, `inventoryRole: additional`. Persisted in `AutosNegociosDraftV1.additionalInventoryVehicles`.

## 7. Save / save-and-add / cancel result

`upsertAdditionalInventoryVehicle` validates + saves; drawer closes on save, stays open on save-and-add with cleared vehicle fields; cancel closes without touching main draft.

## 8. Edit/remove child vehicle result

Paso 7 bundle cards: **Editar** opens drawer preloaded; **Quitar** confirms and removes child only.

## 9. Inventory count/limit result

Main = 1 of 10; additional count toward limit; at 10, add opens Inventory Boost panel (no 11th vehicle).

## 10. Paso 7 inventory bundle preview result

Main + additional cards with cover, title, price, mileage, photo count, status, edit/remove on additional.

## 11. Full preview inventory output result

`AutosNegociosPreviewInventorySection` on preview page — **Vista previa del inventario del dealer** with draft/preview labels, no fake URLs.

## 12. Results card preview result

`AutosNegociosResultsCardPreview` unchanged at top of Paso 7.

## 13. Inherited dealer data mapping result

`mapInheritedDealerPreviewListing` + `AUTOS_INVENTORY_INHERITED_FIELD_GROUPS` document inherited vs child fields. Multi-listing publish deferred to **A5.QA-08B**.

## 14. Draft/no-data-loss result

`additionalInventoryVehicles` in flush/autosave/refresh; edit/remove persist.

## 15. Final publish safety result

Drawer save does not publish. **Publicar anuncio** remains sole publish CTA. No fake child Leonix IDs.

## 16. Analytics readiness guardrail result

`AUTOS_INVENTORY_ANALYTICS_EVENTS` updated — not wired, no fake metrics.

## 17. Privado cross-check result

**Privado checked — no dealer-only inventory drawer added.**

## 18. Build/check result

- `npm run autos:a5-qa-08a2-vehicle-only-inventory-drawer-audit` — PASS  
- `npm run autos:a5-qa-08a1-open-inventory-cta-drawer-audit` — PASS  
- `npm run autos:a5-qa-07-application-persistence-inventory-truth-audit` — PASS  
- `npm run autos:enforce-smoke` — PASS  
- `npm run autos:a5-qa-05-full-recovery-final-audit` — FAIL (unrelated `en-venta` files in working tree, not from this gate)  
- `npm run build` — PASS (exit 0)

## 19. Remaining risks

- Local file blobs may not survive hard refresh (browser security).
- A5.QA-08B must map bundle to real multi-listing publish rows.

## 20. Manual QA checklist

1. Paso 7 → **Agregar vehículo al inventario** → full vehicle sections visible.  
2. Fill identity/specs/media/description → **Guardar en inventario**.  
3. **Guardar y agregar otro** → second vehicle.  
4. F5 on Paso 7 → both remain.  
5. **Editar** additional card → change price → save.  
6. **Quitar** additional → confirm → removed after refresh.  
7. Preview page → **Vista previa del inventario del dealer** shows added vehicles.  
8. At 10 vehicles → add opens Inventory Boost (no 11th).

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | git rev-parse |
| Autos scope lock respected | TRUE | Negocios + lib only |
| Existing drawer inspected before editing | TRUE | §3 |
| Drawer uses vehicle-only Autos application flow | TRUE | `AutosInventoryVehicleDrawerForm` |
| Drawer includes Información principal vehicle section | TRUE | Section + identity fields |
| Drawer includes Especificaciones section | TRUE | Specs + shared dropdowns |
| Drawer includes Destacados/equipamiento section | TRUE | Badges/features/equipment |
| Drawer includes Fotos y medios section | TRUE | `AutosNegociosMediaManager` |
| Drawer includes Descripción section | TRUE | Description textarea |
| Drawer excludes Negocio/contacto step | TRUE | No dealer fields in form |
| Drawer shows inherited business/contact helper | TRUE | `autosInventoryInheritedBusinessNotice` |
| Business/contact/finance/social/review/hour fields are not duplicated in child form | TRUE | Blocklist + no fields |
| Drawer reuses main Autos options/components where safe | TRUE | Shared taxonomy/components |
| Full additionalInventoryVehicles draft state exists | TRUE | Extended draft type |
| Child vehicle stores identity/specs/features/media/description | TRUE | Full draft fields |
| Child vehicle inherits dealer data from parent | TRUE | `mapInheritedDealerPreviewListing` |
| Save to inventory saves child draft and closes drawer | TRUE | Drawer persist(false) |
| Save and add another saves child draft and keeps drawer open | TRUE | persist(true) |
| Cancel closes without wiping main draft | TRUE | onClose only |
| Drawer has no Publish CTA | TRUE | Save/Cancel only |
| Added child vehicles can be edited | TRUE | Bundle Editar + drawer |
| Added child vehicles can be removed | TRUE | Bundle Quitar |
| Main vehicle counts as 1 of 10 | TRUE | `countApplicationInventoryVehicles` |
| Added vehicles count toward 10 included | TRUE | Limit check on upsert |
| Vehicle 11 triggers/points to Inventory Boost shell | TRUE | `onAtLimit` → boost panel |
| Paso 7 shows main vehicle card | TRUE | Bundle preview |
| Paso 7 shows added vehicle cards | TRUE | Maps additionalVehicles |
| Paso 7 inventory layout handles 1, 3, and 10 vehicles cleanly | TRUE | Responsive grid classes |
| Full preview shows added inventory vehicles | TRUE | Preview inventory section |
| Added vehicles are labeled draft/preview before publish | TRUE | Preview card labels |
| Results/landing card preview still exists at top | TRUE | `AutosNegociosResultsCardPreview` |
| Inherited dealer data mapper/helper exists or documented | TRUE | `autosInventoryInheritedPreview.ts` |
| Refresh preserves main draft and child vehicles | TRUE | Draft V1 persistence |
| Preview/back preserves child vehicles | TRUE | Preview loads draft array |
| Opening/closing boost preserves child vehicles | TRUE | No draft clear on boost |
| Drawer save does not publish child vehicle | TRUE | Draft-only upsert |
| Main final publish remains only true publish CTA | TRUE | Final actions unchanged |
| Multi-listing final publish deferred to A5.QA-08B or safely supported | TRUE | Documented §13 |
| No fake child public URL created before publish | TRUE | Preview labels only |
| No fake Leonix ID created before publish | TRUE | Generated-on-publish text |
| No fake analytics created | TRUE | Events list only |
| Future analytics hooks documented | TRUE | `AUTOS_INVENTORY_ANALYTICS_EVENTS` |
| Privado checked for shared impact | TRUE | §17 |
| No dealer-only inventory drawer added to Privado | TRUE | §17 |
| No global Stripe/payment files modified | TRUE | Scope lock |
| No database/schema/migration files modified | TRUE | Scope lock |
| No unrelated categories touched | TRUE | Scope lock |
| npm run build passed | TRUE | Validation Step 20 |
