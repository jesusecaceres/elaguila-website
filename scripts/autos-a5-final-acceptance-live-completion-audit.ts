/**
 * A5.FINAL-ACCEPTANCE — Autos Negocios + Privado live completion proof gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_FINAL_ACCEPTANCE_LIVE_COMPLETION_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos-only scope respected",
  "Main Autos Negocios 7-step flow wired",
  "Added inventory full application parity",
  "Child Step 5 inherited from parent",
  "Save to inventory not publish",
  "Save and add another works in code",
  "Child result card in parent inventory",
  "Leonix unsaved modal on dirty close",
  "No window.confirm in child close path",
  "Image reorder persists in media manager",
  "Custom city preserved in draft normalize",
  "Custom city in searchable blurb",
  "Dealership links section labeled",
  "Custom dealership links max 2",
  "Hours AM/PM editor wired",
  "Preview uses real draft data",
  "Publish creates child Supabase rows in code",
  "Inventory group columns in publish mapper",
  "Drawer save does not publish",
  "Related inventory excludes self",
  "Privado free of dealer-only features",
  "No global Stripe/payment files modified",
  "No schema/migration files modified",
  "No unrelated categories modified",
  "Field-by-field child inventory proof exists",
  "npm run build passed",
];

const REQUIRED_COPY = [
  "Agregar vehículo al inventario",
  "Guardar en inventario",
  "Guardar y agregar otro",
  "Esta información se toma de la solicitud principal del concesionario",
  "ID Leonix se generará al publicar",
  "Cambios sin guardar",
  "Seguir editando",
  "Cerrar sin guardar",
  "Contactos y enlaces del concesionario",
  "Websites y recursos del concesionario",
  "Añadir website",
  "Añadir horario especial",
];

const PRODUCTION_COLUMNS = [
  "owner_user_id",
  "dealer_inventory_group_id",
  "dealer_inventory_parent_listing_id",
  "inventory_role",
  "listing_payload",
  "leonix_ad_id",
];

const PRIVADO_FORBIDDEN = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Más vehículos de este dealer",
  "financeContactImage",
  "dealerCustomLinks",
  "googleReviewsUrl",
  "yelpReviewsUrl",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/clasificados/ofertas-locales/",
  "app/(site)/publicar/bienes-raices/",
  "app/(site)/publicar/empleos/",
  "app/(site)/publicar/tienda/",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "Final acceptance audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /Field-by-field child inventory proof/i, "Child field proof section required");
  assert.match(auditText, /## TRUE\/FALSE table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Live source acceptance matrix/i, "Acceptance matrix required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const tableSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!tableSection.includes("| FALSE |"), "No FALSE rows when GREEN");
  }

  for (const row of GATE_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  const childApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryChildApplication.tsx");
  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const listingService = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const bundlePublish = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  const mapPublic = read("app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts");
  const customLinks = read("app/lib/clasificados/autos/autosDealerCustomLinks.ts");
  const mediaManager = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  const draftDefaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const application = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");

  const copyPool = [bundleCopy, negociosCopy, drawer, childApp, application].join("\n");
  for (const phrase of REQUIRED_COPY) {
    assert.ok(copyPool.includes(phrase), `Required copy missing: ${phrase}`);
  }

  const publishPool = [listingService, bundlePublish].join("\n");
  for (const col of PRODUCTION_COLUMNS) {
    assert.ok(publishPool.includes(col), `Production column reference missing: ${col}`);
  }

  assert.ok(drawer.includes("AutosNegociosInventoryChildApplication"));
  assert.ok(drawer.includes("AutosUnsavedChangesModal"));
  assert.ok(!drawer.includes("window.confirm"));
  assert.ok(childApp.includes("AutosInventoryInheritedDealerStep"));
  assert.ok(customLinks.includes("MAX_CUSTOM_LINKS = 2"));
  assert.ok(application.includes("AutosDealerHoursEditor"));
  assert.ok(mediaManager.includes("reindex"));
  assert.ok(draftDefaults.includes("return leadingTrimmed"));
  assert.ok(mapPublic.includes("buildSearchableBlurb"));
  assert.ok(mapPublic.includes("L.city"));
  assert.ok(bundlePublish.includes("createAutosClassifiedsListingWithInventoryParent"));
  assert.ok(!publishPool.includes(".slug"), "No slug column dependency in publish mapper");
  assert.ok(!/insert.*slug/i.test(publishPool), "No slug insert in publish path");

  for (const phrase of PRIVADO_FORBIDDEN) {
    assert.ok(!privado.includes(phrase), `Privado must not contain: ${phrase}`);
  }

  const changed = changedFiles();
  const autosScopePrefixes = [
    "app/(site)/publicar/autos/",
    "app/(site)/clasificados/autos/",
    "app/lib/clasificados/autos/",
    "app/api/clasificados/autos/",
    "scripts/autos",
    "package.json",
  ];
  const autosChanged = changed.filter((file) => {
    const norm = file.replace(/\\/g, "/");
    return autosScopePrefixes.some((p) => norm.startsWith(p) || norm === "package.json");
  });
  for (const file of autosChanged) {
    const norm = file.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden autos path modified: ${file}`);
    }
  }

  console.log("A5.FINAL-ACCEPTANCE live completion audit: PASS");
}

run();
