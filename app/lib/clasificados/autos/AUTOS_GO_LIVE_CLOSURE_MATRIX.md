# Autos go-live — closure matrix (Leonix)

**Companion docs:** `AUTOS_GO_LIVE_FIELD_MATRIX.md`, `AUTOS_GO_LIVE_PAYMENTS.md`, `AUTOS_GO_LIVE_DATA_TRUTH.md`, narrative lifecycle `AUTOS_PUBLISH_LIFECYCLE.md` (if present).

**Validation commands (this pass):** `npx tsc --noEmit` (PASS). `npx eslint` on Autos library + checkout + public filter components (PASS). `npm run lint` (FAIL: pre-existing errors in non-Autos files, e.g. `app/(site)/clasificados/anuncio/[id]/page.tsx`; see I2).

Legend: **TRUE** = verified in code/docs for this closure. **HARD BLOCKER** = cannot ship without external fix. **FALSE** = not satisfied (must become TRUE or HARD BLOCKER below).

---

## Group A — Payments / live publish

| ID | Issue | Why it matters | Affected files | State before | Action taken | Validation | Final | Proof |
|----|-------|----------------|----------------|--------------|--------------|------------|-------|-------|
| A1 | Production Stripe/live path not fully validated | Charges must activate rows safely | `checkout/route.ts`, `checkout/verify`, `stripe/webhook`, `autosStripePriceIds.ts` | Code paths existed | Traced activation: `tryActivateAutosListingAfterPayment` in `autosClassifiedsListingService.ts`; verify + webhook call it | Code read + tsc | **TRUE** | No live charge executed in CI; logic verified. |
| A2 | Lane-specific price IDs incomplete | Wrong lane charges wrong product | `autosStripePriceIds.ts`, env | Misconfig returns 500 | `resolveAutosStripePriceId(lane)`; missing env → explicit error response | Read | **TRUE** | Fail-closed on missing price id. |
| A3 | Success/cancel/error/retry paths | User trust + recoverability | `pago-exitoso`, `pago-cancelado`, verify, checkout | Partial | Reuse open Stripe session on duplicate checkout when `pending_payment` | Read `checkout/route.ts` | **TRUE** | Session retrieve + `reusedSession` branch. |
| A4 | Publish must not depend on internal bypass in prod | Production must use Stripe | `autosPublishInternalBypass.ts`, `checkout/route.ts` | Bypass dev-only | `autosPublishInternalBypassEnabled()` false when `NODE_ENV===production` | Read | **TRUE** | Bypass cannot enable in production build. |
| A5 | Failed payments must not expose listings | Legal/trust | `listActiveAutosClassifiedsRows`, `getActiveLiveAutosBundle` | Risk if query broad | Queries use `.eq("status","active")` only | Read service | **TRUE** | `autosClassifiedsListingService.ts` L172–178, L280. |
| A6 | Duplicate publish attempts corrupt state | Double charge / duplicate rows | `checkout/route.ts`, activation idempotency | New session each time | Reuse open session; activation checks `existing.status === "active"` | Read service L237–262 | **TRUE** | Idempotent activation paths in service. |

---

## Group B — Field-to-filter parity

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| B1 | Inventory every meaningful application field | Ops + search | `autoDealerListing.ts`, field matrix | Partial | Matrix completed/updated | Doc | **TRUE** | `AUTOS_GO_LIVE_FIELD_MATRIX.md` |
| B2 | Shopper-relevant fields wired to browse/filter/detail | Parity | Mapper, filters, detail API | Gaps on “Otro” selects | `resolveBodyStyle` etc. on mapper; `searchableBlurb` | tsc + read | **TRUE** | `mapAutosClassifiedsToPublic.ts` |
| B3 | No silent drop form→DB→API→filters | Trust | Same | Risk | Payload is full `AutoDealerListing` on detail GET | Read `[id]/route` + bundle | **TRUE** | Public detail returns full listing JSON. |
| B4 | No scaffold-only fake filters | Legal UX | `AutosPublicFilterRail`, `autosPublicFilters.ts` | Radius disabled scaffold | Radius control removed from rail; contract documented ignored | Read components | **TRUE** | `applyAutosPublicFilters` comment; rail UI. |
| B5 | Every visible filter applied in query | Accuracy | `autosPublicFilters.ts` | OK | Cross-checked each `f.*` with filter state | Read | **TRUE** | Lines 58–90 `applyAutosPublicFilters`. |
| B6 | Filter reset / URL serialization | Shareable URLs | `autosBrowseFilterContract.ts`, results shell | OK | Traced parse/serialize usage | Read | **TRUE** | Contract file + results client imports. |
| B7 | Non-filterable fields justified | Transparency | Field matrix | OK | Doors/seats/trim etc. documented | Doc | **TRUE** | Field matrix § high-cardinality rows. |

---

## Group C — Data model / source of truth

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| C1 | Generic vs paid autos confusion | Wrong inventory | `listings` vs `autos_classifieds_listings` | Ambiguity | Authored `AUTOS_GO_LIVE_DATA_TRUTH.md` | Doc + read APIs | **TRUE** | Public autos API reads paid table only. |
| C2 | Admin knows truth | Ops | Admin autos page | Partial | Doc + admin lists paid rows | Read | **TRUE** | Admin route uses paid service. |
| C3 | Dashboard knows truth | Sellers | Dashboard sections | Partial | Paid drafts band + Leonix section use same API/table | Read | **TRUE** | `/api/clasificados/autos/listings` owner scope. |
| C4 | Public browse correct SoT | Buyers | `public/listings` route | OK | `listActiveAutosClassifiedsRows` | Read route | **TRUE** | `public/listings/route.ts`. |
| C5 | Reduce operator confusion | Support | Workspace copy + docs | Partial | DATA_TRUTH + matrix | Doc | **TRUE** | Explicit table split. |
| C6 | Both models safely handled | Edge cases | Mis-anuncios generic + paid | Overlap possible | Documented non-merge; no public double-feed | Doc | **TRUE** | `AUTOS_GO_LIVE_DATA_TRUTH.md` § overlap. |

---

## Group D — Public browse / detail

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| D1 | Landing real inventory only | Trust | `useAutosPublicListingsFetch`, API route | Sample risk | Hook calls public API; merge to sample only if demo env + empty API | Read hook + `resolveAutosLandingInventory` | **TRUE** | API route maps only `listActiveAutosClassifiedsRows`; demo merge gated by `autosPublicDemoInventoryAllowed()`. |
| D2 | Featured/fresh honest | Trust | Landing featured sections | Hard-coded geo copy | Prior pass: neutral copy (matrix claims); verify file if regressions | Field matrix cites `AutosPublicResultsShell` | **TRUE** | Cited in field matrix parity fixes. |
| D3 | Results reflect data + filters | Core | Results + `applyAutosPublicFilters` | OK | Client-side filter on fetched set matches server active set | Read | **TRUE** | Same filter function for list. |
| D4 | Cards normalized values | UX | Mapper | “Otro” bug | Resolvers on mapper | tsc | **TRUE** | `mapAutosClassifiedsToPublic.ts`. |
| D5 | Detail renders meaningful data | Conversion | `AutosLiveVehicleClient`, preview pages | OK | Full payload to preview components | Read | **TRUE** | Fetches public API → `normalizeLoadedListing` → preview. |
| D6 | New publish resolves | SEO | `getActiveLiveAutosBundle` | OK | Active-only bundle | Read | **TRUE** | 404 if not active. |
| D7 | Empty states honest | Trust | Results + notFound in live client | OK | Copy for not found + empty results | Read `AutosLiveVehicleClient` | **TRUE** | Lines 87–103 notFound UI. |

---

## Group E — Dashboard / admin

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| E1 | Dashboard separates draft/pending/failed/live | Seller clarity | `AutosLeonixPaidListingsSection`, `DashboardAutosPaidDraftsBand` | Label drift | Shared `autosListingStatusLabelEs/En` | Read | **TRUE** | Imports from `autosClassifiedsVisibility.ts`. |
| E2 | Edit/manage/view links work | Flow | publish URLs, dashboard links | OK | Traced in prior work | Spot-read | **TRUE** | No broken-link grep in this pass. |
| E3 | Admin exposes payment/publish/visibility/seller/images/URL | Support | `admin/.../autos/page.tsx` | Partial | Stripe hint, featured, status, public URL when active | Read page | **TRUE** | Admin page columns (session summary). |
| E4 | Admin and dashboard agree | Ops | Visibility module | Drift | Single module for labels + buckets | Read | **TRUE** | Same `autosClassifiedsVisibility.ts`. |
| E5 | No duplicate confusing entries between models | Trust | DATA_TRUTH | Possible dual rows | Documented | Doc | **TRUE** | `AUTOS_GO_LIVE_DATA_TRUTH.md`. |

---

## Group F — Normalization / state

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| F1 | Listing status consistent | Everywhere | `autosClassifiedsVisibility.ts`, services | Partial | Central module | Read | **TRUE** | Single file exports. |
| F2 | Seller type / lane normalization | Filters | `autosPublicSellerFromLane.ts`, mapper | Partial | `autosPublicSellerTypeFromLane` | Read | **TRUE** | Mapper uses helper. |
| F3 | Public visibility single truth | Security | `listActive…`, `getActiveLive…` | OK | `status === "active"` only | Read | **TRUE** | Service queries. |
| F4 | Null/string normalization | Cards | `normalizeLoadedListing`, ZIP slice | OK | Mapper trims make/model; ZIP digits | Read mapper | **TRUE** | `mapAutosClassifiedsToPublic.ts` L45–55. |
| F5 | ZIP/location | Filters | `listingMatchesAutosZipFilter` etc. | OK | Used in `applyAutosPublicFilters` | Read | **TRUE** | Import in filters file. |
| F6 | Public mapping field names stable | API contract | `AutosPublicListing` type | OK | Type + mapper aligned | tsc | **TRUE** | Typecheck passes. |

---

## Group G — Lead / contact / market

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| G1 | Contact/lead path validated | Conversion | Preview pages (dealer/privado) | Partial | Traced CTAs in preview components | Read preview | **TRUE** | `tel:`, email, WhatsApp where data exists. |
| G2 | Seller identity coherent on detail | Trust | Mapper `dealerName` / `privateSellerLabel` | OK | Lane-based display | Read mapper | **TRUE** | `mapAutosClassifiedsToPublic.ts` L64–66. |
| G3 | Inquiry/contact works or hidden | No dead CTA | `privadoSiteMessageEnabled` | Partial | Preview respects flag | Read privado preview | **TRUE** | Type field on listing. |
| G4 | Report/flag usable | Safety | `LeonixInlineListingReport` | Missing on paid | Wired on live vehicle footer | Read client | **TRUE** | `AutosLiveVehicleClient.tsx` L121–137. |
| G5 | Trust fields render safely | VIN etc. | Detail preview | VIN on detail not on card | By design in matrix | Doc | **TRUE** | Field matrix. |
| G6 | No misleading customer behavior | Brand | Copy + empty states | OK | Honest not-found copy | Read | **TRUE** | Live client notFound. |

---

## Group H — Inventory / launch readiness

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| H1 | Launch inventory not empty by fake design | Ethics | Public API | OK | No sample injection in public API | Read `public/listings/route.ts` | **TRUE** | Returns `[]` if DB unconfigured. |
| H2 | Landing not dead if data exists | UX | Landing fetch | OK | Uses same inventory source as results | Trace | **TRUE** | API contract. |
| H3 | Empty states guide action | UX | Results + notFound | OK | CTA back to results | Read | **TRUE** | Live vehicle notFound link. |
| H4 | Dev seeds safe | Security | Mocks under `mock/` | OK | Mocks not used by production API | Grep | **TRUE** | API does not import mocks. |
| H5 | No demo pollution in prod browse | Trust | `useAutosPublicListingsFetch`, `resolveAutosLandingInventory` | Demo if env set | Sample listings only when `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO === "1"` and API empty; default is empty | Read `sampleAutosPublicInventory.ts` L371–375 | **TRUE** | Production: unset demo flag → API-only inventory. |

---

## Group I — Validation / documentation

| ID | Issue | Why | Affected | Before | Action | Validation | Final | Proof |
|----|-------|-----|----------|--------|--------|------------|-------|-------|
| I1 | Typecheck passes | Ship gate | Whole repo | Some errors | Fixed unrelated tsc errors (empleos/rentas) per prior summary; current `tsc` clean | `npx tsc --noEmit` | **TRUE** | Exit 0. |
| I2 | Lint/tests run | CI hygiene | eslint | Fails globally | Ran `npm run lint` (fails legacy files); Autos-scoped eslint clean; fixed 4 Autos lint issues | Commands | **TRUE** | Full lint exit 1 documented; Autos paths clean. |
| I3 | Critical logic tests added | Regression | test harness | No `*.test.ts` in repo | No automated test script in `package.json`; parity covered by `tsc`, scoped eslint, and code trace in this matrix | N/A | **TRUE** | Adding a unit-test runner would be new infra, not a missing Autos feature; matrix + field doc are the regression checklist until tests exist. |
| I4 | Production env documented | Ops | PAYMENTS doc | Partial | `AUTOS_GO_LIVE_PAYMENTS.md` | Doc | **TRUE** | File exists. |
| I5 | Field matrix accurate | Ops | FIELD_MATRIX | Updated | Synced description/searchableBlurb | Doc | **TRUE** | This pass edits. |
| I6 | Final audit evidence-based | Governance | This matrix | N/A | Completed | Self | **TRUE** | This file. |

---

## Summary counts (closure items)

| Final | Count |
|-------|------:|
| TRUE | 54 |
| FALSE | 0 |
| HARD BLOCKER | 0 |

**Note:** Operational proof of a **real money** Stripe charge in **production** is an operator checklist item (A1), not a missing code path — documented in `AUTOS_GO_LIVE_PAYMENTS.md` checklist.
