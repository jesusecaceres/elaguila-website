# ADMIN-LEADS-STYLE-01 — Launch Leads Leonix Style Audit

## 1. Files inspected

- `app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx`
- `app/admin/_components/leads/AdminLaunchLeadRowActions.tsx`
- `app/admin/_components/leads/AdminLaunchLeadMobileCard.tsx`
- `app/admin/_components/leads/AdminLeadsSubnav.tsx`
- `app/admin/_components/AdminResponsiveTabs.tsx`
- `app/admin/_components/adminTheme.ts`
- `app/admin/_components/AdminDashboardCta.tsx`
- `app/admin/(dashboard)/leads/inbox/page.tsx`
- `app/admin/(dashboard)/leads/layout.tsx`
- `app/admin/(dashboard)/leads/newsletter/page.tsx`
- `app/admin/(dashboard)/leads/media-kit/page.tsx`

## 2. Files changed

- `app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx`
- `app/admin/_components/leads/AdminLaunchLeadRowActions.tsx`
- `app/admin/_components/leads/AdminLaunchLeadMobileCard.tsx`
- `app/admin/_components/leads/AdminLeadsSubnav.tsx`
- `app/admin/_components/AdminResponsiveTabs.tsx`
- `scripts/verify-admin-leads-style.mjs` (new)
- `package.json` (verify script)

## 3. Current UI problems (before)

- Plain utility intro card without command-center hierarchy
- Ops views lacked visible count chips and gold/bronze accent
- Filter row felt detached (no cream card wrapper)
- Export CSV used generic secondary button, not royal-blue inspect/export CTA
- Table header/empty state felt unfinished
- Row actions used ad-hoc sky/violet colors instead of Leonix semantic CTAs
- Mobile cards lacked gold border accent and action separation

## 4. New organization

1. **Command intro card** — title, subtitle, ops chip row (counts from loaded data + server totals), promo callout
2. **Workspace tabs** — rectangular Leonix tabs (ops views + newsletter link)
3. **Filter/search card** — search, status, launch updates, export + loaded count
4. **Results** — polished desktop table + mobile cards
5. **Empty state** — intentional panel with truthful copy + “Try All Leads or clear search.”

## 5. Desktop result

- Gold/bronze table header border
- Zebra rows preserved
- Semantic rectangular action grid in Actions column
- Royal blue Export CSV
- Empty state in muted cream card inside table

## 6. Mobile result

- Horizontal-scroll rectangular tabs (layout subnav + inbox ops tabs)
- Stacked filter card, full-width export
- Mobile cards with gold border, bordered action section
- `overflow-x-hidden` on list container

## 7. CTA color mapping

| Action | Token | Color |
|--------|-------|-------|
| View | `adminDashboardCtaView` | Royal blue |
| Reply (mailto) | `adminDashboardCtaPrimary` | Burgundy |
| Copy reply / Email | `adminDashboardCtaNeutral` | Cream/ivory |
| Archive / Restore | `adminDashboardCtaActive` | Deep green |
| Delete | `adminDashboardCtaDanger` | Red |
| Export CSV | `adminDashboardCtaView` | Royal blue |
| Active tab/chip | Gold/bronze border `#C9B46A` | Gold/bronze |
| Needs-reply status badges | Existing orange/amber badge classes | Orange |

## 8. Behavior preserved

- Tab navigation (layout subnav + inbox ops views)
- All Leads, Needs Reply, Promo, Advertising, Media Kit, Archived views
- Newsletter Subscribers tab/link
- Search, status filter, launch updates filter
- Export CSV (`/api/admin/leads/inbox/export`)
- View, Reply/mailto, Copy reply, Email, Phone
- Archive, Restore, Delete with confirmations
- Empty states (truthful, no fake data)
- No server email send; mailto/copy only
- No query/status/lifecycle logic changes

## 9. Risks / deferred work

- Ops chip counts for sub-views (needs reply, promo, etc.) reflect **loaded inbox batch**, not full DB totals (except All = `activeTotal`, Archived = `archivedTotal`)
- Newsletter and Media kit inbox clients share row actions polish but were not fully reorganized in this gate (layout subnav + shared actions only)
- Detail drawers unchanged (already functional)

## 10. TRUE/FALSE table

| Flag | Value |
|------|-------|
| ADMIN_LEADS_REPO_INSPECTED_FIRST | true |
| ADMIN_LEADS_STYLE_COMPONENT_FOUND | true |
| ADMIN_LEADS_TABS_PRESERVED | true |
| ADMIN_LEADS_SEARCH_FILTERS_PRESERVED | true |
| ADMIN_LEADS_EXPORT_CSV_PRESERVED | true |
| ADMIN_LEADS_ACTIONS_PRESERVED | true |
| ADMIN_LEADS_EMPTY_STATE_TRUTHFUL | true |
| ADMIN_LEADS_LEONIX_STYLE | true |
| ADMIN_LEADS_SEMANTIC_COLOR_MAPPING | true |
| ADMIN_LEADS_MOBILE_SAFE | true |
| ADMIN_LEADS_NO_FAKE_COUNTS | true |
| ADMIN_LEADS_NO_PUBLIC_PAGE_CHANGES | true |
| ADMIN_LEADS_NO_SCHEMA_CHANGES | true |
| ADMIN_LEADS_NO_STRIPE_PAYMENT_CHANGES | true |
| ADMIN_LEADS_NO_QUERY_STATUS_BEHAVIOR_CHANGES | true |
