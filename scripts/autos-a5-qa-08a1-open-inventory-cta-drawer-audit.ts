/**
 * A5.QA-08A.1 Autos Negocios open inventory CTAs + drawer shell gate.
 * Run: npm run autos:a5-qa-08a1-open-inventory-cta-drawer-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_QA_08A1_OPEN_INVENTORY_CTA_DRAWER_AUDIT.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "Current publish-first modal behavior inspected",
  "Pre-publish Add Inventory no longer shows publish-first modal",
  "Add vehicle opens drawer/modal inside same application",
  "Drawer does not navigate away",
  "Drawer does not open new tab",
  "Drawer does not clear main draft",
  "Drawer does not reset current step",
  "Drawer does not use Publish CTA",
  "Drawer has Save to inventory CTA",
  "Drawer has Save and add another CTA",
  "Drawer has Cancel CTA",
  "Additional inventory draft state exists or blocker documented",
  "Main vehicle counts as 1 of 10",
  "Add inventory count display exists",
  "Paso 7 inventory bundle preview shell exists",
  "Paso 7 shows main vehicle card",
  "Paso 7 has empty state for additional vehicles",
  "Added vehicle cards show if draft state exists",
  "Results/landing card preview exists at top",
  "Results card shows title/price/specs/dealer/inventory hint where available",
  "Inventory Boost explains future Stripe return to same application",
  "Inventory Boost does not redirect to Stripe in this gate",
  "Inventory Boost does not fake payment",
  "Inventory Boost does not unlock 20 slots",
  "Opening/closing add drawer preserves draft",
  "Opening/closing boost panel preserves draft",
  "Refresh preserves main draft",
  "Refresh preserves added inventory draft if implemented",
  "Child inventory drawer does not publish vehicles",
  "Main final publish remains only real publish CTA",
  "Multi-listing publish deferred and documented",
  "QA payment bypass deferred and documented",
  "No fake analytics created",
  "Future analytics hooks documented",
  "Privado checked for shared impact",
  "No dealer-only inventory fields added to Privado",
  "No global Stripe/payment files modified",
  "No database/schema/migration files modified",
  "No unrelated categories touched",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/clasificados/publicar/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/tienda/",
  "app/api/stripe/",
  "supabase/migrations/",
];

const REQUIRED_COPY = [
  "Agregar vehículo al inventario",
  "Add vehicle to inventory",
  "Guardar en inventario",
  "Save to inventory",
  "Guardar y agregar otro",
  "Save and add another",
  "Inventario incluido en esta solicitud",
  "Inventory included in this application",
  "Así se verá en resultados",
  "How this will look in results",
  "Inventory Boost agrega 10 espacios adicionales",
  "Inventory Boost adds 10 more slots",
];

const PUBLISH_FIRST_COPY = "Publica el anuncio principal primero";

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
    const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);

  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");
  const auditText = read("app/lib/clasificados/autos/AUTOS_A5_QA_08A1_OPEN_INVENTORY_CTA_DRAWER_AUDIT.md");

  for (const row of AUDIT_ROWS) {
    assert.match(auditText, new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`), `Audit row must be TRUE: ${row}`);
  }

  assert.ok(!auditText.includes("| FALSE |"), "Audit must not contain FALSE rows when recommendation is GREEN");
  assert.ok(auditText.includes("Final recommendation:") && /\bGREEN\b/.test(auditText.split("TRUE/FALSE")[0] ?? auditText));

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  const trigger = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryTrigger.tsx");
  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  const results = read("app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx");
  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  const hook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const boostPanel = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  const haystack = [drawer, trigger, bundle, results, read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts")].join("\n");
  for (const snippet of REQUIRED_COPY) {
    assert.ok(haystack.includes(snippet) || boostPanel.includes(snippet), `Missing required copy: ${snippet}`);
  }

  assert.ok(!drawer.includes(PUBLISH_FIRST_COPY), "Drawer must not use publish-first modal copy");
  assert.ok(!trigger.includes("PrePublish"), "Trigger must not reference pre-publish modal");
  assert.ok(!fs.existsSync(path.join(ROOT, "app/(site)/publicar/autos/negocios/components/AutosNegociosPrePublishInventoryDrawer.tsx")));
  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  assert.ok(bundleCopy.includes("Guardar en inventario") && bundleCopy.includes("Save to inventory"));
  assert.ok(drawer.includes("autosAddInventorySaveCta"));
  assert.ok(!drawer.includes("Publicar anuncio") && !drawer.includes("Publish listing"), "Drawer must not use main publish CTA labels");
  assert.ok(drawer.includes("role=\"dialog\""), "Drawer is in-page modal");
  assert.ok(draftStorage.includes("additionalInventoryVehicles"));
  assert.ok(hook.includes("upsertAdditionalInventoryVehicle"));
  assert.ok(app.includes("AutosNegociosInventoryBundlePreview"));
  assert.ok(app.includes("AutosNegociosResultsCardPreview"));
  assert.ok(boostPanel.includes("autosInventoryBoostStripeReturnNote"));

  assert.ok(!privadoApp.includes("Inventario incluido en esta solicitud"));
  assert.ok(!privadoApp.includes("additionalInventoryVehicles"));

  for (const f of changedFiles()) {
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!f.startsWith(bad), `Forbidden path modified: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08a1-open-inventory-cta-drawer-audit"));

  console.log("A5.QA-08A.1 open inventory CTA drawer audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
