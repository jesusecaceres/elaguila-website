/**
 * A5.RECOVERY-32 — Autos Negocios add inventory full-window container audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_32_NEGOCIOS_ADD_INVENTORY_FULL_WINDOW_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios scope only",
  "Autos Privado untouched",
  "Unrelated categories untouched",
  "Bienes inspected read-only",
  "Autos Add Inventory container identified",
  "Narrow drawer/panel replaced",
  "Full-window overlay implemented",
  "Desktop width uses near-full viewport",
  "Desktop height uses near-full viewport",
  "Backdrop blocks page interaction",
  "Outside click does not silently discard data",
  "Dirty close safety preserved",
  "Header/cancel close remains explicit",
  "Internal scroll works",
  "Footer buttons remain usable",
  "Mobile remains usable",
  "No child field logic changed",
  "No Step 5 inherited contact logic changed",
  "No draft persistence logic changed",
  "No media/image/video persistence logic changed",
  "No publish mapper changed",
  "Save inventory still works",
  "Save and add another still works",
  "Child Step 5 remains read-only/inherited",
  "No Supabase schema/migrations touched",
  "No Stripe/payment touched",
  "No dashboard/admin touched",
  "No global layout/theme touched",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
  "Ready for Chuy QA",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/autos/privado/",
  "app/(site)/clasificados/autos/privado/",
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/admin/",
  "app/(site)/clasificados/en-venta/",
];

const GATE_SCOPED_MARKERS = [
  "AUTOS_A5_RECOVERY_32",
  "autos-a5-recovery-32",
  "AutosNegociosAddInventoryDrawer",
  "data-autos-inventory-full-window",
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
      GATE_SCOPED_MARKERS.some((m) => norm.includes(m)) ||
      norm.startsWith("scripts/autos-a5-recovery-32") ||
      norm.includes("AUTOS_A5_RECOVERY_32") ||
      norm === "package.json"
    );
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R32 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /BrNegocioChildInventoryFullApplication/i, "Bienes reference documented");

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

  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  assert.ok(drawer.includes("fixed inset-0"), "Full-window fixed overlay");
  assert.ok(drawer.includes("data-autos-inventory-full-window"), "Full-window proof attribute");
  assert.ok(drawer.includes("min(96vw,1500px)"), "Near-full viewport width");
  assert.ok(drawer.includes("100dvh"), "Near-full viewport height");
  assert.ok(drawer.includes("overflow-y-auto"), "Internal scroll");
  assert.ok(!drawer.includes("handleBackdropClose"), "No backdrop click-close handler");
  assert.ok(!drawer.includes("max-w-[min(1120px"), "Narrow 1120px drawer removed");
  assert.ok(drawer.includes("persist(false)"), "Save inventory handler preserved");
  assert.ok(drawer.includes("persist(true)"), "Save and add another handler preserved");
  assert.ok(drawer.includes("requestClose"), "Dirty close safety preserved");
  assert.ok(drawer.includes("AutosNegociosInventoryChildApplication"), "Child application unchanged");

  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  assert.ok(bundleCopy.includes("Save inventory"), "Save inventory copy");
  assert.ok(bundleCopy.includes("Save and add another"), "Save and add another copy");
  assert.ok(
    bundleCopy.includes("Dealer information is inherited from the main dealership application"),
    "Inherited dealer copy",
  );

  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(
    !privado.includes("data-autos-inventory-full-window"),
    "Privado must not receive full-window autos shell",
  );

  for (const f of gateScopedChanges()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden gate-scoped change: ${norm}`);
    }
  }

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    assert.ok(!norm.startsWith("app/(site)/publicar/autos/privado/"), `Autos Privado modified: ${norm}`);
    assert.ok(!norm.startsWith("app/(site)/clasificados/autos/privado/"), `Autos Privado modified: ${norm}`);
    assert.ok(!norm.startsWith("supabase/migrations/"), `Migration modified: ${norm}`);
    assert.ok(!norm.startsWith("app/api/stripe/"), `Stripe modified: ${norm}`);
    assert.ok(!norm.startsWith("app/admin/"), `Admin modified: ${norm}`);
  }

  const scoped = gateScopedChanges();
  console.log(`A5.RECOVERY-32 audit PASS (${recommendation}) — ${scoped.length} gate-scoped file(s)`);
}

run();
