/**
 * A5.RECOVERY-26 — Child edit hydrates saved inventory audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_26_CHILD_EDIT_HYDRATES_SAVED_INVENTORY_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Working Step 7 child card source inspected",
  "Working child preview source inspected",
  "Broken Editar path inspected",
  "Broken Volver a editar path inspected",
  "Exact root cause documented",
  "Editar passes saved childId",
  "Editar opens edit mode, not add mode",
  "Editar locates saved child in additionalInventoryVehicles",
  "Editar hydrates Step 1 child fields",
  "Editar hydrates child images/media",
  "Editar hydrates child image URLs",
  "Editar hydrates child media order/cover where supported",
  "Editar hydrates child videoUrls",
  "Editar does not create blank child when saved child exists",
  "Volver a editar preserves parent draft",
  "Volver a editar preserves saved child",
  "Volver a editar does not force blank add form",
  "Refresh preserves saved child",
  "Refresh then Editar hydrates saved child",
  "Sibling children are preserved",
  "Parent media/video behavior not regressed",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/admin/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/magazine/",
];

const GATE_MARKERS = [
  "AUTOS_A5_RECOVERY_26",
  "autos-a5-recovery-26",
  "findSavedAdditionalInventoryVehicle",
  "resolveCanonicalChildInventoryEditorDraft",
  "data-autos-inventory-drawer-mode",
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

function gateScopedChanges(): string[] {
  return changedFiles().filter((f) => {
    const norm = f.replace(/\\/g, "/");
    return GATE_MARKERS.some((m) => norm.includes(m)) || norm.includes("autos-a5-recovery-26") || norm === "package.json";
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R26 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Local browser proof/i, "Local browser proof section required");
  assert.match(auditText, /findSavedAdditionalInventoryVehicle|resolveCanonicalChildInventoryEditorDraft/i, "Root cause function");

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

  const additional = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(additional.includes("findSavedAdditionalInventoryVehicle"), "Saved child lookup helper");
  assert.ok(additional.includes("resolveCanonicalChildInventoryEditorDraft"), "Canonical editor resolver");
  assert.ok(additional.includes("findSavedAdditionalInventoryVehicle(additionalVehicles"), "Resolver uses additionalInventoryVehicles lookup");

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  assert.ok(drawer.includes("findSavedAdditionalInventoryVehicle"), "Drawer saved child lookup");
  assert.ok(drawer.includes("data-autos-inventory-drawer-mode"), "Drawer edit/add mode proof attribute");
  assert.ok(drawer.includes("missingSavedChild"), "Missing saved child guard");
  assert.ok(drawer.includes("resolveCanonicalChildInventoryEditorDraft"), "Drawer uses canonical hydrate resolver");
  assert.match(additional, /mediaImages|videoUrls/, "Resolver hydrate references media/video fields");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("findSavedAdditionalInventoryVehicle"), "Card/preview/edit shared lookup");
  assert.ok(bundle.includes('onDrawerOpenChange?.(true, v.id)'), "Editar passes childId");
  assert.ok(bundle.includes("clearAutosNegociosEditorReturnContext"), "Volver a editar clears return context");

  const gateSources = [drawer, bundle, additional].join("\n");
  assert.ok(!gateSources.match(/console\.(log|debug|info)\(/), "No unguarded production debug logs");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json") continue;
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-26 child edit hydrates saved inventory audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
