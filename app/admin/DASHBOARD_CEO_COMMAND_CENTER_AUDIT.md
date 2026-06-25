# Dashboard CEO Command Center Audit (ADMIN-DASHBOARD-CEO-COMMAND-CENTER-02)

## 1. Files inspected

- `app/admin/(dashboard)/page.tsx`
- `app/admin/_components/AdminCommandCenterDashboard.tsx`
- `app/admin/_components/AdminCommandCenterClient.tsx`
- `app/admin/_components/AdminDashboardCta.tsx`
- `app/admin/_components/AdminDashboardReviewCardActions.tsx`
- `app/admin/_components/adminTheme.ts`
- `app/admin/_lib/adminDashboardData.ts`
- `app/admin/_lib/adminDashboardRoutes.ts`
- `docs/leonix-admin-command-center-master-audit.md`

## 2. Files changed

- `app/admin/_components/AdminCommandCenterDashboard.tsx` — CEO architecture layout
- `app/admin/_components/AdminCommandCenterClient.tsx` — section nav all breakpoints, anchor ids
- `app/admin/_lib/adminDashboardRoutes.ts` — site-sections alias + vertical ops routes
- `app/admin/(dashboard)/site-sections/page.tsx` — **new** redirect to `/admin/workspace`
- `scripts/verify-admin-dashboard-ceo-command-center.mjs` — **new**
- `package.json` — verify script

## 3. Current dashboard problems (before)

- Too vertically long; weak top hierarchy
- Website editing block appeared before CEO priorities
- Today's Attention + Money Pipeline not dominant enough
- Quick Actions and Operations duplicated CTAs
- Full review/expiring lists too repetitive mid-page
- Felt like “Leonix Dashboard” not “Command Center”

## 4. New dashboard architecture

1. **Hero command header** — Leonix Command Center / Owner dashboard + status chips
2. **CEO priority strip** — 6 compact KPI tiles with CTAs
3. **Section nav** — Today | Revenue | Marketplace | Website | System | Review | Expiration
4. **Today's Command** — action cards (review, reports, leads, expiring, expired, users proxy)
5. **Revenue Pipeline** — lead/revenue cards + monetization hub (unchanged data)
6. **Marketplace Operations** — category + vertical ops + reports + Global Search
7. **Website & Content Control** — site sections, settings, public site, magazine, newsletter, media kit, language audit
8. **Admin Team & System** — roster, staff create, users, search, settings, activity log, support, Tienda
9. **Review workbench preview** — top 5 items + full queue CTA
10. **Expiration workbench preview** — top 3 soon + top 3 expired + queue CTA

## 5. Section order rationale

CEO priorities first (today + revenue), then operational lanes (marketplace), then content (lower than before), then people/system, then compact workbench previews at bottom to avoid scroll fatigue.

## 6. CTA route matrix

| CTA | Route | Status |
|-----|-------|--------|
| Open Launch Leads | `/admin/leads/inbox` | PASS |
| Open Promocionales | `/admin/leads/inbox?view=promo` | PASS |
| Newsletter | `/admin/leads/newsletter` | PASS |
| Media kit | `/admin/leads/media-kit` | PASS |
| Review ads | `/admin/workspace/clasificados?status=flagged#queue` | PASS |
| Categories / ad ops | `/admin/workspace/clasificados` | PASS |
| Servicios ops | `/admin/workspace/clasificados/servicios` | PASS |
| Global Search | `/admin/ops` | PASS |
| Reports | `/admin/reportes` | PASS |
| Team roster | `/admin/team/roster` | PASS |
| Create staff user | `/admin/team/users/new` | PASS |
| Users | `/admin/usuarios` | PASS |
| Site sections | `/admin/site-sections` → `/admin/workspace` | PASS (alias) |
| Settings | `/admin/settings` | PASS |
| Tienda | `/admin/tienda` | PASS |
| Catalog | `/admin/tienda/catalog` | PASS |
| Public site | `/` | PASS |
| Activity log | `/admin/activity-log` | PASS |
| Language audit | `/admin/workspace/language-audit` | PASS |

## 7. Real data / fake risk matrix

| Metric | Source | Fake risk |
|--------|--------|-----------|
| Leads counts | `getAdminDashboardLeadsCounts()` | LOW — shows Unavailable if missing |
| Review/pending | `getAdminDashboardSnapshot()` | LOW — fallback note if DB filter fails |
| Reports | `listing_reports` | LOW |
| Expiring/expired | expiring queue | LOW |
| Monetization counts | entitlements/promo/payment snapshots | LOW — shows — if unavailable |
| Users help | disabled users proxy | LOW — labeled in card |
| Tienda catalog | `getAdminCatalogStats()` | LOW — Unavailable on error |

## 8. Mobile result

- Priority strip: 2-column grid on phone
- Section nav: horizontal scroll tabs all breakpoints
- Cards stack full-width; CTAs min-h 40–44px
- `overflow-x-hidden` on root canvas

## 9. Desktop result

- `max-w-7xl` centered command canvas
- 3-column command cards on xl
- Section nav visible without hamburger-only limitation

## 10. Review / flagged truth

- Label: “flagged/review status”
- Reason: `adminDashboardReviewReasonLabel()` → “Reason unavailable — inspect review source”
- Footer: explicit “not AI-generated explanations”
- Deep link: `#queue` on classifieds review URL preserved

## 11. Revenue / monetization truth

- Payment tracker only when role allows (`showPaymentTracker`)
- Entitlements/promo show — when `dataUnavailable`
- No Stripe activation claims added

## 12. Risks / deferred work

- Advertising leads still land on generic inbox (filter view deferred)
- Activity log may show empty/unavailable — honest states preserved
- Full review/expiring lists truncated in preview — full queue via CTA

## 13. TRUE/FALSE audit

| Flag | Value |
|------|-------|
| Command header | TRUE |
| Priority strip | TRUE |
| Section architecture | TRUE |
| Anchors | TRUE |
| CTA matrix | TRUE |
| Review truth | TRUE |
| No fake counts | TRUE |
| Mobile-first | TRUE |
| No schema/public/stripe/category logic changes | TRUE |
