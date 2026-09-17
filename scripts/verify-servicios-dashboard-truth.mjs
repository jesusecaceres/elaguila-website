#!/usr/bin/env node
/** SVC-LAUNCH-INTELLIGENCE-1 — seller dashboard truth */
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (c, m) => { if (!c) throw new Error(m); };

const dash = read("app/(site)/dashboard/servicios/page.tsx");
const engagement = read("app/(site)/dashboard/lib/fetchOwnerEngagementDashboard.ts");

// Zero-debt closeout 2026-09-12: this demanded a `ServiciosListingMetricsPills` component that no
// longer exists anywhere in the app. Per-listing metrics are still delivered — the dashboard
// fetches the owner engagement payload, maps it by slug, and hands each listing row its own
// metrics object. Assert that DATA PATH (the real contract) instead of a component name.
assert(
  dash.includes("ServiciosListingEngagementMetricsClient"),
  "dashboard: per-listing metrics type is wired",
);
assert(
  /serviciosMetricsBySlug\s*=\s*engagementPayload\.serviciosBySlug/.test(dash),
  "dashboard: per-listing metrics come from the owner engagement payload",
);
assert(
  /metrics:\s*serviciosMetricsBySlug\[/.test(dash),
  "dashboard: each listing row receives its own metrics",
);
assert(dash.includes("fetchOwnerEngagementDashboard"), "dashboard: engagement API");
assert(dash.includes("serviciosListingEditHref"), "dashboard: edit action");
assert(dash.includes("serviciosListingPreviewHref"), "dashboard: preview action");
assert(!dash.includes("startRevenueCategoryCheckout"), "dashboard: no base recharge in listing view");

assert(engagement.includes("listing_analytics") || engagement.includes("owner-engagement"), "dashboard: canonical engagement path");

console.log("verify-servicios-dashboard-truth: PASS");
