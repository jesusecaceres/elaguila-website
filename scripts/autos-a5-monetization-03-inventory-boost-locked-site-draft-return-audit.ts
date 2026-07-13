/**
 * A5.MONETIZATION-03 — Autos Inventory Boost locked-site draft return audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_MONETIZATION_03_INVENTORY_BOOST_LOCKED_SITE_DRAFT_RETURN_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope only",
  "Autos Privado untouched",
  "Unrelated categories untouched",
  "Checkout route identified",
  "Success page identified",
  "Draft source supported",
  "Dashboard/manage source supported",
  "Safe return_to validation exists",
  "External return_to blocked",
  "Draft source primary CTA returns to application",
  "Draft source does not prioritize dashboard",
  "Dashboard source returns to dashboard/manage",
  "Unknown source safe fallback exists",
  "Language preserved",
  "focus=inventory-pack or equivalent preserved",
  "Draft data not stored in URL",
  "Draft data not stored in Stripe metadata",
  "Payment success keeps draft recoverable",
  "Paid boost unlocks 20 on return",
  "Failed/cancelled boost does not unlock 20",
  "Base package not charged again",
  "Only $129 boost charged",
  "No fake production activation",
  "Webhook activation remains source of truth",
  "Locked-site draft flow safe",
  "No Supabase migration touched",
  "No global Stripe rewrite",
  "No dashboard redesign",
  "No admin redesign",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
  "Ready for Chuy QA",
];

const DRAFT_CTA = ["Return to application", "Regresar a la solicitud"];
const DASHBOARD_CTA = ["Manage inventory", "Administrar inventario"];

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
  assert.ok(fs.existsSync(AUDIT_MD), "A5.MONETIZATION-03 audit markdown must exist");
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

  const contract = read("app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts");
  const resultView = read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx");
  const checkoutRoute = read("app/api/clasificados/autos/inventory-pack/checkout/route.ts");
  const returnPathLib = read("app/lib/listingPlans/revenueOsReturnPath.ts");

  assert.ok(contract.includes("boost_source"), "boost_source contract required");
  assert.ok(contract.includes('"draft"'), "draft source contract required");
  assert.ok(contract.includes("classifyAutosInventoryBoostReturnSource"), "source classifier required");
  assert.ok(contract.includes("resolveAutosDealerInventoryPackPaymentSuccessPresentation"), "success presentation resolver required");

  for (const label of DRAFT_CTA) {
    assert.ok(contract.includes(label), `Draft CTA copy required: ${label}`);
  }
  for (const label of DASHBOARD_CTA) {
    assert.ok(
      contract.includes(label) || read("app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts").includes(label),
      `Dashboard CTA copy must remain: ${label}`,
    );
  }

  assert.ok(returnPathLib.includes("isUnsafeExternalReturnPath"), "safe return_to validation required");
  assert.ok(returnPathLib.includes("https?:\\/\\/"), "external URL blocking required");

  assert.ok(
    !resultView.includes("resolveAutosDealerInventoryPackSuccessPrimaryCta"),
    "Old dashboard-only autos success CTA must not be used directly",
  );
  assert.ok(resultView.includes("resolveAutosDealerInventoryPackPaymentSuccessPresentation"), "New autos presentation resolver required");
  assert.ok(resultView.includes("boostSource"), "boostSource must flow into success view");

  assert.ok(checkoutRoute.includes("boost_source=draft") || checkoutRoute.includes('appendAutosInventoryBoostSuccessQuery'), "Draft boost_source on success URL required");
  assert.ok(checkoutRoute.includes("ensureAutosNegociosDraftBoostReturnFocus"), "focus=inventory-pack preservation required");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("autosDealerInventoryBoostReturnContract"), "Privado must not use MONETIZATION-03 contract");

  const changed = changedFiles();
  const lockedPrefixes = [
    "app/(site)/publicar/autos/privado/",
    "app/(site)/clasificados/bienes-raices/",
    "app/(site)/clasificados/rentas/",
    "app/(site)/clasificados/restaurantes/",
    "app/(site)/clasificados/servicios/",
    "supabase/migrations/",
    "app/api/stripe/",
  ];
  for (const f of changed) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of lockedPrefixes) {
      assert.ok(!norm.startsWith(prefix), `Locked path modified: ${norm}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-monetization-03-inventory-boost-locked-site-draft-return-audit"),
    "package.json verifier script required",
  );

  console.log(`A5.MONETIZATION-03 audit PASS (${recommendation})`);
}

run();
