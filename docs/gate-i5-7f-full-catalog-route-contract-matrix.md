# Gate I.5.7F — Full-Catalog Route Contract Matrix

Status as of Work Package I.5.8, branch `integration/lifecycle-foundation-2026-07`. This is the
single ledger for full-catalog route truth — Work Package I.5.8 updated it in place rather than
creating a competing document.

This document is **evidence-backed documentation, not an implementation plan**. It records the
current truth of every registered category/pipeline's route surfaces, enforced by
[`scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts`](../scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts)
and, for the specific fixes below, by
[`scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts`](../scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts),
[`scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts`](../scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts),
[`scripts/gate-i6a-quick-clasificados-lifecycle-selftest.ts`](../scripts/gate-i6a-quick-clasificados-lifecycle-selftest.ts),
[`scripts/gate-i6b-quick-clasificados-integrity-selftest.ts`](../scripts/gate-i6b-quick-clasificados-integrity-selftest.ts),
[`scripts/gate-i6c-quick-listing-fail-closed-identity-selftest.ts`](../scripts/gate-i6c-quick-listing-fail-closed-identity-selftest.ts),
[`scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts`](../scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts),
[`scripts/gate-i8a-global-dashboard-truth-selftest.ts`](../scripts/gate-i8a-global-dashboard-truth-selftest.ts),
[`scripts/gate-i8b-live-dashboard-coverage-selftest.ts`](../scripts/gate-i8b-live-dashboard-coverage-selftest.ts),
[`scripts/gate-i9a-admin-operations-truth-selftest.ts`](../scripts/gate-i9a-admin-operations-truth-selftest.ts),
[`scripts/gate-i9b-admin-write-safety-selftest.ts`](../scripts/gate-i9b-admin-write-safety-selftest.ts),
and, for the analytics/engagement truth recorded below,
[`scripts/gate-i10a-analytics-engagement-truth-selftest.ts`](../scripts/gate-i10a-analytics-engagement-truth-selftest.ts)
[`scripts/gate-i10b-en-venta-inline-save-owner-protection-selftest.ts`](../scripts/gate-i10b-en-venta-inline-save-owner-protection-selftest.ts),
and, for the media/draft-persistence truth recorded below,
[`scripts/gate-i11a-media-draft-persistence-truth-selftest.ts`](../scripts/gate-i11a-media-draft-persistence-truth-selftest.ts)
[`scripts/gate-i11a-autos-listing-edit-media-isolation-selftest.ts`](../scripts/gate-i11a-autos-listing-edit-media-isolation-selftest.ts),
[`scripts/gate-i11b-autos-draft-upload-session-security-selftest.ts`](../scripts/gate-i11b-autos-draft-upload-session-security-selftest.ts),
and, for the full-catalog lifecycle certification recorded below (including its I.12B live-policy
verification addendum),
[`scripts/gate-i12a-full-catalog-certification-selftest.ts`](../scripts/gate-i12a-full-catalog-certification-selftest.ts).
It does not claim the two route systems are unified, and it does not repair every stale value it
documents — see [Unresolved Route Debt](#unresolved-route-debt).

## Work Package I.12B Update Log — Live Supabase Policy Verification (Owner-Verified Addendum)

**Scope:** a read-only verification package, not a code or migration change. I.12A's own repository
inspection could only prove that no tracked migration creates an `UPDATE`/`INSERT` policy on
`public.listings` — it explicitly could not prove or disprove live database-level enforcement,
since a policy can exist in the live Supabase project without ever being captured in a tracked
migration. I.12B's own automated pass (this same work package, first attempt) exhausted every
available read-only, non-mutating inspection path — Supabase CLI (blocked: not linked, and linking
was explicitly out of scope for that pass), a direct Postgres connection string (none configured in
`.env.local`), the Management API (same link requirement), and a repository audit script (none
exists) — and correctly returned **UNVERIFIABLE**, not a guess.

**Resolution — owner-performed, live Dashboard verification.** The owner directly inspected the
Policies page for `public.listings` in the "Leonix Media" Supabase project (the project the running
application's own `NEXT_PUBLIC_SUPABASE_URL` resolves to, confirmed in I.12B's own report) and
reported the following, verbatim:

| Policy | Table | Command | Role | USING | WITH CHECK |
|---|---|---|---|---|---|
| "Owner update own listings" | `public.listings` | `UPDATE` | `authenticated` | `(owner_id = auth.uid())` | `(owner_id = auth.uid())` |
| "Owner insert own listings" | `public.listings` | `INSERT` | `authenticated` | — | `(owner_id = auth.uid())` |

Also confirmed from the same Policies page: RLS is enabled on `public.listings`; owner SELECT
policies exist; public active-listing SELECT policies exist.

**This documentation records owner-reported live evidence, not an independent automated re-query.**
No script in this repository connected to the live database to confirm these rows — the access
blockers identified in I.12B's first pass were never lifted (no link performed, no connection
string added, no Management API call made). This distinction is preserved deliberately, per this
package's own instruction to "remain precise."

**Certification, updated from I.12A/I.12B's prior PARTIAL/UNVERIFIABLE status:**

- RLS enabled on `public.listings`: **CERTIFIED** (owner-verified live).
- Owner-only `INSERT` enforcement: **CERTIFIED** — `WITH CHECK (owner_id = auth.uid())` on the
  `authenticated` role prevents inserting a row owned by anyone else.
- Owner-only `UPDATE` enforcement: **CERTIFIED** — `USING (owner_id = auth.uid())` on the
  `authenticated` role restricts which rows can be targeted at all.
- Cross-owner update protection: **CERTIFIED** — a matching `USING` clause means an authenticated
  user's `UPDATE` against another owner's row matches zero rows at the database level, independent
  of and prior to I.12A's own `applyOwnerListingPatch()` client-side `.eq("owner_id", ...)` filter.
- Owner reassignment protection: **CERTIFIED** — the `WITH CHECK (owner_id = auth.uid())` clause on
  the `UPDATE` policy means even a successfully-matched row cannot have its `owner_id` changed to a
  different user by the row's own authenticated owner or anyone else.
- **Not performed and not claimed:** a live runtime cross-owner mutation test (attempting a real
  `UPDATE` from one authenticated identity against another identity's row) was **not** run. Per this
  package's own instruction, this remains an optional, disposable-QA-row defense-in-depth
  validation for a future package, not a blocker to this certification.

**Full ownership certification for the generic owner-dashboard pipeline family (En Venta, Bienes
Raíces Privado, Rentas' generic actions, Comunidad, Clases, Busco, Mascotas — the 19 call sites
migrated to `applyOwnerListingPatch()` in I.12A) is now upgraded from PARTIAL to CERTIFIED**: I.12A's
own client-side `id` + `owner_id` filter and zero-row detection is real, working defense in depth,
and is now independently backed by a proven, database-level `USING`/`WITH CHECK` pair rather than
resting on an unverified assumption. `ownerListingsLifecycleClient.ts`'s own source comment (stating
database enforcement is "unverified from tracked code") remains **literally accurate and
intentionally unchanged** — it is a true statement about what the tracked migration history alone
can prove, which is a narrower claim than what this live-Dashboard-sourced documentation now
separately establishes. No application code was touched by this addendum.

## Work Package I.12A Update Log

**Scope:** the first full-catalog *lifecycle* certification — not a new audit from zero. Per this
package's own instruction, the matrix below is **synthesized** from this ledger's already-verified
truth (routes/identity since I.5.x, dashboard discovery since I.8A/I.8B, Admin operations/write-
safety since I.9A/I.9B, analytics since I.10A/I.10B, media/draft-persistence since I.11A/I.11B)
plus three new, parallel, read-only research passes covering the dimensions this ledger did not
yet cover: save-and-return, pause/resume/renewal accuracy, Preview-to-Public parity, mobile route
readiness, dead-code inventory, and a systematic direct-write ownership audit. Two prior ledger
claims were found stale by this process and are corrected below, not silently carried forward.

**Status legend:** CERTIFIED · CERTIFIED WITH CATEGORY ADAPTER (real, category-specific
implementation, not a gap) · PARTIAL (real but incomplete, or defense-in-depth without full proof)
· BLOCKED (no safe path found) · UNSUPPORTED BY PRODUCT (confirmed absent by design/current scope,
not a bug) · EXTERNAL WORKSTREAM (owned by a different branch) · NOT IMPLEMENTED (confirmed zero
capability) · STALE/UNSAFE (marks what a *prior* claim said, alongside its correction).

### Corrected claims (stale, not previously flagged)

| Pipeline | Prior ledger claim | Corrected classification | Evidence |
|---|---|---|---|
| Restaurantes | "pause/resume via dedicated page" (Per-pipeline dashboard truth, I.8A) | **NOT IMPLEMENTED** | `app/lib/listingIdentity/restaurantesLifecycleAdapter.ts:7-11`'s own audit comment: "no certified owner-facing lifecycle mutation today... no Pause/Resume/Archive/Restore/Republish exists anywhere in the Restaurant dashboard." Confirmed independently: `app/(site)/dashboard/restaurantes/page.tsx`'s `cardActions` has no status-mutating action; `app/api/clasificados/restaurantes/` has only `publish` and `draft-media-upload` routes. |
| Auto Dealers (`autos_negocios`) | "group-level pause/resume via dedicated section" (Per-pipeline dashboard truth, I.8A) | **PARTIAL** — one-way `unpublish` only, per-row, no resume | `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx:355-382` — an `active` row gets one destructive-styled `unpublish` button calling `POST /api/clasificados/autos/listings/[id]/unpublish` → `updateAutosListingStatus(id, "removed")`; a non-active row gets a static, non-interactive label, no button at all. No `restore_active`/reactivate path exists for the owner. |

### Full catalog certification matrix (representative capabilities; full per-pipeline detail already exists in [Per-pipeline dashboard truth](#per-pipeline-dashboard-truth), [Per-pipeline Admin operations truth](#per-pipeline-admin-operations-truth), and [Full pipeline matrix](#full-pipeline-matrix) above — this table adds the capabilities those didn't cover)

| Pipeline | Pause/Resume | Renew/Republish | Save-and-return (tab close) | Preview↔Public parity | Owner-write authorization |
|---|---|---|---|---|---|
| Restaurantes | **NOT IMPLEMENTED** (corrected above) | UNSUPPORTED BY PRODUCT (coupon add-on ≠ base renewal) | PARTIAL — `sessionStorage` only, lost on tab close | CERTIFIED — shared `mapRestauranteDraftToShellData()` | CERTIFIED — dedicated server route, real `owner_user_id` check |
| Servicios | CERTIFIED — real route (`app/api/clasificados/servicios/manage/route.ts`), real UI, state-transition validated, double-scoped `.eq("owner_user_id", ...)` | UNSUPPORTED BY PRODUCT (offers add-on ≠ base renewal) | PARTIAL — `sessionStorage`; a separate, dead `app/(site)/servicios/publicar/**` tree uses `localStorage` but has zero live inbound links, not the real flow | CERTIFIED — shared `resolveServiciosProfile()` + shared section components | CERTIFIED |
| Auto Dealers | **PARTIAL** (corrected above) | UNSUPPORTED BY PRODUCT (inventory-pack ≠ renewal) | BLOCKED — no durable persistence found beyond `sessionStorage` | CERTIFIED WITH CATEGORY ADAPTER — literal same component (`AutoDealerPreviewPage`) rendered by both Preview and Public | CERTIFIED — dedicated server route, real ownership check |
| Bienes Raíces Negocio | CERTIFIED — real cascade-aware API (`brListingLifecycleService.ts`, children paused before parent) + real UI | UNSUPPORTED BY PRODUCT (inventory-pack ≠ renewal) | PARTIAL/uncertain — no dedicated top-level draft store found; routes through shared BR/Rentas machinery, not independently re-verified this pass | CERTIFIED WITH CATEGORY ADAPTER — literal same component for the agente-individual sub-flow | CERTIFIED — dedicated server route |
| Rentas (both lanes) | CERTIFIED (existing) | **CERTIFIED** — the only pipeline with a real Stripe-driven renewal (`revenueRentasFulfillment.ts`) | PARTIAL — `sessionStorage`; BR Privado's sibling implementation has a confirmed-benign unconditional `localStorage` mirror inconsistency, noted not fixed (accidental extra durability, not data loss) | not re-verified this pass; carried forward from ledger | CERTIFIED (dedicated route) + generic actions now **PARTIAL** (defense-in-depth, see below) |
| Viajes | CERTIFIED WITH CATEGORY ADAPTER — real `unpublish`/`resubmit` (not symmetric pause/resume, but real, real API, real UI, and genuinely lane-aware in `/dashboard/viajes`) | UNSUPPORTED BY PRODUCT | localStorage (durable) | CERTIFIED WITH CATEGORY ADAPTER — shared `ViajesOfferDetailLayout` + shared `ViajesOfferDetailModel` type | CERTIFIED — dedicated server route |
| Comida Local | **NOT IMPLEMENTED** — confirmed zero owner-side mutation capability of any kind; the dashboard's only "Formulario" link is unlinked/blank, not a real edit route | UNSUPPORTED BY PRODUCT | localStorage (durable) | CERTIFIED — shared `ComidaLocalDetailShell`, type-linked mapper pair (`ComidaLocalPublicListingDetailVm extends ComidaLocalPreviewVm`) | n/a — no write route exists to audit |
| Empleos | CERTIFIED (existing, own dashboard page, real `paused` status) | UNSUPPORTED BY PRODUCT | `sessionStorage` only | not re-verified this pass | CERTIFIED — dedicated server route, real ownership check |
| En Venta / Bienes Raíces Privado / Comunidad / Clases / Busco / Mascotas (generic `listings`-table pipelines) | CERTIFIED for En Venta/BR (archive/pause/resume/mark-sold via generic dashboard); archive-only for Busco/Clases/Comunidad/Mascotas (confirmed, no pause/resume/renew exists for these four) | En Venta: republish window (UNSUPPORTED as paid renewal); others UNSUPPORTED BY PRODUCT | `sessionStorage` (Clases/Comunidad/Empleos-style) or IndexedDB+`sessionStorage` (En Venta, richest mechanism, still no durable "closed tab" resume) | CERTIFIED (no drifting fork found for any of these) | **Fixed this package** — see below |
| Bienes Raíces Privado edit/photo durability | (no dedicated edit route — existing gap, unchanged) | UNSUPPORTED BY PRODUCT | localStorage mirror (see Rentas row) | n/a | CERTIFIED — generic editor's append-only gallery writes + dedicated seller-photo block, confirmed no photo-loss path (platform-wide: no image is ever deleted from storage) |
| Mascotas y Perdidos | Archive only (confirmed) | UNSUPPORTED BY PRODUCT | `sessionStorage` | CERTIFIED — real subtype-aware rendering (5 real subtypes, not 4; result cards + detail page both resolve `Leonix:noticeType`) | CERTIFIED (generic path) |
| Empleos applications / En Venta messaging | Empleos: CERTIFIED (owner-visible, real status transitions, feria lane correctly excluded) — En Venta: **PARTIAL, see Objective F decision below** | — | — | — | — |

### Owner-write authorization — proven gap, fixed this package (defense-in-depth only)

**Proven, not assumed:** 19 direct client-side `supabase.from("listings").update(patch).eq("id", id)` calls across the generic owner dashboard (`mis-anuncios/page.tsx` ×6, `mis-anuncios/[id]/page.tsx` ×5, `mis-anuncios/[id]/editar/page.tsx` ×6, `dashboard/drafts/page.tsx` ×2 — covering En Venta, Bienes Raíces, Rentas' generic actions, Comunidad, Clases, Busco, Mascotas) carried **no owner predicate in the write itself** — only each page's initial read was owner-scoped (`.eq("owner_id", u.id)`, confirmed the real column for `public.listings`). No tracked migration defines a `CREATE POLICY` on `public.listings` — RLS enforcement is **unverified from the repository**, not proven absent. Three quick-publish-flow writes (`publishBuscoQuickToListings.ts` and its Clases/Comunidad/Mascotas siblings) were investigated and excluded — each operates on a row whose ownership was already established earlier in the *same* function invocation (a fresh insert or an I.6C-verified reuse), a different, already-safe risk profile.

**Fix — `applyOwnerListingPatch()` added to the existing, already-imported `app/(site)/dashboard/lib/ownerListingsLifecycleClient.ts`** (no new file, no new mechanism): rejects before any network call when owner identity is missing or blank; scopes the write by both `id` and `owner_id`; adds `.select("id")` so a zero-row match (wrong id, wrong owner, already-deleted) is returned as a real `error` instead of Postgrest's default silent-success-on-zero-rows behavior. All 19 call sites now use it, reusing each file's already-resolved `userId` — no new identity resolution, no change to existing loading/error-display code paths (same destructured `{ error }` shape).

**Certification, stated exactly, not softened:** dashboard owner predicate — **implemented as defense in depth**. Database-enforced UPDATE ownership — **unverified from tracked code**. Full ownership certification for this pipeline — **PARTIAL**. Exact follow-up: a production Supabase RLS/config verification (a runtime check, not a code task), and, if a policy is genuinely missing, a separately approved migration package — explicitly not attempted here (schema/migrations/RLS are locked for I.12A).

### Owner-decision register — En Venta / dashboard messaging: RESOLVED via Option B

**Investigated fully, corrected mid-investigation.** The generic sidebar unread-message badge/nav link was found to already be correctly hidden — `app/(site)/dashboard/components/LeonixDashboardShell.tsx:266-268` and `app/(site)/dashboard/lib/derivedDashboardFeed.ts:104` both already gate on `DASHBOARD_INTERNAL_INBOX_READY` (`app/(site)/dashboard/lib/dashboardProductTruth.ts:3`, currently `false`), corroborated by a pre-existing audit doc (`docs/leonix-user-dashboard-command-center-master-audit.md:112`) explicitly recommending "keep hidden until inbox product." No mobile-specific duplicate exists (confirmed only one nav-rendering block; the dashboard has no separate mobile route/component layer at all, per the mobile-readiness research below).

**The real, live, ungated gap — found by checking every category dashboard, not stopping at the shared shell:** `app/(site)/dashboard/restaurantes/page.tsx:493` (its own, independent `cardActions` array) had an unconditional "Abrir mensajes"/"Open messages" link to the unfinished `/dashboard/mensajes` route. Servicios' equivalent page was checked and confirmed to not have this pattern. Fixed by wrapping that one array entry in the same existing `DASHBOARD_INTERNAL_INBOX_READY` check — reusing the identical flag, not a second mechanism.

**Product behavior after this fix:** buyer message *sending* remains fully functional and untouched (`app/api/clasificados/en-venta/inquiry/route.ts` and siblings, unchanged); stored messages remain intact (no `messages` table, migration, or RLS touched); owners are not shown a badge or navigation promise pointing at an unfinished inbox anywhere in the app; the inbox itself is recorded here as **NOT IMPLEMENTED**, not silently omitted. **A dedicated messaging-center package remains required** before this can be certified CERTIFIED rather than NOT IMPLEMENTED. Also confirmed, related and worth naming: `app/(site)/dashboard/mis-anuncios/[id]/page.tsx` fetches real per-listing messages into `listingMessages` state but never renders them (`"messages"` is force-redirected away from in the tab switcher) — a real data layer with zero UI, consistent with "not implemented," not a second bug to fix.

### Owner-decision register — remaining items (unchanged in substance from prior packages, consolidated here)

1. **Rentas canonical launch lane/default renderer** — unchanged, OWNER DECISION REQUIRED (see [Unresolved Route Debt](#unresolved-route-debt)).
2. **Categories with no real Edit surface**: Bienes Raíces Privado, Mascotas y Perdidos, Comida Local. Recommend extending the generic `/editar` page's field set over building per-category editors — lower risk, reuses proven infrastructure. Does not block launch.
3. **Categories with no real renewal/payment behavior**: every Negocios category except Rentas — confirmed current product state this package, not a bug. Recommend an explicit decision on whether renewal is a launch requirement.
4. **Restaurantes/Auto Dealers pause-resume gap** (now correctly documented, previously overstated) — recommend deferring; building real lifecycle actions for these two pipelines is a feature, not a safe I.12A-scope fix.
5. **Comida Local lifecycle actions** — confirmed zero owner-side capability; recommend a dedicated future package if production-readiness parity with Restaurantes/Servicios is required for this category.

### Shared category adapter map

Synthesized from the real `CATEGORY_ROUTE_REGISTRY` (`app/lib/listingIdentity/categoryRouteRegistry.ts`, 17 real adapters — no invented entries; the structural self-test cross-references this directly) plus this ledger's own accumulated dashboard/Admin/analytics/media findings. Missing capabilities are recorded as null/unsupported, never fabricated.

| Pipeline | Source table | Parent/child | Payment model | Business Hub | Analytics adapter | Media/draft adapter |
|---|---|---|---|---|---|---|
| restaurantes | `restaurantes_public_listings` | no | coupon add-on only | yes (parent, entitlement-verified) | canonical (`restaurantesGlobalAnalytics.ts`) | Vercel Blob pre-publish, `sessionStorage` draft |
| servicios | `servicios_public_listings` | no | offers add-on only | yes (parent, entitlement-verified) | canonical | Vercel Blob pre-publish, `sessionStorage` draft |
| bienes_raices_negocio | `listings` | **yes** (`br_inventory_group_id`) | inventory-pack (not renewal) | yes, parent only, resolver-gated | canonical (`brGlobalAnalytics.ts`) | client-storage only (uncertain top-level store, see matrix) |
| bienes_raices_privado | `listings` | no | none confirmed | no | legacy/bespoke | generic editor, append-only, confirmed safe |
| autos_negocios | `autos_classifieds_listings` | **yes** | inventory-pack (not renewal) | yes, parent, ungated (asymmetry vs BR, pre-existing) | canonical (`recordAutosGlobalAnalytics.ts`) | I.11A/I.11B-certified isolation |
| autos_privado | `autos_classifieds_listings` | no | none confirmed | no | canonical | I.11A/I.11B-certified isolation |
| rentas_negocio / rentas_privado | `listings` | no | **real Stripe renewal** | no (resolver never emits hub action) | legacy (`rentasAnalytics.ts`, CTA clicks still on oldest module — I.10A finding) | `sessionStorage` |
| empleos | `empleos_public_listings` | no | none confirmed | not applicable | canonical | `sessionStorage` |
| en_venta | `listings` | no | republish window (not renewal) | no | canonical (I.10A-migrated) | IndexedDB + `sessionStorage`, richest mechanism |
| comida_local | `comida_local_public_listings` | no | none — no write route at all | no | canonical (`comidaLocalAnalytics.ts`) | localStorage draft, Vercel Blob upload |
| ofertas_locales | (external — Ofertas worktree) | n/a | n/a | dedicated | n/a | n/a |
| busco / clases / comunidad | `listings` | no | none | no | canonical | `sessionStorage` (shared community hook) |
| mascotas_y_perdidos | `listings` | no | none | no | canonical (I.10A rollup fix) | `sessionStorage` |
| viajes | `viajes_staged_listings` (slug-keyed) | no | none confirmed | no (resolver never emits) | FALSE — `viajesTrack()` stub (I.10A finding, unchanged) | localStorage draft |

### Negocios Locales blueprint certification — **PARTIAL**

Cannot certify complete: **Business Hub eligibility is missing for 2 of 6 categories with a business lane** (Rentas Negocio, Viajes business — adapter declares `supportsBusinessHub: true` but no live resolver branch exists, a confirmed I.8A finding, unchanged); **renewal/expiration exists for exactly 1 of 6** (Rentas); **parent/child inventory exists for exactly 2 of 6** (Auto Dealers, Bienes Raíces Negocio); **pause/resume now correctly shows 2 of 6 with none at all** (Restaurantes, Comida Local) and 1 partial (Auto Dealers). Identity, dashboard discovery, and canonical analytics are solid across all 6. Per Objective H's own instruction, a foundational capability missing across multiple categories means this cannot be certified complete — recorded as PARTIAL with the exact gaps named above, not glossed over.

### Clasificados blueprint certification — **PARTIAL**

Create/save/Preview/publish/public/results/dashboard/Edit and same-row-update are solid and verified across every pipeline in this family (no INSERT-on-failure fallback found anywhere checked this package). Archive/discontinue is universal. What keeps this from full certification: **messaging/applications completeness varies sharply** — Empleos applications are real and owner-visible; En Venta messaging is real on the send side but the owner inbox is confirmed NOT IMPLEMENTED (Option B applied, not built); most other categories have no messaging concept at all (by product design, not a gap). **Owner-write authorization is PARTIAL, not CERTIFIED**, per the defense-in-depth finding above — affects every pipeline routed through the generic dashboard.

### External workstream register

- **Ofertas Locales / Cupones** — confirmed isolated. Zero files under any Ofertas/Cupones-owned path appear in this package's diff (enforced by the self-test). Category-specific implementation remains owned by `integration/ofertas-locales-2026-07`, not inspected or modified here, per instruction.
- **Business Concierge** — confirmed isolated. Zero Concierge files touched (enforced by the self-test). The Concierge worktree was not accessed during this package's research or implementation.

### Legacy and dead-code truth

| Item | Confirmed zero live importers? | Disposition |
|---|---|---|
| `app/(site)/clasificados/lib/leonixClasificadosAnalytics.ts` + 5 `*AnalyticsExtended.ts`/`serviciosAnalytics.ts`/`restaurantesAnalytics.ts` wrappers (I.10A finding) | Yes, re-confirmed this package | safe-to-remove-now (deferred — not removed this package) |
| `AutosPreviewCard.tsx`, `RentasPreviewCard.tsx`, `CommunityResultCardEngagement.tsx` (I.10A finding) | Yes, re-confirmed | safe-to-remove-now (deferred) |
| `app/(site)/clasificados/lib/listingDraftsDb.ts` | Yes (real, functional, DB-backed module — just never wired) | **stale comment corrected this package**; module itself deferred, not removed (a real, working feature that could be wired up later, not pure dead weight) |
| `app/(site)/servicios/publicar/**` (a second, orphaned Servicios draft-storage tree using `localStorage`) | Yes, zero inbound links anywhere | dead but deferred |
| `app/(site)/clasificados/lib/stripLegacySharedWizardBrKeys.ts` | Yes | safe-to-remove-now (deferred) |
| `app/(site)/components/mobile/LeonixStickyActionBar.tsx` | Yes (siblings `LeonixResponsiveShell`/`LeonixMobileBottomSheet`/`LeonixMobileScrollRail` from the same "V1 foundation" comment block ARE live, in Ofertas Locales preview) | dead but deferred — possibly intended for near-term use given live siblings; not removed |
| `app/api/_lib/bearerUser.ts` vs `app/api/clasificados/_lib/bearerUser.ts` | Both still-referenced (9 and 13 importers) — byte-for-byte identical implementations | not dead; a real, low-risk future consolidation opportunity, not attempted here |
| `app/(site)/clasificados/components/categoryStandard/` (v1) vs `categoryStandardV2/` | Both heavily, actively imported in parallel | **not dead code** — a genuine, live, mid-migration state; do not remove v1 |

No file was deleted in this package — every candidate above is identified, not removed, per Objective I's "identify, but do not broadly delete" and the requirement that removal needs proven zero callers, no compatibility dependency, test coverage, and in-budget scope. A dedicated cleanup package is the right vehicle for the safe-to-remove-now items.

### Remaining launch blockers

None of the findings in this package are launch-blocking in the hard sense (nothing found and left broken that was previously claimed working and load-bearing) — the two corrected claims (Restaurantes/Auto Dealers pause-resume) describe capabilities that were never actually available to users, so correcting the ledger doesn't change live behavior. The owner-write authorization PARTIAL status is the one item worth explicit executive attention before a security-sensitive launch, given it cannot be fully closed without a production RLS check outside this package's scope.

### Next recommended package

**I.12B — Production Supabase RLS verification for `public.listings`** (a config/verification task, not primarily a code package): confirm whether an `UPDATE` RLS policy already exists on the live table; if missing, scope and separately approve a migration package to add one. This is the single item standing between "defense-in-depth" and "fully certified" for owner-write authorization across the entire generic-dashboard pipeline family.

## Work Package I.11B Update Log

**Closes the one gap I.11A's own final report named explicitly:** `app/api/clasificados/autos/media/draft-photo-upload/route.ts`
had the same unauthenticated-upload weakness fixed elsewhere in I.11A, and its anonymous fallback
was actually **weaker** than the four routes I.11A fixed — every unauthenticated caller shared one
literal `"anon"` path segment (not even scoped per-draft), relying entirely on the client-supplied
`draftId` for any separation.

- **Reused, not duplicated:** the route now imports the same `app/api/clasificados/_lib/anonUploadSession.ts`
  helper I.11A introduced — real authenticated identity via the route's existing, unchanged
  `getAutosPublishUserIdFromRequest()` when a bearer token is present; otherwise the shared
  server-issued, `crypto.randomUUID()`-based, httpOnly anonymous session cookie. No second
  anonymous-session implementation was created.
- **Existing-listing ownership:** this route only ever receives a client-chosen `draftId`, never a
  canonical `listingId` — there is not enough context here to verify ownership of an existing
  listing. Documented, not invented: that verification happens where this route's uploaded URLs
  are actually attached to a listing, at publish/update time, consistent with the other four
  draft-media routes. The I.11A client-side `autosListingEditNamespace` session-scoping fix is
  unrelated to this upload route and was not touched (locked for this package).
- **Path safety:** existing MIME-type, file-size, and slot-allowlist validation are unchanged;
  `draftId` sanitization (strips to `[a-zA-Z0-9_-]`, safe non-empty fallback) is unchanged; no
  storage-object deletion was added or existed before.

**Files:** the Autos draft-photo-upload route (edited), `scripts/gate-i11b-autos-draft-upload-session-security-selftest.ts`
(new), this ledger entry. 3 files, within the 5-file budget.

## Work Package I.11A Update Log

**Scope:** global media/draft-persistence truth — not route/identity truth (the rest of this
document) and not analytics/engagement truth (the I.10A/I.10B sections above). No shared media
ledger existed anywhere before this package; media/draft-persistence truth had been tracked
entirely through fragmented, per-category, per-incident audit `.md` files under `app/lib/clasificados/<category>/`
and `app/(site)/clasificados/<category>/`, and one-off `*-audit.ts`/`verify-*.mjs`/`smoke-*.mjs`
scripts — never the `gate-iN` convention. This section does not replace those files; it is the
first cross-category record.

**Status legend used below** (per-item, not a blanket claim): **contract exists** = a shared
type/predicate is defined; **live-wired** = a real behavioral change shipped, not just a type;
**audited, bespoke, not migrated** = read and understood this package, left exactly as-is;
**proven gap, fixed** = a confirmed defect with a shipped fix; **proven gap, documented, not
fixed** = a confirmed defect, out of this package's approved scope, named precisely so it isn't
silently lost.

### Shared media contract — contract exists, not live-wired

`app/lib/media/listingMediaContract.ts` (new): types for the 7 media states (local-unsaved,
uploaded-hosted, existing-DB, removed, replacement, ordered, external-video) and pure predicates
(`isBlobOrObjectUrl`, `isDataUrl`, `isPersistableMediaUrl`, `withNormalizedMediaOrder`). **Not
wired into any existing category's publish/draft pipeline** — every category keeps its own
bespoke media shape (Autos `MediaImageEntry`, Bienes Raíces `BrChildMediaImage`, Servicios
`GalleryItem`/`VideoItem`, plain `string[]` for En Venta/Bienes Raíces main listing, Comida Local's
role-slot `ComidaLocalUploadedImage`). This is an additive foundation for incremental future
adoption, not evidence that any category was migrated or newly "standardized." `isPersistableMediaUrl`
was certified against (not used to replace) the independent `blob:`-rejection guard already proven
in `app/api/clasificados/bienes-raices/listing-edit/route.ts`'s `sourceToUpload()` — same rule,
two independent implementations, both hold.

### Upload authorization — proven gap, fixed (4 routes) + 1 shared helper (live-wired)

**Proven, not assumed:** `app/api/clasificados/restaurantes/draft-media-upload/route.ts`,
`.../servicios/draft-media-upload/route.ts`, and `.../rentas/draft-media-upload/route.ts` had **no
authentication or ownership check at all** — the entire Vercel Blob storage path was built from a
client-supplied `draftListingId`/`draftId`. Traced the client-side id generation for Servicios
(`getServiciosPublishDraftListingId()`, `app/(site)/clasificados/publicar/servicios/lib/serviciosDraftPublishPrepare.ts`):
`` `sv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}` `` — weakly random,
client-generated, created before any auth call. `app/api/clasificados/comida-local/draft-media-upload/route.ts`
already resolved a real bearer identity when present, but its anonymous fallback
(`anon-${draftListingId}`) used that same weak client-supplied id — confirmed **not** safe
precedent (its `comidaLocalOwnerIdFromBearer()` is byte-for-byte identical to the generic
`getBearerUserId()` helper). No server-derived anonymous session/cookie mechanism existed anywhere
in the repository prior to this package.

**Fix — `app/api/clasificados/_lib/anonUploadSession.ts` (new):** a small, explicitly-documented
**non-authentication** helper — `crypto.randomUUID()`-based, httpOnly/secure/sameSite cookie,
grants no permissions, checked against no protected resource. All four routes now: resolve real
identity via `getBearerUserId()` (or Comida Local's equivalent) when a bearer token is present;
otherwise scope the storage path by this server-issued anonymous session id, never the raw
client-supplied draft id. No route rejects anonymous requests (anonymous pre-login drafting
appears to be real, intended product behavior — draft ids are minted and uploads can happen before
any auth call — so hard-rejecting would break a live flow, not just close a gap). Ownership
verification of an *existing* listing is out of scope for these four routes — they are pre-publish
draft-media routes only and never operate on an existing listing id; that verification is handled
correctly at actual publish/update time (confirmed for the Bienes Raíces edit route; not
independently re-verified for every other category's publish route in this package — carried
forward, not re-audited).

### Autos Negocios + Privado draft/media isolation — proven gap, fixed

**Proven, not assumed:** `hydrateAutosDealerListingForDashboardEdit()` (Negocios,
`app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft.ts`) and the inline
dashboard-edit fetch (Privado, `AutosPrivadoApplication.tsx`) wrote the DB-fetched listing into the
**same per-user** sessionStorage key and IndexedDB namespace a fresh "new listing" application
uses — confirmed by `app/(site)/clasificados/autos/shared/lib/autosEditorTabSession.ts`'s own
comment: *"two tabs share one user namespace; last write wins."* This meant opening dashboard-edit
for listing A could clobber an in-progress "new listing" draft, or a different listing B's
edit-in-progress state, in the same browser. `logo:${namespace}`, `finance-image:${namespace}`,
and `video:${namespace}` (`autosNegociosDraftImageIdb.ts`/`autosNegociosDraftVideoIdb.ts`) were
true single-slot-per-user collision points, not just orphaning risk.

**Fix — `app/lib/clasificados/autos/autosListingEditNamespace.ts` (new):** one pure,
lane-agnostic function deriving `` `${baseNamespace}:listingEdit:${listingId}` ``. Every
IndexedDB helper (`autosNegociosDraftImageIdb.ts`, `autosNegociosDraftVideoIdb.ts`,
`autosNegociosDraftIdbRefs.ts`) already treats `namespace` as an opaque string with zero
parsing — **none of them needed to change**; only what value callers resolve as `namespace` did.
`useAutoDealerDraft.ts` / `useAutoPrivadoDraft.ts` now accept an optional `editListingId` and fold
it into the effective namespace at **both** the bootstrap effect and the `onAuthStateChange`
handler (the latter was a real, separately-discovered risk: a background auth event, e.g. a token
refresh, mid-edit would otherwise silently revert to the raw namespace and wipe the in-progress
edit draft). `AutosNegociosApplication.tsx` / `AutosPrivadoApplication.tsx` thread the
dashboard-edit `editListingId` search param into the hooks. New-listing behavior (no listing id)
is byte-for-byte unchanged — same raw namespace, same keys. Preview needed **zero** changes: the
pre-existing `rememberAutosDraftNamespaceHint`/`peekAutosDraftNamespaceHint` mechanism
(`autosDraftPreviewNamespaceHint.ts`) already exists to tell Preview which namespace the editor
just used, so it automatically follows the now-correct effective namespace. `flushDraft`,
`resetDraft`, and `clearAutosNegociosDraft`/`clearAutosPrivadoDraft` also needed no changes — they
already read `namespaceRef.current` at call time. Parent/child and sibling isolation (saved
children as distinct array elements with per-image-id IDB keys; the in-flight child drawer as a
single slot disambiguated by `inventoryDrawerEditingId`) is orthogonal to this fix and was not
touched. Autos' own `draft-photo-upload/route.ts` had the same weak-anon-fallback pattern
documented above for the other four upload routes — **fixed in Work Package I.11B**, see that
section below.

### Stale documentation corrected

`app/lib/clasificados/autos/AUTOS_A5_SHIP_07_ZERO_DATA_LOSS_MEDIA_STORAGE_AUDIT.md` (2026-06-02)
claimed no Autos pre-publish durable-storage upload route existed. `app/api/clasificados/autos/media/draft-photo-upload/route.ts`
(Vercel Blob-backed) now exists, added in a later work package with no corresponding audit-doc
update. Corrected with a dated addendum, not rewritten.

### Audited, bespoke, not migrated (no gap proven, left as-is)

- **No image is ever deleted from storage anywhere in the codebase** (searched for Supabase
  Storage `.remove()` and `@vercel/blob`'s `del()` — zero matches for either) — removal is always
  reference-only. Consistent platform-wide; matches "do not delete unless a proven safe path
  exists" by construction. (Mux *video* assets do have a real delete path,
  `deleteMuxAssetsBestEffort` in `app/lib/mux/server.ts` — images/Blob objects have no equivalent,
  a platform-wide storage-growth characteristic, not a per-category bug.)
- **Bienes Raíces' "omission from `imageSources` = removal"** merge semantics
  (`app/api/clasificados/bienes-raices/listing-edit/route.ts`'s `resolvePublicImages()`) — by
  design, not a bug; correctness depends on the client always fully rehydrating existing media
  before submit, which the existing hydration functions are built to do. Too central/fragile
  (shared with the locked Bienes Raíces pipeline) to touch without a proven failure.
- **External video URL validation differs per category** — En Venta and Restaurantes share one
  validator (`isEmbeddableExternalVideoUrl`); Autos has its own independent, stricter one
  (`normalizeAutosExternalVideoUrl`, requires `https://` specifically); Servicios and Viajes have
  none found. Every validator that exists fails safely (drops the invalid entry, never throws).
  A real inconsistency, not a proven bug; forcing unification risks the same fragile Autos code
  paths (dozens of prior `autos-a5-recovery-*` fix cycles) for marginal gain.
- **No staleness/`updated_at` check** anywhere a locally-persisted edit workspace (Bienes Raíces,
  Rentas) or a freshly-DB-hydrated draft (Autos) is written — an old local draft can in principle
  silently outrank newer DB truth on next edit-open. Pre-existing, not introduced or worsened by
  this package's namespace fix (which only changes *which* keys are used, not the staleness logic).
- **`useLeonixPublishLeaveGuard`** (`app/(site)/clasificados/lib/publishFlowLifecycleClient.ts`) —
  a `pagehide` handler that clears the draft and beacons a Mux-asset-delete request. Confirmed
  **unused by any live component** (only self-referenced and two audit scripts reference it) — a
  latent footgun if ever wired up without noticing its refresh-clearing side effect, not a live bug.
  Not modified.

## Work Package I.10A Update Log

**Scope:** global analytics/engagement truth — not route/identity truth (the rest of this
document). Recorded here per Work Package I.10A instruction to use this file as the single
master ledger rather than create a competing one; `docs/admin-analytics-monetization-table-audit.md`
(2026-06-12) received a short correction pointer only, not a rewritten table.

**Starting-point correction — the June audit was stale.** That doc marked Bienes Raíces,
Comunidad, Clases, and Busco as having "no category emitter" (`FALSE`). Direct inspection found
this is no longer true: `app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts` and
`app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics.ts` already exist and already
call the canonical, server-validated pipeline (`POST /api/analytics/events` via
`app/lib/analytics/client/recordAnalyticsEvent.ts`) for view/open/share/like/CTA events on all
four categories, wired in prior work packages after that audit was written. The gap was narrower
than "no tracking at all": `LeonixLikeButton`/`LeonixSaveButton`/`LeonixShareButton` — the shared
components rendered across nearly every category — already supported an optional
`recordLikeEvent`/`recordSaveEvent`/`recordShareEvent` override that routes to the canonical path
when supplied, silently falling back to a legacy client-direct-Supabase-insert default
(`app/lib/clasificadosAnalytics.ts`) when not. Several real call sites with a provably real
`listings.id` UUID were still on that legacy default.

**New shared code (server-validated path only — nothing here imports from
`app/lib/analytics/server/*`, which is Next.js route-handler code):**

- **`app/lib/analytics/selfEngagementGuard.ts`** — new. Pure predicate `isSelfEngagement(currentUserId, ownerUserId)`. Fails open (allows) when either id is unknown — there's nothing to prove self-engagement against.
- **`app/lib/analytics/client/listingEngagementRecorder.ts`** — new. A category-agnostic dispatcher over the existing canonical `recordAnalyticsEvent()` fetch wrapper, for call sites that don't already have a typed per-category adapter. Requires a real `sourceTable` (`ListingAnalyticsSourceTable`, reused, not widened to `string`) and `sourceId`; fails closed (no request) when either is empty. Exports `trackListingViewOpen`, `trackListingLikeToggle`, `trackListingSaveToggle`/`trackListingSaveToggleAuthed` (the latter resolves the current Supabase session token first, since `listing_save`/`listing_unsave` are auth-required server-side), `trackListingShare`, `trackListingCta`. **`app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics.ts` was deliberately left untouched** (zero edits, its `"comunidad" | "clases" | "busco"` union is not widened) — an earlier draft of this package proposed repurposing it as a global recorder and that was corrected before implementation as a type-safety regression.

**Call sites migrated from the legacy default to the canonical override, identity confirmed real in each case before wiring (no slug/Ad-ID/title ever substituted for a known UUID):**

| Site | Category | `source_table` | Identity | Action(s) migrated |
|---|---|---|---|---|
| `CommunityQuickAnuncioDetail.tsx` | comunidad/clases (dynamic) | `listings` | `listing.id` from `.from("listings").eq("id", id)` | Like (existing `trackCommunityLikeToggle`), Save (new recorder) |
| `EnVentaAnuncioLayout.tsx` (shared en-venta + bienes-raices shell) | en-venta / bienes-raices | `listings` | `listing.id` | inline Save (both branches), non-premium-BR inline Share |
| `anuncio/[id]/page.tsx` (generic detail page) | dynamic (`listing.category`) | `listings` | `listing.id` | view + open (migrated off the older `app/lib/listingAnalytics.ts` `trackEvent`), inline Save, `LeonixShareButton` override |
| `RentasListingDetailClient.tsx` | rentas | `listings` | `listing.id`, `isUuid()`-checked in-file | Save override |
| `RentasVisualMatchPreviewView.tsx` | rentas | `listings` | Same `isUuid()`-checked value from caller | Like override |
| `BienesRaicesNegocioLiveDetailShell.tsx` / `BienesRaicesPrivadoLiveDetailShell.tsx` | bienes-raices | `listings` | `listingId={listing.id}` | inline Save (both branches) + owner self-check added inline (hand-rolled Save, not via `LeonixSaveButton`) |

**Bug fix, not new wiring — `QuickJobHeaderCard.tsx` (Empleos):** `empleosGlobalLikeRecorder(globalListing)` / `empleosGlobalShareRecorder(globalListing, "detail_share")` were already being built correctly but the returned function was constructed and discarded without ever being called — this component recorded **no analytics at all**, neither canonical nor legacy, before this fix. Now actually invoked with the real `isLike`/`shareMethod`/`extraMeta` arguments.

**Owner self-engagement protection (new — no caller had this before):** `LeonixLikeButton.tsx` and `LeonixSaveButton.tsx` now capture the signed-in user id (already resolved in their existing hydration + auth-change effects) and fold `!isSelfEngagement(currentUserId, ownerUserId)` into their existing `allowEngage` computation — blocks both the real write and the analytics event when the viewer is the listing owner, reusing all existing disabled/inert UI, no new visual states. The two BR shells get the equivalent inline check since their Save is hand-rolled. **Share is never gated** — an owner sharing their own listing is normal and Share never touches Like/Save state. Persistence-before-analytics ordering is unchanged everywhere: the real DB mutation runs and is checked for success before any analytics call, and analytics failures are fire-and-forget (never undo or block the real action).

**Comida Local owner-dashboard rollup gap closed:** `app/lib/ownerEngagementListingKeys.ts` queried 6 tables for `collectOwnerListingKeysForAnalytics`/`countOwnerInventoryListings` but fully omitted `comida_local_public_listings`, even though that table, its `owner_user_id`/`slug`/`leonix_ad_id` columns, and its emitter (`app/lib/clasificados/comida-local/comidaLocalAnalytics.ts`) all already exist. Added to both functions.

**Remaining legacy callers — explicitly named, not silently left as if fully migrated:**

- `EmpleosClasificadosEngagementRow.tsx`, `RestauranteProfileHeader.tsx`, `RestauranteShellInteractiveCtas.tsx` — already fail over to the canonical path only when their `listingSourceId`/`sourceId` prop resolves; when it's absent they fall back to the shared component's legacy default using a value that may be a `leonix_ad_id` rather than a UUID. Pre-existing behavior, not introduced by I.10A; not changed here — fixing it correctly requires auditing every parent caller for whether the prop is ever actually omitted in production, a separately-scoped task.
- The `message_sent` calls in `anuncio/[id]/page.tsx` (via the older `app/lib/listingAnalytics.ts` `trackEvent`) are **not** migrated — only that file's `listing_view`/`listing_open` calls are.
- Rentas CTA clicks (phone/whatsapp/email/website/sms/directions, `app/(site)/clasificados/rentas/analytics/rentasAnalytics.ts`) still route through the oldest legacy module (`app/lib/listingAnalytics.ts`'s `trackEvent`), discovered during this package's tracing but out of this package's approved file list.
- `app/(site)/clasificados/lib/leonixClasificadosAnalytics.ts` and the five `*AnalyticsExtended.ts` / `serviciosAnalytics.ts` / `restaurantesAnalytics.ts` wrapper modules, plus `AutosPreviewCard.tsx`, `RentasPreviewCard.tsx`, `CommunityResultCardEngagement.tsx` — confirmed zero live importers/callers anywhere in `app/`. Dead code, left untouched; a future cleanup package can remove them.
**Dashboard honesty:** `AdminViajesAnalyticsPlaceholders.tsx` was audited and found already compliant — it's explicitly labeled ("Mock sample" badge, "not live data" heading, disabled "Open full report" button), not silently presented as real. Not a bug; left as-is, with a regression test guarding the label.

**Duplicate/abuse protection reused, not reinvented:** server-side time-window dedupe (`analyticsEventDedupe.ts`, unchanged) applies automatically to the newly-migrated view/open calls since they go through the same `/api/analytics/events` route. Rapid duplicate Like/Save clicks were already prevented by the existing `isLiking`/`isSaving` in-flight guards. No schema or migration changes anywhere in this package.

## Work Package I.10B Update Log

**Closes the one gap I.10A's own final report named explicitly:** `EnVentaAnuncioLayout.tsx`'s inline Save (the shared en-venta + bienes-raices detail shell's hand-rolled Save, not via `LeonixSaveButton`) did not get the owner self-engagement check the shared components and the two BR live-detail shells received in I.10A.

- **`onToggleSave` now calls `isSelfEngagement(user.id, ownerId)`** (the same pure predicate from `app/lib/analytics/selfEngagementGuard.ts`, reused unchanged — no new auth system) immediately after the existing anonymous-user redirect check, before either branch's `saved_listings` mutation or `trackListingSaveToggleAuthed` analytics call. An owner viewing their own listing now gets a silent early return: no DB write, no analytics event.
- **Non-owner behavior is unchanged** — the guard is a single early `return`, not a rewrite of either branch; a non-owner still reaches the real mutation and the real canonical analytics call exactly as before.
- **Persistence-before-analytics ordering is preserved** in both branches, unchanged from I.10A.
- **Share is not gated** — unaffected, as intended; an owner can still share their own listing.
- No analytics API, server validation, schema, or other category file touched.

**Files:** `EnVentaAnuncioLayout.tsx` (edited), `scripts/gate-i10b-en-venta-inline-save-owner-protection-selftest.ts` (new), this ledger entry. 3 files, within the 4-file budget.

## Work Package I.9B update log

Closes the highest-risk gap I.9A confirmed but deliberately left unfixed: Admin's Auto Dealer and
Bienes Raíces Negocio write routes acted directly on whatever UUID was in the request, with no
server-side guard preventing a parent-only lifecycle action from being applied to (or through) an
inventory child row.

- **`adminInventoryActionGuard.ts` — new.** One small, shared target-row validator,
  `assertAutosDealerActionAllowed()` / `assertBrNegocioActionAllowed()`. Both reuse the existing,
  canonical role predicates rather than re-deriving them — `isDealerInventoryMainListing`/
  `isDealerInventoryVehicle` (Autos) and `isBrNegocioListing`/`isBrInventoryMainListing`/
  `isBrInventoryProperty` (Bienes) — never a new identity system. Every input must be a
  freshly-fetched server row; nothing here ever trusts a client-supplied role, category, parent
  id, or owner id.
- **Deliberately asymmetric between the two pipelines — evidence-based, not stylistic.**
  - **Autos**: a standalone, never-grouped dealer listing (the common single-vehicle-dealer case)
    is confirmed, by direct inspection of `promoteNegociosMainInventoryListing()`
    (`autosClassifiedsListingService.ts:448-465`), to keep `inventory_role = null` until a second
    vehicle is added — `inventory_role` is only promoted to `"main"` lazily, not proactively at
    publish. Treating every un-tagged standalone listing as "unresolved" would fail-close the
    majority case, a real regression. So a listing with `lane = "negocios"` and no parent id at
    all is still treated as the parent — the same, already-proven convention the owner dashboard
    already uses (`dashboardInventory.ts`'s `isDealerMain`).
  - **Bienes Raíces**: confirmed, by direct inspection of `leonixPublishRealEstateListingCore.ts:
    592-604`, that `inventory_role: "main"` is set proactively at publish time for the default
    (non-multi-property) Negocio case, via `mainListingInventoryPatchAfterInsert()`. Strict
    matching (`isBrInventoryMainListing`, requiring the literal `inventory_role === "main"`) is
    therefore safe and is used as-is — no fail-open fallback. A Bienes Raíces Negocio listing
    published before this system existed will fail closed on the one parent-only action
    (`archive`) until its `inventory_role` is backfilled — an explicitly accepted, conservative
    consequence of Objective B's "do not infer parent role merely from missing parent ID," not an
    overlooked regression.
- **Scope of the new restriction, per pipeline (Objective A's matrix, using the owner-dashboard's
  established `resolveDashboardActions()` precedent — parent-only structural actions vs.
  reversible per-row flags — as evidence):**
  - **Auto Dealers**: `archive`, `remove_public`, `restore_active` are now **parent-only**.
    `suspend`, `unsuspend`, `promote_on`, `promote_off`, `verify_on`, `verify_off`, `republish`
    remain **allowed for both** roles, unchanged — each is a per-row, reversible flag/status
    write with no cross-row effect and no evidence restricting it.
  - **Bienes Raíces Negocio**: only `archive` is **parent-only** (the generic `listings` route has
    no separate `remove_public`/`restore_active` actions). `suspend`, `unsuspend`, `promote_on`,
    `promote_off`, `verify_on`, `verify_off`, `republish` remain allowed for both, unchanged.
  - The destructive hard-delete action (`deleteListingAction`) was **not** reclassified or
    touched — it remains its own separately-invoked, more-cautiously-gated tool outside this
    per-row action set, exactly as I.9A already recorded.
- **Wired into both touched routes, authorization-first, write-last.** Both
  `app/api/admin/autos/listings/[id]/route.ts` and
  `app/api/admin/clasificados/listings/[id]/route.ts` (the latter scoped narrowly to
  `category === "bienes-raices"` — every other category on this shared route is provably
  untouched) now call the guard immediately after the existing `requireAdminCookie` check and the
  row fetch, and strictly before the `.update()` call. A rejected action returns the deterministic
  `admin_inventory_action_forbidden` code with HTTP 403 — never a raw database error, never
  role-specific detail.
- **Identity preservation confirmed, not just claimed.** Neither route's `patch` object for any
  action ever includes the parent id, group id, owner id, category, or Leonix Ad ID columns —
  confirmed by source-level test assertion, not just design intent. Every write remains
  `.eq("id", id)` — the exact target row, never a substituted parent/child id.
- **Generic listings safety (Objective D) — audited, no additional defect found.** Rentas, En
  Venta, Bienes Raíces Privado, Comunidad, Clases, Busco, Mascotas y Perdidos, and Autos Privado
  have no inventory/parent-child concept at all on the shared `listings`/`autos_classifieds_listings`
  tables — confirmed unaffected by the new guard (it only activates for `category ===
  "bienes-raices"` on the generic route, and for `lane === "negocios"` with a resolvable role on
  the Autos route). The pre-existing `invalid_action` 400 fail-closed default for unsupported
  transitions, and the absence of `category`/`owner_id`/`owner_user_id` from every action's patch
  object, were both confirmed already correct — no additional repair was needed or made.
- **`adminActionTruth.ts` updated only after the real protection landed.** `inspectParentChild`
  moved from `stale_or_unsafe` to `working_with_adapter` for `autos_negocios` and
  `bienes_raices_negocio` — not bare `working`, since only the specific structural actions listed
  above are now role-gated; the rest of each pipeline's action set was already accurately
  classified and is unchanged.
- **I.9A's report-authorization fix (`updateListingReportStatusAction` → `can_manage_reports`)
  confirmed intact, unchanged.**

## Per-pipeline Admin write-safety truth (Auto Dealers / Bienes Raíces Negocio)

| Action | Auto Dealer allowed role | Auto Dealer authorization | Auto Dealer identity validation | Auto Dealer row scope | Auto Dealer parent/child preservation | Bienes Negocio allowed role | Bienes Negocio status | Remaining gap |
|---|---|---|---|---|---|---|---|---|
| `archive` | parent only | `requireAdminCookie`, before guard, before write | server-fetched row; role resolved from `inventory_role`/`lane`/parent id, never client-supplied | exact `id` only | parent/group id never in patch | parent only | same contract, generic route | none — genuinely protected |
| `remove_public` | parent only | same | same | exact `id` only | same | not applicable (action doesn't exist on generic route) | n/a | none |
| `restore_active` | parent only | same | same | exact `id` only | same | not applicable | n/a | none |
| `suspend` / `unsuspend` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none — reversible per-row flag, no restriction needed |
| `promote_on` / `promote_off` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none |
| `verify_on` / `verify_off` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none |
| `republish` | allowed for both | same | same | exact `id` only | same | allowed for both | same | none |
| `remove` (hard delete) | not part of this action set | `requireLeonixAdminPermission("can_manage_ads")` (`deleteListingAction`, unchanged) | n/a | listings table only | n/a | not part of this action set | unchanged | intentionally kept as its own separately-gated tool, not reclassified |

**Not fixed in this package (unchanged from I.9A, still real, still documented):** the 3-pattern
authorization-check duplication across the other 19 untouched `app/api/admin/**` routes; owner
email exposure via `adminProfilesQuery.ts` remains ungated beyond the base cookie and unaudited on
read; no dedicated coupon/offers-addon Admin status view exists. All three remain out of this
package's narrow, evidence-scoped fix list.

## Work Package I.9A update log

First package to audit the **staff-facing Admin surface** (`app/admin/`), architecturally
separate from every prior package in this ledger (all of which covered the owner-facing dashboard
or the public route/registry system). Confirmed by direct inspection: Admin has **zero** usage of
the canonical `ListingIdentity`/`categoryRouteRegistry.ts`/`resolveDashboardActions()` system
anywhere — it is an entirely separate, ad-hoc identity/route system
(`app/admin/_lib/listingsAdminSelect.ts`, `classifiedsOpsContract.ts`, per-route inline path
building). This package does not unify the two systems (out of scope, too large) — it audits,
classifies, and organizes Admin truthfully, and fixes two small, safe, evidence-backed real bugs.

- **`adminListingClassification.ts` — new.** Mirrors the owner-dashboard's
  `classifyOwnerDashboardRow()` (I.8A), but for Admin, and — for the first time — has Admin
  express its classification in terms of the canonical `CanonicalCategoryKey` pipeline vocabulary
  instead of inventing a third parallel one. Purely a classification helper (group + pipeline);
  never sees an owner id.
- **`adminActionTruth.ts` — new.** Classifies, per pipeline and per action, whether a real
  handler exists, using only confirmed evidence from direct source inspection of all 20
  `app/api/admin/**` route files plus every Admin category queue page:
  - **Dedicated-route pipelines** (real `app/api/admin/{category}/listings/[id]/route.ts` PATCH
    handler, confirmed `requireAdminCookie` + real `.update()`): Restaurantes, Servicios, Empleos
    (+ moderate route), Autos Negocios, Viajes (+ staged-listings moderate route).
  - **Generic-route pipelines** (shared `app/api/admin/clasificados/listings/[id]/route.ts`,
    category-branching PATCH against the shared `listings` table): Rentas (both lanes), En Venta,
    Bienes Raíces (both lanes), Comunidad, Clases, Busco, Mascotas y Perdidos, Autos Privado.
    Classified `working_with_adapter`, deliberately not collapsed into bare `working` — the route
    branches per category and that distinction is preserved, not flattened.
  - **Comida Local — confirmed real Admin queue page, but literally no write handler at all.**
    Direct inspection of `app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx`
    found no suspend/archive `onClick`, no `fetch` to `/api/admin`, only a GET search form and a
    queue/live toggle link. Classified `ui_only_no_handler` — there was no misleading button to
    fix (there is no button at all), so nothing was hidden/disabled; this is a genuine, honest
    capability gap, recorded here per Objective G rather than silently assumed working.
  - **`remove` (hard delete) is deliberately never classified as a routine `working` action for
    any pipeline.** The real handler (`deleteListingAction`) exists, is authorization-gated, and
    genuinely deletes Mux assets + soft-removes the row — but this package keeps it classified
    `blocked`/`intentionally_unsupported` in the generic per-row action truth table rather than
    certifying it as a routine, safe-to-wire action; it remains its own separately-invoked,
    more-cautiously-gated tool.
  - **Real, confirmed gap: no parent/child protection at the Admin API layer.** The owner-facing
    `resolveDashboardActions()` has an explicit, tested guard preventing a child inventory row's
    action from acting on/appearing as its parent (I.5.8). Admin has no equivalent — its
    write routes (`restaurantes/[id]`, `servicios/[id]`, `clasificados/listings/[id]`, etc.) act
    directly on whatever UUID is in the URL, with zero `inventory_role`/parent-check before
    mutating. `inspectParentChild` is classified `stale_or_unsafe` for `bienes_raices_negocio`
    and `autos_negocios` to record this honestly. **Not fixed in this package** — retrofitting a
    guard into 6+ live write routes is a real behavior change to production write paths, outside
    this package's "narrow additive changes" scope; recorded as a remaining gap.
- **`adminStatusAttention.ts` — new.** Per Objective H's "reuse or adapt existing display-only
  status normalization," this does **not** duplicate the owner-dashboard's status mapping tables
  — it calls `resolveOwnerDashboardStatusDisplay()` (I.8A/I.8B) directly, since Restaurantes/
  Servicios/Empleos/Viajes use identical DB status vocabularies in Admin as in the owner
  dashboard (same tables, same columns). Adds only genuinely Admin-specific attention reasons on
  top (unsupported pipeline, unknown status, suspended, pending moderation, payment required,
  expired entitlement, missing owner, parent/child inconsistency, incomplete Admin action) — all
  strictly gated on caller-supplied, already-verified facts; nothing is inferred or fabricated.
- **Real security fix: `updateListingReportStatusAction` was missing its documented
  authorization gate.** `app/admin/_lib/leonixAdminGate.ts`'s own header comment already
  documented `can_manage_reports -> updateListingReportStatusAction` as the intended permission
  gate, but the function itself had no `requireLeonixAdminPermission()` call at all — unlike its
  siblings in the same file (`setListingPublishedAction`, `deleteListingAction`, both correctly
  gated on `can_manage_ads`). Fixed by adding the one missing, already-intended call. Confirmed
  `submitListingReportAction` (the public "report this listing" action, called from public
  listing pages, not staff) correctly remains ungated — it is not a staff action and was never
  supposed to be.
- **Real, evidence-backed contract fix: `busco` was missing from
  `CLASSIFIEDS_OPS_CONTRACTS`.** A real, working Admin queue page already existed
  (`app/admin/(dashboard)/workspace/clasificados/busco/page.tsx`, backed by the shared `listings`
  table, covered by the same generic write route as Rentas/En Venta/Comunidad/Clases) — same bug
  class already fixed for Clases/Comunidad on the owner-dashboard side (Gate I.6B). Added with the
  confirmed-real `"BUSCO"` Leonix prefix (`listingsLeonixPrefixForCategory("busco")`,
  `app/(site)/clasificados/lib/leonixAdIdAllocator.ts`). **Ofertas Locales was deliberately NOT
  added** — it is a locked system for this package (Ofertas/Cupones); its real, separate
  `ofertas_locales` table and Admin surface were not inspected or touched.
- **Auth-check consistency — audited, not refactored.** All 21 `app/api/admin/**` routes do
  perform a real cookie check before any write, but via three different code paths (direct
  `requireAdminCookie` import in 8 files, a wrapper `assertAdminLeadExportAccess()` in 7 files,
  and a hand-inlined literal duplicate of the same check in 5 files that never calls the shared
  helper). No route is unprotected, but this is a real consistency/maintainability risk — a
  future change to admin-cookie logic could silently miss the 5 inlined files. **Not refactored
  in this package** (would touch 13+ live write route files, outside this package's narrow-change
  scope) — recorded as a remaining gap, not silently normalized away.
- **Owner PII exposure — audited, not changed.** Admin can resolve any listing's `owner_id` to
  the owner's full profile including email (`app/admin/_lib/adminProfilesQuery.ts`), gated only
  by the base admin cookie — no per-role redaction, no read-audit-logging (only writes are
  audited via `auditAdminWrite`/`appendAdminAuditLog`). Recorded as a remaining gap; not a write
  behavior change, so out of this package's fix scope.
- **Entitlement/promo-code Admin writers confirmed real and pre-existing — not touched.**
  `listing_package_entitlements` create/revoke/extend/attach and `leonix_promo_codes`
  create/revoke already exist, are authorization-gated (`assertCanManageEntitlement`/
  `assertCanManagePromoCode`), and are unmodified by this package (verified in the new test).
  `leonix_payment_records` (the Stripe/payment table itself) has no Admin write path anywhere —
  confirmed webhook-only by design, correctly left that way.
- **No dedicated Admin view of Restaurante coupon add-on / Servicios offers-addon status exists
  per listing** — confirmed absent (only a generic `addOnKeys` list inside promo-code redemption
  usage rows). Documented as a real gap, not built here.

## Per-pipeline Admin operations truth

| Pipeline | Admin discovery | Canonical identity | Owner visibility | Normalized status | View/Preview/Edit context | Moderation | Lifecycle controls | Payment visibility | Entitlement visibility | Report handling | Parent/child inspection | Incomplete actions | Remaining Admin gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `restaurantes` | dedicated table + page | sourceId UUID | real (`owner_user_id` → profiles) | reused from I.8A/I.8B, truthful | real | via `listing_reports` (auth now fixed) | working (dedicated route) | real (`listing_package_entitlements`/payment tracker) | real | connected, auth gap now closed | not applicable | `remove` intentionally not routine | consistency of the 3-pattern cookie-check duplication |
| `servicios` | dedicated table + page | sourceId UUID | real | reused, truthful | real | same as above | working (dedicated route) | real | real | connected | not applicable | `remove` not routine | same as above |
| `empleos` | dedicated table + page + moderate route | sourceId UUID | real | reused, truthful | real | dedicated moderate route, real | working (dedicated route) | real | real | connected | not applicable | `remove` not routine | same as above |
| `autos_negocios` | dedicated table + page | sourceId UUID | real | own logic, not re-audited this pass | real | via `listing_reports` | working (dedicated route) | real | real | connected | **confirmed unsafe** — no parent/child guard at Admin API layer | `remove` not routine | parent/child guard gap (documented, not fixed) |
| `autos_privado` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter (generic route) | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `bienes_raices_negocio` | shared `listings` table + inventory badges | sourceId UUID, `br_inventory_group_id` | real | own logic | real | via `listing_reports` | working_with_adapter (generic route) | real | real | connected | **confirmed unsafe** — same gap as Autos Negocios | `remove` not routine | parent/child guard gap |
| `bienes_raices_privado` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `rentas_negocio`/`rentas_privado` | shared `listings` table + dedicated inspector route | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `en_venta` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `comida_local` | dedicated table + page | sourceId UUID | real | own dedicated translator, truthful | real (view only) | via `listing_reports` | **`ui_only_no_handler` — confirmed no write handler at all** | not applicable | not applicable | connected | not applicable | suspend/archive/etc genuinely absent | build real lifecycle actions if ever prioritized |
| `ofertas_locales` | **out of scope — locked system (Ofertas/Cupones)** | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | not inspected or touched by this package |
| `busco` | **fixed in I.9A** — real page, was missing from `CLASSIFIEDS_OPS_CONTRACTS` | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter (generic route) | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `clases`/`comunidad` | shared `listings` table | sourceId UUID | real | shared centralized helper | real | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine | consistency gap |
| `mascotas_y_perdidos` | shared `listings` table | sourceId UUID | real | shared centralized helper | real; **Edit/owner-context honestly `blocked`** — no safe editor exists (same fact as I.6B/I.8B) | via `listing_reports` | working_with_adapter | real | real | connected | not applicable | `remove` not routine; Edit blocked | build a safe editor if ever prioritized |
| `viajes` | dedicated table + page + moderate route | sourceId UUID (table is slug-keyed for public) | real | reused, truthful | `working_with_adapter` — lane-ambiguous (same finding as I.7A) | dedicated moderate route, real | working (dedicated route) | real | real | connected | not applicable | `remove` not routine | lane-ambiguity, consistency gap |

## Work Package I.8B update log

**Correction to I.8A's own claim.** I.8A's report stated the classification helper existed and
was tested, but did not clearly state whether it was actually wired into the live render path —
it was not; `classifyOwnerDashboardRow()` was built and unit-tested but never imported by
`mis-anuncios/page.tsx`. I.8B corrects this directly.

- **Classification is now live-wired, not test-only.** `mis-anuncios/page.tsx` now imports and
  calls `classifyOwnerDashboardRow()` in all four flat-list card-family branches (Autos Privado,
  Bienes/Rentas, En Venta, the generic catch-all) and all four dedicated-card-family call sites
  (Restaurantes, Servicios, Empleos, Viajes). Every rendered card now carries a real, translated
  group badge (`ownerDashboardGroupLabel()` — "Negocio"/"Privado y clasificado"/"Inventario"/
  "Requiere atención") sourced directly from the helper's output — the smallest additive
  organization compatible with the existing card designs (a badge, not a redesign or new section
  hierarchy). Business organization (which visual group a card belongs to) and Business Hub
  eligibility (whether coupons/offers/inventory actions can ever appear) remain two separate
  truths, exactly as before — Rentas Negocio and Viajes' business lane still classify `business`
  organizationally but `businessHubEligible: false`, since no live `resolveDashboardActions()`
  branch exists for either.
- **Unsupported pipelines no longer silently disappear.** A real gap was found and fixed: because
  `categoryFilteredListings` requires `listingRowCategoryKey(row) === categoryFilter` and no tab
  is ever `"other"`, a row with a genuinely unmodeled category could never appear under *any* tab
  — not shown as "unsupported," simply invisible regardless of which tab the owner selected. Since
  restructuring the tab-filter architecture itself was out of this package's additive scope, these
  rows are now surfaced through the existing I.8A attention panel instead (new
  `unsupported_pipeline` attention reason) with a real link to the generic per-listing workspace
  — visible, truthful, and never fabricating a category-specific action for a category the
  dashboard doesn't otherwise understand.
- **Mascotas y Perdidos is now discoverable in Mis Anuncios.** Added as a real tab
  (`"mascotas"` in `MIS_ANUNCIOS_CATEGORY_KEYS`/`MIS_ANUNCIOS_CATEGORY_DEFS`, real
  `/publicar/mascotas-y-perdidos/quick` and `/clasificados/mascotas-y-perdidos/results` routes),
  and `listingRowCategoryKey()` now recognizes `"mascotas-y-perdidos"` — previously, rows with
  this category value were fetched by the same owner-scoped `fetchOwnerListingsForDashboard`
  query as every other `listings`-table category (confirmed unfiltered, same fact already
  established for Clases/Comunidad in I.6B) but could never appear under any tab, for the exact
  same "unmatched category" reason described above. `classifyOwnerDashboardRow()` was corrected
  to classify it `private` (not `unsupported` as I.8A originally had it) — it has real rows, a
  canonical UUID, and a safe public route (Gate I.6B); "no safe Edit route yet" is an
  action-availability fact, not a reason to exclude it from organizational grouping. It reuses the
  existing generic catch-all card exactly as Busco/Clases/Comunidad already do — that card never
  renders an Edit or Preview button at all, so Edit stays correctly absent with zero new gating
  logic required, and no Business Hub action was ever possible from that code path. No dedicated
  Mascotas editor or architecture was built.
- **Status display audit — completed for every live card family.** Two more real, evidence-backed
  bugs found and fixed (same bug class as Empleos/Viajes in I.8A — raw/default-green status):
  - **Restaurantes and Servicios** both render through the generic `DashboardCategoryListingCard`
    with a hardcoded-emerald pill showing the raw, untranslated DB status string — confirmed via
    each table's real CHECK constraint (`restaurantes_public_listings.status` ∈
    `{published, suspended, archived}`; `servicios_public_listings.listing_status` — a 9-value
    enum that already matches `ListingLifecycleStatus`'s own vocabulary 1:1). A suspended or
    archived restaurant, or a pending-payment service listing, previously displayed in the same
    green as a live one. Both now resolve through `resolveOwnerDashboardStatusDisplay()`, extended
    with a confirmed-real mapping table for each.
  - **Autos Privado** (`AutosClassifiedListingManageCard.tsx`) unconditionally rendered
    `isSold ? "Sold" : "Active"` — any status other than `"sold"` (paused, removed, expired,
    flagged, pending, ...) displayed as green "Active." Corrected to accept an optional,
    pre-resolved `uiStatus` prop (same pattern already used by the En Venta card and the generic
    catch-all card), computed by the page via the existing `resolveListingUiStatus`/
    `normalizeUiStatus` pipeline. Backward compatible — the prop is optional, so no other caller
    of this shared component is affected.
  - **Every other live card family was audited and confirmed already truthful, not touched:**
    Auto Dealers (parent/child) already delegates to a real `autosListingStatusLabelEs/En()`
    translator with no colored pill at all; Bienes/Rentas (`LeonixRealEstateListingManageCard`)
    already has its own hand-rolled but genuinely truthful 3-state pill (active/paused/archived)
    plus a neutral (not green) fallback for anything else; En Venta/Clases/Comunidad/Busco/
    Mascotas already share the centralized `resolveListingUiStatus`/`listingUiStatusLabel`
    pipeline; Comida Local already has its own dedicated, real `statusLabel()` translator.
    "Global status completion" is not claimed loosely — every family in Objective C's list was
    individually inspected and is either confirmed-truthful or corrected, recorded per-family in
    [Per-pipeline dashboard truth](#per-pipeline-dashboard-truth) below.
  - Unknown/unmapped raw status values still never display as active/published anywhere touched
    by this package (unchanged contract from I.8A, re-verified). No database status value and no
    status write path was altered by any of the above — display-only throughout.

## Work Package I.8A update log

**Retracted/corrected by I.8B, above:** this log's `dashboardOwnerClassification.ts` bullet
implied the classification helper shaped the dashboard; it did not — the helper existed and was
unit-tested but was never imported by `mis-anuncios/page.tsx`. It also classified Mascotas
`unsupported`, which conflated a real, already-fixed fact (a safe public route existed since I.6B)
with an actually-true-but-separate fact (Mascotas wasn't wired into the Mis Anuncios tab system
yet). Both are corrected above, not silently edited away.

Objective: one truthful global owner Mis Anuncios experience across the whole catalog — not a
redesign, not Admin, not Analytics. Three new, additive, pure helpers were added; the existing
Mis Anuncios page/components were wired to them narrowly, without restructuring the page's
existing per-source fetch/render architecture (documented in full below in
[Per-pipeline dashboard truth](#per-pipeline-dashboard-truth)).

- **`dashboardOwnerClassification.ts` — new.** One shared function,
  `classifyOwnerDashboardRow()`, answers three questions for any row from any pipeline: which
  organizational group it belongs in (`business` / `private` / `inventory_child` /
  `unsupported`), which canonical `CanonicalCategoryKey` pipeline it maps to, and whether it
  genuinely qualifies for Business Hub tooling. Business Hub eligibility is computed from the
  real, currently-live `resolveDashboardActions()` branches (restaurantes, servicios,
  bienes_raices_negocio, autos_negocios) — **not** from each adapter's `supportsBusinessHub`
  flag, which is broader than reality for two pipelines: Rentas Negocio and Viajes' business lane
  both declare `supportsBusinessHub: true` but `resolveDashboardActions()` never actually emits a
  coupons/offers/inventory action for either. This helper reports the narrower, true set. Never
  takes an owner id — cannot infer eligibility from ownership alone by construction.
- **`dashboardOwnerStatusDisplay.ts` — new.** Extends the existing `getStatusLabel`/
  `ListingLifecycleStatus` table (`app/lib/clasificados/listingLifecycleDomain.ts`) to the two
  dedicated-table categories that had no truthful status display at all: Empleos and Viajes. Both
  previously rendered their raw, untranslated DB status string inside a hardcoded-emerald pill on
  `DashboardCategoryListingCard` (e.g. a rejected Empleos listing showed the literal string
  `"rejected"` in a green "success" pill). Activates the previously-dead
  `mapEmpleosStatusToCanonical()` (zero importers before this package) — and fixes a real bug in
  it while activating it: `"pending_review"` was missing from its mapping table and silently fell
  back to `"draft"`, mislabeling a listing genuinely awaiting review as a draft. Adds a new
  Viajes mapper against the real, confirmed `ViajesStagedLifecycleStatus` enum
  (`viajesStagedListingTypes.ts`); `"changes_requested"` has no 1:1 canonical equivalent and is
  deliberately left unmapped (falls to an honest "unknown/needs attention" display, raw status
  preserved) rather than guessed. Never shows an unrecognized raw status as active/published.
  Rentas/BR/En Venta/Clases/Comunidad/Busco keep using their existing, already-centralized
  `resolveListingUiStatus`/`listingUiStatusLabel` pipeline, untouched — this helper only fills the
  two gaps that had nothing.
- **`dashboardAttentionItems.ts` — new.** One pure, additive attention-item resolver — no I/O, no
  background jobs, no notifications. Wired into the Mis Anuncios page as a compact panel (top of
  page, above the category selector) aggregating from data the page already computes: Empleos and
  Viajes rows (via the new status helper above) and Rentas rows (via the same
  `resolveListingLifecycle`/`RENTAS_LISTING_LIFECYCLE_CONFIG` the Rentas card's own renewal button
  already uses). Every item type maps to a real Objective D bullet (payment required, not public,
  suspended, expired, missing edit/public route, inventory child needing parent, addon inactive,
  renewal available) and is strictly gated on real, caller-supplied truth — the resolver
  distinguishes an *unevaluated* route (`undefined`, no claim made) from a *confirmed-missing* one
  (`null`, produces an info-severity item) so a category this pass didn't wire in full never gets
  a false "missing route" claim. Renewal items only ever appear when the caller passes a real,
  already-verified `hasRealAction: true` (Rentas today) — an expired listing with no real renewal
  path shows only the honest "expired" note, never a fabricated renewal CTA.
- **`DashboardCategoryListingCard.tsx` — narrow, backward-compatible addition.** New optional
  `statusTone` prop selects the status pill's color from the resolved display tone; omitted (any
  caller not yet updated — Restaurantes, Servicios, Autos-classified still pass only the raw
  `status` string today) keeps the exact previous hardcoded-emerald look, so this change cannot
  regress any category it wasn't specifically wired into.
- **`dashboardInventory.ts` — additive field.** `DashboardInventoryItem` gained an optional
  `statusDisplay` field, populated only by `buildEmpleosInventoryItems`/`buildViajesInventoryItems`
  today; every other builder is untouched.
- **`mis-anuncios/page.tsx` — narrow wiring only, not a rewrite.** The Empleos/Viajes card call
  sites now pass the resolved status label/tone instead of the raw string; one new `useMemo`
  aggregates attention items from data the page already fetches; one new, compact panel renders
  it. The existing 2,100+-line per-row render dispatch (`visible.map()`, the BR/Autos inventory
  sections, the dedicated-category blocks) was **not** restructured — this package deliberately
  did not rebuild the page.

## Per-pipeline dashboard truth

Objective D/Master-Ledger table for Work Package I.8A. `Discovery` = does a real owner query
surface this pipeline in Mis Anuncios (or its own dedicated dashboard) today. `Group` = the new
classification helper's output. `Hub` = Business Hub eligibility per the same helper (see the
I.8A update log above for why this is narrower than each adapter's `supportsBusinessHub` flag for
Rentas Negocio and Viajes business).

| Pipeline | Discovery | Group | Identity | Status display | Edit | Preview | Public | Lifecycle actions | Hub | Inventory/add-on | Leads | Analytics | Billing/renewal | Remaining gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `restaurantes` | yes, dedicated table + own `/dashboard/restaurantes` page, also surfaced on Mis Anuncios via `DashboardCategoryListingCard`, now with a live classification badge | business | sourceId UUID | **fixed in I.8B** — was raw untranslated string in a hardcoded-emerald pill (suspended/archived showed green); now truthful against the confirmed real `{published,suspended,archived}` DB enum | real | real | real | pause/resume via dedicated page (not re-audited here) | **yes** (parent, `couponsActive` entitlement, server-verified) | coupon-edit, real | none (global leads not built, per Objective H) | omitted (`analytics: "unproven"` per resolver comment) | no renewal path found | status audit complete |
| `servicios` | yes, dedicated table + own `/dashboard/servicios` page, also on Mis Anuncios, now with a live classification badge | business | sourceId UUID | **fixed in I.8B**, same pattern as Restaurantes; confirmed real 9-value DB enum already matches `ListingLifecycleStatus` 1:1 | real | real | real | own dedicated page | **yes** (parent, `offersActive` entitlement, server-verified) | offers-edit, real | none | real (`/dashboard/analytics`) | no renewal path found | status audit complete |
| `bienes_raices_negocio` | yes, shared `listings` table + dedicated inventory-grouping section | business (parent) / inventory_child (child) | sourceId UUID, `br_inventory_group_id` grouping | own hand-rolled pill logic (`LeonixRealEstateListingManageCard`), not the centralized helper — pre-existing, not touched | real, parent-only (I.5.7A.1 protection) | real, parent-only | real | pause/resume/archive/mark sold; BR-Negocio-only global attention line (Gate G.2.2) | **yes**, parent only — but `resolveDashboardActions()` is called with a hardcoded `entitlement: {}` at both live call sites, so the resolver itself never actually emits `manageInventory`; real inventory-management functionality exists via a separate legacy href fallback, not through the entitlement-gated resolver path (pre-existing architecture, confirmed again here) | `BrNegocioListingInventoryActions` (real actions for parent, static label only for child) | none | real (`genericWorkspaceAnalyticsHref`, both roles) | inventory-pack checkout exists (not a base-listing renewal) | resolver/entitlement wiring gap noted above is a real, confirmed, pre-existing architecture split — not resolved in I.8A |
| `bienes_raices_privado` | yes, shared `listings` table | private | sourceId UUID | shared centralized helper (unaffected) | **missing** (pre-existing, unchanged) | real | real | pause/resume/archive | no (correctly) | not_applicable | none | omitted | none | no confirmed edit route (unchanged) |
| `autos_negocios` | yes, shared `autos_classifieds_listings` table + dedicated inventory section | business (parent) / inventory_child (child) | sourceId UUID | own logic, not re-audited | real, parent-only | real, **child-bound** (confirmed asymmetry vs BR) | real | group-level pause/resume via dedicated section | **yes**, parent — `manageInventory` genuinely ungated (no entitlement check), documented pre-existing asymmetry vs Bienes | real, parent | none | real when `status === "active"` | inventory-pack checkout exists | ungated-vs-BR asymmetry is pre-existing, not resolved here |
| `autos_privado` | yes, shared table, now with a live classification badge | private | sourceId UUID | **fixed in I.8B** — `AutosClassifiedListingManageCard` previously showed every non-"sold" status as green "Active" (paused/removed/expired/flagged all displayed as Active); now accepts a real resolved `uiStatus` from the existing `resolveListingUiStatus` pipeline | real | real | real | pause/resume/archive | no (correctly) | not_applicable | none | omitted | none | no exported href-builder constant (pre-existing); status audit complete |
| `rentas_negocio` | yes, shared `listings` table | business (organizational — seller_type=business) | sourceId UUID | shared centralized helper; **now feeds I.8A attention center** (pending_payment/expired/renewal via `resolveListingLifecycle`) | **real** (I.7A fix) | real | real (dedicated `/clasificados/rentas/listing/{id}`) | pause/resume/archive/mark sold + **real renewal button** (`rentas_30d`, Revenue OS checkout) | **no** — `supportsBusinessHub: true` on the adapter, but `resolveDashboardActions()` never emits any coupons/offers/inventory action for Rentas; I.8A's classifier reports this correctly rather than the aspirational flag | none live | none | omitted | **real, live** — confirmed working renewal CTA | I.7A-confirmed query-error-falls-to-INSERT gap in the shared BR/Rentas publish core, deliberately deferred (locked-adjacent); no reuse protection outside `pending_payment` activation |
| `rentas_privado` | yes | private | sourceId UUID | same pipeline as Negocio | real (I.7A) | real | real | same as Negocio, same real renewal button | no | none | none | omitted | real | same deferred gaps as Negocio |
| `empleos` | yes, dedicated table, own `/dashboard/empleos` page + Mis Anuncios tab | private | sourceId UUID (own table, not `listings`) | **fixed in I.8A** — was raw untranslated string in a hardcoded-emerald pill; now truthful (including the `pending_review` mapping bug fixed while activating `mapEmpleosStatusToCanonical`) | real (dedicated `/dashboard/empleos/{id}`) | real, lane-specific | real | publish/pause/archive via `PATCH lifecycle_status` (I.7A repaired existing-identity fail-closed on create/update) | no | not_applicable | none | real (`provenInventoryAnalyticsHref` includes empleos) | no renewal path found | now feeds I.8A attention center (pending_review/rejected/unknown/not-public) |
| `en_venta` | yes, shared `listings` table | private | sourceId UUID | shared centralized helper (unaffected) | real, generic editor (I.6A) | real | real | pause/resume/archive/republish | no | not_applicable | none | omitted | republish window (not a paid renewal) | unchanged |
| `comida_local` | yes, dedicated table + dedicated section component | business (organizational) | sourceId UUID | own dedicated component, not re-audited | real | real | category_specific | not re-audited | no (no live resolver action) | not_applicable | none | omitted | none | results route stale (dupes entry), pre-existing, not touched |
| `ofertas_locales` | **confirmed intentionally excluded from Mis Anuncios** — has its own dedicated `/dashboard/ofertas-locales` surface | not_applicable | n/a | n/a | n/a | n/a | n/a | n/a | not_applicable (own surface) | dedicated | none | omitted | n/a | intentional separation, confirmed again by I.8A, not a gap |
| `busco` | yes, shared `listings` table | private | sourceId UUID | shared centralized helper | real, generic editor (I.6A) | real | real | archive | no | not_applicable | none | omitted | none | unchanged |
| `clases` | yes | private | sourceId UUID | shared centralized helper | real, generic editor (I.6A) | real | real | archive | no | not_applicable | none | omitted | none | unchanged |
| `comunidad` | yes | private | sourceId UUID | shared centralized helper | real, generic editor (I.6A) | real | real | archive | no | not_applicable | none | omitted | none | unchanged |
| `mascotas_y_perdidos` | **fixed in I.8B — now discoverable.** Real tab added (`"mascotas"` in `MIS_ANUNCIOS_CATEGORY_KEYS`), `listingRowCategoryKey()` recognizes it, real owner-scoped rows already flowed through the existing unfiltered `fetchOwnerListingsForDashboard` query (same fact as Clases/Comunidad, I.6B) | private (corrected from I.8A's `unsupported` — real rows, real UUID, real public route now existed even then; I.8A's classification was the stale part, not the underlying facts) | sourceId UUID | shared centralized helper (unaffected) | **missing**, no safe editor exists yet — unchanged, correctly still absent (`categoryRouteRegistry.ts` `editRoute()` still returns `null`) | n/a | real (I.6B) | archive, via the same generic mechanism as Busco/Clases/Comunidad | no | not_applicable | none | omitted | none | Edit remains the one real, confirmed, unbuilt gap — reported here, not fabricated |
| `viajes` | yes, but via its **own dedicated `/dashboard/viajes` page, entirely bypassing the registry/resolver** (I.7A finding, confirmed again) | business (business lane, organizational) / private (private lane) | sourceId UUID (own `viajes_staged_listings` table, slug-keyed for public/edit/preview) | **fixed in I.8A**, same pattern as Empleos — real `ViajesStagedLifecycleStatus` enum now mapped truthfully | real, via the dedicated page's own hrefs, not through the registry | real, same | real (I.7A fix, `oferta/[slug]`) | publish/unpublish via the dedicated page | **no** — same reasoning as Rentas Negocio: adapter says `supportsBusinessHub: true`, resolver never emits a hub action | none live | none | omitted | no renewal path found | dedicated dashboard still bypasses the canonical registry/resolver entirely — architecture gap, not a truth gap; now feeds I.8A attention center |

## Work Package I.7A update log

- **Empleos — publish CTA reconciled.** The landing page's hero "Publish a job" button
  (`EmpleosLandingPageClient.tsx`) called the legacy `categoryStandardRoutes.categoryPublishPath("empleos")`
  builder (`/clasificados/publicar/empleos`), which only reaches the real application form via an
  extra (safe, tested) redirect hop. It now calls `EMPLEOS_PUBLISH_HUB_PATH` (`empleosLandingRoutes.ts`)
  directly — the same constant the registry's `applicationRoute` already used — removing the
  indirection. The redirect shim itself (`/clasificados/publicar/empleos/page.tsx`) is left in place
  as a compatibility path for any other still-uncorrected inbound link.
- **Empleos — existing-listing identity now fails closed.** `upsertEmpleosListingFromEnvelope()`
  (`empleosPublicListingsDbServer.ts`) previously treated a candidate `listingId` that was
  malformed, or well-formed but pointing at no existing row, the same as "no candidate at all" —
  silently minting/reusing an id and inserting under it. It now distinguishes the two: no
  `listingId` supplied at all still inserts normally (truly new application, unchanged); a
  supplied `listingId` that is not a valid UUID, or is valid but matches no row, now fails closed
  with the shared `quick_listing_existing_identity_invalid` code (reused from
  `quickListingIdempotency.ts`, the same constant I.6C introduced for Quick Clasificados) instead
  of inserting. Owner-mismatch (`forbidden`) and lane-mismatch (`lane_mismatch`) were already
  fail-closed and are unchanged. `app/api/clasificados/empleos/listings/route.ts` now maps the new
  code to `400`. No caller changes were needed for draft preservation — the application clients
  already only clear local state on a successful response.
- **Rentas — Edit corrected.** Both `rentas_negocio` and `rentas_privado` adapters declared
  `editRoute: () => null` despite a real, live, working edit entry point
  (`rentasDashboardEditHref()` in `LeonixRealEstateListingManageCard.tsx`, backed by a confirmed
  real API, `/api/clasificados/rentas/listing-edit`). Both adapters now mirror that exact href
  shape (`/clasificados/publicar/rentas/{negocio,privado}?edit=1&source=dashboard&mode=listing-edit&listingId=...&lane=...&lang=...&returnTo=...`,
  plus `leonixAdId` when known) instead of returning null — same bug class and fix pattern as the
  Restaurantes (I.5.7E) and En Venta/Busco/Clases/Comunidad (I.6A) Edit corrections.
- **Rentas — reuse-vs-insert query-error gap identified, deliberately NOT fixed here.** Audit
  confirmed `leonixPublishRealEstateListingCore.ts`'s pending-payment reuse check silently falls
  through to INSERT when the reuse lookup itself errors (the same "verification failure becomes a
  silent insert" bug class I.6C fixed for Quick Clasificados) — but that function is genuinely
  shared with Bienes Raíces (`category === "rentas" || (category === "bienes-raices" && sellerType
  === "business")` gates the exact same reuse block). Bienes Raíces is a locked system for this
  package. Fixing the query-error branch would necessarily change live Bienes Raíces publish
  behavior too, so this package leaves it untouched and records it here as a real, confirmed,
  unresolved gap rather than silently repairing it out of scope. See
  [Rentas duplicate-row protection gap](#rentas-duplicate-row-protection-gap).
- **Rentas — two-live-renderer / default-lane decision: OWNER DECISION REQUIRED, unchanged.** Two
  live public renderers exist for a Rentas row today (the dedicated `/clasificados/rentas/listing/{id}`
  canonical route, and the shared `/clasificados/anuncio/{id}` shell, deliberately kept as a
  compatibility fallback since Gate I.5.4D) with only the former sharing Preview's exact
  WYSIWYG contract. Deciding whether to retire/redirect the shell path, or formally adopt it, is a
  genuine product/architecture decision, not a code bug — not resolved here, consistent with the
  ledger's pre-existing "Rentas default-lane decision" entry in
  [Unresolved Route Debt](#unresolved-route-debt).
- **Viajes — `publicRoute()` corrected.** The registry's "two competing detail trees, confirmed
  ambiguity" framing (Gate I.5A) was re-audited and found stale:
  `/clasificados/viajes/negocio/[slug]` is dead, production-disabled demo-catalog code that never
  reads real data; `/clasificados/viajes/oferta/[slug]` is the one real, live, correctly-lane-aware
  public detail route, serving both the Negocios and Privado lanes from `viajes_staged_listings`,
  gated on `is_public = true`. `publicRoute()` now echoes a precomputed `identity.publicUrl`
  (same pattern already used by the Empleos adapter for the same slug-vs-UUID reason) instead of
  unconditionally returning null.
- **Viajes — `editRoute()`/`previewRoute()` deliberately left null.** Real, working, lane-specific
  edit/preview destinations do exist (`/publicar/viajes/{negocios,privado}?stagedId=...`,
  `/clasificados/viajes/preview/{negocios,privado}?stagedId=...`) — but no live code today
  constructs a `ListingIdentity` for the `viajes` pipeline carrying the lane needed to build them
  generically, and the real `/dashboard/viajes` page builds these hrefs itself, entirely bypassing
  this registry/`resolveDashboardActions` pipeline. Returning null here is the honest state, not a
  guess — see [Viajes registry/live-UI gap](#viajes-registrylive-ui-gap).

## Work Package I.6C update log

- **Unknown listing category now fails closed — corrected.** I.6B's `coerceCategoryKey()` last-
  resort fallback (any category value not in `CATEGORY_KEYS`, not `"bienes-raices"`, and not an En
  Venta slug) still silently mapped to `"en-venta"` — the exact same bug class as the Mascotas
  root cause, just for any *future or malformed* unmodeled category instead of a specific known
  one. **"Unknown categories fail closed" was not actually true after I.6B; it is TRUE only as of
  this package.** Fixed by adding `isRecognizedListingCategory()` in
  `app/(site)/clasificados/anuncio/[id]/page.tsx`, run before `mapDbListingRowToListing()` on
  every live-fetched row; a genuinely unrecognized category now takes the exact same fail-closed
  path already used for unpublished/removed/inactive rows (`setFetchedListing(undefined)`,
  rendering the existing truthful not-found state) instead of reaching `coerceCategoryKey`'s
  fallback at all. Every previously-supported category, including Mascotas y Perdidos, is
  unchanged — `isRecognizedListingCategory` mirrors the exact same set of values
  `coerceCategoryKey` maps to a real category.
- **Existing-listing identity verification failure no longer falls back to INSERT.** I.6B's
  `verifyQuickListingReusable` already fails closed and *reports* why (missing, invalid UUID,
  not-found, owner-mismatch, category-mismatch, query-error), but all four publishers (En Venta,
  Busco, Clases, Comunidad) still unconditionally fell back to a fresh INSERT on any verification
  failure — including invalid/unauthorized/wrong-category candidates, not just a genuinely absent
  one. That meant a failed *existing*-listing identity could silently become a *new* listing
  instead of a hard stop. Each publisher now branches three ways: no candidate id at all → INSERT
  (unchanged, truly-new behavior); a candidate id that verifies → UPDATE that exact row
  (unchanged); a candidate id that fails verification for any reason → fail closed, return the new
  deterministic `quick_listing_existing_identity_invalid` error
  (`quickListingExistingIdentityInvalidMessage()` in `quickListingIdempotency.ts`), never INSERT,
  never expose the raw Supabase/Postgres error (logged internally via
  `logQuickListingReuseFailure()` only). The local draft and the session-persisted candidate id are
  both left untouched on this path — the caller components already only clear/persist them on a
  successful publish, so no caller changes were needed. The user can still explicitly start a new
  listing through the existing start-over action; a failed identity check no longer does that for
  them silently.
- **Duplicate prevention claim corrected.** Still not perfect idempotency — see
  [Duplicate-Row Prevention Scope](#duplicate-row-prevention-scope), unchanged by this package.
  What changed here is narrower and orthogonal: ordinary retries of the same in-progress
  submission remain mitigated (I.6B), and now a *broken* existing-identity check is guaranteed to
  never silently create a second row either. The one remaining, explicitly-documented gap is still
  the true concurrent first-submit race, which requires server-side idempotency support/schema
  work out of scope here.

## Work Package I.6B update log

- **Mascotas y Perdidos public rendering — repaired.** Root cause (Gate I.6A finding, deepened):
  the shared multi-category shell's `CATEGORY_KEYS` allowlist
  (`app/(site)/clasificados/anuncio/[id]/page.tsx`) omitted `"mascotas-y-perdidos"`, silently
  coercing every real Mascotas listing to render as En Venta. Fixed by adding the category to the
  allowlist and adding a dedicated dispatch branch rendering a new, small, category-specific
  component (`MascotasPerdidosPublishedDetailPage.tsx`, built from this category's own
  `detail_pairs` contract — notice type, last-known location, contact — mirroring the same field
  layout as the existing Preview client for genuine WYSIWYG parity, not a copy of the En Venta
  renderer). The registry's `publicRoute` is now real (`/clasificados/anuncio/{id}`); `editRoute`
  remains intentionally null — public rendering being fixed does not by itself create a safe
  category-specific edit surface.
- **Every other shell-served category protected.** Regression-tested (`gate-i6b-*`) at the source
  level (the shell cannot be imported into a Node test — it statically imports a `.png` asset,
  same DOM-bound-file limitation as elsewhere in this repo's test convention) to confirm every
  previously-accepted category remains in the allowlist unchanged, every category's own dispatch
  branch/hook is untouched, and the last-resort `"en-venta"` fallback is still scoped only to
  genuinely unmodeled category values, not widened.
- **Duplicate-row prevention added for En Venta, Busco, Clases, and Comunidad.** A new small
  shared helper (`app/(site)/clasificados/lib/quickListingIdempotency.ts`) verifies — server-side,
  via the same RLS-enforced `listings` table every publisher already uses — that a session-
  persisted candidate listing UUID genuinely belongs to the current owner and expected category
  before a publisher UPDATEs it instead of inserting a new row. At the time of this package, any
  verification failure (missing, invalid, not-found, owner-mismatch, category-mismatch,
  query-error) fell back to the original insert-only behavior — **corrected in Work Package I.6C**:
  only a genuinely absent candidate (no existing-listing intention at all) still falls back to
  INSERT; a present-but-failed-verification candidate now fails closed instead, see the
  [I.6C update log](#work-package-i6c-update-log). See
  [Duplicate-Row Prevention Scope](#duplicate-row-prevention-scope) for exactly what window this
  protects and the remaining, explicitly-documented race.
- **Clases/Comunidad dashboard discovery corrected.** `fetchOwnerListingsForDashboard` was
  confirmed (direct inspection) to query by `owner_id` only, with no category filter — Clases/
  Comunidad rows were already being fetched, and the existing generic Mis Anuncios card already
  renders working View public/Edit/Results/Archive actions for them. Only the stale `ready: false`
  / `manageHref: () => null` declarations in `dashboardMisAnunciosCategories.ts` were wrong; both
  now mirror the already-working `busco` entry's exact shape. No new dashboard architecture was
  built. The category route **registry's** `dashboardRoute` field remains `null` for both — that
  field specifically means "no dedicated category tab," which is still accurate; the generic
  cross-category workspace is a separate, already-existing system.

## Duplicate-row prevention scope

**What is protected:** the exact scenario the I.6A audit found — a retry or refresh of the *same
in-progress submission* (before it fully completes) now updates the row that submission already
created, instead of inserting a second one. The candidate UUID is written to a plan/category-
scoped sessionStorage key as soon as the row id is known (before the slower photo-upload step),
verified server-side before every reuse, and cleared once the submission fully completes.

**What is NOT claimed:** perfect idempotency. Two truly concurrent submit clicks that both fire
before either request's row id round-trips back to the browser can still both reach the insert
branch and create two rows — the pre-existing `disabled={busy}` button guard narrows this window
but does not eliminate it, and closing it fully would require either a server-side idempotency key
(not present in the current schema, and adding one is out of scope — no migrations were made) or
a more invasive request-serialization change. This is the one remaining race condition, stated
plainly rather than glossed over.

The mechanism deliberately does **not** persist across a later, unrelated visit to the same
publish form — once cleared on success, a genuinely new submission starts fresh. Editing an
already-published listing later is the dashboard's generic `/editar` page's job (Gate I.6A), not
this mechanism's.

## Work Package I.5.8 update log

- **Empleos results duplication — resolved.** `buildEmpleosResultadosUrl` (the shared builder
  behind ~30 live public call sites) and `EMPLEOS_RESULTS_PATH` now both generate
  `/clasificados/empleos/resultados`, matching the registry. The legacy `/results` URL remains
  live as an unchanged compatibility wrapper page.
- **Autos legacy publish-map entry — correction to the prior finding, not a fix.** Direct
  re-verification proved `categoryPublishPath("autos")`'s value (`/clasificados/publicar/autos`)
  is a real, compiled route with a confirmed live caller
  (`app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts`) — it was **not** stale. Left
  completely untouched.
- **Viajes legacy publish-map entry — resolved.** Confirmed the mapped folder does not exist in
  the compiled route manifest and has zero live callers, then corrected the value to match the
  real, registry-declared `applicationRoute` (`/publicar/viajes`). Zero live behavior change,
  since nothing called the old value.
- **Bienes/Autos parent-child action protection — regression coverage added**, exercised through
  the actual `resolveDashboardActions` resolver (not just adapter internals or comments).

## Work Package I.6A update log

- **En Venta, Busco, Clases, Comunidad — Edit corrected.** Same bug class as the Restaurantes
  fix (Gate I.5.7E): the registry declared `editRoute: () => null` for all four, but a real,
  generic, owner-verified, UPDATE-by-UUID edit page
  (`app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx`) already existed and was already
  live-wired in the UI for every `listings`-table category. All four now resolve to
  `/dashboard/mis-anuncios/{id}/editar?lang=`, matching the exact, confirmed real query shape
  (no invented params). The generic editor covers title/price/description/photos/status only —
  not each category's full field set.
- **Duplicate-row risk documented, not repaired.** For all four categories, re-running the
  category's own publish/quick-form flow always INSERTs a fresh row (no update-if-exists check
  against a canonical listing ID) — there is no way to target the category's own creation UI at
  an already-published listing, only the generic editor above. This is a real, structural risk on
  double-submit or "go back and republish," documented in each adapter's `knownLimitations`, not
  fixed in this package (would require new product UI, out of a route-closure package's scope).
- **Mascotas y Perdidos public-route root cause identified, deliberately left unsafe-to-flip.**
  Deepened the prior "confirmed gap" finding: result cards do navigate to the shared
  `/clasificados/anuncio/{id}` shell, and the shell does fetch the row — but its category
  allowlist (`CATEGORY_KEYS` in `app/(site)/clasificados/anuncio/[id]/page.tsx`) does not include
  `"mascotas-y-perdidos"`, so `coerceCategoryKey()` silently rewrites the row to `"en-venta"` and
  renders the wrong layout (wrong cross-links, no lost/found/adoption badge, price shown
  incorrectly, notice-type/location shown only as raw generic rows). `publicRoute()` remains
  `null` on purpose — pointing it at a URL that mis-renders would be worse than the honest gap.
  Fixing the shell is out of scope for a Quick-Clasificados-only package, since that same shared
  file also serves Rentas/Bienes Raíces/Autos/Empleos/Servicios (all locked for this package).
  `gate-i6a-quick-clasificados-lifecycle-selftest.ts` now source-level-asserts the allowlist gap
  is still present, closing the "invisible to the test suite" coverage gap Gate I.5.7F left open.
- **`/publicar/community/` "separate tree" concern retracted.** Direct inspection confirms it is
  not a standalone routable page at all — it is purely the shared implementation
  (`CommunityQuickApplicationClient({kind})`) both `/publicar/clases/quick` and
  `/publicar/comunidad/quick` import from. Not a duplicate product, not a fork.

## Runtime authority

Two route systems are simultaneously live today, on **non-overlapping runtime surfaces**
(confirmed in Gate I.5.7D-R):

- **`app/lib/listingIdentity/categoryRouteRegistry.ts`** ("the registry") — serves the `/publicar`
  gateway resolver, the Clasificados landing hub's per-category cards, and — transitively, through
  `dashboardActionResolver.ts` — every dashboard action button (Edit, Preview, View public,
  Analytics, secondary-manage links).
- **`app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts`** ("the legacy
  builder") — serves each category's own landing-page default publish CTA (only 2 real call
  sites: Empleos' hero CTA, and the generic `CategoryStandardLandingPage.tsx` shared template) and
  the majority of results/search/browse link generation across Busco/Clases/Comunidad/Mascotas/
  Servicios/generic components.

Neither system imports or delegates to the other. Preview and Edit-URL generation for BR
Negocio/Autos Negocios inventory children is **not owned by either system** — see
[External Safety Protections](#external-safety-protections).

## Confirmed global contracts

Proven true across the catalog, enforced by the self-test:

- Every adapter's `sourceId` is a real database UUID, never a slug or draft ID.
- Unsupported route capabilities fail closed to `null` — never a guessed or fabricated URL.
- ES/EN language is appended consistently (`&lang=es|en`), defaulting to `es`.
- Restaurantes existing-listing **Edit** is now supported (Gate I.5.7E) — `mode=listing-edit`,
  distinct from the coupon-only `mode=coupon-edit` sub-flow.
- Bienes Raíces (both lanes) canonical results route is `/clasificados/bienes-raices/resultados`
  (Gate I.5.7C) — the shared `BR_RESULTS` constant no longer generates the legacy `/results` slug.
- All dashboard actions require server-verified ownership (`ownerVerified`) before any route is
  resolved — the resolver's only hard rejection; every other omission is per-action.
- Exactly two pipelines (`bienes_raices_negocio`, `autos_negocios`) declare parent/child inventory
  support; exactly two (`restaurantes`, `servicios`) declare the coupon/offer add-on sub-flow.
  `autos_privado` and `bienes_raices_privado` are registered as separate adapters specifically so
  their exclusion from parent/child behavior is explicit, not implied by omission.

## Category adapters

Differences that are genuine, evidence-backed product behavior — not accidental duplication:

- **Servicios** publish is a real 2-hop funnel: a paywall/checkpoint page
  (`/clasificados/publicar/servicios/checkpoint`) precedes the deep application form
  (`/publicar/servicios`). Neither route system alone models this; both are correct for their hop.
- **Bienes/Autos Negocio vs Privado** — separate adapters per lane; Negocio carries
  `supportsParentChildInventory: true` and an inventory-pack `secondaryManageRoute`, Privado does
  not.
- **En Venta** — application route is a documented temporary exception (no modern `/publicar/`
  hub exists). Edit is now the generic Mis Anuncios editor (I.6A) — the category's own Pro/Free
  form has no "edit existing" mode.
- **Ofertas Locales** — has its own dedicated `/dashboard/ofertas-locales` surface, deliberately
  excluded from Mis Anuncios. Cupones is confirmed **not** a separate pipeline — `/cupones` renders
  the identical component with `surface="cupones"`.
- **Clases / Comunidad** — share one implementation (`CommunityQuickApplicationClient({kind})`,
  confirmed by direct inspection, not a fork). `dashboardRoute()` intentionally returns `null` —
  confirmed `ready:false` in the live Mis Anuncios config, meaning no *dedicated category tab*
  exists — but a generic, non-category-gated per-listing workspace/editor is reachable once the
  owner has the listing's UUID (I.6A).
- **Autos Negocios Preview** is genuinely bound to a child vehicle's own `sourceId` (unlike Edit)
  — `AutosNegociosPreviewClient` fetches and hydrates by whatever ID it's given.

## External safety protections

**Neither route system provides parent/child edit safety on its own.** The self-test proves this
directly: calling `BIENES_RAICES_NEGOCIO_ADAPTER.editRoute()` or `AUTOS_NEGOCIOS_ADAPTER.editRoute()`
with a child identity (populated `parentSourceId`) still substitutes the **parent's** ID —
unconditionally, with no internal role check. The real protection is external and lives in two
independent layers that must both be bypassed for the Gate I.5.7A.1-class defect to reappear:

1. `dashboardActionResolver.ts` — a single shared line excludes `edit` (and, for Bienes only,
   `preview`) for a `child` role on exactly `bienes_raices_negocio` and `autos_negocios`.
2. `LeonixRealEstateListingManageCard.tsx`'s `isBrNegocioMainRow` gate (Gate I.5.7A.1) and the
   analogous check in `AutosDealerInventoryDashboardSection.tsx` — independently refuse to even
   attempt resolving an edit/preview href for non-main rows.

Autos' inventory-pack `secondaryManageRoute` additionally carries a confirmed **asymmetry**: Bienes
gates it on an active entitlement (`inventoryPackActive`); Autos does not (renders unconditionally
for any parent) — an existing live behavior difference, not something introduced here.

## Unresolved route debt

| Item | Current evidence |
|---|---|
| ~~Empleos results duplication~~ | **Resolved in Work Package I.5.8.** `buildEmpleosResultadosUrl` and `EMPLEOS_RESULTS_PATH` now both generate `/clasificados/empleos/resultados`. Legacy `/results` remains a live compatibility wrapper. |
| ~~Autos stale publish-map entry~~ | **Not actually stale — corrected finding, not a fix.** Gate I.5.7D-R's original claim was wrong: `categoryPublishPath("autos")` → `/clasificados/publicar/autos` is a real, compiled route with a confirmed live caller (`negociosLocalesLanes.ts`). Left untouched in Work Package I.5.8 after re-verification. |
| ~~Viajes stale publish-map entry~~ | **Resolved in Work Package I.5.8.** `categoryPublishPath("viajes")` confirmed to map to a nonexistent folder with zero live callers, then corrected to the real `applicationRoute` (`/publicar/viajes`). Zero live behavior change. |
| **Bienes/Autos parent-child protection lives outside the registry** | Still true — see [External Safety Protections](#external-safety-protections). Work Package I.5.8 added executable regression coverage for this (`gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts`) but did not change the architecture itself — a structural risk remains if any future caller invokes `adapter.editRoute()` directly without the external gate. |
| ~~Autos child-action regression coverage gap~~ | **Addressed in Work Package I.5.8.** `gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts` now exercises the real `resolveDashboardActions()` resolver for both Bienes and Autos Negocio parent/child identities. |
| **Rentas default-lane decision** | **OWNER DECISION REQUIRED, unchanged as of I.7A.** Both lanes share one `hubRoute` (`/clasificados/publicar/rentas`) distinct from either lane's own `applicationRoute`. The dashboard's default Rentas publish CTA goes straight to Privado, skipping the hub chooser — a product decision, not a bug, but undocumented in the registry itself. I.7A re-confirmed this is genuinely a product choice (which lane/renderer is canonical for public Rentas at launch), not a code bug, and left it untouched. |
| **Missing quick-category test coverage** | Before Gate I.5.7F, Ofertas Locales, Cupones, Comida Local, and each quick-listing category (Busco/Clases/Comunidad/Mascotas/Viajes) had no dedicated route-contract test, only generic pass-through coverage via `gate-i5-1`. The matrix now covers all 17 pipelines uniformly. |
| ~~En Venta / Busco / Clases / Comunidad missing Edit~~ | **Resolved in Work Package I.6A.** All four now resolve to the real, generic, owner-verified `/dashboard/mis-anuncios/{id}/editar` page — same bug class and fix pattern as the Restaurantes correction (I.5.7E). |
| ~~En Venta / Busco / Clases / Comunidad duplicate-row risk on republish~~ | **Mitigated in Work Package I.6B, not eliminated.** Each publisher now verifies and reuses a session-persisted, owner+category-checked canonical UUID instead of always inserting. This closes the in-flight retry/refresh window. It does NOT protect a later, unrelated visit to the same form (by design — that's the generic editor's job) or two truly concurrent submit clicks racing before either round-trips a row id (documented, not solved — see [Duplicate-Row Prevention Scope](#duplicate-row-prevention-scope)). |
| ~~Mascotas public-route root cause~~ | **Repaired in Work Package I.6B.** The shared `anuncio/[id]` shell's `CATEGORY_KEYS` allowlist now includes `mascotas-y-perdidos`, and a dedicated `MascotasPerdidosPublishedDetailPage` component renders it correctly. `publicRoute()` is now real. Editing remains unsupported (no safe category-specific editor exists yet). |
| **Future shared facade / legacy-builder retirement** | Still explicitly deferred — Gate I.5.7D-R's Table G places this as the last wave (Wave 8/9), after the smaller corrections land and prove the pattern repeatedly. Not attempted here. |
| ~~Empleos publish-CTA slug disagreement~~ | **Resolved in Work Package I.7A.** `EmpleosLandingPageClient.tsx`'s hero CTA now calls the canonical `EMPLEOS_PUBLISH_HUB_PATH` (`/publicar/empleos`) directly instead of the legacy `categoryStandardRoutes` builder's `/clasificados/publicar/empleos`. The legacy value still works via a tested, single-hop redirect shim, kept for any other still-uncorrected inbound link. |
| ~~Empleos existing-identity duplicate-row risk~~ | **Fixed in Work Package I.7A.** `upsertEmpleosListingFromEnvelope()` now fails closed (shared `quick_listing_existing_identity_invalid` code) on an invalid or not-found candidate `listingId`, instead of silently inserting under it. Owner/lane mismatch were already fail-closed. |
| ~~Rentas missing Edit~~ | **Resolved in Work Package I.7A.** Both `rentas_negocio`/`rentas_privado` adapters now resolve `editRoute()` to the real, live href shape already used by `LeonixRealEstateListingManageCard.tsx`'s `rentasDashboardEditHref()`, instead of returning null. |
| **Rentas duplicate-row protection gap** | **Confirmed, deliberately NOT fixed in I.7A.** `leonixPublishRealEstateListingCore.ts`'s pending-payment reuse-vs-insert check silently falls through to INSERT if the reuse lookup query itself errors — the same bug class I.6C fixed for Quick Clasificados. Left untouched because this function is genuinely shared with the locked Bienes Raíces pipeline (the same reuse block runs for `category === "bienes-raices" && sellerType === "business"`); a scoped Rentas-only fix isn't possible without touching locked BR publish behavior. Also: outside `activationMode === "pending_payment"`, Rentas has no reuse-vs-insert protection of any kind — every immediate/free-activation publish always inserts. Both are real, evidence-backed gaps, not resolved here. |
| ~~Viajes public-route "confirmed ambiguity"~~ | **Corrected finding in Work Package I.7A, not merely resolved — the prior finding itself was stale.** Direct re-inspection found `/clasificados/viajes/negocio/[slug]` is dead, production-disabled demo code (never reads real data), while `/clasificados/viajes/oferta/[slug]` is the one real, live, lane-aware public detail route. `publicRoute()` now echoes `identity.publicUrl` (same pattern as Empleos) instead of unconditionally returning null. |
| **Viajes registry/live-UI gap** | Still true as of I.7A. The real, working Viajes dashboard experience (`/dashboard/viajes`, edit/preview/view-public all functioning) is delivered entirely by that page's own bespoke, hand-written route-building logic — it never constructs a `ListingIdentity` or calls `resolveDashboardActions()`/the registry. `editRoute()`/`previewRoute()` remain honestly null here rather than fabricated, since this registry cannot currently determine which lane (negocios/privado) a given identity used. |

## Full pipeline matrix

Classification legend: `supported` · `intentionally_unsupported` (confirmed absent by design) ·
`category_specific` (adapter behavior, not a gap) · `protected_externally` (resolves a value here,
but real safety is enforced one layer above) · `missing` (confirmed gap or stale value) ·
`not_applicable`.

| Pipeline | Family | Application | Edit | Preview | Public | Results | Dashboard | Secondary manage | Parent/child |
|---|---|---|---|---|---|---|---|---|---|
| `restaurantes` | Negocios | supported | **supported** (I.5.7E) | intentionally_unsupported | category_specific | supported | supported | supported (coupon-edit) | no |
| `servicios` | Negocios | supported (2-hop) | supported | supported | category_specific | supported | supported | supported (offers-edit) | no |
| `bienes_raices_negocio` | Negocios | supported | protected_externally | protected_externally | supported | **supported `/resultados`** (I.5.7C) | supported | category_specific (inventory) | **yes** |
| `bienes_raices_privado` | Clasificados | supported | missing | supported | supported | supported (shared) | supported | not_applicable | no |
| `autos_negocios` | Negocios | supported | protected_externally | supported (child-bound) | supported | supported | supported | category_specific (inventory, ungated) | **yes** |
| `autos_privado` | Clasificados | supported | supported | supported | supported | supported | supported | not_applicable | no |
| `rentas_negocio` | Negocios | supported | **supported** (I.7A) | supported | supported | stale (`/results`) | supported | not_applicable | no |
| `rentas_privado` | Clasificados | supported | **supported** (I.7A) | supported | supported | stale (`/results`) | supported | not_applicable | no |
| `empleos` | Clasificados | **supported** (I.7A, CTA fixed) | supported | intentionally_unsupported (lane-ambiguous) | category_specific | **supported `/resultados`** (I.5.8) | supported | not_applicable | no |
| `en_venta` | Clasificados | category_specific (temp exception) | **supported** (I.6A, generic editor) | supported | supported | supported | supported | not_applicable | no |
| `comida_local` | Negocios | supported | missing | supported | category_specific | stale (dupes entry) | supported | not_applicable | no |
| `ofertas_locales` | Negocios | supported | supported | supported | category_specific | supported | supported (dedicated) | not_applicable | no |
| `busco` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | supported | not_applicable | no |
| `clases` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | intentionally_unsupported (no dedicated tab) | not_applicable | no |
| `comunidad` | Clasificados | supported | **supported** (I.6A, generic editor) | supported | supported | supported | intentionally_unsupported (no dedicated tab) | not_applicable | no |
| `mascotas_y_perdidos` | Clasificados | supported | missing (no safe editor) | supported | **supported** (I.6B, shell allowlist fixed) | supported | intentionally_unsupported (no dedicated *registry* tab — same meaning as Clases/Comunidad above; **now a real generic Mis Anuncios tab as of I.8B**, same non-dedicated pattern) | not_applicable | no |
| `viajes` | Negocios | supported | missing (registry can't determine lane; real route lives outside the registry — see notes) | missing (same reasoning) | **category_specific** (I.7A, echoes `publicUrl`; prior "ambiguous trees" finding was stale) | supported | supported | not_applicable | no |

`cupones` is intentionally absent — confirmed to be a filtered view (`surface="cupones"`) over
`ofertas_locales`, not its own pipeline.

## Identity, ES/EN, and per-pipeline notes

| Pipeline | Identity authority | ES/EN | Known limitation | Recommended future gate |
|---|---|---|---|---|
| restaurantes | `sourceId` | full | Preview route unconfirmed | Confirm/build Preview route |
| servicios | `sourceId` | full | Save-by-slug requires primed `existingPublicSlug` | Audit all save call sites |
| bienes_raices_negocio | `sourceId`, parent-substituted for edit/preview via `identityListingIdForEdit` | full | Child protection external; 4-child hydration cap | Formalize protection contract |
| bienes_raices_privado | `sourceId` | full | No confirmed distinct edit route | Confirm/build edit route |
| autos_negocios | `sourceId` (preview child-bound; edit parent-substituted) | full | No per-child edit UI; inventory limit unenforced | Dedicated child-action regression gate |
| autos_privado | `sourceId` | full | No exported href-builder constant (shape reproduced) | Export a real constant |
| rentas_negocio/privado | `sourceId` | full | **Edit resolved (I.7A)** — mirrors the real `rentasDashboardEditHref()` shape. Reuse-vs-insert query-error-falls-to-INSERT gap confirmed but deliberately not fixed (shared with locked Bienes Raíces publish core); no reuse protection at all outside `pending_payment` activation. Default-lane/two-renderer question remains OWNER DECISION REQUIRED. | Server-side idempotency key for the shared BR/Rentas publish core (needs schema work, out of scope); resolve default-lane product decision |
| empleos | `sourceId` | full | **Publish-CTA slug disagreement resolved (I.7A)** — landing CTA now calls the canonical hub directly. Results duplication resolved (I.5.8). Existing-identity duplicate-row risk fixed (I.7A) — invalid/not-found candidate ids now fail closed instead of silently inserting. Lane-ambiguous preview remains intentionally unsupported. | Confirm a lane-resolvable identity so Preview could someday be generically resolved |
| en_venta | `sourceId` | full | No modern publish hub; Storefront lane unrepresented; Edit resolved (I.6A) but generic-only; republish duplicate-row risk mitigated, not eliminated (I.6B) | Build modern hub; build prefill-from-existing edit |
| comida_local | `sourceId` | full | Results route unconfirmed distinct from landing | Confirm/build results route |
| ofertas_locales | `sourceId` | full | No confirmed payment/checkout route | Confirm monetization contract |
| busco | `sourceId` | full | Edit resolved (I.6A, generic editor); legacy hub CTA disagreement; republish duplicate-row risk mitigated, not eliminated (I.6B) | Fix legacy CTA; build prefill-from-existing edit |
| clases/comunidad | `sourceId` | full | Generic dashboard discovery now exposed (I.6B) — registry `dashboardRoute` still correctly null (no dedicated tab); Edit resolved (I.6A, generic editor); republish duplicate-row risk mitigated, not eliminated (I.6B); shared implementation confirmed intentional (not an unconfirmed fork) | Build prefill-from-existing edit if ever prioritized |
| mascotas_y_perdidos | `sourceId` | full | **Public detail repaired (I.6B)** — shared shell allowlist fixed, dedicated renderer added. **Now discoverable in Mis Anuncios (I.8B)** — real tab, classified private, View public/Archive available. Edit remains unsupported (no safe category-specific editor exists). | Build a safe category-specific edit surface if ever prioritized |
| viajes | `sourceId` (staged rows are actually slug-keyed; public detail is reached by slug, not sourceId) | full | **Public-route "ambiguity" corrected (I.7A)** — the prior finding was stale; `/clasificados/viajes/oferta/[slug]` is the one real live route, now echoed via `identity.publicUrl`. Edit/Preview remain honestly null in the registry — the real, working `/dashboard/viajes` page builds those hrefs itself and never goes through this registry/resolver at all. | Wire a lane-carrying Viajes `ListingIdentity` construction path if this pipeline is ever migrated onto the shared resolver |

---

*Generated for Gate I.5.7F. Do not treat this document as evidence that the two route systems have
been unified — they have not. See [Unresolved Route Debt](#unresolved-route-debt) for what remains.*
