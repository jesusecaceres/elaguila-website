# Package E — Build E3: Admin OS Global Operations Closure

**Starting HEAD:** `0901f491` (Package E2, verified on remote, `integration/lifecycle-foundation-2026-07`)
**Scope class:** Direct scoped gated build — consolidate, don't rebuild. The admin shell, nav registry, Revenue OS tracker, package-entitlement admin, promo/grant systems, marketplace ops tools, user detail, activity log, and permission architecture were all confirmed real before this build began (Package E Gate E1 audit). Missing work was consolidation, truthful navigation, unified support context, manual-payment UI, audit filtering, permissions truth, and mobile polish — not new architecture.

## Gate 1 — admin navigation truth

`app/admin/_lib/adminGlobalNav.ts`: added an additive, optional `group` field (`AdminGlobalNavGroup`) to every nav entry — COMMAND / REVENUE / MARKETPLACE OPS / PEOPLE / WEBSITE CONTROL / SYSTEM — without changing the flat array's own order (several historical gates assert that order positionally; `scripts/verify-admin-nav-ops.mjs` still passes unmodified in its ordering checks).

- **Primary Revenue entry repointed:** was `href: "/admin/payments"` → now `href: "/admin/workspace/payment-tracker"` (the real ledger). Confirmed via trace: `getAllowedGlobalNavHrefs()` never included `/admin/payments` for ANY role — the old nav entry was structurally invisible to everyone; the new one is visible exactly when `canViewPaymentTracker` (owner_admin) is true, correctly aligning nav visibility with real page access for the first time. `/admin/payments` itself is untouched and unlinked (compatibility route, not deleted, per instruction).
- **Site Settings promoted to primary nav:** new entry `href: "/admin/site-settings"`, gated in `getAllowedGlobalNavHrefs()` by the same `canViewSiteSettings` check as `/admin/settings`. The sidebar-footer shortcuts that previously stood in for this (and for the also-already-primary `/admin/workspace`) were removed as duplicates.
- `app/admin/_components/AdminSidebar.tsx`: buckets the permission-filtered nav list into the six groups (fixed display order) and renders a heading per non-empty group — no new nav framework, same `ADMIN_GLOBAL_NAV` data.
- `scripts/verify-admin-nav-ops.mjs`: literal-href pin list updated (`/admin/payments` → `/admin/workspace/payment-tracker`, added `/admin/site-settings`) — a truth correction to an intentional change, not a weakened check; **75/75 checks still pass**.

**TRUE before Gate 2:** real payment tracker discoverable from primary nav = TRUE. Real site settings discoverable = TRUE. Nav grouped clearly = TRUE. No duplicate dead entry = TRUE. Permission filtering preserved = TRUE.

## Gate 2 — unified customer/people support view

New aggregator: `app/admin/_lib/adminCustomerCommercialContext.ts` — the one new server-side view-model this gate required, composing existing canonical tables only (`leonix_payment_records`, `listing_package_entitlements`, `leonix_placement_entitlements`, `leonix_subscription_records`, plus the existing `resolveCommercialStateBadges()` and `effectiveEntitlementStatus()` functions). No new database table. Filters payments/entitlements by the customer's real owned listing ids (already resolved by the existing `fetchAdminUserAdsForUser`); filters placements/subscriptions by the real `owner_user_id` column both tables already carry.

Wired into the canonical user detail route, `app/admin/(dashboard)/usuarios/[id]/page.tsx`, as five new cards alongside the existing Identity/Ownership/Entitlement-rollup/Analytics cards:
- **Revenue / Payments** — real rows, amount/status/source/promo/sales-rep.
- **Package & Placement** — the two entitlement kinds side by side, never merged.
- **Subscription / Grace** — real commercial-state badges (grace/suspended/disputed/cancels-at-period-end/canceled), English-first.
- **Promo / Grant Source** — entitlement `grant_source` and payment `promo_code`, never inferred from status/tier.
- **Recent Admin Activity** — see Gate 3.

**TRUE before Gate 3:** one user page answers customer + ownership + commercial truth = TRUE. No account-tier inference = TRUE. Package separate from placement = TRUE. Payment separate from entitlement = TRUE. Promo/grant separate from payment = TRUE. Subscription/grace visible independently = TRUE. No fake values = TRUE (every field is a direct DB column; `unavailable`/`unavailableNote` fails closed on any query error).

## Gate 3 — user-scoped audit history

`app/admin/_lib/adminAuditLogServer.ts` extended (same `admin_audit_log` table, same `appendAdminAuditLog` write path — completely unchanged):
- `fetchAdminAuditLogFiltered({action?, targetType?, targetId?, since?, limit?})` — `fetchAdminAuditLogRecent()` now a thin wrapper over this.
- `fetchAdminAuditLogForTarget(targetIds, limit)` — exact `target_id IN (...)` match only (profile id + the customer's real listing ids). No fuzzy name/email association, confirmed by code: it never touches `customer_name`/`customer_email`/`business_name` anywhere in the query.
- **Confirmed, named limitation:** `admin_audit_log` has no actor/operator column at all (every one of its ~65 write call sites across ~35 files was traced) — filtering by actor is not offered anywhere, rather than faked via `meta.source` (a constant, not a per-operator value).
- `app/admin/(dashboard)/activity-log/page.tsx`: added a filter form (action / target type / target id) using the new filtered reader, plus a real permission fix (see Gate 7) — the page previously ran with no independent gate at all.

**TRUE before Gate 4:** customer detail shows only truthfully linked activity = TRUE. Global viewer can filter useful fields = TRUE (action, target type, target id — not actor, which does not exist in schema). Existing append/write behavior unchanged = TRUE.

## Gate 4 — manual cleared payment UI

New page `app/admin/(dashboard)/workspace/payment-tracker/manual-payment/page.tsx` + client component `ManualPaymentClient.tsx` — the minimum real UI for the confirmed E1 gap (real backend, zero UI callers). Calls the **exact existing** `/api/admin/revenue-os/manual-payments` contract (`record` → `verify_cleared`/`reject`). Payment methods are the exact `ManualPaymentMethod` union from `manualClearedPayments.ts` (`zelle, ach, cash, check, money_order, other`) — none invented. Package dropdown is sourced from the real `REVENUE_V1_PACKAGE_MATRIX` (priced packages only) — no invented package.

**CRITICAL AUDIT FIX (confirmed, fixed):** `app/api/admin/revenue-os/manual-payments/route.ts` previously read `adminUserId` from client-supplied JSON (`String(body.adminUserId ?? "admin")`) — any caller past the cookie gate could claim to be any admin, or silently default to the literal string `"admin"`. Now derives it from the server-authenticated access context: `access.authUserId ?? access.operatorEmail ?? access.rosterMemberId ?? "admin"` — the exact same precedence `grantComplimentaryPackageEntitlementAction` already uses elsewhere in the codebase. `adminUserId` is no longer read from the request body at all. This is a narrow correction using existing admin auth context, not an auth redesign — no STOP was required.

`app/admin/_lib/paymentTrackerData.ts` extended additively (`owner_user_id`, `manual_method`, `manual_state`, `evidence_reference` — real columns that were already selected via `select("*")` but never mapped into the typed row) to power the pending-manual-payments list on the new page and the customer-link on the tracker table (Gate 5).

**TRUE before Gate 5:** manual payment UI uses existing backend = TRUE. Server derives admin actor if existing auth allows = TRUE (it does, and now does). No fake Stripe payment = TRUE (the primitive's `activateEntitlementsForPayment` call with `grantSource: "manual_cleared_payment"` is untouched). Entitlement truth preserved = TRUE. Audit record created via existing pathway = TRUE (`writeRevenueAuditLog`, untouched).

## Gate 5 — Revenue OS admin consolidation

No action/writer/resolver was rewritten. Added real, permission-respecting navigation:
- Payment Tracker's "Customer" column now links to `/admin/usuarios/{owner_user_id}` when a real `owner_user_id` is present on the payment row (never guessed by name/email).
- Payment Tracker's cross-link row gained "Record Manual Payment →", alongside its existing Promo Codes / Package Entitlements / Sales Tracker links.
- The unified customer support page already links out to Payment Tracker, Package Entitlements, and Activity Log (Gates 2/3).

## Gate 6 — Marketplace Ops discoverability

Investigated before touching anything: `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryCommandCenter.tsx` already renders a full category selector sourced from the live category registry (`mergeAdminCategoriesHubEntries`), covering every category with a real admin surface (autos, restaurantes, servicios, empleos, comida-local, ofertas-locales, bienes-raices, rentas, en-venta, busco, clases, comunidad, mascotas-y-perdidos, travel) with real per-category operational links (`ops.operationalSpaceAdminPath`, `ops.fieldsNotesAdminPath`). This was already comprehensive and correct — **no code change was needed**; Gate 1's nav grouping now presents "Categories" under the MARKETPLACE OPS heading, which is the discoverability improvement this gate asked for. No universal cross-category table was built (correctly — the underlying data models genuinely differ per category, confirmed in E1).

## Gate 7 — permissions / admin access truth

Every E3-touched mutation/page now has a real, independent server-side check:
- `/api/admin/revenue-os/manual-payments` — `requireLeonixAdminPermission("can_view_payments")` (unchanged, already real) + the Gate 4 actor fix.
- `/admin/activity-log` — **new**: `requireActivityLogAccess()` (owner_admin-only, mirroring `canViewActivityLogs`), closing a real gap where the page relied only on the shared layout's cookie check even though the nav link itself was already role-gated.
- `/admin/workspace/payment-tracker/manual-payment` — reuses the existing `requirePaymentTrackerAccess()` (owner_admin-only), consistent with the parent tracker page.
- `/admin/usuarios/[id]` — **deliberately left at `requireAdminCookie` only.** `getAllowedGlobalNavHrefs()` already grants `/admin/usuarios` to every non-sales-rep role (admin_manager, sales_manager, content_admin, support_admin, owner_admin) — adding a stricter owner_admin-only page gate here would contradict the nav's own permission model and could lock legitimate support staff out of a page they're explicitly meant to reach. This is a confirmed non-gap, not an oversight.

Owner-admin fallback (`getCurrentAdminAccessContext()`'s three early-return branches) — untouched. Sales-rep row-ownership assertions (`assertCanManageEntitlement`/`assertCanManagePromoCode`) — untouched.

**Roster-permission enforcement flag decision: REQUIRES OWNER QA.** `ADMIN_ENFORCE_ROSTER_PERMISSIONS` was not changed (locked, per instruction). Enabling it would immediately start enforcing `can_view_payments` (now also gating the new manual-payment UI) and `can_manage_website_content` against real `admin_team_members.permissions` data — this build has no visibility into whether every active roster row already has correct permissions populated for those keys, and the flag's own doc comment already notes many admin actions are "cookie only" today. Flipping it blind risks locking out legitimate staff; the owner should audit roster permission completeness first.

## Gate 8 — admin language / copy truth

Cleaned only the copy this build introduced: two card subtitles that named raw tables (`leonix_payment_records`, `leonix_subscription_records`) were rewritten to plain operational English; the Subscription/Grace card's commercial-state badges now render `labelEn` (English-first) instead of `labelEs`. Pre-existing text elsewhere on the page (e.g. the Entitlements rollup card's `listing_package_entitlements` mention) was left untouched — out of E3 scope. No "Free/Pro" shortcut was introduced anywhere for listing commercial state.

## Gate 9 — 390px admin mobile polish

Every new surface (nav groups, customer-support cards, manual-payment form, activity-log filters) uses existing Admin design tokens (`adminCardBase`, `adminBtn*`) with wrap-safe layout: the payment table is wrapped in `overflow-x-auto`; the Package & Placement grid and manual-payment form collapse to one column below `sm:`/`md:` breakpoints; buttons and badges use `flex flex-wrap`. **Live 390px browser verification was not performed this pass** (same Browser-pane-tool-availability caveat noted in the E2 closure) — this is a code-level review, not a runtime-proven one, and is reported as such rather than claimed complete.

## Gate 10 — System / Website Control terminal classification

| Surface | Classification | Status |
|---|---|---|
| Site Settings (`/admin/site-settings`) | Website Control | IMPLEMENTED — real writer, now primary nav |
| Home/content, Magazine/Revista, Newsletter/media-kit inbox (`/admin/workspace/**`) | Website Control | IMPLEMENTED — untouched, already real |
| Activity Log | System | IMPLEMENTED — now permission-gated + filterable (Gate 3) |
| `/admin/settings` | System | INTENTIONAL N/A — confirmed self-aware stub, explicitly links to the real pages; not rebuilt in E3 per instruction |
| Language audit | System | IMPLEMENTED — real, truthfully labeled as a hand-maintained checklist (not a live scan), unchanged |
| System Health / Bug Finder | System | **NAMED BLOCKER — no working foundation exists to wire.** Not built, per explicit instruction not to build one without an existing foundation. |
| SEO | — | **POST-E / PACKAGE F** — explicitly out of Package E's scope. |

## Terminal matrix

Allowed status values only: **IMPLEMENTED** (runtime-provable), **INTENTIONAL N/A** (exact reason), **NAMED BLOCKER** (exact reason).

### Nav groups

| Group | Navigation | Data source | Permission | Primary actions | Mobile state | Terminal status |
|---|---|---|---|---|---|---|
| COMMAND | Dashboard (`/admin`) | Real dashboard reads | `requireAdminCookie` (layout) | View KPIs | Reviewed, not live-verified | IMPLEMENTED |
| REVENUE | Payment Tracker (`/admin/workspace/payment-tracker`, primary Payments entry) | `leonix_payment_records` + enrichment joins | `canViewPaymentTracker` (owner_admin) | Filter, view, cross-link, record manual payment | Reviewed, not live-verified | IMPLEMENTED |
| MARKETPLACE OPS | Categories command center, Viajes, Tienda | Per-category real tables (listings + 6 dedicated tables) | `canViewGlobalAdminNav` | Moderate, search, publish/suspend | Reviewed, not live-verified | IMPLEMENTED |
| PEOPLE | Customer Ops, Users, Team, Support | `profiles` + unified ads bundle + new commercial context + audit | `requireAdminCookie` (usuarios/ops), role-gated (team) | Look up, view full commercial story, edit account type | Reviewed, not live-verified | IMPLEMENTED |
| WEBSITE CONTROL | Site Settings (new primary), Site Sections | `site_section_content`/global site config | `canViewSiteSettings` | Edit site content | Reviewed, not live-verified | IMPLEMENTED |
| SYSTEM | Activity Log (now permission-gated + filterable), Settings (stub), Language Audit | `admin_audit_log` | `requireActivityLogAccess` (new), `canViewSiteSettings` | Filter/search activity | Reviewed, not live-verified | IMPLEMENTED — except System Health (NAMED BLOCKER, no foundation) |

### Admin operations

| Operation | Terminal status |
|---|---|
| Payments | IMPLEMENTED — real ledger now primary-nav-discoverable, customer-linked |
| Subscriptions | IMPLEMENTED — real read, now surfaced per-customer with grace/cancel-at-period-end badges |
| Package entitlements | IMPLEMENTED — untouched, already real; now also per-customer |
| Placement | IMPLEMENTED — untouched, already real; now also per-customer |
| Promos | IMPLEMENTED — untouched, already real; now surfaced per-customer |
| Comp / partner / print grants | IMPLEMENTED — untouched, already real (`grant_source` surfaced per-customer) |
| Manual payments | IMPLEMENTED — real UI built in E3, real backend reused, critical actor-attribution fix applied |
| Moderation | IMPLEMENTED — untouched, already real |
| Reports | IMPLEMENTED — untouched, already real (surfaced on user detail) |
| Users | IMPLEMENTED — unified commercial context added in E3 |
| Audit logs | IMPLEMENTED — filtering added in E3; **NAMED BLOCKER: no actor/operator column exists in `admin_audit_log`** — filtering/display by actor is not possible without a schema change, which is locked for E3 |
| Site settings | IMPLEMENTED — now primary-nav-discoverable |

## Named blockers (final)

1. **`admin_audit_log` has no actor/operator column** — every write call site was traced; none record who performed an action. Filtering or displaying "which admin did this" is not possible without a migration (locked for E3).
2. **Roster-permission enforcement (`ADMIN_ENFORCE_ROSTER_PERMISSIONS`) — REQUIRES OWNER QA before enabling.** Flag left unchanged, per instruction; readiness assessed and documented above, not enabled blind.
3. **System Health / Bug Finder — no working foundation exists.** Not built, per explicit instruction not to invent one in E3.
4. **SEO — POST-E / PACKAGE F**, per explicit instruction.

These are the only genuine architecture/data gaps this build could not close within its locked boundaries; everything else E1 identified as consolidation/discoverability/truth work was closed with real, runtime-provable implementations.
