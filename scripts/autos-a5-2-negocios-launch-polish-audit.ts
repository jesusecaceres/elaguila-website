/**
 * A5.2 Autos Negocios launch polish static gate.
 * Run: npm run autos:a5-2-negocios-launch-polish-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Year/make/model remain controlled dropdowns",
  "Trim known-options dropdown/datalist exists or blocker documented",
  "Custom trim fallback remains",
  "Structured identity is preserved for filters/search",
  "Engine options/fallback are safe for search/filter",
  "Drag photo reorder exists or blocker documented",
  "Mobile photo reorder fallback exists",
  "Cover image control remains",
  "Photo order persists to preview/public",
  "Structured address powers map CTA",
  "City/state/ZIP remain search/filter friendly",
  "Premium contact card is implemented",
  "Real contact CTAs only are shown",
  "Social icons show real provided links only",
  "Weekly/special hours are cleanly displayed",
  "Buyer CTAs are separated from owner inventory CTAs",
  "Inventory value module sells 10 included vehicles",
  "Inventory Boost copy says +10 vehicles for $129/month",
  "No +1/+5/tier logic was added",
  "No Stripe/payment logic was added",
  "Inventory add flow reuses real Negocios application",
  "Dealer/contact fields prefill in inventory add mode",
  "Added inventory vehicle remains a real listing",
  "Added inventory vehicle gets own leonix_ad_id",
  "Preview/detail layout feels premium and cleaner",
  "Fake preview metrics are removed/hidden",
  "Main publish CTA is visible and wired",
  "Inventory add CTA is visible and wired",
  "Preview does not clear form data",
  "Public/search/dashboard/admin flow remains intact",
  "Privado is not affected",
  "No unrelated categories were touched",
  "npm run build passed",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/")
  );
}

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_2_NEGOCIOS_LAUNCH_POLISH_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath)), "A5.2 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  const valueCopy = read("app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts");
  assert.ok(valueCopy.includes("INVENTORY_BOOST_ADDITIONAL_VEHICLES"), "Inventory boost constant");
  assert.ok(valueCopy.includes("10 vehículos") || valueCopy.includes("10 additional"), "Inventory value copy must mention 10 vehicles");
  assert.ok(valueCopy.includes("INVENTORY_BOOST_MONTHLY_USD"), "Inventory boost $129 constant");

  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(!negociosCopy.includes("+1 vehicle"), "No +1 tier copy");
  assert.ok(!negociosCopy.includes("+5 vehicle"), "No +5 tier copy");
  assert.ok(negociosCopy.includes("Equipo y mejoras"), "ES equipment title");
  assert.ok(negociosCopy.includes("Equipment & upgrades"), "EN equipment title");
  assert.ok(negociosCopy.includes("dragHandle"), "Photo drag handle copy");

  const dealerStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(dealerStack.includes("buyerInventoryHref"), "Buyer inventory CTA separation");
  assert.ok(dealerStack.includes("openInMaps") || dealerStack.includes("Abrir en mapa"), "Map CTA copy wired");
  assert.ok(dealerStack.includes("SiWhatsapp"), "WhatsApp CTA");
  assert.ok(dealerStack.includes("SiInstagram"), "Social icons");

  const sortable = read("app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx");
  assert.ok(sortable.includes("@dnd-kit"), "Drag reorder uses dnd-kit");
  assert.ok(sortable.includes("FiChevronLeft"), "Mobile reorder fallback arrows");

  const preview = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(!preview.includes("AUTOS_LISTING_ANALYTICS_DRAFT_DEMO"), "No hardcoded draft demo metrics");
  assert.ok(preview.includes("publicPlaybackOnly"), "Analytics gated to live playback");

  const finalActions = read("app/(site)/publicar/autos/shared/components/AutosApplicationFinalActions.tsx");
  assert.ok(finalActions.includes("Agregar al inventario"), "Inventory add CTA label ES");
  assert.ok(finalActions.includes("Add to inventory"), "Inventory add CTA label EN");
  assert.ok(negociosCopy.includes("Publicar anuncio"), "Publish CTA copy ES");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-2-negocios-launch-polish-audit"), "package script registered");

  const bad = changedFiles().filter((p) => !isAllowedPath(p));
  if (bad.length > 0) {
    console.warn("A5.2 scope warning — files outside Autos allow-list:");
    for (const p of bad) console.warn(`  - ${p}`);
  }

  console.log("autos:a5-2-negocios-launch-polish-audit OK");
}

run();
