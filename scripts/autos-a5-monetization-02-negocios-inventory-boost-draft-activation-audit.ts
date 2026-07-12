/**
 * A5.MONETIZATION-02 — Autos Negocios Inventory Boost draft activation audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_MONETIZATION_02_NEGOCIOS_INVENTORY_BOOST_DRAFT_ACTIVATION_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope only",
  "Autos Privado untouched",
  "Unrelated categories untouched",
  "Old “publish first” copy removed",
  "Boost can be activated before final publish",
  "Draft data preserved through activation",
  "Main vehicle preserved",
  "Additional vehicles preserved",
  "Base limit remains 10",
  "Boost limit becomes 20",
  "Main vehicle counts as 1",
  "Additional vehicles count correctly",
  "<=10 publish allowed without boost",
  "11–20 publish blocked without boost",
  "11–20 publish allowed with active boost",
  ">20 publish blocked",
  "Failed/cancelled boost does not unlock 20",
  "No fake production activation",
  "Stripe/test activation path documented",
  "No Supabase migration touched",
  "No global Stripe change",
  "No dashboard/admin redesign",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
  "Ready for Chuy QA",
];

const BAD_COPY = [
  "Publish your main dealer listing first to activate inventory",
  "Publica primero tu anuncio dealer principal para activar el inventario",
];

const GOOD_COPY = [
  "Activate Inventory Boost now to unlock 10 more vehicle slots before publishing",
  "Activa Inventory Boost ahora para desbloquear 10 espacios más antes de publicar",
  "After activation, you'll return to this same application",
  "Después de activar, regresarás a esta misma solicitud",
];

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

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.MONETIZATION-02 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const boostPanel = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBoostPanel.tsx");
  for (const bad of BAD_COPY) {
    assert.ok(!boostPanel.includes(bad), `Bad copy must be removed: ${bad}`);
  }

  const pipeline = read("app/lib/clasificados/autos/autosInventoryBoostPipeline.ts");
  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  for (const good of GOOD_COPY) {
    assert.ok(
      pipeline.includes(good) || bundleCopy.includes(good) || boostPanel.includes(good),
      `Required copy missing: ${good}`,
    );
  }

  assert.ok(
    fs.existsSync(path.join(ROOT, "app/api/clasificados/autos/inventory-pack/checkout/route.ts")),
    "Pre-publish inventory-pack checkout route required",
  );
  assert.ok(
    read("app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard.ts").includes("10"),
    "Publish guard must reference 10 limit",
  );
  assert.ok(
    read("app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard.ts").includes("20"),
    "Publish guard must reference 20 limit",
  );

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("inventory-pack/checkout"), "Privado must not use inventory-pack checkout");

  const changed = changedFiles();
  for (const f of changed) {
    const norm = f.replace(/\\/g, "/");
    assert.ok(!norm.startsWith("app/(site)/publicar/autos/privado/"), `Privado modified: ${norm}`);
    assert.ok(!norm.startsWith("supabase/migrations/"), `Migration modified: ${norm}`);
    assert.ok(!norm.startsWith("app/api/stripe/"), `Global Stripe modified: ${norm}`);
  }

  const allowedGlobalStripe =
    changed.filter((f) => f.replace(/\\/g, "/").startsWith("app/api/stripe/")).length === 0;
  assert.ok(allowedGlobalStripe, "No global Stripe files should be modified");

  console.log(`A5.MONETIZATION-02 audit PASS (${recommendation})`);
}

run();
