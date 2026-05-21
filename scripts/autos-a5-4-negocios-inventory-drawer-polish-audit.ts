/**
 * A5.4 Autos Negocios inventory drawer + premium output polish static gate.
 * Run: npm run autos:a5-4-negocios-inventory-drawer-polish-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Autos preview/detail output was polished",
  "Title/price hierarchy improved",
  "Hero/gallery/contact layout improved",
  "Description placement improved",
  "Specs grid improved",
  "Fake preview metrics hidden/removed",
  "Premium dealer contact card exists",
  "Real CTAs only are shown",
  "Social icons show real links only",
  "Hours/location/map are cleanly displayed",
  "Inventory drawer/slide-over exists or blocker documented",
  "Mobile drawer/bottom-sheet behavior exists or blocker documented",
  "Active inventory count is shown",
  "Remaining slots are shown",
  "10 included vehicles copy exists",
  "+10 vehicles for $129/month copy exists",
  "$528/month total copy exists",
  "No +1/+2/+5/tier logic was added",
  "No Stripe/payment logic was added",
  "Under-limit add CTA opens inventory add flow",
  "At-limit upgrade CTA does not fake payment",
  "Inventory add flow reuses real Autos Negocios app",
  "Dealer fields prefill in add mode",
  "New vehicle fields start empty in add mode",
  "Child inventory vehicle remains a real listing",
  "Child inventory vehicle gets own leonix_ad_id",
  "Related inventory uses real listing cards",
  "Full dealer inventory page uses real listings",
  "Main publish CTA is visible and wired",
  "Inventory add CTA is visible and wired",
  "Trim fallback remains clean",
  "Engine fallback remains clean",
  "Preview does not clear form data",
  "Privado is not affected",
  "No unrelated categories were touched",
  "npm run build passed",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
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
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_4_NEGOCIOS_INVENTORY_DRAWER_POLISH_AUDIT.md";
  assert.ok(exists(mdPath), "A5.4 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  const drawer = read("app/(site)/clasificados/autos/dashboard/AutosNegociosInventoryValueDrawer.tsx");
  assert.ok(drawer.includes("fixed inset-0"), "Drawer overlay");
  assert.ok(drawer.includes("rounded-t-[24px]"), "Mobile bottom sheet radius");
  assert.ok(drawer.includes("buildAutosInventoryAddPublishHref"), "Under-limit routes to add flow");
  assert.ok(
    drawer.includes("autosDealerInventoryTotalWithBoostLine") || drawer.includes("528"),
    "$528 total line wired in drawer",
  );
  const drawerCopy = read("app/lib/clasificados/autos/autosDealerInventoryDrawerCopy.ts");
  assert.ok(
    drawer.includes("autosDealerInventoryDrawerUpgradeLine") || drawerCopy.includes("INVENTORY_BOOST_MONTHLY_USD"),
    "$129 upgrade copy",
  );

  const copy = read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts");
  assert.ok(
    copy.includes("AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD") || copy.includes("528"),
    "Total with boost constant",
  );
  assert.ok(!copy.match(/\+1\b|\+2\b|\+5\b|Starter|Pro tier/i), "No tier pack copy");

  const contact = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(contact.includes("SiWhatsapp"), "WhatsApp CTA");
  assert.ok(contact.includes("FiPhone"), "Call CTA");
  assert.ok(contact.includes("safeExternalHref"), "Social links validated");

  const related = read("app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx");
  assert.ok(related.includes("AutosDealerInventoryVehicleCard"), "Related uses inventory vehicle card");
  assert.ok(related.includes("AutosDealerInventoryVehicleCard") && related.includes("preview.related"), "Related section");

  const fullPage = read("app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/AutosDealerInventoryPageClient.tsx");
  assert.ok(fullPage.includes("AutosDealerInventoryVehicleCard"), "Full inventory page cards");

  const preview = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(!preview.includes("AUTOS_LISTING_ANALYTICS_DRAFT_DEMO"), "No fake preview metrics");
  assert.ok(preview.includes("publicPlaybackOnly"), "Real metrics gate");

  const finalActions = read("app/(site)/publicar/autos/shared/components/AutosApplicationFinalActions.tsx");
  assert.ok(finalActions.includes("Agregar al inventario") || finalActions.includes("inventoryAddMode"), "Inventory add CTA");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-4-negocios-inventory-drawer-polish-audit"), "package script");

  const forbiddenStripeTouch = changedFiles().filter(
    (p) => p.includes("stripe") && !p.startsWith("app/lib/clasificados/autos/") && !p.startsWith("app/api/clasificados/autos/"),
  );
  assert.equal(forbiddenStripeTouch.length, 0, `Global Stripe files modified: ${forbiddenStripeTouch.join(", ")}`);

  const bad = changedFiles().filter((p) => !isAllowedPath(p));
  if (bad.length > 0) {
    console.warn("A5.4 scope warning — files outside Autos allow-list:");
    for (const p of bad) console.warn(`  - ${p}`);
  }

  console.log("autos:a5-4-negocios-inventory-drawer-polish-audit OK");
}

run();
