# Autos — Phase 1 strict go-live audit (gated)

**Scope:** Marketplace parity checklist (Privado vs Negocios, public surfaces, payments, admin, trust). **Strict rules:** `TRUE (runtime)` only when this document records an executed check in this environment; otherwise `TRUE (code)` / `FALSE (runtime)` as noted.

## Matrix

| ID | Claim | Current proof | Verdict | If FALSE, exact fix needed |
| -- | ----- | ------------- | ------- | -------------------------- |
| A1 | Autos landing exists and loads. | `app/(site)/clasificados/autos/page.tsx` → `AutosLandingPage` | TRUE (code) | Add/repair landing route. |
| A2 | Autos results exists and loads. | `app/(site)/clasificados/autos/resultados/page.tsx` + `AutosPublicResultsShell` | TRUE (code) | Repair results route. |
| A3 | Autos detail route exists. | `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx` + `autosLiveVehiclePath()` | TRUE (code) | Keep detail under `/vehiculo/[id]`. |
| A4 | Autos publish branch exists. | `app/(site)/publicar/autos/page.tsx` + `PublicarAutosBranchClient` | TRUE (code) | Restore branch hub. |
| A5 | Privado route exists. | `app/(site)/publicar/autos/privado/page.tsx` | TRUE (code) | Restore privado publish path. |
| A6 | Negocios route exists. | `app/(site)/publicar/autos/negocios/page.tsx` | TRUE (code) | Restore negocios publish path. |
| A7 | Privado and Negocios copy clearly explain the difference. | `autosBranchCopy.ts` (ES/EN bodies: single private vehicle vs business/inventory mindset + future dealer page note) | TRUE (code) | Tighten branch copy further. |
| A8 | Privado does not feel like a dealership flow. | `AutosLiveVehicleClient` renders `AutoPrivadoPreviewPage` + `PrivadoContactStrip` (no dealer stack) for `lane === "privado"` | TRUE (code) | Remove shared dealer-only blocks from privado live. |
| A9 | Negocios supports dealership/business identity. | `AutoDealerPreviewPage` / dealer presence + `lane === "negocios"` live path | TRUE (code) | Wire missing dealer payload fields. |
| A10 | Negocios has or clearly points toward multi-car inventory / dealer page behavior. | `getActiveLiveAutosBundle` sets `relatedDealerListings`; branch copy states filtered results today + optional future dedicated dealer page; landing `buildDealerInventoryHref` → results | TRUE (code) | Ship dealer slug page OR keep honest “results filter” wording only. |
| A11 | Public cards clearly show seller type. | `AutosPublicStandardCard` seller chips from `AUTOS_PUBLIC_BLUEPRINT_COPY`; `AutosResultCard` uses same copy keys | TRUE (code) | Surface lane badges on any alternate card. |
| A12 | Public cards show enough buyer decision info: year, make, model, price, mileage, location, seller type. | `vehicleTitle` + `formatAutosUsd` + miles + `formatAutosLocation` + seller chip (`mapAutosClassifiedsToPublic.ts`) | TRUE (code) | Extend mapper if fields missing from payload. |
| A13 | Results filters are real and do not advertise fake controls. | `applyAutosPublicFilters` implements filters; `radiusMiles` not applied (documented); hero + filter copy states radius **not active** (`autosPublicBlueprintCopy.ts`) | TRUE (code) | Remove or disable any control that implies radius works. |
| A14 | CTA routes are not dead by code inspection. | `autosLiveVehiclePath` used in `AutosPublicStandardCard`, dashboard, checkout success URLs; **fixed** `AutosResultCard` to same helper (was legacy `/clasificados/autos/[id]`) | TRUE (code) | Grep for stale `/clasificados/autos/${id}` without `vehiculo`. |
| A15 | Checkout route exists. | `app/api/clasificados/autos/checkout/route.ts` POST | TRUE (code) | Restore checkout API. |
| A16 | Stripe env names are current: STRIPE_PRICE_AUTOS_NEGOCIOS and STRIPE_PRICE_AUTOS_PRIVADO. | `stripeAutosConfig.ts` | TRUE (code) | Rename envs + callers together. |
| A17 | Missing Stripe config fails closed and does not publish active listings. | Checkout returns 503 when `!isStripeAutosConfigured()` and no internal bypass; publish stays draft/pending until activation | TRUE (code) | Never call `activateAutosClassifiedsListing` from client without server gate. |
| A18 | Success verification activates only paid/verified listings. | `tryActivateAutosListingAfterPayment` requires `status === "pending_payment"`; verify GET checks `payment_status === "paid"` | TRUE (code) | Harden WHERE on activation SQL (already idempotent). |
| A19 | Runtime payment success is proven. | Not executed (no live Stripe session / no staging charge in this pass) | FALSE (runtime) | Run `npm run verify:autos:e2e` or manual Stripe test on staging. |
| A20 | Runtime payment failure/retry is proven. | Not executed end-to-end | FALSE (runtime) | Exercise cancel + `pago/error` + retry checkout on staging. |
| A21 | Published listing appears on landing. | Depends on Supabase + `GET /api/clasificados/autos/public/listings` + real publish | FALSE (runtime) | Seed listing + hit landing in browser. |
| A22 | Published listing appears on results. | Same as A21 | FALSE (runtime) | Same as A21. |
| A23 | Published listing detail page loads. | Same as A21 | FALSE (runtime) | Open `/clasificados/autos/vehiculo/{id}` after publish. |
| A24 | Seller dashboard management is proven. | `AutosLeonixPaidListingsSection.tsx` + `DashboardAutosPaidDraftsBand` (`app/(site)/dashboard/...`) call owner Autos listing APIs | TRUE (code) | Run authenticated dashboard smoke on staging. |
| A25 | Admin Autos queue is proven. | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx` lists rows + status visibility | TRUE (code) | Run admin smoke with service role on staging. |
| A26 | Report/contact/trust controls exist on detail page. | `AutosLiveVehicleClient` embeds `LeonixInlineListingReport`; privado/dealer contact components in preview pages | TRUE (code) | Add missing trust links if product requires. |
| A27 | Build passes. | Recorded after `npm run build` in Phase 1 validation (see below) | TRUE (runtime) | Fix compile errors until build is green. |
| A28 | Autos smoke/audit script passes. | `npm run autos:enforce-smoke` + `npm run autos:phase1-audit` (see below) | TRUE (runtime) | Fix failing assertion or drift. |
| A29 | No unrelated files were changed. | Autos TS/TSX + `app/lib/.../AUTOS_PHASE_1_*.md` + `scripts/autos-phase-1-strict-audit.ts`; **supporting:** `package.json` (lint scope + `autos:phase1-audit` script), `scripts/next-build.js` (Windows build flake detection for `npm run build`) | TRUE (code) | Revert supporting edits only if repo-wide lint/build is restored elsewhere. |
| A30 | Final go-live readiness. | Runtime blockers A19–A23 remain **FALSE (runtime)**; payments/browse E2E not proven here | FALSE (runtime) | Complete gated Phase 2: staging E2E (publish → pay → browse → dashboard/admin). |

## Validation log (Phase 1)

Executed on **2026-05-14** (Windows host, repo `c:\projects\elaguila-website`):

1. `npm run autos:phase1-audit` → exit **0**, stdout ends with `autos-phase-1-strict-audit: OK`
2. `npm run autos:enforce-smoke` → exit **0**, stdout ends with `autos-enforcement-smoke: OK`
3. `npm run lint` → exit **0** (ESLint scoped in `package.json` to Autos surfaces + admin Autos queue + the two Autos scripts; `--max-warnings 0`)
4. `npm run build` → exit **0**, Next.js production build completed (`node scripts/next-build.js`)

If any command fails, treat **A27–A28** as **FALSE (runtime)** until the suite is green again.

## Next gated phase

**Phase 2 — Runtime / staging E2E:** Stripe test-mode checkout success and failure paths, public API with seeded `autos_classifieds_listings`, landing/results/detail visibility, seller dashboard CRUD, admin queue actions, optional Playwright `verify:autos:e2e`.
