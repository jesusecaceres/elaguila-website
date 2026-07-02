#!/usr/bin/env node
/**
 * Zero-cost magazine DeepL readiness audit.
 * Never prints secret values. Never calls DeepL. Never creates output PDFs.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const SOURCE_PDF = resolve(ROOT, "public/magazine/2026/june/leonix_media_june.pdf");
const PT_PROOF_PDF = resolve(ROOT, ".magazine-proof-output/june-2026/pt/leonix_media_june.pt.pdf");
const PROOF_ROOT = resolve(ROOT, ".magazine-proof-output");
const ENV_LOCAL = resolve(ROOT, ".env.local");
const ENV_FILE = resolve(ROOT, ".env");
const GITIGNORE = resolve(ROOT, ".gitignore");
const PACKAGE_JSON = resolve(ROOT, "package.json");
const DEEPL_PACKAGE = "@deepl/deepl-node";

function envLocalHasDeepLKey() {
  if (!existsSync(ENV_LOCAL)) return false;
  for (const line of readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== "DEEPL_AUTH_KEY") continue;
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (value) return true;
  }
  return false;
}

function packageHasDependency(name) {
  if (!existsSync(PACKAGE_JSON)) return false;
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  return Boolean(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

function gitignoreCoversProofOutput() {
  if (!existsSync(GITIGNORE)) return false;
  const text = readFileSync(GITIGNORE, "utf8");
  return text.includes(".magazine-proof-output/");
}

function fileSizeLabel(path) {
  if (!existsSync(path)) return null;
  const bytes = readFileSync(path).length;
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  return `${bytes} bytes (${mb} MB)`;
}

const checks = {
  sourcePdfExists: existsSync(SOURCE_PDF),
  sourcePdfSize: fileSizeLabel(SOURCE_PDF),
  proofOutputRootExists: existsSync(PROOF_ROOT),
  ptProofExists: existsSync(PT_PROOF_PDF),
  proofOutputGitignored: gitignoreCoversProofOutput(),
  envLocalExists: existsSync(ENV_LOCAL),
  envExists: existsSync(ENV_FILE),
  deeplKeyInProcessEnv: Boolean(process.env.DEEPL_AUTH_KEY?.trim()),
  deeplKeyInEnvLocal: envLocalHasDeepLKey(),
  deeplNodeListed: packageHasDependency(DEEPL_PACKAGE),
  migrationExists: existsSync(
    resolve(ROOT, "supabase/migrations/20260630140000_magazine_visual_assets.sql"),
  ),
  platformHelperExists: existsSync(
    resolve(ROOT, "app/lib/magazine/magazineVisualAssetsPlatform.ts"),
  ),
  approvedLookupExists: existsSync(
    resolve(ROOT, "app/lib/magazine/getApprovedMagazineVisualAsset.ts"),
  ),
  deeplProofScriptExists: existsSync(
    resolve(ROOT, "scripts/magazine/proof-translate-deepl.mjs"),
  ),
};

const blockers = [];
if (!checks.sourcePdfExists) blockers.push("SOURCE_PDF_MISSING");
if (!checks.deeplKeyInProcessEnv && !checks.deeplKeyInEnvLocal) blockers.push("DEEPL_AUTH_KEY_MISSING");
if (!checks.deeplKeyInProcessEnv && checks.deeplKeyInEnvLocal) {
  blockers.push("DEEPL_AUTH_KEY_NOT_LOADED_IN_SHELL");
}
if (!checks.deeplNodeListed) blockers.push("DEEPL_NODE_PACKAGE_MISSING");

let decision = "READY_FOR_REAL_PT_SMOKE";
if (!checks.sourcePdfExists) decision = "STOP_HOLD_FOR_SOURCE_PDF";
else if (!checks.platformHelperExists || !checks.migrationExists) decision = "STOP_HOLD_FOR_ARCHITECTURE_GAP";
else if (!checks.deeplNodeListed) decision = "STOP_HOLD_FOR_PROVIDER_DEPENDENCY";
else if (!checks.deeplKeyInProcessEnv && !checks.deeplKeyInEnvLocal) decision = "STOP_HOLD_FOR_DEEPL_ENV";
else if (!checks.deeplKeyInProcessEnv && checks.deeplKeyInEnvLocal) decision = "STOP_HOLD_FOR_DEEPL_ENV";
else if (blockers.length) decision = "HOLD_FOR_CHUY_DECISION";

const nextGate =
  decision === "READY_FOR_REAL_PT_SMOKE"
    ? "MAGAZINE-DEEPL-PT-REAL-SMOKE3"
    : decision === "STOP_HOLD_FOR_SOURCE_PDF"
      ? "MAGAZINE-SOURCE-PDF-RECOVERY1"
      : decision === "STOP_HOLD_FOR_ARCHITECTURE_GAP"
        ? "MAGAZINE-VISUAL-ASSET-ARCHITECTURE-FIX1"
        : decision === "STOP_HOLD_FOR_PROVIDER_DEPENDENCY"
          ? "MAGAZINE-DEEPL-PT-REAL-SMOKE3"
          : "MAGAZINE-DEEPL-ENV-SETUP1";

console.log("# MAGAZINE-DEEPL-READINESS-AUDIT (local script)");
console.log("");
console.log("## Summary");
console.log(`decision=${decision}`);
console.log(`nextGate=${nextGate}`);
console.log(`blockers=${blockers.length ? blockers.join(", ") : "none"}`);
console.log("");
console.log("## Environment");
console.log(`DEEPL_AUTH_KEY present (process.env): ${checks.deeplKeyInProcessEnv}`);
console.log(`DEEPL_AUTH_KEY present (.env.local, value not printed): ${checks.deeplKeyInEnvLocal}`);
console.log(`secret value printed: false`);
console.log(`.env.local exists: ${checks.envLocalExists}`);
console.log(`.env exists: ${checks.envExists}`);
console.log(`${DEEPL_PACKAGE} listed in package.json: ${checks.deeplNodeListed}`);
console.log("");
console.log("## Source Assets");
console.log(`source PDF exists: ${checks.sourcePdfExists}`);
console.log(`source PDF path: public/magazine/2026/june/leonix_media_june.pdf`);
console.log(`source PDF size: ${checks.sourcePdfSize ?? "n/a"}`);
console.log(`proof output folder exists: ${checks.proofOutputRootExists}`);
console.log(`proof output gitignored: ${checks.proofOutputGitignored}`);
console.log(`PT proof PDF exists: ${checks.ptProofExists}`);
console.log("");
console.log("## Architecture");
console.log(`magazine_visual_assets migration exists: ${checks.migrationExists}`);
console.log(`platform helper exists: ${checks.platformHelperExists}`);
console.log(`approved lookup helper exists: ${checks.approvedLookupExists}`);
console.log(`DeepL proof script exists: ${checks.deeplProofScriptExists}`);
console.log("");
console.log(`result=${decision === "READY_FOR_REAL_PT_SMOKE" ? "PASS" : "HOLD"}`);

process.exit(decision === "READY_FOR_REAL_PT_SMOKE" ? 0 : 2);
