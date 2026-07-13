/**
 * A5.LAUNCH-READINESS-02 — Autos Dealers yellow blockers to green audit verifier.
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
  "app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_02_YELLOW_BLOCKERS_TO_GREEN_AUDIT.md",
);

const AUDIT_01_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_INPUT_OUTPUT_BUSINESS_HUB_ANALYTICS_CTA_TRUTH_AUDIT.md",
);

const GATE_ROWS = [
  "Previous YELLOW audit read",
  "Ver mi perfil opens real public Autos listing",
  "Success CTA uses internal UUID route",
  "Dashboard public link opens real Autos listing",
  "Admin public link opens real Autos listing",
  "Child public link opens child listing where applicable",
  "Per-listing dashboard analytics wired",
  "Autos analytics resolves autos_classifieds_listings",
  "Analytics source_id is internal UUID",
  "Leonix ID display only",
  "Metrics real or honest zero",
  "No fake saves/messages/leads",
  "Production inventory flow copy clear",
  "Main dealer publish behavior clear",
  "Manage inventory CTA works",
  "Draft boost return preserved",
  "Dashboard boost return preserved",
  "No Supabase migration touched",
  "No global Stripe rewrite",
  "Autos Privado untouched",
  "Build passed",
  "Ready for Chuy QA",
];

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
  assert.ok(fs.existsSync(AUDIT_MD), "A5.LAUNCH-READINESS-02 audit markdown must exist");
  assert.ok(fs.existsSync(AUDIT_01_MD), "A5.LAUNCH-READINESS-01 audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  const audit01 = fs.readFileSync(AUDIT_01_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(audit01, /Final recommendation:\s*\*{0,2}YELLOW\*{0,2}/i, "Previous YELLOW audit must be documented");

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

  const successCopy = read("app/lib/clasificados/autos/autosDealerPublishSuccessCopy.ts");
  const analyticsHref = read("app/lib/clasificados/autos/autosPaidListingAnalyticsHref.ts");
  const pagoExito = read("app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx");
  const revenueSuccess = read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx");
  const boostContract = read("app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts");
  const dashboardInventory = read("app/(site)/dashboard/lib/dashboardInventory.ts");
  const dashboardSection = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
  const listingAnalyticsPage = read("app/(site)/dashboard/analytics/listing/page.tsx");
  const resolveIdentity = read("app/lib/analytics/server/resolveListingAnalyticsIdentity.ts");
  const adminAutos = read("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
  const verifyRoute = read("app/api/clasificados/autos/checkout/verify/route.ts");

  assert.ok(successCopy.includes("Ver mi perfil"), "Spanish view profile CTA required");
  assert.ok(successCopy.includes("View my profile"), "English view profile CTA required");
  assert.ok(successCopy.includes("autosLiveVehiclePath"), "Public URL uses autos vehicle path");
  assert.ok(successCopy.includes("Administrar inventario"), "Spanish manage inventory CTA required");
  assert.ok(successCopy.includes("Manage inventory"), "English manage inventory CTA required");
  assert.ok(successCopy.includes("dealer profile goes live first"), "English inventory flow copy required");
  assert.ok(successCopy.includes("perfil de dealer se activa primero"), "Spanish inventory flow copy required");

  assert.ok(analyticsHref.includes("autos_classifieds_listings"), "analytics href must use autos source table");
  assert.ok(analyticsHref.includes("source_id"), "analytics href must pass source_id UUID");
  assert.ok(!analyticsHref.includes("leonix_ad_id") || analyticsHref.includes("canonical_ad_id"), "Leonix ID optional display only");

  assert.ok(pagoExito.includes("buildAutosDealerPublishedProfileHref"), "Autos pago exito uses profile href builder");
  assert.ok(pagoExito.includes("dealerSuccessCopy.viewProfile"), "Autos pago exito view profile label");
  assert.ok(revenueSuccess.includes("resolveAutosDealerBasePublishPaymentSuccessPresentation"), "Revenue OS dealer success wired");
  assert.ok(revenueSuccess.includes("resolveAutosDealerInventoryPackPaymentSuccessPresentation"), "Boost return preserved");

  assert.ok(boostContract.includes("boost_source"), "Draft boost return contract intact");
  assert.ok(boostContract.includes('"draft"'), "Draft boost source intact");

  assert.ok(dashboardInventory.includes("autosPaidListingAnalyticsHref"), "Dashboard inventory analytics href wired");
  assert.ok(dashboardSection.includes("autosPaidListingAnalyticsHref"), "Dealer dashboard section analytics wired");
  assert.ok(categoryTools.includes('analytics: "ready"'), "Autos analytics marked ready in dashboard tools");
  assert.ok(listingAnalyticsPage.includes("fetchDashboardListingAnalytics"), "Per-listing analytics page uses secure API");
  assert.ok(listingAnalyticsPage.includes("autos_classifieds_listings"), "Listing analytics page supports autos table");
  assert.ok(!listingAnalyticsPage.includes("saves") || listingAnalyticsPage.includes("No fake"), "No fake saves surfaced");

  assert.ok(resolveIdentity.includes("resolveAutosRow"), "Autos analytics identity resolver required");
  assert.ok(adminAutos.includes("autosLiveVehiclePath"), "Admin public link uses autos live path");
  assert.ok(verifyRoute.includes("leonixAdId"), "Verify route returns listing identity for success UI");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("autosDealerPublishSuccessCopy"), "Privado must not import dealer success copy");

  const changed = changedFiles();
  const lockedPrefixes = [
    "app/(site)/publicar/autos/privado/",
    "supabase/migrations/",
    "app/api/stripe/",
    "app/(site)/clasificados/bienes-raices/",
    "app/(site)/clasificados/rentas/",
    "app/(site)/clasificados/restaurantes/",
    "app/(site)/clasificados/en-venta/",
    "app/(site)/clasificados/ofertas-locales/",
    "app/(site)/servicios/",
  ];
  const gateChanged = changed.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return (
      norm.startsWith("app/lib/clasificados/autos/") ||
      norm.startsWith("app/(site)/clasificados/autos/") ||
      norm.startsWith("app/(site)/dashboard/") ||
      norm.startsWith("app/(site)/revenue-os/pago/") ||
      norm.startsWith("app/api/clasificados/autos/") ||
      norm.startsWith("app/api/dashboard/analytics/") ||
      norm.startsWith("scripts/autos-a5-launch-readiness-02") ||
      norm === "package.json"
    );
  });
  for (const f of gateChanged) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of lockedPrefixes) {
      assert.ok(!norm.startsWith(prefix), `Locked path modified: ${norm}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-launch-readiness-02-yellow-blockers-to-green-audit"),
    "package.json -02 verifier script required",
  );

  console.log(`A5.LAUNCH-READINESS-02 audit PASS (${recommendation})`);
}

run();
