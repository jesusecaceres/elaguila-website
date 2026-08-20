import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const ownerKeys = read("app/lib/ownerEngagementListingKeys.ts");
const metrics = read("app/lib/analytics/server/dashboardAnalyticsMetrics.ts");
const fetcher = read("app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer.ts");
const ownerRoute = read("app/api/ofertas-locales/owner/[id]/route.ts");
const ownerPage = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const adminHelpers = read("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts");
const adminList = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");

assert.match(ownerKeys, /\.from\("ofertas_locales"\)/);
assert.match(ownerKeys, /\.eq\("owner_id", ownerId\)/);
assert.match(ownerKeys, /leonix_ad_id/);

for (const metric of [
  "product_opens",
  "product_search_result_clicks",
  "shopping_list_adds",
  "website_clicks",
  "directions_clicks",
]) {
  assert.match(metrics, new RegExp(metric), `${metric} missing from aggregation`);
  assert.match(fetcher, new RegExp(metric), `${metric} missing from listing metrics`);
}

assert.match(ownerRoute, /fetchListingDashboardAnalyticsServer/);
assert.match(ownerRoute, /\[row\.id, row\.leonix_ad_id \?\? ""\]/);
assert.match(ownerPage, /analyticsTitle/);
assert.match(ownerPage, /analyticsUnavailable/);
assert.match(ownerPage, /offer\.analytics\?\.views \?\? 0/);
assert.match(ownerPage, /offer\.analytics\?\.lastActivity \|\| "—"/);

assert.match(adminHelpers, /commercialEligibilitySource/);
assert.match(adminHelpers, /assetLifecycleStatus/);
assert.match(adminList, /commercialEligibilitySource/);
assert.match(adminList, /Asset lifecycle/);

assert.doesNotMatch(ownerPage, /Math\.random|fake|mock/i);
assert.doesNotMatch(ownerRoute, /hardcoded|fixture|sample/i);

console.log("PASS ofertas-owner-admin-analytics-audit");
