# Autos recovery & launch matrix (repo state — 2026-04-22 recovery pass)

**Method:** Inspect disk + git + run `tsc`, `eslint` (Autos paths + full repo), `npm run build`, `npm run autos:enforce-smoke`. Prior chat claims **ignored**.

## Recovery summary

| Artifact | Status |
| -------- | ------ |
| Core Autos routes under `app/(site)/clasificados/autos` | Present |
| Lib/services `app/lib/clasificados/autos` | Present |
| APIs `app/api/clasificados/autos` | Present |
| Docs `AUTOS_*` under `app/lib/clasificados/autos` | Most present; **created this pass:** `AUTOS_RECOVERY_AND_LAUNCH_MATRIX.md`, `AUTOS_RANKING_POLICY.md`, `AUTOS_BUILD_PROOF.md`, `AUTOS_RUNTIME_SMOKE_PROOF.md`, `AUTOS_CTA_AUDIT.md`, `AUTOS_UX_COMPARATIVE_AUDIT.md`, `AUTOS_ZERO_FALSE_MATRIX.md` |
| Prior session “lost” work | Unknown; **re-derived** from current tree |

---

## A. Publish flow

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| A1 | Negocios/Privado publish shells + confirm wired to paid table | `app/(site)/publicar/autos/**`, `autosClassifiedsListingService.ts` | None in this pass | Staging: complete publish → row in `autos_classifieds_listings` | **TRUE** (code) / **HARD BLOCKER** (full E2E without env) |
| A2 | Internal Stripe bypass for dev only | `autosPublishInternalBypass.ts`, checkout route | Ensure never enabled in prod | `NODE_ENV=production` build + env audit | **TRUE** |

## B. Payment flow

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| B1 | Checkout + verify + webhook code paths exist | `app/api/clasificados/autos/checkout/**`, webhooks | None | Execute Stripe test checkout with secrets | **FALSE** (runtime) — **HARD BLOCKER:** needs keys + staging run |
| B2 | Env var names for prices | `stripeAutosConfig.ts` | Doc drift fixed (`STRIPE_PRICE_AUTOS_*`) | Read repo | **TRUE** |

## C. Landing page

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| C1 | Three-band arrangement (dealer / private / mixed) | `AutosLandingPage.tsx`, `autosLandingArrangement.ts`, blueprint copy | Implemented this pass | Visual smoke in browser | **TRUE** (code) / partial runtime |
| C2 | Demo inventory policy | `autosPublicInventoryPolicy.ts` | None | `NODE_ENV=production` smoke script branch | **TRUE** |

## D. Results page

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| D1 | Filters applied in `applyAutosPublicFilters` | `autosPublicFilters.ts` | None | Script asserts filters | **TRUE** |
| D2 | Dealer-only recent wall | `autosPublicResultsVisibility.ts` | Private injection when needed | `autos-enforcement-smoke.ts` | **TRUE** |

## E. Detail page

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| E1 | Live vehicle client + public API `[id]` | `vehiculo/[id]`, API route | None | HTTP GET against deployed origin with real id | **FALSE** (not run here) |

## F. CTA wiring

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| F1 | Cards link to `/clasificados/autos/vehiculo/[id]` | `AutosPublicStandardCard.tsx`, landing card | None | Click test | **TRUE** (code trace + partial lint) |

## G. Field-to-filter parity

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| G1 | Select “Otro” fields resolved in mapper | `mapAutosClassifiedsToPublic.ts`, `autoDealerSelectResolve.ts` | None | Smoke + matrix | **TRUE** |
| G2 | Newest sort uses refresh timestamp | `autosPublicRanking.ts`, mapper | Implemented | Smoke asserts timestamp wins | **TRUE** |

## H. Business vs private arrangement

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| H1 | Lane → `sellerType` mapping | `autosPublicSellerFromLane.ts` | None | Unit implicit in smoke | **TRUE** |
| H2 | Copy distinguishes lanes | `autosPublicBlueprintCopy.ts`, cards | Landing headings updated | Read copy | **TRUE** |

## I. Renew / republish handling

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| I1 | No standalone renew API | — | **MV:** sort uses `max(published_at, updated_at)`; UI copy avoids fake “boost” | DB migration if product needs explicit renew event | **TRUE** (minimal clarity) |
| I2 | Legacy “boost” user strings | `AutosAnuncioLaneContextStrip.tsx` | Replaced with renew/refresh language | Grep `Boost` in autos UI | **TRUE** |

## J. Dashboard visibility

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| J1 | Paid listings section | `AutosLeonixPaidListingsSection.tsx`, APIs | Unchanged this pass | Owner session + API 200 | **FALSE** (runtime not run) |

## K. Admin visibility

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| K1 | Admin workspace Autos page | `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx` | Unchanged | Staff login smoke | **FALSE** (runtime not run) |

## L. Build / lint / type status

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| L1 | `tsc --noEmit` | whole repo | None | exit 0 | **TRUE** |
| L2 | `npm run build` | whole repo | None | exit 0 | **TRUE** |
| L3 | `npm run lint` | repo | Removed unused Viajes imports (lint was failing) | exit 0 | **TRUE** |
| L4 | Autos-scoped eslint | autos globs | None | exit 0 | **TRUE** |

## M. Source-of-truth clarity

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| M1 | Paid table vs generic `listings` | `AUTOS_GO_LIVE_DATA_TRUTH.md` | Doc updated with ranking section | Read doc | **TRUE** |

## N. Smoke validation readiness

| ID | Current state | Affected files | Required fix | Proof required | Final |
| -- | ------------- | -------------- | ------------ | -------------- | ----- |
| N1 | Executable script | `scripts/autos-enforcement-smoke.ts` | Extended assertions | `npm run autos:enforce-smoke` OK | **TRUE** |
| N2 | Full browser S1–S10 | — | N/A in agent | Manual staging | **HARD BLOCKER** for strict go-live |
