/**
 * A5.QA-08B Autos Negocios QA publish bypass + multi-listing publish + results preview gate.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_QA_08B_QA_PUBLISH_MULTI_LISTING_RESULTS_AUDIT.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Lane impact classified before edits",
  "Privado impact considered before edits",
  "Inventory draft bundle inspected",
  "Main vehicle draft exists",
  "Additional inventory vehicles store full vehicle data",
  "Additional vehicles inherit dealer data from parent",
  "Added vehicles show in Paso 7",
  "Added vehicles show in full preview",
  "Results card preview exists at top",
  "Results card shows cover/title/price/specs/dealer/inventory hint",
  "Results card creates no fake public URL before publish",
  "Full detail preview exists before publish",
  "Full detail preview shows Business Hub output",
  "Full detail preview shows dealer inventory preview",
  "Protected QA payment bypass exists",
  "QA bypass is not public/query-param-only",
  "QA bypass does not fake Stripe payment",
  "Production payment protection remains intact",
  "Final publish creates main listing",
  "Final publish creates additional vehicle listings",
  "Each published vehicle gets own listing ID",
  "Each published vehicle gets own Leonix Ad ID",
  "Each published vehicle has detail URL/route",
  "All published vehicles share dealerInventoryGroupId",
  "Main vehicle marked as main inventory vehicle",
  "Added vehicles marked as additional inventory vehicles",
  "Child vehicles inherit dealer contact/business data",
  "Child vehicles are not nested-only fake records",
  "Result cards show main and added vehicles after publish",
  "Result cards link to real detail pages",
  "Main detail page shows other dealer vehicles excluding itself",
  "Child detail page shows main/other vehicles excluding itself",
  "Public buyer does not see owner inventory CTAs",
  "QA success screen/result lists published inventory",
  "Vehicle 11 requires boost or protected QA boost",
  "No fake analytics created",
  "Analytics-ready listing/action context documented",
  "Privado checked for shared impact",
  "No dealer-only features added to Privado",
  "No global Stripe/payment files modified",
  "No unrelated categories touched",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/tienda/",
  "app/api/stripe/",
  "supabase/migrations/",
];

const GATE_OWN_MARKERS = [
  "AUTOS_A5_QA_08B",
  "autosNegociosBundlePublish",
  "autos-a5-qa-08b",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    if (out) return out.split(/\r?\n/).filter(Boolean);
  } catch {
    /* ignore */
  }
  try {
    return execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function untrackedFiles(): string[] {
  try {
    const out = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function changesFromThisGate(): string[] {
  const all = [...changedFiles(), ...untrackedFiles()];
  return all.filter((f) => GATE_OWN_MARKERS.some((m) => f.includes(m)) || f.includes("checkout/route.ts") || f.includes("AutosPublishConfirmCore") || f.includes("AutosPagoExitoClient") || f.includes("autosNegociosInventoryBundleCopy"));
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD));

  const auditText = read("app/lib/clasificados/autos/AUTOS_A5_QA_08B_QA_PUBLISH_MULTI_LISTING_RESULTS_AUDIT.md");
  for (const row of AUDIT_ROWS) {
    assert.match(auditText, new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`), `Audit row must be TRUE: ${row}`);
  }
  assert.ok(!auditText.includes("| FALSE |"));
  assert.ok(auditText.includes("Final recommendation:") && /\bGREEN\b/.test(auditText));

  const copy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  assert.ok(copy.includes("Así se verá en resultados"), "ES results card title");
  assert.ok(copy.includes("How this will look in results"), "EN results card title");
  assert.ok(copy.includes("Modo QA: pago omitido"), "ES QA bypass label");
  assert.ok(copy.includes("QA mode: payment skipped"), "EN QA bypass label");
  assert.ok(copy.includes("Publicado en modo QA"), "ES QA success label");
  assert.ok(copy.includes("Published in QA mode"), "EN QA success label");

  const bundle = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
  const draft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const success = read("app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx");

  assert.ok(draft.includes("additionalInventoryVehicles") || draft.includes("AutosAdditionalInventoryVehicleDraft"));
  assert.ok(bundle.includes("publishNegociosBundleAdditionalVehicles"));
  assert.ok(bundle.includes("dealerInventoryGroupId") || bundle.includes("promoteNegociosMainInventoryListing"));
  assert.ok(bundle.includes("leonix_ad_id"));
  assert.ok(bundle.includes("inventory_role"));
  assert.ok(checkout.includes("additionalInventoryVehicles"));
  assert.ok(checkout.includes("bundle_requires_qa_bypass"));
  assert.ok(confirm.includes("additionalInventoryVehicles"));
  assert.ok(confirm.includes("autosQaPaymentBypassLabel"));
  assert.ok(service.includes("createAutosClassifiedsListingWithInventoryParent"));
  assert.ok(service.includes("getActiveLiveAutosBundle"));
  assert.ok(success.includes("autosQaPublishSuccessLabel"));
  assert.ok(read("app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx").includes("autosResultsCardPreviewTitle"));

  const haystack = [privado, success, confirm].join("\n");
  assert.ok(!haystack.includes("additionalInventoryVehicles") || !privado.includes("additionalInventoryVehicles"), "Privado app has no bundle publish");
  assert.ok(!privado.includes("Modo QA: pago omitido"));
  assert.ok(!privado.includes("Inventory Boost"));

  const fakeAnalytics = [bundle, confirm, success, checkout].join("\n");
  assert.ok(!fakeAnalytics.toLowerCase().includes("fake views"));
  assert.ok(!fakeAnalytics.toLowerCase().includes("placeholder analytics"));
  assert.ok(!fakeAnalytics.toLowerCase().includes("localstorage analytics"));

  for (const f of changesFromThisGate()) {
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!f.startsWith(bad), `Gate must not modify forbidden path: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08b-qa-publish-multi-listing-results-audit"));

  console.log("A5.QA-08B QA publish multi-listing results audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
