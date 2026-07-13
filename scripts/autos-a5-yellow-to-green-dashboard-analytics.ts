/**
 * A5.YELLOW-TO-GREEN — Autos Dealers dashboard per-listing analytics drill-down verifier.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_01 = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_ANALYTICS_CTA_TRUTH_AUDIT.md",
);

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(AUDIT_01), "A5 audit markdown must exist");
  const audit01 = fs.readFileSync(AUDIT_01, "utf8");
  assert.match(audit01, /A5\.YELLOW-TO-GREEN FOLLOW-UP/i, "Audit must document yellow-to-green follow-up");
  assert.match(audit01, /Final recommendation:\s*\*{0,2}GREEN\*{0,2}/i, "A5 audit must be GREEN after fix");

  const analyticsHref = read("app/lib/clasificados/autos/autosPaidListingAnalyticsHref.ts");
  const dashboardSection = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  const dashboardInventory = read("app/(site)/dashboard/lib/dashboardInventory.ts");
  const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
  const categories = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts");
  const listingPage = read("app/(site)/dashboard/analytics/listing/page.tsx");
  const resolveIdentity = read("app/lib/analytics/server/resolveListingAnalyticsIdentity.ts");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  assert.ok(analyticsHref.includes("source_table: \"autos_classifieds_listings\""), "source_table required");
  assert.ok(analyticsHref.includes("source_id: listingId"), "source_id must be listing UUID");
  assert.ok(analyticsHref.includes("canonical_ad_id"), "Leonix ID optional display only");

  assert.ok(dashboardSection.includes("Ver analíticas"), "Spanish analytics label required");
  assert.ok(dashboardSection.includes("View analytics"), "English analytics label required");
  assert.ok(dashboardSection.includes("autosPaidListingAnalyticsHref"), "Dealer section uses analytics href helper");
  assert.ok(dashboardSection.includes("listingId: row.id"), "Child row analytics uses row UUID");
  assert.ok(dashboardSection.includes("listingId: parentId"), "Parent group analytics uses parent UUID");

  assert.ok(dashboardInventory.includes("autosPaidListingAnalyticsHref"), "Dashboard inventory items include analytics href");
  assert.ok(categoryTools.includes('analytics: "ready"'), "Autos analytics must not be unproven");
  assert.ok(!categoryTools.match(/autos:\s*\{[^}]*analytics:\s*"unproven"/), "Autos listing analytics must not be unproven");
  assert.ok(categories.includes('"autos"') || categories.includes("'autos'"), "Autos in proven analytics categories");
  assert.ok(categories.includes("autos_paid"), "autos_paid in proven analytics categories");

  assert.ok(listingPage.includes("fetchDashboardListingAnalytics"), "Per-listing analytics page uses secure API");
  assert.ok(listingPage.includes("autos_classifieds_listings"), "Listing analytics page supports autos table");
  assert.ok(!listingPage.match(/saves\s*:/i), "No fake saves metric on listing analytics page");

  assert.ok(resolveIdentity.includes("resolveAutosRow"), "Autos analytics identity resolver required");

  assert.ok(!privadoApp.includes("autosPaidListingAnalyticsHref"), "Privado must not import dealer analytics href");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-yellow-to-green-dashboard-analytics"), "package.json script required");

  console.log("A5.YELLOW-TO-GREEN dashboard analytics: PASS");
}

run();
