#!/usr/bin/env node
/** SVC-LAUNCH-INTELLIGENCE-1 — seller dashboard truth */
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (c, m) => { if (!c) throw new Error(m); };

const dash = read("app/(site)/dashboard/servicios/page.tsx");
const engagement = read("app/(site)/dashboard/lib/fetchOwnerEngagementDashboard.ts");

assert(dash.includes("ServiciosListingMetricsPills"), "dashboard: per-listing metrics");
assert(dash.includes("fetchOwnerEngagementDashboard"), "dashboard: engagement API");
assert(dash.includes("serviciosListingEditHref"), "dashboard: edit action");
assert(dash.includes("serviciosListingPreviewHref"), "dashboard: preview action");
assert(!dash.includes("startRevenueCategoryCheckout"), "dashboard: no base recharge in listing view");

assert(engagement.includes("listing_analytics") || engagement.includes("owner-engagement"), "dashboard: canonical engagement path");

console.log("verify-servicios-dashboard-truth: PASS");
