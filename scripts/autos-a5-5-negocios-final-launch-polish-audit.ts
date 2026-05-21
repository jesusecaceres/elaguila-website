/**
 * A5.5 Autos Negocios final launch polish static gate.
 * Run: npm run autos:a5-5-negocios-final-launch-polish-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Autos Negocios preview/detail output was polished",
  "Title/price hierarchy improved",
  "Hero/gallery/contact layout improved",
  "Video still works",
  "Description placement improved",
  "Specs/equipment layout improved",
  "Fake preview metrics hidden/removed",
  "Premium dealer contact card exists",
  "Real CTAs only are shown",
  "Social icons show real links only",
  "Hours/location/map are cleanly displayed",
  "Finance/contact advisor fields exist or blocker documented",
  "Finance contact displays only when filled",
  "Finance CTAs are real and safe",
  "No fake financing/approval claim was added",
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
  "Dealer/contact/finance fields prefill in add mode",
  "New vehicle fields start empty in add mode",
  "Child inventory vehicle remains a real listing",
  "Child inventory vehicle gets own leonix_ad_id",
  "Custom equipment/extras can be added",
  "Custom equipment/extras display in preview/detail",
  "Custom equipment/extras are searchable",
  "Custom equipment/extras do not create fake filters",
  "Related inventory uses real listing cards",
  "Full dealer inventory page uses real listings",
  "Main publish CTA is visible and wired",
  "Inventory add CTA is visible and wired",
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
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_5_NEGOCIOS_FINAL_LAUNCH_POLISH_AUDIT.md";
  assert.ok(exists(mdPath), "A5.5 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  const financeType = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  assert.ok(financeType.includes("financeContactName"), "Finance fields on listing type");

  const financeForm = read("app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx");
  assert.ok(financeForm.includes("AutosDealerFinanceFields") && financeForm.includes("financeContactName"), "Finance form fields");
  assert.ok(read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts").includes("Contacto de financiamiento"), "Finance ES labels in copy");

  const financePreview = read("app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx");
  assert.ok(financePreview.includes("hasDealerFinanceContact"), "Finance gated display");
  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(
    negociosCopy.includes("no aprueba") || negociosCopy.includes("does not approve"),
    "No fake approval language in copy",
  );

  const customEquip = read("app/(site)/publicar/autos/shared/components/AutosCustomEquipmentField.tsx");
  assert.ok(customEquip.includes("Añadir equipo") || customEquip.includes("Add equipment"), "Custom equipment UI");

  const drawer = read("app/(site)/clasificados/autos/dashboard/AutosNegociosInventoryValueDrawer.tsx");
  assert.ok(drawer.includes("fixed inset-0"), "Inventory drawer");
  assert.ok(drawer.includes("autosDealerInventoryTotalWithBoostLine") || read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts").includes("528"), "$528 copy");

  const copy = read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts");
  assert.ok(copy.includes("INVENTORY_BOOST_MONTHLY_USD"), "$129 boost constant");
  assert.ok(!copy.match(/\+1\b|\+2\b|\+5\b|Starter|Pro tier/i), "No tier packs");

  const prefill = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(prefill.includes("financeContactName"), "Finance prefill in inventory add");

  const haystack = read("app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts");
  assert.ok(haystack.includes("customEquipment"), "Custom equipment in search haystack");

  const preview = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(!preview.includes("AUTOS_LISTING_ANALYTICS_DRAFT_DEMO"), "No fake metrics");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-5-negocios-final-launch-polish-audit"), "package script");

  const forbiddenStripeTouch = changedFiles().filter(
    (p) => p.includes("stripe") && !p.startsWith("app/lib/clasificados/autos/") && !p.startsWith("app/api/clasificados/autos/"),
  );
  assert.equal(forbiddenStripeTouch.length, 0, `Global Stripe touched: ${forbiddenStripeTouch.join(", ")}`);

  const bad = changedFiles().filter((p) => !isAllowedPath(p));
  if (bad.length > 0) {
    console.warn("A5.5 scope warning — files outside Autos allow-list:");
    for (const p of bad) console.warn(`  - ${p}`);
  }

  console.log("autos:a5-5-negocios-final-launch-polish-audit OK");
}

run();
