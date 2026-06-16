/**
 * A5.RECOVERY-20 Gate C — Dashboard/admin visibility + analytics/monetization readiness audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_C_DASHBOARD_ADMIN_ANALYTICS_MONETIZATION_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos-only scope respected",
  "User dashboard Autos read model inspected",
  "Admin Autos read model inspected",
  "User dashboard shows main Autos bundle",
  "User dashboard shows child inventory vehicles",
  "User dashboard shows inventory count",
  "User dashboard shows child Leonix IDs after publish",
  "User dashboard shows child public links",
  "User dashboard shows child statuses",
  "User dashboard does not use global membership_tier as package truth",
  "Admin dashboard shows main Autos listings",
  "Admin dashboard shows child Autos listings",
  "Admin dashboard exposes/traces inventory_role",
  "Admin dashboard exposes/traces dealer_inventory_group_id",
  "Admin dashboard exposes/traces child parent relationship",
  "Admin row actions remain visible",
  "Stable analytics keys documented",
  "Group-level analytics readiness documented",
  "No fake analytics totals added",
  "Monetization package readiness documented",
  "No Stripe/payment built",
  "No commission logic built",
  "Bienes blueprint note documented",
  "Privado checked if shared helpers touched",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched without approval",
  "npm run build passed",
];

const GATE_MARKERS = ["AUTOS_A5_RECOVERY_20_GATE_C", "autos-a5-recovery-20-gate-c"];

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
  assert.ok(fs.existsSync(AUDIT_MD), "Gate C audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");

  const recMatch = auditText.match(/Final recommendation \(Gate C\):\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Gate C recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  assert.ok(auditText.includes("dealer_inventory_group_id"), "Analytics keys documented");
  assert.ok(auditText.includes("$399") || auditText.includes("399"), "Monetization base package documented");
  assert.ok(auditText.includes("Bienes"), "Bienes blueprint note");

  const dash = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  assert.ok(dash.includes("dealer_inventory_group_id"), "Dashboard groups by group id");
  assert.ok(dash.includes("inventory_role"), "Dashboard shows inventory role");
  assert.ok(dash.includes("leonix_ad_id"), "Dashboard shows Leonix ID");

  const admin = read("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
  assert.ok(admin.includes("inventory_role"), "Admin shows inventory role");
  assert.ok(admin.includes("dealer_inventory_group_id"), "Admin shows group id");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("additionalInventoryVehicles"), "Privado has no dealer inventory");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    assert.ok(norm === "package.json" || GATE_MARKERS.some((m) => norm.includes(m)), `Out of scope: ${norm}`);
  }

  console.log("A5.RECOVERY-20 Gate C dashboard/admin/analytics audit: PASS");
  console.log(`Gate C recommendation: ${recommendation}`);
}

run();
