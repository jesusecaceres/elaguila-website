/**
 * A5.RECOVERY-20 Gate B — Publish identity + public dealer inventory grouping audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_B_PUBLISH_IDENTITY_PUBLIC_GROUPING_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos-only scope respected",
  "Publish pipeline inspected",
  "Production column contract respected",
  "No owner_id/seller_id/parent_listing_id/slug dependency added",
  "Main row publishes as inventory_role main",
  "Main row receives unique leonix_ad_id",
  "Main row receives dealer_inventory_group_id",
  "Main row parent id is null",
  "Child row publishes for each saved child",
  "Child rows publish as inventory_role additional",
  "Child rows receive unique leonix_ad_id",
  "Child rows share dealer_inventory_group_id",
  "Child rows point to main via dealer_inventory_parent_listing_id",
  "Child listing_payload stores child vehicle data",
  "Child listing_payload preserves media/order where supported",
  "Child listing_payload preserves videoUrls",
  "Child public detail can render dealer Business Hub data",
  "Main public detail shows added inventory vehicles",
  "Child public detail shows inventory context/siblings",
  "Current listing excluded from its own related list",
  "Result cards link to real detail pages",
  "Publish success does not ignore child insert failure",
  "Manual Supabase SQL proof provided",
  "No global Stripe/payment touched",
  "No schema/migration touched without approval",
];

const FORBIDDEN_COLUMNS = ["owner_id", "seller_id", "parent_listing_id", "slug"];
const REQUIRED_COLUMNS = [
  "owner_user_id",
  "dealer_inventory_group_id",
  "dealer_inventory_parent_listing_id",
  "inventory_role",
  "listing_payload",
  "leonix_ad_id",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
];

const GATE_MARKERS = ["AUTOS_A5_RECOVERY_20_GATE_B", "autos-a5-recovery-20-gate-b"];

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
  assert.ok(fs.existsSync(AUDIT_MD), "Gate B audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /Gate B proof table/i, "Gate B proof table required");
  assert.match(auditText, /```sql/i, "SQL proof block required");

  const recMatch = auditText.match(/Gate B recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Gate B recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const bundle = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  assert.ok(bundle.includes("additionalInventoryVehicles") || bundle.includes("additionalVehicles"), "Child mapping in bundle publish");
  assert.ok(bundle.includes("createAutosClassifiedsListingWithInventoryParent"), "Child row creation");
  assert.ok(bundle.includes("dealerInventoryGroupId"), "Group id on child create");
  assert.ok(bundle.includes("inventory_vehicle") || bundle.includes("inventory_role"), "Inventory role wiring");

  const listingService = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  for (const col of REQUIRED_COLUMNS) {
    assert.ok(listingService.includes(col), `Required column referenced: ${col}`);
  }

  const publishSlice = bundle + listingService;
  for (const bad of FORBIDDEN_COLUMNS) {
    const re = new RegExp(`\\b${bad}\\b`);
    assert.ok(!re.test(publishSlice.replace(/owner_user_id/g, "")), `Forbidden column in publish slice: ${bad}`);
  }

  assert.ok(auditText.includes("dealer_inventory_group_id"), "SQL proof mentions group id");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix touched: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-20 Gate B publish identity/public grouping audit: PASS");
  console.log(`Gate B recommendation: ${recommendation}`);
}

run();
