# Owner Command Center — Package 3, Gate 3E Audit

Account Command Center + Business Concierge owner integration.

## Controlling document

`LEONIX_OWNER_COMMAND_CENTER_SINGLE_SOURCE_CONSTRUCTION_BIBLE.md`

```
CONTROLLING BIBLE READ: YES
ACTIVE GATE: PACKAGE 3 — GATE 3E
ACCOUNT COMMAND CENTER + BUSINESS CONCIERGE OWNER INTEGRATION
GLOBAL ACCOUNT COMMAND CENTER REMAINS THE OWNER'S OVERALL DASHBOARD: YES
BUSINESS CONCIERGE REMAINS BUSINESS-SPECIFIC INTELLIGENCE: YES
SECOND BUSINESS CONCIERGE DATABASE/ENGINE ALLOWED: NO
FAKE BUSINESS ANALYSIS ALLOWED: NO
READY TO EXECUTE: YES
```

```
WORKTREE: C:\projects\elaguila-website-owner-command-center
BRANCH:   integration/owner-command-center-globalization-2026-08
HEAD:     7cf69d6c8abc970305e6b384322821134e14700d (unchanged)
```

Do-not-touch systems left untouched: Living Business Book, Health Map, Next Right Move,
DIY Concierge, Advisor, Outcomes, Assistant memory, Promise Keeper, Proposals,
Creative Studio, CRM, analytics writers, Stripe/payment writers, RLS/auth,
`app/admin/**`, Recursos, Ad Branding, Iglesias. No migrations.

Authenticated pixel QA remains deferred to Final QA.

---

## CURRENT /dashboard anatomy (before this gate)

`LeonixDashboardShell` workbench with a mixed home: hero + city, payment-attention
strip, four metric cards, category launcher grid, and quick actions. First paint
waited on the full fetch bundle. Business tools was a teaser hub with profile
completeness and Restaurantes/Servicios entitlement badges.

## TARGET /dashboard anatomy (this gate)

```
PAGE HERO
↓
NEEDS YOUR ATTENTION
↓
ACCOUNT PERFORMANCE
↓
MY LISTINGS / BUSINESSES (preview)
↓
RECENT ACTIVITY
↓
BUSINESS / GROW
```

Implemented as presentational orchestration:

- `OwnerAccountCommandCenter`
- `OwnerNeedsAttention`
- `OwnerAccountPerformance`
- `OwnerManagedEntitiesPreview`
- `OwnerRecentActivity`
- `OwnerBusinessGrowthEntry`

`/dashboard/business-tools` uses `BusinessConciergeOwnerHome` (orchestration only).

## REAL account metrics

| Metric | Source | Notes |
| --- | --- | --- |
| Active listings | `countOwnerActiveListingsAcrossSources` | Real connected sources |
| Drafts | `fetchDashboardNavCounts.drafts` | Real nav count |
| Views | `fetchDashboardAnalyticsSummary.totals.listingViews` | Hidden (not zeroed) when `listingAnalyticsUnavailable` |
| Contact actions | `summary.totals.ctaClicks` | Same unavailable rule |
| Expiring soon | `navCounts.expiringSoon` | Shown when contacts are unavailable; also in derived attention |

No fake revenue, followers, saves, messages, or trend percentages.

## Needs Attention sources

Existing `fetchDerivedDashboardFeed` only. Kinds reused as-is:

`payment_attention`, `expire_visibility`, `expire_listing`, `moderation`,
`inbox`, `draft`, `profile_city`, `low_views`.

No second advisor/notification engine. Honest empty when nothing real is pending.

## Managed-entity preview source

One `fetchOwnerListingsForDashboard` call (Gate 2A session cache
`lx_owner_listings_select_v1`). Slice of 4 rows from the canonical `listings`
library. Copy states specialized category tables are not all included.
CTA: Ver todos mis anuncios → `/dashboard/mis-anuncios`.

## Activity source

No persisted account activity log exists. Section is an honest unsupported
empty. Real alerts remain in Needs Attention; engagement detail remains in
Analytics.

## Business Concierge entry logic

- Global nav: one item, `/dashboard/business-tools` (`Herramientas de negocio` /
  `Business tools`). No Concierge sub-route dump in the sidebar.
- Home grow module: same canonical route. General users are not shown Health Map
  or Next Right Move.

## NON-BUSINESS USER EXPERIENCE

Concierge home shows idea/profile/mailto path. NRM, Health, Action, Understand,
Learn, Progress, Assistant, and Approvals render as unavailable with honest copy.
No fake score.

## IDEA-STAGE EXPERIENCE

No `/dashboard/business-tools/idea-builder` route exists in this workspace.
Copy points to Publish listing + Complete profile. Do not invent a builder.

## BUSINESS OWNER EXPERIENCE

Owner-safe listing-based identity only. Real modules: profile completeness
(field count, not a health score) and per-listing `coupons_offers` entitlement
badges for Restaurantes/Servicios. Intelligence engines are not republished.

## Canonical business identity

**Gap (documented, not invented):** this workspace does not expose
`public.businesses.id` as an owner-facing selector. Commercial identity today is
listing + owner (`owner_user_id` / listing id). Multi-business switching is not
fabricated.

## Business Concierge modules reused

| Module | Owner-safe API in this repo? | Surface |
| --- | --- | --- |
| Identity | Listing + owner only | Honest listing-based copy |
| Next Right Move | No `/proximo-paso` | Unsupported summary |
| Health Map | No `/business-health` | Unsupported; no 0–100 score |
| Action / DIY | No `/concierge` DIY home | Unsupported |
| What Leonix understands | No `/what-we-understand` | Unsupported |
| Learning | No `/aprender` | Unsupported + honest growth copy |
| Approvals / service requests | No owner approval API | Unavailable, not Live |
| Outcomes | No Concierge outcomes API | Unsupported (listing analytics are not ROI) |
| Assistant | No owner-facing assistant | Unsupported |
| Completeness | `computeBusinessCompleteness` | Real field counts |
| Capabilities | listing package entitlements | Real `coupons_offers` badges |

## Owner-safe API/data sources

- Auth session (`getSession` / `getUser`)
- `profiles` (display name, home city, membership, account type)
- `countOwnerActiveListingsAcrossSources` / `countOwnerInventoryListings`
- `fetchDashboardNavCounts`
- `fetchDashboardAnalyticsSummary`
- `fetchDerivedDashboardFeed`
- `fetchOwnerListingsForDashboard`
- `fetchDashboardProfile` + `computeBusinessCompleteness`
- `fetchOwnerRestaurantListings` / `fetchOwnerServiciosListings`
- `fetchDashboardListingPackageEntitlementBadges`

## Staff-only boundaries

No staff notes, internal AI drafts, failed recommendation candidates, Creative
Studio internals, or admin routes are read or rendered.

## Loading / empty / error states

Hero, Needs Attention, Performance, Preview, Activity, Grow, and Concierge home
define loading, empty, error, no-session, no-business, no-recommendation,
no-health, no-approvals, and no-outcomes. Unavailable data uses em dash / copy,
not fake zeros.

## 390 / 768 / 1440

- 390: one dominant Publish CTA (`min-h-[44px]`, full width), stacked cards,
  overflow-x hidden, no KPI wall.
- 768: 2-column attention/preview/module grids.
- 1440: workbench width, 2–4 metric columns. Concierge remains readable cards,
  not a wall of invented engines.

## ES / EN

`accountCommandCenterCopy` and `businessConciergeHubCopy`. Module live/unavailable
labels are bilingual.

## Performance / I/O impact

Auth/hero can paint before metrics, derived feed, and listing preview finish.
Those three run in parallel. Preview reuses the Gate 2A listings select cache.
No new per-card network waterfall. Concierge intelligence is not fetched.

## Deferred owner surfaces

- Authenticated business pixel QA → Final QA
- `/aprender`, idea-builder, proximo-paso, business-health, what-we-understand,
  DIY concierge, owner assistant, `public.businesses.id` selector — not present
  as owner-safe routes/APIs in this workspace
- Persisted account activity log
- Owner approval/service-request inbox
