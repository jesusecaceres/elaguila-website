/**
 * A5.RECOVERY-17 — Autos Refresh Must Preserve Progress Until Tab Close Gate audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_17_REFRESH_SAFE_SESSION_DRAFT_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Refresh wipe reproduced locally",
  "Actual root cause documented",
  "Session draft key is lane-specific",
  "Session draft key is stable across refresh",
  "Session draft key does not change with lang query",
  "Restore happens before defaults overwrite state",
  "Parent Negocios draft writes to sessionStorage",
  "Parent Negocios draft restores from sessionStorage",
  "Current step persists",
  "Step 5 business/contact data persists",
  "Websites/resources persist",
  "Hours/special hours persist",
  "Saved child inventory persists",
  "Child result cards reappear after refresh",
  "Reopened child retains saved data",
  "Child media metadata/order persists where technically possible",
  "Child videoUrls persist",
  "Preview/back does not clear draft",
  "Language toggle does not clear draft",
  "Child drawer open/close does not clear parent",
  "Successful publish can clear draft",
  "Intentional reset can clear draft",
  "Refresh does not clear draft",
  "Local file limitation documented honestly",
  "Privado checked if shared persistence touched",
  "No dealer-only features leaked to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const REFRESH_PROOF_ROWS = [
  "Negocios main | Step 1 vehicle data survives refresh",
  "Negocios main | Current step survives refresh",
  "Negocios main | Step 5 dealer/contact data survives refresh",
  "Negocios main | Websites/resources survive refresh",
  "Negocios main | Hours/special hours survive refresh",
  "Negocios child | Saved child vehicles survive refresh",
  "Negocios child | Reopened child data survives refresh",
  "Negocios | Preview/back does not wipe restored draft",
  "Negocios | Language toggle does not wipe draft",
  "Privado | Vehicle data survives refresh if shared touched",
  "Privado | Current step survives refresh if shared touched",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/bienes-raices/",
  "app/(site)/publicar/restaurantes/",
];

const PRIVADO_FORBIDDEN = ["dealerCustomLinks", "Inventory Boost", "AutosNegociosAddInventoryDrawer"];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-a5-recovery-17")
  );
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /Refresh proof table/i, "Refresh proof table required");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  for (const row of REFRESH_PROOF_ROWS) {
    assert.ok(auditText.includes(row.split("|")[0]?.trim() ?? row), `Missing refresh proof row: ${row}`);
  }

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText
      .split("\n")
      .find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const keys = read("app/lib/clasificados/autos/autosSessionDraftKeys.ts");
  assert.ok(keys.includes("leonix:autos:negocios:activeDraft:v"), "Negocios session draft key");
  assert.ok(keys.includes("leonix:autos:privado:activeDraft:v"), "Privado session draft key");
  assert.ok(keys.includes("activeChildDraft:v"), "Child session draft key pattern");

  const negStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  const privStorage = read("app/(site)/clasificados/autos/privado/lib/autosPrivadoDraftStorage.ts");
  assert.ok(negStorage.includes("sessionStorage.setItem"), "Negocios writes sessionStorage");
  assert.ok(negStorage.includes("sessionStorage.getItem"), "Negocios reads sessionStorage");
  assert.ok(privStorage.includes("sessionStorage.setItem"), "Privado writes sessionStorage");

  const negHook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(negHook.includes("editorStep"), "editorStep in hook");
  assert.ok(negHook.includes("additionalInventoryVehicles"), "additionalInventoryVehicles in hook");
  assert.ok(negHook.includes("hydrateFromNamespace"), "Restore on mount");
  assert.ok(!negHook.includes("if (freshTab)"), "Must not clear draft on freshTab branch");
  assert.ok(negHook.includes("shouldResetAutosDraftForFreshEditorTab"), "A5.1 compat string");

  const draftType = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  assert.ok(draftType.includes("editorStep"), "editorStep persisted");
  assert.ok(draftType.includes("additionalInventoryVehicles"), "child inventory persisted");
  assert.ok(draftType.includes("inProgressInventoryVehicleDraft"), "in-progress child persisted");

  const privHook = read("app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts");
  assert.ok(privHook.includes("hydrateFromNamespace"), "Privado restore");
  assert.ok(!privHook.includes("if (freshTab)"), "Privado must not clear on freshTab");

  const privApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  for (const s of PRIVADO_FORBIDDEN) {
    assert.ok(!privApp.includes(s), `Privado must not include ${s}`);
  }

  const sessionCopy = read("app/lib/clasificados/autos/autosDraftSessionCopy.ts");
  assert.ok(sessionCopy.includes("Borrador restaurado de esta sesión"), "ES restored copy");
  assert.ok(sessionCopy.includes("seleccionarse nuevamente"), "ES local file refresh copy");

  const resetBlock = negHook.slice(negHook.indexOf("const resetDraft"), negHook.indexOf("const flushDraft"));
  assert.ok(resetBlock.includes("clearAutosNegociosDraft"), "reset clears draft");
  assert.ok(resetBlock.includes("removeItem"), "reset clears session marker");

  const bootstrapBlock = negHook.slice(negHook.indexOf("const bootstrap"), negHook.indexOf("void bootstrap()"));
  assert.ok(!bootstrapBlock.includes("clearAutosNegociosDraft"), "Bootstrap must not clear draft on mount");

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    if (!isAllowedPath(norm)) {
      throw new Error(`Out-of-scope file changed: ${norm}`);
    }
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden prefix touched: ${norm}`);
    }
  }

  console.log("A5.RECOVERY-17 refresh-safe session draft audit: PASS");
  console.log(`Final recommendation: ${recommendation}`);
}

run();
