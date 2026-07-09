#!/usr/bin/env node
/**
 * August 2026 Portuguese Batch 1 — Pages 12, 6 & 3 DeepL digital proof (max three calls).
 *
 * Gate: AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL1
 * Usage: node scripts/magazine/proof-translate-august-portuguese-batch1-deepl.mjs --target=pt-br [--dry-run|--execute]
 *
 * Never prints DEEPL_AUTH_KEY. Never modifies source input PDFs. Never writes to public/.
 * Max 3 provider calls total (one per page). No retries.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as deepl from "deepl-node";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GATE = "AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL1";
const NEXT_GATE_SUCCESS = "AUGUST-2026-PORTUGUESE-PROOF-BATCH1-WEB-QA-URL1";
const NEXT_GATE_TRIAGE = "AUGUST-2026-PORTUGUESE-PROOF-BATCH1-PROVIDER-TRIAGE1";
const TARGET = "pt-br";
const DEEPL_TARGET = "PT-BR";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PROVIDER_CALLS = 3;
const BLOCKED_FLAGS = ["--full", "--all"];
const ALLOWED_TARGETS = new Set(["pt-br", "pt"]);
const BLOCKED_TARGETS = new Set(["en", "tl", "ar", "fa", "vi", "ja", "pa", "hi", "ru", "zh", "all", "*"]);
const ALLOWED_PAGE_NUMBERS = new Set([12, 6, 3]);

const PAGES = [
  {
    pageNumber: 12,
    pageTitle: "Sé parte del movimiento Leonix",
    inputPath:
      ".magazine-proof-output/2026-august/_inputs/issue-foundation/es/page-012/source-page-012-from-png.pdf",
    outputDir: ".magazine-proof-output/2026-august/pt/page-smoke/page-012",
    outputPdf: "deepl-page-012.pt.pdf",
    inputFilename: "source-page-012-from-png.pdf",
    riskLevel: "HIGH",
    layoutType: "back_cover_house_ad",
    qaFocus: "movement/CTA language, QR/contact readability, brand tone, overflow/crop",
  },
  {
    pageNumber: 6,
    pageTitle: "Negocios que construyen comunidad",
    inputPath:
      ".magazine-proof-output/2026-august/_inputs/issue-foundation/es/page-006/source-page-006-from-png.pdf",
    outputDir: ".magazine-proof-output/2026-august/pt/page-smoke/page-006",
    outputPdf: "deepl-page-006.pt.pdf",
    inputFilename: "source-page-006-from-png.pdf",
    riskLevel: "MEDIUM",
    layoutType: "editorial_business_community",
    qaFocus: "editorial/community tone, business/community language, CTA readability, layout usability",
  },
  {
    pageNumber: 3,
    pageTitle: "Cali Bear Tacos full-page ad",
    inputPath:
      ".magazine-proof-output/2026-august/_inputs/issue-foundation/es/page-003/source-page-003-from-png.pdf",
    outputDir: ".magazine-proof-output/2026-august/pt/page-smoke/page-003",
    outputPdf: "deepl-page-003.pt.pdf",
    inputFilename: "source-page-003-from-png.pdf",
    riskLevel: "HIGH",
    layoutType: "client_restaurant_ad",
    qaFocus:
      "Cali Bear Tacos name preservation, food/menu/offer language, client ad tone, contact preservation, overflow/crop",
  },
];

const DECISION_OPTIONS = [
  "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES",
  "FIX_NEEDED",
  "REBUILD_SOURCE_NEEDED",
  "COMPANION_LAYER_NEEDED",
  "HOLD_FOR_PORTUGUESE_REVIEWER",
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
  return {
    gate: GATE,
    page: pageConfig.pageNumber,
    language: "Portuguese",
    riskLevel: pageConfig.riskLevel,
    layoutType: pageConfig.layoutType,
    businessCriticalQaFocus: pageConfig.qaFocus,
    chuyQaStatus: "NOT_REVIEWED",
    portugueseReviewerStatus: "NEEDED_OR_PENDING",
    translationWorked: "TBD",
    layoutUsable: "TBD",
    textOverflowCrop: "TBD",
    businessNamePreserved: pageConfig.pageNumber === 3 ? "TBD" : "N/A",
    brandPreserved: "TBD",
    ctaPreserved: "TBD",
    qrReadable: pageConfig.pageNumber === 12 ? "TBD" : "N/A",
    notes: "",
    decision: "TBD",
    decisionOptions: DECISION_OPTIONS,
  };
}

function buildReadme(pageConfig, providerCalled, providerStatus) {
  return `# Page ${pageConfig.pageNumber} Portuguese DeepL Digital Proof (August 2026 · Batch PT-1)

Gate: \`${GATE}\`

## Status

- **Local Portuguese proof only** — not public, not final, not print-ready, not FlipHTML5-ready
- **Printed magazine remains Spanish-only**
- **Translated editions are digital-only**
- **Portuguese digital proof requires Chuy/reviewer polish before public use**
- Provider called: **${providerCalled ? "yes" : "no"}**
- Provider status: **${providerStatus ?? "n/a"}**

## Page Profile

| Field | Value |
|-------|-------|
| Page | ${pageConfig.pageNumber} |
| Title | ${pageConfig.pageTitle} |
| Risk level | ${pageConfig.riskLevel} |
| Layout type | ${pageConfig.layoutType} |
| Business-critical QA focus | ${pageConfig.qaFocus} |

## Files

| File | Purpose |
|------|---------|
| \`${pageConfig.outputPdf}\` | DeepL Portuguese output (if provider succeeded) |
| \`deepl-status.json\` | Provider status summary |
| \`metadata.json\` | Proof metadata (no API key) |
| \`visual-qa-template.json\` | Chuy/reviewer visual QA checklist |
| \`README.md\` | This file |

## Chuy / Portuguese Reviewer Visual QA Required

Do not claim translation success until visually verified.
`;
}

async function validatePtBrTarget(client) {
  const targets = await client.getTargetLanguages();
  const supported = targets.some(
    (item) => String(item.code).toUpperCase() === DEEPL_TARGET.toUpperCase(),
  );
  if (!supported) {
    const portugueseCodes = targets
      .map((item) => item.code)
      .filter((code) => String(code).toUpperCase().startsWith("PT"));
    throw new Error(
      `PT-BR not supported by installed DeepL client. Portuguese codes found: ${portugueseCodes.join(", ") || "none"}`,
    );
  }
}

async function runDeepLTranslate(client, pageConfig, inputPath, outputPath) {
  return client.translateDocument(inputPath, outputPath, "es", DEEPL_TARGET, {
    filename: pageConfig.inputFilename,
  });
}

for (const flag of BLOCKED_FLAGS) {
  if (hasFlag(flag)) {
    console.error(`[${GATE}] Refused flag: ${flag}. Batch PT-1 pages 12, 6 & 3 Portuguese only.`);
    process.exit(1);
  }
}

const target = argValue("--target", TARGET).toLowerCase();
if (BLOCKED_TARGETS.has(target)) {
  console.error(`[${GATE}] Refused target: ${target}. Only Portuguese PT-BR is allowed.`);
  process.exit(1);
}
if (!ALLOWED_TARGETS.has(target)) {
  console.error(`[${GATE}] This gate only allows --target=pt-br or --target=pt (DeepL: ${DEEPL_TARGET}).`);
  process.exit(1);
}

const pageArg = argValue("--page", null);
if (pageArg !== null) {
  const pageNumber = Number(pageArg);
  if (!ALLOWED_PAGE_NUMBERS.has(pageNumber)) {
    console.error(`[${GATE}] Refused page: ${pageArg}. Only pages 12, 6, and 3 are allowed.`);
    process.exit(1);
  }
}

const execute = hasFlag("--execute");
const dryRun = hasFlag("--dry-run") || !execute;

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
console.log(`[${GATE}] target=pt-br (DeepL: ${DEEPL_TARGET})`);
console.log(`[${GATE}] pages: 12, 6, 3`);
console.log(`[${GATE}] max provider calls: ${MAX_PROVIDER_CALLS}`);
console.log(`[${GATE}] dependency present=${hasDependency}`);
console.log(`[${GATE}] env key present=${hasKey}`);

function baseMetadataFor(pageConfig, inputHash, inputBytes, callNumber) {
  return {
    gate: GATE,
    pageNumber: pageConfig.pageNumber,
    pageTitle: pageConfig.pageTitle,
    sourceInputPath: pageConfig.inputPath,
    sourceInputHash: inputHash,
    sourceInputBytes: inputBytes,
    targetLanguage: "Portuguese",
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
    reviewRequired: true,
    sourceFlatteningRisk: "IMAGE_FLATTENED_LIKELY",
    extractableTextExpectedFromInput: false,
    pageRisk: pageConfig.riskLevel,
    pageLayoutType: pageConfig.layoutType,
    businessCriticalQaFocus: pageConfig.qaFocus,
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

    const outDir = resolve(ROOT, pageConfig.outputDir);
    mkdirSync(outDir, { recursive: true });

    writeJson(resolve(outDir, "metadata.json"), {
      ...baseMetadataFor(pageConfig, inputHash, inputBytes, callNumber),
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
    console.log(`[${GATE}]   risk: ${pageConfig.riskLevel}`);
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

  try {
    await validatePtBrTarget(client);
    console.log(`[${GATE}] PT-BR target validated.`);
  } catch (err) {
    const msg = sanitizeErrorMessage(err);
    console.error(`[${GATE}] PT-BR target validation failed: ${msg}`);
    process.exit(2);
  }

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

    const outDir = resolve(ROOT, pageConfig.outputDir);
    mkdirSync(outDir, { recursive: true });
    const translatedPath = resolve(outDir, pageConfig.outputPdf);
    const metadataPath = resolve(outDir, "metadata.json");
    const deeplStatusPath = resolve(outDir, "deepl-status.json");
    const base = baseMetadataFor(pageConfig, inputHash, inputBytes, callNumber);

    writeJson(resolve(outDir, "visual-qa-template.json"), buildVisualQaTemplate(pageConfig));

    let deeplStatus = null;
    providerCallsMade += 1;
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
      continue;
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

  const allDone = summary.length === PAGES.length && summary.every((item) => item.status === "done");
  if (allDone) {
    console.log(`[${GATE}] nextGate(success): ${NEXT_GATE_SUCCESS}`);
    process.exit(0);
  }

  console.log(`[${GATE}] nextGate(triage): ${NEXT_GATE_TRIAGE}`);
  process.exit(3);
}

if (dryRun) {
  await processDryRun();
  process.exit(0);
} else {
  await processExecute();
}
