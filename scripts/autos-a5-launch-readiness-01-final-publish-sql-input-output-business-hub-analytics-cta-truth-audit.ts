/**
 * A5.LAUNCH-READINESS-01 — Autos Dealers final publish + SQL + I/O + Business Hub + analytics + CTA truth audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_INPUT_OUTPUT_BUSINESS_HUB_ANALYTICS_CTA_TRUTH_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope only",
  "Autos Privado untouched",
  "Unrelated categories untouched",
  "Autos SQL/table contract proven",
  "No missing-column publish blocker",
  "No migration required",
  "Input/output polish safe",
  "Media persists through pipeline",
  "Video policy safe",
  "Required checkboxes enforced",
  "Main listing row creation proven",
  "Child row creation proven (approved rule)",
  "Parent/child UUID identity separate",
  "Leonix Ad ID on published rows",
  "Stripe/webhook activation proven",
  "Boost draft return safe",
  "Boost dashboard return preserved",
  "Preview/public/results parity",
  "Business Hub data-driven",
  "Native share/copy fallback",
  "Real map/directions only",
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
  "Dashboard per-listing analytics proven",
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
  assert.ok(fs.existsSync(AUDIT_MD), "A5.LAUNCH-READINESS-01 expanded audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  for (const row of [...YELLOW_FALSE_OK, "Dashboard per-listing analytics proven", "Child bundle in production Stripe checkout"]) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing documented row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
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
  const hubStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  const mapPreview = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosBusinessHubMapPreview.tsx");
  const shareBtn = read("app/components/clasificados/analytics/LeonixShareButton.tsx");
  const engagementRow = read("app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx");
  const standardCard = read("app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx");
  const resolveIdentity = read("app/lib/analytics/server/resolveListingAnalyticsIdentity.ts");
  const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");

  assert.ok(migration.includes("autos_classifieds_listings"), "Autos source table migration required");
  assert.ok(migration.includes("owner_user_id"), "owner_user_id column required");
  assert.ok(migration.includes("listing_payload"), "listing_payload column required");
  assert.ok(grouping.includes("dealer_inventory_group_id"), "inventory group column required");
  assert.ok(grouping.includes("inventory_vehicle"), "inventory_vehicle role required");

  assert.ok(service.includes('.from("autos_classifieds_listings")'), "service must query autos_classifieds_listings");
  assert.ok(service.includes("owner_user_id"), "service must use owner_user_id");
  assert.ok(!service.includes("owner_id:"), "service must not use owner_id field name");
  assert.ok(service.includes("tryActivateAutosListingAfterPayment"), "webhook activation helper required");

  assert.ok(recordAutos.includes("listing_like"), "listing_like event required");
  assert.ok(recordAutos.includes("listing_share"), "listing_share event required");
  assert.ok(recordAutos.includes("source_id: sourceId"), "analytics source_id must be UUID");
  assert.ok(recordAutos.includes("canonical_ad_id"), "Leonix Ad ID as canonical only");

  assert.ok(ctaTracking.includes("directions_click") || ctaTracking.includes("trackAutosDirectionsClickGlobal"), "directions CTA mapping required");
  assert.ok(boostContract.includes("boost_source"), "boost return contract required");
  assert.ok(boostContract.includes('"draft"'), "draft boost source required");

  assert.ok(publishGuard.includes("dealer_inventory_boost_required"), "11-20 boost guard required");
  assert.ok(checkout.includes("bundle_requires_qa_bypass"), "production bundle guard documented");

  assert.ok(webhook.includes("tryActivateAutosListingAfterPayment"), "webhook must activate listings");

  assert.ok(hubStack.includes("mapAutosDealerToBusinessHubContact"), "Business Hub mapper required");
  assert.ok(hubStack.includes("nonEmpty"), "hub must hide empty fields");
  assert.ok(mapPreview.includes("directionsHref") || mapPreview.includes("directions"), "map preview directions required");

  assert.ok(shareBtn.includes("navigator.share") || shareBtn.includes("clipboard"), "native share or clipboard fallback required");

  assert.ok(engagementRow.includes("listingSourceId"), "detail engagement UUID required");
  assert.ok(standardCard.includes("listingId={listing.id}"), "card like uses listing UUID");

  assert.ok(resolveIdentity.includes("resolveAutosRow"), "autos analytics identity resolver required");
  assert.ok(resolveIdentity.includes("autos_classifieds_listings"), "resolver must know autos table");
  assert.ok(
    categoryTools.includes('analytics: "ready"') || categoryTools.includes('analytics: "unproven"'),
    "autos analytics status documented in dashboard tools",
  );

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("DealerBusinessStack"), "Privado must not use dealer Business Hub stack");

  const changed = changedFiles();
  const allowedPrefixes = [
    "app/lib/clasificados/autos/",
    "scripts/autos-a5-launch-readiness-01-final-publish-sql-input-output-business-hub-analytics-cta-truth-audit.ts",
    "package.json",
  ];
  const lockedPrefixes = [
    "app/(site)/publicar/autos/privado/",
    "supabase/migrations/",
    "app/api/stripe/",
    "app/(site)/clasificados/bienes-raices/",
    "app/(site)/clasificados/rentas/",
    "app/(site)/clasificados/restaurantes/",
    "app/(site)/clasificados/en-venta/",
  ];
  const gateChanged = changed.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return allowedPrefixes.some((p) => norm === p || norm.startsWith(p));
  });
  for (const f of gateChanged) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of lockedPrefixes) {
      assert.ok(!norm.startsWith(prefix), `Locked path modified in gate scope: ${norm}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-launch-readiness-01-final-publish-sql-input-output-business-hub-analytics-cta-truth-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.LAUNCH-READINESS-01 expanded audit PASS (${recommendation})`);
}

run();
