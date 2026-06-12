# Dashboard Mobile Command Center Audit (ADMIN-DASHBOARD-MOBILE-01)

## Files inspected

- `app/admin/(dashboard)/page.tsx`
- `app/admin/_components/AdminCommandCenterDashboard.tsx`
- `app/admin/_components/AdminCommandCenterClient.tsx`
- `app/admin/_components/AdminDashboardCta.tsx`
- `app/admin/_components/AdminQuickActionsRail.tsx` (superseded on dashboard; sidebar rail removed)
- `app/admin/_components/adminTheme.ts`
- `app/admin/_lib/adminDashboardData.ts`
- `app/admin/_lib/adminDashboardRoutes.ts`
- `app/admin/_lib/adminGlobalNav.ts`
- `app/admin/_components/AdminShell.tsx` / `AdminMobileNavDrawer.tsx` (unchanged; hamburger already usable)
- `scripts/verify-admin-dashboard-mobile-command-center.mjs`

## Files changed

- `app/admin/(dashboard)/page.tsx` — thin server loader for command center
- `app/admin/_components/AdminCommandCenterDashboard.tsx` — new executive layout
- `app/admin/_components/AdminCommandCenterClient.tsx` — mobile section pill carousel
- `app/admin/_components/AdminDashboardCta.tsx` — semantic rectangular CTAs
- `app/admin/_components/adminTheme.ts` — dashboard CTA tokens
- `app/admin/_lib/adminDashboardData.ts` — 3-day expiring window, lead counts, review helpers
- `app/admin/_lib/adminDashboardRoutes.ts` — canonical dashboard hrefs
- `scripts/verify-admin-dashboard-mobile-command-center.mjs`
- `scripts/verify-admin-dashboard-cleanup.mjs` — reads command center component
- `package.json` — verify script

## Problems found (before)

- Desktop-first two-column layout with sticky right rail squeezed on phone
- No Launch Leads / Promocionales / money pipeline on dashboard home
- Expiring queue mixed expired + soon with 7-day window
- Review rows omitted reason when DB field empty
- Giant empty canvas feel on mobile (sidebar rail below fold)

## New dashboard architecture

1. **Today's Attention** — pending ads, reports, leads needing reply, expiring/expired counts, disabled-user proxy
2. **Money Pipeline** — Launch Leads, Promocionales, advertising, media kit, newsletter, Tienda catalog + monetization hub card
3. **Quick Actions** — rectangular CTA grid (10 commands)
4. **Operations** — categories, leads, team, users, customer ops, Tienda, site sections
5. **Review / Urgent** — pending review queue with reason or honest fallback; ❗ for flagged / changes_requested
6. **Expiring / Expired** — split sections; expiring soon = 3 days

## Layout results

| Breakpoint | Result |
|---|---|
| Phone (390px) | Summary card → horizontal pill section nav → stacked cards → full-width / 2-col CTAs; `max-w-7xl` + `min-w-0`; no table layouts |
| Tablet | 2-column metric grids; wrapped CTAs; all sections visible when scrolling |
| Desktop | Constrained `max-w-7xl` command center; no narrow sidebar rail |

## Hamburger / carousel

- **Hamburger:** unchanged global `AdminMobileNavDrawer` in topbar (closed by default overlay)
- **Dashboard sections:** horizontal scroll pill carousel (`AdminCommandCenterClient`) on `md:hidden`

## CTA color mapping

| Token | Color | Use |
|---|---|---|
| `adminDashboardCtaPrimary` | Burgundy `#7A1E2C` | Launch Leads, Promocionales, strongest actions |
| `adminDashboardCtaActive` | Army green `#2A4536` | Team, Tienda, newsletter, public view |
| `adminDashboardCtaView` | Royal blue `#1E4A7A` | Inspect / navigate / settings |
| `adminDashboardCtaWarning` | Orange `#E8943A` | Classifieds queue, pending review |
| `adminDashboardMetricChip` | Gold/bronze border | Summary count chips |
| `adminDashboardUrgentBadge` | Red rose | ❗ urgent review / expired |
| `adminDashboardCtaNeutral` | Cream/ivory card | Secondary utilities |

## Review / flagged source

| Source | Field / logic |
|---|---|
| Generic listings | `listings.status IN ('pending','flagged')`; reason usually null |
| Empleos | `lifecycle_status = pending_review`; `moderation_reason` or `review_notes` |
| Viajes staged | `lifecycle_status IN (submitted, in_review, changes_requested)`; `moderation_reason` or `review_notes` |
| AI moderation | **Not wired** to dashboard reasons — no invented AI text |
| Fallback | `Reason unavailable — inspect review source` |
| Urgent marker | ❗ when status flagged or changes_requested |

## Expiration behavior

- **Window:** `ADMIN_DASHBOARD_EXPIRING_SOON_DAYS = 3` (was 7)
- **Fields:** `listings.republished_at` + En Venta window, `listings.expires_at`, `viajes_staged_listings.expires_at`
- **Expired:** separate list (`isExpired === true`)
- **No proxy:** recent listings never used as expiration

## CTA smoke test matrix

| CTA | Expected route | Result |
|---|---|---|
| Launch Leads | `/admin/leads/inbox` | PASS |
| Promocionales | `/admin/leads/inbox?view=promo` | PASS |
| Newsletter | `/admin/leads/newsletter` | PASS |
| Media Kit | `/admin/leads/media-kit` | PASS |
| Classifieds Queue | `/admin/workspace/clasificados` | PASS |
| Team | `/admin/team` | PASS |
| Create Staff User | `/admin/team/users/new` | PASS |
| Website Sections | `/admin/workspace` | PASS |
| Global Settings | `/admin/settings` | PASS |
| Tienda | `/admin/tienda` | PASS |
| Catalog | `/admin/tienda/catalog` | PASS |
| View Public Site | `/` | PASS |

## Risks / deferred

- Tienda order counts not on home (still on Tienda hub) — catalog live count only when table exists
- Users needing help remains disabled-account proxy until support queue exists
- Magazine card retained under Operations (not removed)

## TRUE/FALSE audit

See verify script output after `npm run verify:admin-dashboard-mobile-command-center` and `npm run build`.
