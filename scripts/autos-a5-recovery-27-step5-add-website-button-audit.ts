/**
 * A5.RECOVERY-27 — Step 5 add website button audit.
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
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_27_STEP5_ADD_WEBSITE_BUTTON_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Add website failure reproduced locally",
  "Exact root cause documented",
  "Button has working click action",
  "First click creates/opens website row",
  "Second click creates/opens second website row",
  "Max 2 limit is enforced visibly",
  "No silent failure at max limit",
  "Website/resource row has label/name field",
  "Website/resource row has URL field",
  "Remove action works",
  "Valid website/resource persists through step navigation",
  "Valid website/resource persists through refresh",
  "Valid website/resource appears in preview Business Hub",
  "Empty/invalid website row hides from public preview",
  "Website/resource maps to listing_payload if mapper exists",
  "Languages Step 5 behavior not regressed",
  "Hours Step 5 behavior not regressed",
  "Dealer contact behavior not regressed",
  "Added inventory behavior not touched/regressed",
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
  "AUTOS_A5_RECOVERY_27",
  "autos-a5-recovery-27",
  "keepEmptyRows: liveDraft",
  "data-autos-dealer-custom-links",
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
      norm.includes("autos-a5-recovery-27") ||
      norm.includes("autoDealerDraftDefaults.ts") ||
      norm.includes("AutosNegociosApplication.tsx") ||
      norm.includes("autosNegociosCopy.ts") ||
      norm === "package.json"
    );
  });
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "R27 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");
  assert.match(auditText, /Local browser proof/i, "Local browser proof section required");
  assert.match(auditText, /keepEmptyRows:\s*liveDraft/i, "Root cause keepEmptyRows fix documented");

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

  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(copy.includes("Añadir website"), "Spanish add website copy");
  assert.ok(copy.includes("Add website"), "English add website copy");

  const defaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  assert.ok(defaults.includes("dealerCustomLinks"), "dealerCustomLinks in draft normalize");
  assert.ok(defaults.includes("keepEmptyRows: liveDraft"), "live draft keeps empty custom link rows");

  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("addDealershipLink"), "Add handler wired in application");
  assert.ok(app.includes("removeCustomLink"), "Remove handler wired");
  assert.ok(app.includes("customLinksAtMax"), "Max 2 logic in UI");
  assert.ok(app.includes("data-autos-dealer-custom-links-count"), "Custom links count proof attribute");

  const linksLib = read("app/lib/clasificados/autos/autosDealerCustomLinks.ts");
  assert.ok(linksLib.includes("MAX_CUSTOM_LINKS = 2"), "Max 2 constant");
  assert.ok(linksLib.includes("dealerCustomLinksForOutput"), "Output mapper for preview");

  const hub = read("app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts");
  assert.ok(hub.includes("dealerCustomLinksForOutput"), "Preview Business Hub uses custom links");

  const draft = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  assert.ok(draft.includes("dealerCustomLinks"), "Active draft persistence includes dealerCustomLinks");

  const spec = read("e2e/autos/autos-a5-recovery-27-step5-add-website-button.spec.ts");
  assert.ok(spec.includes("Añadir website"), "Browser proof clicks add website");
  assert.ok(spec.includes("data-autos-dealer-custom-links-count"), "Browser proof asserts row count");

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden change: ${norm}`);
    }
  }

  const scoped = gateScopedChanges();
  console.log(`A5.RECOVERY-27 audit PASS (${recommendation}) — ${scoped.length} gate-scoped file(s)`);
}

run();
