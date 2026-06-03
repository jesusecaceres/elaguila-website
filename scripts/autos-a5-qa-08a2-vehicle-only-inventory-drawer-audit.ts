/**
 * A5.QA-08A.2 Autos Negocios full vehicle-only inventory drawer gate.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_QA_08A2_VEHICLE_ONLY_INVENTORY_DRAWER_AUDIT.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "Existing drawer inspected before editing",
  "Drawer uses vehicle-only Autos application flow",
  "Drawer includes Información principal vehicle section",
  "Drawer includes Especificaciones section",
  "Drawer includes Destacados/equipamiento section",
  "Drawer includes Fotos y medios section",
  "Drawer includes Descripción section",
  "Drawer excludes Negocio/contacto step",
  "Drawer shows inherited business/contact helper",
  "Business/contact/finance/social/review/hour fields are not duplicated in child form",
  "Drawer reuses main Autos options/components where safe",
  "Full additionalInventoryVehicles draft state exists",
  "Child vehicle stores identity/specs/features/media/description",
  "Child vehicle inherits dealer data from parent",
  "Save to inventory saves child draft and closes drawer",
  "Save and add another saves child draft and keeps drawer open",
  "Cancel closes without wiping main draft",
  "Drawer has no Publish CTA",
  "Added child vehicles can be edited",
  "Added child vehicles can be removed",
  "Main vehicle counts as 1 of 10",
  "Added vehicles count toward 10 included",
  "Vehicle 11 triggers/points to Inventory Boost shell",
  "Paso 7 shows main vehicle card",
  "Paso 7 shows added vehicle cards",
  "Paso 7 inventory layout handles 1, 3, and 10 vehicles cleanly",
  "Full preview shows added inventory vehicles",
  "Added vehicles are labeled draft/preview before publish",
  "Results/landing card preview still exists at top",
  "Inherited dealer data mapper/helper exists or documented",
  "Refresh preserves main draft and child vehicles",
  "Preview/back preserves child vehicles",
  "Opening/closing boost preserves child vehicles",
  "Drawer save does not publish child vehicle",
  "Main final publish remains only true publish CTA",
  "Multi-listing final publish deferred to A5.QA-08B or safely supported",
  "No fake child public URL created before publish",
  "No fake Leonix ID created before publish",
  "No fake analytics created",
  "Future analytics hooks documented",
  "Privado checked for shared impact",
  "No dealer-only inventory drawer added to Privado",
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

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD));

  const auditText = read("app/lib/clasificados/autos/AUTOS_A5_QA_08A2_VEHICLE_ONLY_INVENTORY_DRAWER_AUDIT.md");
  for (const row of AUDIT_ROWS) {
    assert.match(auditText, new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`), `Audit row must be TRUE: ${row}`);
  }
  assert.ok(!auditText.includes("| FALSE |"));
  assert.ok(auditText.includes("Final recommendation:") && /\bGREEN\b/.test(auditText.split("TRUE/FALSE")[0] ?? auditText));

  const form = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");
  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  const draftLib = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  const mapper = read("app/lib/clasificados/autos/autosInventoryInheritedPreview.ts");
  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  const previewSection = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx");
  const copy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const hook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");

  assert.ok(copy.includes("Agregar vehículo al inventario"));
  assert.ok(copy.includes("Add vehicle to inventory"));
  assert.ok(copy.includes("Guardar en inventario"));
  assert.ok(copy.includes("Save to inventory"));
  assert.ok(copy.includes("Guardar y agregar otro"));
  assert.ok(copy.includes("Save and add another"));
  assert.ok(copy.includes("La información del negocio, contacto"));
  const haystack = [form, copy, drawer].join("\n");
  assert.ok(haystack.includes("Especificaciones"));
  assert.ok(haystack.includes("Destacados y equipamiento"));
  assert.ok(haystack.includes("Fotos y medios"));
  assert.ok(haystack.includes("Descripción"));
  assert.ok(haystack.includes("Información principal del vehículo"));
  assert.ok(form.includes("AutosNegociosMediaManager"));
  assert.ok(form.includes("AutosVehicleIdentityFields"));
  assert.ok(!form.includes("dealerName"));
  assert.ok(!form.includes("financeContactName"));
  assert.ok(!drawer.includes("Publicar anuncio"));
  assert.ok(draftLib.includes("mediaImages"));
  assert.ok(draftLib.includes("inventoryRole"));
  assert.ok(mapper.includes("mapInheritedDealerPreviewListing"));
  assert.ok(hook.includes("upsertAdditionalInventoryVehicle"));
  assert.ok(bundle.includes("autosInventoryBundleEdit"));
  assert.ok(bundle.includes("autosInventoryBundleRemove"));
  assert.ok(copy.includes("Vista previa del inventario del dealer"));
  assert.ok(copy.includes("Dealer inventory preview"));
  assert.ok(!privadoApp.includes("AutosInventoryVehicleDrawerForm"));
  assert.ok(!privadoApp.includes("additionalInventoryVehicles"));

  for (const f of changedFiles()) {
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!f.startsWith(bad), `Forbidden path modified: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08a2-vehicle-only-inventory-drawer-audit"));

  console.log("A5.QA-08A.2 vehicle-only inventory drawer audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
}

run();
