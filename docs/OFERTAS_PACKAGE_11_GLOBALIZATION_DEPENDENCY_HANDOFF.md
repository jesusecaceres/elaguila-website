# Package 11 Globalization Dependency Handoff

## Source Workstream

- Source workstream: Ofertas Locales / Cupones.
- Worktree: `C:\projects\elaguila-website-ofertas`.
- Branch: `integration/ofertas-locales-2026-07`.
- Committed base SHA: `1a8ff774502d8ac7fcc639c0bbb4c0e2aee32ca5`.
- Package 11-R status: local Ofertas certification reconciliation in progress; shared/global diffs removed from the Ofertas workstream after capture.

## Mandatory Ownership Rule

Ofertas discovered the dependencies below during local Package 11 certification. Under the Package 11-R directive, Ofertas does not retain edits to global/shared files. These issues are documented for Globalization ownership and future correction. This document does not claim that Globalization has applied any fix.

## Dependency 1 — Revenue Audit Log Typing

- Exact file: `app/lib/listingPlans/revenueAuditLog.ts`.
- Exact symbol/type: `RevenueAuditAction`.
- Exact error observed during Package 11 TypeScript certification: `app/lib/listingPlans/revenueFulfillment.ts(197,5): error TS2322: Type '"ofertas_locales_entitlement_fulfilled_after_payment"' is not assignable to type 'RevenueAuditAction'.`
- Required behavior: the global Revenue OS audit action type must include or otherwise support the Ofertas entitlement-fulfilled audit event emitted by the existing Revenue OS fulfillment path.
- Proposed narrow correction: add the existing action string `ofertas_locales_entitlement_fulfilled_after_payment` to the centrally owned `RevenueAuditAction` contract, or update the global Revenue OS action taxonomy with an equivalent approved action and migrate the emitting call accordingly.
- Why Globalization owns it: `app/lib/listingPlans/**` is shared Revenue OS/global infrastructure, not Ofertas-local runtime.
- Affected Ofertas path: Ofertas payment fulfillment path in `app/lib/listingPlans/revenueFulfillment.ts` calls `writeRevenueAuditLog` after `markOfertaLocalEntitlementFulfilled`.
- Acceptance test: repository typecheck no longer reports the `RevenueAuditAction` assignability error; Revenue OS webhook/fulfillment audits still pass; Ofertas entitlement fulfillment audit logging is preserved.
- No claim: Globalization has not applied this correction in this workstream.

## Dependency 2 — Dashboard Analytics Summary Fallback

- Exact file: `app/api/dashboard/analytics/summary/route.ts`.
- Exact symbol/type: `dashboardTotalsToLegacyOwnerTotals` fallback argument.
- Exact error observed during Package 11 TypeScript certification: `app/api/dashboard/analytics/summary/route.ts(52,57): error TS2345: Argument of type '{ views: number; ... cta_clicks_other: number; }' is not assignable to parameter of type 'DashboardAnalyticsTotals'.`
- Missing fields involved: `flyer_page_views`, `product_impressions`, `product_opens`, `product_searches`, `product_search_result_clicks`, `shopping_list_adds`, `flyer_viewer_opens`, and `offer_hub_opens`.
- Relationship to `ZERO_DASHBOARD_ANALYTICS_TOTALS`: the shared zero-total constant already carries the complete `DashboardAnalyticsTotals` shape and should be the source of truth for missing-configuration dashboard fallbacks.
- Required behavior: the global dashboard summary missing-Supabase fallback should remain truthful zero data while satisfying the expanded analytics totals contract.
- Proposed narrow correction: replace the hand-written partial totals object with a complete shared zero-total object or update the fallback literal with every required metric.
- Why Globalization owns it: `/api/dashboard/**` is global dashboard/analytics infrastructure, not Ofertas-local runtime.
- Affected Ofertas path: Package 10 expanded canonical analytics metrics used by Ofertas public shopper interactions.
- Acceptance test: repository typecheck no longer reports the `DashboardAnalyticsTotals` missing-fields error; dashboard missing-config fallback still returns honest zero/analytics-unavailable data; Ofertas product/flyer analytics fields remain present.
- No claim: Globalization has not applied this correction in this workstream.

## Dependency 3 — Owner Engagement Fallback

- Exact file: `app/api/dashboard/owner-engagement/route.ts`.
- Exact symbol/type: `dashboardTotalsToLegacyOwnerTotals` fallback argument.
- Exact error observed during Package 11 TypeScript certification: `app/api/dashboard/owner-engagement/route.ts(43,52): error TS2345: Argument of type '{ views: number; ... cta_clicks_other: number; }' is not assignable to parameter of type 'DashboardAnalyticsTotals'.`
- Missing fields involved: `flyer_page_views`, `product_impressions`, `product_opens`, `product_searches`, `product_search_result_clicks`, `shopping_list_adds`, `flyer_viewer_opens`, and `offer_hub_opens`.
- Relationship to `ZERO_DASHBOARD_ANALYTICS_TOTALS`: the same shared zero-total constant should be used or mirrored to prevent stale fallback shapes.
- Required behavior: owner engagement missing-admin fallback should remain truthful zero data while satisfying the expanded analytics totals contract.
- Proposed narrow correction: replace the partial fallback object with a complete shared zero-total object or update the fallback literal with every required metric.
- Why Globalization owns it: `/api/dashboard/**` is global dashboard/analytics infrastructure, not Ofertas-local runtime.
- Affected Ofertas path: Ofertas owner/public analytics metrics depend on the global dashboard totals contract being complete.
- Acceptance test: repository typecheck no longer reports the `DashboardAnalyticsTotals` missing-fields error; missing-admin fallback remains honest; owner engagement rollups do not fake Ofertas metrics.
- No claim: Globalization has not applied this correction in this workstream.

## Build Impact

- Ofertas-local compile errors were repaired in Ofertas-owned files.
- Full repository typecheck remains blocked by unrelated Autos/Community test typings and the restored Globalization-owned compile issues documented above.
- Production build compiled during Package 11-R but failed during internal type validity on the restored Globalization-owned dashboard analytics fallback before static route generation.
- Earlier Package 11 evidence showed a build with the temporary shared fixes compiled and completed internal type validity before failing on global `/dashboard` prerender because local Supabase public environment names were absent.
- No environment value was fabricated.
- No global route was modified.

## Required Globalization Action

- `app/lib/listingPlans/revenueAuditLog.ts`: approve and add/support the Ofertas Revenue OS audit action.
- `app/api/dashboard/analytics/summary/route.ts`: make the missing-configuration fallback conform to the full `DashboardAnalyticsTotals` contract.
- `app/api/dashboard/owner-engagement/route.ts`: make the missing-admin fallback conform to the full `DashboardAnalyticsTotals` contract.

These are narrow shared-infrastructure corrections, not requests for dashboard, analytics, Revenue OS, or release architecture refactors.

## Verification Required in Globalization

- Repository typecheck.
- Changed-file lint.
- Production build with a properly configured non-Production environment.
- Dashboard missing-data fallback.
- Revenue audit typing.
- No regression to Ofertas analytics/commercial events.

## Safety

- No Production.
- No main.
- No Vercel modification.
- No Supabase key action.
- No secret read.
- No migration.
