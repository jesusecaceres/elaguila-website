# Leonix Admin Command Center — Master Audit (ADMIN-OS-MASTER-AUDIT-01)

**Date:** 2026-06-12  
**Scope:** Read-only repo audit — no UI, schema, or business-logic changes in this gate.  
**Goal:** Blueprint the admin as the central operating portal; identify truth, gaps, duplication, and next implementation gates.

---

## 1. Executive summary

Leonix admin is **already a serious operations surface**, not a placeholder. The `/admin` dashboard (`AdminCommandCenterDashboard`) pulls **live Supabase counts** for listings review, reports, leads, expiring ads, category registry posture, monetization snapshots, and Tienda catalog stats. Launch Leads CRM, classifieds queue, Global Search (`/admin/ops`), reports queue, team roster, site workspace hub, and Tienda orders/catalog are **wired to real tables** with honest degradation when migrations or RLS block reads.

**What is already good**

- Launch-ops-first sidebar order (`adminGlobalNav.ts`): Dashboard → Launch Leads → Categories → Global Search → Payments → Team → Users → Support → Site sections → Viajes → Activity Log → Settings → Language audit → Tienda.
- Dashboard explicitly labels **live Supabase counts only** and shows warnings when lead counts or listing filters are unavailable.
- Classifieds queue row actions (`ClassifiedAdminRowActions`) support archive, suspend, republish, feature, verify Leonix, with server actions and confirmation on destructive paths in leads CRM.
- Shared admin design tokens (`adminTheme.ts`): burgundy primary `#7A1E2C`, rectangular CTAs, mobile card/table split patterns.
- Extensive verify script suite (27+ `verify-admin-*` scripts) guards nav, leads, review queue, mobile shell, monetization read models.

**What is confusing or incomplete**

- **Route naming drift:** “Site sections” nav → `/admin/workspace` (not `/admin/site-sections`). “Customer ops” nav → `/admin/ops` (Global Search). Reports live at `/admin/reportes` but are **not** in the global sidebar.
- **Duplicate entry points:** Categories hub at `/admin/workspace/clasificados` vs advanced registry at `/admin/categories`; legacy `/admin/clasificados/*` vs workspace vertical pages; Tienda at `/admin/tienda` vs `/admin/workspace/tienda` vs `/admin/payments`.
- **Sales rep role** skips dashboard entirely (`redirect("/admin/team")`) — CEO view is owner/admin only.
- **Users needing help** metric is a documented proxy (disabled users), not support ticket volume.
- Some vertical ops pages (comida-local, busco, clases) are thinner than Servicios/Autos/Restaurantes/Viajes.
- Activity log depends on `admin_audit_log` table availability — shows empty/unavailable states honestly.

**Recommended direction (later gates, not this audit)**

Reorganize sidebar into Command / Revenue / Marketplace Ops / People / Content / System groups; add top KPI strip on dashboard; unify Reports + Support discovery; finish mobile card conversion on remaining wide tables; standardize Live / Staged / Coming Soon badges everywhere.

---

## 2. Admin route inventory

**Total admin `page.tsx` routes found:** 86 (includes login, nested editors, Viajes subtree, legacy clasificados paths).

**Primary routes** (owner daily ops) — status from code inspection:

| Route | Nav label | Page purpose | Primary action | Data source | Status | Mobile | Risk | Owner priority | Next fix |
|-------|-----------|--------------|----------------|-------------|--------|--------|------|----------------|----------|
| `/admin` | Dashboard | CEO command center | See attention + jump to queue | `listings`, `listing_reports`, `leonix_leads*`, registry, Tienda | **STRONG** | **PARTIAL** (long scroll) | LOW | HIGH | Sticky KPI strip; collapse sections |
| `/admin/leads/inbox` | Launch Leads | CRM for contact/ad/promo leads | Reply, archive, lifecycle | `leonix_leads` | **STRONG** | **STRONG** (cards + drawer) | LOW | HIGH | Filter presets for “needs reply” |
| `/admin/leads/inbox?view=promo` | (filtered) | Promo / print quote view | Same as inbox | `leonix_leads` (source_cta) | **WORKING** | **STRONG** | LOW | HIGH | Dedicated nav chip optional |
| `/admin/leads/newsletter` | (subnav) | Newsletter subscribers | Export, lifecycle | `leonix_newsletter_subscribers` | **WORKING** | **PARTIAL** | LOW | MEDIUM | Mobile card list polish |
| `/admin/leads/media-kit` | (subnav) | Media kit requests | Reply, archive, export CSV | `leonix_media_kit_leads` | **WORKING** | **STRONG** | LOW | HIGH | — |
| `/admin/workspace/clasificados` | Categories | Category hub + global listings queue | Moderate, filter, bulk actions | `listings`, `site_category_config` | **STRONG** | **PARTIAL** (wide queue table) | MEDIUM | HIGH | Mobile queue cards default |
| `/admin/workspace/clasificados?status=flagged#queue` | (deep link) | Review queue | Clear flag, edit, archive | `listings` | **STRONG** | **PARTIAL** | MEDIUM | HIGH | Action proof toasts |
| `/admin/workspace/clasificados/servicios` | (category) | Servicios ops | Card-first listing ops | `listings` + servicios read models | **STRONG** | **STRONG** | LOW | HIGH | — |
| `/admin/workspace/clasificados/autos` | (category) | Autos ops | Listing moderation | `listings` / autos tables | **WORKING** | **PARTIAL** | MEDIUM | HIGH | Align with servicios card pattern |
| `/admin/workspace/clasificados/restaurantes` | (category) | Restaurantes ops | Listing moderation | `listings` / restaurantes | **WORKING** | **PARTIAL** | MEDIUM | HIGH | Mobile card sweep |
| `/admin/workspace/clasificados/viajes` | (category) | Viajes workspace lane | Staged listing ops | `viajes_staged_listings` | **WORKING** | **PARTIAL** | MEDIUM | MEDIUM | Link to `/admin/clasificados/viajes` hub |
| `/admin/ops` | Customer ops (Global Search) | Unified lookup | Search profile/listing/order/report | profiles, listings, tienda_orders, listing_reports | **STRONG** | **STRONG** | LOW | HIGH | Rename nav to “Global Search” |
| `/admin/reportes` | (not in sidebar) | Listing reports queue | Mark reviewed, open listing | `listing_reports` | **WORKING** | **PARTIAL** (table) | MEDIUM | HIGH | Add to sidebar under Marketplace Ops |
| `/admin/support` | Support | Support tickets | Create/update ticket status | support tickets table (server actions) | **WORKING** | **PARTIAL** | MEDIUM | MEDIUM | Distinguish from `/admin/reportes` in UI copy |
| `/admin/team` | Team (staff home) | Staff landing | Links to roster, preview, sales | static + roster | **WORKING** | **STRONG** | LOW | MEDIUM | — |
| `/admin/team/roster` | Team (nav target) | Staff roster CRUD | Manage team members | `admin_team_members` | **WORKING** | **PARTIAL** | MEDIUM | HIGH | Mobile roster cards |
| `/admin/team/users/new` | (staff nav) | Create staff user | Provision invite intent | Supabase Auth + provisioning | **PARTIAL** | **STRONG** | HIGH | HIGH | Document Auth invite vs record-only |
| `/admin/usuarios` | Users | Customer accounts | Disable, lookup, drill-down | `profiles` | **WORKING** | **PARTIAL** | MEDIUM | HIGH | Mobile user cards |
| `/admin/usuarios/[id]` | (detail) | User 360 | Reports, listings, disable | profiles + related | **STRONG** | **PARTIAL** | MEDIUM | HIGH | Reduce horizontal tables |
| `/admin/workspace` | Site sections | Public section map | Jump to section editors | `site_section_content`, truth matrix | **STRONG** | **STRONG** | LOW | MEDIUM | Alias `/admin/site-sections` redirect optional |
| `/admin/site-settings` | (workspace card) | Global toggles | Save site-wide settings | site settings storage | **WORKING** | **STRONG** | LOW | MEDIUM | — |
| `/admin/settings` | Settings | Admin preferences hub | Links to site-settings, language | mixed | **WORKING** | **STRONG** | LOW | LOW | — |
| `/admin/workspace/language-audit` | Language audit | i18n coverage audit | Run audit, fix gaps | static analysis + routes | **WORKING** | **PARTIAL** | LOW | LOW | — |
| `/admin/tienda` | Tienda | Orders + catalog hub | Fulfill orders, edit catalog | `tienda_orders`, catalog tables | **WORKING** | **PARTIAL** | MEDIUM | MEDIUM | Consolidate with `/admin/payments` |
| `/admin/tienda/catalog` | (sub) | Product catalog CRUD | Edit SKUs, featured | Tienda catalog | **WORKING** | **PARTIAL** | MEDIUM | MEDIUM | — |
| `/admin/payments` | Payments | Revenue aggregates | Jump to tracker/orders | `tienda_orders`, payment tracker | **WORKING** | **STRONG** | LOW | MEDIUM | Clarify vs workspace monetization |
| `/admin/categories` | (legacy link) | Advanced category registry | Edit Supabase category config | `site_category_config` | **WORKING** | **PARTIAL** | MEDIUM | MEDIUM | Merge UX with clasificados hub |
| `/admin/activity-log` | Activity Log | Audit trail | Read recent admin actions | `admin_audit_log` | **PARTIAL** | **PARTIAL** | LOW | MEDIUM | Expand action coverage |
| `/admin/clasificados/viajes` | Viajes | Viajes admin hub | Campaigns, affiliate cards | viajes tables | **WORKING** | **PARTIAL** | MEDIUM | MEDIUM | Single Viajes nav story |

**Secondary / legacy routes (sample):** `/admin/leads` (redirect), `/admin/draw`, `/admin/magazine`, `/admin/website-content` → redirect, `/admin/clasificados/servicios`, workspace content editors (`/admin/workspace/home/content`, etc.), Viajes affiliate CRUD, `/admin/workspace/payment-tracker`, `/admin/workspace/promo-codes`, `/admin/workspace/package-entitlements`, `/admin/workspace/sales-tracker`, category editors under `/admin/workspace/clasificados/category/*`.

**Status summary (primary routes only, n≈28):**

| Status | Count |
|--------|-------|
| STRONG | 8 |
| WORKING | 17 |
| PARTIAL | 3 |
| CONFUSING | 0 (documented as nav/naming issues, not broken pages) |
| BROKEN / UNKNOWN | 0 |

---

## 3. CEO dashboard review

**File:** `app/admin/_components/AdminCommandCenterDashboard.tsx` + `app/admin/_lib/adminDashboardData.ts`

### What works well

1. **“Today’s command snapshot”** chip row: Review, Reports, Leads need reply, Expiring, Expired — all labeled as live counts.
2. **Today’s Attention** section answers “what needs my attention” with deep links to review queue, reportes, Launch Leads, expiring/expired lists.
3. **Money Pipeline** section surfaces leads by type (Launch, Promocionales, Advertising, Media kit, Newsletter) + Tienda catalog live count.
4. **Monetization hub card** links entitlements, promo codes, payment tracker (role-gated), sales tracker.
5. **Review + Expiring queues** render inline with per-row CTAs (admin queue, view public) and urgent badges.
6. **Honest warnings:** `listingsQueryFallback`, `leads.unavailable`, `usersNeedingHelpNote` (proxy disclaimer).
7. **Category registry summary:** Live / Staged / Coming Soon counts from merged registry.

### What is not good / confusing

- Long vertical page — CEO must scroll to find Review vs Expiring vs Quick Actions.
- **Advertising leads** CTA goes to generic Launch Leads inbox, not a filtered advertising view.
- **Users needing help** is not ticket count — can mislead if read quickly.
- Sales reps never see this dashboard (by design, but owner may not know).
- `#expiring` anchor CTAs require scroll within same page — no dedicated expiring route.

### What is missing

- Single **launch-critical strip** (P0 blockers: pending reports > N, leads needing reply > N, failed Tienda emails).
- **System health** tile (Resend failures, migration warnings, email_delivery_status failed on orders).
- **Last action proof** (“you archived lead X at …”) — Activity Log is separate.
- **Website lock status** (Coming Soon lock on/off) for operator context — not on dashboard today.

### Recommended dashboard changes (future gate)

| Change | Rationale |
|--------|-----------|
| **Top KPI strip** (sticky on mobile) | Answers Q1/Q6 instantly |
| **Command tabs:** Attention \| Revenue \| Review \| Expiring | Reduces scroll fatigue |
| Move **Money Pipeline** below Attention but keep above fold on desktop | Revenue follow-up is Q2 |
| Add **Reports** + **Global Search** quick chips in header | Q6 |
| Demote **Users proxy** to secondary footnote | Avoid fake readiness |
| Mobile: one column, collapsible sections | MOBILE-01 alignment |

---

## 4. Proposed admin information architecture

Current sidebar is **launch-ops-first** (good). Proposed grouping for a **future nav reorg gate** (no change in this audit):

### 1. Command
| Item | Current route |
|------|----------------|
| Dashboard | `/admin` |
| Global Search | `/admin/ops` |
| Activity Log | `/admin/activity-log` |

### 2. Revenue
| Item | Current route |
|------|----------------|
| Launch Leads | `/admin/leads/inbox` |
| Promo quotes | `/admin/leads/inbox?view=promo` |
| Tienda | `/admin/tienda` |
| Payments hub | `/admin/payments` |
| Package entitlements | `/admin/workspace/package-entitlements` |
| Promo codes | `/admin/workspace/promo-codes` |
| Payment tracker | `/admin/workspace/payment-tracker` |
| Sales tracker | `/admin/workspace/sales-tracker` |

### 3. Marketplace Ops
| Item | Current route |
|------|----------------|
| Categories + queue | `/admin/workspace/clasificados` |
| Servicios / Autos / Restaurantes / Viajes | workspace vertical pages |
| Reports | `/admin/reportes` ← **add to sidebar** |
| Support tickets | `/admin/support` |

### 4. People
| Item | Current route |
|------|----------------|
| Team roster | `/admin/team/roster` |
| Staff home | `/admin/team` |
| Users | `/admin/usuarios` |
| Global Search (duplicate OK) | `/admin/ops` |

### 5. Content / Website
| Item | Current route |
|------|----------------|
| Site sections | `/admin/workspace` |
| Global settings | `/admin/site-settings` |
| Magazine | `/admin/magazine`, `/admin/workspace/revista` |
| Language audit | `/admin/workspace/language-audit` |

### 6. System
| Item | Current route |
|------|----------------|
| Settings | `/admin/settings` |
| Launch lock / preview docs | external docs only today |
| Admin health | **missing** — future gate |

**Reorganize sidebar?** Yes — in a dedicated **ADMIN-NAV-IA-REORG-01** gate after owner sign-off. Keep hrefs stable; change labels, order, and grouping only.

---

## 5. Action truth map

| Action | Where it appears | Route | Works | Destructive | Confirm | Action proof | Server/API | Blocker |
|--------|------------------|-------|-------|-------------|---------|--------------|------------|---------|
| View public | Dashboard review rows, queue | various | **TRUE** | FALSE | FALSE | Link opens | N/A | Missing public URL shown honestly |
| Edit / manage listing | Queue, servicios ops, edit page | `/admin/workspace/clasificados/listings/[id]/edit` | **TRUE** | FALSE | FALSE | Navigation | server actions | Category-specific |
| Archive lead | Launch Leads, Media kit | leads clients | **TRUE** | soft | **TRUE** (delete) | Toast | `/api/admin/leads/*` | — |
| Restore lead | Leads CRM | inbox, media-kit | **TRUE** | FALSE | FALSE | Toast | lifecycle API | — |
| Soft delete lead | Media kit, leads | drawers | **TRUE** | **TRUE** | **TRUE** | Toast | lifecycle API | — |
| Permanent delete | Limited | media-kit | **PARTIAL** | **TRUE** | **TRUE** | Toast | lifecycle | Not all entities |
| Mark reviewed | Reports | `/admin/reportes` | **TRUE** | FALSE | FALSE | Status update | report actions | — |
| Clear flag | Classifieds queue | clasificados | **TRUE** | FALSE | sometimes | Row update | listing actions | — |
| Feature listing | Row actions | queue | **TRUE** | FALSE | FALSE | Row state | classified actions | Monetization metadata |
| Verify Leonix | Row actions | queue | **TRUE** | FALSE | FALSE | Badge/state | server action | — |
| Republish / move to top | Row actions | queue, empleos | **TRUE** | FALSE | FALSE | Label from capability helper | republish action | Category-dependent |
| Suspend / unsuspend | Row actions | queue | **TRUE** | **TRUE** | partial | Status change | listing actions | — |
| Contact seller | User detail, ops | usuarios, ops | **TRUE** | FALSE | FALSE | mailto / profile | N/A | — |
| Copy email | Leads drawer | inbox | **TRUE** | FALSE | FALSE | Clipboard | client | — |
| Export CSV | Media kit | media-kit | **TRUE** | FALSE | FALSE | Download | export route | — |
| Search | Ops, leads, queue | `/admin/ops`, inboxes | **TRUE** | FALSE | FALSE | Results list | unified search | Section limits |
| Filter | Leads, queue | inbox, clasificados | **TRUE** | FALSE | FALSE | URL params | server read | — |
| Create staff user | Team | `/admin/team/users/new` | **PARTIAL** | FALSE | FALSE | Form result | provisioning | Auth invite vs record |
| Manage team | Roster | `/admin/team/roster` | **TRUE** | FALSE | FALSE | Table update | team actions | — |
| Manage website section | Workspace hub | `/admin/workspace/*` | **PARTIAL** | FALSE | FALSE | Save banner | section actions | Some sections PARTIAL per truth matrix |
| Support ticket action | Support | `/admin/support` | **TRUE** | FALSE | FALSE | Redirect flash | supportTicketActions | — |
| Payment / promo action | Payment tracker, promo codes | workspace | **TRUE** | varies | partial | Row updates | workspace actions | Role-gated |

**Strongest actions:** Launch Leads lifecycle, classifieds queue moderation, reports status, ops unified search, servicios card ops.

**Riskiest:** Soft delete leads, suspend listing, staff provisioning (Auth side effects).

**Broken / unknown:** None confirmed in code paths inspected; degraded states show warnings instead of fake zeros.

---

## 6. Design system audit

**Source:** `app/admin/_components/adminTheme.ts`, `AdminPageHeader`, `AdminSectionCard`, `adminCtaChip*`, dashboard semantic CTAs.

### Consistent (Leonix brand system)

- Burgundy primary `#7A1E2C` on primary buttons and links.
- Warm cream page background, `--lx-*` CSS variables, rounded-3xl cards.
- **Rectangular CTAs** (`rounded-lg`) on dashboard command center — intentional MOBILE-01.
- Semantic dashboard button colors: burgundy primary, army green active, royal blue view, orange warning, cream neutral.
- `adminDesktopTableOnly` + `adminMobileCardList` pattern documented and used on leads, servicios ops.
- Warning callouts (`adminWarningCallout`) for migration/degraded states.
- Status badges: urgent rose, expiring amber, metric chips gold/bronze.

### Inconsistent

- Mix of `adminCtaChip` (rounded-lg) and older `adminBtnSecondary` (also rounded-lg but different padding) on same pages.
- Some workspace pages use inline Tailwind one-offs vs theme tokens.
- Category pages mix chip secondary CTAs with plain underlined links.
- Legacy `/admin/clasificados/*` pages may not match workspace polish.

### Shared components recommended

- `AdminPageHeader` — already shared; enforce everywhere.
- `AdminSectionCard` — dashboard sections; extend to ops verticals.
- `ClassifiedAdminRowActions` — extend pattern to autos/restaurantes mobile.
- `AdminDashboardCta` — use for all primary jumps instead of raw `Link` classes.
- Unified **Live / Staged / Coming Soon** badge component (registry truth exists; not uniform in all tables).

### Pages needing style pass

- `/admin/reportes` — table-heavy desktop default.
- `/admin/usuarios` — wide table on phone.
- `/admin/team/roster` — table-first.
- Legacy clasificados admin subtree.
- `/admin/categories` advanced registry — dense forms.

### Horizontal overflow risk

- Classifieds global queue table (mitigated partially by `overflow-x-auto`).
- User detail reports/listings tables.
- Payment tracker wide grids.
- **Mitigation exists:** `adminTableWrap`, `overflow-x-hidden` on ops page — apply consistently.

---

## 7. Data / truth audit

| Area | Real data source | Table / API | Fake/static risk | Degraded state | Needs live Supabase proof |
|------|------------------|-------------|------------------|----------------|---------------------------|
| Dashboard counts | `getAdminDashboardSnapshot()` | listings, listing_reports, profiles | **LOW** — warnings if fallback | `listingsQueryFallback`, lead unavailable | Run dashboard with prod service role |
| Launch Leads | `leonixLeadsData.ts` | `leonix_leads` | **LOW** | Migration note in UI | ✓ |
| Newsletter | leads newsletter page | `leonix_newsletter_subscribers` | **LOW** | lifecycle migration hint | ✓ |
| Media kit | media-kit client | `leonix_media_kit_leads` | **LOW** | — | ✓ |
| Promo quotes | inbox filter | `leonix_leads.source_cta` | **LOW** | — | ✓ |
| Classifieds queue | AdminListingsTable | `listings` | **LOW** | status column fallback | ✓ |
| Flagged queue | filtered queue | `listings.status` | **LOW** | — | ✓ |
| Reports | reportes page | `listing_reports` | **LOW** | empty state honest | ✓ |
| Categories status | registry merge | `site_category_config` + code registry | **LOW** | PARTIAL rows in truth matrix | ✓ |
| Servicios ops | servicios page | listings + read models | **LOW** | readError banner | ✓ |
| Autos/restaurantes/viajes | vertical pages | listings / staged | **MEDIUM** — uneven UI depth | varies | Per-vertical smoke |
| Users | usuarios | `profiles` | **LOW** | — | ✓ |
| Team roster | roster | `admin_team_members` | **LOW** | — | ✓ |
| Tienda orders/catalog | tienda admin | `tienda_orders`, catalog | **LOW** | email_delivery_status surfaced | ✓ |
| Site sections | workspace hub | `site_section_content`, editors | **PARTIAL** — truth matrix marks some MISSING | HONESTLY_DISABLED badges | ✓ |
| Monetization | entitlements, promo, payment tracker | dedicated tables | **LOW** if migrations applied | `dataUnavailable` flags | ✓ |
| Activity log | audit page | `admin_audit_log` | **LOW** | empty/unavailable modes | ✓ |
| Analytics monetization tables | readonly panels | read models | **LOW** — labeled readonly | — | ✓ |

**Fake/static risk hotspots:** Users needing help proxy; any page without migration applied shows warning not fake data. **No evidence of fabricated analytics counts** in dashboard code reviewed.

---

## 8. Mobile admin audit

| Route | Phone | Tablet | Overflow risk | Tables | Cards | Tappable CTAs | Fix priority |
|-------|-------|--------|---------------|--------|-------|---------------|--------------|
| `/admin` | PARTIAL | STRONG | LOW | No | Yes (metrics) | Yes min-h 44px | Collapse sections |
| `/admin/leads/inbox` | STRONG | STRONG | LOW | Hidden md+ | Yes | Yes | — |
| `/admin/workspace/clasificados` | PARTIAL | PARTIAL | **HIGH** | Yes | Partial | Yes | Default mobile cards in queue |
| `/admin/workspace/clasificados/servicios` | STRONG | STRONG | LOW | Hidden | Yes | Yes | — |
| `/admin/ops` | STRONG | STRONG | LOW | Optional | Yes | Yes | — |
| `/admin/reportes` | POOR | PARTIAL | MEDIUM | Yes | No | partial | Add mobile cards |
| `/admin/usuarios` | PARTIAL | PARTIAL | MEDIUM | Yes | No | Yes | Card conversion |
| `/admin/team/roster` | PARTIAL | STRONG | LOW | Yes | No | Yes | Card list |
| `/admin/tienda` | PARTIAL | STRONG | LOW | Mixed | partial | Yes | — |
| `/admin/workspace` | STRONG | STRONG | LOW | No | Yes | Yes | — |

**Sidebar/hamburger:** `AdminMobileNavDrawer` + `AdminSidebar` — STRONG clarity per `verify-admin-mobile-shell.mjs`.

**Next mobile fixes:** Reportes, clasificados queue, usuarios list, roster — apply `adminMobileCardList` pattern.

---

## 9. Missing tools / features

- Unified **admin health** panel (email failures, migration status, Resend config hint).
- **Launch lock / preview bypass** operator status (docs exist; not in admin UI).
- **Advertising leads** filtered inbox view (like promo).
- **Dedicated expiring listings** route (dashboard uses anchor).
- **Single Viajes** nav story (workspace + `/admin/clasificados/viajes`).
- **site-sections** alias route for owner mental model (`/admin/workspace` only today).
- **Action proof** stream on dashboard (recent audit log snippet).
- **Bulk lead assign** / owner reply templates expansion (templates exist; workflow incomplete).
- **Real support ticket count** on dashboard (tickets exist at `/admin/support` but not in KPI strip).

---

## 10. Prioritized roadmap

### P0 — Launch-critical

| Gate | Reason | Target | Impact | Risk | Size |
|------|--------|--------|--------|------|------|
| ADMIN-REPORTES-SIDEBAR-01 | Reports not in nav; CEO misses complaints | `adminGlobalNav.ts`, i18n | Faster moderation | LOW | Small |
| ADMIN-DASHBOARD-KPI-STRIP-01 | Attention buried in scroll | `AdminCommandCenterDashboard.tsx` | Answers “what today?” | LOW | Medium |
| ADMIN-LEADS-NEEDS-REPLY-FILTER-01 | Dashboard CTA lands generic inbox | leads inbox filters | Faster lead follow-up | LOW | Small |
| ADMIN-MIGRATION-WARNINGS-01 | Ensure all prod migrations applied | deploy checklist | Prevents silent count loss | MEDIUM | Small |

### P1 — Admin operator quality

| Gate | Reason | Target | Impact | Risk | Size |
|------|--------|--------|--------|------|------|
| ADMIN-NAV-IA-REORG-01 | Sidebar grouping vs mental model | nav + drawer | Less confusion | MEDIUM | Medium |
| ADMIN-OPS-NAV-LABEL-01 | “Customer ops” → “Global Search” | adminStrings | Clarity | LOW | Small |
| ADMIN-MOBILE-QUEUE-CARDS-01 | Clasificados queue horizontal scroll | AdminListingsTable | Phone usability | LOW | Medium |
| ADMIN-MOBILE-REPORTES-CARDS-01 | Reportes table on phone | AdminReportsTable | Phone usability | LOW | Medium |
| ADMIN-SITE-SECTIONS-ALIAS-01 | `/admin/site-sections` → workspace redirect | route alias | Owner wayfinding | LOW | Small |

### P2 — Monetization growth

| Gate | Reason | Target | Impact | Risk | Size |
|------|--------|--------|--------|------|------|
| ADMIN-PAYMENTS-UNIFY-01 | payments vs tienda vs workspace | hub pages | Revenue ops clarity | MEDIUM | Medium |
| ADMIN-ADVERTISING-LEADS-VIEW-01 | No filtered advertising inbox | leads inbox | Sales follow-up | LOW | Small |
| ADMIN-MONETIZATION-DASHBOARD-TILE-01 | Stripe/payment failures visible | dashboard | Revenue protection | MEDIUM | Medium |

### P3 — Nice-to-have / after launch

| Gate | Reason | Target | Impact | Risk | Size |
|------|--------|--------|--------|------|------|
| ADMIN-ACTIVITY-DASHBOARD-WIDGET-01 | Recent actions on home | dashboard + audit | Operator confidence | LOW | Small |
| ADMIN-LAUNCH-LOCK-STATUS-01 | Show Coming Soon lock in admin | settings tile | Ops context | LOW | Small |
| ADMIN-VIAJES-NAV-CONSOLIDATE-01 | Dual Viajes entry points | nav | Less duplication | LOW | Medium |
| LEGACY-CLASIFICADOS-ADMIN-DEPRECATE-01 | Old `/admin/clasificados/*` paths | redirects | Maintenance | MEDIUM | Large |

---

## 11. Recommended next 5 gates

1. **ADMIN-DASHBOARD-KPI-STRIP-01** — Sticky launch-critical KPIs (review, reports, leads need reply, expiring) with one-tap deep links.
2. **ADMIN-REPORTES-SIDEBAR-01** — Add `/admin/reportes` to Marketplace Ops in sidebar; clarify vs Support.
3. **ADMIN-NAV-IA-REORG-01** — Group sidebar into Command / Revenue / Marketplace / People / Content / System (labels only).
4. **ADMIN-MOBILE-QUEUE-CARDS-01** — Default mobile card layout for clasificados global queue.
5. **ADMIN-OPS-NAV-LABEL-01** — Rename nav “Customer ops” to “Global Search” to match page title and owner vocabulary.

---

## 12. Risks / deferred work

- **Do not fake readiness:** Dashboard already avoids this — keep warnings when Supabase reads fail.
- **Role matrix complexity:** Sales rep vs owner vs staff — document in team gate; sales rep skips CEO dashboard.
- **Dual admin trees:** workspace vs legacy clasificados — deprecate gradually with redirects.
- **Website editing truth matrix:** several sections PARTIAL/MISSING — public site may show static copy; admin is honest about it.
- **Stripe/payment:** Payment tracker role-gated; not all operators see commission data.
- **Schema:** Lifecycle columns on leads/newsletter/media_kit require migrations — UI shows migration hints.

---

## 13. TRUE/FALSE audit

| Flag | Value |
|------|-------|
| Audit based on repo inspection (not invented routes) | **TRUE** |
| Route inventory covers primary owner routes | **TRUE** |
| CEO dashboard review references real components | **TRUE** |
| Information architecture proposal documented | **TRUE** |
| Action truth map lists destructive + confirmation | **TRUE** |
| Design system references adminTheme + rectangular CTAs | **TRUE** |
| Data audit distinguishes real data vs proxy/fallback | **TRUE** |
| Mobile audit per key routes | **TRUE** |
| Missing tools section | **TRUE** |
| P0–P3 roadmap | **TRUE** |
| Next 5 gates named | **TRUE** |
| No public page changes in this gate | **TRUE** |
| No schema changes in this gate | **TRUE** |
| No Stripe/payment logic changes in this gate | **TRUE** |
| No listing/category business logic changes in this gate | **TRUE** |

---

## Appendix — Files inspected

- `app/admin/_lib/adminGlobalNav.ts`, `adminDashboardRoutes.ts`, `adminDashboardData.ts`, `adminAccessControl.ts`, `adminNavOps.ts`, `adminStrings.ts`
- `app/admin/_components/AdminCommandCenterDashboard.tsx`, `AdminSidebar.tsx`, `AdminMobileNavDrawer.tsx`, `adminTheme.ts`
- `app/admin/(dashboard)/page.tsx`, `ops/page.tsx`, `reportes/page.tsx`, `support/page.tsx`, `workspace/page.tsx`, `payments/page.tsx`, `activity-log/page.tsx`
- `app/admin/(dashboard)/leads/*`, `workspace/clasificados/*`, `team/*`, `usuarios/*`, `tienda/*`, `settings/page.tsx`, `categories/page.tsx`
- `app/admin/_components/leads/*`, `workspace/clasificados/_components/ClassifiedAdminRowActions.tsx`
- `scripts/verify-admin-*.mjs` (27 files), `package.json`

## Appendix — Existing verify scripts (admin-related)

`verify-admin-ops-global-lookup`, `verify-admin-dashboard-mobile-command-center`, `verify-admin-leads-crm`, `verify-admin-leads-inbox-ui-lifecycle`, `verify-admin-category-live-truth-style`, `verify-admin-servicios-ops-presentation`, `verify-admin-nav-ops`, `verify-admin-mobile-shell`, `verify-admin-staff-launch-readiness`, and 18 others — use as regression gates when implementing roadmap items.
