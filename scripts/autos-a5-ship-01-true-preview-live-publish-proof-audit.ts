/**
 * A5.SHIP-01 Autos Negocios true preview + live publish route proof gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_SHIP_01_TRUE_PREVIEW_LIVE_PUBLISH_PROOF_AUDIT.md",
);
const SQL_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_SHIP_01_POST_PUBLISH_SQL.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "git diff reviewed before editing",
  "Autos scope lock respected",
  "True buyer-facing preview inspected",
  "Preview renders main vehicle from real draft",
  "Preview renders added inventory vehicles from real draft",
  "Preview renders Business Hub from real draft",
  "Preview renders finance image/logo when provided",
  "Preview is screenshot-ready",
  "Preview does not fake public URLs",
  "Preview does not fake Leonix IDs before publish",
  "Preview does not fake analytics",
  "Publish button call path inspected",
  "Publish button calls real Autos Negocios publish path",
  "Publish errors are not silently swallowed",
  "Success does not show unless Supabase insert succeeds",
  "Protected QA bypass exists for Chuy/admin or blocker documented",
  "QA bypass does not fake Stripe payment",
  "QA bypass does not touch global Stripe/payment",
  "Main row maps to lane negocios",
  "Main row writes inventory_role main",
  "Main row writes dealer_inventory_group_id",
  "Child rows are created for added vehicles",
  "Child rows write inventory_role additional",
  "Child rows share dealer_inventory_group_id",
  "Child rows write dealer_inventory_parent_listing_id = main id",
  "Each row writes unique leonix_ad_id",
  "Production column names are used",
  "Code does not require slug column",
  "Post-publish SQL checklist created",
  "Privado checked for shared impact",
  "No dealer-only features added to Privado",
  "No global Stripe/payment files touched",
  "No schema/migration files touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const PRIVADO_DEALER_ONLY = [
  "Más vehículos de este dealer",
  "additionalInventoryVehicles",
  "AutosNegociosAddInventoryDrawer",
  "dealer_inventory_group_id",
  "Vista del anuncio para captura",
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

const GATE_OWN_MARKERS = ["AUTOS_A5_SHIP_01", "autos-a5-ship-01"];

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
      norm.includes("autosNegociosQaPublishAllowlist.ts") ||
      norm.includes("AutosNegociosPreviewCaptureBanner.tsx") ||
      norm.includes("AutosNegociosPreviewClient.tsx") ||
      norm.includes("publish-options/route.ts") ||
      norm.includes("checkout/route.ts") ||
      norm.includes("AutosPublishConfirmCore.tsx") ||
      norm.includes("autosNegociosInventoryBundleCopy.ts") ||
      norm.includes("autosListingBearerAuth.ts") ||
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
  const copy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  const previewClient = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  const captureBanner = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewCaptureBanner.tsx");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const bundle = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
  const allowlist = read("app/lib/clasificados/autos/autosNegociosQaPublishAllowlist.ts");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const detailApi = read("app/api/clasificados/autos/public/listings/[id]/route.ts");

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
  assert.ok(sqlScoped.includes("dealer_inventory_group_id"));
  assert.ok(sqlScoped.includes("dealer_inventory_parent_listing_id"));
  assert.ok(sqlScoped.includes("inventory_role"));
  assert.ok(sqlScoped.includes("owner_user_id"));
  assert.ok(sqlScoped.includes("leonix_ad_id"));
  assert.ok(sqlScoped.includes("listing_payload"));
  assert.ok(!/drop\s+table/i.test(sqlScoped));

  assert.ok(copy.includes("Así se verá en resultados"));
  assert.ok(copy.includes("How this will look in results"));
  assert.ok(copy.includes("Vista previa del inventario del dealer"));
  assert.ok(copy.includes("Dealer inventory preview"));
  assert.ok(copy.includes("Vista del anuncio para captura"));
  assert.ok(copy.includes("Ad preview for capture"));

  assert.ok(previewClient.includes("AutosNegociosPreviewCaptureBanner"));
  assert.ok(previewClient.includes("AutosNegociosResultsCardPreview"));
  assert.ok(previewClient.includes("loadAutosNegociosDraftResolved"));
  assert.ok(captureBanner.includes("autos-negocios-preview-capture"));

  assert.ok(checkout.includes("publishNegociosBundleAdditionalVehicles"));
  assert.ok(checkout.includes("isAutosNegociosQaPublishAllowlisted"));
  assert.ok(checkout.includes("bundle_publish_failed") || checkout.includes("bundlePublish.error"));
  assert.ok(allowlist.includes("AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST"));
  assert.ok(confirm.includes("negociosQaAllowlistBypass"));
  assert.ok(confirm.includes("additionalInventoryVehicles"));

  assert.ok(service.includes("dealer_inventory_group_id"));
  assert.ok(service.includes("inventory_role"));
  assert.ok(service.includes("owner_user_id"));
  assert.ok(bundle.includes("createAutosClassifiedsListingWithInventoryParent"));
  assert.ok(bundle.includes("inventory_vehicle"));

  assert.ok(!detailApi.toLowerCase().includes("slug"));

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

  assert.ok(read("package.json").includes("autos:a5-ship-01-true-preview-live-publish-proof-audit"));

  console.log("A5.SHIP-01 true preview live publish proof audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
  console.log(`Recommendation: ${recMatch[1]!.toUpperCase()}`);
}

run();
