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
- MISSING_ADMIN_CONTROL: no direct way to triage from this page — every item requires a full navigation to a destination page (this is Phase 4's "review workbench" gap, not yet built).
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
- MISSING_ADMIN_CONTROL / KNOWN_BROKEN_OR_SPLIT_WIRING: **Global search does NOT cover**: `empleos_public_listings`, `viajes_staged_listings` (confirmed by table-name grep — only the generic `listings` table is wired into `adminListingsOpsSearch.ts`), `businesses` (Business Concierge — to be reconfirmed against the People domain pass, but not present in `adminOpsUnifiedSearch.ts`'s explicit fan-out list above), `admin_team_members`, `leonix_leads`, `payments`/entitlements, `community_resources` (Recursos), or magazine/noticias content. An owner typing an Empleos ad's title, a Viajes offer name, or a business name into "the one search box" will get **zero results even though the record exists** — this silently looks like "not found" rather than "not searched," which is a real owner-trust risk at launch scale (the 30-client stress scenario explicitly requires the owner to locate any client fast).
- NOTES: This is one of the highest-leverage, cheapest-to-fix gaps found so far — extending `runAdminUnifiedSearch`'s existing parallel-fan-out pattern to 2-3 more tables is a small, additive, doctrine-compliant fix (reuses the exact same function shape already proven for 4 sources) once repair work begins. Not fixed yet — mapping pass only.

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

### Media Kit requests — **CONFIRMED BROKEN, silent split wiring**
A fully code-complete dedicated pipeline exists (`leonix_media_kit_leads` table, `saveMediaKitLead()`, `POST /api/media-kit/request`, dedicated `/admin/leads/media-kit` admin page) — but has **zero live callers**. The real public page's two CTAs both link to `/contacto?inquiryType=advertising|mediaKit`, so real interest lands in `leonix_leads` instead, surfaced only in the generic `/admin/leads/inbox`. The dedicated admin page and its dashboard KPI tile (`mediaKitActive`) are silently starved — this is the Revenue-domain analogue of the Nosotros/Contacto/Cupones content-CMS breakage found in WEBSITE.

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
- KNOWN_BROKEN_OR_SPLIT_WIRING: `updateClientAccountAction` (account_type/tier edit) has **no permission gate at all**, unlike its sibling `setUserDisabledAction` (gated by `can_edit_users`) — a real, confirmed authorization inconsistency. **[GATE B — FIXED, see ADMIN_OS_PROGRESS.md]** Tier vocabulary also mismatches between the Users edit page's allow-list and the separate customer-provisioning flow's inserted values — still open, needs a canonical-values decision, not a permission fix.

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
