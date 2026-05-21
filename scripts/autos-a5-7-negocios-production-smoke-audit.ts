/**
 * A5.7 Autos Negocios production smoke static gate.
 * Run: npm run autos:a5-7-negocios-production-smoke-audit
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
  "A5.6 output/audit was inspected",
  "Autos landing route was checked",
  "Autos results route was checked",
  "Autos Negocios publish route was checked",
  "Public detail route was checked or blocker documented",
  "Preview/detail layout is launch acceptable",
  "Contact card CTA hierarchy is launch acceptable",
  "Social links show only when provided and safe",
  "Address/map CTA is wired or blocker documented",
  "Gallery/images are clickable or misleading UI removed",
  "Durable video behavior remains safe",
  "Fake preview metrics are not visible",
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
    p.startsWith("app/api/clasificados/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    (p.startsWith("app/admin/") && p.includes("clasificados/autos")) ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/")
  );
}

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_7_NEGOCIOS_PRODUCTION_SMOKE_AUDIT.md";
  assert.ok(exists(mdPath), "A5.7 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  assert.ok(exists("app/lib/clasificados/autos/AUTOS_A5_5_NEGOCIOS_FINAL_LAUNCH_POLISH_AUDIT.md"), "A5.5 audit");
  assert.ok(exists("app/lib/clasificados/autos/AUTOS_A5_6_NEGOCIOS_LAUNCH_SIGNOFF_AUDIT.md"), "A5.6 audit");

  const upgradeBlob = [
    read("app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts"),
    read("app/lib/clasificados/autos/autosDealerInventoryDrawerCopy.ts"),
    read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts"),
  ].join("\n");
  assert.ok(
    upgradeBlob.includes("INVENTORY_BOOST_MONTHLY_USD") || upgradeBlob.includes("129"),
    "+10 / $129 upgrade copy",
  );
  assert.ok(!upgradeBlob.match(/\+1\b|\+5\b/) && !read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts").match(/Starter|Pro tier|Premium tier/i), "No tier packs");

  assert.ok(exists("app/(site)/clasificados/autos/dashboard/AutosNegociosInventoryValueDrawer.tsx"), "Drawer");
  assert.ok(exists("app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx"), "Finance");

  const preview = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(!preview.includes("Agregar vehículo al inventario"), "No owner add on preview page");
  assert.ok(preview.includes("publicPlaybackOnly"), "Analytics gate");

  const gallery = read("app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx");
  assert.ok(gallery.includes("publicPlaybackOnly") && gallery.includes("openAt"), "Gallery + durable video");

  const publishCopy = read("app/(site)/clasificados/autos/lib/autosPublishFlowCopy.ts");
  assert.ok(publishCopy.includes("Agregar al inventario"), "Inventory CTA");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-7-negocios-production-smoke-audit"), "package script");

  const changed = changedFiles();
  const a57 = changed.filter(
    (p) =>
      p.includes("A5_7") ||
      p.includes("autos-a5-7") ||
      (p === "package.json" && read("package.json").includes("a5-7")),
  );
  const unrelated = changed.filter((p) => !isAutosAllowed(p) && !a57.includes(p));
  if (unrelated.length > 0) {
    console.warn("A5.7 scope warning — unrelated dirty files in tree (not modified by this gate):");
    for (const p of unrelated.slice(0, 15)) console.warn(`  - ${p}`);
    if (unrelated.length > 15) console.warn(`  ... and ${unrelated.length - 15} more`);
  }

  const stripeGlobal = changed.filter((p) => p.includes("stripe") && !p.startsWith("app/lib/clasificados/autos/"));
  assert.equal(stripeGlobal.length, 0, `Global Stripe touched: ${stripeGlobal.join(", ")}`);

  console.log("autos:a5-7-negocios-production-smoke-audit OK");
}

run();
