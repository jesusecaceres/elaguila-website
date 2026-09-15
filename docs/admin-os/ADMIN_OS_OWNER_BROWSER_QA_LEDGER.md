# Admin OS — Owner Browser QA Ledger

Worktree: `C:\projects\elaguila-website-admin-live-qa`
Branch: `integration/admin-os-live-qa-repair-2026-09`
QA driver: Chuy (owner), account `chuy@leonixmedia.com`
QA engineer: Claude (this session)

This ledger is the authoritative record of live owner browser QA. A workflow is
only PASS when Chuy has personally confirmed it in the browser — source
inspection alone never satisfies PASS here.

---

## OWNER-QA-001

- **DATE**: 2026-09-14
- **ROUTE**: `/admin`
- **WORKFLOW**: Team login + Admin shell
- **OWNER_ACTION**: Logged in through the normal team-account login form using `chuy@leonixmedia.com` (NOT the legacy owner/bootstrap login)
- **EXPECTED**: Authenticated owner/global-admin enters Admin OS through standard team auth and sees a complete, correctly rendered shell
- **OBSERVED**:
  - Login succeeded
  - Admin shell loaded
  - Role shown: Global admin
  - Sidebar rendered correctly
  - Topbar/header rendered correctly
  - "Help with this page" control visible
  - No blank/error state
  - Session footer displays the text "Signed in via cookie"
- **STATUS**: PASS
- **FINDING_ID**: AUTH-UX-001 (see below)
- **ROOT_CAUSE**: n/a (not a failure)
- **FIX**: none applied yet — deferred, see AUTH-UX-001
- **VALIDATION**: n/a
- **RETEST**: n/a
- **REMAINING_RISK**: none for authentication itself; see AUTH-UX-001 for the wording issue

---

## OWNER-QA-002

- **DATE**: 2026-09-14
- **ROUTE**: `/admin`
- **WORKFLOW**: Command Center — Needs review count + segmented breakdown truth
- **OWNER_ACTION**: Visually inspected "Review / Pending Ads", "Needs review", and the Today's Attention breakdown without clicking anything
- **EXPECTED**: "Review / Pending Ads" = 25, "Needs review" = 25, breakdown (Classifieds 7, Empleos 0, Viajes 8, Servicios 0, Ofertas Locales 10) sums to 25
- **OBSERVED**: All values matched exactly as expected; 7+0+8+0+10 = 25 confirmed by owner
- **STATUS**: PASS
- **FINDING_ID**: none
- **ROOT_CAUSE**: n/a
- **FIX**: none
- **VALIDATION**: n/a
- **RETEST**: n/a
- **REMAINING_RISK**: none — count truth confirmed at the display level; destination-consistency (does the review workspace itself show the same universe) still pending in STEP 2B

---

## OWNER-QA-003

- **DATE**: 2026-09-14
- **ROUTE**: `/admin` → clicked primary "Review ads" CTA on the "Review / Pending Ads" priority tile (value 25)
- **WORKFLOW**: Command Center → Review workspace navigation (QA STEP 2B)
- **OWNER_ACTION**: Clicked the primary Review ads/listings CTA tied to the 25-count card
- **EXPECTED**: Destination workspace represents (or truthfully reconciles) the same 25-item cross-category review universe shown on the Command Center
- **OBSERVED**: Navigated to `http://localhost:3000/admin/workspace/clasificados?status=flagged#queue`, a real, working page, but one that only shows the Classifieds-flagged subset: 4 listings (pending 0 / flagged 4 / removed 0) — not the 25-item universe the CTA was attached to
- **STATUS**: FAIL → FIXED (pending owner retest)
- **FINDING_ID**: CMD-REVIEW-CTA-001 (new; related to originally-audited CMD-001/CMD-003 count-truth gates, but this is a destination-truth gap, not a count-truth gap — the count itself was already correct, per OWNER-QA-002)
- **ROOT_CAUSE (CODE_DEFECT)**: `pendingReviewCount` (`snap.reviewAttentionTruth.uniqueListingsNeedingReview`) is a deduplicated cross-category total (Classifieds + Empleos + Viajes + Servicios + Ofertas Locales = 25). Two CTAs displayed this same number but both hardlinked to `ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue` (Classifieds-only): (1) the top "Review / pending ads" `PriorityTile` in the priority strip, and (2) the "Needs review" `OperatorCard`'s own `primary` button in Today's Attention — even though that same card already renders a correct, individually-linked, reconciling breakdown of all 5 categories directly above the button. No combined/global cross-category review workspace exists in the codebase (confirmed by inspection of `adminDashboardRoutes.ts` and the workspace tree), so building one was out of scope for a live-QA hotfix.
- **FIX** (`app/admin/_components/AdminCommandCenterDashboard.tsx`):
  1. `OperatorCard` now accepts an `id` prop, applied to its root `<article>` (with `scroll-mt-24` so the sticky header doesn't cover it on scroll-to).
  2. The "Needs review" `OperatorCard` now has `id="review"`, which activates the previously-orphaned `ADMIN_DASHBOARD_ROUTES.reviewQueue` route constant (`"/admin#review"` — existed in `adminDashboardRoutes.ts` but was referenced by zero call sites before this fix).
  3. Top "Review / pending ads" `PriorityTile`: `href` changed from `classifiedsReviewQueue` to `reviewQueue` (`/admin#review`); `ctaLabel` changed from "Review ads" to "Review by category"; hint text now names all 5 categories and points at the breakdown. Clicking it now scrolls to the reconciled breakdown instead of opening a silently-partial queue.
  4. "Needs review" `OperatorCard`'s own `primary` button relabeled from "Review listings" (implied combined queue) to "Review Classifieds queue" (accurate — it is, and remains, the Classifieds-only link; the breakdown rows immediately above it already give correct links for the other 4 categories).
  - This is option B from the failure protocol (truthful segmented reconciliation), not option A (a new combined workspace) — no existing combined/global review surface was found, and building one was judged out of scope for a live-QA hotfix per the "no new architecture" instruction.
- **DOCS**: Appended a dated, non-destructive correction note (§14) to `app/admin/DASHBOARD_CEO_COMMAND_CENTER_AUDIT.md` pointing at this ledger entry; the original CTA route matrix table (§6) is left untouched as a historical record of what was true when that audit was written.
- **VALIDATION**: File-scoped `eslint` on `AdminCommandCenterDashboard.tsx` — 2 pre-existing errors only (`CommandCard` unused, `locale` unused arg in `CompactReviewRow`), confirmed pre-existing via `git stash` diff-comparison; zero new errors/warnings introduced by this fix. Full repo typecheck deferred to the final QA integration/certification gate per resource-control instructions (multiple worktrees/processes active on this machine).
- **RETEST**: Pending — see QA STEP 2B (retest) below
- **REMAINING_RISK**: None functionally; this is a navigation/labeling fix only, no data or query logic changed. `dashboard.reviewAds` / `dashboard.reviewAdsTitle` string-dictionary keys became fully unused as a side effect (the CTA label is now a literal string, consistent with most other labels in this file) — left in place as inert dictionary entries, not deleted, since removing i18n dictionary keys was out of scope for this fix.

---

## OWNER-QA-002B (retest of OWNER-QA-003's fix — new, deeper defect found)

- **DATE**: 2026-09-14
- **ROUTE**: `/admin` → each category "Open" link in the "Needs review" breakdown
- **WORKFLOW**: Command Center → per-category review destination parity (QA STEP 2B, second retest)
- **OWNER_ACTION**: After OWNER-QA-003's fix (top CTA now scrolls to the reconciled breakdown), owner clicked each category's own "Open" link and visually compared the Command Center's per-category count against what the destination actually showed.
- **EXPECTED**: For every category, `COUNT` shown in the breakdown = the record universe reached by that category's own "Open" link.
- **OBSERVED**:
  - **Clasificados**: breakdown said 7 → destination (`?status=flagged`) showed 4. NOT reconciled.
  - **Viajes**: breakdown said 8 → destination (`/admin/workspace/clasificados/travel`) showed "No rows in viajes_staged_listings." (0). Severe contradiction — table has 37 real rows, 8 of them genuinely "submitted".
  - **Ofertas Locales**: breakdown said 10 → destination showed "Ofertas Locales (10)", 10 visible rows. Reconciled — used as the known-good reference.
  - **Empleos / Servicios**: both 0 in the breakdown; not independently visible-verifiable at zero, so parity was proven by code/query-architecture inspection instead (see matrix below).
- **STATUS**: FAIL → FIXED (2 root causes found and fixed; retest instructions below)
- **FINDING_ID**: **CMD-004** (destination/count parity) and **SYS-RUNTIME-006** (unrelated 500 found by owner via DevTools while investigating Viajes)

### CMD-004 forensic matrix

| Category | Command Center count | Count source | Count query | Statuses included | Report-inclusion | Dedupe | Open href (before fix) | Destination query (before fix) | Destination visible count (before) | Parity (before) | Root cause |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Clasificados (generic `listings`) | 7 | `computeAdminAttentionReviewTruth()` → `genericAndReportedUniqueCount` | `listings` where `status IN (pending,flagged)` **UNION** `listing_reports.status=pending → listing_id`, deduped by Set | pending, flagged, + any status if reported | Yes — real UNION | Yes — `Set` union | `/admin/workspace/clasificados?status=flagged` | `.ilike("status","flagged")` — single-status exact match only | 4 | **NO** | Destination only ever filtered one literal status (`flagged`); had no concept of "pending" as an additional value or of `listing_reports` at all. Proven by direct query: 2 pending + 4 flagged + 1 reported-but-`active` = 7; `status=flagged` alone = 4. |
| Empleos | 0 | `empleos_public_listings` where `lifecycle_status='pending_review'`, `count:exact,head:true` | same | pending_review only | No (no report table joined for empleos) | N/A (single table) | `/admin/workspace/clasificados/empleos` | `fetchAllEmpleosListingsForAdmin()` — full unfiltered queue (default scope shows all statuses) | 0 (genuinely 0 rows in pending_review; queue itself has other rows) | **YES (architecturally)** — but see **latent defect** below | Not visibly testable at 0, but the destination is unfiltered by status, so if the count were >0 those rows would appear. Latent defect found by code inspection: the query's `.order("republish_sort_at",...)` references a column that does not exist in this DB (see SYS-RUNTIME-006's schema-drift root cause) — would have silently returned zero rows city-wide the moment a real pending_review listing existed. **Fixed proactively** (same pattern as Viajes) even though not owner-visible today, because it is the exact same silent-truth failure Viajes exhibited. |
| Viajes | 8 | `viajes_staged_listings` where `lifecycle_status IN (submitted,in_review,changes_requested)`, `count:exact,head:true` | same | submitted, in_review, changes_requested | No | N/A | `/admin/workspace/clasificados/travel` | `fetchViajesStagedAdminQueue()` — full unfiltered queue, `.order("republish_sort_at",...)` | 0 (query errored, error swallowed to `[]`) | **NO** | Confirmed by direct read-only diagnostic query: table has 37 rows total (23 approved, 5 unpublished, 1 rejected, **8 submitted** — exactly matching the Command Center's 8). The admin queue's own select adds `.order("republish_sort_at", ...)` — that column does not exist in this environment's DB (migration `20260509120000_classifieds_republish_capability.sql` not applied here). The query errors, `fetchViajesStagedAdminQueue()` swallows the error and returns `[]`, and the page displays the generic empty-state copy "No rows in viajes_staged_listings." — indistinguishable from a genuinely empty table. |
| Servicios | 0 | `servicios_public_listings` where `listing_status='pending_review'`, `count:exact,head:true` | same | pending_review only | No | N/A | `/admin/workspace/clasificados/servicios` | Own admin fetch — confirmed via source inspection to order by `created_at`/`updated_at`, **not** `republish_sort_at` | 0 (genuinely 0; destination architecture confirmed sound) | **YES** | No defect found — this category's admin fetch never referenced the missing column. |
| Ofertas Locales | 10 | `ofertas_locales` where `status IN (submitted,pending_review)`, `count:exact,head:true` | same | submitted, pending_review | No | N/A | `/admin/workspace/clasificados/ofertas-locales` | Own admin fetch, unfiltered queue | 10 | **YES** | Owner-confirmed known-good reference. |

### The real review universe (proven from source, not assumed)

Answering the task's six questions directly, from `computeAdminAttentionReviewTruth()` (`app/admin/_lib/adminDashboardData.ts`) and the Clasificados category registry (`app/lib/clasificados/clasificadosCategoryRegistry.ts` / `app/(site)/clasificados/config/categoryConfig.ts`):

1. **Categories capable of producing listings needing owner review**: the 12 Clasificados categories (`servicios, empleos, rentas, bienes-raices, en-venta, autos, restaurantes, clases, comunidad, busco, mascotas-y-perdidos, travel`) plus the standalone Ofertas Locales vertical.
2. **Tables holding those records**: 5 have their own dedicated table (`empleos_public_listings`, `servicios_public_listings`, `viajes_staged_listings`, `autos_classifieds_listings`, `restaurantes_public_listings`) plus the standalone `ofertas_locales` table. The remaining 7 Clasificados categories with no dedicated table (`rentas, bienes-raices, en-venta, clases, comunidad, busco, mascotas-y-perdidos`) all publish into the shared generic `listings` table (with a `category` column) — this is exactly the "Clasificados" bucket in the breakdown, so those 7 categories are **already included**, not missing.
3. **Statuses constituting review-required states**: `pending`/`flagged` on `listings`; `pending_review` on `empleos_public_listings` and `servicios_public_listings`; `submitted`/`in_review`/`changes_requested` on `viajes_staged_listings`; `submitted`/`pending_review` on `ofertas_locales`; plus any listing (regardless of status) referenced by a `listing_reports` row with `status='pending'`.
4. **Categories with a functioning Admin review destination today**: all of the above five (generic Clasificados bucket, Empleos, Viajes, Servicios, Ofertas Locales) have a real, code-confirmed destination route.
5. **Categories intentionally excluded, and why** (all confirmed by direct code trace, documented in-line in `adminDashboardData.ts` at the point Servicios/Ofertas Locales are computed): **Restaurantes**, **Autos**, and **Comida Local** — none of the three has any review-gate status at all; their listings publish directly once payment completes (a REVENUE signal — see the separate "Autos blocked by payment" Command Center card — not a MODERATION signal). This is a deliberate architectural decision, not an oversight.
6. **Is the five-row breakdown canonical, incomplete, or hardcoded?** **Canonical and complete** relative to the current review-gate architecture — every category with a real moderation gate is represented (directly, or folded into the generic Clasificados bucket); every excluded category is excluded for a real, documented, non-arbitrary reason. It is not "hardcoded" in the pejorative sense: each row is a live query against a real table, not a static number.

### Missing-categories audit table

| Category | Live/Staged/Coming soon | Review required? | Can produce review records? | Canonical source | Admin review destination | In Command breakdown? | Should be? | Reason |
|---|---|---|---|---|---|---|---|---|
| Servicios | Live | Yes | Yes | `servicios_public_listings` | `/admin/workspace/clasificados/servicios` | Yes | Yes | — |
| Empleos | Live | Yes | Yes | `empleos_public_listings` | `/admin/workspace/clasificados/empleos` | Yes | Yes | — |
| Viajes | Staged | Yes | Yes | `viajes_staged_listings` | `/admin/workspace/clasificados/travel` | Yes | Yes | — |
| Ofertas Locales | Live (standalone vertical) | Yes | Yes | `ofertas_locales` | `/admin/workspace/clasificados/ofertas-locales` | Yes | Yes | — |
| Rentas, Bienes Raíces, En Venta, Clases, Comunidad, Busco, Mascotas y Perdidos | Live/Staged (mixed) | Yes (shared gate) | Yes | shared `listings` table | `/admin/workspace/clasificados?status=needs_review` (generic queue, `category=` filter) | Folded into "Clasificados" row | Yes, as folded | These 7 have no dedicated table; they use the same `pending`/`flagged` gate as the generic bucket, so counting them separately would double-count against the "Clasificados" row. |
| Restaurantes | Live | **No** | No (direct-publish on payment) | `restaurantes_public_listings` | `/admin/workspace/clasificados/restaurantes` | No | No | No review-gate status exists in this category's status enum — confirmed by code trace, not assumed. |
| Autos | Staged | **No** | No (direct-publish on payment) | `autos_classifieds_listings` | `/admin/workspace/clasificados/autos` | No | No | Same as Restaurantes. Its real attention condition (`pending_payment`) is already surfaced separately as the "Autos blocked by payment" Command Center card — a revenue signal, not moderation. |
| Comida Local | Not yet payment-live | N/A | Not yet (no live inventory) | — | — | No | No, not yet | Category exists in product plan but has no live publish path yet; nothing to review. |

### Zero-count UX semantic model

Chose the **REVIEW COVERAGE MAP** model, not the WORK QUEUE model: Empleos and Servicios showing `0` is left in place, because they prove there is currently nothing waiting in those two review-gated categories, which is itself useful operator information (distinguishing "checked, clear" from "not covered"). This matches the existing card body copy ("Segments below add up to this total") and required no UI change — documenting the choice here so it is not re-litigated as an oversight later.

### FIX (`CMD-004`)

1. **`app/admin/_lib/listingsAdminSelect.ts`**: added a synthetic `status=needs_review` filter token (`LISTINGS_NEEDS_REVIEW_STATUS_TOKEN`). When set, the query reproduces the exact same union `computeAdminAttentionReviewTruth()` uses (pending ∪ flagged ∪ reported-pending ids) via a bounded `listing_reports` lookup + a PostgREST `.or()` clause, instead of a single-status `.ilike()`.
2. **`app/admin/_lib/adminDashboardRoutes.ts`**: `classifiedsReviewQueue` now points at `?status=needs_review#queue` instead of `?status=flagged#queue`.
3. **`app/admin/(dashboard)/workspace/clasificados/page.tsx`**: added a `needs_review` `<option>` to the status filter dropdown (so it doesn't render blank/unmatched) and a truthful banner explaining the combined filter is active, shown only when this filter is on.
4. **`app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts`**: `fetchViajesStagedAdminQueue()` now retries with `.order("updated_at")` if the `.order("republish_sort_at")` query errors, instead of silently returning `[]`.
5. **`app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts`**: same fallback pattern applied to `fetchAllEmpleosListingsForAdmin()` proactively (latent defect, not yet owner-visible since Empleos is currently at 0).
- **CORRECTION (superseded by DATA-QUERY-001 below)**: this entry originally flagged `app/lib/clasificados/autos/autosClassifiedsListingService.ts` and `app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts` as "not fixed / same latent bug" based only on a grep match, without reading the surrounding code. A full follow-up audit (DATA-QUERY-001) proved that claim **false** for both — see below for the corrected, verified picture.
- **VALIDATION**: All three code fixes verified with direct, read-only Supabase queries mirroring the exact code paths (not assumed): Clasificados `needs_review` query returns exactly 7 rows (2 pending + 4 flagged + 1 reported-active), matching the Command Center count. Viajes fallback query returns all 37 rows including the 8 "submitted" ones. Empleos fallback's `updated_at` order column confirmed to exist and query successfully. File-scoped `eslint` on every touched file — zero new errors/warnings (2 pre-existing errors in `AdminCommandCenterDashboard.tsx` and 2 pre-existing warnings in `listingsAdminSelect.ts`, both confirmed pre-existing via `git stash` diff-comparison). Full repo typecheck deferred to the final QA integration/certification gate per resource-control instructions.
- **RETEST**: see instructions below.
- **REMAINING_RISK**: None functionally for the fixed paths. See DATA-QUERY-001 for the full family audit of this defect pattern across the codebase.

---

### SYS-RUNTIME-006 — Web app manifest returns 500 in local Admin QA

- **DATE**: 2026-09-14
- **DISCOVERED BY**: Owner, via DevTools Network tab while investigating the Viajes destination (unrelated to CMD-004 — a separate runtime defect surfaced incidentally)
- **OBSERVED**: `GET http://localhost:3000/manifest.webmanifest` → `500 Internal Server Error`, ~450ms, on every single page load (confirmed site-wide, not Admin-only — the manifest link is emitted by the root layout for every route).
- **ROOT_CAUSE (CODE_DEFECT)**: Confirmed via direct `curl` (Next.js dev mode returns the full error in the response body): *"A conflicting public file and page file was found for path /manifest.webmanifest."* Two competing manifests existed: a static `public/manifest.webmanifest` (old "Leonix Media" identity, last touched 2026-08-19, commit `868397e3` "LEO-14.8: add PWA executive assistant shell") and the dynamic `app/manifest.ts` route generator (current "Leonix Business Concierge" identity, last touched 2026-08-25, commit `2506f616` "feat(business-concierge): finalize pwa installability" — its own doc-comment states "one shared installable PWA... No per-user manifest", confirming it was meant to be the single source of truth). The static file was a leftover never deleted when `app/manifest.ts` superseded it 6 days later.
- **FIX**: Deleted `public/manifest.webmanifest` (the superseded static file). `app/manifest.ts`'s dynamic route is now the sole manifest generator, exactly matching its own stated intent.
- **VALIDATION**: `curl http://localhost:3000/manifest.webmanifest` before fix → `500` with the conflicting-file error body. After fix → `200` with the correct Business Concierge JSON payload. No auth required for this route (public manifest), so this was independently verified without needing an owner or staff session.
- **RETEST**: Have the owner reload any Admin page and confirm the Network tab no longer shows a red/500 `manifest.webmanifest` request (folded into the QA STEP 2B retest below to avoid a separate round-trip).
- **REMAINING_RISK**: None. This also fixes the same 500 for the public marketing site (every page references the same manifest link), which was a real, previously-undiscovered site-wide defect outside Admin's own scope — noting this since it's a positive side effect worth being aware of, not something QA was specifically testing.

---

### DATA-QUERY-001 — Optional republish-sort column caused silent false-empty results (defect-family closeout)

- **DATE**: 2026-09-14
- **TRIGGER**: Owner directive after CMD-004/SYS-RUNTIME-006 — do not leave adjacent latent defects of the same proven pattern unaccounted for just because they were outside the immediate QA step. Also explicitly required correcting the CMD-004 entry's own unverified claim that Autos and Bienes Raíces shared the bug (see correction note above) — proven false on actual inspection.

**Global search performed**: every occurrence of `republish_sort_at` in the repository (37 files) was read and classified. Full matrix:

| File | Function | Runtime surface | Query? | Failure mode if column missing | Current error handling | Active | Fix required |
|---|---|---|---|---|---|---|---|
| `viajesStagedListingsDbServer.ts` | `fetchViajesStagedAdminQueue` | Admin Viajes queue (`/admin/workspace/clasificados/travel`) | Yes — `.order()` | Query errors, was silently `[]` | **Fixed this session** (error-gated fallback to `updated_at`) | YES | **DONE** |
| `empleosPublicListingsDbServer.ts` | `fetchAllEmpleosListingsForAdmin` | Admin Empleos queue | Yes — `.order()` | Same as Viajes, latent (count=0, not yet visible) | **Fixed this session** (same pattern, proactive) | YES | **DONE** |
| `autosClassifiedsListingService.ts` | `listActiveAutosClassifiedsRows` | **Public** Autos active-listing pool | Yes — `.order()` | Would be the same bug | **Already safe** — has its own try/`order("republish_sort_at")` → catch → retry `order("published_at")` fallback, present before this QA session began | YES | NO — verified working, not a defect |
| `autosClassifiedsListingService.ts` | `listAllAutosClassifiedsRowsForAdmin` | **Admin** Autos ops queue (`/admin/workspace/clasificados/autos`) | Yes | N/A | Orders by `updated_at` directly — never references `republish_sort_at` at all | YES | NO — not exposed to this bug |
| `fetchBrPublishedListingsBrowser.ts` | `fetchBrPublishedListingsForBrowse` | **Public** Bienes Raíces browse | Yes — `.select()` + `.order()` | Would be the same bug | **Already safe** — uses the shared `listingsQueryWithSelectShrink` helper for a "rich" attempt (with `republish_sort_at`), and on failure falls back to a second, separate query (`BR_LISTINGS_SELECT_BASE`) with no `.order()` at all | YES | NO — verified live: rich attempt fails fast (2 tries), base fallback succeeds, returned 2 real rows in this environment |
| `rentasListingPublicSelect.ts` | `queryRentasBrowseListings` | **Public** Rentas browse | Yes | Would be the same bug | Deliberately **omits** `republish_sort_at` from its select list (own code comment cites a 2026-08-27 production schema check) and cycles through an ordered list of fallback columns ending in "no order" — never fails | YES | NO |
| `enVentaListingPublicSelect.ts` | En Venta browse | **Public** En Venta browse | Yes | Would be the same bug | Same shared shrink-helper + ordered-fallback-column pattern as Rentas, includes `republish_sort_at` as first preference | YES | NO |
| `serviciosPublicListingsServer.ts` | Servicios public listing fetch | Public Servicios browse | Yes | N/A | Own code comment: deliberately avoids `republish_sort_at`/missing columns, sorts in-process instead | YES | NO |
| `restaurantesPublicListingsServer.ts` | `tryListRestaurantesPublicListingsFromDb` | Public Restaurantes browse | Yes | N/A | Own code comment: orders by `updated_at` baseline specifically so reads succeed when optional migrations are absent | YES | NO |
| `printDigitalVisibilityRank.ts`, `categoryListingMonetization.ts`, `buildAdminListingMonetizationInput.ts`, `EnVentaResultsClient.tsx`, `mapListingRowToRentasPublicListing.ts` | various | Monetization/ranking read models | **No** — reads the field off an already-fetched in-memory row object (`row.republish_sort_at ?? row.published_at ?? …` / `hasAnyField(row, [...])`) | None — a missing key on a plain object is simply `undefined`, handled by the existing `??`/`hasAnyField` fallback chains | n/a | YES (as read model code) | NO — no query risk, not this defect |
| `scripts/*.ts` / `*.mts` (10 files: `varios-final-stack-2k-2l-2m-2p-audit`, `servicios-public-listing-schema-smoke`, `rentas-publish-parity-audit`, `gate-i5-5-*`, `en-venta-gate-2*`, `audit-classifieds-ops`) | one-off CLI audits | None — standalone scripts, confirmed **not imported by any file under `app/`** (checked directly) | n/a | n/a | n/a | **NO** — dead from the running app's perspective | NO — historical audit tooling, not a live surface |
| `*.md` docs (progress/ledger/audit files under `app/` and `docs/`) | — | Documentation | n/a | n/a | n/a | NO | NO |
| `supabase/migrations/20260509120000_classifieds_republish_capability.sql` | — | Schema definition | n/a | This is the migration that defines the column everywhere, and is confirmed **not applied** in this environment (verified: `select republish_sort_at limit 1` errors on all 6 target tables — `listings`, `restaurantes_public_listings`, `servicios_public_listings`, `empleos_public_listings`, `autos_classifieds_listings`, `viajes_staged_listings`) | n/a | n/a | n/a | n/a |

**Conclusion**: the defect family had exactly **2 real active instances**, both in Admin queue fetchers, both now fixed (Viajes, Empleos). Every public-facing browse surface for every category already had defensive handling for this exact schema-drift condition **before this QA session began** — the codebase's public-listing layer was already built correctly against the possibility this migration might not be applied everywhere; only the two Admin-specific queue fetchers (written later, evidently without reusing that same defensive convention) were missing it.

**Error-handling invariant enforced (Step 5)**: both fixes were tightened after an internal review found the first version of the fix would have fallen back on **any** query error, not just the specific missing-column one — which would have silently turned a genuine network/RLS/permission failure into an empty-looking "no rows" result, exactly the failure mode this whole investigation exists to eliminate. Both `fetchViajesStagedAdminQueue` and `fetchAllEmpleosListingsForAdmin` now check `error.message.includes("republish_sort_at")` before falling back; any other error is `console.error`'d (server-side visible) and still returns `[]` today (unchanged from prior behavior for a genuinely unexpected error — a full typed-result-union refactor across every caller was judged out of scope/overengineering for this pass), but is no longer silently indistinguishable from the recognized, safe, schema-drift case.

**INTENTIONALLY NOT FIXED**: nothing remains in-scope and unfixed. The migration itself (`20260509120000_classifieds_republish_capability.sql`) is not applied to this environment's database — applying it would be a Supabase schema change, explicitly out of scope for this QA session without separate owner authorization. All currently-active code correctly tolerates its absence.

**VALIDATION**: Viajes and Empleos fixes re-verified after tightening (error-gate correctly triggers only on the `republish_sort_at` message, fallback still returns real rows). Bienes Raíces' existing fallback independently verified live (rich attempt fails in 2 tries, base fallback succeeds, real rows returned) — proving the original "not fixed" claim about it was wrong, not confirming a fix was needed. File-scoped `eslint` on both re-edited files — zero errors/warnings.

---

### STAFF-CONTACT-VFD-001 — Staff Contact + Virtual Front Desk continuity gate

- **DATE**: 2026-09-14
- **TRIGGER**: Owner addition during active QA — before Admin OS is considered complete, verify two already-existing systems (Executive Contact/Staff Contact Page; Virtual Front Desk/Digital Doorbell) are discoverable and operable from Admin without tribal knowledge. Explicitly not a rebuild request.

**STAFF CONTACT SYSTEM — audit result**: fully built, mostly already well-documented.
- `/admin/team/roster` (staff login/permissions) — confirmed exists, works.
- `/admin/team/executive-hub` (public contact profile: photo, title, theme, publish/suspend/archive, QR, vCard) — confirmed exists, works, has a "New" flow requiring zero code edits.
- Public route `/contact/{slug}` — confirmed real (referenced directly in Executive Hub's own publish/suspend confirm dialogs).
- Admin Guide — already had detailed `team-roster` and `executive-hub` entries, each explicitly warning the two systems are separate and cross-linking to each other. No gap here.
- **Real gap found**: Team Roster's only bridge to Executive Hub was a small nav tab labeled "Executive Hub (owner)" (`StaffTeamNav.tsx`) with no explanation of the STAFF LOGIN vs PUBLIC CONTACT PAGE distinction directly on the page.
- **FIX**: Added the owner's specified "Staff Contact Page" card to `app/admin/(dashboard)/team/roster/page.tsx`, right after "Create staff login" — exact title/description/CTA/helper text as directed.

**VIRTUAL FRONT DESK / DIGITAL DOORBELL — audit result**: fully built, **zero discoverability**.
- `/admin/digital-contact/doorbell` (device push-notification enrollment for visitor video calls, Samsung/Android-first) and `/admin/digital-contact/presence` (temporary AVAILABLE/BUSY/AWAY status) both confirmed real and functional.
- Public visitor route `/visitanos` confirmed real, with Daily-based managed video as primary, informational-only outside 9am–5pm Pacific office hours, and WhatsApp/phone/text/email as always-available fallback (sourced from each staff member's Executive Hub profile — no separate config surface).
- Google Meet/Teams/FaceTime confirmed (via `resolvePreferredFaceToFaceConnection.ts`'s own code comments) to be a secondary, static-link, emergency-only fallback — never the primary doorbell/ringing path.
- **Real gap found**: a repo-wide search for `digital-contact` inside `app/admin` found **zero** references outside the two pages' own files — not in the sidebar nav, not in `ADMIN_DASHBOARD_ROUTES`, not in the Admin Guide, not linked from any other page. Genuinely undiscoverable without already knowing the exact URL — exactly the owner's suspicion, confirmed rather than assumed.
- No System Health check exists for this system (confirmed absent, not hidden) and no admin-editable configuration exists beyond device enrollment + presence (contact destinations are Executive Hub fields, already covered by System A) — both stated truthfully rather than invented.
- **FIX**:
  1. New `ADMIN_GLOBAL_NAV` entry (people group) → `/admin/digital-contact/doorbell`, labeled "Virtual Front Desk" (reusing the page's own existing eyebrow text). Registered in `getAllowedGlobalNavHrefs` at general-staff level (personal action, not owner-only).
  2. New `nav.virtualFrontDesk` string (EN/ES).
  3. Doorbell page now links to the live `/visitanos` page, Presence, and Executive Hub, plus a new `AdminPagePurposeCard` explaining the flow, office-hours behavior, and Google Meet's real (secondary) role.
  4. Two new Admin Guide entries: `virtual-front-desk-doorbell` and `virtual-front-desk-presence`, answering every one of the owner's continuity questions (visitor page location, how video works, what rings staff, after-hours behavior, fallback contacts, what to do if notifications fail). Cross-linked from `team-hub` and `executive-hub`.
- **VALIDATION**: `node scripts/verify-admin-nav-ops.mjs` — 74/74 PASS. `verify-launch-truth-01.ts` (24/24) and `verify-launch-truth-final-burndown-01.ts` (18/18) re-run — still fully pass. File-scoped `eslint` on every touched file — zero errors/warnings. `curl -D -` against both `/admin/digital-contact/doorbell` and `/admin/team/roster` — genuine `307` to `/admin/login` (not a crash), confirming both pages compile and render without a server error, verified without needing an owner/staff session.
- **STATUS**: DONE. Not yet owner-browser-confirmed — see remaining owner QA below.
- **REMAINING_RISK**: None functionally. Owner should still visually confirm in-browser that: the new "Virtual Front Desk" sidebar item appears and opens the doorbell page; the new Staff Contact Page card renders correctly on Roster; the doorbell page's new links work.

### STAFF-CONTACT-VFD-001 — closeout pass (owner re-issued gate with fuller checklist)

- **DATE**: 2026-09-14
- **NO DUPLICATE STAFF-PROFILE SYSTEM**: confirmed by search — `executiveHubStore.ts`/`executiveHubTypes.ts` are the only staff-contact-profile store; Company Search reads from that same store, doesn't duplicate it.
- **SYSTEM HEALTH — corrected**: the first pass said "no System Health check exists" and stopped there. Re-examined against the explicit "surface a safe config-presence check if one exists" instruction and found two already-existing, zero-outbound-call functions (`isWebPushConfigured()`, `createDailyVideoProvider().isConfigured()`). Added a new "Virtual Front Desk (visitor doorbell)" component to `buildAdminSystemHealthSnapshot()` (`app/admin/_lib/adminSystemHealth.ts`) — HEALTHY only when both push and Daily are configured, NOT_CONFIGURED names exactly which piece is missing, owner message notes the public fallback contacts still work regardless. Config-presence only, same honesty bar as the existing email/SMS/AI rows — no live provider probe added.
- **GUIDE UPDATED**: `virtual-front-desk-doorbell`'s `failureGuidance` now directs an operator to check System Health first and distinguishes a config gap (fixable) from a provider-runtime issue (escalate to whoever holds the Daily/push provider accounts); added a `notes` field naming the exact env vars and stating public impact truthfully. `system-health`'s own `purpose` updated to mention this new component.
- **VALIDATION**: `verify-admin-nav-ops.mjs` re-run — 74/74 PASS. Both new health-check functions confirmed to exist and work as designed: a raw standalone `tsx` execution threw on `server-only`'s own guard (expected — that package is designed to throw outside Next's server build, this is not a defect), so verification instead confirmed in-context via the Browser tool: `/admin/system-health` renders the real login redirect cleanly with zero console errors, proving `adminSystemHealth.ts`'s new imports compiled successfully under Next's actual module graph. File-scoped `eslint` — zero errors/warnings.
- **STATUS**: DONE.
- **REMAINING_RISK**: None. Owner should still visually confirm the new "Virtual Front Desk (visitor doorbell)" row appears on `/admin/system-health` once logged in.

---

## Findings Log

### REVIEW-UX-001
- **Severity**: LOW (deferred UX observation, not a functional defect)
- **Type**: UX density
- **Route**: `/admin/workspace/clasificados?status=flagged#queue` (Clasificados review queue row)
- **Observation**: Owner-reported (2026-09-14, alongside OWNER-QA-003) that the Clasificados review row is visually overloaded with many actions and status chips.
- **Status**: OBSERVED, not investigated or fixed this pass. Per instruction, do not redesign unless source inspection later proves the prior action-hierarchy repair (Gate 6/MOD-003) did not actually satisfy the intended primary/secondary/danger grouping. Deferred to the dedicated Marketplace Ops / listing-row QA gate (QA STEP 5).

### AUTH-UX-001
- **Severity**: LOW
- **Type**: UX clarity
- **Route**: `/admin` (shell-wide session/identity footer)
- **Observation**: The phrase "Signed in via cookie" can mislead an operator into thinking the legacy/bootstrap login path was used, even when the user authenticated through the normal Supabase team-account form.
- **Preferred eventual wording**: Communicate authenticated identity/session truth rather than implementation mechanism, e.g. "Signed in as chuy@leonixmedia.com" or an equivalent truthful identity/role label.
- **Status**: OBSERVED, not yet fixed — deferred; not trivial-and-isolated enough to fix mid-flow without disrupting QA progression. Revisit at the appropriate UX/System-shell QA phase.

---

## Runtime notes

- Dev server PID 24720 serving `C:\projects\elaguila-website-admin-live-qa` on `http://localhost:3000` — confirmed healthy, not restarted.
