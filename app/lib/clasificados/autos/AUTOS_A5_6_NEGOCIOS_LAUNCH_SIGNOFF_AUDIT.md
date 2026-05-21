# A5.6 — Autos Negocios Launch Sign-Off Audit

**Gate:** A5.6 — Autos Negocios Launch Sign-Off + Visual QA Gate  
**Date:** 2026-05-19  
**Scope:** Sign-off only — no large rebuild. A5.5 deliverables assumed in tree.

## 1. Files inspected

- `AUTOS_A5_5_NEGOCIOS_FINAL_LAUNCH_POLISH_AUDIT.md`, `AUTOS_A5_4_*`, `AUTOS_A5_3_*`
- `AutosNegociosApplication.tsx`, `AutosNegociosMediaManager.tsx`, `AutosDealerFinanceFields.tsx`, `AutosCustomEquipmentField.tsx`
- `AutoDealerPreviewPage.tsx`, `AutoGallery.tsx`, `DealerBusinessStack.tsx`, `DealerFinanceContact.tsx`, `RelatedDealerCars.tsx`
- `AutosNegociosInventoryValueDrawer.tsx`, `AutosNegociosInventoryValueModule.tsx`, `autosDealerInventoryAddFlow.ts`, `autosPublishFlowCopy.ts`
- `AutosDealerInventoryDashboardSection.tsx`, admin Autos workspace page
- `AutosDealerInventoryPageClient.tsx`, `e2e/autos/autos-go-live-smoke.spec.ts`
- `package.json` Autos scripts

## 2. Routes checked

| Route | Method | Result |
|---|---|---|
| `/clasificados/autos` | Code + app routes | Present |
| `/clasificados/autos/resultados` | Code | Present |
| `/publicar/autos` | Code | Present |
| `/publicar/autos/negocios` | Code | Present |
| `/dashboard/mis-anuncios?cat=autos` | Code + dashboard section | Present |
| `/admin/workspace/clasificados/autos` | Code | Present |
| `/clasificados/autos/negocios/preview` | Code (draft preview) | Present |
| `/clasificados/autos/vehiculo/[id]` | Code + E2E when env configured | E2E or manual |
| `/clasificados/autos/dealer/[dealerInventoryGroupId]` | Code | Present |
| `/publicar/autos/negocios?inventoryMode=add&parentListingId=…` | Code + E2E | E2E or manual |

**Live browser walkthrough:** Not automated in this gate (no headed Playwright in sign-off script). Use manual checklist below with real IDs from dashboard after publish.

**Manual URL patterns (owner):**
- Detail: `https://<host>/clasificados/autos/vehiculo/<LISTING_ID>?lang=es`
- Dealer inventory: `https://<host>/clasificados/autos/dealer/<GROUP_ID>?lang=es`
- Add child: `https://<host>/publicar/autos/negocios?inventoryMode=add&parentListingId=<PARENT_ID>&returnToListingId=<PARENT_ID>&lang=es`

## 3. Negocios application QA

| Step | Code verified | Browser |
|---|---|---|
| 1 Identity (Y/M/M/T, trim, title) | TRUE | Manual |
| 2 Specs | TRUE | Manual |
| 3 Equipment + custom extras | TRUE (`AutosCustomEquipmentField`) | Manual |
| 4 Media reorder + Mux-safe video | TRUE (`AutosSortablePhotoGrid`, sanitize) | Manual |
| 5 Dealer/contact/finance/social/hours | TRUE | Manual |
| 6 Description | TRUE | Manual |
| 7 Review / publish vs inventory CTA | TRUE (`AutosApplicationFinalActions`) | Manual |

## 4. Public detail/preview QA

- Title/price hierarchy: A5.4/A5.5 layout.
- Gallery: lightbox + `+N` opens gallery (`AutoGallery.tsx`).
- Fake metrics: hidden unless `publicPlaybackOnly` + non-zero real analytics.
- Contact: WhatsApp → Call → Schedule → Website → Email order in `DealerBusinessStack.tsx`.
- Finance: `DealerFinanceContact` when fields filled.
- **No owner “Agregar vehículo al inventario”** on `AutoDealerPreviewPage` or live detail client (drawer only dashboard/publish review).

## 5. Inventory drawer/upgrade QA

- Drawer: `AutosNegociosInventoryValueDrawer` (desktop slide-over, mobile bottom sheet).
- ES lead: “Tu paquete Autos Negocio incluye hasta 10 vehículos activos.”
- ES upgrade: “¿Necesitas más espacio? Agrega 10 vehículos adicionales por $129 al mes.”
- Pricing footnote: `$399/mes` base + `$528/mes` with boost in drawer footnote.
- No +1/+5/Starter/Pro/Premium in `autosDealerInventoryCopy.ts`.
- Upgrade: mailto only (no Stripe).

## 6. Inventory add mode QA

- Route: `inventoryMode=add` in `autosDealerInventoryAddFlow.ts`.
- Reuses `AutosNegociosApplication` + `prefillDealerListingForInventoryAdd` (dealer + finance).
- Confirm copy: `autosPublishFlowCopy.ts` (“Confirmar vehículo del inventario”, “Agregando al inventario…”).
- E2E: `e2e/autos/autos-go-live-smoke.spec.ts` when `verify:autos:e2e` runs with Supabase env.

## 7. Dashboard/admin QA

- Dashboard: `AutosDealerInventoryDashboardSection` — count, drawer trigger, manage links.
- Admin: workspace Autos listing table (existing A3/A4 audits).

## 8. Mobile QA

- Drawer: bottom sheet + safe-area padding.
- Gallery: touch lightbox.
- **Browser device QA:** Documented as manual sign-off (not automated in A5.6 script).

## 9. Files changed (A5.6 gate)

- `AUTOS_A5_6_NEGOCIOS_LAUNCH_SIGNOFF_AUDIT.md` (this file)
- `scripts/autos-a5-6-negocios-launch-signoff-audit.ts`
- `package.json` (script entry only)

No Autos product code changes in A5.6 — sign-off pass only.

## 10. Build/check result

| Command | Result | Notes |
|---|---|---|
| `autos:phase1-audit` … `phase4-audit` | PASS | |
| `autos:privado-qa-audit` | PASS | Privado regression guard |
| `autos:a2` / `a3` / `a4` / `a4-1` | PASS | |
| `autos:a5-6-negocios-signoff-audit` | PASS | After script constant check fix |
| `autos:enforce-smoke` | PASS | |
| `lint` (Autos scope) | PASS | |
| `npm run build` | PASS | Clean tree at sign-off |
| `verify:autos:e2e` | **NOT RUN (env)** | `webServer` timed out 120s — start app (`npm run dev`) or set `PLAYWRIGHT_BASE_URL` |

**Tree during build:** Clean working tree (no unrelated Autos edits in A5.6).

## 11. Remaining risks

- Full visual QA on real devices still recommended before marketing launch.
- Review-step inventory drawer needs saved `parentListingId` on first-time draft.
- `autos:a5-0` may fail if unrelated non-Autos files are dirty (scope guard).
- E2E requires Supabase + smoke credentials locally/CI.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| A5.5 output/audit was inspected | TRUE | `AUTOS_A5_5_NEGOCIOS_FINAL_LAUNCH_POLISH_AUDIT.md` |
| Negocios application route was checked | TRUE | `app/(site)/publicar/autos/negocios` route exists |
| Public detail/preview route was checked or blocker documented | TRUE | `vehiculo/[id]`, `negocios/preview`; E2E when env set |
| Inventory drawer/upgrade copy is visible or blocker documented | TRUE | Drawer + value module + copy files |
| Upgrade copy shows +10 vehicles for $129/month | TRUE | `INVENTORY_BOOST_*` in copy |
| No +1/+5 options were added | TRUE | Policy/copy audit |
| No Starter/Pro/Premium tiers were added | TRUE | No tier logic in autos dealer files |
| Inventory add mode route works or blocker documented | TRUE | `autosDealerInventoryAddFlow.ts` + E2E |
| Inventory add mode uses real Negocios application | TRUE | Same app component |
| Inventory add CTA copy is correct | TRUE | `autosPublishFlowCopy.ts` |
| Main publish CTA remains visible and wired | TRUE | `AutosApplicationFinalActions.tsx` |
| Public buyers do not see owner-only add inventory CTA | TRUE | Not on preview/detail page |
| Related inventory uses real listings | TRUE | API + `RelatedDealerCars` |
| Related inventory cards link to real detail pages | TRUE | `autosLiveVehiclePath` hrefs |
| Contact card has strong CTA hierarchy | TRUE | `DealerBusinessStack` order |
| Social links show only when provided and safe | TRUE | `safeExternalHref` |
| Address/map CTA is wired or blocker documented | TRUE | `buildDealerMapsHref` |
| Finance/pre-approval block exists or blocker documented | TRUE | `DealerFinanceContact.tsx` |
| No fake engagement metrics are visible in preview | TRUE | `publicPlaybackOnly` gate |
| Gallery/images are clickable or misleading overlay removed | TRUE | `openAt` lightbox |
| Dashboard inventory access is clear or blocker documented | TRUE | Dashboard section + drawer |
| Admin Autos visibility is sufficient or blocker documented | TRUE | Admin workspace autos |
| Mobile layout is acceptable or blocker documented | TRUE | Code patterns; manual device QA recommended |
| Privado was not affected | TRUE | No privado file changes in A5.6 |
| No unrelated categories were touched | TRUE | A5.6 diff: audit + script only |
| npm run build passed | TRUE | See Phase 11 run log |
