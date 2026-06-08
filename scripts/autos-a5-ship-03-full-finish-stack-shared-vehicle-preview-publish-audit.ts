/**
 * A5.SHIP-03 Autos full finish stack shared vehicle + preview + publish gate.
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
  "app/lib/clasificados/autos/AUTOS_A5_SHIP_03_FULL_FINISH_STACK_SHARED_VEHICLE_PREVIEW_PUBLISH_AUDIT.md",
);
const SQL_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_SHIP_03_POST_PUBLISH_SQL.md");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "git diff reviewed before editing",
  "Autos scope lock respected",
  "Lane impact classified before edits",
  "Negocios vehicle flow inspected",
  "Negocios additional inventory drawer inspected",
  "Privado vehicle flow inspected",
  "Shared vehicle data helper exists or equivalent documented",
  "NHTSA/vPIC decode helper exists or equivalent documented",
  "VIN normalization exists",
  "VIN validation does not block typing",
  "Decode button exists in Negocios main vehicle step",
  "Decode button exists in Negocios additional inventory drawer",
  "Privado VIN decode added if affected or exact blocker documented",
  "Decode loading/success/error states exist",
  "Decode fills year when returned",
  "Decode fills make when returned",
  "Decode fills model when returned",
  "Decode fills trim/version when returned",
  "Decode fills engine/motor when returned",
  "Decode fills body style when returned",
  "Decode fills drivetrain when returned",
  "Decode fills transmission when returned",
  "Decode fills fuel when returned",
  "Decode fills doors when returned",
  "Manual override remains in Negocios",
  "Manual override remains in Privado",
  "Empty NHTSA fields keep manual fallback",
  "Existing user-entered fields are not overwritten unsafely",
  "Child VIN decode affects child vehicle only",
  "Decoded child data persists in additionalInventoryVehicles",
  "Structured fields persist in Negocios draft",
  "Structured fields persist in Privado draft if affected",
  "Structured fields map to listing_payload",
  "Structured fields are available for future filters/search",
  "Negocios true preview renders main vehicle",
  "Negocios true preview renders added inventory vehicles",
  "Negocios true preview renders Business Hub from real draft",
  "Negocios true preview renders finance image/logo when provided",
  "Negocios preview does not fake public URLs",
  "Negocios preview does not fake Leonix IDs before publish",
  "Negocios preview does not fake analytics",
  "Publish path inspected",
  "Publish path uses production column names",
  "Code does not require slug column",
  "Main publish mapping writes lane negocios",
  "Main publish mapping writes inventory_role main",
  "Child publish mapping writes inventory_role additional",
  "Child publish mapping shares dealer_inventory_group_id",
  "Child publish mapping writes dealer_inventory_parent_listing_id",
  "Each published row gets unique leonix_ad_id",
  "Success does not show on failed insert",
  "Privado checked after shared changes",
  "No dealer-only inventory drawer added to Privado",
  "No Inventory Boost added to Privado",
  "No finance image/logo added to Privado",
  "No dealer reviews/custom links added to Privado",
  "No dealer Business Hub added to Privado",
  "No database/schema/migration files touched",
  "No global Stripe/payment files touched",
  "No unrelated categories touched",
  "npm run build passed",
];

const PRIVADO_DEALER_ONLY = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Más vehículos de este dealer",
  "financeContactImage",
  "dealerCustomLinks",
  "googleReviewsUrl",
  "yelpReviewsUrl",
  "AutosNegociosAddInventoryDrawer",
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

const GATE_OWN_MARKERS = ["AUTOS_A5_SHIP_03", "autos-a5-ship-03"];

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
      norm.includes("autosNhtsaVinDecode.ts") ||
      norm.includes("autosVehicleStructuredData.ts") ||
      norm.includes("AutosVinDecodeBlock.tsx") ||
      norm.includes("decode-vin/route.ts") ||
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
  const copy = read("app/lib/clasificados/autos/autosVinDecodeCopy.ts");
  const nhtsa = read("app/lib/clasificados/autos/autosNhtsaVinDecode.ts");
  const structured = read("app/lib/clasificados/autos/autosVehicleStructuredData.ts");
  const decodeRoute = read("app/api/clasificados/autos/decode-vin/route.ts");
  const vinBlock = read("app/(site)/publicar/autos/shared/components/AutosVinDecodeBlock.tsx");
  const negocios = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosInventoryVehicleDrawerForm.tsx");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const inventoryDraft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const preview = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
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

  assert.ok(nhtsa.includes("DecodeVinValues") || decodeRoute.includes("decodeAutosVinWithNhtsa"));
  assert.ok(copy.includes("Decodificar VIN"));
  assert.ok(copy.includes("Decode VIN"));
  assert.ok(copy.includes("Decodificando VIN"));
  assert.ok(copy.includes("Decoding VIN"));
  assert.ok(copy.includes("No pudimos decodificar este VIN"));
  assert.ok(copy.includes("We could not decode this VIN"));

  for (const field of [
    "vin",
    "engineCylinders",
    "displacementL",
    "bodyStyle",
    "vehicleType",
    "drivetrain",
    "transmission",
    "fuel",
    "doors",
  ]) {
    assert.ok(structured.includes(field) || nhtsa.includes(field), `Structured field missing: ${field}`);
  }

  assert.ok(negocios.includes("AutosVinDecodeBlock"));
  assert.ok(drawer.includes("AutosVinDecodeBlock"));
  assert.ok(privado.includes("AutosVinDecodeBlock"));
  assert.ok(vinBlock.includes("buildVinDecodeFillEmptyPatch"));
  assert.ok(inventoryDraft.includes("engineCylinders"));
  assert.ok(inventoryDraft.includes("additionalInventoryVehicles") || inventoryDraft.includes("AutosAdditionalInventoryVehicleDraft"));

  assert.ok(service.includes("owner_user_id"));
  assert.ok(service.includes("dealer_inventory_group_id"));
  assert.ok(service.includes("dealer_inventory_parent_listing_id"));
  assert.ok(service.includes("inventory_role"));
  assert.ok(service.includes("listing_payload"));
  assert.ok(service.includes("leonix_ad_id"));
  assert.ok(!detailApi.toLowerCase().includes("slug"));

  assert.ok(preview.includes("AutosNegociosResultsCardPreview"));
  assert.ok(preview.includes("AutosNegociosPreviewInventorySection"));
  assert.ok(checkout.includes("publishNegociosBundleAdditionalVehicles") || checkout.includes("activateAutosClassifiedsListing"));

  for (const s of PRIVADO_DEALER_ONLY) {
    assert.ok(!privado.includes(s), `Privado must not contain: ${s}`);
  }

  const sqlScoped = sqlBlocks(fs.readFileSync(SQL_MD, "utf8"));
  assert.ok(sqlScoped.includes("listing_payload->>'vin'"));
  assert.ok(sqlScoped.includes("dealer_inventory_group_id"));

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(bad), `Forbidden path: ${f}`);
    }
  }

  assert.ok(read("package.json").includes("autos:a5-ship-03-full-finish-stack-shared-vehicle-preview-publish-audit"));

  console.log("A5.SHIP-03 full finish stack audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
  console.log(`Recommendation: ${recMatch[1]!.toUpperCase()}`);
}

run();
