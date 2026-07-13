/**
 * A5.LAUNCH-READINESS-01 — Autos Dealers final publish + SQL + analytics + CTA truth audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_ANALYTICS_CTA_TRUTH_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope only",
  "Autos Privado untouched",
  "Unrelated categories untouched",
  "Autos SQL/table contract proven",
  "No missing-column publish blocker",
  "No migration required",
  "Main listing row creation proven",
  "Child row creation proven (approved rule)",
  "Parent/child UUID identity separate",
  "Leonix Ad ID on published rows",
  "Stripe/webhook activation proven",
  "Boost draft return safe",
  "Boost dashboard return preserved",
  "Preview/public/results parity",
  "Public CTAs work or hidden",
  "Like/share truth (UUID source_id)",
  "No fake saves/messages/leads",
  "Admin identity true",
  "Autos has any fake visible actions",
  "Autos has SQL/table/listing blocker",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
  "Ready for Chuy QA",
];

const YELLOW_FALSE_OK = new Set([
  "Child bundle in production Stripe checkout",
]);

/** Rows that must be FALSE when recommendation is GREEN (negative assertions). */
const GREEN_FALSE_OK = new Set([
  "Autos has any fake visible actions",
  "Autos has SQL/table/listing blocker",
  "Child bundle in production Stripe checkout",
]);

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    const tracked = out ? out.split(/\r?\n/).filter(Boolean) : [];
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])];
  } catch {
    return [];
  }
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.LAUNCH-READINESS-01 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /autos_classifieds_listings/, "Audit must document autos source table");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      if (GREEN_FALSE_OK.has(row)) {
        assert.match(line, /\|\s*FALSE\s*\|/i, `GREEN requires FALSE (no blocker): ${row}`);
      } else {
        assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
      }
    }
  }

  for (const row of ["Dashboard per-listing analytics proven", ...YELLOW_FALSE_OK]) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing documented row: ${row}`);
    if (recommendation === "GREEN") {
      if (GREEN_FALSE_OK.has(row)) {
        assert.match(line, /\|\s*FALSE\s*\|/i, `GREEN requires FALSE (known gap): ${row}`);
      } else {
        assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
      }
    }
    if (recommendation === "YELLOW" && YELLOW_FALSE_OK.has(row)) {
      assert.match(line, /\|\s*FALSE\s*\|/i, `YELLOW documents known gap: ${row}`);
    }
  }

  const migration = read("supabase/migrations/20260409120000_autos_classifieds_listings.sql");
  const grouping = read("supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const recordAutos = read("app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics.ts");
  const ctaTracking = read("app/(site)/clasificados/autos/lib/autosCtaTracking.ts");
  const boostContract = read("app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts");
  const publishGuard = read("app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const webhook = read("app/api/clasificados/autos/stripe/webhook/route.ts");
  const dealerPreview = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  const engagementRow = read("app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx");
  const resolveIdentity = read("app/lib/analytics/server/resolveListingAnalyticsIdentity.ts");
  const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
  const dashboardSection = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");

  assert.ok(migration.includes("autos_classifieds_listings"), "Autos source table migration required");
  assert.ok(migration.includes("owner_user_id"), "owner_user_id column required");
  assert.ok(grouping.includes("dealer_inventory_group_id"), "inventory group column required");
  assert.ok(grouping.includes("inventory_vehicle"), "inventory_vehicle role required");

  assert.ok(service.includes('.from("autos_classifieds_listings")'), "service must query autos_classifieds_listings");
  assert.ok(service.includes("owner_user_id"), "service must use owner_user_id");
  assert.ok(!service.includes("owner_id:"), "service must not use owner_id field name");
  assert.ok(service.includes("tryActivateAutosListingAfterPayment"), "activation helper required");

  assert.ok(recordAutos.includes("listing_like"), "listing_like event required");
  assert.ok(recordAutos.includes("listing_share"), "listing_share event required");
  assert.ok(recordAutos.includes("source_id: sourceId"), "analytics source_id must be UUID");
  assert.ok(recordAutos.includes("canonical_ad_id"), "Leonix Ad ID canonical only");

  assert.ok(boostContract.includes("boost_source"), "boost return contract required");
  assert.ok(boostContract.includes('"draft"'), "draft boost source required");
  assert.ok(publishGuard.includes("dealer_inventory_boost_required"), "11-20 boost guard required");
  assert.ok(checkout.includes("bundle_requires_qa_bypass"), "production bundle guard documented");
  assert.ok(webhook.includes("tryActivateAutosListingAfterPayment"), "webhook must activate listings");

  assert.ok(
    dealerPreview.includes("PublishCheckoutCheckpoint") || dealerPreview.includes("startRevenueCategoryCheckout"),
    "dealer preview must expose final checkout checkpoint",
  );

  assert.ok(engagementRow.includes("listingSourceId"), "detail engagement UUID required");
  assert.ok(resolveIdentity.includes("autos_classifieds_listings"), "resolver must know autos table");
  assert.ok(categoryTools.includes('analytics: "ready"'), "Autos dashboard analytics marked ready");
  assert.ok(dashboardSection.includes("Ver analíticas") || dashboardSection.includes("View analytics"), "Dealer analytics drill-down labels");
  assert.ok(dashboardSection.includes("autosPaidListingAnalyticsHref"), "Dealer dashboard section analytics wired");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("autosDealerRevenueCheckout"), "Privado must not import dealer Revenue OS checkout");

  const lockedTouches = changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return (
      norm.startsWith("app/(site)/publicar/autos/privado/") ||
      norm.startsWith("app/(site)/clasificados/bienes-raices/") ||
      norm.startsWith("app/(site)/clasificados/ofertas") ||
      norm.startsWith("supabase/migrations/")
    );
  });
  assert.equal(lockedTouches.length, 0, `Locked paths modified: ${lockedTouches.join(", ")}`);

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-launch-readiness-01-final-publish-sql-analytics-cta-truth-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.LAUNCH-READINESS-01 audit PASS (${recommendation})`);
}

run();
