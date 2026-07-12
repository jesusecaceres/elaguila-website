#!/usr/bin/env node
/** SVC-LAUNCH-INTELLIGENCE-1 — canonical analytics truth */
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (c, m) => { if (!c) throw new Error(m); };

const ops = read("app/(site)/clasificados/servicios/lib/serviciosOpsTablesServer.ts");
const mirror = read("app/(site)/clasificados/servicios/lib/serviciosListingAnalyticsMirror.ts");
const cta = read("app/(site)/servicios/lib/serviciosCtaIntents.ts");
const dash = read("app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer.ts");
const admin = read("app/admin/(dashboard)/workspace/clasificados/servicios/_lib/serviciosAdminCanonicalAnalytics.ts");
const analyticsApi = read("app/api/clasificados/servicios/analytics/route.ts");

assert(ops.includes("mirrorServiciosOpsEventToListingAnalytics"), "ops: mirror wired");
assert(mirror.includes("listing_analytics"), "mirror: canonical target");
assert(mirror.includes("clientListingAnalytics"), "mirror: duplicate guard");
assert(mirror.includes("cta_quote_sms_click"), "mirror: quote sms mapped");

assert(cta.includes("clientListingAnalytics: true"), "cta: duplicate guard flag");
assert(cta.includes("recordServiciosGlobalAnalyticsEvent"), "cta: global writer");

assert(dash.includes('from("listing_analytics")'), "dashboard: canonical reader");
assert(admin.includes('from("listing_analytics")'), "admin: canonical reader");
assert(!admin.includes("servicios_analytics_events"), "admin: no dual-table sum");

assert(analyticsApi.includes("cta_quote_sms_click"), "api: quote sms allowed");

console.log("verify-servicios-analytics-truth: PASS");
