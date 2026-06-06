/**
 * A5.QA-08C Autos Supabase inventory backing + published inventory output proof gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_QA_08C_SUPABASE_INVENTORY_BACKING_OUTPUT_PROOF_AUDIT.md",
);
const INVENTORY_MIGRATION = path.join(ROOT, "supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql");
const LEONIX_MIGRATION = path.join(ROOT, "supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql");
const BASE_MIGRATION = path.join(ROOT, "supabase/migrations/20260409120000_autos_classifieds_listings.sql");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "git diff reviewed before editing",
  "Autos scope lock respected",
  "Supabase/schema backing inspected",
  "Listing id support exists",
  "Leonix Ad ID support exists",
  "Detail URL/slug support exists",
  "Owner/seller ID support exists",
  "Category/listing type support exists",
  "Dealer inventory group support exists or minimal migration created",
  "Parent listing relationship support exists or minimal migration created",
  "Inventory role main/additional support exists or minimal migration created",
  "Migration, if created, is nullable/backward-compatible",
  "No unsafe schema rewrite performed",
  "Draft-to-publish bundle mapper exists",
  "Main listing payload created from parent draft",
  "Child listing payloads created from added inventory drafts",
  "Child listings inherit dealer data from parent",
  "Final publish creates main listing",
  "Final publish creates child vehicle listings",
  "Every published vehicle has own listing ID",
  "Every published vehicle has own Leonix Ad ID",
  "Every published vehicle has own detail URL/route",
  "All published vehicles share dealerInventoryGroupId",
  "Main listing marked main inventory vehicle",
  "Child listings marked additional inventory vehicle",
  "Publish failure handling prevents silent partial success",
  "Protected QA bypass exists or blocker documented",
  "QA bypass is not public/query-param-only",
  "QA bypass does not fake Stripe payment",
  "Production payment protection remains intact",
  "Results read real published listings",
  "Main and child listings appear in results after publish",
  "Result cards link to real detail pages",
  "Detail pages read real published listings",
  "Main detail shows other dealer vehicles excluding itself",
  "Child detail shows main/other dealer vehicles excluding itself",
  "Public buyer does not see owner inventory CTAs",
  "Success screen/result route lists published inventory",
  "Dashboard/admin backing inspected",
  "No fake dashboard counts added",
  "No fake analytics added",
  "Analytics-ready listing context documented",
  "Privado checked for shared impact",
  "No dealer-only features added to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment files modified",
  "npm run build passed",
];

const PRIVADO_DEALER_ONLY = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Más vehículos de este dealer",
  "additionalInventoryVehicles",
  "AutosNegociosAddInventoryDrawer",
  "AutosDealerFinanceFields",
  "Modo QA: pago omitido",
  "dealerInventoryGroupId",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/tienda/",
  "app/api/stripe/",
];

const FAKE_ANALYTICS_MARKERS = [
  "fake views",
  "placeholder analytics",
  "localstorage analytics",
  "fake metrics",
];

const GATE_OWN_MARKERS = ["AUTOS_A5_QA_08C", "autos-a5-qa-08c"];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
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
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return GATE_OWN_MARKERS.some((m) => norm.includes(m)) || norm === "package.json";
  });
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "QA-08C audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }
  assert.ok(!auditText.includes("| FALSE |"), "No FALSE rows when recommendation is GREEN");
  assert.ok(auditText.includes("Final recommendation:") && /\bGREEN\b/.test(auditText));

  assert.ok(fs.existsSync(INVENTORY_MIGRATION), "Dealer inventory migration must exist");
  assert.ok(fs.existsSync(LEONIX_MIGRATION), "Leonix ad id migration must exist");
  assert.ok(fs.existsSync(BASE_MIGRATION), "Autos classifieds base migration must exist");

  const invMig = fs.readFileSync(INVENTORY_MIGRATION, "utf8");
  assert.ok(invMig.includes("dealer_inventory_group_id"));
  assert.ok(invMig.includes("dealer_inventory_parent_listing_id"));
  assert.ok(invMig.includes("inventory_role"));
  assert.ok(invMig.includes("'main'") && invMig.includes("inventory_vehicle"));

  const leonixMig = fs.readFileSync(LEONIX_MIGRATION, "utf8");
  assert.ok(leonixMig.includes("autos_classifieds_listings"));
  assert.ok(leonixMig.includes("leonix_ad_id"));

  const bundle = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  const inherited = read("app/lib/clasificados/autos/autosInventoryInheritedPreview.ts");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const publicListings = read("app/api/clasificados/autos/public/listings/route.ts");
  const publicDetail = read("app/api/clasificados/autos/public/listings/[id]/route.ts");
  const bypassCfg = read("app/lib/clasificados/autos/autosInternalPublishConfig.ts");
  const testBypass = read("app/lib/clasificados/autos/autosTestPublishBypass.ts");
  const copy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const success = read("app/(site)/clasificados/autos/pago/exito/AutosPagoExitoClient.tsx");
  const draft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");

  assert.ok(bundle.includes("publishNegociosBundleAdditionalVehicles"));
  assert.ok(bundle.includes("dealerInventoryGroupId") || bundle.includes("dealer_inventory_group_id"));
  assert.ok(bundle.includes("inventory_role"));
  assert.ok(bundle.includes("leonix_ad_id"));
  assert.ok(bundle.includes("child_create_failed") || bundle.includes("error:"));

  assert.ok(inherited.includes("mapInheritedDealerPreviewListing"));
  assert.ok(draft.includes("AutosAdditionalInventoryVehicleDraft"));
  assert.ok(
    read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts").includes("additionalInventoryVehicles"),
  );

  assert.ok(service.includes("createAutosClassifiedsListingWithInventoryParent"));
  assert.ok(service.includes("listActiveAutosClassifiedsRows"));
  assert.ok(service.includes("getActiveLiveAutosBundle"));
  assert.ok(service.includes("dealer_inventory_group_id"));
  assert.ok(service.includes("inventory_role"));

  assert.ok(checkout.includes("publishNegociosBundleAdditionalVehicles"));
  assert.ok(checkout.includes("bundle_requires_qa_bypass"));
  assert.ok(checkout.includes("isAutosInternalPublishPaymentBypassEnabled"));
  assert.ok(checkout.includes("isAutosAllowTestPublishBypassEnabled"));
  assert.ok(checkout.includes("VERCEL_ENV") || bypassCfg.includes("production"));

  assert.ok(bypassCfg.includes("VERCEL_ENV") && bypassCfg.includes("production"));
  assert.ok(testBypass.includes("VERCEL_ENV") && testBypass.includes("production"));

  assert.ok(publicListings.includes("listActiveAutosClassifiedsRows"));
  assert.ok(!publicListings.toLowerCase().includes("localstorage"));
  assert.ok(publicDetail.includes("getActiveLiveAutosBundle"));

  assert.ok(
    copy.includes("Modo QA: pago omitido") || copy.includes("QA mode: payment skipped"),
    "QA bypass label copy",
  );
  assert.ok(
    copy.includes("Publicado en modo QA") || copy.includes("Published in QA mode"),
    "QA success label copy",
  );

  assert.ok(negociosCopy.includes("Más vehículos de este dealer"));
  assert.ok(negociosCopy.includes("More vehicles from this dealer"));

  assert.ok(draft.includes("AUTOS_INVENTORY_ANALYTICS_EVENTS"));
  assert.ok(draft.includes("inventory_bundle_publish_started"));
  assert.ok(draft.includes("inventory_bundle_publish_completed"));

  for (const s of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(s), `Privado must not contain: ${s}`);
  }

  const haystack = [bundle, checkout, success, service].join("\n").toLowerCase();
  for (const fake of FAKE_ANALYTICS_MARKERS) {
    assert.ok(!haystack.includes(fake), `Must not contain fake analytics marker: ${fake}`);
  }

  assert.ok(!success.toLowerCase().includes("fake stripe"));
  assert.ok(success.includes("autosQaPublishSuccessLabel") || success.includes("bundleResult"));

  assert.ok(read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx").includes("activeCount"));

  for (const f of changesFromThisGate()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(bad), `Gate must not modify forbidden path: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08c-supabase-inventory-backing-output-proof-audit"));

  console.log("A5.QA-08C Supabase inventory backing output proof audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
