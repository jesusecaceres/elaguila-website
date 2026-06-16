/**
 * A5.RECOVERY-25 — Browser proof child media persistence audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_25_BROWSER_PROOF_CHILD_MEDIA_PERSISTENCE_AUDIT.md",
);
const PROOF_JSON = path.join(ROOT, "app/lib/clasificados/autos/.recovery-25-browser-proof.json");

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Local browser reproduction attempted before editing",
  "Object shape proof A-H captured before fix",
  "Exact file/function/field root cause documented",
  "Main media/video pipeline inspected",
  "Child media/video pipeline inspected",
  "Child uses canonical main-compatible media shape",
  "Child save stores image URLs",
  "Child save stores mediaImages/photos equivalent",
  "Child save stores cover/isPrimary",
  "Child save stores order/sortOrder",
  "Child save stores videoUrls",
  "Save flushes full child object to active draft/session",
  "Step 7 child card reads saved child media",
  "Child preview reads saved child media",
  "Child preview reads saved child videoUrls",
  "Volver a editar does not write reduced child object",
  "Editar hydrates child media into Fotos y medios",
  "Editar hydrates child videoUrls",
  "Default empty media state does not overwrite hydrated child",
  "Refresh restores child card image",
  "Refresh restores child editor media",
  "Refresh restores child videoUrls",
  "Parent media/video not regressed",
  "Sibling children preserved",
  "Temporary debug logs removed or dev-guarded",
  "Local file limitation documented honestly",
  "Privado checked if shared helpers touched",
  "No dealer-only features leaked to Privado",
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
];

const GATE_MARKERS = [
  "AUTOS_A5_RECOVERY_25",
  "autos-a5-recovery-25",
  "autosNegociosChildMediaBrowserProof",
  "resolveCanonicalChildInventoryEditorDraft",
  "data-autos-editor-media-count",
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
    return (
      GATE_MARKERS.some((m) => norm.includes(m)) ||
      norm.includes("autos-a5-recovery-25") ||
      norm.includes("AutosNegociosMediaManager.tsx") ||
      norm.includes("AutosNegociosChildInventoryPreviewOverlay.tsx") ||
      norm === "package.json"
    );
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R25 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Object shape proof before fix/i, "Before-fix proof section required");
  assert.match(auditText, /Object shape proof after fix/i, "After-fix proof section required");
  for (const letter of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
    assert.match(auditText, new RegExp(`Point ${letter}|\\*\\*${letter}\\.`), `Proof point ${letter} required`);
  }
  assert.match(auditText, /resolveDrawerInitialDraft|resolveCanonicalChildInventoryEditorDraft/i, "Root cause function");

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

  assert.ok(fs.existsSync(PROOF_JSON), "Browser proof JSON must exist — run Playwright proof first");
  const proof = JSON.parse(fs.readFileSync(PROOF_JSON, "utf8")) as { afterFix?: Array<Record<string, unknown>> };
  assert.ok(Array.isArray(proof.afterFix) && proof.afterFix.length >= 8, "Proof must include A-H snapshots");
  for (const letter of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
    const snap = proof.afterFix!.find((s) => s.label === letter);
    assert.ok(snap, `Missing browser proof snapshot ${letter}`);
    if (["B", "C", "D", "E", "F", "G", "H"].includes(letter)) {
      assert.ok(Number(snap.mediaImagesCount) >= 1, `${letter} must have saved mediaImages`);
      assert.ok(Number(snap.videoUrlsCount) >= 1, `${letter} must have videoUrls`);
    }
    if (["F", "H"].includes(letter)) {
      assert.ok(Number(snap.editorMediaCount) >= 1, `${letter} editor must show media`);
      assert.ok(Number(snap.editorVideoCount) >= 1, `${letter} editor must show video`);
    }
  }

  const additional = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(additional.includes("resolveCanonicalChildInventoryEditorDraft"), "Canonical editor resolver");
  assert.ok(additional.includes("reconcileInProgressInventoryWithSavedChildren"), "Session reconcile");

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  assert.ok(drawer.includes("resolveCanonicalChildInventoryEditorDraft"), "Drawer resolver");

  const media = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  assert.ok(media.includes("data-autos-editor-media-count"), "Editor media proof attribute");

  const gateSources = [drawer, media, additional].join("\n");
  assert.ok(!gateSources.match(/console\.(log|debug|info)\(/), "No unguarded production debug logs");

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    if (norm === "package.json" || norm.includes(".recovery-25-browser-proof.json")) continue;
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-25 browser proof child media persistence audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
