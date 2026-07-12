# SVC-LAUNCH-INTELLIGENCE-1 — Foundation Audit 01

**Classification:** BATTLEFIELD ARCHITECTURE BUILD  
**Date:** 2026-07-12  
**Scope:** Servicios discovery, placement, analytics, dashboard, admin — audit-only baseline before wiring.

## Identity contract (canonical)

| Field | Source | Used by |
|-------|--------|---------|
| Public source UUID | `servicios_public_listings.id` | Global analytics `source_id`, Save extras |
| Slug | `servicios_public_listings.slug` | Public URL, ops analytics, leads |
| Leonix Ad ID | `servicios_public_listings.leonix_ad_id` | Engagement key preferred, footer |
| Engagement listing key | `serviciosEngagementListingKey(row)` → ad id → uuid → slug | `user_liked_listings.listing_id` |
| Owner user ID | `servicios_public_listings.owner_user_id` | Analytics owner scope, leads |
| Category | `"servicios"` | All analytics / entitlements |
| Pipeline | `internal_group` + template routing | professional vs trades presentation |

**Monetization truth:** `listing_package_entitlements` + Revenue OS packages (`servicios_base_monthly`, `servicios_offers_addon`). **Not** `membership_tier` / account plans.

---

## Feature matrix

| Feature | Public writer | Storage | Identity key | Results | Detail | Dashboard | Admin | Monetization | Status | Blocker | Action | Target file(s) |
|---------|---------------|---------|--------------|---------|--------|-----------|-------|--------------|--------|---------|--------|----------------|
| Landing hero/search | ServiciosLandingPage | — | — | — | — | — | — | — | REAL | — | Preserve | landing/ServiciosLandingPage.tsx |
| Landing shortcuts | LeonixCategoryShortcutSection | — | URL params | Filters | — | — | — | — | REAL | — | Verified map | serviciosResultsFilter.ts |
| Results pipeline | resultados/page.tsx | servicios_public_listings | slug | REAL | — | — | — | overlay | REAL | 500-row cap | Document | serviciosPublicListingsServer.ts |
| Entitlement overlay | overlayActiveEntitlementsForServiciosResults | listing_package_entitlements | row id | REAL | — | — | Admin panel | entitlement | REAL | — | Preserve | serviciosEntitlementOverlay.ts |
| Visibility ranking | resolveServiciosListingRank | — | package tier | REAL | — | — | — | entitlement | **PARTIAL→FIXED** | tier not read by rank helper | Wire entitlement-first rank | serviciosVisibilityRanking.ts |
| Destacados module | getServiciosDestacadosRows | — | premium tier | REAL | — | — | — | entitlement | PARTIAL | Same rank bug | Fixed with rank | serviciosDestacados.ts |
| Public badges | getServiciosPublicMonetizationBadges | — | tier + rank | REAL | — | — | — | entitlement | PARTIAL | Rank/badge drift | Fixed with rank | serviciosDestacados.ts |
| Like/Unlike | LeonixLikeButton | user_liked_listings + listing_analytics | engagement key | — | REAL | REAL | engagement tables | — | REAL | — | Preserve | engagement cluster |
| Share | LeonixShareButton | listing_analytics | engagement key | — | REAL | REAL | engagement | — | REAL | — | Preserve | engagement row |
| CTA clicks | trackServiciosListingCta | ops + listing_analytics | source_id | — | REAL | REAL | partial | — | REAL | ops-only without sourceId | Preserve dual-write | serviciosCtaIntents.ts |
| Lead submit | inquiry/route.ts | servicios_public_leads + ops | slug | — | REAL | MISSING in dashboard | leads table | — | PARTIAL | Not in listing_analytics | Mirror on insert | serviciosOpsTablesServer.ts |
| Profile view | trackServiciosPublicProfileView | ops + global | source_id | — | REAL | REAL | — | — | REAL | — | Preserve | serviciosProfileEngagementAnalytics.ts |
| Result card click | trackServiciosResultCardClick | listing_analytics | source_id | REAL | — | REAL | — | — | REAL | — | Preserve | serviciosCtaIntents.ts |
| Dashboard totals | fetchOwnerDashboardAnalyticsServer | listing_analytics | owner keys | — | — | REAL | — | — | REAL | — | Preserve | dashboardAnalyticsMetrics.ts |
| Admin listing analytics | admin page | listing_analytics | source_id | — | — | — | **PARTIAL→FIXED** | engagement only | Wire canonical reader | serviciosAdminCanonicalAnalytics.ts |
| Offers add-on | entitlement + dashboard | listing_package_entitlements | listing id | — | REAL | REAL | REAL | entitlement | REAL | — | Preserve | dashboard/servicios |

---

## Duplicate-write risks

| Path | Risk | Mitigation |
|------|------|------------|
| CTA with `sourceId` | ops + global same action | `clientListingAnalytics: true` skips mirror duplicate |
| CTA without `sourceId` | ops only | **FIX:** mirror to listing_analytics on ops insert |
| Like via recordLikeEvent | single global write | No duplicate when custom recorder set |
| Lead created | ops only | **FIX:** mirror maps to `lead_created` |

**Rule:** Never sum `listing_analytics` + `servicios_analytics_events` for dashboard totals.

---

## SVC FOUNDATION AUDIT TRUE/FALSE

```
Landing route identified: TRUE
Results canonical route identified: TRUE (/clasificados/servicios/results)
Professional result card identified: TRUE
Trades result card identified: TRUE
Filter contract identified: TRUE
Entitlement overlay identified: TRUE
Ranking adapter identified: TRUE
Destacados eligibility identified: TRUE
All analytics emitters identified: TRUE
All analytics tables identified: TRUE
Dashboard analytics reader identified: TRUE
Admin analytics reader identified: TRUE (fixed in this gate)
Dashboard monetization reader identified: TRUE
Admin monetization reader identified: TRUE
Identity contract documented: TRUE
Duplicate-write risks documented: TRUE
No core Revenue OS reopening needed: TRUE
Safe implementation plan created: TRUE
```
