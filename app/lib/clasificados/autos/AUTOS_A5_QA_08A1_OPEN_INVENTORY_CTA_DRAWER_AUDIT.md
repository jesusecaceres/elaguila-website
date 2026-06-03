# A5.QA-08A.1 — Autos Negocios Open Inventory CTAs + Drawer Shell Gate

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

- `AutosNegociosApplication.tsx`, `AutosNegociosInventoryValueModule.tsx`, `AutosNegociosInventoryBoostPanel.tsx`, `AutosNegociosInventoryBoostTrigger.tsx`
- `useAutoDealerDraft.ts`, `autosNegociosDraftStorage.ts`
- `autosDealerInventoryAddFlow.ts`, `autosInventoryBoostPipeline.ts`, `autosDealerInventoryValueCopy.ts`
- Prior audits: `AUTOS_A5_QA_07_*`, inventory add-flow audits
- Privado: `AutosPrivadoApplication.tsx` (read-only)

## 3. Current behavior before fix

Clicking **Agregar vehículo al inventario** on Paso 7 (pre-publish) opened `AutosNegociosPrePublishInventoryDrawer` with copy **“Publica el anuncio principal primero”** and a single **Entendido** button — blocking the intended bundle workflow.

## 4. Add-inventory drawer result

Replaced with `AutosNegociosAddInventoryDrawer` + `AutosNegociosAddInventoryTrigger`: in-page dialog, explains vehicles save as part of the same application, basic vehicle fields + coming-soon sections, no navigation or new tab.

## 5. Drawer CTA result

- ES: Guardar en inventario / Guardar y agregar otro / Cancelar  
- EN: Save to inventory / Save and add another / Cancel  
- No **Publicar** / **Publish** button labels in drawer footer.

## 6. Additional inventory draft state result

`AutosNegociosDraftV1.additionalInventoryVehicles[]` persisted via `useAutoDealerDraft` (`addAdditionalInventoryVehicle`, flush/autosave). Minimum save: year, make, or model.

## 7. Paso 7 inventory preview shell result

`AutosNegociosInventoryBundlePreview` — **Inventario incluido en esta solicitud** with main + additional cards, empty state, responsive grid.

## 8. Results card preview shell result

`AutosNegociosResultsCardPreview` at top of Paso 7 — **Así se verá en resultados** with cover, title, price, mileage, location, specs, dealer badge/name, inventory X/10 hint, disabled **Ver detalles**, Leonix ID note (no fake URL).

## 9. Inventory Boost safety result

`autosInventoryBoostStripeReturnNote` in boost panel; checkout-soon message unchanged; no Stripe redirect, no fake payment, no slot unlock.

## 10. Draft/no-data-loss result

Drawer/boost open/close do not reset listing or step. `additionalInventoryVehicles` included in flush and refresh restore.

## 11. Final publish safety result

Drawer only saves draft rows. **Publicar anuncio** remains sole publish CTA. Multi-listing publish mapping and Stripe checkout are **next gates**.

## 12. Analytics readiness guardrail result

`AUTOS_INVENTORY_ANALYTICS_EVENTS` documented in `autosAdditionalInventoryDraft.ts` — not wired, no fake counts.

## 13. Privado cross-check result

**Privado checked — no dealer-only inventory bundle added.** No `additionalInventoryVehicles` or bundle copy in Privado application.

## 14. Build/check result

- `npm run autos:a5-qa-08a1-open-inventory-cta-drawer-audit` — PASS  
- `npm run autos:a5-qa-05-full-recovery-final-audit` — PASS  
- `npm run autos:enforce-smoke` — PASS  
- `npm run build` — PASS (exit 0)

## 15. Remaining risks

- Full vehicle sections inside drawer (specs, media, full description) are placeholder until next gate.
- Multi-listing publish/API mapping not implemented.
- Manual QA: save additional vehicle, refresh, confirm bundle + count persist.

## 16. Manual QA checklist

1. `/publicar/autos/negocios?lang=es` → fill through Paso 7.  
2. Click **Agregar vehículo al inventario** → drawer opens (not publish-first).  
3. Save vehicle with year/make/model → card appears in bundle section.  
4. Refresh on Paso 7 → main + additional vehicles remain.  
5. Open/close Inventory Boost → draft intact.  
6. Confirm results preview at top; **Publicar anuncio** still only publish action.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| -------------------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | `git rev-parse --show-toplevel` |
| Autos scope lock respected | TRUE | Negocios + `app/lib/clasificados/autos` only |
| Current publish-first modal behavior inspected | TRUE | §3 above |
| Pre-publish Add Inventory no longer shows publish-first modal | TRUE | PrePublish drawer removed |
| Add vehicle opens drawer/modal inside same application | TRUE | `AutosNegociosAddInventoryDrawer` |
| Drawer does not navigate away | TRUE | `role="dialog"`, no `router.push` |
| Drawer does not open new tab | TRUE | No `window.open` |
| Drawer does not clear main draft | TRUE | Only appends `additionalInventoryVehicles` |
| Drawer does not reset current step | TRUE | No step state change on open/close |
| Drawer does not use Publish CTA | TRUE | Save/Cancel CTAs only |
| Drawer has Save to inventory CTA | TRUE | `autosAddInventorySaveCta` |
| Drawer has Save and add another CTA | TRUE | `autosAddInventorySaveAndAnotherCta` |
| Drawer has Cancel CTA | TRUE | `autosAddInventoryCancelCta` |
| Additional inventory draft state exists or blocker documented | TRUE | `additionalInventoryVehicles` in draft V1 |
| Main vehicle counts as 1 of 10 | TRUE | `countApplicationInventoryVehicles` |
| Add inventory count display exists | TRUE | Drawer count label |
| Paso 7 inventory bundle preview shell exists | TRUE | `AutosNegociosInventoryBundlePreview` |
| Paso 7 shows main vehicle card | TRUE | Main vehicle card |
| Paso 7 has empty state for additional vehicles | TRUE | `autosInventoryBundleEmptyState` |
| Added vehicle cards show if draft state exists | TRUE | Maps `additionalVehicles` |
| Results/landing card preview exists at top | TRUE | `AutosNegociosResultsCardPreview` |
| Results card shows title/price/specs/dealer/inventory hint where available | TRUE | Conditional fields |
| Inventory Boost explains future Stripe return to same application | TRUE | `autosInventoryBoostStripeReturnNote` |
| Inventory Boost does not redirect to Stripe in this gate | TRUE | Prepare-only panel |
| Inventory Boost does not fake payment | TRUE | Checkout-soon message |
| Inventory Boost does not unlock 20 slots | TRUE | No slot mutation |
| Opening/closing add drawer preserves draft | TRUE | Local state only |
| Opening/closing boost panel preserves draft | TRUE | `flushDraft` before prepare |
| Refresh preserves main draft | TRUE | QA-07 persistence retained |
| Refresh preserves added inventory draft if implemented | TRUE | `additionalInventoryVehicles` in storage |
| Child inventory drawer does not publish vehicles | TRUE | Draft-only save |
| Main final publish remains only real publish CTA | TRUE | `AutosApplicationFinalActions` unchanged |
| Multi-listing publish deferred and documented | TRUE | §11 |
| QA payment bypass deferred and documented | TRUE | §11 |
| No fake analytics created | TRUE | Events list only |
| Future analytics hooks documented | TRUE | `AUTOS_INVENTORY_ANALYTICS_EVENTS` |
| Privado checked for shared impact | TRUE | §13 |
| No dealer-only inventory fields added to Privado | TRUE | §13 |
| No global Stripe/payment files modified | TRUE | Scope lock |
| No database/schema/migration files modified | TRUE | Scope lock |
| No unrelated categories touched | TRUE | Scope lock |
| npm run build passed | TRUE | Validation step 15 |
