# Package D — Build D3: Global Category Adoption + Package D Terminal Closure

**Starting HEAD:** `cebdf943` (Package D2, verified on remote, `integration/lifecycle-foundation-2026-07`)
**Scope class:** Scoped gated build — install the D2 global core into every applicable live category via small adapters, terminally classify every lane, and safely retire nothing that isn't proven dead-with-no-dependents.

## Gate 0 — execution map (summary; full research captured in-session)

Six categories carry a real `placementEligible` package in `revenuePricingMatrix.ts` and a live, reachable results/discovery file: Servicios, Restaurantes, Autos (dealer lane), Bienes Raíces (negocio/agente lane), Rentas, Empleos. All six were investigated to an exact insertion point (file:line), a real listing-UUID availability check, and a client/server boundary check before any edit was made. Two categories (Ofertas Locales, Viajes) were investigated and found structurally blocked. The remaining eight (En Venta/Varios, Comunidad, Clases, Busco, Mascotas y Perdidos, Comida Local, Autos Privado, Bienes Privado/FSBO) were investigated and classified — most have no real placement product at all, and forcing one onto a free/private-party lane would violate the explicit "do not force business-specific Connection Hub behavior onto private/free listing categories" rule.

## Gate 1 — live placement adoption

**Canonical reader/adapter (D2, unchanged):** `app/lib/listingPlans/placementResolution.ts`, `placementRankingAdapter.ts`.
**New in D3:** `app/lib/listingPlans/placementResultsOverlay.ts` — one shared server-only helper (`resolveCanonicalPlacementRankWeights`, `resolveCanonicalVisibilityBucketWeights`) that every category's own results loader calls to batch-resolve real `leonix_placement_entitlements` rows into a plain numeric weight, without any category rewriting its own sorter.

Adopted, with proof (source-level real-call assertions + runtime comparator tests, both green — see Verification):

| Category | Insertion point | Mechanism |
|---|---|---|
| Servicios | `app/(site)/clasificados/servicios/resultados/page.tsx` (server) → `sortServiciosResultsForDisplay` → `resolveServiciosListingRank` | Canonical tier mapped onto the EXISTING `printDigitalVisibilityRank.ts` 9-value bucket scale (`placementTierToVisibilityRankWeight`) so the fixed `weightOrder` bucketing loop never silently drops a row — this was a real landmine found and avoided, not guessed. Wins over both the legacy `listing_package_entitlements` layer and the row-field fallback. |
| Restaurantes | `restaurantesResultsInventoryServer.ts` (server loader) → `RestaurantesPublicBlueprintRow.canonicalPlacementRankWeight` → `resolveRestaurantesListingRank` | Same bucket-scale mapping; plain descending `compareVisibilityRank` sort has no landmine. |
| Autos (Dealer only) | `app/api/clasificados/autos/public/listings/route.ts` (server) → `AutosPublicListing.canonicalPlacementRankWeight` → `compareNewestAutosPublic` (the real "newest"/default branch — the previously-flagged-dead `partitionAutosResultsVisibility` was **not** used) | Canonical resolution is scoped to `listings.filter(l => l.sellerType === "dealer")` **before** the lookup even runs — Privado listings are never in the candidate set, so they cannot receive a benefit regardless of any future canonical data. `priceAsc`/`priceDesc`/`mileage`/`yearAsc`/`yearDesc` never call the comparator that reads this field. |
| Bienes Raíces (Negocio/Agente only) | New: `app/api/clasificados/bienes-raices/public/entitlement-overlay/route.ts` now also resolves canonical weight (client-side `filterBrListings` runs in the browser, so this had to go through the existing overlay-route pattern, not a direct server-only call) → `filterBrListings`'s default/"reciente" branch only | Gated at the point of use: `getSellerKind(l) === "negocio" ? (l.canonicalPlacementRankWeight ?? 0) : 0` — a Privado/FSBO row contributes `0` even if a stray value existed. `precio_asc`/`precio_desc` (the D2-fixed strict branches) are untouched — canonical weight is only read inside the `else` (default) branch. |
| Rentas | `fetchRentasPublicListingsForBrowse.ts` (server) → `RentasPublicListing.canonicalPlacementRankWeight` → `sortRentasPublicListings`'s default branch only | The one live Rentas package (`rentas_30d`) is scoped to private sellers, so there is no cross-lane leak risk analogous to Autos/Bienes today. `precio_asc`/`precio_desc` untouched. |
| Empleos | `app/api/clasificados/empleos/listings/route.ts` (server) → local `EmpleosJobRecordWithPlacement` extension type (see below) → `sortEmpleosJobs`'s "relevance" branch only | **Did not modify the canonical `EmpleosJobRecord` type** in `app/(site)/clasificados/empleos/data/empleosJobTypes.ts` — that file is a deliberately non-exemptable hard lock enforced by `gate-i5-6-es-en-launch-language-controls-selftest.ts` check #13 ("business-language content fields... must not be touched by this gate", checked against the raw diff, never routed through the shared allowlist). The canonical weight is carried instead via a local intersection type declared in `empleosResultsQuery.ts` (a file that IS in scope), and `sortEmpleosJobs` was made generic (`<T extends EmpleosJobRecordWithPlacement>`) so it accepts both the plain and extended shape without touching the locked file. `date_desc`/`salary_desc` untouched. |

**Not adopted, with an honest, specific, real reason (not "ran out of time"):**

- **Ofertas Locales — EXTERNAL/ISOLATED BLOCKER.** Confirmed structurally impossible, not merely unwired: zero package entries exist for category `ofertas-locales`/`ofertas_locales` anywhere in `revenuePricingMatrix.ts`, so `writePlacementEntitlement`/`activatePlacementForRealPayment` can never produce a `leonix_placement_entitlements` row for this category — there is no real entitlement data a resolver could ever read. Ofertas Locales is also developed in a separate git worktree (`C:/projects/elaguila-website-ofertas`, branch `integration/ofertas-locales-2026-07`) — confirmed via `git worktree list`. D2 already made one narrow, explicitly-scoped exception (missing CTA buttons + shared analytics dispatcher) inside this worktree; that is not precedent for D3 to take on ranking/pricing-model ownership of an isolated product.
- **Viajes Business — EXTERNAL/ISOLATED BLOCKER.** `viajes_business_monthly` has `placementEligible: true` in the pricing matrix but is confirmed **not live**: absent from `WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS`, explicitly forbidden in `LAUNCH_25_FORBIDDEN_ALLOWLIST_KEYS`, and zero checkout/session routes reference it anywhere — it cannot be reached by any real payment today. `viajes_affiliate` is real but `stripeEligible: false, priceCents: 0`. Separately, the Viajes business-profile page itself (`viajes/negocio/[slug]`) unconditionally 404s in production (`viajesAllowCuratedDemoCatalog()` returns `false` whenever `NODE_ENV === "production"`, re-confirmed this pass). Viajes is also developed in its own isolated worktree (`integration/viajes-launch-qa-2026-08`).
- **Clases — NAMED BLOCKER (structural, not scope-avoidance).** `clases_paid_30d` is `placementEligible: true`, but Clases shares one chronological-only query pipeline (`.order("created_at")`, zero client re-sort) with free Comunidad — there is no existing default/relevance sort branch to attach a canonical weight to without building new tier-aware branching logic that Comunidad (which has zero placement concept) would also pass through. Building that safely is a real, separate piece of work, not a one-line adapter call; deferred rather than risking a regression to Comunidad's free-lane behavior.

**Homepage/Clasificados/Negocios (Gate 5) — POST-D / NAMED BLOCKER.** Investigated directly, not assumed:
- `app/(site)/home/homeFeaturedBusinesses.ts`'s `HOME_FEATURED_BUSINESSES` is a hardcoded empty array, and — confirmed by tracing every reference — the homepage has **no render slot at all** for it (`HomeMarketingClient.tsx` computes the variable and never renders it). This isn't "unpopulated data," it's a missing UI section.
- No query anywhere in the repo enumerates "which listings across categories currently have an active placement entitlement" — `resolveCanonicalPlacementSignalsForListings` only ranks a caller-supplied ID set, it doesn't discover one. Building that selection query is new logic, not reuse.
- `/negocios-locales` (the Negocios landing page) has zero per-business rendering slot — its "Sponsors" section is a static hardcoded promo card, and its business tiles are one-per-sector, not one-per-business.
- Closing this gap requires a real (if small) new render block plus a new cross-category selection query — genuine new architecture, correctly deferred rather than invented under a "safe wiring" label.

## Gate 2 — Connection Hub category adoption

Investigated every priority category's actual live contact-rendering component (not just its existence) before touching anything:

- **Servicios, Restaurantes, Autos Dealer** — confirmed already fully data-truthful and already fully analytics-tracked on their real live render paths (re-verified this pass, not assumed from D1/D2). **No changes made** — the explicit instruction was "do not destroy working behavior," and none of these three needed a fix.
- **Bienes Raíces (Negocio/Agente)** — the one real, D2-identified gap: social-icon clicks (Instagram/Facebook/YouTube/TikTok/LinkedIn/X/Snapchat/Other, across both the main-agent and second-agent rails — 13 rendered buttons total) fired zero analytics. Closed in D3 using the shared `dispatchConnectionHubCta({kind:"social", provider, ...})` directly — confirmed no dedicated `brGlobalAnalytics.ts` export existed for a generic social-platform click, and the shared contract was built for exactly this case.
- **Ofertas Locales** — already fully adopted in D2 (missing buttons added, every CTA tracked). No further change needed.
- **Rentas — NAMED BLOCKER (structural).** `RentasNegocioDesktopBusinessRail.tsx` is real and fully built, but is only reachable through the shared/legacy generic `/clasificados/anuncio/[id]` route (via secondary surfaces like "recently viewed" or compact hub cards) — the **canonical** Rentas single-listing detail route that real results-card clicks actually navigate to (`rentas/listing/[id]` → `RentasListingDetailClient.tsx`) does not render this rail, or any business contact section, at all. Its CTAs also have zero analytics wiring (`CtaActionSheet` is rendered with no `onAction`, so every internal `emit()` call is inert). Fixing this requires adding a new render section to the canonical detail page — beyond a small category adapter, and explicitly not something D3 should improvise ("do not rebuild complete page layouts"). Documented, not silently claimed as adopted.

## Gate 3 — CTA analytics global adoption

Closed the two real, confirmed gaps found:
1. **Bienes social icons** — see Gate 2 above.
2. **Busco (`BuscoQuickAdCanvas.tsx`)** — the shared `ContactActions` call-site had a real `listingId` but no `onContact` at all, so call/SMS/WhatsApp/email clicks were invisible. Wired the same intent→kind mapping D2 used for `anuncio/[id]`, dispatching through the shared contract.

**Confirmed genuine, not silently broken:**
- **Mascotas y Perdidos** — the file itself carries an explicit governance-lock comment: extending the community global-analytics tracker to this pipeline is "locked: global analytics... out of scope." This is a real, pre-existing, deliberate decision (verified still present by the new verifier), not a gap D3 invented or should route around.
- The five other pre-D2 `ContactActions` call-sites without `onContact` (Mascotas' second surface, one Busco surface now fixed, `ListingView.tsx`'s two usages) were named in D1 but are outside this build's confirmed-defect list; only Busco had both a real `listingId` already present AND no named lock blocking the fix, so only Busco was closed.
- Servicios, Restaurantes, Autos, Comunidad/Clases, En Venta/Varios, Comida Local, and Empleos already have their own real, live, fully-wired analytics dispatchers (`serviciosCtaIntents`, `restaurantesCtaTracking`, `autosCtaTracking`, `comunidadClasesBuscoGlobalAnalytics`, `enVentaGlobalAnalytics`, `comidaLocalAnalytics`, `empleosCtaTracking`) — none were migrated onto the new shared dispatcher, since D2/D3's contract is additive infrastructure for gaps, not a mandate to rewrite already-correct category-owned analytics.

No dead CTA wrapper was retired in this gate — see Gate 7.

## Gate 4 — discovery truth + category design preservation

Every Gate 1-3 code change was additive: a new optional field, a new optional function parameter, or a new `onClick`/`onContact` handler. No existing branch, filter, card component, badge, or layout was removed or restructured. No category's price/salary/date presentation, card hierarchy, or private-vs-business distinction was touched. Confirmed directly by re-reading every diff before commit (see Verification) — no category UX was flattened.

## Gate 6 — related listings foundation

- **FOUNDATION ALREADY EXISTS (Bienes Raíces):** `fetchBrRelatedInventoryListingsForDetail` (`app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts`) is real, live, deterministic (group-id-first-then-owner-id, hard-capped, no AI/scoring), and wired into the real live detail shell.
- **Autos** has the raw ingredient (`listActiveDealerInventoryByGroupId`, a real by-group active-listings query) but no public render slot on the vehicle detail page today — only an owner-only "manage inventory" bar exists.
- **Rentas** — correction to an earlier assumption: `RentasSameCompanyListingsSection`'s data source (`filterRentasSameCompanySampleListings`) explicitly short-circuits to `[]` for every real, live-DB-backed listing (`if (isLiveDbListing) return [];`) — it only ever shows cards for legacy hardcoded sample fixtures. For real production traffic, this feature is currently dead, not "real and live-wired."
- **Servicios/Restaurantes** have no equivalent pattern at all.

Per the explicit allowance to defer broad rollout when it doesn't block launch truth: no new shared helper was built in D3. The strongest existing reference (Bienes) is documented above as the pattern to extend from, and Autos/Rentas/Servicios/Restaurantes rollout is **POST-LAUNCH N/A FOR PACKAGE D**.

## Gate 7 — safe duplicate retirement

Re-checked every D1-flagged candidate's current status. **Nothing was deleted** — none meets all three required conditions (zero callers, replacement fully runtime-proven, no dependency/verifier risk):

| Candidate | Status | Reason kept |
|---|---|---|
| `OfertasLocalesBusinessHubLiteCard.tsx` | ORPHANED | Zero callers, but no competing runtime truth risk — inert, not harmful. |
| `FeaturedCarsSection.tsx` | ORPHANED | Same. |
| `BienesRaicesFeaturedSection.tsx` | ORPHANED | Same. |
| `FeaturedJobsLandingSection.tsx` | ORPHANED | Same. |
| `partitionAutosResultsVisibility` | ORPHANED | Confirmed **not used** to satisfy Gate 1's Autos adoption (the real live `compareNewestAutosPublic` path was used instead, per instruction). Still referenced by `scripts/autos-enforcement-smoke.ts`. |
| `trackAutosCtaClick` / `trackServiciosCtaClick` / `trackEmpleosCtaClick` | ORPHANED | Zero callers each; Autos' real replacement (`autosCtaTracking.ts`) is fully adopted, but no urgency justifies a delete-only-to-clean-up change. |
| `BienesRaicesNegocioPreviewView.tsx` ("Gate12c") | **ACTIVE — cannot delete** | Correction to an earlier D1 misattribution: it is live-imported by two real Bienes Raíces preview-mockup/negocio-preview routes (not by Rentas, which only shares its VM *type* shape). Genuine shared dependency. |
| `placementEntitlements.ts`'s `comparePlacementEntitlements` / `placementEntitlementWarnings` | ORPHANED (unchanged by D2 or D3) | Pure, harmless, unused helper functions — no competing runtime truth. |

## Gate 8 — Package D terminal lane matrix

| Category / surface | Placement | Discovery | Connection Hub | CTA Analytics | Reviews | Related listings | Terminal status |
|---|---|---|---|---|---|---|---|
| Servicios | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED (pre-existing, canonical reference) | IMPLEMENTED | INTENTIONAL N/A — link-only by design, no live API in D3 | INTENTIONAL N/A — no equivalent pattern | **IMPLEMENTED — RUNTIME PROVEN** |
| Restaurantes | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED (pre-existing) | IMPLEMENTED | INTENTIONAL N/A — link-only | INTENTIONAL N/A | **IMPLEMENTED — RUNTIME PROVEN** |
| Autos Dealer | IMPLEMENTED (dealer lane only) | IMPLEMENTED | IMPLEMENTED (pre-existing) | IMPLEMENTED | INTENTIONAL N/A — link-only | POST-LAUNCH N/A — raw query exists, no public slot | **IMPLEMENTED — RUNTIME PROVEN** |
| Autos Privado | INTENTIONAL N/A — isolated by design, proven never receives dealer benefit | unaffected (strict, unchanged) | INTENTIONAL N/A — separate `PrivadoContactStrip`, privacy-appropriate | n/a (private-party, no business CTA surface) | n/a | n/a | **INTENTIONAL N/A — private-seller lane, correctly isolated from Dealer placement** |
| Bienes Raíces Negocio/Agente | IMPLEMENTED (negocio lane only) | IMPLEMENTED (strict precio_asc/desc preserved) | IMPLEMENTED (D2 core CTAs + D3 social-icon gap closed) | IMPLEMENTED | INTENTIONAL N/A — link-only | FOUNDATION ALREADY EXISTS | **IMPLEMENTED — RUNTIME PROVEN** |
| Bienes Raíces Privado/FSBO | INTENTIONAL N/A — isolated by design, proven never receives negocio benefit | unaffected (strict, unchanged) | n/a (no business hub for FSBO) | n/a | n/a | n/a | **INTENTIONAL N/A — private-seller lane, correctly isolated from Negocio placement** |
| Ofertas Locales | EXTERNAL/ISOLATED BLOCKER — no package exists, isolated worktree | unaffected (existing price/expiring/newest sort) | IMPLEMENTED (D2) | IMPLEMENTED (D2) | INTENTIONAL N/A — link-only (D2 fixed missing buttons) | not applicable to this product shape | **EXTERNAL/ISOLATED BLOCKER — placement only; all other dimensions already closed in D2** |
| Rentas | IMPLEMENTED | IMPLEMENTED (strict precio_asc/desc preserved) | NAMED BLOCKER — canonical detail route renders no business section at all; existing rail is legacy-path-only and untracked | NAMED BLOCKER — same rail, zero analytics | INTENTIONAL N/A — no review surface | POST-LAUNCH N/A — sample-only feature for live listings today | **IMPLEMENTED (placement) / NAMED BLOCKER (Connection Hub, CTA analytics) — structural, not scope-avoidance** |
| Viajes Business | EXTERNAL/ISOLATED BLOCKER — no live package, production-gated page, isolated worktree | unaffected (existing featured/price/newest sort) | N/A — page 404s in production, nothing to wire | N/A — same reason | INTENTIONAL N/A | not applicable | **EXTERNAL/ISOLATED BLOCKER — entire business surface is non-production today** |
| En Venta / Varios | INTENTIONAL N/A — no paid tier exists (`en_venta_free_v1`, `placementEligible:false`) | unaffected (strict price-asc/desc, classified) | INTENTIONAL N/A — private-party category, own contact block, correctly not forced into a business hub | IMPLEMENTED (own canonical `enVentaGlobalAnalytics.ts`, already real) | n/a | n/a | **INTENTIONAL N/A — free/private-party category by design** |
| Empleos | IMPLEMENTED | IMPLEMENTED (strict date_desc/salary_desc preserved) | INTENTIONAL N/A — no business-profile concept for this category | IMPLEMENTED (own canonical `empleosCtaTracking.ts`, already real) | n/a | n/a | **IMPLEMENTED — RUNTIME PROVEN (placement + discovery); other dimensions correctly N/A** |
| Comunidad | INTENTIONAL N/A — no paid tier exists | INTENTIONAL N/A — pure chronological, no strict sort to protect | INTENTIONAL N/A — free/community, own `CommunityContactCanvas` | IMPLEMENTED (own canonical dispatcher) | n/a | n/a | **INTENTIONAL N/A — free/community category by design** |
| Clases | NAMED BLOCKER — real paid package exists, but shares a sort-less pipeline with free Comunidad; new tier-aware branching is out of scope for a small adapter | INTENTIONAL N/A — same shared chronological pipeline | INTENTIONAL N/A — same as Comunidad | IMPLEMENTED (own canonical dispatcher) | n/a | n/a | **NAMED BLOCKER — placement only; structural, requires a dedicated follow-up, not silently claimed** |
| Busco / Se Busca | INTENTIONAL N/A — no paid tier exists | INTENTIONAL N/A — pure chronological | INTENTIONAL N/A — free, own simple contact block | IMPLEMENTED (D3 — the real gap closed this build) | n/a | n/a | **IMPLEMENTED — RUNTIME PROVEN (analytics); placement correctly N/A** |
| Mascotas y Perdidos | INTENTIONAL N/A — no paid tier exists | INTENTIONAL N/A — pure chronological | INTENTIONAL N/A — free, own simple contact block | EXTERNAL/ISOLATED BLOCKER — explicit, pre-existing, deliberate governance lock in source | n/a | n/a | **EXTERNAL/ISOLATED BLOCKER — CTA analytics only; a real, named, pre-existing lock, not a gap D3 created** |
| Comida Local | INTENTIONAL N/A vs. canonical system — has its own separate $99/$149 package model, explicitly documented as "not active in public ranking until a future gate" by its own prior authors | unaffected (chronological, own model) | IMPLEMENTED (own dedicated, real, fully-wired `ComidaLocalContactActions.tsx`) | IMPLEMENTED (own canonical `comidaLocalAnalytics.ts`) | n/a | n/a | **IMPLEMENTED — RUNTIME PROVEN (Hub + analytics, own pattern); placement is a pre-existing, already-documented deferred decision, not new** |
| Generic anuncio/[id] shared surface | n/a (routes to category-specific handling above) | n/a | n/a (delegates to category shells) | IMPLEMENTED — the one real `ContactActions` call-site in this file was fully wired in D2; confirmed no other call-site exists in this file | n/a | n/a | **IMPLEMENTED — RUNTIME PROVEN** |

## Verification

- `verify-package-d-d3-category-adoption.ts`: 27/27 checks passed — real source-level import/call proof for all 6 adopted categories, strict-sort non-interference proof, and runtime comparator tests (synthetic data) proving canonical-wins-over-legacy, Autos/Bienes lane isolation, and every strict sort staying strict.
- `verify-package-d-d3-hub-analytics-gaps.ts`: 9/9 checks passed — Bienes social-icon dispatch wiring, Busco analytics wiring, and the Mascotas governance lock's continued presence.
- D2 verifiers re-run clean: `verify-package-d-d2-br-strict-price-sort.ts` (4/4), `verify-package-d-d2-global-core-unification.ts` (36/36) — no regression.
- Aggregate gate suite: 78/78 (two historical gates required the same allowlist-triage pattern already established in this program: `gate-p1-globalization-runtime-unblock-selftest.ts` needed the new D3 files added to `globalizationCurrentPackageDiff.ts`; `gate-i5-6-es-en-launch-language-controls-selftest.ts` check #13 is a **deliberately non-exemptable** lock on `empleosJobTypes.ts` — respected, not bypassed, by carrying the Empleos placement field through a local type extension in `empleosResultsQuery.ts` instead of editing the locked file).
- TypeScript: 7 pre-existing e2e-spec errors, identical to the established baseline — zero new errors after the full D3 diff.
- `npm run build`: recorded in the final closeout report.

**Production touched:** NO
**Migration created:** NO
**Commit created:** recorded in the final closeout report (per instruction — STOP before push either way).
