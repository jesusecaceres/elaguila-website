# Leonix Admin OS — Cable Map

**GATES 1-5 UPDATE (autonomous continuation, owner offline)**: closed the Comida Local
`/admin/categories` registry gap (Gate 3), the Users tier-vocabulary data-corruption bug (Gate
2), the `/admin/payments` naming-collision disclosure and the promo-lead duplicate-rule
documentation (Gate 4), and produced a full per-capability LEO Readiness Contract (Gate 5). Gate
1 (business relationship completion) concluded — after tracing every real write path for
payments/leads/support/analytics/contracts/listings — that zero safe write-time linking hooks
exist anywhere in the current codebase (no writer has a `businessId` in scope); this is recorded
as an evidence-based finding, not a shortfall. Full detail, evidence, and the LEO readiness table
are in `ADMIN_OS_PROGRESS.md`'s "GATES 1-5" section — not duplicated here to avoid two
diverging copies of the same findings.

**GATES 1-6 UPDATE (PROMO TRUTH & BUSINESS LINKING, third pass)**: resolved the promo-lead
duplicate-truth condition (all 3 sites now consume one canonical classifier, `isPromotionalLeadRow`)
and built a real, explicit, admin-only linking workflow for `business_external_links` (lead /
payment / support_ticket), wired into a live-truth "Connected records" section on Business 360.
Produced a full 30-client readiness matrix (11 TRUE / 4 PARTIAL / 2 FALSE across owner, business,
status, stage, last interaction, next action, due date, follow-up, notes, assets, creative, quote,
contract, payment, publication, support, renewal). Full detail is in `ADMIN_OS_PROGRESS.md`'s
"GATES 1-6 (PROMO TRUTH & BUSINESS LINKING)" section — not duplicated here.

**INTEGRATION/RELEASE VALIDATION GATE UPDATE (fourth pass)**: ran full typecheck, lint, and
production build for the first time against the entire Admin OS change set (all prior passes were
resource_control-restricted to source review only). Typecheck and lint each found one real
Admin-OS-caused defect (a duplicate `Link` import in `/admin/payments`; an unused eslint-disable
directive in `/about`) — both fixed and reverified. Production build compiled successfully with
zero errors (including full React Server/Client boundary validation) and only failed later, during
static generation, on the unrelated public `/dashboard` page due to this worktree's persistent
missing-`.env.local` limitation — every Admin OS page is `force-dynamic` and structurally could
never be the page a static-generation failure points to. 11 of 12 targeted verification suites
passed outright; the 1 partial failure (`verify:admin-roster-foundation`) points at a migration
file confirmed untouched by any Admin OS pass. `business_external_links_foundation.sql` was
locally validated end-to-end against the repository/API and found `MIGRATION_READY_TO_APPLY: YES`
(one stale doc-comment fixed, no functional SQL changed). Full detail in `ADMIN_OS_PROGRESS.md`'s
"INTEGRATION / RELEASE VALIDATION GATE" section.

**IMPLEMENTATION/UX FINISH PASS UPDATE (fifth pass)**: owner stopped a starting runtime-QA gate
before any login attempt and redirected to implementation-completion mode. Closed the long-open
Viajes "duplicate route" ambiguity with real evidence (not duplicates — different lifecycle
stages on one table; fixed a real secondary mislabeling on the business-offers page's own header
copy). Found and fixed 19 instances of raw developer/gate-code jargon rendered directly in
owner-facing text across the Admin surface (not comments — actual visible UI strings), plus 2
confirmed raw-Supabase-error leaks into primary owner flows (`/admin/workspace/clasificados`,
`/admin/reportes`), plus a duplicate-metric presentation bug on the Command Center. Full detail
and the Gate 11 final gap classification (CLOSED/NEEDS_MIGRATION/NEEDS_RUNTIME_PROOF/
NOT_LAUNCH_CRITICAL/OWNER_DECISION_REQUIRED) are in `ADMIN_OS_PROGRESS.md`'s "IMPLEMENTATION/UX
FINISH PASS" section — not duplicated here.

**IMPLEMENTATION/UX FINISH PASS UPDATE (sixth pass)**: the owner correctly rejected the fifth
pass's "READY_FOR_FINAL_QA: YES" as premature (that pass had itself documented unfinished
owner-language and unverified UX/UI details). This pass: re-checked and corrected the fifth
pass's inaccurate claim about ~10 remaining jargon instances (only 1 was real —
`team/executive-hub` cited an internal filename — now fixed, plus 4 more found via a broadened
`dataSource`/`helperText`/`warningNote` sweep); fixed one real responsive-safety defect
(`/admin/team/roster`'s roster table was missing the `overflow-x-auto` wrapper its sibling
invites table on the same page correctly has); and closed two Business 360 Connected Records
gaps (an explicit "never mutates the original record" reassurance, and a distinct, honest
pre-migration `table_missing` error state instead of a generic failure message). Full detail in
`ADMIN_OS_PROGRESS.md`'s "IMPLEMENTATION/UX FINISH PASS (sixth pass)" section.

Status: IN PROGRESS. This is a persistent, incrementally-updated artifact per the Admin OS
launch-certification project's execution rules. Domains below are filled in as investigation
completes; unfilled domains are marked PENDING with the background-agent task they depend on.

Schema per system: SYSTEM, DOMAIN, PUBLIC_OR_BUSINESS_PURPOSE, PUBLIC_ROUTE_OR_ENTRY,
PRIMARY_COMPONENT, CANONICAL_ENTITY, CANONICAL_ID, CANONICAL_DATA_SOURCE, READ_SERVICE,
WRITE_SERVICE_OR_SERVER_ACTION, API_ROUTE_IF_ANY, PRIMARY_ADMIN_ROUTE,
ALTERNATE_ADMIN_ENTRY_POINTS, ADMIN_READ_CAPABILITY, ADMIN_WRITE_CAPABILITY,
GLOBAL_SEARCH_SUPPORT, CUSTOMER_OR_BUSINESS_CONTEXT_LINK,
PAYMENT_OR_ENTITLEMENT_LINK_IF_APPLICABLE, MODERATION_OR_REPORT_LINK_IF_APPLICABLE,
ANALYTICS_LINK_IF_APPLICABLE, AUDIT_LINK, LEO_SAFE_READ_SOURCE, CTA_DESTINATIONS,
CURRENT_TRUTH_STATUS, KNOWN_DUPLICATION, KNOWN_BROKEN_OR_SPLIT_WIRING,
MISSING_ADMIN_CONTROL, MISSING_RELATIONSHIP, NOTES.

## Domain index

| Domain | Status |
|---|---|
| COMMAND | SUBSTANTIALLY MAPPED (Today's Attention, Moderation Truth, Global Search) |
| SYSTEM | SUBSTANTIALLY MAPPED (Activity Log, System Health, Background Monitoring, Global Search) |
| MARKETPLACE OPS | SUBSTANTIALLY MAPPED — core infra + 12 of 13 categories traced (Empleos, Viajes, Rentas, Bienes Raíces, Servicios, Autos [both lanes], Restaurantes, Comida Local, Mascotas y Perdidos, Clases, Busco, Comunidad, Ofertas Locales). En Venta not independently traced this pass — architecturally identical to Rentas/Bienes Raíces/Busco (generic `listings` table, no dedicated table), low risk to leave unconfirmed. |
| REVENUE | SUBSTANTIALLY MAPPED (Leads x3, Payments, Package Entitlements, Promo Codes, Newsletter, Media Kit, Tienda Orders, Cupones-adjacent) |
| PEOPLE | SUBSTANTIALLY MAPPED (Users, Team, Support, Business Concierge/Client 360) |
| WEBSITE | SUBSTANTIALLY MAPPED (Site Sections CMS, Settings, Language Audit, Recursos, Iglesias, Magazine, Noticias, Tienda, Coupons, Promo Codes) |

**Not yet mapped this pass** (lower priority, flagged for a follow-up cable-mapping increment, not blocking the synthesis below): Sitemap/robots/manifest, translate-site, saved-search, seller-stats, verified-intro-discount, leonix-endorsements/leonix-professional-identity APIs, Digital Contact video/doorbell system in full (only cross-referenced against Support), Mux video integration, RSS/News API in isolation from Noticias (already covered).

---

## DOMAIN: COMMAND

### SYSTEM: Today's Attention / Review Queue (Command Center)
- DOMAIN: COMMAND
- PUBLIC_OR_BUSINESS_PURPOSE: Give the owner one glanceable morning view of what needs handling across leads, listing review, reports, and expirations.
- PUBLIC_ROUTE_OR_ENTRY: n/a (Admin-only)
- PRIMARY_COMPONENT: `app/admin/_components/AdminCommandCenterDashboard.tsx`
- CANONICAL_ENTITY: aggregation, not a single entity — see sub-sources below
- CANONICAL_ID: n/a (aggregate)
- CANONICAL_DATA_SOURCE: `listings`, `listing_reports`, `empleos_public_listings`, `viajes_staged_listings`, `leonix_leads`, `leonix_media_kit_leads`, `leonix_newsletter_subscribers`, `profiles`
- READ_SERVICE: `app/admin/_lib/adminDashboardData.ts` — `getAdminDashboardSnapshot()`, `getAdminDashboardLeadsCounts()`, `computeAdminAttentionReviewTruth()` (new, this session)
- WRITE_SERVICE_OR_SERVER_ACTION: none directly (read-only dashboard; writes happen in destination pages)
- API_ROUTE_IF_ANY: none (server component)
- PRIMARY_ADMIN_ROUTE: `/admin` (`app/admin/(dashboard)/page.tsx`)
- ALTERNATE_ADMIN_ENTRY_POINTS: n/a — this IS the home page
- ADMIN_READ_CAPABILITY: leads needing reply, unique listings needing review (fixed this session), report submissions (rows), expiring/expired listings, disabled-users proxy, category counts, magazine featured label
- ADMIN_WRITE_CAPABILITY: none on this page — every card is a CTA out to the real workspace
- GLOBAL_SEARCH_SUPPORT: n/a (this page is the search's sibling, not itself searchable)
- MODERATION_OR_REPORT_LINK_IF_APPLICABLE: yes — this is the primary aggregator of moderation/report signal; see Moderation Truth entry below for the underlying wiring
- AUDIT_LINK: none (read-only page, nothing to audit)
- LEO_SAFE_READ_SOURCE: `getAdminDashboardSnapshot()` is ALREADY the read source LEO's `leoAdminTruthAdapter.ts` (`getLeoExecutiveTruthSnapshot()`) consumes for `leads_needing_reply`, `pending_listings_review`, `pending_reports`, `review_queue_preview`. **LEO_HANDOFF_DELTA candidate**: LEO's adapter currently reads the OLD raw `snap.pendingListingsReview` field, not the new deduplicated `snap.reviewAttentionTruth.uniqueListingsNeedingReview` added this session — LEO's number and Admin's Command Center number will now visibly disagree (Admin shows the deduplicated, lower/more-accurate number; LEO still shows the raw, possibly-inflated one). This is a real, live split-truth condition as of this commit. See "Known duplication" below.
- CTA_DESTINATIONS: "Review listings" → `/admin/workspace/clasificados?status=flagged#queue` (exists); "Open reports" → `/admin/reportes` (exists, confirmed real page reading `listing_reports`); "Open leads" → `/admin/leads/inbox` (exists)
- CURRENT_TRUTH_STATUS: PARTIAL → improving to REAL for the "needs review" metric specifically (dedup fix landed this session, not yet proven against a live database since this worktree has no `.env.local`) — classify as NEEDS_PROOF for live-count correctness, REAL for code-path correctness.
- KNOWN_DUPLICATION: **Admin's `reviewAttentionTruth.uniqueListingsNeedingReview` (new, deduplicated) vs LEO's `leoAdminTruthAdapter.ts` `pending_listings_review` observation (old, raw `pendingListingsReview` field, not deduplicated with reports).** Two numbers, two methodologies, same nominal question ("how many listings need review"). This is the single most important LEO_HANDOFF_DELTA from this project so far.
- KNOWN_BROKEN_OR_SPLIT_WIRING: see above.
- MISSING_ADMIN_CONTROL: **[CLOSED, prior pass]** was: no direct way to triage from this page. The "Review workbench preview" tab now exists (`reviewWorkbenchSection` in `AdminCommandCenterDashboard.tsx`) with inline row actions (`AdminDashboardReviewCardActions`) plus a link to the full queue for bulk work — confirmed present in current code, not just claimed.
- MISSING_RELATIONSHIP: none new beyond what's already flagged in ADMIN_OS_PROGRESS.md.
- NOTES: This page is the most heavily-audited page in the repo so far (a dedicated `DASHBOARD_CEO_COMMAND_CENTER_AUDIT.md` already exists documenting a prior redesign pass). Reuse its CTA route matrix rather than re-deriving one — it is still accurate for every route it lists.

### SYSTEM: Moderation Truth (Listing Flag/Review Classification)
- DOMAIN: COMMAND (cross-cuts MARKETPLACE OPS — canonical home is COMMAND since it's the shared classification service every category's review queue calls into)
- PUBLIC_OR_BUSINESS_PURPOSE: Tell the owner WHY a listing is flagged/pending, with real provenance, never guessing.
- PUBLIC_ROUTE_OR_ENTRY: n/a
- PRIMARY_COMPONENT: consumed by `AdminCommandCenterDashboard.tsx` review cards and `/admin/workspace/clasificados` queue table (verify in Marketplace domain pass)
- CANONICAL_ENTITY: a listing (generic `listings` row, or `empleos_public_listings` row, or `viajes_staged_listings` row)
- CANONICAL_ID: `listings.id` / `empleos_public_listings.id` / `viajes_staged_listings.id`
- CANONICAL_DATA_SOURCE: `listing_reports` (user reports), `listing_moderation_reviews` (real AI moderation engine output — migration `20260625180000_listing_moderation_reviews.sql`), `listings.status` / `empleos_public_listings.lifecycle_status` / `viajes_staged_listings.lifecycle_status` (system status)
- READ_SERVICE: `app/admin/_lib/adminReviewFlagTruth.ts` (`classifyAdminReviewFlagTruth`, `classifyDashboardReviewRowFlagTruth`), `app/admin/_lib/adminReviewFlagContext.ts` (`fetchListingFlagContextMaps` — batches report + AI-review + owner-email lookups), `app/admin/_lib/listingModerationReviewsDb.ts` (`fetchLatestListingModerationReviews`)
- WRITE_SERVICE_OR_SERVER_ACTION: `app/admin/_lib/listingAiModerationService.ts` (writes AI results, audited); per-category admin listing routes (`app/api/admin/{autos,servicios,restaurantes,viajes,empleos,clasificados}/listings/[id]/route.ts`) write status transitions and call `appendAdminAuditLog`
- API_ROUTE_IF_ANY: the 6 per-category `app/api/admin/*/listings/[id]/route.ts` routes above
- PRIMARY_ADMIN_ROUTE: `/admin/workspace/clasificados` (queue), `/admin/reportes` (reports)
- ALTERNATE_ADMIN_ENTRY_POINTS: Command Center review cards, per-category ops pages (to be confirmed by Marketplace domain pass)
- ADMIN_READ_CAPABILITY: source kind (AI/Report/Manual/Status/Legacy), reason text, confidence, `needsTriage` (added this session), `canExplain`
- ADMIN_WRITE_CAPABILITY: approve/reject/archive per category route (confirmed to exist via `appendAdminAuditLog` callers); no unified case/resolution state yet (Phase 3, not started)
- GLOBAL_SEARCH_SUPPORT: `listing_reports` IS included in `/admin/ops` global search (`searchListingReportsForOps`); `listing_moderation_reviews` is NOT globally searchable (only looked up per-listing-id, not searchable by reason/category)
- MODERATION_OR_REPORT_LINK_IF_APPLICABLE: this IS the moderation/report link — canonical for the whole site.
- AUDIT_LINK: `admin_audit_log` via `appendAdminAuditLog()`, called from the 6 per-category listing routes + `listingAiModerationService.ts`. **CONFIRMED split audit trail** (verified directly, not delegated): Business Concierge writes do NOT go to `admin_audit_log` at all — `app/admin/_lib/businessWorkspaceData.ts`'s `writeAuditLog()` inserts into a completely separate table, `business_sales_audit_log`, keyed by `SalesAuditAction` (`note_created`, `note_updated`, `follow_up_created/completed/cancelled/waiting_on_owner`, `sales_status_changed`, `archived`), with a real `actor` column per row. Notably `business_sales_audit_log` actually records WHO acted (better than `admin_audit_log`'s admitted no-actor gap) — this is not a quality problem, it's a VISIBILITY problem: `/admin/activity-log` reads ONLY `admin_audit_log` and will never show a single Business Concierge action, so the owner's one "Activity Log" page is silently incomplete for the entire Business Concierge domain.
- LEO_SAFE_READ_SOURCE: not yet a dedicated LEO adapter for per-listing moderation reasoning (LEO's `MODERATION` executive-reporting domain only surfaces aggregate `listing_reports`/`pendingListingsReview` counts, not the classified reason/source-kind/needsTriage detail this service produces). **Gap**: LEO cannot currently explain WHY a specific listing is flagged with the same fidelity Admin's dashboard now has — it would need a new adapter reading `classifyDashboardReviewRowFlagTruth` output, not just raw counts.
- CTA_DESTINATIONS: see Command Center entry above.
- CURRENT_TRUTH_STATUS: REAL for classification logic (verified this session, two real defects fixed); PARTIAL for full evidence surfacing on the dashboard row type (severity/age/first-detected not yet threaded through — recorded in ADMIN_OS_PROGRESS.md Phase 2).
- KNOWN_DUPLICATION: none found this session beyond the review-count issue already logged under Command Center.
- KNOWN_BROKEN_OR_SPLIT_WIRING: (1) AI review data was being silently discarded before this session's fix — now fixed; (2) potential split audit trail vs Business Concierge writes, flagged above pending confirmation.
- MISSING_ADMIN_CONTROL: no `CATEGORY_RULE` source class exists yet (doctrine calls for it; no real category-rule-based auto-flagging source was found in the repo to back it — correctly not fabricated).
- MISSING_RELATIONSHIP: a flagged/reported listing does not appear to carry a link back to the business/customer 360 record (if the listing's owner is a claimed business) — needs confirmation once the People domain pass returns.
- NOTES: This is the best-instrumented moderation system in the repo — reuse, do not replace, per doctrine #11.

---

## DOMAIN: SYSTEM

### SYSTEM: Activity Log (Admin Audit Trail)
- DOMAIN: SYSTEM
- PUBLIC_OR_BUSINESS_PURPOSE: Let the owner see what changed in Admin and when.
- PUBLIC_ROUTE_OR_ENTRY: n/a
- PRIMARY_COMPONENT: `app/admin/(dashboard)/activity-log/page.tsx`
- CANONICAL_ENTITY: an audit event
- CANONICAL_ID: `admin_audit_log.id`
- CANONICAL_DATA_SOURCE: `admin_audit_log` table
- READ_SERVICE: `app/admin/_lib/adminAuditLogServer.ts` — `fetchAdminAuditLogFiltered`, `fetchAdminAuditLogRecent`, `fetchAdminAuditLogForTarget`
- WRITE_SERVICE_OR_SERVER_ACTION: `appendAdminAuditLog()` — confirmed called from 15 files: the 6 per-category listing routes, `teamProvisioningActions.ts`, `admin/actions.ts`, `adminTeamActions.ts`, `listingAiModerationService.ts`, `auditAdminWrite.ts`, `adminRosterAudit.ts`, `workspace/promo-codes/actions.ts`, `workspace/package-entitlements/actions.ts`
- API_ROUTE_IF_ANY: n/a (server actions + route handlers call it directly)
- PRIMARY_ADMIN_ROUTE: `/admin/activity-log`
- ALTERNATE_ADMIN_ENTRY_POINTS: none found
- ADMIN_READ_CAPABILITY: filterable by action / target type / target id; live/empty/unavailable states explicitly and honestly labeled in the page itself
- ADMIN_WRITE_CAPABILITY: n/a (append-only, no admin edit)
- GLOBAL_SEARCH_SUPPORT: not included in `/admin/ops` unified search
- AUDIT_LINK: is itself the audit link for every other system that calls `appendAdminAuditLog`
- LEO_SAFE_READ_SOURCE: none currently. LEO's `RECEIPT_INTELLIGENCE` conversation intent reads LEO's OWN `leo_tool_receipts` table (LEO's actions on itself), not this shared Admin audit log — LEO cannot currently answer "what did a staff member change in Admin recently" from this table. **Gap.**
- CTA_DESTINATIONS: linked from Command Center? — not found as a direct CTA on the Command Center page; reachable only via sidebar nav (`ADMIN_GLOBAL_NAV`) and LEO's admin-navigation registry ("show recent activity" / "open activity log").
- CURRENT_TRUTH_STATUS: REAL. Confirmed honestly self-documenting: the page text itself states "No actor/operator filter — the audit table does not record who performed each action (a confirmed schema gap, not hidden here)" and the row mapping hardcodes `actor: "server"` for every row, matching that admission exactly (not silently misleading).
- KNOWN_DUPLICATION: none.
- KNOWN_BROKEN_OR_SPLIT_WIRING: none — but see the Business Concierge audit-trail question raised under Moderation Truth above; if confirmed, that would mean the company has TWO audit trails (`admin_audit_log` for marketplace/team/promo/entitlement actions, and a separate Business Concierge–specific mechanism), which is exactly the kind of split-truth condition this project exists to surface.
- MISSING_ADMIN_CONTROL: no actor/operator attribution (schema gap, already self-disclosed in the UI — not hidden, but still a real launch-relevant gap: the owner cannot answer "which staff member did this" from this page today).
- MISSING_RELATIONSHIP: n/a
- NOTES: Well-built, honest, doctrine-compliant. Do not rebuild.

### SYSTEM: System Health
- DOMAIN: SYSTEM
- PUBLIC_OR_BUSINESS_PURPOSE: Tell the owner whether core dependencies (Supabase, Google Workspace, GitHub, Vercel, Web Push) are configured/healthy.
- PUBLIC_ROUTE_OR_ENTRY: n/a
- PRIMARY_COMPONENT: `app/admin/(dashboard)/leo/_components/LeoSystemHealthCard.tsx`
- CANONICAL_ENTITY: a dependency-health snapshot (not a persisted entity)
- CANONICAL_ID: n/a
- CANONICAL_DATA_SOURCE: live config-presence checks (env var presence, connector-configured booleans) — NOT a database table. See `app/leo/_lib/leoSystemHealth.ts` (`buildLeoSystemHealthSnapshot`).
- READ_SERVICE: `buildLeoSystemHealthSnapshot()`, called from `app/admin/(dashboard)/leo/page.tsx`
- WRITE_SERVICE_OR_SERVER_ACTION: none (read-only diagnostic)
- API_ROUTE_IF_ANY: none
- PRIMARY_ADMIN_ROUTE: **`/admin/leo` ONLY** — there is no standalone `/admin/system-health` or equivalent page outside the LEO workspace.
- ALTERNATE_ADMIN_ENTRY_POINTS: none found anywhere in `app/admin/(dashboard)/**` outside of `leo/`.
- ADMIN_READ_CAPABILITY: Supabase persistence health, Google Workspace configured, GitHub/Vercel project-intelligence health, Web Push configured
- ADMIN_WRITE_CAPABILITY: none
- GLOBAL_SEARCH_SUPPORT: n/a
- AUDIT_LINK: none
- LEO_SAFE_READ_SOURCE: this literally already IS a LEO-native read (it lives inside LEO's own page) — it's also exposed as its own executive-reporting domain (`LEO_EXECUTIVE_DOMAIN_REGISTRY` "LEO" / "system" entries in `leoExecutiveReportingRegistry.ts` and `leoSystemReportingAdapter` in `leoExecutiveReportingAdapters.ts`, which I built in a prior session on this same underlying config-presence data).
- CTA_DESTINATIONS: none — informational card only.
- CURRENT_TRUTH_STATUS: REAL for what it checks (live config presence, not fabricated); but per the task's own doctrine (Phase 9: "Only mark monitoring REAL when schema exists AND execution mechanism exists") — this is CONFIG-PRESENCE monitoring, not RUNTIME/EXECUTION health (it cannot tell the owner if Supabase queries are actually failing right now, only whether credentials exist). Classify as PARTIAL against the doctrine's stricter bar.
- KNOWN_DUPLICATION: none — single source.
- KNOWN_BROKEN_OR_SPLIT_WIRING: **MISSING_ADMIN_CONTROL is the real finding here, not broken wiring.**
- MISSING_ADMIN_CONTROL: **System Health has NO home anywhere in Admin outside the owner-only LEO workspace.** Any staff/team member with Admin access but without LEO access (LEO is gated to `owner_admin` role only, per `resolveLeoAccess()`) has ZERO visibility into whether Supabase/Google/GitHub/Vercel/Push are configured. This is a genuine launch-relevant gap: if the owner delegates any Admin access, that delegate is flying blind on system health. **[GATE E — FIXED]** New `/admin/system-health` (global nav "system" group, no LEO/owner-only gate) with real live-reachability probes against Supabase/audit-log/team-roster/listings tables — a genuine upgrade over config-presence-only. Deliberately scoped to Admin-relevant dependencies only (not Gmail/Calendar/push, which are LEO's own tool integrations). See ADMIN_OS_PROGRESS.md, Gates A-F.
- MISSING_RELATIONSHIP: n/a
- NOTES: "Bug Finder" (named in the task prompt) does not exist anywhere in this repository — confirmed via repo-wide search. No file, component, route, or table with that name or an equivalent concept was found. Classify Bug Finder as PLANNED-ONLY (aspirational, zero repository evidence of implementation) — do not fabricate a REAL or PARTIAL status for it.

### SYSTEM: Background Monitoring / Scheduled Jobs
- DOMAIN: SYSTEM
- PUBLIC_OR_BUSINESS_PURPOSE: Run recurring checks (e.g. LEO's watch engine) without a human triggering them.
- CANONICAL_DATA_SOURCE: `leo_watch_runs` table (persistence exists)
- READ_SERVICE / WRITE_SERVICE: `app/leo/_lib/leoWatchService.ts`, `leoWatchEngine.ts`
- API_ROUTE_IF_ANY: `POST /api/leo/watch/run` (real, `LEO_CRON_SECRET`-gated)
- PRIMARY_ADMIN_ROUTE: none — this is LEO-only, no Admin-native scheduled-job page exists.
- CURRENT_TRUTH_STATUS: **BLOCKED_EXTERNAL / UNAVAILABLE for actual scheduling.** Confirmed (again, this session — no `vercel.json`, no `.github/workflows` exist anywhere in the repo). The persistence and the manually-callable endpoint are REAL; the SCHEDULING MECHANISM does not exist. Per Phase 9's own rule ("Only mark monitoring REAL when schema exists AND execution mechanism exists") this must be marked PARTIAL/UNAVAILABLE, never REAL, until a scheduler is added — which is itself a one-time Production infrastructure decision outside code.
- MISSING_ADMIN_CONTROL: no Admin-native way to see "last time background jobs ran" outside LEO.
- NOTES: This exact finding was already certified in the prior LEO-ADMIN-OS-FINAL.2 pass (different worktree, `integration/leo-executive-operating-intelligence-2026-08`, commit 302347b8) — re-confirmed independently here rather than assumed, per instruction not to rely only on historical docs.

### SYSTEM: Global Operations Search (`/admin/ops`)
- DOMAIN: SYSTEM (cross-cuts every domain — this is the map's "can the owner find X" test)
- PUBLIC_OR_BUSINESS_PURPOSE: One search box to find a customer/listing/order/report by free text.
- PRIMARY_COMPONENT: `app/admin/(dashboard)/ops/page.tsx`
- READ_SERVICE: `app/admin/_lib/adminOpsUnifiedSearch.ts` (`runAdminUnifiedSearch`) — fans out in parallel to:
  - `fetchProfilesForAdminList` (`profiles` table)
  - `searchListingsForAdminOps` (`app/admin/_lib/adminListingsOpsSearch.ts` — **confirmed: queries ONLY the generic `listings` table**, `.from("listings")` is the only table reference in that file)
  - `listTiendaOrdersForAdmin` (Tienda orders)
  - `searchListingReportsForOps` (`listing_reports`)
  - plus a derived `supportContext` (support-ticket summary) when exactly one profile matches
- PRIMARY_ADMIN_ROUTE: `/admin/ops`
- CURRENT_TRUTH_STATUS: REAL for what it covers; PARTIAL as a claimed "global" search.
- **[CLOSED — Empleos/Viajes/Servicios/Restaurantes/Autos/Comida Local/Ofertas Locales]** Fixed in commit `2710cb9e` via `adminDedicatedCategorySearch.ts`'s `searchDedicatedCategoryListingsForAdminOps()`, reusing each category's own existing admin-list function — confirmed present in `adminOpsUnifiedSearch.ts`'s fan-out as `dedicatedCategories`.
- **[CLOSED — businesses, this pass]** `businesses` had zero presence anywhere in this search despite being the explicit "one business context connects all records" system (previously the top finding in this cable map). Fixed by adding `listBusinessesForWorkspace({ keyword })` (the same keyword-filtered read `/admin/businesses` already uses) to the fan-out as `bundle.businesses`, rendered in a new "Businesses" section on `/admin/ops` linking to `/admin/businesses/[businessId]`. No new query logic was written.
- MISSING_ADMIN_CONTROL (still open, not fixed this pass): `admin_team_members`, `leonix_leads`, `payments`/entitlements, `community_resources` (Recursos), and magazine/noticias content remain unsearchable from the one shared search box. None of these has an existing keyword-search read function as directly reusable as `listBusinessesForWorkspace` was — adding them would mean writing new query logic per source rather than reusing a proven one, which is a larger, more speculative change than this pass's scope. Classify as `OWNER_DECISION_REQUIRED` (worth doing, but a deliberate scoped follow-up, not a same-pass wiring fix) rather than leaving it silently unaddressed.
- NOTES: Was flagged as "one of the highest-leverage, cheapest-to-fix gaps" — the two cheapest instances (dedicated categories, businesses) are now both closed across two passes.

---

---

## DOMAIN: WEBSITE (partial — Magazine/Noticias sub-agent returned; other WEBSITE sub-agents pending)

### SYSTEM: Magazine / Revista
- DOMAIN: WEBSITE
- PUBLIC_OR_BUSINESS_PURPOSE: Public-facing monthly digital magazine hub (cover/reader/PDF/flipbook) plus advertiser CTA surface.
- PUBLIC_ROUTE_OR_ENTRY: `/magazine`; per-issue `/magazine/2026/<month>` and `/magazine/2026/<month>/read` (12 month folders exist; only June has real authored content — April is a literal "Coming Soon" stub, others likely similar).
- PRIMARY_COMPONENT: `app/(site)/magazine/MagazineHubClient.tsx` (hardcoded `CURRENT_EDITION`/`PAST_EDITIONS`, merged with fetched manifest via `mergeEditionFromManifest()`)
- CANONICAL_ENTITY: magazine issue (year, month_slug, title_es/en, status, is_featured, cover_url, pdf_url, flipbook_url, published_at, display_order, internal_notes)
- CANONICAL_ID: `magazine_issues.id` (uuid), unique on (year, month_slug)
- CANONICAL_DATA_SOURCE: `magazine_issues` table (migration `20260408140000_magazine_issues.sql`) when populated; falls back to static `public/magazine/editions.json`. Table supplies the MANIFEST layer only — actual per-month reader templates remain hardcoded code files.
- READ_SERVICE: `app/lib/magazine/magazineManifestServer.ts:resolvePublicMagazineManifest`; `app/admin/_lib/magazineAdminData.ts:getMagazineManifestForAdmin`
- WRITE_SERVICE_OR_SERVER_ACTION: `app/admin/magazineIssuesActions.ts` (`upsertMagazineIssueAction`, `setMagazineCurrentIssueAction`, `archiveMagazineIssueAction`, `publishMagazineIssueAction`, `deleteMagazineDraftAction`, gated by `requireLeonixAdminPermission("can_manage_magazine")`); separately `app/admin/revistaIssueRegistryActions.ts` and `revistaSpotlightActions.ts` write planning notes into `site_section_content` (NOT the live table)
- API_ROUTE_IF_ANY: `GET /api/magazine/manifest` (public, 60s cache)
- PRIMARY_ADMIN_ROUTE: `/admin/workspace/revista` (full CRUD: publish/archive/feature/delete-draft, asset upload)
- ALTERNATE_ADMIN_ENTRY_POINTS: `/admin/magazine` — **confirmed dead/vestigial**: page.tsx does nothing but `redirect("/admin/workspace/revista")`; zero other references anywhere in the repo. Harmless (redirects, doesn't 404) but should be deleted once callers are proven zero (already proven zero here).
- ADMIN_READ_CAPABILITY: full DB-row table + "effective public view" archive table + inline error banner if the table query fails (names the exact migration to apply)
- ADMIN_WRITE_CAPABILITY: real — status transitions, featured-issue toggle (auto-archives previous), asset URLs; admin's OWN copy discloses it does NOT generate the per-month static page template
- GLOBAL_SEARCH_SUPPORT: NONE — not referenced anywhere in `adminOpsUnifiedSearch.ts` or sibling search files
- AUDIT_LINK: real — every write calls `auditAdminWrite()` → `admin_audit_log` (`magazine_issue_upserted/set_current/archived/published/draft_deleted`)
- LEO_SAFE_READ_SOURCE: none dedicated yet; LEO has no magazine-specific executive-reporting domain.
- CTA_DESTINATIONS: `/magazine` (Footer, publicNavConfig "revista") — exists. `/magazine/2026/june[/read]` — exists. `/admin/workspace/revista` — exists. No WRONG_DESTINATION found.
- CURRENT_TRUTH_STATUS: PARTIAL — real DB+CRUD+audit for the manifest/metadata layer; publishing genuinely NEW monthly content still requires a code deploy (admin UI is unusually candid about this itself).
- KNOWN_DUPLICATION: two side-channel "notes" mechanisms (`site_section_content.revista_issue_registry` planned-issues list, `revista_spotlight` internal notes) live on the same admin page as the real table — functionally non-overlapping but a real source of editor confusion about "which one is the truth."
- KNOWN_BROKEN_OR_SPLIT_WIRING: `/admin/magazine` dead redirect stub (safe to delete); per-month public routes not generated from DB rows (disclosed, not hidden).
- MISSING_ADMIN_CONTROL: no way to edit/generate actual per-month reader content without a code deploy — only manifest metadata is DB-editable.
- MISSING_RELATIONSHIP: `magazine_issues` rows are not linked to the static per-month page files; joined only loosely at render time by matching year/month key.
- NOTES: A genuinely graduated-truth system — good model for how to disclose PARTIAL honestly (admin UI states the gap in its own copy) rather than a flat REAL/BROKEN label.

### SYSTEM: Noticias
- DOMAIN: WEBSITE
- PUBLIC_OR_BUSINESS_PURPOSE: Public news aggregation hub (curated/composed live RSS feed across 8 categories, ES/EN).
- PUBLIC_ROUTE_OR_ENTRY: `/noticias`
- PRIMARY_COMPONENT: `app/(site)/noticias/NoticiasPageClient.tsx`
- CANONICAL_ENTITY: **no persisted article entity exists.** `NewsArticle` (`noticiasEditorialModel.ts`) is a transient, request-scoped shape; dedupe key is synthetic (`link:<url>` / `title:<lowercased>`), not a stable id. The page SHELL (title/subtitle/breaking-label copy) IS a canonical entity: `site_section_content` row keyed `"noticias_page"`.
- CANONICAL_ID: none for articles; `"noticias_page"` key for the shell.
- CANONICAL_DATA_SOURCE: TWO genuinely distinct sources on one page — (1) shell: `site_section_content` table via `getSiteSectionPayload`/`mergeNoticiasPagePayload`; (2) articles: live external RSS/Google-News feeds fetched per-request in `app/api/rss/route.ts` (hardcoded source URLs in `newsQuery.ts`) — **zero repo-wide matches for any `news_articles`/`noticias` DB table**; the admin page's own copy lists a `news_articles` table as an explicitly-not-yet-built "next minimal step."
- READ_SERVICE: shell — `getSiteSectionPayload("noticias_page")`; articles — `app/api/rss/route.ts` → `newsQuery.ts` → external RSS parser, no DB involved. `noticiasEditorialModel.ts` is pure composition/curation logic, not a data-access layer.
- WRITE_SERVICE_OR_SERVER_ACTION: shell only — `app/admin/sectionPageActions.ts:saveNoticiasPageAction` (writes `site_section_content`, audits, revalidates `/noticias`). **No write path exists for articles at all** — nothing creates/edits/schedules/deletes an individual story.
- API_ROUTE_IF_ANY: `GET /api/rss` (public, unauthenticated, CDN-cached 120s, external-only). Dead duplicate: `app/_rss_disabled/route.ts` sits outside the routed `app/api` tree (unrouted, harmless, should be deleted).
- PRIMARY_ADMIN_ROUTE: `/admin/workspace/noticias`
- ALTERNATE_ADMIN_ENTRY_POINTS: `/admin/workspace/noticias/content` (the actual shell-editing form)
- ADMIN_READ_CAPABILITY: shell copy + last-updated timestamp only. **No article list, no RSS source health, nothing about what's currently live on `/noticias`.**
- ADMIN_WRITE_CAPABILITY: **extremely limited, confirmed by full file read.** `/admin/workspace/noticias` itself has ZERO form fields (status/links page only, badge reads "RSS feed · not a CMS," explicit "notYet" list). The content sub-page edits exactly 6 text fields (page_title/subtitle/breaking, es/en) — "There are no button or URL fields: the listing links to RSS/API sources per page code." **No way for any editor to create, edit, remove, feature, or moderate an individual news article anywhere in Admin.** Category taxonomy and RSS source URLs are both hardcoded, deploy-only.
- GLOBAL_SEARCH_SUPPORT: none (nothing to index — no persisted article).
- MODERATION_OR_REPORT_LINK_IF_APPLICABLE: none — only a client-side link-scheme sanitizer (`isUsableArticleLink`), which is a security guard, not editorial moderation. **A bad/wrong/embarrassing RSS story cannot be hidden or removed by the owner today.**
- AUDIT_LINK: shell save only (`site_section_saved` → `admin_audit_log`); no audit trail possible for article content since no write path exists.
- LEO_SAFE_READ_SOURCE: none.
- CTA_DESTINATIONS: `/noticias` (Footer, publicNavConfig "noticias") — exists. `/admin/workspace/noticias[/content]` — both exist, cross-linked correctly. No WRONG_DESTINATION found.
- CURRENT_TRUTH_STATUS: shell = REAL (narrow slice); article/editorial capability = PARTIAL/PLANNED-by-design, not BROKEN — the team's own in-app copy discloses this is an intentional aggregator-not-CMS state, not an accident.
- KNOWN_DUPLICATION: none functional; `noticiasEditorialModel.ts` is display logic only, not a second content store. Documentation-level duplication risk: two disclosed sources ("Shell" vs "Dynamic content") feeding one page, by design.
- KNOWN_BROKEN_OR_SPLIT_WIRING: `app/_rss_disabled/route.ts` dead/unrouted duplicate of the real RSS route — should be deleted to avoid confusion (does not run, causes no harm).
- MISSING_ADMIN_CONTROL: **headline finding for this system** — no article CRUD, no taxonomy editing without deploy, no RSS source management, no moderation/takedown, no scheduling, no per-article audit trail. Correctly flagged by the original task prompt as a newer feature that "escaped Admin coverage" — more precisely, it was never architected to need full coverage (it's an aggregator), and the one admin surface that exists says so honestly.
- MISSING_RELATIONSHIP: none possible today — no article entity exists to relate to anything.
- NOTES: Treat as PLANNED/NOT-A-CMS BY DESIGN, not BROKEN, for the article layer specifically; shell-copy editing is genuinely REAL.

---

## DOMAIN: MARKETPLACE OPS — Core Infrastructure & Category Table Map (confirmed via direct agent trace)

### THE CORE FINDING: generic `listings` table vs 7 dedicated per-category tables

**Categories on their OWN dedicated table** (confirmed via direct `.from()` grep, zero footprint in the shared `listings` table):
| Category | Table | Status column | Moderation reason column |
|---|---|---|---|
| Empleos | `empleos_public_listings` (migration `20260410210000`) | `lifecycle_status` (e.g. `pending_review`) | `moderation_reason`, `review_notes` |
| Viajes | `viajes_staged_listings` (migration `20260410180000`) | `lifecycle_status` (`submitted`/`in_review`/`changes_requested`/`approved`) | `moderation_reason`, `review_notes` |
| Restaurantes | `restaurantes_public_listings` | (to be confirmed by category sub-agent) | — |
| Servicios | `servicios_public_listings` | (to be confirmed) | — |
| Autos | `autos_classifieds_listings` (+ `autos_classifieds_analytics_events`) | (to be confirmed) | — |
| Comida Local | `comida_local_public_listings` | (to be confirmed) | — |
| Ofertas Locales | `ofertas_locales` (linked from Restaurantes, distinct from Comida Local) | (to be confirmed) | — |

**Categories sharing the generic `listings` table** (confirmed, no dedicated table exists): En Venta, Rentas, Bienes Raíces, Busco, Community/Comunidad, Mascotas y Perdidos, Clases. The generic `listings` table has **no `moderation_reason` column at all** (confirmed by `adminDashboardData.ts`'s own `adminDashboardReviewSourceLabel()` comment).

**Not yet determined** (thin alias/landing directories with no direct `.from()` call of their own — likely delegate into one of the above, unconfirmed): `dealers-de-autos` (likely → autos), `negocios`, `travel` (likely → viajes).

**Cross-cutting engagement tables** (used across categories regardless of the split above): `saved_listings`, `user_liked_listings`, `listing_analytics`, `listing_package_entitlements`.

### THE THREE HIGH-VALUE GAPS THIS SPLIT PRODUCES (each independently confirmed by direct code trace)

1. **Global search (`/admin/ops`) only covers the generic `listings` table.** `searchListingsForAdminOps` (`app/admin/_lib/adminListingsOpsSearch.ts`) has exactly one `.from()` call, `.from("listings")`. An operator searching Ops for anything in Empleos, Viajes, Restaurantes, Servicios, Autos, or Comida Local gets **zero results**, indistinguishable from "doesn't exist." (Independently reconfirmed — I found this myself before this agent report landed; the agent trace above confirms the exact excluded-category list.)

2. **`/admin/categories`'s live stat columns are wrong for every dedicated-table category.** `fetchListingStatsForCategorySlugs()` (`app/admin/_lib/adminCategoryListingStats.ts`) queries `.from("listings").ilike("category", slug)` for BOTH the "Listings (DB)" total column and the "Pending / flagged" column — for Empleos/Viajes/Restaurantes/Servicios/Autos/Comida Local this returns 0 or a meaningless `ilike` mismatch, not the real count, because those rows never live in the generic `listings` table. **This is a live, owner-facing misleading-count defect**, not just a missing feature — the page presents a number that looks authoritative and is not.

3. **This session's own Phase-1 dedup fix (`computeAdminAttentionReviewTruth`) is confirmed correct as far as it goes but INCOMPLETE**: it unifies generic `listings` + `empleos_public_listings` + `viajes_staged_listings` (3 of 7 dedicated-table populations) but does **not** include Restaurantes, Servicios, Autos, or Comida Local pending/flagged counts. `uniqueListingsNeedingReview` is a real improvement over the old buggy sum, but it is not yet the TRUE company-wide "listings needing review" count. **Recorded as a correction to ADMIN_OS_PROGRESS.md — Phase 1 status downgraded from "core fix done" to "core fix done but confirmed incomplete in scope."**

### SYSTEM: Reports & Complaints (`/admin/reportes`)
- DOMAIN: MARKETPLACE OPS (canonical home) / cross-linked from COMMAND
- CANONICAL_DATA_SOURCE: `listing_reports` (migration `20250312000001`) — columns: `id`, `listing_id` (bare `text`, **no foreign key to any specific table**), `reporter_id` (FK `auth.users`, nullable), `reason`, `created_at`, `status` (default `pending`). RLS: public insert-only; admin reads/writes via service role.
- READ_SERVICE: `app/admin/(dashboard)/reportes/page.tsx` — `.select(...).order("created_at",desc).limit(200)`, `?q=` filters by id/reporter_id/listing_id (UUID) or `ilike` reason.
- WRITE_SERVICE_OR_SERVER_ACTION: `app/admin/actions.ts` — `submitListingReportAction` (public insert, ungated, matches RLS), `updateListingReportStatusAction` (gated by `requireLeonixAdminPermission("can_manage_reports")`, audited via `auditAdminWrite("listing_report_status_updated", ...)`)
- ADMIN_WRITE_CAPABILITY: mark "Reviewed" or "Dismiss" only — **no action here approves/rejects the underlying listing itself** (that happens on a separate page). The page's OWN `AdminPagePurposeCard` self-declares `status="partial"`: "Mark reviewed, clear flag, and resolution workflow need action QA before they are treated as complete."
- CTA_DESTINATIONS: listing_id links to `/clasificados/anuncio/<id>` (public generic-listing detail route) and `/admin/workspace/clasificados?q=<id>` (generic queue) — confirming this table is architecturally scoped to the generic `listings` table only. reporter_id links to `/admin/usuarios/<id>`.
- CURRENT_TRUTH_STATUS: PARTIAL (self-declared in-app).
- KNOWN_BROKEN_OR_SPLIT_WIRING: (1) the on-page pending/reviewed/dismissed counts are computed from the fetched **200-row page**, not a true DB-wide count — silent undercount risk beyond 200 total reports; (2) **this entire system is invisible to Restaurantes/Servicios/Autos/Empleos/Viajes/Comida Local** — those categories' user complaints, if they exist, have no equivalent captured anywhere (no dedicated-table equivalent of `listing_reports` was found for them in this pass).
- MISSING_RELATIONSHIP: `listing_id` has no FK — a report can reference a since-deleted or category-mismatched id with no referential integrity check.
- NOTES: Genuinely separate concern from `listing_moderation_reviews` (AI moderation verdicts) — do not conflate the two tables; both exist, both are real, both are generic-listings-scoped only.

### SYSTEM: Category Registry / Taxonomy Config (`/admin/categories`)
- DOMAIN: MARKETPLACE OPS
- PUBLIC_OR_BUSINESS_PURPOSE: per-category-slug taxonomy metadata (operational status, visibility, sort order, highlight, notes) — NOT a listings CRUD surface.
- CANONICAL_DATA_SOURCE: code-defined registry (`app/lib/clasificados/clasificadosCategoryRegistry.ts`) merged with DB overrides in `site_category_config`
- READ_SERVICE: `getClasificadosCategoryRegistryMerged()`/`summarizeRegistryForDashboard()`
- WRITE_SERVICE_OR_SERVER_ACTION: `saveSiteCategoryConfigRowAction` (`app/admin/siteCategoryConfigActions.ts`) — the ONLY write path from this page; upserts `site_category_config` only, no listing-content CRUD, no delete UI.
- ADMIN_READ_CAPABILITY: renders `<ClasificadosCategoryHub>`, links out to each category's dedicated workspace ("Open queue" / "Live listings" / "Fields & notes") via `getClassifiedsOpsContract(slug)`
- KNOWN_BROKEN_OR_SPLIT_WIRING: **"Listings (DB)" and "Pending / flagged" columns are wrong for every dedicated-table category** — see gap #2 above. This is the same underlying root cause as the global-search gap (both hardcode `.from("listings")`), just manifesting as a misleading number instead of an empty search result.
- CURRENT_TRUTH_STATUS: REAL for taxonomy config; BROKEN for the live listing-count columns on 6 of 13 categories. **[GATE A — FIXED for the 5 of these that appear in this registry's own category list (servicios/restaurantes/autos/empleos/travel); see ADMIN_OS_PROGRESS.md, Gates A-F. Comida Local is not in this registry at all (excluded from categoryConfig.ts) — a separate, still-open gap.]**
- NOTES: Fixing gap #2 and gap #1 above both reduce to the same underlying repair: teach the relevant read services about all 7 dedicated tables, not just the generic one — a single, bounded, reusable fix once repair work begins (not attempted in this mapping pass).

### SYSTEM: Moderation data model (precise, non-conflated)
Two real, separate tables, both scoped to the generic `listings` table only:
- **`listing_reports`** — user-submitted complaints (see Reports system above).
- **`listing_moderation_reviews`** (migration `20260625180000`) — AI/human moderation verdicts. Schema comment: "Append-style AI/human moderation review results for generic listings. Human admin remains final." `source_table` defaults to `public.listings`. Read: `fetchLatestListingModerationReviews` (`listingModerationReviewsDb.ts`), consumed by `adminReviewFlagContext.ts` → `adminDashboardData.ts`'s generic-listings pending-review rows (this session's Phase 2 fix wired this correctly for the first time). Write: `insertListingModerationReview`, called by the AI moderation engine (`listingAiModerationService.ts`) when an admin triggers "Run AI review."
- Dedicated-table categories (Empleos, Viajes) use their OWN `moderation_reason`/`review_notes` columns directly on their own table instead of either of the above two tables — a third, structurally different moderation pattern. Restaurantes/Servicios/Autos/Comida Local's moderation pattern not yet confirmed (pending category sub-agent results).

---

---

## DOMAIN: MARKETPLACE OPS — Per-category dedicated-table systems (confirmed by direct agent trace)

### SYSTEM: Servicios (public discovery + publish + admin ops)
- CANONICAL_DATA_SOURCE: `servicios_public_listings` (+ `servicios_listing_reviews` for customer reviews, `servicios_public_leads` for inquiries)
- PUBLIC_ROUTE_OR_ENTRY: `/clasificados/servicios`, `/clasificados/servicios/resultados` (canonical) + `/clasificados/servicios/results` (thin re-export alias, same code, not dead), `/clasificados/servicios/[slug]`
- PRIMARY_ADMIN_ROUTE: `/admin/workspace/clasificados/servicios` (461-line real ops console: approve/reject reviews, verify toggle, full status lifecycle incl. suspend/archive/republish/promote, all via `app/api/admin/servicios/listings/[id]/route.ts` PATCH, audited)
- ALTERNATE_ADMIN_ENTRY_POINTS: `/admin/clasificados/servicios` — confirmed **dead 5-line redirect stub** to the real workspace route (harmless); `/admin/workspace/clasificados/servicios/sandbox` — explicitly-labeled localStorage-only tier-design tool, does not touch Supabase.
- GLOBAL_SEARCH_SUPPORT: none — bespoke page-local form, not the shared `AdminSearchForm.tsx`, scoped only to `servicios_public_listings`.
- MODERATION_OR_REPORT_LINK_IF_APPLICABLE: **none** — zero references to `listing_reports`/`listing_moderation_reviews` anywhere in Servicios code; uses its own free-text `moderation_notes` column instead.
- KNOWN_DUPLICATION: `resultados/page.tsx` (canonical, richer: pagination + entitlement overlay + ranking) vs `results/page.tsx` (thin re-export of the same, so no functional divergence) vs `resultados/page_temp.tsx` (**confirmed dead**, corrupted/UTF-16 encoding, an older fork, not routable).
- **KNOWN_BROKEN_OR_SPLIT_WIRING (confirmed, high-value): Servicios pending-review listings are 100% invisible to the shared cross-category admin dashboard.** `adminDashboardData.ts` has dedicated fetchers for Empleos and Viajes but zero references to "servicios" anywhere in the file, and Servicios rows never live in the generic `listings` table either — so unlike Empleos/Viajes (first-class in the merged queue), a pending Servicios listing is only discoverable by navigating directly to its dedicated ops page. This directly confirms and sharpens the "3 of 7 categories in the dedup count" gap already logged above.
- CURRENT_TRUTH_STATUS: REAL (admin ops + public discovery); the exact terminal publish-flow write hop is NEEDS_PROOF (client payload-builder chain traced, final Supabase insert/update call site not pinned down).
- NOTES: One of the best-documented categories in the repo (own `SERVICIOS_OPS_PRESENTATION_AUDIT.md` self-declares the canonical table and flags "NEEDS_LIVE_SUPABASE_PROOF for volume QA" itself).

### SYSTEM: Autos (dealer/negocios lane + privado lane — ONE shared table, not two systems)
- **Correction to the working assumption going in**: dealer/negocios and privado are **not separate tables**. Both are rows in the single `autos_classifieds_listings` table, distinguished by a `lane` column (`negocios`|`privado`); same read/write service (`autosClassifiedsListingService.ts`), same API routes, same single admin ops page. This itself is a case of CORRECT non-duplication (one table doing double duty cleanly via a discriminator column) — worth noting as a positive pattern, not a defect.
- CANONICAL_ID: `id` (uuid); `dealer_inventory_group_id` is grouping metadata only, explicitly documented as NOT canonical identity.
- PUBLIC_ROUTE_OR_ENTRY: `/publicar/autos` → `/negocios` or `/privado`; live detail `/clasificados/autos/vehiculo/[id]` (shared URL shape for both lanes); dealer storefront `/clasificados/autos/dealer/[groupId]`.
- PRIMARY_ADMIN_ROUTE: `/admin/workspace/clasificados/autos` — single shared page for both lanes, one row per vehicle, `lane` shown per row via a "via" column. No dedicated `/admin/(dashboard)/clasificados/autos/**` directory exists at all (confirmed).
- ADMIN_WRITE_CAPABILITY: REAL — suspend/restore (negocios restore routes through a capacity-safe atomic RPC, `activateAutosDealerListingAtomic`; privado restore is a direct, simpler update since it isn't capacity-relevant), promote_on/off, verify_on/off, archive, republish — via `app/api/admin/autos/listings/[id]/route.ts` PATCH, audited. Dealer capacity (10 active vehicles, 20 with inventory-pack addon) enforced centrally via the same RPC on both the owner-payment and admin-restore paths — NOT duplicated logic.
- GLOBAL_SEARCH_SUPPORT / MODERATION_OR_REPORT_LINK: **none for either lane** — same pattern as Servicios: bespoke page-local search, zero `listing_reports`/`listing_moderation_reviews` wiring, zero presence in `adminDashboardData.ts`.
- KNOWN_BROKEN_OR_SPLIT_WIRING: same cross-category invisibility gap as Servicios — Autos (both lanes) never appears in the shared admin pending-review queue.
- MISSING_ADMIN_CONTROL: no admin drill-down onto one dealer's full inventory group (flat one-row-per-vehicle table only); no report/flag intake for privado sellers specifically, despite individual-seller listings typically carrying higher scam risk than dealer inventory.
- CURRENT_TRUTH_STATUS: PARTIAL — category registry status is explicitly "STAGED" (per repo's own `CATEGORY_LIVE_TRUTH_STYLE_AUDIT.md`: "Paid autos vertical wired; owner QA before Live"); the admin page's own `AdminPagePurposeCard` self-reports `status="partial"`.
- NOTES: Free-tier privado caps (3 photos, no video/boost/featured) are defined in a contracts file but actual enforcement at publish/boost-purchase time is NEEDS_PROOF (not traced to the boost-policy file in this pass).

### SYSTEM: Restaurantes (public discovery/directory + publish + admin ops)
- CANONICAL_DATA_SOURCE: single table `restaurantes_public_listings` (no separate "application intake" table — the draft form serializes wholesale into this same table's `listing_json` column; confirmed via the category's own `lib/DISCOVERY.md`).
- CANONICAL_ID: `id` (uuid) + `slug` + `leonix_ad_id` (`REST-YYYY-NNNNNN` pattern).
- PUBLIC_ROUTE_OR_ENTRY: `/clasificados/restaurantes` (landing), `/resultados` (canonical results) + `/results` (thin re-export alias, same page), `/[slug]` (detail); 3-hop publish funnel `/clasificados/restaurantes/publicar` (legacy redirect) → `/clasificados/publicar/restaurantes` (plan selector) → `/publicar/restaurantes` (real application form) — confirmed intentional, not broken.
- PRIMARY_ADMIN_ROUTE: `/admin/workspace/clasificados/restaurantes` (real ops queue: suspend/unsuspend/promote/verify/archive/republish, all via `app/api/admin/restaurantes/listings/[id]/route.ts` PATCH, audited). No content/copy editor exists for an individual listing — status/flag toggles only; content corrections must go through the owner's own edit flow.
- ALTERNATE_ADMIN_ENTRY_POINTS: `/admin/workspace/clasificados/category/restaurantes` — a genuinely SEPARATE surface (category/taxonomy content editor, dynamic route, resolves fine) easily confused with the listings ops queue above; NEEDS_PROOF whether it renders meaningful restaurantes-specific content.
- GLOBAL_SEARCH_SUPPORT / MODERATION_OR_REPORT_LINK: **none** — same pattern as Servicios/Autos: bespoke inline admin search form, zero `listing_reports`/`listing_moderation_reviews` wiring, zero presence in `adminDashboardData.ts`.
- KNOWN_DUPLICATION: `RestauranteDetailShell.tsx` + its own `.backup` sibling are **confirmed fully dead code** (zero import references anywhere outside docs); the live detail route actually renders `RestauranteAdStoryPreview`/`RestaurantesShellChrome` instead — safe to delete once proven (already proven here).
- KNOWN_BROKEN_OR_SPLIT_WIRING: same cross-category invisibility gap as Servicios/Autos.
- CURRENT_TRUTH_STATUS: REAL (confirmed by direct file inspection of API routes + read library, not just naming) with the team's own self-reported `nextGate="ADMIN-ACTION-QA-AND-LIVE-SCHEMA-PROOF-01"` still open.
- NOTES: Coupon/add-on entitlement is enforced server-side only from live `listing_package_entitlements` truth on both publish and detail-page render — client-submitted entitlement flags are never trusted; a good positive pattern worth reusing elsewhere.

### PATTERN CONFIRMED ACROSS ALL THREE (Servicios, Autos, Restaurantes) — and matching the earlier Empleos/Viajes findings' shape in reverse:
Every dedicated-table category built so far shares the exact same 4 gaps: (1) zero global-search coverage, (2) zero connection to the shared `listing_reports`/`listing_moderation_reviews` moderation infrastructure (each has invented its own simpler status-only or notes-only moderation instead), (3) zero presence in `adminDashboardData.ts`'s cross-category pending-review dashboard/count (confirmed: Empleos and Viajes ARE first-class there; Servicios, Autos, Restaurantes are NOT, and Comida Local status is still pending agent confirmation), (4) a real, working, audited per-category admin ops console that is only reachable by an operator who already knows to navigate there directly. This is now a **repeating, structural pattern**, not a one-off bug — the repair is almost certainly one bounded, reusable fix (extend the 3 shared surfaces — global search, dashboard dedup count, and ideally a shared report/flag mechanism — to loop over all 7 dedicated tables the same way `fetchEmpleosPendingReview`/`fetchViajesPendingReview` already do) rather than 5 separate category-specific fixes.

---

## DOMAIN: WEBSITE — Site Sections CMS, Settings, Language Audit, Recursos, Iglesias (confirmed by direct agent trace)

### SYSTEM: Site Sections CMS (`site_section_content`) — **3 of 7 domains confirmed BROKEN, silently**
- CANONICAL_DATA_SOURCE: single Supabase table `site_section_content` (section_key, payload jsonb, updated_at) — 11 keys exist: `global_site`, `tienda_storefront`, `home_marketing`, `contacto`, `nosotros`, `revista_spotlight`, `noticias_page`, `iglesias_page`, `cupones_page`, `revista_issue_registry`, `clasificados_category_content`.
- READ/WRITE: one generic reader/writer (`getSiteSectionPayload`/`upsertSiteSectionPayload` in `siteSectionContentData.ts`), used by 7 separate save-action files, each merging the DB payload onto a hardcoded per-domain default (the fallback IS the static layer, not a separate system).
- PRIMARY_ADMIN_ROUTE: `/admin/workspace` (hub) — `/admin/site-sections` and `/admin/website-content` are BOTH confirmed pure redirect aliases into it (legacy URL preservation, not duplicate functionality, but a 3-names-for-1-thing surface that easily reads as 3 competing CMSes).
- **CURRENT_TRUTH_STATUS by domain — this is the single most important WEBSITE finding in the whole map:**
  - `home_marketing`, `global_site`, `noticias_page`: **REAL** — confirmed end-to-end, DB write → merge → actual public render.
  - `nosotros`: **BROKEN.** `nosotrosSectionActions.ts` writes the row; `nosotrosMerge.ts` is imported ONLY by the admin editor. The live public route `/about` imports `getAboutPageCopy()` (a fully hardcoded, unrelated copy source) — zero reference to `site_section_content` or the merge function. An editor can save all day; `/about` never changes.
  - `contacto`: **BROKEN**, identical pattern — `contactoSectionActions.ts` writes the row, `/contacto` renders `getContactPolishCopy()`/`getPublicLocaleCopy()` (fully hardcoded), zero reference to the merge function or the DB row.
  - `cupones_page`: **BROKEN** — `saveCuponesPageAction` writes the row; the matching consumer component `CuponesPageClient.tsx` exists (typed to accept exactly this payload) but is **never imported by any route** (confirmed dead). The real `/cupones` route renders an unrelated Clasificados "ofertas locales" search component instead.
  - `iglesias_page`: **PARTIAL/cosmetic-only.** `/iglesias` DOES call `getSiteSectionPayload("iglesias_page")` — but the result is discarded, never assigned to a used variable. The file's own comment admits this explicitly: "Keep CMS fetch so admin saves still revalidate this route. Landing copy is code-owned..." The admin editor's own subtitle text ("Subtitle and note overlay...") is therefore inaccurate.
- **Compounding meta-gap**: `websiteEditingTruthMatrix.ts` — the ONE page (`/admin/workspace`) whose explicit stated purpose is "truthfully map which public website areas have admin editing today" — **does not list Nosotros, Contacto, Iglesias, Noticias, or Cupones at all**, only Home/Tienda/Clasificados/Header-nav/Footer/Global-settings/SEO/Legal. So the truth-matrix itself omits exactly the domains that are broken, meaning the one tool built to catch this class of defect cannot see it.
- **Cross-cutting auth inconsistency**: `global_site`'s save action is gated by a granular roster permission (`can_manage_website_content`); all 6 other save actions (home/nosotros/contacto/iglesias/noticias/cupones) are gated only by `requireAdminCookie()` — any authenticated admin, no granular check. Inconsistent authorization model across otherwise-identical CMS domains.
- NOTES: The admin UI copy for the broken domains is written confidently enough ("This copy feeds the '/contacto' page on the site") that an editor would reasonably believe changes are live when they are not — this is exactly the kind of owner-trust risk the whole project exists to catch.

### SYSTEM: Global Settings (`/admin/settings`) — self-aware stub, but confusingly named
- CURRENT_TRUTH_STATUS: PLANNED — every input on the page is `disabled`, including the submit button (literal label "Save theme preference (not wired)"). No canonical entity, no read service, no write path, no API route exist at all. This is the single most self-honest page found in the whole audit (`AdminPagePurposeCard status="planned"`).
- **KNOWN_DUPLICATION (real, launch-relevant)**: name/nav collision with `/admin/site-settings` (part of the Site Sections system above, which IS real and writes `global_site`). Both are reachable from top-level nav under near-identical "settings" language (`nav.settings` → `/admin/settings`, `nav.siteSettings` → `/admin/site-settings`). A code comment in `adminGlobalNav.ts` itself acknowledges this exact confusion history.
- MISSING_RELATIONSHIP: not referenced anywhere in `websiteEditingTruthMatrix.ts` either — the truth-matrix omits this page too, so an owner would never learn from the one "honest map" page that `/admin/settings` exists and does nothing.

### SYSTEM: Language Audit (`/admin/workspace/language-audit`) — misleadingly named, non-functional as a QA tool
- PUBLIC_OR_BUSINESS_PURPOSE (as-built, not as-named): a static checklist about the ADMIN dashboard's OWN English-default/Spanish-toggle UI coverage — NOT a bilingual-completeness audit of public site content (despite the very plausible assumption that it would check the Site Sections `{es,en}` payloads above).
- CANONICAL_DATA_SOURCE: **100% hardcoded.** `AUDIT_ROWS` is a 14-row TypeScript constant where every single row is hardcoded `enDefault: true, esToggle: true` with the identical `notesKey: "languageAudit.notes.rowPass"` — there is no way for this page to ever show a failure, regardless of actual translation state.
- **KNOWN_BROKEN_OR_SPLIT_WIRING**: the page's own `AdminPagePurposeCard` claims its data source includes "`translation_records`/server translation cache where used elsewhere" — `translation_records` IS a real table, but it belongs to a completely unrelated ad-translation-caching feature (`app/lib/translation/serverCache.ts`, used by `/api/translate-ad`) and is never imported or queried by this page. The claim creates a false impression of a live data connection.
- MISSING_RELATIONSHIP: has zero connection to the actual bilingual `{es,en}` payloads in the Site Sections system above — a genuinely useful language audit would inspect those for blank `en` fields, but this page does not.
- CURRENT_TRUTH_STATUS: NEEDS_PROOF bordering on BROKEN-as-a-QA-tool — it cannot detect a real translation gap by construction.

### SYSTEM: Recursos Comunitarios — REAL, mature, well-instrumented (positive reference model)
- CANONICAL_DATA_SOURCE: `community_resources` (public catalog) + `community_resource_candidate_reviews` + `resource_intake_jobs`/`resource_change_proposals`/`partner_update_requests`/`source_documents`/`verification_events` (intake/moderation pipeline) — 8 tables total, all confirmed via direct `.from()` grep.
- MODERATION_OR_REPORT_LINK: **REAL and enforced** — every path into the public catalog (PDF/URL intake → candidate review → promotion; ongoing field-drift → change-proposal review; partner-entered updates → request review) requires human disposition before write-back; public reads additionally hard-filter `active=true AND verification_status='verified'` with freshness re-checking. No public submission form exists (admin-triggered intake only) — confirmed, not a gap, since there's no unmoderated-content risk to guard against.
- AUDIT_LINK: real generic `admin_audit_log` writes PLUS a second, domain-specific append-only `verification_events` table (insert-only DB grant) — a genuinely good "two audit trails, one generic + one domain-scoped" pattern, unlike the Business Concierge case where the split was accidental/confusing.
- ADMIN_READ/WRITE_CAPABILITY: full CRUD + lifecycle across all named tables; command-center-style main dashboard aggregates all 4 cross-cutting pending counts (intake jobs, change proposals, partner requests, Spanish reconciliation) in one place — **this is the pattern the Command Center's own "Today's Attention" should be extended toward for the dedicated-table marketplace categories** (see MARKETPLACE OPS gap above).
- CURRENT_TRUTH_STATUS: REAL, no major gaps found. Repo comments actively self-document single-source-of-truth intent ("no second storage system," "the ONLY module... should import from").
- GLOBAL_SEARCH_SUPPORT: none (in-page filter only, not integrated with `/admin/ops`) — same repeating gap pattern as Marketplace categories.

### SYSTEM: Iglesias (church directory + Prayer Wall) — REAL and mature, correcting a stale prior finding
- **Correction to the prior LEO-era audit note** ("landing copy exists, no directory/review queue modeled") — **that note is now stale/false.** This is a fully built, dual-moderation-queue system: church registration → AI-assisted intake triage (AUTO_PUBLISH/HUMAN_REVIEW/BLOCK) → admin approval; prayer submission → AI safety classification (PENDING/HUMAN_REVIEW/CRISIS_REVIEW/CLEARLY_SAFE/DISALLOWED) → separately-permissioned admin moderation (`can_manage_prayer_wall`, distinct from `can_manage_website_content`) before any delivery to a church's private prayer team.
- CANONICAL_DATA_SOURCE: `churches`, `church_submissions`, `church_services`/`ministries`/`media`, `church_prayer_teams`/`church_prayer_team_members`, `prayer_requests`, `prayer_moderation_events`, `prayer_reports`, `prayer_acknowledgements`, `prayer_updates`, `prayer_team_deliveries` — 11 tables, all confirmed.
- AUDIT_LINK: real, dual-trail pattern again (generic `admin_audit_log` + domain-specific `prayer_moderation_events` capturing moderator identity/reason code).
- MISSING_ADMIN_CONTROL (self-documented in the admin UI itself): `churches.verification_status` column exists with no admin UI to set it meaningfully and no public badge renders it ("Verified badge workflow — column exists, not displayed"); church self-service dashboards are deferred by design (admin+email only for V1).
- **MISSING_ADMIN_CONTROL (found by this pass, not self-documented)**: the main `/admin/workspace/iglesias` page shows AUTO-PUBLISHED/NEEDS-REVIEW/BLOCKED counts for churches, but **surfaces no pending-prayer-count badge at all** — a Prayer Wall backlog (including CRISIS_REVIEW items) is completely invisible unless staff separately navigate to `/admin/workspace/iglesias/prayers`. Contrast with Recursos' main dashboard, which does surface all 4 of its cross-cutting pending counts in one place. Given `can_manage_prayer_wall` is a separate, narrower permission than general content management, an under-staffed prayer queue could silently accumulate with zero visible signal anywhere in Admin — this is a genuine, launch-relevant, safety-adjacent gap (crisis-flagged prayer requests specifically).
- CURRENT_TRUTH_STATUS: REAL.

---

## DOMAIN: REVENUE (confirmed by direct agent trace, cross-verified)

### Canonical payment/revenue truth — ONE real aggregator, ONE naming trap
`app/admin/_lib/paymentTrackerData.ts:fetchPaymentTrackerSnapshot()` reading `leonix_payment_records` is the **only** canonical revenue-total computation (faithfully reused, not re-derived, by LEO's `leoPaymentsReportingAdapter`). **But** a second, fully separate `/admin/payments` page still exists (deliberately unlinked from nav, per an explicit `adminGlobalNav.ts` comment) that computes entirely different numbers from `tienda_orders` (the print/merch store) — same word "Payments," two unrelated ledgers. Confirmed as a real UX/discoverability trap, not a data-correctness bug (the two never disagree, they measure different things).

### Launch Leads / Advertising Leads / Promo-Print-Quote Leads — one table, three lenses, three different "is this counted" answers
All three are `leonix_leads` rows (`inquiry_type` discriminator), written by the single canonical `saveLeonixLead()`. **Confirmed real duplication of definitions, not data**: the dashboard tile, the inbox tab filter, and the reply-template detector each independently compute "is this a promo lead" with three different rules (exact match vs. broad regex vs. a third narrower rule) — same table, three disagreeing counts depending which UI you look at. Similarly "active lead" is defined one way on the Command Center dashboard and a broader way in LEO's client-care adapter.
- GLOBAL_SEARCH_SUPPORT: **NO** — `leonix_leads` is not in `adminOpsUnifiedSearch.ts` at all (confirmed by the repo's own `OPS_GLOBAL_LOOKUP_AUDIT.md`).
- MISSING_RELATIONSHIP: leads carry no `business_id`/`listing_id` FK — a lead can never be traced forward into the business/listing it becomes.

### Media Kit requests — **[CLOSED, prior pass]** was CONFIRMED BROKEN, silent split wiring
A fully code-complete dedicated pipeline existed (`leonix_media_kit_leads` table, `saveMediaKitLead()`, `POST /api/media-kit/request`, dedicated `/admin/leads/media-kit` admin page) with **zero live callers** — the real public page's two CTAs both link to `/contacto?inquiryType=advertising|mediaKit`, so real interest lands in `leonix_leads` instead. **Fixed**: `ADMIN_DASHBOARD_ROUTES.mediaKit` now points to `/admin/leads/inbox?view=media_kit` (the canonical destination where real interest actually lands) instead of the starved dedicated page — see `app/admin/_lib/adminDashboardRoutes.ts`'s own `ADMIN-OS-01` comment.

### Cupones CMS write path — **CONFIRMED BROKEN** (independently found by both the Website and Revenue agents)
Cross-verifies the WEBSITE-domain finding above from the money side: `/admin/workspace/cupones/content` persists a `cupones_page` payload to `site_section_content` that is **never rendered** by the live `/cupones` page (which renders `OfertasLocalesPublicSearchClient` instead). `CuponesPageClient.tsx` — the only component that would consume that payload — is confirmed dead (zero live imports).
- Separately, "coupon"-adjacent naming spans **three unrelated systems** with no data overlap: (1) Ofertas Locales coupon listings [real], (2) the dead `cupones_page` CMS [broken], (3) `leonix_promo_codes` Stripe-checkout discount codes [real, unrelated — its own admin page explicitly disclaims the connection in its UI copy].

### Package Entitlements — the strongest-wired system found in the entire audit (positive reference model)
Three legitimate writers (Stripe webhook, admin manual grant, manual-cleared-payment) converge cleanly on one table via an explicit, never-inferred `grant_source` column. Recommend this provenance-tagging pattern as the template for fixing the weaker systems found elsewhere (Team roster, moderation source classification, etc.).

### Promo Codes — real, correctly deferred redemption (webhook-gated, not click-gated)
`validatePromoForPublishCheckout()` is read-only-preview by design; actual redemption is recorded only after Stripe payment confirmation. No defects found.

### Newsletter — REAL capture/list/export, confirmed **no send capability exists at all**
The admin page's own copy admits this ("Reply/Email use mailto... Export/copy emails support manual weekly operations until campaign sending is built"). Matches Master Operating Book §20's revenue-lifecycle question "is a renewal approaching" pattern — this is a genuine, self-disclosed capability gap, not a defect.

### Tienda Orders — real order intake, **confirmed no online payment collection exists** for this product line (fulfillment-workflow only, zero Stripe references under `app/api/tienda/**`), consistent with `/admin/payments`' own "future" roadmap copy.

---

## DOMAIN: PEOPLE (confirmed by direct agent trace)

### SYSTEM: Users
REAL end-to-end (list/detail/disable, full commercial-context composition: ads, entitlements, payments, Tienda orders, reports, audit). GLOBAL_SEARCH_SUPPORT: YES (the one entity type that IS covered by `/admin/ops`).
- KNOWN_BROKEN_OR_SPLIT_WIRING: `updateClientAccountAction` (account_type/tier edit) has **no permission gate at all**, unlike its sibling `setUserDisabledAction` (gated by `can_edit_users`) — a real, confirmed authorization inconsistency. **[GATE B — FIXED, see ADMIN_OS_PROGRESS.md]** Tier vocabulary mismatch between the Users edit page's allow-list and the separate customer-provisioning flow's inserted values — **[CLOSED, Gates 1-5 pass — see ADMIN_OS_PROGRESS.md]**.

### SYSTEM: Team / Staff Roster
REAL CRUD, stricter access gate than Users (`requireAdminTeamAccess`). Two parallel audit trails (a good pattern, mirrored from Business Concierge). 
- **KNOWN_BROKEN_OR_SPLIT_WIRING (confirmed dead end)**: the invite flow (`createTeamInviteIntentAction` → `admin_team_invites`, status "pending") is a complete dead end — nothing anywhere in the repo ever transitions that status or reads the table to complete onboarding. The REAL, working onboarding path (`provisionStaffAuthUser`, "Create staff login") never touches `admin_team_invites` at all. Two fully disconnected staff-creation mechanisms coexist; the one that looks like the "invite" flow does nothing. **[GATE D — FIXED]** Added `resolveTeamInviteIntentAction` (pending → accepted/revoked, using the schema's own pre-existing CHECK vocabulary) plus honest roster-page copy. See ADMIN_OS_PROGRESS.md, Gates A-F.
- GLOBAL_SEARCH_SUPPORT: NO — a staff member cannot be found from `/admin/ops`.

### SYSTEM: Support
**CONFIRMED BROKEN as literally named** — of three plausible "public contact/support" tables, only ONE is actually live:
1. `leonix_contact_inquiries` — a real table, RLS-enabled, whose own migration comment claims it's written by `/api/contact` — **confirmed dead**, zero code references anywhere.
2. `leonix_leads` — the ACTUAL destination of the public Contacto form (`POST /api/leads`), surfaced at `/admin/leads/inbox`, NOT `/admin/support`.
3. `support_tickets` — genuinely separate, internal-only, staff-created ticket log; its own table comment self-discloses "not a public helpdesk — no end-user portal wired yet." Never fed by the public form.
- Also confirmed: `/admin/digital-contact/**` (video-call "virtual front desk" doorbell/presence) is a completely unrelated system, sharing no table with any of the three above — a name-adjacency risk, not a data risk.
- MISSING_RELATIONSHIP: `support_tickets` has no shared key with `leonix_leads`/`leonix_contact_inquiries` — a customer who emails then gets a staff-created ticket about the same issue has no linkage between the two records.

### SYSTEM: Business Concierge / Client 360 — **the single most important finding in the entire cable-mapping pass**
This is the Master Operating Book's own worked example (§2, §24 "La Taquiza") tested directly against real code, and the answer is definitive: **the chain is broken today.**

**What IS real and working:**
- Canonical identity chain: `auth.users` → `business_memberships` (owner/member join, one active primary owner enforced by trigger) → `businesses.id`. Exercised end-to-end by the owner-facing completed-identity page and by a genuinely well-built Owner Claim/Handoff flow (staff generates a one-time hashed token → owner accepts via their own real Supabase Auth login, never the shared bootstrap password → RPC attaches them as primary owner of the SAME business row, never a duplicate).
- Staff CRM loop (list/filter/detail/notes/follow-ups/sales-status) is REAL, reused correctly by 3 independent entry points (main list, canvass, Field Agent PWA) — a genuine positive example of "reuse before rebuild" (doctrine §31).
- `business_sales_audit_log` captures every sales-workflow mutation with real actor attribution.

**Where it breaks — confirmed by direct schema inspection, not inference:**
- `businesses.id` has **no foreign key or join path anywhere in the schema or application code** to: `listing_analytics` (ad performance — keyed instead by the classified listing's own `owner_id`, i.e. the raw auth user id, with zero `business_id` column), `leonix_payment_records` (only a free-text `business_name` column, no `business_id` FK), `leonix_leads` (same — free-text `business_name`/`business_category` only), or `support_tickets` (FKs to `user_id`/`order_id`/`listing_id` only, no `business_id`).
- **Net effect**: there are two entirely parallel identity systems sharing no join key — (1) auth user → owned classified listing (used for ad analytics/payments/leads/support) and (2) auth user → `business_memberships` → canonical business (used for the CRM/onboarding/Living Book side). **The exact "LEO, La Taquiza says their ad isn't working" scenario in Master Operating Book §2/§24 cannot be resolved today** by querying outward from `businesses.id` — an operator (or future LEO) would have to separately guess which classified listing(s) belong to the same raw `owner_id` and query `listing_analytics` for those, with no guaranteed link to whichever listing `business_listing_links` marked "verified" for that business. **[GATE F — PARTIAL]** Owner approved the minimum-change additive model (Business Identity Gate report). New `business_external_links` table (migration written LOCALLY ONLY, not applied) + read-only repo + wired into the Business 360 detail page's "Connected records" section prepare the join for payments/leads/support/analytics — but no rows exist until the migration is applied and an explicit link-creation flow is built (deliberately not built this pass — no auto-linking by business_name, by design). See ADMIN_OS_PROGRESS.md, Gates A-F.
- GLOBAL_SEARCH_SUPPORT: **NONE** — confirmed, `businesses`/`business_id` has zero presence in `adminOpsUnifiedSearch.ts`. A business — the system explicitly meant to be the "360" — cannot be found from the one shared search box.
- Secondary confirmed defect: the Owner Claim/Handoff actions (`createOwnershipClaim`/`revokeOwnershipClaim`/`acceptOwnershipClaim`) have **zero calls into `business_sales_audit_log`**, unlike every other staff action in this module — reassigning who owns a business is currently unaudited in the shared trail (the raw facts survive on the claims table itself, just not surfaced through the audit UI).
- Secondary confirmed defect: `OwnershipClaimPanel` renders unconditionally regardless of the `business_ownership_claim` feature flag (seeded `enabled=false` by its own migration) — the backend correctly enforces the flag on the API routes, but the UI can promise a capability the backend will refuse, producing a raw 503 for a staff member instead of an honest disabled state (a textbook Master Operating Book §7 "raw technical error" violation).
- Confirmed dead code: `BusinessConciergeOwnerHome.tsx` (an owner-facing component that looks like it should be live) has zero live imports anywhere — the real owner hub is a materially different component (`dashboard/business-tools/page.tsx`). Anyone reasoning about "what owners see" from filenames alone would be misled.
- `negocios-locales` (public marketing pillar page) and Business Concierge are confirmed **not the same system** and share no data — the former funnels to `/publicar` (ad creation), not business onboarding.

**This is the highest-priority GAP in the entire cable map relative to the Master Operating Book's own stated purpose**, since Business 360 (§16) and the daily-questions contract (§24) are both explicitly built around exactly this relationship.

---

## DOMAIN: MARKETPLACE OPS — remaining shared-`listings` categories (Clases, Busco, Comunidad) + Ofertas Locales (dedicated, isolated system)

### Clases, Busco, Comunidad — confirmed to share one generic-`listings`-table architecture, one shared rendering layer
All three (plus Mascotas y Perdidos) sit on `public.listings` (`category` discriminator) and share a common, previously-undocumented **"community" rendering/infrastructure layer** (`app/(site)/clasificados/community/**` and `app/(site)/publicar/community/**`) that has **zero routes of its own** — it is pure shared detail/discovery/publish logic consumed by all four categories via per-category "legacy adapter" files. This is a confirmed POSITIVE pattern (one real implementation, not four copies), not a defect — flagged here so future work doesn't mistake "community" for an orphaned fifth category.
- All three: `resultados`/`results` route pairs are confirmed non-duplicative (one re-exports the other) EXCEPT a real, code-acknowledged risk in Busco: the shared `buildCategoryResultsUrl()` helper's **default segment is `"results"`**, while several of Busco's own callers hardcode `"resultados"` — both work today only because of the re-export shim; if that shim were ever removed, half of Busco's CTAs would silently 404.
- All three: category-specific admin field editing does not exist — the generic `listings/[id]/edit` page has zero category-aware fields for any of them (e.g., Clases' class-type/schedule/skill-level detail pairs cannot be corrected from admin without touching raw JSON).
- All three: fold into `adminDashboardData.ts`'s generic, uncategorized `fetchListingsPendingReview()` (no category filter), so they're already included in the Phase-1 dedup count fixed this session — no additional gap here, unlike the dedicated-table categories (Servicios/Autos/Restaurantes/Empleos/Viajes/Comida Local) documented earlier.
- Confirmed REAL moderation/report wiring for all three via the shared `submitListingReportAction` → `listing_reports` (since they live in `public.listings`, they inherit the generic infrastructure other dedicated-table categories lack).
- Busco-specific confirmed gap: the quick-publish form has no update-by-id branch — re-running it to "edit" an already-published listing always INSERTs a new row; the only real edit surface is the generic owner dashboard's edit page.
- Truth status: all three are registry-classified `staged`/`partial` (not primary-LIVE), consistent with actual code maturity (real end-to-end pipelines, just not promoted).

### Ofertas Locales — fully dedicated, 11-table system, real end-to-end pipeline, but **structurally invisible to every admin-wide aggregate**
Parent/child entities (`ofertas_locales` offers + `oferta_local_items` line items), a genuinely sophisticated AI-scan intake pipeline (Gemini/Document-AI extraction, manual owner-triggered scanning, item-level review, paid/courtesy entitlement gating, auto-activation on payment webhook) — REAL and internally consistent.
- **CONFIRMED KNOWN_BROKEN_OR_SPLIT_WIRING**: because this category lives entirely outside `public.listings` AND outside `clasificadosCategoryRegistry.ts`/`categoryConfig.ts`, it is invisible to the category command center, the admin dashboard's pending-review aggregation, AND the generic per-category `[slug]` admin route pattern (its own static route wins over the catch-all, so assuming all category-ops pages are registry-driven would be wrong specifically for this one). No cross-category badge exists anywhere signaling that Ofertas Locales has pending review/scan-stuck items — an operator must already know to navigate directly there.
- Confirmed a documentation error propagated across multiple internal audit docs: the AI item table is `oferta_local_items` (via `oferta_local_scan_jobs`), NOT `oferta_local_ai_scan_items` as several `.md` audits claim (a filename-vs-table-name conflation).
- Confirmed dead/duplicate write path: `POST /api/ofertas-locales/admin/[id]/review` wraps the identical mutation function the live UI's server action already uses — exercised only by test/verify scripts, not by any live UI.
- GLOBAL_SEARCH_SUPPORT: none (same repeating pattern as every other dedicated-table marketplace system).
- Business-doctrine note (not a bug): paid ($399) flyers auto-publish via the payment webhook without routine staff review by deliberate design — the "admin approval queue" for paid flyers is really an exception queue.

## PENDING DOMAINS
MARKETPLACE OPS, REVENUE, PEOPLE, WEBSITE sections will be appended here verbatim once their
background agents return, then reconciled for duplication against the COMMAND/SYSTEM findings
above (in particular: which categories share the generic `listings` table vs. have their own,
and whether Business Concierge uses `admin_audit_log` or a separate audit mechanism).

---

## FINAL MASTER-BOOK COMPLETENESS PASS — new/repaired cable entries

- **SYSTEM HEALTH — Stripe/Email/SMS config-presence, newly wired.** `adminSystemHealth.ts` now
  calls `isRevenueStripeConfigured()` (`app/lib/listingPlans/revenueStripe.ts`),
  `resolveLeonixResendConfig().ok` (`app/lib/email/leonixResendConfig.ts`), and
  `isTwilioVerifyConfigured()` (`app/lib/sms/twilioVerifyProvider.ts`) as three new
  `LeoSystemHealthComponent`s (`stripe_payments`, `email_resend`, `sms_twilio`). All three are pure
  boolean config-presence checks — no secret value is ever read into the component, no outbound
  network call is made. Live provider reachability (as opposed to config presence) remains
  unwired — a genuine `NEEDS_RUNTIME_PROOF` gap, not fabricated as healthy.
- **REVENUE — `failedCanceledRefundedCount`, previously computed-and-discarded, now wired end to
  end.** `fetchPaymentTrackerSnapshot()` (`app/admin/_lib/paymentTrackerData.ts`) already computed
  this count (payment_status IN `failed`/`canceled`/`refunded`/`disputed`, bounded to the most
  recent 500 records) but `getPaymentTrackerDashboardSnapshot()` dropped it before it reached any
  UI — the same "computed but discarded" bug pattern found repeatedly elsewhere in this project.
  Now threaded through `PaymentTrackerDashboardSnapshot` → `app/admin/(dashboard)/page.tsx`'s
  `paySnap` → a new "Payments at risk" `OperatorCard` in the Command Center.
- **PEOPLE/SUPPORT — real `support_tickets.status` count, replacing a stale disabled-accounts
  proxy.** `adminDashboardData.ts`'s `getAdminDashboardSnapshot()` previously had no query against
  `support_tickets` at all; the only "support-shaped" number on the dashboard was
  `usersNeedingHelpProxy` (disabled `profiles` count — a materially different signal). Added a real
  `openSupportTicketsCount`/`openSupportTicketsFallback` query
  (`.from("support_tickets").select("id", {count:"exact", head:true}).in("status", ["open",
  "in_progress"])`, matching the table's real CHECK constraint values `open`/`in_progress`/
  `closed`). Surfaced as a new "Unresolved support" card in Today's Attention and as the real
  metric on the existing "Support tickets" card in People+Support (previously body-text-only, no
  metric).
- **SYSTEM HEALTH — Command Center orphan closed.** The real `/admin/system-health` page (built in
  an earlier session) had no entry in `ADMIN_DASHBOARD_ROUTES` and no link anywhere in the Command
  Center's own "System Health / Bug Finder" section, which showed only `PlannedCard` placeholders
  next to it. Added `systemHealth: "/admin/system-health"` to `ADMIN_DASHBOARD_ROUTES` and a real
  `OperatorCard` linking to it — this was a genuine orphan (existing product control, invisible from
  the Command Center), not a missing feature.
- **Confirmed non-orphans (verified via grep, not assumed)**: Noticias/Iglesias are absent from
  `adminGlobalNav.ts` by design — both are correctly nested and linked from the Website Control
  workspace hub (`app/admin/(dashboard)/workspace/page.tsx`), the same nested-IA pattern already
  used for Servicios/Autos/Restaurantes under Clasificados. "Which clients need follow-up" already
  has a real, previously-verified answer via `composeStaffConciergeHome()` on `/admin/businesses`
  — no new code needed.
- **Still-open, not fabricated**: cross-category "what's blocked by money" aggregate spanning
  autos/comida-local/restaurantes `pending_payment`-style statuses was not built this pass — exact
  column/status names for comida-local and restaurantes were not verified with enough confidence
  within a source-inspection-only budget. `OWNER_DECISION_REQUIRED`, not guessed.

---

## SYSTEM: Business Proposals / Promise Keeper ("Program 5") — real, mature, previously
## unmapped commercial-lifecycle system; corrects an earlier pass's error

**Correction of record**: an earlier pass classified "business quote/estimate object" as
`OWNER_DECISION_REQUIRED` with the note "no such table exists anywhere in the schema." That was
wrong — it was never actually verified against the schema, only assumed. `business_proposals`
(`supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql`) is a real,
mature system:
- SYSTEM: Business Proposals (`business_proposals`, `business_proposal_versions`)
- DOMAIN: PEOPLE / REVENUE (business commercial lifecycle)
- CANONICAL_ENTITY: proposal, keyed to `business_id`
- CANONICAL_DATA_SOURCE: `business_proposals` — real lifecycle
  (`draft → staff_review → owner_review → accepted/declined/expired/superseded/cancelled`),
  pricing snapshotted from `revenue_pricing_matrix` (never invented), scope/deliverables/timeline/
  success-metric fields, atomic acceptance attribution enforced by CHECK constraints (staff actor
  requires roster_id; owner actor must not carry one; accepted requires full atomic attribution).
- PRIMARY_ADMIN_ROUTE: `/admin/businesses/[businessId]` → "Client Decision" tab
  (`ProposalActions.tsx`'s `CreateProposalForm`/`ProposalDetailPanel`)
- ADMIN_READ_CAPABILITY / ADMIN_WRITE_CAPABILITY: real, gated by `create_proposal`/
  `review_proposal`/`record_proposal_decision` capabilities — not open to every role
- GLOBAL_SEARCH_SUPPORT: none (not added this pass — proposals are reached via Business 360, which
  is itself now searchable; a separate direct proposal search was not identified as a named gap)
- RELATED: `business_commitments`/`business_commitment_events` ("Promise Keeper") — a real
  post-acceptance task/follow-through tracker (planned/active/blocked/completed/released), linked
  to `proposal_id`. This is NOT renewal/subscription semantics — it is follow-through tracking on
  work already agreed to.
- KNOWN_BROKEN_OR_SPLIT_WIRING: none found. This is a well-built, honest, doctrine-compliant
  system — the UI's own copy explicitly discloses what acceptance does NOT do: "Downstream
  contract, DocuSign, Stripe, and publication still remain." This is the direct evidence that
  contract execution (signed document) is genuinely not built yet — `OWNER_DECISION_REQUIRED`,
  not a wiring gap.
- NOTES: This system was apparently mapped by neither this project's original cable-mapping pass
  nor any subsequent pass until now — a real miss. Recorded here so it isn't lost again.

---

## SYSTEM: Stripe observability (`leonix_stripe_webhook_events`) — real local evidence,
## now wired into System Health

`leonix_stripe_webhook_events` (`20260805090000_leonix_stripe_webhook_events.sql`) is a real,
already-populated durable log of every Stripe webhook Leonix has received (`status` state machine:
received/processing/completed/failed_retryable/failed_terminal/ignored; `last_error`;
`received_at`). This was previously undiscovered/unused by System Health, which relied on
config-presence only for Stripe. **Fixed**: `adminSystemHealth.ts`'s `buildStripeHealthComponent()`
now reads the last 24h of this table (bounded, no outbound calls) and reports `DEGRADED` on any
`failed_terminal` row, `HEALTHY` on all-clear, falling back to config-presence-only `HEALTHY` when
there's no recent data to compare against. No equivalent durable log exists for Resend or Twilio
(confirmed via migration search) — those two correctly remain config-presence-only.

---

## FINAL CODE/RELEASE VALIDATION GATE — 2 verify-script assertions found stale, corrected

Full typecheck/lint/build/targeted-verification/migration-static-validation pass at HEAD
`ce25c643` (see ADMIN_OS_PROGRESS.md for the complete gate-by-gate record). Two existing verify
scripts asserted facts about the codebase that this project's own earlier, deliberate, already-
proven-correct work had legitimately changed:
- `scripts/verify-admin-dashboard-ceo-command-center.mjs` expected
  `classifyDashboardReviewRowFlagTruth` to be called directly inside
  `AdminCommandCenterDashboard.tsx`. Commit `2710cb9e` ("ADMIN-OS-01 GATE C") moved that call into
  the data layer so the dashboard reads each row's pre-computed `row.flagTruth` instead —
  preventing exactly the provenance-mislabeling bug the old inline call risked. Corrected the
  script to check the call where it now lives, rather than reverting the improvement.
- `scripts/verify-admin-roster-foundation-01.ts` asserted `admin_audit_log`'s writer contains no
  actor-related code at all, as historical proof `admin_roster_audit_log` was needed. This
  project's own audit-actor-attribution work (see the Stripe/audit sections above) gave
  `admin_audit_log` real, best-effort, never-fabricated actor attribution — the check's own
  comment anticipated this exact scenario. Corrected the script to assert the new code is honest
  (nullable, best-effort) and that `admin_roster_audit_log` remains the stricter, NOT-NULL-enforced
  authority for roster-specific actions.

Both corrections are recorded here so future passes reading this cable map understand why these
scripts' assertions changed — not because the underlying architecture regressed, but because two
earlier, real improvements were correctly reflected in their own regression tests.

---

## V2 CONSTITUTION ALIGNMENT AUDIT — new findings

### SYSTEM: Executive Hub / Staff Contact Profile — real, mature, previously under-linked
### from Team; not the same identity as staff login

Never given its own cable-map entry in any prior pass despite being a real, complete system.
Recorded properly now per §0G/§0I:

- **PUBLIC_ROUTE**: `/contact/[slug]` (`app/contact/[slug]/page.tsx`), statically generated via
  `listPublishedExecutiveContactSlugs()`.
- **CANONICAL_ENTITY / DATA_SOURCE**: `public.executives`
  (`20260810120000_executive_hub_executives.sql`) — real, DB-first read priority over the legacy
  `digitalContactRegistry.ts` hardcoded fallback (kept alive only so `/contact/chuy` and
  `/contact/isaias` don't 404 during migration).
- **PRIMARY_ADMIN_HOME**: `/admin/team/executive-hub` (list) + `new/`, `[slug]/edit/`,
  `[slug]/preview/` siblings. Writes via `app/admin/executiveHubActions.ts` server actions.
- **ADMIN_WRITE_CAPABILITY**: page-level gate is `canViewAdminTeam` = `role === "owner_admin"`
  only. The underlying server-action gate (`assertExecutiveHubAdmin()` →
  `requireLeonixAdminPermission("can_manage_team")`) would technically pass for any active roster
  member granted that permission, but no non-owner UI route exists to reach it — a **latent, not
  active, gap**: nothing currently exploits it, but it means the real authorization boundary is
  narrower in the UI than in the server action.
- **STAFF SELF-EDIT**: no route exists. A staff member cannot maintain their own contact profile
  today — §0G says "Authorized staff should be able to maintain their own allowed profile/contact
  fields where product policy permits" — this is a genuine, documented gap, not built this pass
  (a real self-service route is a moderate feature addition, not a tiny wiring fix).
- **RELATIONSHIP TO STAFF LOGIN (`admin_team_members`)**: **none at the schema level.**
  `executives.email` is a plain `text` column with no FK, unique constraint, or trigger tying it to
  `admin_team_members`. They are two fully disconnected identity systems joined only informally
  (if at all) by a human typing the same email into both. Creating a staff login
  (`createStaffUserWithAuthAction`) never mentions, links to, or redirects toward Executive Hub —
  confirmed via direct read of `app/admin/teamProvisioningActions.ts`.
- **QR/vCard/contact actions**: fully real — `DigitalContactQrCode.tsx` (dynamic QR),
  `DigitalContactSaveButton.tsx` → `/api/digital-contact/vcf/[slug]/route.ts` (vCard download),
  `digitalContactVCard.ts` (RFC 6350 builder).
- **CONFIRMED REAL ORPHAN, FIXED THIS PASS**: `app/admin/(dashboard)/team/roster/page.tsx` was the
  *only* Team page that hardcoded `<StaffTeamNav showRosterLink={false} />` — every sibling Team
  page (`/admin/team`, `/admin/team/executive-hub/*`, `/admin/team/users/new`,
  `/admin/team/promo-codes`, `/admin/team/sales-tracker`) computes or hardcodes `true` for the same
  or a weaker access level. Since Roster itself is already owner_admin-gated
  (`requireAdminTeamAccess`), there was no reason for it alone to hide the "Executive Hub (owner)"
  tab its own sibling pages already show. **Fixed**: changed to `<StaffTeamNav showRosterLink />`,
  matching every sibling page's pattern. This was the exact discoverability gap named in this
  audit's brief ("Team Roster exposes staff login/access... staff contact/public-profile
  functionality... is not currently obvious/discoverable from Team").
- **COMPANY_SEARCH_SUPPORT**: **NO** at the time of this pass — `executives` rows were not covered
  by `runAdminUnifiedSearch`/`adminExtendedGlobalSearch.ts`. **Closed in a later gate** — see the
  "Executive Hub / Staff Contact Profile — Company Search coverage" section at the end of this
  document.
- **ADMIN_GUIDE_ENTRY**: none — no Admin Guide system exists at all yet (see below).

### BUG FOUND AND FIXED: `/admin/system-health` was invisible in the actual rendered sidebar
### for every role, including the owner

A prior pass added `system-health` to `ADMIN_GLOBAL_NAV` (the raw sidebar item array) and to
`ADMIN_DASHBOARD_ROUTES`, and linked it from the Command Center — but never added
`/admin/system-health` to `getAllowedGlobalNavHrefs()` in `adminAccessControl.ts`, which is the
function `AdminSidebar.tsx` actually filters the rendered sidebar through
(`ADMIN_GLOBAL_NAV.filter((item) => allowedGlobalNavHrefs.includes(item.href))`). The net effect:
System Health had a real Command Center card and a real page, but the sidebar itself would never
show it for ANY role, including `owner_admin` — a genuine Admin Independence violation (§0A: "a
capability is not operationally complete merely because [it exists]... an authorized human must be
able to locate [it]"). **Fixed**: added `/admin/system-health` to the `canViewGlobalAdminNav`
bucket in `getAllowedGlobalNavHrefs()`, the same general-visibility bucket team/clasificados/etc.
already use. Re-ran `verify:admin-nav-ops` (75 checks) to confirm no positional/literal-href
assertion broke.

### ADMIN GUIDE / OPERATIONS MANUAL (§0C) — confirmed MISSING as a system, real partial
### foundation already exists

Grepped the entire `app/admin` tree for "Admin Guide", "Operations Manual", "AdminGuide",
"adminGuide", "Help with this page", "What can I do here" — **zero matches**. No central,
searchable, browsable operational manual exists anywhere in the current Admin OS.

**Real partial foundation already exists and is already deployed project-wide**:
`AdminPagePurposeCard` (`app/admin/_components/AdminPagePurposeCard.tsx`) renders `title`,
`purpose`, `dataSource`, `status`, `safeActions[]`, `nextGate`, and an optional `warningNote` on
every page that uses it — confirmed in dozens of Admin pages via `data-admin-purpose-card="true"`.
This is real, human-readable, per-page "what is this and what can I safely do here" — but it is
NOT: centrally searchable, browsable as a manual, cross-linked by "related modules," annotated
with "common failures"/"manual recovery path"/"who normally uses this," or reachable via any
dedicated Admin Guide nav entry or search box. It satisfies a meaningful fraction of §0C's guide-
entry schema per page, but does not constitute the "Admin Guide / Operations Manual" system itself.

**Recommendation, not built this pass** (a real Admin Guide is a genuine, non-trivial new system —
explicitly out of this audit's "tiny fix" scope): a central `/admin/guide` (or similar) route that
indexes every page already carrying an `AdminPagePurposeCard`-style entry, extended with the
missing §0C fields, with its own keyword search distinct from Company Search
(`adminOpsUnifiedSearch.ts`/`adminExtendedGlobalSearch.ts`). This is the single largest concrete
gap this V2 alignment audit found.

### COMPANY SEARCH vs ADMIN GUIDE SEARCH — confirmed as two genuinely separate systems today,
### correctly not conflated

Company Search (`runAdminUnifiedSearch`) is real and covers: profiles/users, generic listings,
Tienda orders, listing reports, all 7 dedicated-table marketplace categories, businesses,
admin_team_members (staff login identity), leonix_leads, payments/entitlements, community
resources (Recursos), magazine issues (Revista), and support tickets. It does not yet cover
`executives` (staff contact profiles, see above) or Noticias (no article entity exists at all —
confirmed, documented, not a gap). There is no Admin Guide Search at all because there is no Admin
Guide content yet to search — the two systems are correctly distinct in the codebase (no code
conflates them), but only one of the two exists.

### OWNER AUTH MODEL (§0F) — architecture already broadly aligned with break-glass doctrine;
### recommend confirming/completing the real per-person owner account

`app/admin/login/page.tsx` already presents two visually and semantically distinct paths: a
primary, always-visible "Staff / Team login" form (real Supabase Auth email/password against
`admin_team_members`), and a collapsed `<details>` element labeled "Owner bootstrap (shared
password)" with its own honest copy ("Legacy owner access when Supabase team accounts are not
configured"). `app/lib/supabase/adminSession.ts` already treats bootstrap as a distinct, signed,
expiring session type, shorter-lived than the 7-day staff session, explicitly commented "bootstrap
is emergency/owner-only access, not a daily-use identity" — this already matches §0F's break-glass
doctrine closely at the code/UI level. Bootstrap sessions CAN be bound to a real
`admin_team_members` identity via the `ADMIN_OPERATOR_EMAIL` env var (a deployment-wide setting,
not per-login), so audit attribution is possible even under bootstrap when configured.

**What could not be verified from source alone (a live-data fact, not a code fact)**: whether
`chuy@leonixmedia.com` is currently provisioned as a real `admin_team_members` row with a working
Supabase Auth password, i.e., whether the owner's actual daily login today already uses the
"Staff / Team login" form rather than the bootstrap fallback. No migration seeds this row.
**Recommendation**: confirm (or create, via the existing real `createStaffUserWithAuthAction` flow)
a first-class `owner_admin` roster row + Supabase Auth account for `chuy@leonixmedia.com`, so the
owner's normal daily identity is the same attributable, auditable path every other staff member
uses, with bootstrap reserved for genuine recovery scenarios (e.g. Supabase Auth outage). This is
a deployment/data action, not a code change — not performed by this pass.

---

## SYSTEM: Admin Guide / Operations Manual — new, first-class SYSTEM (Master Operating Book
## V2 §0C)

- SYSTEM: Admin Guide / Operations Manual
- DOMAIN: SYSTEM (nav group), but its content spans all six operating domains
- PUBLIC_OR_BUSINESS_PURPOSE: Internal-only — teaches an authorized human (owner or staff) how to
  operate Leonix from Admin without LEO, source code, or tribal knowledge. Not customer-facing.
- CANONICAL_ENTITY: `AdminGuideEntry` (a documentation record, not a business entity)
- CANONICAL_DATA_SOURCE: `app/admin/_lib/adminGuideRegistry.ts` — a single in-repo TypeScript
  array, 39 entries, no database table. Deliberately data-in-code rather than data-in-DB: this
  content changes with the codebase, not with business data, and keeping it in the same file
  reviewed alongside route/permission changes is the intended maintenance model (see §33A).
- READ_SERVICE: `getAdminGuideEntryForRoute()`, `getAdminGuideEntryById()`, `searchAdminGuide()`,
  `isAdminGuideRouteAccessible()` — all pure functions in the same file.
- WRITE_SERVICE_OR_SERVER_ACTION: none — the registry is edited directly as source code per the
  "HOW TO ADD A NEW ADMIN GUIDE ENTRY" doc block at the top of the file.
- PRIMARY_ADMIN_ROUTE: `/admin/guide`
- ALTERNATE_ADMIN_ENTRY_POINTS: `/admin/guide/[id]` (detail view), the shared
  `AdminPageHelpLink` floating "Help with this page" affordance (wired into `AdminShell.tsx`,
  present on every protected Admin page), 10 curated "I need to..." quick-task links on the Guide
  home itself.
- ADMIN_READ_CAPABILITY: every authenticated Admin role, including sales_rep (harmless, read-only,
  no company data — a deliberate §0E choice, not an oversight).
- ADMIN_WRITE_CAPABILITY: none (read-only system by design).
- GLOBAL_SEARCH_SUPPORT (= COMPANY_SEARCH_SUPPORT): intentionally NO — Company Search finds
  records, this system finds operational knowledge. See ADMIN_GUIDE_SEARCH below for its own,
  separate search.
- ADMIN_GUIDE_ENTRY (V2, new field): not applicable to itself — the Guide does not need a guide
  entry pointing at the Guide.
- CUSTOMER_OR_BUSINESS_CONTEXT_LINK: none — this system is about Admin itself, not company records.
- AUDIT_LINK: none — read-only, nothing to audit.
- SYSTEM_HEALTH_RELATIONSHIP (V2, new field): none — the Guide has no external dependency to
  monitor; it is static, in-repo content.
- MANUAL_OPERATING_PATH (V2, new field): this system IS the manual operating path for every other
  system — it has no path of its own beyond "open the page and read/search."
- LEO_SAFE_READ_SOURCE: YES for the registry itself (`leoSafeReadSource: true` on nearly every
  entry) — a future LEO integration should read this same registry as its own operational
  knowledge base rather than building a second, parallel explanation of what each Admin page does.
- CTA_DESTINATIONS: every entry's "Open" CTA points at that entry's own real, already-cable-mapped
  `route` — no new destinations were created, only pointers to existing ones.
- CURRENT_TRUTH_STATUS: REAL — confirmed via direct code read (this system, built this pass) and
  `verify:admin-nav-ops` (75 checks, unchanged pass count after the new nav item).
- ADMIN GUIDE SEARCH (distinct system, §0C): `searchAdminGuide()` — plain term-scoring over
  title/keywords/purpose/useWhen/commonTasks/howTo/statuses/canonicalEntity. Confirmed to resolve
  every one of the task brief's 13 example phrases ("failed payment," "turn off listing," "staff
  contact," "create employee," etc.) to a sensible entry. This is genuinely separate code from
  Company Search (`adminOpsUnifiedSearch.ts`/`adminExtendedGlobalSearch.ts`) — no shared query
  path, no conflation.
- KNOWN_BROKEN_OR_SPLIT_WIRING: none found.
- MISSING_ADMIN_CONTROL: staff cannot edit their own Executive Hub contact profile from anywhere,
  including from this Guide — the Guide correctly documents this as a real gap rather than
  implying it exists (`executive-hub` entry's `failureGuidance` field states this explicitly).
- MISSING_RELATIONSHIP: `executives` (Executive Hub) is not yet covered by Company Search — a
  pre-existing gap from the prior V2 audit pass, unrelated to and unchanged by this Guide-build
  gate.
- NOTES: 39 entries across all 6 domains, covering 19/19 primary `ADMIN_GLOBAL_NAV` items (100%)
  plus 20 additional real sub-area routes explicitly named in this gate's brief. A real bug was
  found and fixed while wiring the nav entry: `getAllowedGlobalNavHrefs()` and
  `isStaffSalesAllowedAdminPath()` both needed `/admin/guide` added, or the new nav item would
  have been visible-but-unreachable for a sales_rep (the same class of bug this project already
  found and fixed once for `/admin/system-health` in the prior V2 audit pass — worth remembering
  as a recurring failure mode: adding a route to the SIDEBAR array alone is not sufficient, the
  permission-filter functions must be updated in the same change).

---

## SYSTEM: Executive Hub / Staff Contact Profile — updated: staff self-service, real FK linkage

Updates the Executive Hub cable-map entry from the prior V2 audit pass now that staff self-service
exists (Master Operating Book V2 §0G).

- **NEW CANONICAL LINKAGE**: `executives.linked_roster_id uuid REFERENCES admin_team_members(id)
  ON DELETE SET NULL` (`supabase/migrations/20260910120000_executives_linked_roster_id.sql`,
  additive, nullable, NOT applied remotely). A partial unique index
  (`executives_linked_roster_id_uidx WHERE linked_roster_id IS NOT NULL`) prevents the same
  roster member being linked to two different executive profiles. This is the first real,
  FK-based relationship between `admin_team_members` (login/roster identity) and `executives`
  (public contact profile) — previously these were two fully disconnected identity systems joined
  only informally by a human typing the same email into both, confirmed absent in the prior pass.
- **PRE-MIGRATION SAFETY**: every existing read/write path against `executives`
  (`dbListExecutiveHubRecords`, `dbGetExecutiveHubRecord`, `dbGetPublishedExecutiveProfile`,
  `dbCreateExecutiveHubRecord`, `dbUpdateExecutiveHubRecord`) now requests `linked_roster_id`
  first and gracefully retries without it on an unknown-column error — the same pattern already
  proven for `admin_audit_log`'s actor columns. The live public `/contact/[slug]` page is
  unaffected either before or after the migration is applied.
- **NEW STAFF-FACING ADMIN ROUTE**: `/admin/team/my-profile` — staff self-service, reachable by
  any authenticated Admin user (any role, including sales_rep — already covered by
  `isStaffSalesAllowedAdminPath`'s existing `/admin/team/*` prefix). Resolves the caller's
  identity via `resolveActingRosterIdentity()` and their linked profile via
  `getExecutiveHubRecordByRosterId()`; renders the self-service `ExecutiveHubForm` (`mode="self"`)
  only when both resolve, otherwise an honest explanatory message — never a form it cannot save.
- **NEW SERVER ACTION**: `app/admin/executiveHubSelfServiceActions.ts` —
  `updateOwnExecutiveHubProfileAction`. The actual security boundary: resolves identity
  server-side only, reads an explicit allow-list of safe field names from FormData, and writes via
  the existing `updateExecutiveHubRecord()` store function scoped to the caller's own resolved
  slug. Never reads a client-supplied slug/id/executiveId. See ADMIN_OS_PROGRESS.md's "STAFF
  SELF-SERVICE EXECUTIVE HUB PROFILE" section for the full security argument and the 7 required
  properties this satisfies.
- **ADMIN_WRITE_CAPABILITY, updated**: owner_admin retains full write capability over every field
  (unchanged). A staff member whose profile is linked (`linked_roster_id` set by an owner) may
  additionally self-edit exactly: preferredName, title, bio, phone, whatsapp, email, socials,
  theme, photo. Every other field (slug, status, company, legalEntity, address, website, logo,
  cover, businessHubLink, connectionHubLink, workingHours, trustChips, languages, notes,
  metaDescription, and the linked_roster_id assignment itself) remains owner_admin-only.
- **ADMIN_GUIDE_ENTRY, updated**: `executive-hub` entry revised to describe the owner-management
  surface accurately post-linkage; new dedicated `my-profile` entry added for the staff-facing
  side. Both entries cross-reference each other and the real `/contact/[slug]` public route.
- **COMPANY_SEARCH_SUPPORT**: still NO at the time of this pass — unchanged from the prior pass's
  documented gap. This gate's scope was authorization/profile wiring, not search indexing.
  **Closed in the next gate** — see the "Executive Hub / Staff Contact Profile — Company Search
  coverage" section at the end of this document.
- **MISSING_ADMIN_CONTROL, closed this pass**: "staff cannot edit their own Executive Hub contact
  profile from anywhere" (flagged in the prior V2 audit pass) is now closed for the edit case.
  Self-service profile CREATION remains a genuine, separate, not-yet-built capability — a staff
  member can only edit a profile an owner has already created and linked.
- **KNOWN_BROKEN_OR_SPLIT_WIRING**: none found or introduced.
- NOTES: 20/20 targeted security checks pass (`verify:executive-hub-self-service`, new script);
  `verify:admin-nav-ops` (75/75) and `verify:admin-roster-foundation` (32/32, same 1 pre-existing
  unrelated failure as every prior pass) both re-confirmed unaffected.

---

## SYSTEM: Executive Hub / Staff Contact Profile — Company Search coverage

Closes the `COMPANY_SEARCH_SUPPORT: NO` gap documented in both sections above (Master Operating
Book V2 §17 Global Search Contract / §0C Company-Search-vs-Admin-Guide-Search distinction).

- **COMPANY_SEARCH_SUPPORT**: **YES**, as of this gate. `public.executives` rows are now one of
  the sources `adminExtendedGlobalSearch.ts` unions into `runAdminUnifiedSearch()` (rendered at
  `/admin/ops`). No new table, no new query engine — reuses `listExecutiveHubRecords()`
  (`executiveHubStore.ts` → `dbListExecutiveHubRecords()`) exactly as the owner's own Executive
  Hub list page already does, so it automatically inherits that function's existing
  pre-migration-safe fallback for `linked_roster_id`.
- **SEARCHABLE_FIELDS**: `fullName`, `preferredName`, `title`, `email`, `slug`, `company`,
  `phoneDisplay`, `phoneDigits` — plus an exact `linkedRosterId` match when the query itself is a
  UUID. Deliberately excludes `notes` and `metaDescription` (internal-only per the schema's own
  intent) and every other non-public field.
- **RESULT_TYPE**: `entityType: "executive_profile"`, `entityLabel: "Staff contact profile"` — a
  new, distinct classification from the pre-existing `entityType: "team_member"` /
  `entityLabel: "Staff"` result (Team Roster login/access identity). The two are never merged or
  made to look interchangeable; a result linked to a real roster identity additionally shows
  "Linked to a staff login account" in the Ops UI.
- **PERMISSION-AWARE DESTINATION**: this was the actual hard part, since `/admin/ops` (where
  Company Search renders) is reachable by more roles than `/admin/team/executive-hub/*` (owner-only,
  gated by `canViewAdminTeam`). `ops/page.tsx` now computes a real `viewer` context
  (`{ rosterId, isOwnerAdmin }`) from `getCurrentAdminAccessContext()` for the first time and
  threads it through `runAdminUnifiedSearch()` → `searchExtendedAdminSources()`. Per result:
  `owner_admin` → the real edit route `/admin/team/executive-hub/{slug}/edit`; the row's own
  linked staff member (`viewer.rosterId === row.linkedRosterId`) → their own
  `/admin/team/my-profile`; every other viewer → the always-reachable public `/contact/{slug}`
  route. No viewer is ever handed a route they lack authorization to open — Company Search does
  not become a permission bypass, and no existing route guard was weakened.
- **PRE-MIGRATION SAFETY**: unchanged/inherited, not re-implemented — the search block never runs
  its own query against `linked_roster_id`; it only reads the field off the already-resolved,
  already-safe `ExecutiveHubRecord` returned by the existing store function. A remotely-missing
  `linked_roster_id` column (the migration is still not applied) cannot break Company Search.
- **GUIDE_ALIGNMENT**: the `executive-hub` Admin Guide entry's `notes`/`keywords` were updated to
  state that Company Search can now find these profiles — no new entry, no duplicated instructions.
  Company Search and Admin Guide Search remain fully separate systems (confirmed: no import in
  either direction between `adminGuideRegistry.ts` and `adminExtendedGlobalSearch.ts`/
  `adminOpsUnifiedSearch.ts`).
- **KNOWN_BROKEN_OR_SPLIT_WIRING**: none found or introduced.
- NOTES: 21/21 targeted checks pass (`verify:executive-company-search`, new script — two initial
  false-positive checks caught and fixed before commit: a doc-comment string match and a
  prose-mention match, both corrected to test actual code rather than comment text, consistent with
  this project's established comment-stripping convention). `verify:admin-nav-ops` (75/75) and
  `verify:executive-hub-self-service` (20/20) both re-confirmed unaffected.

---

## SYSTEM: Owner Normal Login + Break-Glass Continuity (Master Operating Book V2 §0F)

Focused authentication-continuity gate. Confirms the intended NORMAL LOGIN vs. OWNER BOOTSTRAP
architecture against real source, and documents one genuine, pre-existing, not-yet-repaired
architectural inconsistency discovered during this pass.

- **CANONICAL_ENTITY / DATA_SOURCE**: `admin_team_members` (Supabase Auth-linked staff roster) +
  Supabase Auth (`auth.users`) for normal identity; a signed, expiring, HMAC-verified
  `leonix_admin_bootstrap` cookie (`app/lib/supabase/adminSession.ts`) for emergency-only access —
  never a roster row, never a Supabase Auth user.
- **PRIMARY_ADMIN_HOME**: `/admin/login` (`app/admin/login/page.tsx`) — two forms: "Staff / Team
  login" (`/admin/login/auth`, real Supabase Auth + active-roster check) and "Owner bootstrap
  (shared password)" (`/admin/login/submit`, shared `ADMIN_PASSWORD`, emergency only).
- **NORMAL LOGIN CONTRACT — CONFIRMED REAL**: `/admin/login/auth/route.ts` verifies Supabase Auth
  credentials (`verifyAdminSupabaseCredentials`) AND an active `admin_team_members` row
  (`lookupActiveAdminRosterByEmail`) BEFORE ever calling `applyLeonixAdminSessionCookies` — an
  inactive or non-existent roster row is denied (`?error=inactive` / `?error=not_roster`) even with
  correct Supabase Auth credentials. Logging in this way always clears any prior bootstrap cookie.
- **BREAK-GLASS CONTRACT — CONFIRMED REAL**: `applyLeonixAdminSessionCookies(..., { bootstrap: true
  })` sets ONLY the signed `leonix_admin_bootstrap` token and explicitly clears the
  operator-email/auth-user-id cookies — a bootstrap session can never carry a real per-person
  identity. `isAdminBootstrapSession()` fails closed (returns false) whenever
  `ADMIN_BOOTSTRAP_SESSION_SECRET` is not configured — bootstrap becomes entirely unavailable
  rather than falling back to a forgeable bare marker. Bootstrap's session lifetime (12h) is
  intentionally shorter than a real staff session's (7 days).
- **BUSINESS CONCIERGE / BUSINESS 360 — CONFIRMED REAL, ALREADY CORRECT**:
  `requireSalesWorkspaceAccess()` (`app/admin/_lib/businessWorkspaceAccess.ts`, Gate BCO-4A.1/4A.7)
  is the hardened boundary actually used by every `/admin/businesses/**` page and virtually every
  `/api/admin/businesses/**` route (confirmed by direct grep — dozens of call sites). A valid
  bootstrap session is granted `ownerBootstrapAccess()`: broad `super_admin`-equivalent READ
  capabilities under a fixed, clearly-labeled sentinel identity
  (`OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID` / `owner.bootstrap@leonix.internal`) — never a real
  roster lookup, never a fabricated person. Crucially, `toStaffWriteActor()` unconditionally denies
  `owner_bootstrap` (`reason: "bootstrap_write_denied"`) before any write-capable actor is ever
  constructed — bootstrap can read Business Concierge but can **never** write to it under any
  identity, real or fabricated. This is exactly "emergency access without identity fabrication":
  bootstrap is not arbitrarily locked out of the surface (closing the historical "bootstrap
  rejected by Business Concierge" failure mode named in this gate's brief), and it is never
  remapped into a fake staff/owner identity to allow a write either.
- **AUDIT ATTRIBUTION — CONFIRMED REAL**: both `resolveActorForAuditWrite()`
  (`adminAuditLogServer.ts`, the general `admin_audit_log` path) and
  `resolveActingRosterIdentity()` (`adminRosterAudit.ts`, the roster-mutation audit trail) resolve
  the acting identity ONLY from session cookies (`getAdminOperatorEmailFromCookies` /
  `getAdminAuthUserIdFromCookies`) — neither ever falls back to the shared `ADMIN_OPERATOR_EMAIL`
  env var. An audit row can never be attributed to a named person merely because that env var
  happens to be configured; attribution requires a real per-person session.
- **KNOWN_ARCHITECTURAL_GAP — NOT FIXED THIS PASS (see below)**: `getCurrentAdminAccessContext()`
  (`app/admin/_lib/adminAccessControl.ts`) — the "legacy" role resolver used for most page/nav
  gating (`canViewAdminTeam`, `canViewPaymentTracker`, the Company Search viewer context built in
  the prior gate's `ops/page.tsx`, etc.) — still falls back to the shared `ADMIN_OPERATOR_EMAIL` env
  var for **role resolution** when no operator-email cookie is present. Concretely: if
  `ADMIN_OPERATOR_EMAIL` is ever configured on the live deployment, a bootstrap session (which
  carries no cookie identity of its own) would inherit that one named person's real roster role and
  `rosterMemberId` for permission decisions across most of Admin — even though (a) any write it
  attempts is still never audit-attributed to that person (audit attribution stays cookie-only, see
  above) and (b) it can never perform a Business Concierge write (that boundary is independently
  cookie-only, see above). This is a real, narrow, **pre-existing** gap (not introduced or widened
  by this gate) between the "legacy" resolver's fail-open env-fallback design and the stricter
  cookie-only model already proven correct for Business Concierge and both audit paths. Per this
  gate's own scope control ("do not redesign Admin login," "do not weaken bootstrap protections,"
  "do not change staff permissions unless a proven defect requires it") this was documented, not
  patched — a cross-cutting change to `adminAccessControl.ts`'s role-resolution semantics touches
  nav visibility and page gating throughout Admin and is a job for a dedicated, explicitly-scoped
  hardening gate, not a side effect of an auth-continuity proof gate.
- **OWNER RUNTIME IDENTITY — NEEDS_OWNER_RUNTIME_PROOF**: the canonical Supabase project was
  confirmed to be **Leonix Media** (`xuieateniufcrsfdomwl`, matched by name via a live, read-only
  `list_projects` call — not staging, not certification). A further read-only query checking
  whether `chuy@leonixmedia.com` has a real Supabase Auth user and a matching active
  `admin_team_members` row was blocked by this session's own safety controls (a direct PII/identity
  query against production is outside what this session will run unattended). Source contracts are
  proven correct; the specific owner identity's live state is not — see
  `ADMIN_OS_PROGRESS.md` for the exact manual proof steps handed to the owner.
- **ADMIN_GUIDE_ENTRY, new**: `admin-login` — documents Normal Login vs. Owner Bootstrap as
  distinct, non-interchangeable paths, cross-referencing Team Roster and Executive Hub without
  duplicating their content.
- **KNOWN_BROKEN_OR_SPLIT_WIRING**: none found or introduced.
- NOTES: 16/16 targeted checks pass (`verify:owner-auth-break-glass`, new script). Regression
  checks: `verify:admin-nav-ops` (75/75, unchanged), `verify:executive-hub-self-service` (20/20,
  unchanged), `verify:executive-company-search` (21/21, unchanged),
  `verify:sales-business-workspace` (104/106 — the 2 failures are pre-existing and unrelated:
  fragile exact-string-literal regex checks against `adminAccessControl.ts`'s
  `getAllowedGlobalNavHrefs()` array formatting; confirmed via `git diff` that this file was not
  touched by this gate).

---

## SYSTEM: Admin Password Recovery Routing

Adds an Admin/staff forgot-password experience by reusing the existing canonical customer
recovery engine end-to-end — no second implementation, no forked security logic.

- **CANONICAL_ENTITY / DATA_SOURCE**: Supabase Auth (`auth.users`), same single pool customer and
  staff already share. No new table, no new column, no `admin_team_members` involvement anywhere
  in this flow.
- **CANONICAL_RECOVERY_ENGINE**: `app/lib/auth/authCallbackSession.ts`
  (`establishSessionFromAuthCallback`) + `app/(site)/auth/callback/page.tsx` — the SAME code path
  both customer and admin recovery links resolve through. `resetPasswordForEmail()` and
  `updateUser({ password })` are called from exactly two places in the whole app: the pre-existing
  customer `/login` (mode=reset) and `/dashboard/seguridad`, and the two new admin pages below —
  no third implementation was created.
- **PRIMARY_ADMIN_HOME**: `/admin/login` — new "Forgot password?" link under the Staff / Team
  login form, pointing to `/admin/login/forgot` (new). Recovery lands on `/admin/login/reset`
  (new) — an admin-branded, dedicated password-update screen, never the customer dashboard.
- **RECOVERY_CONTEXT_ALLOWLIST (new)**: `authCallbackSession.ts` exports
  `resolveRecoveryContext()` / `isAllowedRecoveryDestination()` — a hardcoded map of exactly two
  destinations (`customer` → `/dashboard/seguridad`, `admin` → `/admin/login/reset`). This is
  deliberately stricter than the callback's general `safeInternalRedirect()` (which still governs
  every non-recovery redirect — OAuth, magic link, signup, "post" continuation — unchanged): a
  recovery link proves control of an email address only, so `/auth/callback` now refuses to land a
  recovery flow anywhere outside this allowlist, throwing `recovery_destination_not_allowed`
  (mapped to the same generic "couldn't open your recovery link" message) rather than following an
  arbitrary `redirect` value.
- **ADMIN_RECOVERY_ENTRY**: `app/admin/login/forgot/page.tsx` (new) — email input,
  `resetPasswordForEmail(email, { redirectTo: .../auth/callback?redirect=/admin/login/reset... })`.
  Always shows the fixed message "If an account exists for that email, check your inbox…"
  regardless of whether the address belongs to a real account or a staff member — the only
  distinct branch is a rate-limit cooldown (reveals request volume, never account existence).
- **ADMIN_RESET_DESTINATION**: `app/admin/login/reset/page.tsx` (new) — on mount, requires an
  existing Supabase session (`supabase.auth.getUser()`); no session → "invalid/expired" state with
  a link back to `/admin/login/forgot`. When a session exists: new/confirm password fields reusing
  the exact same `evaluatePassword`, `PasswordInputField`, `PasswordStrengthMeter` primitives the
  customer destination uses, `updateUser({ password })`, success state with "Return to Staff /
  Team login" → `/admin/login`. No Supabase service-role/admin API used anywhere in this
  browser-side page.
- **AUTHORIZATION_BOUNDARY, confirmed unchanged**: neither new page reads or writes
  `admin_team_members`, roster role, or permissions — a password reset changes only the Supabase
  Auth credential. After a reset, `/admin/login/auth` still independently re-checks
  `lookupActiveAdminRosterByEmail()` before granting any admin session; merely having valid
  Supabase Auth credentials (reset or not) still does not grant Admin access without an active
  roster row.
- **BOOTSTRAP**: untouched — `app/admin/login/submit/route.ts` and
  `app/lib/supabase/adminSession.ts`'s bootstrap primitives contain zero references to either new
  page; confirmed by direct source check.
- **CUSTOMER_REGRESSION**: none. The customer destination (`/dashboard/seguridad`) is still the
  first, unmodified entry in the new allowlist; customer recovery/callback errors still redirect
  to `/login` (only an `admin`-context recovery error is diverted to `/admin/login`).
- **ADMIN_GUIDE_ENTRY, updated**: `admin-login` — now documents the forgot-password flow,
  non-enumerating recovery email behavior, and returning to Staff / Team login after reset,
  alongside the unchanged bootstrap explanation.
- **KNOWN_BROKEN_OR_SPLIT_WIRING**: none found or introduced.
- NOTES: 21/21 targeted checks pass (`verify:admin-password-recovery`, new script). Regression
  checks: `verify:owner-auth-break-glass` (16/16, unchanged), `verify:admin-nav-ops` (75/75,
  unchanged). Targeted eslint clean on every file touched/created. `git diff --check` clean (only
  benign LF→CRLF warnings).

---

## SYSTEM: Launch Placeholder / Fake-Capability Eradication (Master Operating Book V2 §33C)

Full-Admin audit (delegated to a dedicated research pass across Command Center, Revenue,
Marketplace Ops, People, Website Control, and System) for visible "Coming Soon"/"V2"/"planned"
language, dead-end CTAs, fake permissions, mock data, and raw technical errors. This is an audit +
targeted-fix gate, not a full Admin rewrite — findings too large for a focused gate were
classified HIDE_FROM_LAUNCH/OWNER_DECISION_REQUIRED and recorded rather than rushed.

### FIXED this gate (REAL_LAUNCH_CAPABILITY restored / MAKE_REAL_NOW applied)

- **`can_reset_passwords`, `can_view_users`, `can_view_activity_logs`, `can_use_replica_mode`** —
  confirmed by full-repo search to control zero real actions (no `requireLeonixAdminPermission`/
  `hasLeonixAdminPermission` call site for any of the four). Removed from
  `AdminPermissionKey`/`ALL_ADMIN_PERMISSION_KEYS` (`teamTypes.ts`) and both label maps (Team
  Roster's `PERM_SHORT`, Create Staff Login's `PERM_LABELS`). Per this gate's own instruction,
  `can_reset_passwords` was **not** wired to a dangerous direct-password-set action — the
  documented future-safe design (staff triggers a Supabase recovery email for a customer, never
  knows/sets a password) is recorded below as a dormant, deliberately-deferred capability. Also
  deleted `getPlaceholderTeamMembers()` (dead code, zero callers, `@deprecated` already).
- **`/admin/settings`** — a "Not persisted" stub with every control (theme picker, save button)
  permanently disabled, still linked from primary nav (`adminGlobalNav.ts`) and from a Command
  Center card. Removed from `ADMIN_GLOBAL_NAV`, removed from `getAllowedGlobalNavHrefs()`, removed
  from the Admin Guide (its own `id: "settings"` entry and the dangling `relatedAdminRoutes`
  reference in `site-settings`'s entry). The route file itself now does
  `redirect("/admin/site-settings")` — the real, already-in-nav settings writer — instead of being
  deleted, so any stale bookmark/link still lands somewhere real.
- **Viajes overview (`/admin/clasificados/viajes`)** — was ~90% mock data: hardcoded illustrative
  stat tiles (affiliate offers, expired/paused, featured homepage cards, seasonal campaigns,
  editorial pieces), a mock analytics panel with invented click/lead/CTR numbers labeled "Sample
  only," and quick links into Affiliate Cards / Campaigns / Editorial / Settings sub-pages whose
  Save buttons are all `disabled` (`"Save (no API yet)"`, `"Save plan (staged)"`, etc.) — the ONE
  real, working Viajes capability is Business Offers moderation
  (`viajes_staged_listings`, real Supabase counts, working Approve/Reject/Request-changes
  actions). Rewrote the overview page to show only the two real counts and link only to Business
  Offers + the public Viajes page — the mock sub-pages are no longer linked from anywhere in the
  app (dormant code, not deleted, per this gate's "keep dormant code, remove the live route" rule).
  Updated the Admin Guide's `viajes-ops` entry to match (no more "manage affiliate cards" as a
  common task).
- **Command Center dashboard** — removed the entire `PlannedCard` roadmap-card component and its 5
  call sites (Viajes Affiliate Ops, Homepage/Banners/Announcements placeholder, Bug Finder, System
  Alerts, High-priority email alerts) plus 2 dead `OperatorCard`s with no CTA at all (Safe User
  Support View, Password reset support) and one more naming an unbuilt `admin_system_alerts`
  table. Reworded roughly a dozen genuinely-real cards whose copy carried stale roadmap language
  ("still needs proof," "canonical manager still needs cleanup," "final ... is planned," etc.) —
  in every case the underlying capability (Global site settings, Language audit, Magazine Manager,
  Viajes ops routed workspace, Customer/listing search, Team roster, Staff permissions, Support
  tickets, Newsletter, Tienda catalog) was already real; only the copy was stale. Removed the
  hero's "future OS tools marked planned until schema proof exists" line and the "Partial labeled"
  chip. Renamed the `StatusBadge`'s literal `"needs proof"` display text to "Temporarily
  unavailable" (plain operator language; the underlying `DashboardTruthStatus` type/values are
  unchanged, only the rendered label changed) and "real"/"partial" badge display text to
  "Live"/"Partial". Removed raw `moderation_reason`/`review_notes`/`listings.status = flagged`
  column names from the page footer.
- **`AdminPagePurposeCard`** — made `nextGate` optional (previously required, forcing every one of
  its ~7 call sites to always render a "What's needed to finish this" roadmap block even when a
  page was fully real); renamed the rendered label from "What's needed to finish this" to "Next
  step" for when it genuinely is provided. Backward-compatible change (making a required prop
  optional never breaks an existing caller passing a string). Updated the Command Center's own
  purpose card to `status="real"` with no `nextGate`/`warningNote`.
- **Raw technical errors softened** in Support (`/admin/support`), Team Roster
  (`/admin/team/roster`), and Activity Log (`/admin/activity-log`) primary visible banners/badges:
  removed every rendered migration filename (`20260408...sql`, `20260410...sql`) and raw table
  name (`support_tickets`, `admin_team_members`, `admin_team_invites`) from banners, badges, and
  error messages, replacing with plain operator language ("Setup required," "Temporarily
  unavailable," "check System Health"). Activity Log no longer interpolates the raw Supabase
  `error.message` (`audit.detail`) into its visible helper text.
- **Cupones hub card** (`/admin/workspace`) — the confirmed-broken write path (content saved there
  never renders on the live public page) was already honestly disclosed once you opened the Guide
  entry or the sub-page itself, but the FIRST thing staff saw (the workspace hub card) still
  described it as a normal working editor. Reworded the hub card body to disclose the limitation
  before the click, not after.

### CLASSIFIED, NOT FIXED this gate (recorded, not silently dropped)

- **HIDE_FROM_LAUNCH candidates already effectively hidden by the fixes above**: Viajes Affiliate
  Cards/Campaigns/Editorial/Settings sub-pages (mock data, disabled save buttons) — dormant, no
  longer linked from any real nav path; files intentionally left in place per "keep dormant code
  the same file, remove the live route."
- **OWNER_DECISION_REQUIRED — `can_reset_passwords`, dormant future design**: staff triggering a
  Supabase `auth.admin.generateLink({ type: "recovery" })` email for an existing customer (never
  knowing or setting a password directly) is a real, desired, and *safe* future capability — but
  wiring it is new product work (a support action, an audit trail, a UI entry point) beyond this
  gate's focused scope. The permission key was hidden rather than fake-wired, exactly per this
  gate's own instruction. Owner should decide when this becomes a priority.
- **OWNER_DECISION_REQUIRED — LEO surfaces** (`/admin/leo`): multiple "NOT_IMPLEMENTED"/"Partial"/
  "not live yet"/`Placeholder` labels exist inside LEO's own panels. LEO integration is explicitly
  out of scope for this gate ("Do NOT implement LEO") — these are pre-existing, self-contained
  labels inside an already-owner-only, already-labeled-experimental surface, not a Command Center
  or primary-nav-level launch-truth violation. Left untouched; recommended as LEO's own dedicated
  gate when LEO integration begins in earnest.
- **OWNER_DECISION_REQUIRED — `can_view_payments`**: enforced only in two API routes
  (subscription-sweep, manual-payments), not on the Payment Tracker page itself. Left as-is (it is
  partially real, not fully fake) — recommend either fully wiring it to gate the Payment Tracker
  page, or removing it if Payment Tracker access should remain purely role-based.
- **OWNER_DECISION_REQUIRED — Website Preview staff links** (`/admin/team/website-preview`):
  engineering-status badges ("In progress," "Needs QA") shown to staff for 9 public pages, plus a
  literal `"Coming Soon (ES/EN)"` link to the real, existing `/coming-soon-v2` marketing page
  (`staffAdminAccess.ts`). The `/coming-soon-v2` link is not broken (the page exists), but showing
  it as a staff "preview" destination post-launch is stale — recommend removing or updating once
  the real site is live.
- **DEFERRED_LARGER_WORK — remaining raw-technical-error sites**: `adminAuditLogServer.ts`'s
  `detail`/`e.message` passthrough (only the Activity Log page's *rendering* of it was fixed this
  gate — other lower-traffic consumers of `fetchAdminAuditLogFiltered`/`fetchAdminAuditLogForTarget`
  were not individually audited), `leonixAdminGate.ts`'s raw permission-key error messages,
  `adminStrings.ts`'s several raw-table-name strings (`adminAuditLog.*`, `hub.statusReason.*`),
  and the Tienda order detail page's "Full submission payload (v2)" block — the latter is already
  correctly inside an opt-in `<details>` disclosure, which this doctrine explicitly allows
  ("retain technical detail in expandable/debug form"). A full burndown of every remaining raw
  string across ~20 files is a larger, lower-risk-tolerance pass better suited to its own gate with
  full typecheck coverage, per this gate's resource control (no full typecheck).
- **INTERNAL_ONLY_KEEP — everything under `app/components/ComingSoonGate.tsx`,
  `coming-soon-v2/**`, `coming-soon-live/**`, `publicLaunchLock.ts`**: confirmed, by direct read,
  to be a real, deliberate, owner-controlled pre-launch marketing landing page (real newsletter
  signup, real advertise/media-kit CTAs, real language toggle) — exactly the case this gate's own
  doctrine explicitly protects ("Coming Soon may exist only when explicitly chosen as real
  marketing communication"). Not touched.
- **Two pre-existing, unrelated lint findings** confirmed via `git diff` to predate this gate:
  `AdminCommandCenterDashboard.tsx`'s unused `CommandCard` function and `CompactExpiringRow`'s
  unused `locale` param; `support/page.tsx`'s unused `i` in `tickets.map((t, i) => ...)`. Not
  fixed — out of this gate's scope (dead-code cleanup, not launch-truth).
- NOTES: 24/24 targeted checks pass (`verify:launch-truth`, new script). Regression checks:
  `verify:admin-nav-ops` (74/74 — one assertion updated to reflect the intentional `/admin/settings`
  removal, not a weakened check), `verify:owner-auth-break-glass` (16/16), `verify:admin-password-recovery`
  (21/21), `verify:executive-company-search` (21/21), `verify:executive-hub-self-service` (20/20),
  `verify:admin-roster-foundation` (32/32, same 1 pre-existing unrelated migration-ordering
  failure as every prior pass), `verify:sales-business-workspace` (104/106, same 2 pre-existing
  unrelated failures as every prior pass) — all unchanged. Targeted eslint clean on every file
  touched/created (the 2 pre-existing unrelated errors noted above are unrelated to this gate's
  edits, confirmed via `git diff`).

---

## SYSTEM: Final Launch-Truth Burndown (can_view_payments, Website Preview, Viajes proof, raw errors)

Resolves the 4 owner-locked decisions from the prior placeholder-eradication gate's PARTIAL close,
plus a further raw-technical-error burndown pass.

### Gate A — `can_view_payments` fully enforced (MAKE REAL NOW)

- **Root cause found**: `AdminAccessContext` (the always-enforced context — no
  `ADMIN_ENFORCE_ROSTER_PERMISSIONS` env dependency, unlike `leonixAdminGate.ts`'s
  `requireLeonixAdminPermission`) never carried the roster row's `permissions` array at all —
  `can_view_payments` had nowhere real to be checked from for page/nav-level authorization.
  `canViewPaymentTracker()` was hardcoded `role === "owner_admin"` only.
- **Fix**: `getCurrentAdminAccessContext()`'s Supabase select now also fetches `permissions`,
  populated on `AdminAccessContext.permissions: AdminPermissionKey[]` (empty on every
  non-roster-resolved branch — harmless, since those already default to full `owner_admin`
  access). New `hasPaymentTrackerAccess(ctx)`: owner_admin always; any other active roster member
  only if `ctx.permissions.includes("can_view_payments")`. `canViewPaymentTracker()` (the old,
  now-fully-superseded role-only function) was deleted — zero remaining callers.
- **Every consumer updated to the same check**: `requirePaymentTrackerAccess()` (the page guard
  for `/admin/workspace/payment-tracker` and its `manual-payment` sub-page — both server
  components that call this before any data fetch, so a direct URL re-runs the exact same check
  every request, no bypass possible); `getAllowedWorkspaceNavHrefs()` and
  `getAllowedGlobalNavHrefs()` (nav visibility now matches real access, closing a real
  visible-but-inaccessible mismatch — the workspace sub-nav previously listed Payment Tracker
  unconditionally for every non-sales-rep role even though only owner_admin could ever open it);
  `(dashboard)/page.tsx`'s Command Center data-fetch and `showPaymentTracker` card visibility.
- **Real bypass found and closed**: `adminExtendedGlobalSearch.ts`'s Company Search
  "Payments / entitlements" source called `fetchPaymentTrackerSnapshot()` completely
  unconditionally — any role that could reach `/admin/ops` (every non-sales-rep role) could
  search and see real payment records regardless of `can_view_payments`, a genuine
  permission-bypass via an alternate read path exactly matching this gate's own warning ("must
  not gain access merely because ... an API endpoint exists"). Fixed: `AdminExtendedSearchViewer`
  gained a `canViewPayments` field, computed in `ops/page.tsx` from the same
  `hasPaymentTrackerAccess()`, and the Payments search block is now skipped entirely (not merely
  hidden) when absent.
- **Explicitly NOT changed in this gate** (per owner instruction, "Do NOT grant refund/money-moving
  authority... unless existing explicit money-action permissions already exist"): the two
  WRITE/action API routes that also reused `can_view_payments` as their gate —
  `POST /api/admin/revenue-os/manual-payments` (record/verify/reject/reverse manual payments) and
  `POST /api/revenue-os/admin/subscription-sweep` (suspends grace-expired subscriptions, primarily
  machine-key authenticated) — both went through the pre-existing, unmodified
  `requireLeonixAdminPermission("can_view_payments")` gate, a no-op unless
  `ADMIN_ENFORCE_ROSTER_PERMISSIONS=1` (not set in this environment). Recorded then as a known,
  pre-existing, separate architectural gap, out of this gate's read-visibility scope.
  **CLOSED in the dedicated Final Pre-QA Security Hardening Gate (2026-09-10)** — see that
  section's entry below. Authority was not broadened: both routes are now `super_admin`-only,
  narrower than before, not wider.

### Gate B — Website Preview cleanup (CLEAN NOW)

- `staffAdminAccess.ts`'s `STAFF_PREVIEW_LINKS` dropped its `status` field entirely
  (`StaffPreviewLinkStatus` type and `staffPreviewStatusLabel()` deleted) — every remaining entry
  is a real, live public page, shown plainly with no "Ready for partners"/"In progress"/"Needs QA"
  engineering-status badge. The two "Coming Soon (ES/EN)" entries (linking to the real
  `/coming-soon-v2` marketing page) were removed — this list's whole purpose is previewing REAL
  SITE PAGES while the public lock is on, not previewing the lock page itself.
  `/admin/team/website-preview/page.tsx` no longer renders the status badge; its helper text no
  longer names the raw `NEXT_PUBLIC_COMING_SOON_LOCK` env var to staff.

### Gate C — Viajes dormancy (re-confirmed, not re-touched)

- Already closed in the prior gate (mock overview rewritten, Guide entry updated). This gate adds
  a permanent, targeted test proving it stays true: no reference to `affiliate-cards`, `campaigns`,
  or `editorial` remains in `adminGlobalNav.ts`, the Viajes overview page, or any *actionable*
  Admin Guide field (`commonTasks`/`howTo`/`keywords`) — the Guide's own `notes` field explaining,
  as history, what was removed and why is correctly left alone (explaining a past removal is not
  the same as advertising a live capability).

### Gate D — Raw technical error burndown (further pass)

- **New leaks found and fixed**: `usuarios/[id]/page.tsx` rendered `auditHistory.detail` (a raw
  Supabase error message) directly when the audit history source was unavailable — same class of
  bug already fixed on `/admin/activity-log` in the prior gate, missed there because it's a
  second, independent consumer of `fetchAdminAuditLogForTarget()`.
- **`adminStrings.ts` (the shared EN/ES admin i18n dictionary) — the actual source of most of
  `/admin/activity-log`'s remaining raw strings**: `activityLog.badgeLive` ("Supabase
  (admin_audit_log)"), `subtitleLive` (raw `` `admin_audit_log` `` table name), `subtitleUnavailable`
  (raw migration filename `20260410120000_admin_audit_log_and_team_invites.sql`), and
  `helperNoSecrets` (raw `listings`/`listing_audit_event` table names + migration number
  `20260423180000`) were rewritten to plain operator language in both EN and ES. The page's own
  hardcoded `<code>listing_audit_event</code>` fallback text was removed too.
- **Clasificados Ops** (`/admin/workspace/clasificados`, a primary Marketplace Ops page):
  `detailPairsMissingTitle`/`Body` ("Database missing listings.detail_pairs column"/raw migration
  filenames rendered as `<code>` tags) and `boostMissingTitle`/`Body` (raw
  `listings.republished_at` column name + another raw migration filename) rewritten to "Setup
  required..." plain-language degraded-state banners, in both EN and ES.
- **Scope boundary held**: a large remaining volume of raw table/column names throughout the rest
  of `adminStrings.ts` (Clasificados card-title strings like `clasificados.autosTitle`
  ("Table autos_classifieds_listings..."), `serviciosTitle`, `categoriesTitle`, `homeChipsTitle`),
  plus `leonixAdminGate.ts`'s raw permission-key `Error` messages (which only reach a rendered
  page when `ADMIN_ENFORCE_ROSTER_PERMISSIONS=1` — not the current environment default — and even
  then Next.js's production error handling redacts thrown Server Component error text by default,
  no custom `app/admin/error.tsx` boundary exists either way) were **not** exhaustively burned
  down this pass. A full line-by-line audit of a 2700+-line shared i18n dictionary is a
  DEFERRED_LARGER_WORK item for its own dedicated gate with full typecheck coverage throughout,
  not a partial pass rushed against this gate's resource control.
- NOTES: 18/18 targeted checks pass (`verify:launch-truth-final-burndown`, new script).
  Regression checks: `verify:launch-truth` (24/24), `verify:owner-auth-break-glass` (16/16),
  `verify:admin-password-recovery` (21/21), `verify:executive-company-search` (21/21),
  `verify:executive-hub-self-service` (20/20), `verify:admin-nav-ops` (74/74) — all unchanged.
  Targeted eslint clean on every touched file (one pre-existing, unrelated `const ES` unused-var
  lint error in `adminStrings.ts` confirmed via `git diff` to predate this gate). One authorized
  full `tsc --noEmit` run at the end of implementation found 7 pre-existing baseline errors, all
  in files this gate never touched (`digitalContactExecutivesDb.ts`'s `linked_roster_id` typing
  gap from a prior gate, and 6 unrelated `e2e/**` Playwright spec type errors) — confirmed via
  `git diff` to predate this gate; zero new type errors introduced.

---

## FINAL MASTER BLUEPRINT COMPLETION AUDIT — cable-map completeness confirmation (2026-09-10)

Cross-checked every SYSTEM entry above against this document's own §26/§0I schema fields
(CANONICAL_ENTITY, CANONICAL_ID, ADMIN_HOME, COMPANY_SEARCH_SUPPORT, ADMIN_GUIDE_ENTRY,
PERMISSION_MODEL, AUDIT_RELATIONSHIP, CURRENT_TRUTH_STATUS) rather than re-deriving new entries.
Findings, not previously consolidated in one place:

- **No system in this map is missing a primary Admin home.** The two real orphans this project
  ever found (System Health invisible in the sidebar; Team Roster hiding the Executive Hub tab)
  are both fixed and re-verified (see the V2 alignment audit entries above).
- **Company Search coverage, confirmed against V2 §4's named entity list**: businesses, users
  (`profiles`), staff login (`admin_team_members`), staff contact profiles (`executives`), leads
  (`leonix_leads`), payments/entitlements, generic listings, all 7 dedicated-table marketplace
  categories (Servicios/Autos/Restaurantes/Empleos/Viajes/Comida Local/Ofertas Locales), Tienda
  orders, listing reports, Recursos, Revista — all covered. Clases/Busco/Comunidad ride the
  generic `listings` table search already covered. **Not covered, confirmed NOT a gap**: Noticias
  (no article/entity table exists to search — confirmed absent, not omitted).
- **Known duplication/split-truth items are all still correctly open, not silently closed**: the
  `businesses.id` ↔ payments/leads/support/analytics join gap (the "La Taquiza" scenario) remains
  the single largest unclosed structural item in this entire map — real, additive linking exists
  (`business_external_links`) but is unpopulated pending migration + adoption. Moderation
  case-lifecycle schema, a formal quote/estimate object, and business-level renewal all remain
  correctly `NOT_APPLICABLE`/`OWNER_DECISION_REQUIRED` (no schema exists; inventing one was
  correctly declined every prior pass).
- **Finding from the prior audit — CLOSED this pass (Final Pre-QA Security Hardening Gate,
  2026-09-10)**: `POST /api/admin/revenue-os/manual-payments` and
  `POST /api/revenue-os/admin/subscription-sweep` previously authorized solely via
  `requireLeonixAdminPermission("can_view_payments")` (`app/admin/_lib/leonixAdminGate.ts`), whose
  Layer 2 role/permission check is a no-op unless `ADMIN_ENFORCE_ROSTER_PERMISSIONS=1`. Both routes
  now call a new, always-on `requireRevenueProtectedWriteAccess()`
  (`app/admin/_lib/adminAccessControl.ts`) that never references that env flag: it requires the
  `leonix_admin` cookie, explicitly rejects the shared bootstrap session, re-verifies the
  operator-email + auth-user-id cookie pair against a real Supabase Auth user and an active
  `admin_team_members` row resolved by `auth_user_id` (never by email), and requires the roster
  role to be exactly `super_admin`. `can_view_payments` (a READ-only permission) is no longer
  consulted by either write route. Neither route's business logic (action branches, field parsing,
  the sweep's independent machine-key path) was changed. Proven by
  `scripts/verify-revenue-write-security-hardening-01.ts` (11 checks, all pass).
- **Pending remote migrations, confirmed complete list (3, none applied)**:
  `20260909130000_business_external_links_foundation.sql`,
  `20260909140000_admin_audit_log_actor_attribution.sql`,
  `20260910120000_executives_linked_roster_id.sql`. All three are additive-only (verified
  structurally in the Final Code/Release Validation Gate above and re-confirmed present as files
  this pass); none touched by this audit.

---

## SYSTEM: Revenue Protected-Write Security Guard (Final Pre-QA Security Hardening Gate, 2026-09-10)

Closes this audit's own `MUST_FIX_BEFORE_PRODUCTION` finding (immediately above) with a canonical,
always-on guard rather than turning on the optional roster-permission env flag.

- **CANONICAL_ENTITY**: the acting `admin_team_members` row (staff identity), not a listing or
  payment record.
- **CANONICAL_DATA_SOURCE**: `admin_team_members` (resolved by `auth_user_id`) + Supabase Auth
  (`auth.admin.getUserById`), the same two sources `businessWorkspaceAccess.ts`'s
  `requireSalesWorkspaceAccess()` already re-verifies on every Sales Workspace request — this gate
  reuses that identical identity-chain pattern (not a new mechanism) via the existing exported
  helpers in `app/lib/supabase/adminSession.ts`.
- **PRIMARY_HOME**: `app/admin/_lib/adminAccessControl.ts` — `requireRevenueProtectedWriteAccess()`
  (guard) + `revenueWriteDenialStatusCode()` (HTTP status mapping). Exported alongside, and
  explicitly documented as distinct from, `hasPaymentTrackerAccess()`/`requirePaymentTrackerAccess()`
  (the unchanged READ-visibility gate for `can_view_payments`).
- **PROTECTED_ROUTES**: `POST /api/admin/revenue-os/manual-payments` (action classes:
  `record`/`verify_cleared` — money-adjacent, `verify_cleared` grants a paid package entitlement;
  `reject`/`reverse` — mutates a payment's disposition, `reverse` flags `requires_admin_review`);
  `POST /api/revenue-os/admin/subscription-sweep` (system action: suspends grace-expired
  subscriptions + reaps stale Stripe event-ledger claims — its separate, unaffected machine-key
  path remains for external pinger/CI cron-like calls).
- **AUTHORIZATION MODEL**: fail-closed, independent of `ADMIN_ENFORCE_ROSTER_PERMISSIONS` (the
  function never references that env var). Owner/`super_admin` only — deliberately not extended to
  any other staff role or capability this gate, per its own scope control ("choose the safest
  launch architecture... rather than inventing a new visible permission"). The shared bootstrap
  session is explicitly and permanently denied for these writes (break-glass READ access to
  Revenue is unaffected — only the write boundary is stricter). No new visible permission was
  added to `AdminPermissionKey`/`ALL_ADMIN_PERMISSION_KEYS`.
- **AUDIT_RELATIONSHIP**: `manual-payments`' `adminUserId` audit attribution is now always the
  real, server-verified Supabase Auth user id from the guard's own identity-chain resolution —
  never client-suppliable (the old `body.adminUserId` read path was already removed in a prior
  pass) and never the literal `"admin"` last-resort fallback (that branch is now unreachable —
  an unresolved identity is denied by the guard before the fallback line is ever reached).
  `subscription-sweep` carries no per-actor attribution before or after this gate (a system-level
  sweep, not attributed to an individual admin) — unchanged.
- **CURRENT_TRUTH_STATUS**: REAL, verified via `scripts/verify-revenue-write-security-hardening-01.ts`
  (11 checks: missing-session/bootstrap/unauthorized-staff denial, `can_view_payments` never
  consulted, owner/super_admin allowed only after full chain verification, the env flag never
  referenced in any state, the read-only Payment Tracker permission and both routes' business
  logic unchanged, truthful audit attribution). Targeted eslint clean on all 4 changed files.
  Regression-verified: `verify:launch-truth-final-burndown` (18/18), `verify:launch-truth` (24/24),
  `verify:admin-nav-ops` (74/74), `verify:owner-auth-break-glass` (16/16) — all unchanged.
- **KNOWN_DUPLICATION**: none — this is the only guard of its kind; it does not replace or alias
  `hasPaymentTrackerAccess()`.
- **MISSING_CONTROL**: none identified for this gate's scope. A real, visible write-capability
  permission model (beyond "owner/super_admin only") remains a genuine future product decision,
  not built here per explicit scope control.

## OWNER IDENTITY RUNTIME PROOF — CLOSED (2026-09-10)

The `OWNER_RUNTIME_PROOF_REQUIRED` item from the dedicated owner-auth gate and every subsequent
audit is now closed. The owner has provided direct runtime evidence (not re-queried by this
session, per this gate's own instruction not to query or mutate production to reconfirm it):
`admin_team_members` row for `chuy@leonixmedia.com` has `role = super_admin`, `is_active = true`,
`auth_user_id = d29bc786-bc38-49c1-bbc4-d97b39c3e493`, matching the Supabase Auth UID exactly. This
means the owner's normal daily identity can use the real Staff/Team login path (satisfying §0F's
"normal owner activity uses an attributable identity") rather than the bootstrap fallback, and
that `requireRevenueProtectedWriteAccess()` above will authorize the owner's real per-person
session once they are logged in that way (bootstrap sessions remain denied for these two routes
regardless).
