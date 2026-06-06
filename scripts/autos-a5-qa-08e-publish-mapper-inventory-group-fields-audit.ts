/**
 * A5.QA-08E Autos Negocios publish mapper inventory group fields gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_QA_08E_PUBLISH_MAPPER_INVENTORY_GROUP_FIELDS_AUDIT.md",
);
const SQL_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_QA_08E_POST_PUBLISH_SUPABASE_SQL.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "git diff reviewed before editing",
  "Supabase production columns documented",
  "Migration not required unless proven otherwise",
  "Autos Negocios publish path inspected",
  "additionalInventoryVehicles reaches publish mapper",
  "Main publish row uses lane negocios",
  "Main publish row writes owner_user_id",
  "Main publish row writes unique leonix_ad_id",
  "Main publish row writes dealer_inventory_group_id",
  "Main publish row writes inventory_role main",
  "Main publish row leaves dealer_inventory_parent_listing_id null",
  "Child publish rows are created for added inventory vehicles",
  "Child rows use lane negocios",
  "Child rows write same owner_user_id",
  "Child rows write unique leonix_ad_id",
  "Child rows share dealer_inventory_group_id",
  "Child rows write dealer_inventory_parent_listing_id as main id",
  "Child rows write inventory_role additional",
  "Child rows store child vehicle data in listing_payload",
  "Child rows inherit dealer/business/contact data as needed for public output",
  "Drawer save does not publish child rows",
  "Final publish remains the only bundle publish action",
  "Publish failure does not silently create partial success",
  "Results/detail read path uses production column names",
  "Results/detail does not require slug column",
  "Related dealer vehicles query uses dealer_inventory_group_id",
  "Public buyer does not see owner inventory CTAs",
  "QA bypass remains protected or blocker documented",
  "QA bypass does not fake Stripe payment",
  "No global Stripe/payment files touched",
  "Privado checked for shared impact",
  "No dealer-only features added to Privado",
  "No schema/migration files touched unless explicitly required",
  "No unrelated categories touched",
  "Post-publish Supabase SQL checklist created",
  "npm run build passed",
];

const PRIVADO_DEALER_ONLY = [
  "Más vehículos de este dealer",
  "additionalInventoryVehicles",
  "Modo QA: pago omitido",
  "AutosNegociosAddInventoryDrawer",
  "dealer_inventory_group_id",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/tienda/",
  "app/api/stripe/",
  "supabase/migrations/",
];

const GATE_OWN_MARKERS = ["AUTOS_A5_QA_08E", "autos-a5-qa-08e"];

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

function gateScopedChanges(): string[] {
  const all = [...new Set([...changedFiles(), ...untrackedFiles()])];
  return all.filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return (
      GATE_OWN_MARKERS.some((m) => norm.includes(m)) ||
      norm.includes("autosClassifiedsListingService.ts") ||
      norm.includes("autosNegociosBundlePublish.ts") ||
      norm === "package.json"
    );
  });
}

function sqlBlocks(text: string): string {
  return [...text.matchAll(/```sql\s*([\s\S]*?)```/gi)].map((m) => m[1] ?? "").join("\n");
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD));
  assert.ok(fs.existsSync(SQL_MD));

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  const sqlText = fs.readFileSync(SQL_MD, "utf8");

  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
      `Audit row must be TRUE: ${row}`,
    );
  }

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  if (recMatch[1]!.toUpperCase() === "GREEN") {
    assert.ok(!auditText.includes("| FALSE |"), "No FALSE rows when GREEN");
  }

  const sqlScoped = sqlBlocks(sqlText);
  assert.ok(sqlScoped.includes("select"), "SQL checklist must include SELECT");
  assert.ok(sqlScoped.includes("dealer_inventory_group_id"));
  assert.ok(sqlScoped.includes("dealer_inventory_parent_listing_id"));
  assert.ok(sqlScoped.includes("inventory_role"));
  assert.ok(sqlScoped.includes("owner_user_id"));
  assert.ok(sqlScoped.includes("leonix_ad_id"));
  assert.ok(sqlScoped.includes("listing_payload"));
  assert.ok(!/drop\s+table/i.test(sqlScoped));

  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const bundle = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
  const inherited = read("app/lib/clasificados/autos/autosInventoryInheritedPreview.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const detailApi = read("app/api/clasificados/autos/public/listings/[id]/route.ts");

  assert.ok(service.includes("promoteNegociosMainInventoryListing"));
  assert.ok(service.includes("ensureNegociosInventoryGroupingOnActivate"));
  assert.ok(service.includes("dealer_inventory_group_id"));
  assert.ok(service.includes("inventory_role"));
  assert.ok(service.includes("owner_user_id"));
  assert.ok(service.includes('inventory_role: "main"'));
  assert.ok(service.includes("inventory_vehicle"));

  assert.ok(bundle.includes("publishNegociosBundleAdditionalVehicles"));
  assert.ok(bundle.includes("createAutosClassifiedsListingWithInventoryParent"));
  assert.ok(bundle.includes("child_activate_failed"));
  assert.ok(bundle.includes("mapInheritedDealerPreviewListing") || inherited.includes("mapInheritedDealerPreviewListing"));

  assert.ok(checkout.includes("publishNegociosBundleAdditionalVehicles"));
  assert.ok(confirm.includes("additionalInventoryVehicles"));

  assert.ok(!detailApi.toLowerCase().includes("slug"));
  assert.ok(service.includes("getActiveLiveAutosBundle"));
  assert.ok(service.includes("dealer_inventory_group_id"));

  for (const s of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(s), `Privado must not contain: ${s}`);
  }

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(bad), `Forbidden path: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-qa-08e-publish-mapper-inventory-group-fields-audit"));

  console.log("A5.QA-08E publish mapper inventory group fields audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
  console.log(`Recommendation: ${recMatch[1]!.toUpperCase()}`);
}

run();
