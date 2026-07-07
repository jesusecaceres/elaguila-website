#!/usr/bin/env node
/**
 * August 2026 Page 12 — English DeepL digital proof (one page, one call).
 *
 * Gate: AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF1
 * Usage: node scripts/magazine/proof-translate-august-page12-deepl.mjs --target=en [--dry-run|--execute]
 *
 * Never prints DEEPL_AUTH_KEY. Never modifies source input PDF. Never writes to public/.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as deepl from "deepl-node";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GATE = "AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF1";
const TARGET = "en";
const DEEPL_TARGET = "EN-US";
const SOURCE_INPUT =
  ".magazine-proof-output/2026-august/_inputs/page-smoke/page-012/source-page-012-from-png.pdf";
const OUTPUT_DIR = ".magazine-proof-output/2026-august/en/page-smoke/page-012";
const OUTPUT_PDF = "deepl-page-012.en.pdf";
const MAX_BYTES = 10 * 1024 * 1024;
const BLOCKED_FLAGS = ["--full", "--all"];
const BLOCKED_TARGETS = new Set(["pt", "ar", "fa", "all", "*"]);

function hasFlag(name) {
  return process.argv.includes(name);
}

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function loadEnvLocal() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function packageHasDependency(packageName) {
  const packageJsonPath = resolve(ROOT, "package.json");
  if (!existsSync(packageJsonPath)) return false;
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  return Boolean(pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName]);
}

function sanitizeErrorMessage(err) {
  const key = process.env.DEEPL_AUTH_KEY?.trim();
  let msg = err instanceof Error ? err.message : String(err);
  if (key && msg.includes(key)) {
    msg = msg.split(key).join("[REDACTED]");
  }
  return msg;
}

async function sha256File(filePath) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildVisualQaTemplate() {
  return {
    gate: GATE,
    page: 12,
    language: "English",
    chuyQaStatus: "NOT_REVIEWED",
    translationWorked: "TBD",
    layoutUsable: "TBD",
    textOverflowCrop: "TBD",
    contactTruthIssue: "TBD",
    suite201Preserved: "TBD",
    noSuite202: "TBD",
    no275Coleman: "TBD",
    notes: "",
    decision: "TBD",
    decisionOptions: [
      "TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF",
      "TRANSLATION_UNCHANGED_OR_FAILED",
      "NEEDS_EDITABLE_SOURCE_REBUILD",
      "NEEDS_COMPANION_TEXT_LAYER",
    ],
  };
}

function buildReadme(providerCalled, providerStatus) {
  return `# Page 12 English DeepL Digital Proof (August 2026)

Gate: \`${GATE}\`

## Status

- **Local proof only** — not public, not final, not print-ready, not FlipHTML5-ready
- **English digital translation experiment**
- **Printed magazine remains Spanish-only**
- **Translated editions are digital-only**
- Provider called: **${providerCalled ? "yes" : "no"}**
- Provider status: **${providerStatus ?? "n/a"}**

## Files

| File | Purpose |
|------|---------|
| \`deepl-page-012.en.pdf\` | DeepL English output (if provider succeeded) |
| \`deepl-status.json\` | Provider status summary |
| \`metadata.json\` | Proof metadata (no API key) |
| \`visual-qa-template.json\` | Chuy visual QA checklist |
| \`README.md\` | This file |

## Chuy Visual QA Required

Do not claim translation success until visually verified.
`;
}

async function runDeepLTranslate(inputPath, outputPath) {
  loadEnvLocal();
  const authKey = process.env.DEEPL_AUTH_KEY?.trim();
  if (!authKey) {
    throw new Error("DEEPL_AUTH_KEY is required for --execute. Value was not printed.");
  }
  const client = new deepl.DeepLClient(authKey);
  return client.translateDocument(inputPath, outputPath, "es", DEEPL_TARGET, {
    filename: "source-page-012-from-png.pdf",
  });
}

// --- argv guards ---
for (const flag of BLOCKED_FLAGS) {
  if (hasFlag(flag)) {
    console.error(`[${GATE}] Refused flag: ${flag}. Page 12 English only.`);
    process.exit(1);
  }
}

const target = argValue("--target", TARGET);
if (BLOCKED_TARGETS.has(target) || target !== TARGET) {
  console.error(`[${GATE}] This gate only allows --target=en (DeepL: ${DEEPL_TARGET}).`);
  process.exit(1);
}

const execute = hasFlag("--execute");
const dryRun = hasFlag("--dry-run") || !execute;

const inputPath = resolve(ROOT, SOURCE_INPUT);
if (!existsSync(inputPath)) {
  console.error(`[${GATE}] Source input missing: ${SOURCE_INPUT}`);
  process.exit(1);
}

const inputBytes = statSync(inputPath).size;
if (inputBytes >= MAX_BYTES) {
  console.error(`[${GATE}] Source input exceeds 10 MB (${inputBytes} bytes).`);
  process.exit(1);
}

loadEnvLocal();
const hasDependency = packageHasDependency("deepl-node");
const hasKey = Boolean(process.env.DEEPL_AUTH_KEY?.trim());
const inputHash = await sha256File(inputPath);

const outDir = resolve(ROOT, OUTPUT_DIR);
const translatedPath = resolve(outDir, OUTPUT_PDF);
const metadataPath = resolve(outDir, "metadata.json");
const deeplStatusPath = resolve(outDir, "deepl-status.json");
const visualQaPath = resolve(outDir, "visual-qa-template.json");
const readmePath = resolve(outDir, "README.md");

let inputMeta = {};
const inputMetaPath = resolve(
  ROOT,
  ".magazine-proof-output/2026-august/_inputs/page-smoke/page-012/metadata.json",
);
if (existsSync(inputMetaPath)) {
  inputMeta = JSON.parse(readFileSync(inputMetaPath, "utf8"));
}

console.log(`[${GATE}] mode=`, dryRun ? "dry-run" : "execute");
console.log(`[${GATE}] target=en (DeepL: ${DEEPL_TARGET})`);
console.log(`[${GATE}] source input present=true`);
console.log(`[${GATE}] source input bytes:`, inputBytes);
console.log(`[${GATE}] source input hash:`, inputHash);
console.log(`[${GATE}] expectedDeepLBehavior:`, inputMeta.expectedDeepLBehavior ?? "IMAGE_FLATTENED_LIKELY");
console.log(`[${GATE}] extractableTextExpected:`, inputMeta.extractableTextExpected ?? false);
console.log(`[${GATE}] dependency present=${hasDependency}`);
console.log(`[${GATE}] env key present=${hasKey}`);
console.log(`[${GATE}] output directory:`, OUTPUT_DIR);

const baseMetadata = {
  gate: GATE,
  sourceInputPath: SOURCE_INPUT,
  sourceInputHash: inputHash,
  sourceInputBytes: inputBytes,
  targetLanguage: "English",
  deeplTargetLanguage: DEEPL_TARGET,
  translatedOutputPath: `${OUTPUT_DIR}/${OUTPUT_PDF}`,
  sourceFlatteningRisk: "IMAGE_FLATTENED_LIKELY",
  extractableTextExpectedFromInput: false,
  provider: "DeepL",
  providerCalled: false,
  publicAsset: false,
  finalPdf: false,
  printReady: false,
  digitalProofOnly: true,
  qaApproved: false,
  publiclyAvailable: false,
  secretPrinted: false,
  nextQaDecisionOptions: [
    "TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF",
    "TRANSLATION_UNCHANGED_OR_FAILED",
    "NEEDS_EDITABLE_SOURCE_REBUILD",
    "NEEDS_COMPANION_TEXT_LAYER",
  ],
  timestamp: new Date().toISOString(),
  dryRun,
};

if (dryRun) {
  writeJson(metadataPath, {
    ...baseMetadata,
    result: "DRY_RUN_ONLY",
    message: "Checks passed. No DeepL API call.",
  });
  writeJson(visualQaPath, buildVisualQaTemplate());
  writeFileSync(readmePath, buildReadme(false, null));
  console.log(`[${GATE}] dry run only. No paid API called.`);
  console.log(`[${GATE}] metadata written:`, `${OUTPUT_DIR}/metadata.json`);
  process.exit(0);
}

if (!hasDependency) {
  console.error(`[${GATE}] deepl-node dependency missing.`);
  process.exit(1);
}

if (!hasKey) {
  console.error(`[${GATE}] DEEPL_AUTH_KEY missing. Not printed.`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeJson(visualQaPath, buildVisualQaTemplate());

let deeplStatus = null;
try {
  console.log(`[${GATE}] calling DeepL translateDocument (one call)...`);
  deeplStatus = await runDeepLTranslate(inputPath, translatedPath);
} catch (err) {
  const msg = sanitizeErrorMessage(err);
  writeJson(deeplStatusPath, {
    status: "failed",
    errorMessage: msg,
    providerCallAttempted: true,
  });
  writeJson(metadataPath, {
    ...baseMetadata,
    providerCallAttempted: true,
    providerCalled: false,
    result: "DEEPL_CALL_FAILED",
    error: msg,
  });
  writeFileSync(readmePath, buildReadme(true, "failed"));
  console.error(`[${GATE}] DEEPL_CALL_FAILED:`, msg);
  process.exit(1);
}

const translatedExists = existsSync(translatedPath);
const translatedBytes = translatedExists ? statSync(translatedPath).size : 0;
const translatedHash = translatedExists ? await sha256File(translatedPath) : null;

writeJson(deeplStatusPath, {
  status: deeplStatus?.status ?? null,
  billedCharacters: deeplStatus?.billedCharacters ?? null,
  secondsRemaining: deeplStatus?.secondsRemaining ?? null,
  errorMessage: deeplStatus?.errorMessage ?? null,
  providerCallAttempted: true,
});

writeJson(metadataPath, {
  ...baseMetadata,
  providerCallAttempted: true,
  providerCalled: translatedExists,
  translatedOutputExists: translatedExists,
  translatedOutputBytes: translatedBytes,
  translatedOutputHash: translatedHash,
  result: translatedExists ? "OUTPUT_FILE_GENERATED" : "OUTPUT_MISSING",
  deeplStatus: {
    status: deeplStatus?.status ?? null,
    billedCharacters: deeplStatus?.billedCharacters ?? null,
  },
});

writeFileSync(readmePath, buildReadme(true, deeplStatus?.status ?? "done"));

console.log(`[${GATE}] translated output exists:`, translatedExists);
console.log(`[${GATE}] translated output bytes:`, translatedBytes);
console.log(`[${GATE}] translated output hash:`, translatedHash);
console.log(`[${GATE}] billed characters:`, deeplStatus?.billedCharacters ?? "n/a");

if (!translatedExists) {
  console.error(`[${GATE}] OUTPUT_MISSING after DeepL call.`);
  process.exit(1);
}

process.exit(0);
