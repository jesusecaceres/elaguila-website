# 04C — AUTOS + EMPLEOS FULL-CYCLE CERTIFICATION

**Audit date:** 2026-09-09 · **Mode:** read-only forensic · **Scope:** Autos (privado · dealer parent · dealer inventory child) and Empleos (premium · quick · feria), end-to-end lifecycle.

## Refs used (verified, re-checked immediately before writing)

| Label | SHA | How verified |
|---|---|---|
| **TRUE current / production** | `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8` | `git rev-parse origin/main`, re-run at write time — unchanged. Tip: *"feat(classifieds): install final owner-approved landing imagery"*, Wed Sep 9 12:15:08 2026 −0700 |
| Sealed September branch | `e3956df893f5041ca22371c999038f297d536eae` | `git rev-parse e3956df8` |
| Local primary worktree (**STALE**, 112 behind) | `d09d979c` | `git rev-parse HEAD` — **not read for any claim below** |

Everything below is read via `git show origin/main:<path>` / `git grep -n … origin/main` / `git ls-tree -r --name-only origin/main`. `/c/projects/elaguila-website-final-audit-fixes` was not read. Sept-only code is labelled `@e3956df8`.

## Prior work CITED, not re-derived

- **`06_DATA_ROUND_TRIP_FIELD_AUDIT.md`** — the destructive-edit sweep. Its verdicts for these six lanes are taken as settled: autos PRIVADO = **NO_EDIT_PATH** (§2.6), autos DEALER parent = **SAFE** (§2.7), autos DEALER inventory child = **DESTRUCTIVE** (§2.8, `{...parent, ...childSlice}` → missing fields inherit the parent's value, including all 8 video/Mux keys), empleos PREMIUM = **DESTRUCTIVE, worst in the platform** (§2.9, `buildEmpleosPublishEnvelope.ts:250` `listingId: null` → INSERT at `empleosPublicListingsDbServer.ts:227` → new Stripe checkout at `empleosRevenueCheckout.ts:60-68`; plus save-draft demoting a live paid job, §2.9d), empleos QUICK = **DESTRUCTIVE** (§2.10, `workModalityCustom` wipe + identity fork).

> ### ⚠ CORRECTION TO `06_…md` §2.10 — **Empleos QUICK is a PAID lane, so its identity fork ALSO double-charges**
>
> `06_…md` §2.10(e) states: *"Quick is a free lane, so there is no double charge."* **That is false on `origin/main`.** Proof, read directly:
>
> - `app/(site)/clasificados/empleos/preview/shared/empleosPreviewPaidCheckout.ts:17` — `export type EmpleosPaidPublishLane = "quick" | "premium";`
> - `:19-43` `empleosPreviewCheckpointConfig(lang, lane)` returns the **same** `packageKey: EMPLEOS_JOB_POST_PAID_PACKAGE_KEY` and the **same** `priceCents` (`:23`, default 2499) for both lanes; only the label and `pipeline` differ (`:30-33`).
> - `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx:99` — `empleosPreviewCheckpointConfig(lang, "quick")`; the checkpoint is rendered and `:152-158` calls **`saveEmpleosDraftAndStartPaidJobCheckout`** — the identical Stripe entry point Premium uses.
> - Only **feria** is excluded: `empleosPreviewPaidCheckout.ts:5` — *"Feria (`empleos_job_fair_free`) must never use this path"* — mirrored at `app/lib/listingPlans/revenueEmpleosFulfillment.ts:7`.
> - The publish hub renders a price chip on the quick card: `app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx:108` (`t.job.price`), vs feria's `t.fair.price` at `:123`.
>
> **Consequence:** the §2.10 identity fork on Quick is not merely an orphaned-row bug — **it opens a second $24.99 Stripe checkout on every republish, exactly like Premium.** Quick is therefore a **second P0**, not a P1. See §H.
>
> Corrected lane economics for this report: **PREMIUM = paid · QUICK = paid (same package) · FERIA = free.**
- **`11_REVENUE_STRIPE_PROMO_ENTITLEMENT_AUDIT.md`** — checkout / promo / entitlement, incl. `activePaidEditCheckoutOwnership.ts` being absent from `origin/main`.
- **`10_ANALYTICS_EVENT_COVERAGE.md`** — autos + empleos emitters.
- **`13_BUSINESS_HUB_CONNECTION_TRUST_ADDRESS_AUDIT.md`** Part A — autos dealer renders `PreviewDealerBusinessStack.tsx` (793 lines), **not** `DealerBusinessStack.tsx`.
- **`12B_AUTOS_PARENT_CHILD_AUDIT.md`** (this batch) — the G40 parent/child matrix and the parent-visibility gate.

---

# PART A — ROUTE + STORAGE MAP

## A.0 First: which Autos route tree is canonical?

Autos code lives under **three** prefixes. They are not duplicates of each other — the split is deliberate — except in one place.

| Prefix | Role | Canonical? |
|---|---|---|
| `app/(site)/publicar/autos/**` | **APPLICATION** forms (privado, negocios, shared field components, drafts hooks) | **CANONICAL** for the publish application |
| `app/(site)/clasificados/autos/**` | **PUBLIC + PREVIEW** (landing, results, filters, detail, dealer group page, both preview clients, all view components, draft-storage libs) | **CANONICAL** for public + preview |
| `app/(site)/clasificados/publicar/autos/page.tsx` | branch/checkpoint chooser | **SHADOW — see A.0.1** |

The application ↔ preview split is intentional and consistent: `/publicar/autos/privado` (form) → `/clasificados/autos/privado/preview` (preview), same for negocios. Both `page.tsx` files declare their own canonical: `app/(site)/publicar/autos/privado/page.tsx:9` and `app/(site)/publicar/autos/negocios/page.tsx:9`.

### A.0.1 · **P2 FINDING — `/clasificados/publicar/autos` is a live duplicate-render shadow route**

`app/(site)/clasificados/publicar/autos/page.tsx:3,:19` imports and renders **the same component** as the canonical page:

```
import { PublicarAutosBranchClient } from "@/app/publicar/autos/PublicarAutosBranchClient";
…
<PublicarAutosBranchClient />
```

Meanwhile `app/(site)/publicar/autos/page.tsx:13` renders that identical component. **There is no redirect** — `git show origin/main:next.config.ts | grep -n "publicar/autos"` returns **zero hits**. Both URLs are live, both are indexable:

- `app/(site)/publicar/autos/page.tsx` exports **no** `metadata` → inherits the parent layout's canonical.
- `app/(site)/clasificados/publicar/autos/page.tsx:5-8` exports `metadata` with title + description but **no `alternates.canonical`**.

Both are actively linked from production code, so neither is dead:

| Callers of `/publicar/autos` | Callers of `/clasificados/publicar/autos` |
|---|---|
| `app/(site)/clasificados/publicar/PublicarPageClient.tsx:236`; `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx:346`; `.../AutosLeonixPaidListingsSection.tsx:135` | `app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts:95`; `app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts:35`; registry `catStd1aPipelineRegistry.ts:110` |

`categoryStandardRoutes.ts:90-95` even carries a comment asserting the shadow is *"confirmed LIVE, not stale."* That is true and is exactly the problem: two indexable URLs render byte-identical content with no canonical link between them.

**Empleos solved this exact problem correctly** and is the proven in-repo reference — `app/(site)/clasificados/publicar/empleos/page.tsx:27`:

```
redirect(forwardPublishRedirectParams("/publicar/empleos", sp));
```

with a header (`:5-17`) documenting Gate I.5.3 and naming the Busco / Clases / Comunidad / Mascotas-y-Perdidos shims as the same pattern, while explicitly *excluding* Servicios / Bienes Raíces / Restaurantes (which have genuinely distinct behaviour).

**Reference-Implementation line**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | Empleos (also Busco, Clases, Comunidad, Mascotas y Perdidos) |
| REFERENCE PATH | `app/(site)/clasificados/publicar/empleos/page.tsx:19-28` + `app/lib/clasificados/forwardPublishRedirectParams.ts` |
| TARGET PATH | `app/(site)/clasificados/publicar/autos/page.tsx` |
| DIFFERENCE | Autos re-renders the component instead of 301-redirecting; no canonical on either copy; search params are not forwarded through a single entry point |
| **ACTION** | **ADOPT EXISTING** — replace the render with the same `forwardPublishRedirectParams("/publicar/autos", sp)` shim. Verify `categoryStandardRoutes.ts:95` and `negociosLocalesLanes.ts:35` still resolve (they will — the shim preserves params). |

### A.0.2 · Results-route aliasing (both categories — clean)

| Category | Canonical | Alias | Redirect |
|---|---|---|---|
| Autos | `/clasificados/autos/results` | `/clasificados/autos/resultados` | `next.config.ts:105-108` (301 → `/results`). `results/page.tsx` re-exports `../resultados/page`'s default and adds its own `alternates.canonical` (`:9-11`). |
| Empleos | `/clasificados/empleos/resultados` | `/clasificados/empleos/results` | `next.config.ts:120-123` (301 → `/resultados`). `results/page.tsx` is a one-line re-export with no metadata — correct, since it is never served. |

Directions are opposite between the two categories but each is internally consistent and canonicalised. **No finding.**

---

## A.1 · AUTOS — route + storage map

| Stage | privado | dealer PARENT (`negocios`, `inventory_role='main'`) | dealer INVENTORY CHILD (`inventory_role='inventory_vehicle'`) |
|---|---|---|---|
| **LANDING** | `app/(site)/clasificados/autos/page.tsx` → `landing/AutosLandingPage.tsx` (shared) | same | same |
| **RESULTS** | `app/(site)/clasificados/autos/results/page.tsx` → `resultados/page.tsx:7` → `components/public/AutosPublicResultsShell.tsx:58` (`market="private"`) | same shell | same shell (children appear as ordinary vehicles) |
| **CHECKPOINT / "Ver Más"** | `app/(site)/publicar/autos/page.tsx` → `PublicarAutosBranchClient.tsx:26` → shared `getAutosCheckpointCards` (`clasificados/publicar/_lib/categoryPublishCheckpoints`) rendered in `PublishEntryCheckpointLayout` / `…Stack` (`:31,:40`) | same | n/a — child entry is the parent's inventory drawer |
| **APPLICATION** | `app/(site)/publicar/autos/privado/page.tsx` → `components/AutosPrivadoApplication.tsx` | `app/(site)/publicar/autos/negocios/page.tsx` → `components/AutosNegociosApplication.tsx` | `components/AutosNegociosAddInventoryDrawer.tsx` + `AutosInventoryVehicleDrawerForm.tsx` + `AutosNegociosInventoryChildApplication.tsx` (inside the parent app) |
| **PREVIEW** | `app/(site)/clasificados/autos/privado/preview/page.tsx` → `AutosPrivadoPreviewClient.tsx` → `components/AutoPrivadoPreviewPage.tsx` | `app/(site)/clasificados/autos/negocios/preview/page.tsx` → `AutosNegociosPreviewClient.tsx` → `preview/dealershipPreview/AutosNegociosDealershipPreviewPage.tsx` | `AutosNegociosChildInventoryPreviewOverlay.tsx:38` → `mapInheritedDealerPreviewListing(parent, child)` → `AutoDealerPreviewPage` |
| **CHECKOUT** | `AutosPrivadoPreviewClient.tsx:258` `PublishCheckoutCheckpoint` → `privado/lib/autosPrivadoPreviewPaidCheckout.ts` → `POST /api/clasificados/autos/checkout` (`autos_privado_30d`) | `AutosNegociosPreviewClient.tsx:581` → `negocios/lib/autosDealerRevenueCheckout.ts` → same route (`autos_dealer_monthly`, `publishCheckoutCheckpoint.ts:57`) | **none of its own** — inherits parent plan; add-on slots via `POST /api/clasificados/autos/inventory-pack/checkout` (**parent-only**, child rejected `422 child_listing_not_eligible` at `route.ts:102-111`) |
| **PUBLIC DETAIL** | `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx:74` → `AutosLiveVehicleClient.tsx` (lane-switched to `AutoPrivadoPreviewPage`) | same route → `AutosNegociosDealershipPreviewPage` (`AutosLiveVehicleClient.tsx:8`) | same route; additionally the dealer group page `app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/page.tsx:16` |
| **DASHBOARD** | `app/(site)/dashboard/mis-anuncios` via `dashboardInventory.ts:254` `buildAutosClassifiedsInventoryItems`; drafts band `DashboardAutosPaidDraftsBand.tsx` | same + `clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`, `AutosLeonixPaidListingsSection.tsx`, `AutosNegociosInventoryValueDrawer.tsx` | listed inside `AutosDealerInventoryDashboardSection.tsx` (row actions `:578`) |
| **EDIT** | `dashboardInventory.ts:266` → `/publicar/autos/privado?edit=1&source=dashboard&listingId=…&returnPanel=autos`. Hydrates at `AutosPrivadoApplication.tsx:130-159`. **No save UI, and the server refuses an active `privado` row** — `autosClassifiedsListingService.ts:249-252` (`06_…md` §2.6) | `dashboardInventory.ts:259-263` `autosDealerListingEditHref` → `/publicar/autos/negocios?…` (`autosDashboardInventoryAddonCheckout.ts:92-95`, base const `:62`) | `AutosDealerInventoryDashboardSection.tsx:578` → `autosDealerInventoryEditHref(...)+"&editVehicleId=<childId>"` → drawer auto-opens (`AutosNegociosApplication.tsx:129-140`). **`dashboardInventory.ts:267` gives a non-main `negocios` row no edit route at all** — it falls through to the *public* vehicle URL |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx` (`listAllAutosClassifiedsRowsForAdmin`, `:16`) | same | same — role columns surfaced via `autosClassifiedsRowToDashboardRow` (`autosClassifiedsListingService.ts:474-476`) |
| **API ROUTES** | `listings/route.ts` (GET/POST) · `listings/[id]/route.ts` (GET/PATCH) · `listings/[id]/unpublish` · `listings/[id]/restore` · `listings/[id]/analytics` · `listing/[id]/analytics-summary` · `checkout/route.ts` + `checkout/verify` + `verify-internal` + `cancel` · `stripe/webhook` · `publish-options` · `decode-vin` · `media/draft-photo-upload` · `public/listings` · `public/listings/[id]` · `public/analytics/event` | same | same + `public/dealer/[dealerInventoryGroupId]/route.ts` · `inventory-pack/checkout/route.ts` |
| **PRIMARY TABLE** | `autos_classifieds_listings` | same | same |
| **OWNER FIELD** | `owner_user_id uuid not null references auth.users(id) on delete cascade` — migration `20260409120000_autos_classifieds_listings.sql:6` | same | same |
| **LISTING UUID** | `id uuid primary key default gen_random_uuid()` — migration `:5`; **the public permalink is the UUID, there is no slug column** (`clasificados/autos/contracts/autosCanonicalIdentity.ts:6`) | same | same |
| **LEONIX AD ID** | `leonix_ad_id` (prefix `AUTO`) — `supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql:73`; read at `autosClassifiedsListingService.ts:39` | same | same (child gets its own) |
| **PARENT FIELD** | n/a (`null`) | n/a (parent is the anchor) | `dealer_inventory_parent_listing_id uuid` FK → `autos_classifieds_listings(id) on delete set null` — migration `20260518124700_autos_dealer_inventory_grouping.sql:6,:31-35` |
| **INVENTORY ROLE FIELD** | `null` | `inventory_role = 'main'` | `inventory_role = 'inventory_vehicle'` — CHECK constraint migration `:17-19`; group key `dealer_inventory_group_id` `:5` |
| **MIGRATIONS** | `20260408140000_autos_classifieds_analytics_events.sql` · `20260409120000_autos_classifieds_listings.sql` · `20260506150000_leonix_ad_id_all_classifieds.sql` · `20260508140000_classifieds_admin_ops_columns.sql` · `20260509120000_classifieds_republish_capability.sql` · `20260518124700_autos_dealer_inventory_grouping.sql` · `20260805090500_lane_listing_suspended_reason.sql` · `20260810120000_autos_br_negocio_capacity_activation_rpc.sql` · `20260818120000_saved_search_match_events.sql` · business-identity trio (`20260716/17/18…`) | | **MISSING on `origin/main`:** `…_fix_parent_inventory_capacity_counting.sql` (`10618f41`) and `20260903090000_autos_leonix_ad_id_reconciliation.sql` (`b3473f89`) — see `12B_…md` §2.1/§2.4 |
| **VERIFIERS** | ~110 `scripts/autos-*` audits, plus `scripts/gate-i11a-autos-listing-edit-media-isolation-selftest.ts`, `gate-i11b-autos-draft-upload-session-security-selftest.ts`, `gate-i13b-public-visibility-filter-selftest.ts`, `gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts`, `verify-autos-privado-revenue-os-checkout.mjs`, `verify-autos-dealer-inventory-addon-parity-01.mjs` / `-live-parity-02.mjs`, `verify-revenue-os-autos-dealer-inventory-entitlement-parity-01.mjs`, `verify-saved-search-autos-02..05.ts` | | |
| **E2E** | `e2e/autos/autos-go-live-smoke.spec.ts`, `autos-manual-qa-seed.spec.ts` | `autos-a5-polish-32-premium-preview-mobile-inventory-shelf.spec.ts` | `autos-a5-recovery-25-child-media-persistence.spec.ts` · `-26-child-edit-hydrates-saved-inventory` · `-27-step5-add-website-button` · `-28-child-editor-hydration-field-mapping` · `-29-inventory-array-preview-overwrite` · `-30-draft-preview-carousel-cta-guardrail` |

---

## A.2 · EMPLEOS — route + storage map

**All three lanes share one table and one row shape.** `feria` is a real persisted lane, not preview-only: `empleos_public_listings.lane text not null check (lane in ('quick','premium','feria'))` — `supabase/migrations/20260410210000_empleos_public_listings.sql:7-8`.

| Stage | PREMIUM (paid) | QUICK (free) | FERIA (job fair / community) |
|---|---|---|---|
| **LANDING** | `app/(site)/clasificados/empleos/page.tsx` → `EmpleosLandingServer.tsx` / `EmpleosLandingPageClient.tsx` (shared) | same | same + `components/landing/JobFairLandingBanner.tsx`, `components/JobFairPromoCard.tsx` |
| **RESULTS** | `app/(site)/clasificados/empleos/resultados/page.tsx` → `components/EmpleosResultsView.tsx` (canonical; `/results` 301s here, `next.config.ts:120-123`). The `results/page.tsx` file still exists as a one-line `export { default } from "../resultados/page"` — it re-exports **only** `default`, dropping `metadata` and `export const dynamic = "force-dynamic"`. Harmless today because the redirect makes it unreachable; **dead code that would silently misbehave if the redirect were ever removed.** Canonical asserted by `scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts:26,:35,:57-58`; `catStd1aPipelineRegistry.ts:84` still lists `/results` as the alias | same | same |
| **CHECKPOINT / "Ver Más"** | `app/(site)/publicar/empleos/page.tsx:17` → `EmpleosPublicarHubClient.tsx`; legacy `/clasificados/publicar/empleos` **301-redirects** here (`clasificados/publicar/empleos/page.tsx:27`). **The shared checkpoint system is DEAD CODE — see A.2.2.** **Premium has no card in either grid — see A.2.3** | same | same |
| **APPLICATION** | `app/(site)/publicar/empleos/premium/page.tsx` → `EmpleoPremiumApplicationClient.tsx` | `.../quick/page.tsx` → `EmpleoQuickApplicationClient.tsx` | `.../feria/page.tsx` → `EmpleoFeriaApplicationClient.tsx` |
| **PREVIEW** | `app/(site)/clasificados/empleos/premium-preview/page.tsx` → `EmpleoPremiumPreviewClient.tsx` → `mapPremiumDraftToShell.ts` → `components/premiumJob/EmpleoPremiumDetailPage.tsx` | `.../quick-preview/` → `EmpleoQuickPreviewClient.tsx` → `mapQuickDraftToShell.ts` → `components/quickJob/EmpleoQuickDetailPage.tsx` | `.../feria-preview/` → `EmpleoFeriaPreviewClient.tsx` → `mapFeriaDraftToShell.ts` → `components/jobFair/EmpleoJobFairDetailPage.tsx` |
| Preview handoff URL | `empleosHandoffPreviewUrl("premium", lang)` → `…?from=publicar` — `shared/constants/empleosPublishRoutes.ts:15-25` | `…("quick", lang)` | `…("feria", lang)` |
| **CHECKOUT** | `EmpleoPremiumPreviewClient.tsx:205-223` `PublishCheckoutCheckpoint` (id `empleos-premium-publish-checkout-checkpoint`) → config `empleosPreviewPaidCheckout.ts:19-43` → `shared/publish/empleosRevenueCheckout.ts:22-28` (`empleos_job_post_paid`, $24.99/30d) | **PAID — same package** `EmpleoQuickPreviewClient.tsx:99` `empleosPreviewCheckpointConfig(lang,"quick")`, checkpoint `:219-237`, `:152-158` `saveEmpleosDraftAndStartPaidJobCheckout` | **N-A — free.** Publishes directly from `EmpleoFeriaApplicationClient.tsx:428-436` (`mode:"publish"`, no Stripe). Excluded by name at `empleosPreviewPaidCheckout.ts:5` and `revenueEmpleosFulfillment.ts:7` |
| **PUBLIC DETAIL** | `app/(site)/clasificados/empleos/[slug]/page.tsx:33` `fetchEmpleosPublishedListingRowBySlug` → `EmpleosPublicLaneDetailClient.tsx` → lane-resolved by `lib/empleosLaneResolve.ts:17` | same | same |
| **DASHBOARD** | `app/(site)/dashboard/empleos/page.tsx` (list) + `dashboard/empleos/[listingId]/page.tsx` (detail); unified card via `dashboardMisAnunciosCategoryTools.ts:112-121` | same | same |
| **EDIT** | `dashboard/empleos/page.tsx:58-63` `empleosEditHref` → `/publicar/empleos/premium?edit={id}`; also `dashboard/empleos/[listingId]/page.tsx:61-66`. Hydration `EmpleoPremiumApplicationClient.tsx:59-85` (UUID-validated `?edit=` → `GET /api/clasificados/empleos/listings/{id}` → `hydratePremiumDraftFromEnvelope` → `setServerListingId`) | `/publicar/empleos/quick?edit={id}`; hydration `EmpleoQuickApplicationClient.tsx:84-110` | `/publicar/empleos/feria?edit={id}`; hydration `EmpleoFeriaApplicationClient.tsx:58-84`. **Feria IS edit-capable** — earlier evidence gap now closed |
| Lane guard on edit | `app/(site)/publicar/empleos/shared/lib/empleosEditLaneRedirect.ts:16` — an `?edit=` id whose row is a different lane redirects to the correct lane's application | same | same |
| **ADMIN** | `app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx`; projection contract `publicar/empleos/shared/publish/empleosAdminProjection.ts` + `shared/types/empleosAdminListingCompatibility.ts` | same | same |
| **API ROUTES** | `app/api/clasificados/empleos/listings/route.ts` (POST upsert) · `listings/[listingId]/route.ts` (GET/PATCH lifecycle) · `listings/public-view/route.ts` · `applications/route.ts` · `applications/[id]/route.ts` · `listings/[listingId]/applications/route.ts` | same | same |
| **PRIMARY TABLE** | `empleos_public_listings` (+ `empleos_job_applications`, `empleos_listing_metrics`) | same | same |
| **OWNER FIELD** | `owner_user_id uuid references auth.users(id) on delete set null` — migration `:9` (**nullable**, unlike Autos' `not null … on delete cascade`) | same | same |
| **LISTING UUID** | `id uuid primary key default gen_random_uuid()` — migration `:5`; public permalink is `slug text not null unique` (`:6`), **not** the UUID | same | same |
| **LEONIX AD ID** | `leonix_ad_id` (prefix `JOB`) — `20260506150000_leonix_ad_id_all_classifieds.sql:74`, `:196-223` (unique index `:220-221`) | same | same |
| **PARENT FIELD** | **N-A** — no parent column exists on `empleos_public_listings` | N-A | N-A |
| **INVENTORY ROLE FIELD** | **N-A** — no inventory-role column | N-A | N-A |
| **MIGRATIONS** | `20260410210000_empleos_public_listings.sql` · `20260410220000_empleos_listing_metrics.sql` · `20260506150000_leonix_ad_id_all_classifieds.sql` · `20260508140000_classifieds_admin_ops_columns.sql` · `20260509120000_classifieds_republish_capability.sql` · `20260628180000_admin_live_schema_drift_fix_01.sql` | | |
| **VERIFIERS** | `scripts/verify-empleos-final-qa-readiness.mjs` · `verify-empleos-global-location-readiness.mjs` · `verify-empleos-simplification-qa-alignment.mjs` · `verify-empleos-two-path-reroute-preview.mjs` · `verify-revenue-os-empleos-paid-publish-checkpoint-01.mjs` · `smoke-revenue-os-empleos-paid-publish-checkpoint-01.mjs` · `empleos-jobposting-schema-selftest.ts` · `empleos-lane-metadata-audit.mts` · `empleos-supabase-read-smoke.mts` · `empleos-http-smoke.mjs` · `gate-i5-4c-empleos-lane-shell-fallback-safety-selftest.ts` · `gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts` | | |
| **E2E** | `e2e/empleos/empleos-runtime-qa.spec.ts` · `empleos-manual-qa-seed.spec.ts` | same | same |

### A.2.1 · Structural note — Empleos has **no parent/child model at all**

`empleos_public_listings` carries no group/parent/role columns (migration `:4-44`). Every job is a standalone row. **G40 is N-A for all three Empleos lanes** — this is a correct design decision, not a gap, since a job posting has no inventory semantics. Recorded here so the G40 matrix in `12B_…md` is understood as Autos-only.

### A.2.2 · **FINDING (P2) — the shared publish-checkpoint system is DEAD CODE for all three Empleos lanes**

`EmpleosPublicarHubClient.tsx:85-91` builds `empleosCheckpointCards` from the shared factories `getEmpleosPaidCheckpointCard` / `getEmpleosFreeCheckpointCard` (`app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts:456` / `:848`). But those cards are rendered **only** inside `if (variant === "clasificadosPublicar")` (`:179-199`, wrapping `PublishEntryCheckpointLayout` `:180` + `PublishEntryCheckpointStack` `:189`). The grid selector is `:177`:

```
const grid = variant === "clasificadosPublicar" ? gridClasificados : gridDefault;
```

The **only** route that ever passed that variant was `/clasificados/publicar/empleos` — which is now a pure redirect (`clasificados/publicar/empleos/page.tsx:27`). The live route `app/(site)/publicar/empleos/page.tsx:17` renders `<EmpleosPublicarHubClient />` with **no `variant` prop**, so it always falls to `gridDefault` (`:104-135`), a plain two-card link grid.

⇒ Empleos ships a complete shared-checkpoint implementation that **can never render**. Contrast Autos, where `PublicarAutosBranchClient.tsx:31,:40` renders `PublishEntryCheckpointLayout` / `…Stack` unconditionally.

**Reference-Implementation line**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | **Autos** (+ bienes-raices, rentas, restaurantes, servicios) |
| REFERENCE PATH | `app/(site)/publicar/autos/PublicarAutosBranchClient.tsx:26,:31,:40` — builds cards and renders the shared layout with no variant gate |
| TARGET PATH | `app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx:85-91`, `:177`, `:179-199` |
| DIFFERENCE | The Empleos checkpoint is gated behind a variant whose sole producing route was converted to a redirect, so it is unreachable; the live path renders a plain link grid instead |
| **ACTION** | **FIX REGRESSION** — make the default variant render `PublishEntryCheckpointStack`. Resolve A.2.3 in the same change |

### A.2.3 · **FINDING (P2) — the paid PREMIUM lane has no public entry point**

Both hub grids render exactly two cards — quick and feria:

- `gridDefault` `:105-135` → `<Link href={quickHref}>` `:106`, `<Link href={feriaHref}>` `:121`
- `gridClasificados` `:137-174` → same two hrefs

`premiumHref` appears nowhere in either grid. `/publicar/empleos/premium` is reachable **only** from dashboard edit hrefs (`dashboard/empleos/page.tsx:60`, `dashboard/empleos/[listingId]/page.tsx:63`) — i.e. only by someone who already owns a premium listing. A new employer cannot buy one.

`app/lib/clasificados/EMPLEOS_SIMPLIFICATION_QA_ALIGNMENT_AUDIT.md:72` documents this as intentional (*"Preserve route/code for later; hidden from public entry"*), so it is a **product decision, not a defect** — but `app/(site)/clasificados/components/categoryRouteRegistry.ts:863` still declares premium a live `applicationRoute`, which is registry drift. **ACTION: confirm the product decision, then either restore the card or formally retire the route and correct the registry.**

### A.2.4 · **FINDING (P1) — preview → "Volver a editar" loses listing identity in ALL THREE lanes**

The preview handoff URL is built by `empleosPublishRoutes.ts:22-25` and carries only `?from=publicar&lang=`. The `goPreview` callers never forward `edit` (`EmpleoPremiumApplicationClient.tsx:91-96`, `EmpleoQuickApplicationClient.tsx:116-121`, `EmpleoFeriaApplicationClient.tsx:90-95`), and the back-to-edit href is equally bare (`EmpleoPremiumPreviewClient.tsx:85`, `EmpleoQuickPreviewClient.tsx:90`, `EmpleoFeriaPreviewClient.tsx:49`).

So after **edit → preview → Volver a editar**, the remounted application client's `?edit=` hydration effect never fires (`EmpleoPremiumApplicationClient.tsx:61` reads a null `sp?.get("edit")`) and `serverListingId` resets to `null` (`premium:56`, `quick:81`, `feria:55`). The next save then takes the null-id branch —

```
const envelope = serverListingId ? { ...base, listingId: serverListingId } : base;   // feria:428
```

— and `empleosPublicListingsDbServer.ts:227-231` **INSERTs a duplicate row**. For Feria this duplicates a *live* free listing through the publish modal (`:428-436`).

This is a distinct mechanism from the §2.9 envelope fork (`buildEmpleosPublishEnvelope.ts:250`) and must be fixed separately: **carry `edit={id}` through the preview round-trip in the URL.**

### A.2.5 · **FINDING (P2) — session draft keys are lane-global, not per-listing**

`empleosSessionKeys.ts:2-6` defines exactly three keys — `leonix_empleos_{quick,premium,feria}_draft_v1` — with no listing id. Editing listing A and then starting a new listing in the same lane and tab silently collides on one key. Autos avoids this with per-user/per-listing namespacing (`autosPrivadoDraftNamespace.ts`, `autosListingEditNamespace.ts`) plus a fresh-tab reset (`autosEditorTabSession.ts`). **ACTION: ADOPT EXISTING** from Autos.

### A.2.6 · **FINDING (P2) — Feria emits `schema.org/JobPosting` structured data**

`app/(site)/clasificados/empleos/[slug]/page.tsx:118` renders `<EmpleosJobPostingJsonLd>` for **every** published row with no lane branch, so a job **fair** is published to search engines as a `JobPosting`. Semantically wrong structured data on a public, indexed page. **ACTION: NET NEW** — branch on lane and emit `Event`/`BusinessEvent` for feria, or omit.

---

# PART B — G40 AUTOS PARENT/CHILD

**Delivered in full in `12B_AUTOS_PARENT_CHILD_AUDIT.md`.** Summary only:

- **18 / 18 TRUE**, 0 FALSE.
- **Parent-visibility gate: EXISTS on `origin/main`** — `app/lib/clasificados/autos/autosPublicChildParentVisibility.ts:40-62`, an explicit self-documented port of the BR reference, enforced at **three** public surfaces (`autosClassifiedsListingService.ts:204-205`, `:493-494`, `:786-791`) plus saved search (`app/lib/saved-search/autos/autosPublicEligibleListing.ts:28`). This is a **wider** surface than BR's two. **Not an ADOPT EXISTING item.**
- One caveat: the gate is application-layer only; RLS (`20260409120000_…:39-42`) has no parent predicate. Contained because Autos public reads never use the anon client.
- Two P1 regressions from unmerged September commits: capacity mis-count (`10618f41`) and the child identity-substitution guard (`651abd4e`).

---

# PART C — UNINTEGRATED AUTOS BRANCHES: MERGE vs DISCARD

Ancestry proven per commit with `git merge-base --is-ancestor <sha> origin/main; echo $?`. **All six commits return `1` (not reachable)** — but SHA-reachability is a *false negative* here: every branch's content landed on `origin/main` under a different SHA via rebase/re-commit. Content was therefore compared blob-by-blob.

| Branch | Ahead / Behind | On remote? | **VERDICT** |
|---|---|---|---|
| `autos-privados-preview` | 2 / **373** | yes | **DISCARD** |
| `autos-dealership-before-main-sync` | 2 / **373** | **NO — local only, CONFIRMED** | **DISCARD** |
| `autos-location-readiness-micro-patches` | 2 / **346** | yes | **DISCARD** |

## C.1 · `autos-privados-preview` (`ea429664`, `18d9eaf2`) — **DISCARD**

`ea429664` "Package F2: close final launch security SEO and integration gaps" has an **on-main twin**:

```
git log origin/main --oneline --grep="Package F2"   →  18bc2b5b
git merge-base --is-ancestor 18bc2b5b origin/main; echo $?   →  0
git diff --stat ea429664 18bc2b5b   →  7 files, +504/−33   (all additions on the MAIN side)
```

**50 of 53 files are byte-identical.** The 3 that differ are places where **main has more**: F3 promo-redemption concurrency hardening (`revenuePromoRedemptions.ts` +86), a service-role slot-reservation RPC migration (+109), and two new certification scripts (+317). Zero files from the 53-file commit are absent from `origin/main`.

The two files specifically flagged for verification **both exist on `origin/main` as the *same git blobs***, not merely similar files:

| Path | branch | main | blob |
|---|---|---|---|
| `app/(site)/clasificados/autos/seo/autosVehicleJsonLd.ts` | 56 L | 56 L | `c903d466` — identical |
| `app/(site)/clasificados/autos/listing/components/AutosAnuncioAnalyticsStrip.tsx` | 70 L | 70 L | `227c16d3` — identical |

`autosVehicleJsonLd` is live-wired on main at `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx:6,:51`. Spot-checks confirming the rest of the F2 payload survives: all four duplicate-content SEO redirects still in `next.config.ts`; `app/sitemap.ts` grew 59 L → 72 L; `restauranteJsonLd.ts` / `serviciosJsonLd.ts` both present with live consumers.

`18d9eaf2` likewise: `autosPrivadoLocationReady.ts` (43 L, blob `cb87d88d`) and `useAutoPrivadoDraft.ts` (245 L, blob `812819be`) are **identical blobs** on main; `autosPreviewCompleteness.ts` is **98 L on the branch vs 135 L on main** — main is a superset containing the branch's `AUTOS_DEFAULT_STATE`/`effectiveUsState` privado logic *plus* `listingHasAutosNegociosPreviewLocation` (verified directly at `origin/main:…/autosPreviewCompleteness.ts:32-35`, `:48-57`) which the branch lacks.

**Merging would be a regression** — it would revert `autosPreviewCompleteness.ts` to 98 L (losing negocios location support) and roll back F3 promo concurrency hardening.

## C.2 · `autos-dealership-before-main-sync` (`25635f6c`, `eece90c0`) — **DISCARD**

**"Local only" CONFIRMED.** `git ls-remote --heads origin | grep -i autos` returns `autos-dealership`, `autos-location-readiness-micro-patches`, `autos-privados-preview` and three `global-saved-search-autos-*` — this branch is absent from both `ls-remote` and `git branch -r`.

**Git itself flags it as upstream:**

```
git cherry -v origin/main autos-dealership-before-main-sync
+ eece90c0…  fix(autos): recognize dealer structured address for preview readiness
- 25635f6c…  feat(autos): polish dealership preview presentation      ← "-" = patch-id already in origin/main
```

Twin located: `29ee58fc` "feat(autos): polish dealership preview presentation", 2026-08-25, `--is-ancestor` → `0`. **14 of 16 files byte-identical** (including all nine `dealershipPreview/Preview*.tsx` components and `PreviewDealerBusinessStack.tsx`). The two that differ show **main is ahead**:

- `AutosNegociosDealershipPreviewPage.tsx` — branch 362 L → main 381 L. Main **adds** `AutosNegociosPreviewEngagementStrip`. **Merging the branch would delete it.**
- `previewPremiumTokens.ts` — main promoted the tokens from *"Preview-only … do not import from live detail"* to *"shared by dashboard preview and the published live vehicle detail page."* The branch's comment is stale and wrong.

`eece90c0` is a duplicate of branch C.3's `be717d65` (**identical patch-id `43a1c53e…`**), and both are superseded: `autosDealerStructuredAddress.ts` 129 L → **135 L on main**; `autosPreviewCompleteness.ts` 134 L → **135 L on main**.

## C.3 · `autos-location-readiness-micro-patches` (`f97d7141`, `be717d65`) — **DISCARD (clearest case)**

```
git diff --stat f97d7141 origin/main -- <all 5 touched paths>
(NO OUTPUT — empty diff)
```

All five files are blob-identical to `origin/main`: `autosPrivadoLocationReady.ts` `cb87d88d`, `autosPreviewCompleteness.ts` `71a09941`, `useAutoPrivadoDraft.ts` `812819be`, `AutosApplicationMissingItemsBanner.tsx` `a5a7611a`, `autosDealerStructuredAddress.ts` `dfa86df0`. **A merge is a literal no-op.** `git cherry` reported "+" only because patch-id hashes diff context and the branch applied onto a 346-commit-older base — the textbook stale-branch false positive.

## C.4 · Verdict

**DISCARD ALL THREE. Merge nothing. No partial merge is warranted** — not one file on any branch is absent from `origin/main` or present in a superior form. Concrete regression risk if merged is documented in C.1 and C.2. Each branch is 346–373 commits behind, so a merge would also drag ~900+ unrelated conflict points.

Traceability for the superseding commits: `18bc2b5b` (supersedes `ea429664`), `29ee58fc` (supersedes `25635f6c`).

*Out of scope note:* `git branch -a --contains` also surfaces a separate local branch `autos-dealership` (`8500a26e`) that is still diverged and was **not** analysed.

---

# PART D — DRAFT · HARD REFRESH · UNSAVED GUARD (G05/G06) · PREVIEW → EDIT (G07)

## D.1 · Autos

| Aspect | privado | dealer parent | dealer child |
|---|---|---|---|
| **Draft hook** | `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts:50` | `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts` | shares the parent's draft — `autosNegociosDraftStorage.ts:39-47` (`additionalInventoryVehicles`, `inProgressInventoryVehicleDraft`, `inventoryDrawerEditingId`, `inventoryDrawerOpen`) |
| **Storage medium** | **localStorage + IndexedDB** — `clasificados/autos/privado/lib/autosPrivadoDraftStorage.ts:4-13` (video via `autosNegociosDraftVideoIdb`, images/logo via `autosNegociosDraftIdbRefs`), key builder `autosPrivadoDraftNamespace.ts` | same shape — `clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts:5-16` | same store, nested |
| **Survives hard refresh?** | **YES.** `useAutosDraftPersistEffects.ts:21-32` registers **both** `pagehide` and `beforeunload` to flush immediately, plus a 400 ms debounce (`:12-19`). localStorage + IDB also survive **tab close**. | YES | YES (drawer state incl. `inProgressInventoryVehicleDraft` is persisted) |
| **Fresh-tab reset** | `autosEditorTabSession.ts` — `shouldResetAutosDraftForFreshEditorTab` / `markAutosEditorSessionActive`, consumed `useAutoPrivadoDraft.ts:19-23`. Prevents a stale draft leaking into a brand-new tab. | same | same |
| **Unsaved-changes guard** | **PARTIAL — see D.1.1** | **PARTIAL** | **YES** — `AutosNegociosAddInventoryDrawer.tsx:31,:389` renders `AutosUnsavedChangesModal` (`shared/components/AutosUnsavedChangesModal.tsx:18`) on drawer close |
| **Preview VM builder** | `AutosPrivadoPreviewClient.tsx` `resolvePreviewState()` → `safeNormalizePrivadoListing` → `AutoPrivadoPreviewPage` | `AutosNegociosPreviewClient.tsx:~230` `resolvePreviewStateForRoute(canonicalListingId)` → `AutosNegociosDealershipPreviewPage` | `AutosNegociosChildInventoryPreviewOverlay.tsx:38` `mapInheritedDealerPreviewListing(parent, child)` + `:39` `buildRelatedDraftPreviewListings` |
| **Preview → EDIT** | `EDIT_BASE = "/publicar/autos/privado"` (`AutosPrivadoPreviewClient.tsx:34`), resume flag via `withAutosEditorResumeFromPreview` (`AutosPrivadoPublishConfirm.tsx:12`); `?resume=1` consumed and stripped at `AutosPrivadoApplication.tsx:161-165` and `useAutoPrivadoDraft.ts:45-48` | `EDIT_BASE = "/publicar/autos/negocios"` (`AutosNegociosPreviewClient.tsx:53`); dashboard round-trip via `autosDealerBackToEditHrefFromPreview` (`autosDashboardInventoryAddonCheckout.ts:115-120`) | `onBackToEdit` callback prop (`AutosNegociosChildInventoryPreviewOverlay.tsx:27`) — in-page, no navigation |
| **Preview readiness gate** | `getAutosPreviewBlockingStepIndices("privado", listing)` (`AutosPrivadoApplication.tsx:174`) ← `autosPreviewCompleteness.ts:59` | `…("negocios", …)`, incl. `listingHasAutosNegociosPreviewLocation` (`:48-57`) | inherits parent |
| **Preview error containment** | `AutosDraftPreviewErrorBoundary` with `AutosPrivadoPreviewEmptyState` fallback (`AutosPrivadoPreviewClient.tsx:243`) | same with `AutosNegociosPreviewEmptyState` | same |

### D.1.1 · **FINDING — Autos has no page-level unsaved-changes navigation guard**

`useAutosDraftPersistEffects.ts:26-27` registers `beforeunload` **only to flush the draft**, never to `preventDefault()` / set `returnValue`. So a refresh or close never prompts — which is *safe* here precisely because the draft is durable (localStorage + IDB). The only true guard is the child drawer's modal (`AutosNegociosAddInventoryDrawer.tsx:389`).

Six other categories on `origin/main` do implement a real leave guard: `app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts`, `app/(site)/clasificados/lib/publishFlowLifecycleClient.ts`, `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`, plus direct `beforeunload` handlers in `AgenteIndividualResidencialApplication.tsx`, `BrNegocioChildInventoryFullApplication.tsx`, `RentasNegocioForm.tsx`, `RentasPrivadoForm.tsx`.

**Reference-Implementation line**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | shared business-applications layer; En Venta; BR Negocio; Rentas |
| REFERENCE PATH | `app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts`; `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`; `app/(site)/clasificados/lib/publishFlowLifecycleClient.ts` |
| TARGET PATH | `app/lib/clasificados/autos/useAutosDraftPersistEffects.ts:21-32` (flush-only), consumed by `useAutoPrivadoDraft.ts:24` and `useAutoDealerDraft.ts` |
| DIFFERENCE | Autos flushes on unload but never warns. Because the Autos draft is durable across tab close, the *data-loss* risk is low; the gap is UX consistency (a user who navigates away mid-application gets no confirmation) |
| **ACTION** | **ADOPT EXISTING** — low priority (P3). Do **not** regress the flush behaviour when adding the prompt |

## D.2 · Empleos

| Aspect | premium | quick | feria |
|---|---|---|---|
| **Draft hook** | `app/(site)/publicar/empleos/shared/hooks/useEmpleosDraftSession.ts:14` (shared, generic) | same | same |
| **Storage key** | `leonix_empleos_premium_draft_v1` — `shared/constants/empleosSessionKeys.ts:4` | `leonix_empleos_quick_draft_v1` `:3` | `leonix_empleos_feria_draft_v1` `:5` |
| **Storage medium** | **sessionStorage only** — read `useEmpleosDraftSession.ts:24`, write `:46`. Header at `:11-13`: *"survives edit ↔ preview and in-tab refresh. Clears when the browser tab is closed."* | same | same |
| **Survives hard refresh?** | **YES (in-tab)** — normalised on rehydrate via `normalizeEmpleosPremiumDraft` (`:30`) | YES, `normalizeEmpleosQuickDraft` (`:28`) | YES, `normalizeEmpleosFeriaDraft` (`:32`) |
| **Survives tab close?** | **NO** — sessionStorage scope. **Asymmetry vs Autos (D.2.1)** | NO | NO |
| **Media in draft?** | Images/video are session-serialised only; there is no IndexedDB offload equivalent to Autos' `autosNegociosDraftIdbRefs` / `…VideoIdb` | same | same |
| **Unsaved-changes guard** | **NO** — repo-wide `git grep -ln "beforeunload" origin/main -- app/` returns **zero** Empleos files | NO | NO |
| **Preview VM builder** | `shared/mappers/mapPremiumDraftToShell.ts` | `shared/mappers/mapQuickDraftToShell.ts` (`:120` renders `workModalityCustom`) | `shared/mappers/mapFeriaDraftToShell.ts` |
| **Preview → EDIT (form state)** | **restored** — sessionStorage key is shared by both surfaces and the preview never mutates it. Back-href `EmpleoPremiumPreviewClient.tsx:85`, shell `:180-184` (`onBeforeNavigateToEdit={markPublishFlowReturningToEdit}`) | restored — `EmpleoQuickPreviewClient.tsx:90`, `:199-203` | restored — `EmpleoFeriaPreviewClient.tsx:49`, `:71-76` |
| **Preview → EDIT (listing identity)** | **LOST** — §A.2.4 | **LOST** | **LOST** |
| **Publish-flow lifecycle flags** | called but inert — `markPublishFlowOpeningPreview` at `premium:94` / `quick:119` / `feria:93`; `publishFlowLifecycleClient.ts:14-18` documents these as existing *for a leave-guard to read*, and Empleos mounts none | same | same |
| **Preview-mode contract** | **ADOPTED** — `EmpleoPremiumPreviewClient.tsx` imports the shared `app/lib/listingIdentity/previewModeContract.ts` | **ADOPTED** — `EmpleoQuickPreviewClient.tsx` | **NOT adopted** — `EmpleoFeriaPreviewClient.tsx` is absent from the consumer list |
| **Preview noindex** | `PREVIEW_NOINDEX_METADATA` on the route | same | same (`feria-preview/page.tsx:5,:8`) |
| **Republish safety** | **DESTRUCTIVE + DOUBLE CHARGE** — `06_…md` §2.9 | **DESTRUCTIVE + DOUBLE CHARGE** — §2.10 as corrected above | **SAFE at the publish modal** (`EmpleoFeriaApplicationClient.tsx:428` pins `listingId: serverListingId` → UPDATE branch `empleosPublicListingsDbServer.ts:218-226`), but **still forks after a preview round-trip** (§A.2.4) |

### D.2.1 · **FINDING — Empleos drafts are strictly less durable than Autos drafts**

Autos: localStorage + IndexedDB, flushed on `pagehide`/`beforeunload`, namespaced per user, with a fresh-tab reset guard. Empleos: sessionStorage only, no unload flush, no media offload. An employer who half-completes a Premium job posting and closes the tab **loses everything**.

**Reference-Implementation line**

| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | **Autos** (both lanes) |
| REFERENCE PATH | `app/(site)/clasificados/autos/privado/lib/autosPrivadoDraftStorage.ts` + `.../negocios/lib/autosNegociosDraftStorage.ts` + `app/lib/clasificados/autos/useAutosDraftPersistEffects.ts:21-32` + `.../autosEditorTabSession.ts` (fresh-tab reset) |
| TARGET PATH | `app/(site)/publicar/empleos/shared/hooks/useEmpleosDraftSession.ts:24,:46` |
| DIFFERENCE | sessionStorage (tab-lifetime) vs localStorage + IDB (durable, media-capable, unload-flushed, user-namespaced) |
| **ACTION** | **ADOPT EXISTING** (P2). Note the current behaviour is *documented and deliberate* (`:11-13`), so this is a product decision as much as a defect — flag for owner sign-off rather than a silent fix |

---

# PART E — PER-LANE GLOBAL SYSTEM ADOPTION

Legend: **T** = TRUE with traced consumer · **F** = FALSE · **N-A** = not applicable to the lane.
Lanes: **AP** autos privado · **ADP** autos dealer parent · **ADC** autos dealer inventory child · **EP** empleos premium · **EQ** empleos quick · **EF** empleos feria.

| # | System | AP | ADP | ADC | EP | EQ | EF | Traced consumer (representative) |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| 1 | checkpoint | T | T | N-A | **F** | **F** | **F** | Autos TRUE: `PublicarAutosBranchClient.tsx:26,:31,:40` (shared `PublishEntryCheckpointLayout`/`Stack` + `getAutosCheckpointCards`). **Empleos FALSE — dead code:** cards built `EmpleosPublicarHubClient.tsx:85-91`, rendered only under `variant === "clasificadosPublicar"` (`:177`, `:179-199`), whose sole producing route now redirects (`clasificados/publicar/empleos/page.tsx:27`). §A.2.2 |
| 2 | draft | T | T | T | T | T | T | `useAutoPrivadoDraft.ts:50`; `autosNegociosDraftStorage.ts:31-48`; `useEmpleosDraftSession.ts:14` |
| 3 | unsaved guard | **F** | **F** | T | **F** | **F** | **F** | Only `AutosNegociosAddInventoryDrawer.tsx:389` (`AutosUnsavedChangesModal`). §D.1.1 / §D.2 |
| 4 | preview | T | T | T | T | T | T | `AutosPrivadoPreviewClient.tsx`; `AutosNegociosPreviewClient.tsx`; `AutosNegociosChildInventoryPreviewOverlay.tsx:38`; `EmpleoPremiumPreviewClient.tsx`; `EmpleoQuickPreviewClient.tsx`; `EmpleoFeriaPreviewClient.tsx` |
| 5 | preview → edit | T | T | T | **T\*** | **T\*** | **T\*** | Autos: `AutosPrivadoPreviewClient.tsx:34` + `?resume=1` at `AutosPrivadoApplication.tsx:161-165`; `AutosNegociosPreviewClient.tsx:53`. Empleos: `EmpleoPremiumPreviewClient.tsx:85,:180-184` / `EmpleoQuickPreviewClient.tsx:90,:199-203` / `EmpleoFeriaPreviewClient.tsx:49,:71-76`. **\* PARTIAL — form state restored, listing identity LOST (§A.2.4)** |
| 5b | **shared preview-mode contract** (`b60801e2`) | **F** | **F** | **F** | T | T | **F** | Shared `app/lib/listingIdentity/previewModeContract.ts:18-46`, consumed by 8 clients incl. `EmpleoPremiumPreviewClient.tsx` / `EmpleoQuickPreviewClient.tsx`. Autos uses **bespoke** unions: `AutosPrivadoPreviewClient.tsx:36` (`"empty"|"draft"|"mock"|"dashboard_edit"`), `AutosNegociosPreviewClient.tsx:56`. §E.1 |
| 6 | checkout | T | T | N-A | T | **T** | N-A | `AutosPrivadoPreviewClient.tsx:258`; `AutosNegociosPreviewClient.tsx:581`. **Empleos: BOTH paid lanes** — `EmpleoPremiumPreviewClient.tsx:205-223`; `EmpleoQuickPreviewClient.tsx:99,:219-237,:152-158`; shared config `empleosPreviewPaidCheckout.ts:17,:19-43` → `empleosRevenueCheckout.ts:22-28`. Feria excluded by name (`empleosPreviewPaidCheckout.ts:5`). Autos child inherits parent plan (add-on parent-only, `inventory-pack/checkout/route.ts:102-111`) |
| 7 | promo | T | T | N-A | T | **T** | N-A | `AutosPrivadoPreviewClient.tsx:273` `onPromoApply={handlePromoApply}`; `AutosNegociosPreviewClient.tsx:586` `applyAutosDealerPreviewPromoCode`; Empleos `applyEmpleosPreviewPromoCode` (`empleosPreviewPaidCheckout.ts:49-72`, `promoEligible: true` `:40`) wired at premium-preview `:219` / quick-preview `:233`; shared field `PublishCheckoutCheckpoint.tsx:64-68,:142-156`. `autos_privado_30d` in `revenuePromoRedemptions.ts:108` |
| 8 | media / gallery | T | T | T | T | T | **F** | Autos: `AutosSortablePhotoGrid.tsx`, `AutosNegociosMediaManager.tsx`, IDB offload `autosNegociosDraftIdbRefs.ts`. Empleos: `EmpleosImageGalleryEditor.tsx` at premium `:325-336` and quick `:442`. **Feria: a single flyer image only** — `EmpleosSingleImageField` at `feria:277`; the envelope hardcodes the limit, `buildEmpleosPublishEnvelope.ts:298-310` (`imageUrls: flyer ? [flyer] : []`) |
| 9 | video | T | T | T | T | T | **F** | Autos Mux: `negocios/lib/muxVideoLifecycle.ts`, `autoDealerVideo.ts`, `autosMuxVideoClient.ts`, publish prep `autosMuxPublishPrepare.ts:6-18`. Empleos: `EmpleosVideoDraftField.tsx` at premium `:351-367` (max 1) and quick `:477` (up to 4, `buildEmpleosPublishEnvelope.ts:65` `.slice(0,4)`). **Feria has no video field**, and the envelope reuses the video slot for a blob flyer. **Autos child caveat:** the child inherits the *parent's* 8 video/Mux keys on republish — `06_…md` §2.8 |
| 10 | phone / SMS / WhatsApp | T | T | T | **P** | T | **P** | Autos: `privado/lib/privadoContactIntent.ts` + `PrivadoContactStrip.tsx`; `negocios/lib/dealerWhatsappHref.ts`, `mapAutosDealerToBusinessHubContact.ts:92-100`, `dealerContactResolve.ts`. Empleos quick is complete — whatsapp `:523-524`, SMS `:528-529`, phone in the same block, persisted `empleosDraftFromEnvelope.ts:57`. **Premium (PARTIAL): phone + WhatsApp, no SMS** (`EmpleosPremiumCtaFieldGroup`, `premium:371-381`). **Feria (PARTIAL): phone only** (`feria:333`). Display helper `shared/lib/empleosPhoneDisplay.ts`. **Inverted ladder — the paid premium tier has fewer contact channels than quick.** §E.1 |
| 11 | email | T | T | T | T | T | T | `autosCtaTracking.ts` (`mailto`), `PrivadoContactStrip.tsx`; `EmpleosCtaFieldGroup.tsx` / `EmpleosPremiumCtaFieldGroup.tsx` |
| 12 | **rich correo** — read two ways, **F under both** | **F** | **F** | **F** | **F** | **F** | **F** | **(a) Server-side templated inquiry email:** reference `app/lib/email/contactInquiryEmail.ts`, consumed by `app/api/clasificados/servicios/inquiry/route.ts`, `serviciosLeadNotifyRecipientServer.ts`, `submitEnVentaListingReport.ts`, `savedSearchEmailDelivery.ts`, `processLeonixLeadPost.ts`. Neither Autos nor Empleos wires it — both hand off via client-side `mailto:`. **(b) Rich-text *authoring* control:** no category on `origin/main` has one; every Empleos long-text field is a plain `<textarea>` (`premium:387`, `:427`). A rich *renderer* exists but display-only and Premium-only — `components/premiumJob/richTextLine.tsx`, consumed by `PremiumJobMainContent.tsx:1` and `PremiumJobRequirementsCard.tsx:1`. §E.1 |
| 13 | languages spoken | N-A | T | T (inherited) | **F** | **F** | **P** | Autos: `app/lib/clasificados/autos/autosDealerLanguages.ts`; editor `AutosDealerLanguagesField.tsx`; rendered `DealerBusinessStack.tsx` / `PreviewDealerBusinessStack.tsx`; inherited `AutosInventoryInheritedDealerStep.tsx`. **Empleos has no form field in any lane**; feria only *derives* it from one bilingual checkbox — `staged/empleosEnvelopeToJobRecord.ts:333` (`languagesSpoken: d.bilingual ? "es, en" : "es"`). It **is** consumed for search (`empleosResultsQuery.ts:165`), so the facet is permanently blank for premium and quick |
| 14 | hours | N-A | T | T (inherited) | **F** | **T** | N-A | Autos: `AutosDealerHoursEditor.tsx`, `autosDealerHoursTimeUi.ts`, `negocios/lib/dealerHoursDisplay.ts`, `autoDealerPresence.ts`. Empleos **quick** has structured shift rows — `EmpleosShiftScheduleEditor.tsx` at `quick:413`, which itself imports Autos' `autosDealerHoursTimeUi` (`EmpleosShiftScheduleEditor.tsx:9`). **Premium stores a single free-text "Horario / turno"** (`premium:279-282`) and therefore cannot emit structured schedule data |
| 14b | schedule / shifts | N-A | N-A | N-A | **F** | T | N-A | `shared/lib/empleosScheduleDisplay.ts`; public `components/quickJob/QuickJobScheduleCard.tsx`. Premium free-text only — see row 14 |
| 15 | websites / social | T (partial) | T | T (inherited) | **F** | **T** | **F** | Autos privado: website field only. Dealer: `autosDealerCustomLinks.ts`, `autosSocialLinkValidation.ts`, `autosNegociosBusinessHubSocialBrand.tsx`. **Empleos quick is the complete one** — website + LinkedIn + Facebook + Instagram + TikTok + YouTube + X + Snapchat + a labelled "other link" (`quick:625-693`, persisted `empleosDraftFromEnvelope.ts:75-83`). **Premium: a single `websiteUrl`** inside the CTA group (`premium:371`). **Feria: `organizerUrl` (`:268`) + `contactLink` (`:328`) only.** Second instance of the inverted ladder |
| 16 | CTA hub | T | T | T | **F** | **F** | **F** | Autos TRUE: `clasificados/autos/shared/lib/autosCtaSheet.ts` + `AutosSheetCtaLink.tsx` + `AutosDirectContactLink.tsx`. **Empleos FALSE:** each lane hand-rolls its contact block (`premium:370-382` bespoke `EmpleosPremiumCtaFieldGroup`, `quick:520-530`, `feria:322-343`). Empleos *authored* a reusable `shared/components/EmpleosCtaFieldGroup.tsx:40` that **it never consumes** — its only consumers are Clases (`ClasesQuickApplication.tsx:796`) and Comunidad (`ComunidadQuickApplication.tsx:497`). ⚠ **Registry drift:** `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts:242` declares empleos `contactHub: "supported"` with no traced consumer |
| 17 | translate ad | T | T | T | T | T | T | `clasificados/autos/lib/autosTranslateAd.ts` → `vehiculo/[id]/AutosListingTranslationLayer.tsx` (mounted `AutosLiveVehicleClient.tsx:20`); `clasificados/empleos/lib/empleosTranslateAd.ts` → `components/EmpleosJobTranslationLayer.tsx` |
| 18 | ES / EN | T | T | T | **P** | **P** | **P** | Autos TRUE: `negocios/lib/autosNegociosLang.ts` (`resolveAutosRouteLang`, `withLangParam`), `useAutosNegociosLang.ts`, `privado/lib/useAutosPrivadoLang.ts`, plus an in-page switch (`landing/AutosLandingLangSwitch.tsx`). **Empleos PARTIAL:** `?lang=` is honoured end-to-end (`resolveClasificadosPublishLang` at `premium:44-47`, `quick:69-72`, `feria:42-45`, all previews, and `empleos/[slug]/page.tsx:30`) but there is **no in-page toggle control**, and copy is hand-inlined per lane (e.g. `premium:108-129,:133-180`) rather than routed through a dictionary — `shared/copy/empleosPublishSharedCopy.ts` exists but covers only final-step/gate copy. DB column `lang` on both tables |
| 19 | **community trust** | **F** | **F** | **F** | **F** | **F** | **F** | Reference `app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx`, consumed by Comida Local, BR/Rentas (`BrRentasCommunityTrustSection.tsx`), Restaurantes, Servicios, dashboard (`OwnerEntityCommunityTrust.tsx`). Zero hits in autos/empleos trees. §E.2 |
| 20 | google / yelp | N-A | T (bespoke renderer) | T (inherited) | N-A | N-A | N-A | Data pipeline complete: `autoDealerListing.ts:262,:266` → `autoDealerDraftDefaults.ts:125-127,:190-191` → `AutosNegociosApplication.tsx:554-564` → `mapAutosDealerToBusinessHubContact.ts:92,:100` → rendered by bespoke `AutosNegociosHubReviewLinkButton.tsx` at `DealerBusinessStack.tsx:343` / `PreviewDealerBusinessStack.tsx:636`. The **shared** drawer does not exist on `origin/main` — `12B_…md` §2.5 |
| 21 | **address verifier** | **F** | **F** | **F** | **F** | **F** | **F** | Only `app/lib/businessAddress/businessAddressContract.ts` exists on `origin/main`; no verifier UI in either category. Autos has structured address capture instead (`AutosDealerStructuredAddressFields.tsx`, `autosDealerStructuredAddress.ts`) and Empleos has `empleosGlobalLocation.ts` / `empleosReverseGeocode.ts`. §E.2 |
| 22 | **location privacy** | **F** | **F** | **F** | **F** | **F** | **F** | Reference `showExactAddress` in BR (`leonixRealEstateListingContract.ts`, `brNegocioChildInventoryFormMapping.ts`), Rentas (`rentasPublicListing.ts`, `leonixRentasShowing.ts`), Restaurantes (`buildRestaurantContactHub.ts`). Zero hits in autos/empleos. Empleos instead **force-locks** the region — `premium:209-215` renders a readonly `EMPLEOS_STANDARD_CITY` input (`shared/constants/empleosStandardRegion.ts`) — a blunt substitute, not a privacy control. §E.1 |
| 22b | **directions / map** | **F** | **F** | **F** | **F** | **T** | **F** | Empleos quick has the full card: `components/quickJob/QuickJobLocationCard.tsx:18` (map embed), `:25` (directions URL), `:36` (`mapsHref`), toast `EmpleoQuickDetailPage.tsx:63`. Premium exposes `employerAddress` as free text only (`premium:436`); feria has venue text only. Autos has no directions surface in any lane. **In-category reference exists** — §E.1 |
| 23 | **saved search** | **T** | **T** | **T** | **F** | **F** | **F** | Autos is one of only **3** categories with a full adapter set — `app/lib/saved-search/autos/`: `savedSearchAutosAdapter.ts`, `savedSearchAutosMatcher.ts`, `autosPublicEligibleListing.ts`, `autosSavedSearchEligibilitySupport.ts`, `autosSavedSearchMatchOrchestrator.ts`, `autosSavedSearchDeliveryResolver.ts`, `autosSavedSearchResultsUrl.ts` (**7 modules — complete parity with bienes-raices; rentas has 6, lacking an `EligibilitySupport`**). Registered `app/lib/saved-search/delivery/savedSearchEmailDelivery.ts:38`; UI `AutosSaveSearchButton.tsx` mounted at `AutosPublicResultsShell.tsx:25,:406`; server trigger `autosSavedSearchMatchOrchestrator` called from `autosClassifiedsListingService.ts:34`. Empleos has **no** `app/lib/saved-search/empleos/` directory and no entry in `CATEGORY_RESOLVERS` (`savedSearchEmailDelivery.ts:37-41`). §E.2 |
| 24 | save / like / share / report | T | T | T | T | T | T | `clasificados/autos/shared/components/AutosEngagementRow.tsx` (consumed `AutoPrivadoPreviewPage.tsx`, `AutosNegociosPreviewEngagementStrip.tsx`, `AutosResultCard.tsx`, `AutosPreviewCard.tsx`, `AutosPublicStandardCard.tsx`); report via shared `LeonixInlineListingReport` at `AutosLiveVehicleClient.tsx:16,:~244`. Empleos: `components/EmpleosClasificadosEngagementRow.tsx` |
| 25 | analytics | T | T | T | T | T | T | `clasificados/autos/lib/recordAutosGlobalAnalytics.ts:10,:14`; `analytics/autosAnalyticsEvents.ts` + `autosAnalyticsExtended.ts`; `AutosVehicleProfileViewAnalytics.tsx` (mounted `AutosLiveVehicleClient.tsx:17`); service `app/lib/clasificados/autos/autosClassifiedsAnalyticsService.ts`; table `autos_classifieds_analytics_events` (migration `20260408140000`). Empleos: `clasificados/empleos/lib/recordEmpleosGlobalAnalytics.ts`, `analytics/empleosAnalyticsExtended.ts`, `EmpleosJobProfileViewAnalytics.tsx`, table `empleos_listing_metrics`. Emitter coverage per `10_…md` |
| 26 | results | T | T | T | T | T | T | `AutosPublicResultsShell.tsx:58` + `AutosPublicFilterRail.tsx` + `autosBrowseFilterContract.ts`; `EmpleosResultsView.tsx` + `empleosResultsQuery.ts` + `empleosFilterContract.ts` |
| 27 | related listings | T | T | T | T | T | T | `buildRelatedPublicListings` → `autosClassifiedsListingService.ts:791-793` (`relatedDealerListings`, `relatedDealerInventoryHasMore`, `relatedDealerInventoryHref` `:795-806`); draft-side `buildRelatedDraftPreviewListings` (`autosInventoryInheritedPreview.ts`). Empleos: `PremiumJobMoreJobsSection.tsx` / `QuickJobMoreJobsSection.tsx` |
| 28 | business hub | N-A | T | T (inherited) | **F** | **F** | **F** | Autos: `negocios/lib/mapAutosDealerToBusinessHubContact.ts` + `autosNegociosBusinessHubContactTypes.ts` + `AutosNegociosBusinessHubMapPreview.tsx` / `…FauxMap.tsx`, rendered via `PreviewDealerBusinessStack.tsx` (per `13_…md` Part A). Empleos has an employer trust card (`PremiumEmployerTrustCard.tsx`) but **no** business-hub contact model |
| 29 | revenue OS | T | T | N-A | T | N-A | N-A | `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts:45` (`autos_privado_30d`), `:52` (`autos_dealer_monthly`); pricing `revenuePricingMatrix.ts:89,:105`; bundle `revenueCheckout.ts:56`. Empleos `empleos_job_post_paid` per `11_…md` |
| 30 | placement / ranking | T | T | T | T | T | T | `app/lib/clasificados/autos/autosPublicRanking.ts`, `autosPublicListingScore.ts`, `boosts/autosBoostPolicy.ts`; entitlement-driven `featured` at `app/api/clasificados/autos/public/listings/route.ts:32-52` (`resolveListingPlacementEntitlement`, `resolveCanonicalPlacementRankWeights`). Empleos: `lib/empleosPublicRankingPolicy.ts` |
| 31 | dashboard | T | T | T | T | T | T | `dashboardInventory.ts:254-306` `buildAutosClassifiedsInventoryItems`; `AutosDealerInventoryDashboardSection.tsx`; `dashboard/empleos/page.tsx` + `[listingId]/page.tsx`; capability truth `dashboardMisAnunciosCategoryTools.ts:111` (autos), `:112-121` (empleos) |
| 32 | active edit | **F** | T | T | T | T | **T** | Autos privado: `autosClassifiedsListingService.ts:249-252` — `recoverableStatus` excludes `active`, and `negociosActiveEditable` requires `lane === "negocios"` ⇒ **an active `privado` row is rejected** (`06_…md` §2.6). Dealer parent/child: allowed by `negociosActiveEditable` (`:246`). Empleos, **all three lanes**: UUID-validated `?edit=` → `GET /api/clasificados/empleos/listings/{id}` → `hydrate*FromEnvelope` → `setServerListingId` (`premium:59-85`, `quick:84-110`, `feria:58-84`), lane guard `empleosEditLaneRedirect.ts:16`; lifecycle PATCH `dashboardMisAnunciosCategoryTools.ts:119` |
| 33 | republish same-row | T | T | T | **F** | **F** | **T\*** | Autos writes `.eq("id", listingId).eq("owner_user_id", ownerUserId)` and never touches identity/lifecycle/Stripe columns — `autosClassifiedsListingService.ts:275-281`, contract `:262-266`; child loop `:355-361`. **Feria does it correctly too** — `EmpleoFeriaApplicationClient.tsx:428` `serverListingId ? {...base, listingId: serverListingId} : base` → UPDATE branch `empleosPublicListingsDbServer.ts:218-226`. **Premium/Quick FALSE:** their only publish path is the preview checkout, which rebuilds the envelope with no identity in scope (`premium-preview:147`, `quick-preview:152`) and `buildEmpleosPublishEnvelope.ts:250` pins `listingId: null` → INSERT `:227-231`. **\*Feria still forks after a preview round-trip** (§A.2.4) |
| 34 | no-recharge guard | **F** | T | N-A | **F** | **F** | N-A | `REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS` (`revenueActiveEntitlementGuard.ts:65`) covers `autos_dealer_monthly` only; the three one-time lanes are explicitly excluded (`:53`) and `activePaidEditCheckoutOwnership.ts` is **absent from `origin/main`** (`11_…md`, `06_…md` §4.2). **Empleos additionally has a client-side suppression guard that is DEAD CODE:** `EmpleoPremiumPreviewClient.tsx:52-59` / `EmpleoQuickPreviewClient.tsx:56-65` compute `listingBoundPreview` from `preview=listing` **or** (`source=dashboard` **and** `listingId`) and suppress the checkpoint (`:193` / `:207`) — but **nothing in `origin/main` ever emits those params on an Empleos preview URL**: the builder emits only `?from=publicar&lang=` (`empleosPublishRoutes.ts:22-25`), and the only producers of `source=dashboard&listingId=` are Autos and Comida Local (`dashboardInventory.ts:266`, `AutosDealerInventoryDashboardSection.tsx:372,:375`). The server POST route performs no already-paid check either (`app/api/clasificados/empleos/listings/route.ts:37-97`); only post-hoc webhook idempotency exists (`revenueEmpleosFulfillment.ts`, outcome `already_published`) |
| 35 | admin | T | T | T | T | T | T | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`; `.../empleos/page.tsx`; projection `empleosAdminProjection.ts` |
| 36 | SEO | T | T | T | T | T | **P** | Autos: canonical + OG `vehiculo/[id]/page.tsx:13-40`, Vehicle JSON-LD `:50-73` ← `seo/autosVehicleJsonLd.ts`; landing canonical `clasificados/autos/page.tsx:7-9`; results canonical `results/page.tsx:9-11`; application canonicals `publicar/autos/privado/page.tsx:9`, `.../negocios/page.tsx:9`. Empleos: canonical + OG `empleos/[slug]/page.tsx:27-74` (canonical `:39`), JobPosting JSON-LD `:118` ← `lib/empleosJobPostingSchema.ts:21-77`, absolute URL `lib/empleosSiteUrl.ts`; publish-route metadata `premium/page.tsx:7-13` etc.; previews noindex. **Feria PARTIAL — `:118` has no lane branch, so a job *fair* is emitted as `schema.org/JobPosting` (§A.2.6).** **Autos exception:** the shadow publish route, §A.0.1 |
| 37 | mobile / PWA | T | T | T | T | T | T | Responsive throughout (e.g. `AutosPublicResultsShell.tsx` — 11 lines carrying `sm:`/`md:`/`lg:` breakpoints); safe-area insets at `AutosLiveVehicleClient.tsx:~242` (`env(safe-area-inset-*)`). No category-specific PWA manifest for either — platform-level concern, not a lane gap |
| 38 | security / RLS | T | T | T | T | T | T | Autos: RLS enabled `20260409120000_…:29`, owner-select `:32-36`, public-active `:39-42`; API auth `getAutosPublishUserIdFromRequest` (`listings/route.ts:92,:130`), bearer `app/lib/clasificados/autos/autosListingBearerAuth.ts`, owner-scoped writes `autosClassifiedsListingService.ts:280`, payload cap `AUTOS_LISTING_API_MAX_BODY_BYTES` (`listings/route.ts:115-125`), self-tests `gate-i11a`/`gate-i11b`. Empleos: RLS enabled `20260410210000_…:59`, published-select `:61`, owner-select `:66-69`, applications RLS `:92`. **Caveat:** neither table's RLS encodes the parent-visibility rule — `12B_…md` §0 |

### E.0 · **FINDING (P3) — owner-capability registry drift for Empleos**

`app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts:238-247` (the Empleos block) disagrees with the code in three places:

| Registry claim | Reality |
|---|---|
| `contactHub: "supported"` (`:242`) | **Overstated** — no traced consumer; each lane hand-rolls its contact block (row 16) |
| `analytics: "unproven"` (`:239`) | **Understated** — `EmpleosJobProfileViewAnalytics` is mounted for all lanes at `EmpleosPublicLaneDetailClient.tsx:242-249`, CTA tracking `:107-118`, server view counter `:186-190` |
| `relatedListings: "unproven"` (`:244`) | **Understated** — `getRelatedJobs` `:193-196`, rendered `:230-240`, injected into all three lane branches (`:266`, `:281`, `:313`) |

The block also omits `communityTrust` and `externalReviews` entirely, whereas Servicios (`:142-143`) and Restaurantes (`:157`) declare them. **ACTION: reconcile the registry with traced reality — it is the input other audits read as truth.**

## E.1 · Reference-Implementation lines for every FALSE

| System / lanes | REF? | REF CATEGORY | REFERENCE PATH | TARGET PATH | DIFFERENCE | ACTION |
|---|---|---|---|---|---|---|
| **unsaved guard** — AP, ADP, EP, EQ, EF | YES | shared business-applications; En Venta; BR Negocio; Rentas | `app/lib/businessApplications/useBusinessApplicationLeaveGuard.ts`; `app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts`; `app/(site)/clasificados/lib/publishFlowLifecycleClient.ts` | `app/lib/clasificados/autos/useAutosDraftPersistEffects.ts:21-32`; `app/(site)/publicar/empleos/shared/hooks/useEmpleosDraftSession.ts` | Autos flushes on unload but never warns; Empleos does neither. Autos risk is low (durable draft); **Empleos risk is real** (sessionStorage + no warning) | **ADOPT EXISTING** — P3 for Autos, **P2 for Empleos** |
| **shared preview-mode contract** — AP, ADP, ADC, EF | YES | 8 categories incl. both other Empleos lanes | `app/lib/listingIdentity/previewModeContract.ts:18-46` (`resolvePreviewMode`, `previewModeSuppressesBasePlanCheckout`) | `AutosPrivadoPreviewClient.tsx:36`; `AutosNegociosPreviewClient.tsx:56`; `EmpleoFeriaPreviewClient.tsx` | Autos encodes the same three states in bespoke string unions. Behaviour is already correct (checkout suppressed when `dashboard_edit` — `06_…md` §2.6), so this is contract consolidation, not a live bug | **ADOPT EXISTING** — P3 |
| **rich correo** — all six | YES | Servicios (+ En Venta, saved-search delivery, Leonix leads) | `app/lib/email/contactInquiryEmail.ts` + `app/api/clasificados/servicios/inquiry/route.ts` + `app/(site)/clasificados/servicios/lib/serviciosLeadNotifyRecipientServer.ts` | no Autos or Empleos inquiry route exists | Both categories rely on client-side `mailto:` / `tel:` handoff; no server-side templated inquiry email, so no lead record, no deliverability control, no owner notification | **ADOPT EXISTING** — P2. Empleos already has an applications table (`empleos_job_applications`), so the notification half is the only missing piece there |
| **community trust** — all six | YES | Comida Local, BR/Rentas, Restaurantes, Servicios, dashboard | `app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx`; consumers `ComidaLocalPublicDetailClient.tsx`, `BrRentasCommunityTrustSection.tsx`, `RestaurantContactHub.tsx`, `ServiciosBusinessHubContactCard.tsx`, `OwnerEntityCommunityTrust.tsx` | Autos: `PreviewDealerBusinessStack.tsx` / `DealerBusinessStack.tsx`. Empleos: `PremiumEmployerTrustCard.tsx` | The shared component's own header cites `AutosSaveSearchButton` as its integration-pattern model (`LeonixCommunityTrust.tsx:10`) — Autos is the *inspiration* for the pattern yet never adopted the component | **ADOPT EXISTING** — P2 |
| **address verifier** — all six | **NO (partial)** | — (only a contract module exists) | `app/lib/businessAddress/businessAddressContract.ts` — contract only, no verifier UI on `origin/main` | `AutosDealerStructuredAddressFields.tsx`; `publicar/empleos/shared/lib/empleosGlobalLocation.ts` | No category has a working address verifier on production; Autos and Empleos each have their own structured-capture path instead | **NET NEW** — P3, platform-level, not a lane gap |
| **location privacy / directions** — all six | YES | Bienes Raíces, Rentas, Restaurantes | `showExactAddress` in `app/(site)/clasificados/lib/leonixRealEstateListingContract.ts`, `app/(site)/clasificados/rentas/model/rentasPublicListing.ts` + `lib/leonixRentasShowing.ts`, `app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts` | Autos: `app/lib/clasificados/autos/autosLocationContract.ts`. Empleos: `publicar/empleos/shared/lib/empleosPublicLocation.ts` | Neither category lets the owner choose address precision. **Materially different risk profiles:** a private seller's home address (AP) is a genuine safety concern; a dealer's (ADP/ADC) and an employer's are public business addresses where exact display is desirable | **ADOPT EXISTING for AP only** (P2); **N-A in practice** for ADP/ADC/EP/EQ/EF — recommend recording those as deliberate N-A rather than open FALSEs |
| **saved search** — EP, EQ, EF | YES | **Autos** (+ bienes-raices, rentas) | `app/lib/saved-search/autos/` — all 7 modules; registry entry `app/lib/saved-search/delivery/savedSearchEmailDelivery.ts:38`; UI `AutosSaveSearchButton.tsx` → `AutosPublicResultsShell.tsx:406`; shared extracted button `app/(site)/clasificados/components/savedSearch/SavedSearchButton.tsx:5` (*"Extracted from `AutosSaveSearchButton.tsx`'s proven logic"*) | no `app/lib/saved-search/empleos/` directory exists | Job-seekers cannot save a search. The registry is explicitly designed for this — `savedSearchEmailDelivery.ts:11-12`: *"Adding a category means adding one entry here, never cloning this file."* The generic button already exists | **ADOPT EXISTING** — P2, and the highest-leverage item on this list: 5 new files + 1 registry line, against a fully proven 3-category pattern |
| **business hub** — EP, EQ, EF | YES | Autos dealer, Restaurantes, Servicios | `app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts` + `autosNegociosBusinessHubContactTypes.ts`; `RestaurantContactHub.tsx`; `ServiciosBusinessHubContactCard.tsx` | `components/premiumJob/PremiumEmployerTrustCard.tsx` | Employers get a trust card, not a hub (no hours, languages, map preview, review links, social block). Arguably correct scoping for a job post — flag for product decision | **ADOPT EXISTING** — P3, product-gated |
| **active edit** — AP | YES | Autos dealer (same file, same function) | `autosClassifiedsListingService.ts:246` `negociosActiveEditable` | `autosClassifiedsListingService.ts:249-252` — an active `privado` row returns `AUTOS_LISTING_STATUS_NOT_EDITABLE` | Deliberate today, and safe *because* the lane also has no save UI (`06_…md` §2.6). Becomes a **latent trap** the moment either half is enabled without the other | **FIX REGRESSION** — P2, but must land **together with** the §34 no-recharge guard, never before it |
| **republish same-row** — EP, EQ | **YES — and the reference is IN-CATEGORY** | **Empleos FERIA** (in-category), plus Autos (all 3 lanes) and Restaurantes | **`EmpleoFeriaApplicationClient.tsx:428`** — `const envelope = serverListingId ? { ...base, listingId: serverListingId } : base;` → the correct UPDATE branch `empleosPublicListingsDbServer.ts:218-226`. Cross-category: `autosClassifiedsListingService.ts:275-281` (contract `:262-266`); `dashboard/restaurantes/page.tsx:299-302` | `buildEmpleosPublishEnvelope.ts:250` (`listingId: null`), consumed `EmpleoPremiumPreviewClient.tsx:147` / `EmpleoQuickPreviewClient.tsx:152` — `serverListingId` is **never in scope in the preview client at all** | Feria already proves the exact pattern inside the same category and against the same upsert function. Premium/Quick differ only in that their publish call lives in the preview client, which was never given the identity | **FIX REGRESSION** (not NET NEW as `06_…md` §3 assumed — an in-category reference exists). Thread `serverListingId` through the preview handoff, mirroring `feria:428`. **P0** |
| **preview → edit loses identity** — EP, EQ, EF | YES | **Autos** | `AutosPrivadoApplication.tsx:174-186` builds the preview href carrying `edit=1&source=dashboard&listingId=…&returnPanel=autos`; `autosDealerBackToEditHrefFromPreview` (`autosDashboardInventoryAddonCheckout.ts:115-120`) round-trips the same params back | `empleosPublishRoutes.ts:22-25` (emits only `?from=publicar&lang=`); `premium:91-96`, `quick:116-121`, `feria:90-95`; back-hrefs `premium-preview:85`, `quick-preview:90`, `feria-preview:49` | Autos carries listing identity in both directions of the preview round-trip; Empleos drops it, so `serverListingId` resets to null and the next save INSERTs a duplicate | **ADOPT EXISTING** — **P1**, and it also supplies the missing producer that would finally arm the dead suppression guard (row 34) |
| **no-recharge guard** — AP, EP, **EQ** | YES | `autos_dealer_monthly` + the two existing dedicated validators; and **Autos supplies the missing URL producer** | `revenueActiveEntitlementGuard.ts:65`; `validateRentasRenewalCheckoutOwnership`; `validateOfertasLocalesCheckoutOwnership`; `activePaidEditCheckoutOwnership.ts` @`e3956df8`. For the client-side half: `AutosDealerInventoryDashboardSection.tsx:372,:375` and `dashboardInventory.ts:266` are the **only** places in the repo that emit `source=dashboard&listingId=` | `app/api/clasificados/autos/checkout/route.ts` (`autos_privado_30d`); `empleosRevenueCheckout.ts:60-68` (`empleos_job_post_paid`, **both** paid lanes); the inert guards at `EmpleoPremiumPreviewClient.tsx:52-59` / `EmpleoQuickPreviewClient.tsx:56-65` | Empleos already has correct suppression *code* with **no producer** — Autos proves the missing half. Server-side, the port closes Autos Privado completely but **not** Empleos, since a fresh id is minted before checkout (`06_…md` §4.2 caveat) | **ADOPT EXISTING** — **P0 for both Empleos paid lanes** (must pair with the identity fix), P1 for Autos Privado (currently unreachable, row 32) |
| **checkpoint** — EP, EQ, EF | YES | **Autos** (+ BR, Rentas, Restaurantes, Servicios) | `PublicarAutosBranchClient.tsx:26,:31,:40` — renders `PublishEntryCheckpointLayout`/`Stack` with no variant gate | `EmpleosPublicarHubClient.tsx:85-91`, `:177`, `:179-199` | Empleos already contains a complete checkpoint implementation, unreachable behind a dead variant | **FIX REGRESSION** — §A.2.2 |
| **hours / schedule** — EP | YES | **in-category QUICK** | `EmpleoQuickApplicationClient.tsx:413` `<EmpleosShiftScheduleEditor>` → `shared/components/EmpleosShiftScheduleEditor.tsx:9` (which itself reuses Autos' `autosDealerHoursTimeUi`) | `EmpleoPremiumApplicationClient.tsx:279-282` (free-text `scheduleLabel`) | The paid premium tier cannot emit structured schedule data that the cheaper quick tier already produces | **ADOPT EXISTING** (in-category) — P2 |
| **websites / social** — EP, EF · **SMS/WhatsApp** — EP, EF | YES | **in-category QUICK** | `EmpleoQuickApplicationClient.tsx:625-693` (9 link fields, persisted `empleosDraftFromEnvelope.ts:75-83`); `:523-524` WhatsApp, `:528-529` SMS | `premium:371` (single `websiteUrl`, no SMS); `feria:268,:328,:333` | **Inverted product ladder** — the paid tier collects strictly fewer employer links and contact channels than the cheaper one | **ADOPT EXISTING** (in-category) — P2 |
| **media / video** — EF | YES | **in-category PREMIUM + QUICK** | `shared/media/EmpleosImageGalleryEditor.tsx` (`premium:325-336`, `quick:442`); `shared/media/EmpleosVideoDraftField.tsx` (`premium:351-367`, `quick:477`) | `feria:273-288` (single flyer via `EmpleosSingleImageField:277`); envelope hardcodes the limit `buildEmpleosPublishEnvelope.ts:298-310` | Editors exist and are reusable; the **envelope contract** is what caps feria at one image and repurposes the video slot for a blob flyer | Editors = **ADOPT EXISTING**; envelope = **NET NEW**. **Plausibly deliberate product scope — flag for owner decision, not an automatic defect** |
| **languages spoken** — EP, EQ | YES | Restaurantes | `restaurantes/application/createEmptyRestauranteDraft.ts` + `buildRestaurantePublishPayload.ts` + `mapRestauranteDraftToShell.ts` | `empleosPremiumDraft.ts` / `empleosQuickDraft.ts` + both application clients | Empleos already **consumes** the field for search (`empleosResultsQuery.ts:165`) but only ever derives it, and only for feria (`staged/empleosEnvelopeToJobRecord.ts:333`), so the facet is permanently blank for premium and quick | **ADOPT EXISTING** — P2 |
| **directions / map** — EP, EF (and all Autos lanes) | YES | **in-category QUICK** | `components/quickJob/QuickJobLocationCard.tsx:18,:25,:36` | `components/premiumJob/EmpleoPremiumDetailPage.tsx`; `components/jobFair/EmpleoJobFairDetailPage.tsx`; Autos detail surfaces | Quick already ships a map embed + directions href; premium, feria and every Autos lane show address text only | **ADOPT EXISTING** — P3 |
| **CTA hub** — EP, EQ, EF | YES | **Empleos' own unused component**, plus Restaurantes / Autos | `shared/components/EmpleosCtaFieldGroup.tsx:40` — authored by Empleos, consumed only by Clases (`ClasesQuickApplication.tsx:796`) and Comunidad (`ComunidadQuickApplication.tsx:497`); richer refs `RestaurantContactHub.tsx`, `mapAutosDealerToBusinessHubContact.ts` | `premium:370-382`, `quick:520-530`, `feria:322-343` | Empleos hand-rolls three contact blocks while owning a reusable group it never uses | **ADOPT EXISTING** — P2. Also correct `ownerEntityCapabilityRegistry.ts:242` (§E.0) |
| **rich correo (b) — rich-text authoring** — all six | **NO** | — | no rich-text authoring control exists in any category on `origin/main`; the only rich renderer is display-only (`components/premiumJob/richTextLine.tsx`) | all long-text fields (`premium:387`, `:427`, quick description, `feria:324`) | Platform-wide absence, not an Autos/Empleos regression | **NET NEW** — P3, platform-level |

---

# PART F — `b60801e2` VERIFICATION

```
git merge-base --is-ancestor b60801e2 origin/main; echo $?   →  0   (IN origin/main)
git log -1 --format='%H %ad %s' --date=short b60801e2
b60801e267224ef6a90732aec2aceeea9f6e1381  2026-08-03
fix(globalization): shared preview-mode contract and Empleos checkout defect
```

`git show --stat b60801e2` — 11 files, +404/−15:

```
 .../AgenteIndividualResidencialPreviewClient.tsx   |  12 +-
 .../preview/ClasificadosServiciosPreviewClient.tsx |  10 +-
 .../components/RentasNegocioPreviewClient.tsx      |  11 +-
 .../components/RentasPrivadoPreviewClient.tsx      |   7 +-
 app/(site)/dashboard/lib/dashboardInventory.ts     |  20 +-      ← the Empleos half
 app/lib/listingIdentity/index.ts                   |  11 +
 app/lib/listingIdentity/previewModeContract.ts     |  46 +       (NEW)
 ...ate-i5-7f-full-catalog-route-contract-matrix.md | 119 +
 ...pecialized-lifecycle-reconciliation-selftest.ts |  17 +-
 scripts/gate-i9b-admin-write-safety-selftest.ts    |  13 +
 scripts/gate-p3-preview-mode-contract-selftest.ts  | 153 +       (NEW)
```

**Does the fix survive in current `origin/main`? YES — proven by reading current content, not by ancestry alone.**

1. The **new module still exists and is unchanged in intent** — `git show origin/main:app/lib/listingIdentity/previewModeContract.ts` returns all 46 lines, including the rule at `:37-42`:
   ```
   /** True for every listing-bound mode — the one rule every paid category's checkout widget must
    * obey: an already-published listing must never show new-customer checkout, confirmations, or
    * package-purchase UI, regardless of whether it's being viewed read-only or mid-edit. */
   export function previewModeSuppressesBasePlanCheckout(mode: PreviewMode): boolean {
     return mode !== "new-publish";
   }
   ```
2. **The contract is still consumed by 8 preview clients on `origin/main`**, including **both** Empleos lanes: `EmpleoPremiumPreviewClient.tsx`, `EmpleoQuickPreviewClient.tsx`, plus `BienesRaicesPrivadoPreviewClient.tsx`, `ComidaLocalPreviewClient.tsx`, `ClasificadosServiciosPreviewClient.tsx`, `RentasNegocioPreviewClient.tsx`, `RentasPrivadoPreviewClient.tsx`, `RestaurantePreviewClient.tsx`.
3. Both self-tests added by the commit are still present on `origin/main`: `scripts/gate-p3-preview-mode-contract-selftest.ts` and `scripts/gate-i9b-admin-write-safety-selftest.ts`.

**Exactly what the Empleos checkout defect fix was** (read from the diff of `app/(site)/dashboard/lib/dashboardInventory.ts`): the owner dashboard's Empleos **"Vista previa"** href used to be `empleosPreviewHrefForLane(row.lane, L)`, a helper producing `/clasificados/empleos/{quick|premium|feria}-preview?from=publicar&lang=…` — a **draft-based** route with no listing-id concept. For an already-published, already-paid job that meant (a) rendering whatever unrelated sessionStorage draft happened to be in that tab, and (b) when a draft *was* present, re-rendering the paid `PublishCheckoutCheckpoint` for a listing already paid for. Three changes: remove the `EMPLEOS_PREVIEW_ROUTES` import; delete `empleosPreviewHrefForLane`; point `previewHref` at the listing's **real public page**.

**Does the fix survive in current `origin/main`? YES — proven by quoting current content, not by ancestry alone.** `git show origin/main:"app/(site)/dashboard/lib/dashboardInventory.ts"` line 491:

```
previewHref: appendLangToPath(`/clasificados/empleos/${encodeURIComponent(row.slug)}`, L),
```

preceded by the commit's own rationale comment at `:482-490`, which still reads *"…shows the paid checkout widget again for a listing that is already published and already paid… Same safe pattern already used for Restaurantes/Bienes Raíces Privado."* Corroborating: `git grep -n -i empleo origin/main -- "app/(site)/dashboard/lib/dashboardInventory.ts"` shows **no** `EMPLEOS_PREVIEW_ROUTES` import and **no** `empleosPreviewHrefForLane` — both stayed deleted.

**Scope of what it fixed — and what it did NOT fix.** This is a **dashboard entry-point** guarantee. It is **orthogonal to, and does not remedy, the §2.9/§2.10 identity fork**: `buildEmpleosPublishEnvelope.ts:250` still hardcodes `listingId: null` on `origin/main`, so a Premium **or Quick** republish that *does* reach checkout still INSERTs a new row and starts a second $24.99 Stripe session. **`b60801e2` is intact; it was never the fix for the P0.**

**⚠ Important corollary.** A *later* hardening (Globalization Package A Gate 4 — not part of `b60801e2`) added the component-side suppression guards now at `EmpleoPremiumPreviewClient.tsx:16-19,:52-59,:193` and `EmpleoQuickPreviewClient.tsx:16-19,:56-65,:207`. Those guards are **inert** — no Empleos caller emits `preview=listing` or `source=dashboard&listingId=` (row 34). **`b60801e2`'s dashboard fix is therefore the only thing actually preventing the "checkout shown for an already-paid listing" defect today.** It must not be reverted or refactored away on the assumption that the component guard covers it.

---

# PART G — EVIDENCE GAPS

1. **No live DB query.** Every schema/RLS claim comes from migration files at `origin/main`. Whether production Supabase has all 163 migrations applied — and in particular whether any out-of-band SQL already corrected the capacity counting — was **not** verified. The Supabase MCP server is unauthenticated in this session.
2. **No runtime execution.** No app was started, no listing published, no Stripe session opened. All verdicts are code-path proofs.
3. **Empleos FERIA — largely closed, one residual gap.** Now established: it is a real persisted lane (`20260410210000_…:7-8`; publish `EmpleoFeriaApplicationClient.tsx:428-436` → `api/clasificados/empleos/listings/route.ts:60` → real row + real public slug), it **is** edit-capable (`feria:58-84`), and its publish modal uses the **correct same-row** pattern (`:428`). Residual: it does not consume the shared preview-mode contract, it forks after a preview round-trip (§A.2.4), and a **field-level** round-trip sweep of the feria draft ↔ envelope ↔ hydrator (the equivalent of `06_…md` §2.9/§2.10) was **not** performed.
3b. **Modules listed but not read:** `empleosVisibilityRules.ts`, `empleosPublicCatalogPolicy.ts`, and the `lib/staged/*` pipeline (`empleosPublishService.ts`, `empleosStagedStorage.ts`, `empleosStagedIdentity.ts`, `getEmpleosMergedBrowse.ts`). Any lane-specific visibility or staging behaviour they encode is unaudited.
3c. **`EmpleosClasificadosEngagementRow.tsx` body was not read**, so the split among save / like / share / **report** is unverified per-action. Row 24 is reported as adopted; note the registry itself marks `report: "unproven"` (`ownerEntityCapabilityRegistry.ts:240`).
3d. **Empleos public landing** (`EmpleosLandingServer.tsx` / `EmpleosLandingPageClient.tsx`) was not read line-by-line; the LANDING row in §A.2 is asserted from the route inventory plus `empleosLandingLiveMaps.ts` / `empleosLandingRoutes.ts` / `empleosPublicRankingPolicy.ts:12-17`.
3e. **The ES/EN verdict (row 18)** is scoped to `app/(site)/clasificados` and `app/(site)/publicar`. A global site-header language switcher elsewhere in the tree was not searched; if one exists, row 18 is arguably TRUE rather than PARTIAL for Empleos.
4. **`empleosPublicListingsDbServer.ts` duplication is still open** — `06_…md` §Evidence-Gaps flags that `app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts` and `app/lib/clasificados/empleos/empleosPublicListingsDbServer.ts` may both exist; only the former was read here too. Close this before acting on the §2.9 fix, since the fix touches this module's caller.
5. **Verifier scripts were not run.** ~110 `scripts/autos-*` audits and 15 `scripts/*empleos*` scripts exist on `origin/main`; none were executed. Their presence is evidence of intent, not of a passing state.
6. **Adoption matrix FALSEs are absence-of-evidence for a small number of rows.** Rows 12, 19, 21, 22 were established by repo-wide `git grep -lE` on the canonical symbol names returning zero hits inside the autos/empleos trees. A capability implemented under an unexpected identifier would read as FALSE. Rows with a positive trace (all TRUEs) are not subject to this caveat.
7. **`AutosLiveVehicleClient.tsx` line offsets** in the 190-250 range were read from a sliced view; the imports block (`:1-20`) is exact.
8. **Branch analysis** (Part C) proved content equivalence by blob hash and line count on every file of all three branches, plus targeted diffs on the divergent ones. It did **not** run a build or test suite against any branch.

---

# PART H — PRIORITISED FINDINGS

| Pri | Finding | Lane(s) | path:line | Action |
|---|---|---|---|---|
| **P0** | Republish forks a duplicate row and re-charges Stripe | **EP *and* EQ — both paid** | `buildEmpleosPublishEnvelope.ts:250` → `empleosPublicListingsDbServer.ts:227-231` → `empleosRevenueCheckout.ts:60-68`; Quick's paid status proven at `empleosPreviewPaidCheckout.ts:17,:19-43` + `EmpleoQuickPreviewClient.tsx:99,:152-158` | **FIX REGRESSION** — thread `serverListingId` into the envelope, mirroring the in-category reference `EmpleoFeriaApplicationClient.tsx:428` — **plus** port `activePaidEditCheckoutOwnership.ts`. Either alone is insufficient. (`06_…md` §2.9, and the §2.10 "free lane" correction at the top of this report) |
| **P0** | "Guardar borrador" unpublishes a live paid job | EP | `EmpleoPremiumApplicationClient.tsx:455,:467-473` → `empleosPublicListingsDbServer.ts:94,:100-102,:121` | **ADOPT EXISTING** — port the Servicios no-downgrade rule (`servicios/publish/route.ts:452-456`). (`06_…md` §2.9d) |
| **P1** | Preview → "Volver a editar" drops listing identity → next save INSERTs a duplicate | EP, EQ, **EF** | `empleosPublishRoutes.ts:22-25`; `premium:91-96`/`quick:116-121`/`feria:90-95`; back-hrefs `premium-preview:85`/`quick-preview:90`/`feria-preview:49`; consequence `feria:428` → `empleosPublicListingsDbServer.ts:227-231` | **ADOPT EXISTING** from Autos (`AutosPrivadoApplication.tsx:174-186`). Also arms the currently-dead suppression guard. §A.2.4 |
| **P1** | Dealer parent row consumes a purchased inventory slot (9/19, not 10/20) | ADP, ADC | `autosDealerInventoryPolicy.ts:48-51`; `app/api/clasificados/autos/listings/route.ts:105`; `commercialWriteGuard.ts:266`; missing migration | **FIX REGRESSION** — cherry-pick `10618f41`. (`12B_…md` §2.1) |
| **P1** | No guard against wholesale vehicle-identity substitution on an existing row | AP, ADP, ADC | `autosClassifiedsListingService.ts:236-306` (no check); `autosChildIdentityGuard.ts` **absent** from `origin/main` | **FIX REGRESSION** — cherry-pick `651abd4e`. (`12B_…md` §2.2) |
| **P1** | Child republish inherits the parent's values for ~20 unmapped fields incl. all 8 video/Mux keys | ADC | `autosPublishedToDealerApplicationDraft.ts:38-126`; `autosInventoryInheritedPreview.ts:17-30,:79-107` | **NET NEW** — iterate the module's own `childSpecific` contract instead of hand-listing. (`06_…md` §2.8) |
| **P1** | One-time paid lanes have no double-charge guard; the Empleos client-side suppression guard is dead code with no producer | AP, EP, **EQ** | `revenueActiveEntitlementGuard.ts:53,:65`; `activePaidEditCheckoutOwnership.ts` absent; inert guards `EmpleoPremiumPreviewClient.tsx:52-59` / `EmpleoQuickPreviewClient.tsx:56-65`; only producers of the required params are Autos/Comida Local (`dashboardInventory.ts:266`, `AutosDealerInventoryDashboardSection.tsx:372,:375`) | **ADOPT EXISTING** — port the server guard from `e3956df8` **and** emit the listing-bound params from the Empleos preview href. (`11_…md`, `06_…md` §4.2) |
| **P2** | `/clasificados/publicar/autos` is a live duplicate-render shadow route with no redirect and no canonical | AP, ADP | `app/(site)/clasificados/publicar/autos/page.tsx:3,:19`; zero hits for `publicar/autos` in `next.config.ts` | **ADOPT EXISTING** — copy the Empleos redirect shim (`clasificados/publicar/empleos/page.tsx:27`). §A.0.1 |
| **P2** | Empleos drafts are sessionStorage-only — a closed tab loses a half-written job post | EP, EQ, EF | `useEmpleosDraftSession.ts:24,:46`, documented `:11-13` | **ADOPT EXISTING** from Autos; owner sign-off needed since current behaviour is deliberate. §D.2.1 |
| **P2** | Empleos has no saved-search adapter set | EP, EQ, EF | no `app/lib/saved-search/empleos/`; registry `savedSearchEmailDelivery.ts:37-41` | **ADOPT EXISTING** — highest leverage per unit of work (5 files + 1 registry line). §E.1 |
| **P2** | Community trust not adopted | all six | reference `LeonixCommunityTrust.tsx` (5 consuming categories) | **ADOPT EXISTING**. §E.1 |
| **P2** | No server-side inquiry email ("rich correo") | all six | reference `contactInquiryEmail.ts` (5 consumers) | **ADOPT EXISTING**. §E.1 |
| **P2** | Location-privacy toggle missing where it matters most (private seller's own address) | AP | `autosLocationContract.ts`; reference `showExactAddress` in BR/Rentas/Restaurantes | **ADOPT EXISTING for AP**; record ADP/ADC/EP/EQ/EF as deliberate N-A. §E.1 |
| **P2** | Active-edit rejected for `privado`, while the dashboard still routes there | AP | `autosClassifiedsListingService.ts:249-252`; entry `dashboardInventory.ts:266` | **FIX REGRESSION**, but only together with the no-recharge guard. §E.1 |
| **P2** | Parent-visibility gate has no RLS equivalent | ADC | `20260409120000_autos_classifieds_listings.sql:39-42` | Defense-in-depth. Contained — no browser-side anon query exists. `12B_…md` §0 |
| **P3** | No page-level unsaved-changes prompt | AP, ADP, EP, EQ, EF | `useAutosDraftPersistEffects.ts:21-32`; no `beforeunload` in Empleos | **ADOPT EXISTING**. §D.1.1 |
| **P3** | Autos + Feria use bespoke preview-mode unions instead of the shared contract | AP, ADP, ADC, EF | `AutosPrivadoPreviewClient.tsx:36`; `AutosNegociosPreviewClient.tsx:56`; reference `previewModeContract.ts:18-46` | **ADOPT EXISTING** — consolidation only, behaviour already correct. §E.1 |
| **P2** | Shared publish-checkpoint system is dead code for all Empleos lanes | EP, EQ, EF | `EmpleosPublicarHubClient.tsx:85-91`, `:177`, `:179-199`; producer redirected away at `clasificados/publicar/empleos/page.tsx:27` | **FIX REGRESSION** — §A.2.2 |
| **P2** | Paid PREMIUM lane has no public entry point; registry still lists it live | EP | `EmpleosPublicarHubClient.tsx:105-135`, `:137-174` (quick + feria only); `categoryRouteRegistry.ts:863` | Confirm the documented product decision (`EMPLEOS_SIMPLIFICATION_QA_ALIGNMENT_AUDIT.md:72`), then restore the card **or** retire the route and fix the registry. §A.2.3 |
| **P2** | Session draft keys are lane-global, not per-listing — same-tab collisions | EP, EQ, EF | `empleosSessionKeys.ts:2-6` | **ADOPT EXISTING** from Autos namespacing. §A.2.5 |
| **P2** | Inverted product ladder — the paid Premium tier collects fewer social links, contact channels and schedule structure than the cheaper Quick tier | EP (vs EQ) | `premium:279-282,:371-381` vs `quick:413,:523-529,:625-693` | **ADOPT EXISTING** (in-category). §E.1 |
| **P2** | Feria emits `schema.org/JobPosting` for a job **fair** | EF | `empleos/[slug]/page.tsx:118` (no lane branch) → `empleosJobPostingSchema.ts:21-77` | **NET NEW** — branch on lane. §A.2.6 |
| **P3** | Owner-capability registry drift (contactHub overstated; analytics + relatedListings understated; communityTrust/externalReviews omitted) | EP, EQ, EF | `ownerEntityCapabilityRegistry.ts:238-247` | Reconcile with traced reality. §E.0 |
| **P3** | Dead `results/page.tsx` re-export loses `metadata` and `dynamic` | EP, EQ, EF | `clasificados/empleos/results/page.tsx:1`; unreachable via `next.config.ts:120-123` | Delete the file, or restore both exports. §A.2 |
| **P3** | Sept polish/hygiene commits unmerged | ADP, ADC | `b32ff613`, `b3473f89`, `db688c04` | `12B_…md` §2.3–§2.5 |
| **—** | **Three unintegrated Autos branches** | all Autos | `autos-privados-preview`, `autos-dealership-before-main-sync`, `autos-location-readiness-micro-patches` | **DISCARD ALL THREE.** Merging #1 or #2 would be a *regression*. Part C |
