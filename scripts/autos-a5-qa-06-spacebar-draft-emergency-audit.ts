/**
 * A5.QA-06 Autos spacebar + draft persistence emergency static gate.
 * Run: npm run autos:a5-qa-06-spacebar-draft-emergency-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Root spacebar blocker found",
  "Spacebar no longer blocked globally in Autos text inputs",
  "Motor accepts 3.5 V6",
  "Calle accepts 1601 Coleman Ave",
  "Dealer name accepts spaces",
  "Finance advisor name accepts spaces",
  "Custom link labels accept spaces",
  "Description textarea accepts spaces",
  "Numeric-only fields remain intentionally restricted",
  "No trim/sanitize runs on every free-text onChange",
  "Keyboard shortcuts skip text-entry targets",
  "Autos Negocios draft survives refresh",
  "Autos Negocios preview/back preserves fields",
  "Text values with spaces persist in draft",
  "Privado shared input impact checked",
  "No dealer-only fields added to Privado",
  "No unrelated categories touched",
  "npm run build passed",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/clasificados/publicar/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/tienda/",
  "app/api/stripe/",
];

const AUTOS_PUBLISH_GLOB = [
  "app/(site)/publicar/autos",
  "app/lib/clasificados/autos",
  "app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function walkTsFiles(dirRel: string): string[] {
  const abs = path.join(ROOT, dirRel.replace(/\//g, path.sep));
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  const stack = [abs];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (/\.(tsx?|jsx?)$/.test(ent.name)) out.push(p.replace(/\\/g, "/").slice(ROOT.replace(/\\/g, "/").length + 1));
    }
  }
  return out;
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.ok(toplevel.replace(/\\/g, "/").toLowerCase().includes("elaguila-website"), "Wrong repo root");

  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_QA_06_SPACEBAR_DRAFT_EMERGENCY_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath)), "A5.QA-06 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
    assert.ok(md.includes(`| ${row} | TRUE |`), `Audit row must be TRUE: ${row}`);
  }

  const formText = read("app/lib/clasificados/autos/autosPublishFormText.ts");
  assert.ok(formText.includes("autosHasDraftTrailingSpace"), "Draft trailing-space helper required");
  assert.ok(formText.includes("isTextEntryTarget"), "isTextEntryTarget helper required");

  const engineOpts = read("app/lib/clasificados/autos/autosVehicleEngineOptions.ts");
  assert.ok(engineOpts.includes("liveDraft"), "coerceEngineFromCatalog must support liveDraft");
  assert.ok(engineOpts.includes("autosHasDraftTrailingSpace"), "coerceEngineFromCatalog must preserve draft trailing space");
  assert.ok(engineOpts.includes("autosPreserveDraftTypingValue"), "coerceEngineFromCatalog must preserve draft typing");

  const taxonomy = read("app/lib/clasificados/autos/autosVehicleTaxonomy.ts");
  assert.ok(taxonomy.includes("liveDraft"), "coerceVehicleIdentityFromTaxonomy must support liveDraft");

  const defaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  assert.ok(defaults.includes("liveDraft"), "normalizeLoadedListing must support liveDraft");

  const dealerHook = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(dealerHook.includes("liveDraft: true"), "Negocios setListingPatch must use liveDraft");
  assert.ok(dealerHook.includes("useAutosDraftPersistEffects"), "Draft persist effects required");

  const privadoHook = read("app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts");
  assert.ok(privadoHook.includes("liveDraft: true"), "Privado setListingPatch must use liveDraft");

  const selectOther = read("app/(site)/publicar/autos/negocios/components/SelectWithOtherField.tsx");
  assert.ok(selectOther.includes("autosDraftTextValue"), "SelectWithOtherField custom input must use autosDraftTextValue");

  for (const rel of walkTsFiles("app/(site)/publicar/autos")) {
    const src = read(rel);
    const spaceBlock = src.match(/preventDefault\(\)[\s\S]{0,120}(Space|key === ["'] ["']|key === ["']Space["'])/);
    if (spaceBlock) {
      assert.fail(`Unguarded Space preventDefault suspected in ${rel}`);
    }
    const enterSpaceBlock = src.match(/key === ["']Enter["']\s*\|\|\s*e\.key === ["'] ["']/);
    if (enterSpaceBlock && !src.includes("isTextEntryTarget")) {
      assert.fail(`Enter/Space handler in ${rel} should guard with isTextEntryTarget if added`);
    }
  }

  const negociosApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(!/onChange=\{\(e\)\s*=>\s*setListingPatch\(\{[^}]*\.trim\(\)/.test(negociosApp), "Negocios onChange must not trim on every keystroke");

  for (const f of changedFiles()) {
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!f.startsWith(bad), `Forbidden path modified: ${f}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-qa-06-spacebar-draft-emergency-audit"), "package.json script entry required");

  console.log("A5.QA-06 spacebar + draft emergency audit: PASS");
  console.log(`Repo: ${toplevel}`);
  console.log(`HEAD: ${execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim()}`);
  console.log(`Changed files (${changedFiles().length}):`);
  for (const f of changedFiles()) console.log(`  - ${f}`);
}

run();
