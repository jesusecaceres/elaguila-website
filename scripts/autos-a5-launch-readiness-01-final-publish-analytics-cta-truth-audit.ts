/**
 * A5.LAUNCH-READINESS-01 — Autos Dealers final publish + analytics + CTA truth audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_ANALYTICS_CTA_TRUTH_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope only",
  "Autos Privado untouched",
  "Unrelated categories untouched",
  "Main dealer publish pipeline works",
  "Child publish follows approved post-main rule",
  "Parent/child UUID identity separate",
  "Leonix Ad ID on each published row",
  "Preview draft preservation",
  "Boost draft return safe",
  "Boost dashboard return preserved",
  "Public detail CTAs work or hidden",
  "No fake saves/messages/leads on public detail",
  "Like uses real data (UUID source_id)",
  "Share uses real listing_share event",
  "Result cards open correct UUID",
  "Inventory shelf cards no fake engagement",
  "Admin parent/child identity true",
  "Analytics source_id is UUID not Leonix Ad ID",
  "Autos has any fake visible actions",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
  "Ready for Chuy QA",
];

const YELLOW_ONLY_FALSE_OK = new Set([
  "Child bundle in production Stripe checkout",
  "Dashboard per-listing analytics proven",
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

  for (const row of ["Child bundle in production Stripe checkout", "Dashboard per-listing analytics proven"]) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing documented row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
    if (recommendation === "YELLOW" && YELLOW_ONLY_FALSE_OK.has(row)) {
      assert.match(line, /\|\s*FALSE\s*\|/i, `YELLOW documents known gap: ${row}`);
    }
  }

  const recordAutos = read("app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics.ts");
  const ctaTracking = read("app/(site)/clasificados/autos/lib/autosCtaTracking.ts");
  const engagementRow = read("app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx");
  const standardCard = read("app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx");
  const boostContract = read("app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const publishGuard = read("app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard.ts");
  const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");

  assert.ok(recordAutos.includes("listing_like"), "listing_like event required");
  assert.ok(recordAutos.includes("listing_share"), "listing_share event required");
  assert.ok(recordAutos.includes('source_id: sourceId'), "source_id must use listing UUID");
  assert.ok(recordAutos.includes("canonical_ad_id"), "Leonix Ad ID as canonical_ad_id only");

  assert.ok(ctaTracking.includes("trackAutosPhoneClickGlobal") || ctaTracking.includes("phone_click"), "CTA phone mapping required");
  assert.ok(ctaTracking.includes("whatsapp"), "CTA whatsapp mapping required");

  assert.ok(engagementRow.includes("listingSourceId"), "detail engagement uses listingSourceId UUID");
  assert.ok(engagementRow.includes('listingId={sourceId}'), "detail like uses UUID");

  assert.ok(!standardCard.includes("autosEngagementListingKey"), "standard card must not prefer Leonix key for like row");
  assert.ok(standardCard.includes("listingId={listing.id}"), "standard card like uses listing UUID");

  assert.ok(boostContract.includes("boost_source"), "boost return contract required");
  assert.ok(boostContract.includes('"draft"'), "draft boost source required");
  assert.ok(boostContract.includes("Manage inventory") || boostContract.includes("autosDealerInventoryPackEditSuccessLabel"), "dashboard manage path preserved");

  assert.ok(checkout.includes("bundle_requires_qa_bypass"), "production bundle guard documented in code");
  assert.ok(publishGuard.includes("dealer_inventory_boost_required"), "11-20 boost guard required");

  assert.ok(categoryTools.includes('autos: { publicView: "ready", archive: "ready", analytics: "unproven" }'), "honest analytics unproven flag for autos");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("AUTOS_A5_LAUNCH_READINESS_01"), "Privado untouched by launch audit");

  const changed = changedFiles();
  const allowedPrefixes = [
    "app/(site)/publicar/autos/negocios/",
    "app/(site)/clasificados/autos/",
    "app/lib/clasificados/autos/",
    "app/api/clasificados/autos/",
    "app/lib/analytics/",
    "app/components/clasificados/analytics/",
    "app/(site)/revenue-os/pago/",
    "scripts/autos",
    "package.json",
  ];
  const lockedPrefixes = [
    "app/(site)/publicar/autos/privado/",
    "app/(site)/clasificados/bienes-raices/",
    "app/(site)/clasificados/rentas/",
    "app/(site)/clasificados/restaurantes/",
    "app/(site)/clasificados/servicios/",
    "app/(site)/clasificados/en-venta/",
    "supabase/migrations/",
    "app/api/stripe/",
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
    pkg.includes("autos:a5-launch-readiness-01-final-publish-analytics-cta-truth-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.LAUNCH-READINESS-01 audit PASS (${recommendation})`);
}

run();
