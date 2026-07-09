#!/usr/bin/env node
/**
 * August 2026 Batch 2 — Pages 5 & 6 English DeepL digital proof (two pages, max two calls).
 *
 * Gate: AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF1
 * Usage: node scripts/magazine/proof-translate-august-batch2-pages5-6-deepl.mjs --target=en [--dry-run|--execute]
 *
 * Never prints DEEPL_AUTH_KEY. Never modifies source input PDFs. Never writes to public/.
 * Max 2 provider calls total (one per page). No retries.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as deepl from "deepl-node";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GATE = "AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF1";
const NEXT_GATE_SUCCESS = "AUGUST-2026-BATCH2-PAGES5-6-WEB-QA-URL1";
const TARGET = "en";
const DEEPL_TARGET = "EN-US";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PROVIDER_CALLS = 2;
const BLOCKED_FLAGS = ["--full", "--all"];
const BLOCKED_TARGETS = new Set(["pt", "ar", "fa", "vi", "ja", "pa", "all", "*"]);

const PAGES = [
  {
    pageNumber: 5,
    inputPath: ".magazine-proof-output/2026-august/_inputs/page-smoke/page-005/source-page-005-from-png.pdf",
    inputMetaPath: ".magazine-proof-output/2026-august/_inputs/page-smoke/page-005/metadata.json",
    outputDir: ".magazine-proof-output/2026-august/en/page-smoke/page-005",
    outputPdf: "deepl-page-005.en.pdf",
    inputFilename: "source-page-005-from-png.pdf",
    riskLevel: "HIGH",
    layoutType: "dense event/card layout",
    qaFocus: "Card lists, event blocks, short copy, possible overflow after translation",
  },
  {
    pageNumber: 6,
    inputPath: ".magazine-proof-output/2026-august/_inputs/page-smoke/page-006/source-page-006-from-png.pdf",
    inputMetaPath: ".magazine-proof-output/2026-august/_inputs/page-smoke/page-006/metadata.json",
    outputDir: ".magazine-proof-output/2026-august/en/page-smoke/page-006",
    outputPdf: "deepl-page-006.en.pdf",
    inputFilename: "source-page-006-from-png.pdf",
    riskLevel: "MEDIUM",
    layoutType: "editorial/business community page",
    qaFocus: "Headline/body/card mix with Leonix CTA; text shift after translation",
  },
];

const DECISION_OPTIONS = [
  "APPROVED_FOR_DIGITAL_PROOF",
  "FIX_NEEDED",
  "REBUILD_SOURCE_NEEDED",
  "COMPANION_LAYER_NEEDED",
];

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

function buildVisualQaTemplate(pageConfig) {
  const contactRelevant = false; // Pages 5 and 6 are not contact-block pages
  return {
    gate: GATE,
    page: pageConfig.pageNumber,
    language: "English",
    riskLevel: pageConfig.riskLevel,
    layoutType: pageConfig.layoutType,
    chuyQaStatus: "NOT_REVIEWED",
    translationWorked: "TBD",
    layoutUsable: "TBD",
    textOverflowCrop: "TBD",
    contactTruthIssue: contactRelevant ? "TBD" : "N/A",
    brandPreserved: "TBD",
    qrReadable: "TBD",
    notes: "",
    decision: "TBD",
    decisionOptions: DECISION_OPTIONS,
  };
}

function buildReadme(pageConfig, providerCalled, providerStatus) {
  return `# Page ${pageConfig.pageNumber} English DeepL Digital Proof (August 2026 · Batch 2)

Gate: \`${GATE}\`

## Status

- **Local proof only** — not public, not final, not print-ready, not FlipHTML5-ready
- **English digital translation experiment**
- **Printed magazine remains Spanish-only**
- **Translated editions are digital-only**
- Provider called: **${providerCalled ? "yes" : "no"}**
- Provider status: **${providerStatus ?? "n/a"}**

## Page Profile

| Field | Value |
|-------|-------|
| Page | ${pageConfig.pageNumber} |
| Risk level | ${pageConfig.riskLevel} |
| Layout type | ${pageConfig.layoutType} |
| QA focus | ${pageConfig.qaFocus} |

## Files

| File | Purpose |
|------|---------|
| \`${pageConfig.outputPdf}\` | DeepL English output (if provider succeeded) |
| \`deepl-status.json\` | Provider status summary |
| \`metadata.json\` | Proof metadata (no API key) |
| \`visual-qa-template.json\` | Chuy visual QA checklist |
| \`README.md\` | This file |

## Chuy Visual QA Required

Do not claim translation success until visually verified.
`;
}

async function runDeepLTranslate(client, pageConfig, inputPath, outputPath) {
  return client.translateDocument(inputPath, outputPath, "es", DEEPL_TARGET, {
    filename: pageConfig.inputFilename,
  });
}

// --- argv guards ---
for (const flag of BLOCKED_FLAGS) {
  if (hasFlag(flag)) {
    console.error(`[${GATE}] Refused flag: ${flag}. Batch 2 pages 5 & 6 English only.`);
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

// --- verify both inputs exist and under limit ---
for (const pageConfig of PAGES) {
  const inputPath = resolve(ROOT, pageConfig.inputPath);
  if (!existsSync(inputPath)) {
    console.error(`[${GATE}] Source input missing for Page ${pageConfig.pageNumber}: ${pageConfig.inputPath}`);
    process.exit(1);
  }
  const inputBytes = statSync(inputPath).size;
  if (inputBytes >= MAX_BYTES) {
    console.error(`[${GATE}] Page ${pageConfig.pageNumber} input exceeds 10 MB (${inputBytes} bytes).`);
    process.exit(1);
  }
}

loadEnvLocal();
const hasDependency = packageHasDependency("deepl-node");
const hasKey = Boolean(process.env.DEEPL_AUTH_KEY?.trim());

console.log(`[${GATE}] mode=`, dryRun ? "dry-run" : "execute");
console.log(`[${GATE}] target=en (DeepL: ${DEEPL_TARGET})`);
console.log(`[${GATE}] pages: 5, 6`);
console.log(`[${GATE}] max provider calls: ${MAX_PROVIDER_CALLS}`);
console.log(`[${GATE}] dependency present=${hasDependency}`);
console.log(`[${GATE}] env key present=${hasKey}`);

function baseMetadataFor(pageConfig, inputHash, inputBytes, inputMeta, callNumber) {
  return {
    gate: GATE,
    pageNumber: pageConfig.pageNumber,
    sourceInputPath: pageConfig.inputPath,
    sourceInputHash: inputHash,
    sourceInputBytes: inputBytes,
    targetLanguage: "English",
    deeplTargetLanguage: DEEPL_TARGET,
    translatedOutputPath: `${pageConfig.outputDir}/${pageConfig.outputPdf}`,
    provider: "DeepL",
    providerCallNumber: callNumber,
    providerTotalCallLimit: MAX_PROVIDER_CALLS,
    providerCalled: false,
    publicAsset: false,
    finalPdf: false,
    printReady: false,
    digitalProofOnly: true,
    sourceFlatteningRisk: inputMeta.expectedDeepLBehavior ?? "IMAGE_FLATTENED_LIKELY",
    extractableTextExpectedFromInput: inputMeta.extractableTextExpected ?? false,
    pageRisk: pageConfig.riskLevel,
    pageLayoutType: pageConfig.layoutType,
    nextQaDecisionOptions: DECISION_OPTIONS,
    timestamp: new Date().toISOString(),
    dryRun,
  };
}

async function processDryRun() {
  let callNumber = 0;
  for (const pageConfig of PAGES) {
    callNumber += 1;
    const inputPath = resolve(ROOT, pageConfig.inputPath);
    const inputBytes = statSync(inputPath).size;
    const inputHash = await sha256File(inputPath);
    let inputMeta = {};
    const metaPath = resolve(ROOT, pageConfig.inputMetaPath);
    if (existsSync(metaPath)) inputMeta = JSON.parse(readFileSync(metaPath, "utf8"));

    const outDir = resolve(ROOT, pageConfig.outputDir);
    mkdirSync(outDir, { recursive: true });

    writeJson(resolve(outDir, "metadata.json"), {
      ...baseMetadataFor(pageConfig, inputHash, inputBytes, inputMeta, callNumber),
      providerStatus: "skipped",
      result: "DRY_RUN_ONLY",
      message: "Checks passed. No DeepL API call.",
    });
    writeJson(resolve(outDir, "visual-qa-template.json"), buildVisualQaTemplate(pageConfig));
    writeFileSync(resolve(outDir, "README.md"), buildReadme(pageConfig, false, "skipped (dry-run)"));

    console.log(`[${GATE}] Page ${pageConfig.pageNumber} dry-run OK`);
    console.log(`[${GATE}]   input bytes: ${inputBytes}`);
    console.log(`[${GATE}]   input hash: ${inputHash}`);
    console.log(`[${GATE}]   output dir: ${pageConfig.outputDir}`);
  }
  console.log(`[${GATE}] dry run only. No paid API called.`);
}

async function processExecute() {
  if (!hasDependency) {
    console.error(`[${GATE}] deepl-node dependency missing.`);
    process.exit(1);
  }
  if (!hasKey) {
    console.error(`[${GATE}] DEEPL_AUTH_KEY missing. Not printed.`);
    process.exit(1);
  }

  const authKey = process.env.DEEPL_AUTH_KEY.trim();
  const client = new deepl.DeepLClient(authKey);

  let providerCallsMade = 0;
  const summary = [];

  for (const pageConfig of PAGES) {
    if (providerCallsMade >= MAX_PROVIDER_CALLS) {
      console.error(`[${GATE}] Provider call limit reached; skipping Page ${pageConfig.pageNumber}.`);
      break;
    }

    const callNumber = providerCallsMade + 1;
    const inputPath = resolve(ROOT, pageConfig.inputPath);
    const inputBytes = statSync(inputPath).size;
    const inputHash = await sha256File(inputPath);
    let inputMeta = {};
    const metaPath = resolve(ROOT, pageConfig.inputMetaPath);
    if (existsSync(metaPath)) inputMeta = JSON.parse(readFileSync(metaPath, "utf8"));

    const outDir = resolve(ROOT, pageConfig.outputDir);
    mkdirSync(outDir, { recursive: true });
    const translatedPath = resolve(outDir, pageConfig.outputPdf);
    const metadataPath = resolve(outDir, "metadata.json");
    const deeplStatusPath = resolve(outDir, "deepl-status.json");
    const base = baseMetadataFor(pageConfig, inputHash, inputBytes, inputMeta, callNumber);

    writeJson(resolve(outDir, "visual-qa-template.json"), buildVisualQaTemplate(pageConfig));

    let deeplStatus = null;
    providerCallsMade += 1; // count the attempt (no retries)
    try {
      console.log(`[${GATE}] Page ${pageConfig.pageNumber}: calling DeepL translateDocument (call ${callNumber})...`);
      deeplStatus = await runDeepLTranslate(client, pageConfig, inputPath, translatedPath);
    } catch (err) {
      const msg = sanitizeErrorMessage(err);
      writeJson(deeplStatusPath, {
        status: "failed",
        errorMessage: msg,
        providerCallAttempted: true,
        providerCallNumber: callNumber,
      });
      writeJson(metadataPath, {
        ...base,
        providerCallAttempted: true,
        providerCalled: false,
        providerStatus: "failed",
        result: "DEEPL_CALL_FAILED",
        error: msg,
      });
      writeFileSync(resolve(outDir, "README.md"), buildReadme(pageConfig, true, "failed"));
      console.error(`[${GATE}] Page ${pageConfig.pageNumber} DEEPL_CALL_FAILED: ${msg}`);
      summary.push({ page: pageConfig.pageNumber, status: "failed" });
      continue; // do NOT retry; proceed to next page (still within call limit)
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
      providerCallNumber: callNumber,
    });

    writeJson(metadataPath, {
      ...base,
      providerCallAttempted: true,
      providerCalled: translatedExists,
      providerStatus: deeplStatus?.status ?? (translatedExists ? "done" : "unknown"),
      translatedOutputExists: translatedExists,
      translatedOutputBytes: translatedBytes,
      translatedOutputHash: translatedHash,
      result: translatedExists ? "OUTPUT_FILE_GENERATED" : "OUTPUT_MISSING",
      deeplStatus: {
        status: deeplStatus?.status ?? null,
        billedCharacters: deeplStatus?.billedCharacters ?? null,
      },
    });

    writeFileSync(resolve(outDir, "README.md"), buildReadme(pageConfig, true, deeplStatus?.status ?? "done"));

    console.log(`[${GATE}] Page ${pageConfig.pageNumber} output exists: ${translatedExists}`);
    console.log(`[${GATE}] Page ${pageConfig.pageNumber} output bytes: ${translatedBytes}`);
    console.log(`[${GATE}] Page ${pageConfig.pageNumber} billed characters: ${deeplStatus?.billedCharacters ?? "n/a"}`);
    summary.push({ page: pageConfig.pageNumber, status: translatedExists ? "done" : "output-missing" });
  }

  console.log(`[${GATE}] provider calls made: ${providerCallsMade} (limit ${MAX_PROVIDER_CALLS})`);
  console.log(`[${GATE}] summary: ${JSON.stringify(summary)}`);
  console.log(`[${GATE}] nextGate(success): ${NEXT_GATE_SUCCESS}`);

  const anyFailed = summary.some((s) => s.status !== "done");
  if (anyFailed) process.exit(3); // mixed/blocker signal, but outputs/docs already written
}

if (dryRun) {
  await processDryRun();
  process.exit(0);
} else {
  await processExecute();
  process.exit(0);
}
