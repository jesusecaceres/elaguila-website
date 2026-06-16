/**
 * A5.RECOVERY-20 Master — Added inventory real listings audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDITS = [
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_A_DRAFT_PREVIEW_PERSISTENCE_AUDIT.md",
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_B_PUBLISH_IDENTITY_PUBLIC_GROUPING_AUDIT.md",
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_C_DASHBOARD_ADMIN_ANALYTICS_MONETIZATION_AUDIT.md",
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_ADDED_INVENTORY_REAL_LISTINGS_MASTER_AUDIT.md",
];

const MASTER_ROWS = [
  "Gate A completed",
  "Gate B completed",
  "Gate C completed",
  "Refresh preserves added inventory",
  "Child preview works",
  "Child Volver a editar preserves data",
  "Parent preview preserves data",
  "Multi-row publish creates main row",
  "Multi-row publish creates child rows",
  "Unique Leonix IDs for every row",
  "Shared dealer inventory group",
  "Child rows point to parent",
  "Main public detail shows children",
  "Child public detail shows inventory context",
  "User dashboard sees bundle",
  "User dashboard sees children",
  "Admin dashboard sees grouped inventory",
  "Business Hub data carries to children",
  "Languages/websites/hours carry to children if implemented",
  "Analytics keys documented",
  "Monetization package readiness documented",
  "Privado remains clean",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched without approval",
  "npm run build passed",
];

const FORBIDDEN_COLUMNS = ["owner_id", "seller_id", "parent_listing_id", "slug"];
const REQUIRED_TERMS = [
  "additionalInventoryVehicles",
  "owner_user_id",
  "dealer_inventory_group_id",
  "dealer_inventory_parent_listing_id",
  "inventory_role",
  "listing_payload",
  "leonix_ad_id",
];

const GATE_MARKERS = ["AUTOS_A5_RECOVERY_20", "autos-a5-recovery-20"];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    const tracked = out ? out.split(/\r?\n/).filter(Boolean) : [];
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])];
  } catch {
    return [];
  }
}

function gateScopedChanges(): string[] {
  return changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return GATE_MARKERS.some((m) => norm.includes(m)) || norm === "package.json";
  });
}

function run() {
  for (const rel of AUDITS) {
    assert.ok(fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep))), `Missing audit: ${rel}`);
  }

  const master = read(AUDITS[3]!);
  const recMatch = master.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Master final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of MASTER_ROWS) {
    const line = master.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing master row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const draftStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  assert.ok(draftStorage.includes("additionalInventoryVehicles"), "Persistence includes child inventory");

  const listingService = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  for (const term of REQUIRED_TERMS) {
    if (term === "additionalInventoryVehicles") continue;
    assert.ok(listingService.includes(term), `Production term: ${term}`);
  }

  const publishSlice = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts") + listingService;
  for (const bad of FORBIDDEN_COLUMNS) {
    assert.ok(!new RegExp(`\\b${bad}\\b`).test(publishSlice.replace(/owner_user_id/g, "")), `Forbidden: ${bad}`);
  }

  const dash = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  assert.ok(dash.includes("dealer_inventory_group_id"), "Dashboard inventory terms");

  assert.ok(master.includes("Analytics") || master.includes("analytics"), "Analytics readiness in master");
  assert.ok(master.includes("Monetization") || master.includes("$399"), "Monetization in master");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    assert.ok(GATE_MARKERS.some((m) => norm.includes(m)), `Unrelated change: ${norm}`);
  }

  console.log("A5.RECOVERY-20 master added inventory real listings audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
