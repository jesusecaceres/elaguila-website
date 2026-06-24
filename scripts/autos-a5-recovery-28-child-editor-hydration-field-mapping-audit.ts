/**
 * A5.RECOVERY-28 — Child editor hydration field-mapping audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_28_CHILD_EDITOR_HYDRATION_FIELD_MAPPING_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Gemini diagnosis validated against actual repo files",
  "Exact root cause documented with file/function names",
  "Editar passes saved childId",
  "Editar opens edit mode, not add mode",
  "Editar locates child in additionalInventoryVehicles",
  "Editar does not silently open blank add form for saved child",
  "Child hydrator maps mediaImages to photos",
  "Child hydrator maps imageUrls if supported",
  "Child hydrator maps videoUrls to videoLinks",
  "Child hydrator preserves cover/isPrimary where supported",
  "Child hydrator preserves order/sortOrder where supported",
  "Default blank media state does not overwrite hydrated child",
  "Save normalizer preserves mediaImages",
  "Save normalizer preserves videoUrls",
  "Save normalizer preserves sibling children",
  "Step 7 child card still shows image",
  "Child preview still shows gallery",
  "Volver a editar does not force blank add mode",
  "Refresh then Editar hydrates saved child",
  "Parent media/video not regressed",
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
  "AUTOS_A5_RECOVERY_28",
  "autos-a5-recovery-28",
  "expandAutosVehicleMediaSourceFields",
  "hydrateChildInventoryEditorDraft",
  "photos",
  "videoLinks",
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
  assert.ok(fs.existsSync(AUDIT_MD), "R28 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Local browser proof/i, "Local browser proof section required");
  assert.match(auditText, /expandAutosVehicleMediaSourceFields|hydrateChildInventoryEditorDraft/i, "Root cause functions");

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

  const mediaDraft = read("app/lib/clasificados/autos/autosVehicleMediaDraft.ts");
  assert.ok(mediaDraft.includes("expandAutosVehicleMediaSourceFields"), "Media alias expand helper");
  assert.ok(mediaDraft.includes("raw.photos"), "photos alias in expand");
  assert.ok(mediaDraft.includes("raw.videoLinks"), "videoLinks alias in expand");
  assert.ok(mediaDraft.includes("raw.imageUrls"), "imageUrls alias in expand");

  const additional = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(additional.includes("hydrateChildInventoryEditorDraft"), "Child hydrator");
  assert.ok(additional.includes("photos: media.mediaImages"), "mediaImages → photos alias on hydrate");
  assert.ok(additional.includes("videoLinks: media.videoUrls"), "videoUrls → videoLinks alias on hydrate");
  assert.ok(additional.includes("prepareInventoryVehicleForSave"), "Save normalizer");
  assert.ok(additional.includes("findSavedAdditionalInventoryVehicle"), "Saved child lookup");
  assert.ok(additional.includes("resolveCanonicalChildInventoryEditorDraft"), "Canonical editor resolver");

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  assert.ok(drawer.includes("drawerEditingId"), "childId passed to drawer");
  assert.ok(drawer.includes('data-autos-inventory-drawer-mode={drawerMode}'), "edit/add mode proof");
  assert.ok(drawer.includes("hydrateChildInventoryEditorDraft"), "Drawer patches through hydrator");

  const bundle = read("app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryBundlePreview.tsx");
  assert.ok(bundle.includes("onDrawerOpenChange?.(true, v.id)"), "Editar passes saved child id");
  assert.match(bundle, /returnMode:\s*"child-preview"/, "Child preview return context");

  const spec = read("e2e/autos/autos-a5-recovery-28-child-editor-hydration-field-mapping.spec.ts");
  assert.ok(spec.includes('data-autos-inventory-drawer-mode", "edit"'), "Browser proof edit mode");
  assert.ok(spec.includes("child.photos"), "Browser proof alias session mutation");

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden change: ${norm}`);
    }
  }

  console.log(`A5.RECOVERY-28 audit PASS (${recommendation})`);
}

run();
