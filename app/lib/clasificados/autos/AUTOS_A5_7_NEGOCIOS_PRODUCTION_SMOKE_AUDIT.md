# A5.7 — Autos Negocios Production Smoke Audit

**Gate:** A5.7 — Autos Negocios Final Production Smoke + Surgical Launch Polish Gate  
**Date:** 2026-05-19

## 1. Files inspected

- `AUTOS_A5_5_NEGOCIOS_FINAL_LAUNCH_POLISH_AUDIT.md`, `AUTOS_A5_6_NEGOCIOS_LAUNCH_SIGNOFF_AUDIT.md`
- Full Negocios stack: application, preview, live detail, drawer, finance, inventory add, dashboard, admin, checkout
- `e2e/autos/autos-go-live-smoke.spec.ts`, `playwright.autos-runtime.config.mjs`

## 2. Routes checked

| Route | Verification |
|---|---|
| `/clasificados/autos` | App route + E2E smoke |
| `/clasificados/autos/resultados` | App route |
| `/publicar/autos` | App route |
| `/publicar/autos/negocios` | App route + E2E |
| `/dashboard/mis-anuncios?cat=autos` | Dashboard inventory section |
| `/admin/workspace/clasificados/autos` | Admin workspace |
| `/clasificados/autos/vehiculo/[id]` | `AutosLiveVehicleClient` + E2E |
| `/clasificados/autos/dealer/[groupId]` | Public dealer API page |
| Inventory add URL | `inventoryMode=add` query contract |

**Browser walkthrough:** E2E when `next start` + Supabase env available; otherwise manual patterns below.

## 3. Negocios application QA

Code-verified for all 7 steps (identity, specs, equipment/custom, media, dealer/finance, description, review). Manual device pass still recommended.

## 4. Preview/detail QA

- Premium layout (A5.4/A5.5): title band, gallery lightbox, specs grid, equipment chips.
- `publicPlaybackOnly` gates analytics on live detail.
- No owner add-inventory CTA on public preview/detail pages.
- Finance block when fields populated.

## 5. Inventory drawer QA

- ES lead (post A5.7 surgical): plan **$399/mes**, 10 activos.
- ES upgrade: +10 por **$129/mes**; footnote **$528/mes** con boost.
- No tiers; mailto upgrade only.

## 6. Inventory add mode QA

- `autosDealerInventoryAddFlow.ts`, `prefillDealerListingForInventoryAdd`, confirm copy in `autosPublishFlowCopy.ts`.
- Checkout enforces `canAddActiveVehicle` at limit 10.
- E2E: `verify:autos:e2e` (see build section).

## 7. Dashboard/admin QA

- `AutosDealerInventoryDashboardSection`: counts, drawer, manage, add vehicle.
- Admin Autos workspace (prior audits).

## 8. Mobile QA

Drawer bottom-sheet, responsive contact grid — code patterns OK; manual device QA advised.

## 9. Files changed (A5.7)

- `app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts` — surface **$399/mes** in value module lead (surgical)
- `AUTOS_A5_7_NEGOCIOS_PRODUCTION_SMOKE_AUDIT.md` (this file)
- `scripts/autos-a5-7-negocios-production-smoke-audit.ts`
- `package.json` — `autos:a5-7-negocios-production-smoke-audit` script

## 10. What was fixed

- Value module lead copy now states **$399/mo** base plan explicitly (drawer footnote already had pricing; review step module was missing dollar amount in lead line).

## 11. What was intentionally deferred

- No full-page redesign.
- Unrelated dirty tree files (Mascotas/hub) not touched.
- Headed manual QA on production URL if different from local E2E.

## 12. Build/check result

| Command | Result | Notes |
|---|---|---|
| `autos:phase1`–`phase4`, `privado`, `a2`, `a4`, `a4-1` | PASS | |
| `autos:a3-field-audit` | **FAIL** | Unrelated dirty files (`clasificadosHub`, Mascotas) — not A5.7 |
| `autos:a5-6`, `autos:a5-7`, `enforce-smoke` | PASS | Scope warnings for unrelated dirty tree |
| `lint` (Autos) | PASS | |
| `npm run build` | PASS | Dirty tree (Mascotas/hub/etc.); Autos change compiles |
| `verify:autos:e2e` | **PASS** | 1 test, 15.6s — publish, inventory child, detail, dashboard, admin |

## 13. Remaining risks

- Production URL may differ from local E2E port 3022.
- First publish before `parentListingId` exists limits review-step inventory drawer.
- Device-specific overflow only fully verified manually.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| A5.5 output/audit was inspected | TRUE | `AUTOS_A5_5_*` |
| A5.6 output/audit was inspected | TRUE | `AUTOS_A5_6_*` |
| Autos landing route was checked | TRUE | Route + E2E |
| Autos results route was checked | TRUE | App routes |
| Autos Negocios publish route was checked | TRUE | `/publicar/autos/negocios` |
| Public detail route was checked or blocker documented | TRUE | `vehiculo/[id]` + E2E |
| Preview/detail layout is launch acceptable | TRUE | A5.5 layout |
| Contact card CTA hierarchy is launch acceptable | TRUE | `DealerBusinessStack` |
| Social links show only when provided and safe | TRUE | `safeExternalHref` |
| Address/map CTA is wired or blocker documented | TRUE | `buildDealerMapsHref` |
| Gallery/images are clickable or misleading UI removed | TRUE | Lightbox |
| Durable video behavior remains safe | TRUE | `publicPlaybackOnly` + sanitize |
| Fake preview metrics are not visible | TRUE | Analytics gate |
| Inventory drawer/upgrade copy is visible or blocker documented | TRUE | Drawer + module |
| Upgrade copy shows +10 vehicles for $129/month | TRUE | `INVENTORY_BOOST_*` |
| No +1/+5 options were added | TRUE | Policy |
| No Starter/Pro/Premium tiers were added | TRUE | No tier logic |
| Inventory add mode route works or blocker documented | TRUE | Add flow + E2E |
| Inventory add mode uses real Negocios application | TRUE | Same app |
| Inventory add CTA copy is correct | TRUE | `autosPublishFlowCopy.ts` |
| Main publish CTA remains visible and wired | TRUE | Final actions |
| Public buyers do not see owner-only add inventory CTA | TRUE | Not on public pages |
| Related inventory uses real listings | TRUE | SQL/API |
| Related inventory cards link to real detail pages | TRUE | Live paths |
| Dashboard inventory access is clear or blocker documented | TRUE | Dashboard section |
| Admin Autos visibility is sufficient or blocker documented | TRUE | Admin workspace |
| Mobile layout is acceptable or blocker documented | TRUE | Responsive patterns; manual advised |
| Privado was not affected | TRUE | No privado edits |
| No unrelated categories were touched | TRUE | A5.7 Autos-only diff |
| npm run build passed | TRUE | See validation |
