/**
 * A5.POLISH-01 — Autos Negocios Preview + Business Hub buyer-facing polish audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_POLISH_01_PREVIEW_BUSINESS_HUB_AUDIT.md");
const REF_IMAGE = path.join(ROOT, "docs/qa/autos-negocios-preview-polish-target.png");

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Reference image exists at docs/qa/autos-negocios-preview-polish-target.png",
  "Autos-only scope respected",
  "Current preview source inspected",
  "Business Hub/contact source inspected",
  "Added inventory preview source inspected",
  "Preview uses real active draft/payload data",
  "Preview does not use fake placeholder data",
  "Standalone Leonix logo removed from preview content",
  "Dealer logo still renders when provided",
  "Preview notice remains clear",
  "Volver a editar remains visible",
  "Result card preview remains",
  "Main detail preview is larger and buyer-facing",
  "Gallery hierarchy improved",
  "Vehicle title/price/location/specs hierarchy improved",
  "Business Hub/contact card is prominent",
  "Business Hub shows real Step 5 contact data",
  "Business Hub shows languages chips if selected",
  "Business Hub shows websites/resources if valid",
  "Business Hub shows finance only if provided",
  "Business Hub shows social/reviews only if provided",
  "Empty Business Hub sections hide",
  "Added inventory vehicles render in preview",
  "Added inventory uses real child data",
  "No fake Leonix IDs before publish",
  "No fake public URLs before publish",
  "Marketing icon strip excluded from live preview",
  "Volver a editar preserves parent data",
  "Volver a editar preserves added inventory",
  "Refresh-safe draft behavior preserved",
  "Media order behavior preserved",
  "videoUrls behavior preserved",
  "City/ZIP behavior preserved",
  "Desktop layout responsive",
  "Mobile layout responsive",
  "Privado checked if shared preview components touched",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const MARKETING_STRIP_TERMS = [
  "Business Hub del concesionario",
  "Financiamiento si aplica",
  "Vehículos adicionales cuando aplica",
  "ID Leonix del anuncio",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/(site)/publicar/restaurantes/",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  if (p.startsWith("docs/qa/autos-negocios-preview-polish-target.png")) return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-a5-polish-01")
  );
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");
  assert.ok(fs.existsSync(REF_IMAGE), "Reference image must exist at docs/qa/autos-negocios-preview-polish-target.png");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText
      .split("\n")
      .find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  assert.ok(auditText.includes("Vista del anuncio para captura"), "Capture banner copy");
  assert.ok(auditText.includes("Volver a editar"), "Volver a editar copy");
  assert.ok(auditText.includes("ID Leonix se generará al publicar"), "Draft ID note");

  const viewModel = read("app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel.ts");
  assert.ok(viewModel.includes("mapAutosNegociosBuyerPreviewViewModel"), "Buyer preview view model");
  assert.ok(viewModel.includes("additionalInventory"), "Inventory in view model");
  assert.ok(viewModel.includes("mapAutosDealerToBusinessHubContact"), "Business Hub mapping");

  const previewClient = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(previewClient.includes("mapAutosNegociosBuyerPreviewViewModel"), "Preview uses view model");
  assert.ok(previewClient.includes("loadAutosNegociosDraftResolved"), "Preview uses active draft");
  assert.ok(previewClient.includes("showSiteLogo={false}"), "Standalone site logo removed from draft canvas");
  assert.ok(previewClient.includes("additionalInventoryVehicles"), "Added inventory in preview");

  const captureBanner = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewCaptureBanner.tsx");
  assert.ok(captureBanner.includes("editBackHref"), "Capture banner Volver a editar");

  const businessStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(businessStack.includes("languages"), "Languages in Business Hub");
  assert.ok(businessStack.includes("moreLinks"), "Websites/resources in Business Hub");
  assert.ok(businessStack.includes("hasDealerFinanceContact"), "Finance guard");

  const inventorySection = read("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx");
  assert.ok(inventorySection.includes("Más vehículos") || inventorySection.includes("autosPreviewInventorySectionTitle"), "More inventory title");

  for (const term of MARKETING_STRIP_TERMS) {
    assert.ok(!previewClient.includes(term), `Marketing strip term must not appear in preview client: ${term}`);
    assert.ok(!captureBanner.includes(term), `Marketing strip term in banner: ${term}`);
  }

  const privadoPreview = read("app/(site)/clasificados/autos/privado/components/PrivadoPreviewChrome.tsx");
  assert.ok(!privadoPreview.includes("DealerBusinessStack"), "Privado must not import dealer stack");
  assert.ok(!privadoPreview.includes("dealerLanguages"), "Privado must not include dealer languages");

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx") continue;
    if (norm.startsWith("scripts/verify-admin-reports")) continue;
    if (!isAllowedPath(norm)) {
      throw new Error(`Out-of-scope file changed: ${norm}`);
    }
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix touched: ${norm}`);
    }
  }

  console.log("A5.POLISH-01 preview Business Hub polish audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
