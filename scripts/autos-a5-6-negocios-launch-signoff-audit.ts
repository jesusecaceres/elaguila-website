/**
 * A5.6 Autos Negocios launch sign-off static gate.
 * Run: npm run autos:a5-6-negocios-signoff-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "A5.5 output/audit was inspected",
  "Negocios application route was checked",
  "Public detail/preview route was checked or blocker documented",
  "Inventory drawer/upgrade copy is visible or blocker documented",
  "Upgrade copy shows +10 vehicles for $129/month",
  "No +1/+5 options were added",
  "No Starter/Pro/Premium tiers were added",
  "Inventory add mode route works or blocker documented",
  "Inventory add mode uses real Negocios application",
  "Inventory add CTA copy is correct",
  "Main publish CTA remains visible and wired",
  "Public buyers do not see owner-only add inventory CTA",
  "Related inventory uses real listings",
  "Related inventory cards link to real detail pages",
  "Contact card has strong CTA hierarchy",
  "Social links show only when provided and safe",
  "Address/map CTA is wired or blocker documented",
  "Finance/pre-approval block exists or blocker documented",
  "No fake engagement metrics are visible in preview",
  "Gallery/images are clickable or misleading overlay removed",
  "Dashboard inventory access is clear or blocker documented",
  "Admin Autos visibility is sufficient or blocker documented",
  "Mobile layout is acceptable or blocker documented",
  "Privado was not affected",
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
  try {
    const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
  } catch {
    return [];
  }
}

function isAutosAllowed(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("app/api/clasificados/autos/") ||
    p.startsWith("app/admin/") && p.includes("clasificados/autos") ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/")
  );
}

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_6_NEGOCIOS_LAUNCH_SIGNOFF_AUDIT.md";
  assert.ok(exists(mdPath), "A5.6 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  assert.ok(exists("app/lib/clasificados/autos/AUTOS_A5_5_NEGOCIOS_FINAL_LAUNCH_POLISH_AUDIT.md"), "A5.5 audit");

  const copy = read("app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts");
  const drawerCopy = read("app/lib/clasificados/autos/autosDealerInventoryDrawerCopy.ts");
  const inventoryCopy = read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts");
  const upgradeBlob = `${copy}\n${drawerCopy}\n${inventoryCopy}`;
  assert.ok(
    upgradeBlob.includes("INVENTORY_BOOST_MONTHLY_USD") ||
      upgradeBlob.includes("129") ||
      upgradeBlob.includes("INVENTORY_BOOST_ADDITIONAL_VEHICLES"),
    "+10 / $129 upgrade copy",
  );
  assert.ok(!inventoryCopy.match(/\+1\b|\+5\b/) && !inventoryCopy.match(/Starter|Pro tier|Premium tier/i), "No tier packs");

  assert.ok(exists("app/(site)/clasificados/autos/dashboard/AutosNegociosInventoryValueDrawer.tsx"), "Drawer");
  assert.ok(exists("app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx"), "Finance block");

  const preview = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(!preview.includes("Agregar vehículo al inventario"), "No owner add CTA on preview page");
  assert.ok(preview.includes("publicPlaybackOnly"), "Analytics gated");
  assert.ok(!preview.includes("AUTOS_LISTING_ANALYTICS_DRAFT_DEMO"), "No fake metrics");

  const dealerStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(dealerStack.includes("SiWhatsapp"), "WhatsApp CTA");
  assert.ok(dealerStack.includes("DealerFinanceContact"), "Finance in contact stack");

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  assert.ok(gallery.includes("openAt") && gallery.includes("cursor-zoom-in"), "Clickable gallery");

  const addFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(addFlow.includes("inventoryMode"), "Inventory add route");

  const publishCopy = read("app/(site)/clasificados/autos/lib/autosPublishFlowCopy.ts");
  assert.ok(publishCopy.includes("Agregar al inventario"), "Inventory add CTA copy");
  assert.ok(publishCopy.includes("Confirmar vehículo del inventario"), "Confirm copy");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-6-negocios-signoff-audit"), "package script");

  const changed = changedFiles();
  const bad = changed.filter((p) => !isAutosAllowed(p));
  if (bad.length > 0) {
    console.warn("A5.6 scope warning — non-Autos files in working tree:");
    for (const p of bad) console.warn(`  - ${p}`);
  }

  const stripeGlobal = changed.filter((p) => p.includes("stripe") && !p.startsWith("app/lib/clasificados/autos/"));
  assert.equal(stripeGlobal.length, 0, `Global Stripe touched: ${stripeGlobal.join(", ")}`);

  console.log("autos:a5-6-negocios-signoff-audit OK");
}

run();
