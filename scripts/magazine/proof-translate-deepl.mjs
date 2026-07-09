#!/usr/bin/env node
/**
 * Magazine DeepL document proof — Portuguese only.
 *
 * Single-page mode (default): --target=pt --page=N [--dry-run|--execute]
 * Full local mode (explicit):  --target=pt --full [--dry-run|--execute]
 *
 * Never prints DEEPL_AUTH_KEY. Never modifies source PDF. Never writes to public/.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import * as deepl from "deepl-node";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_SOURCE = "public/magazine/2026/june/leonix_media_june.pdf";
const DEFAULT_PAGE = 3;
const TARGET = "pt";
const DEEPL_TARGET = "PT-BR";
const BLOCKED_TARGETS = new Set(["ar", "fa", "all", "*"]);
const FULL_LOCAL_DIR = ".magazine-proof-output/june-2026/pt/full-local";
const FULL_OUTPUT_NAME = "leonix_media_june.pt.pdf";
const IMAGE_FLATTENED_WARNING =
  "Source PDF preflight flagged IMAGE_FLATTENED_LIKELY (~0 extractable text). DeepL may return mostly unchanged output.";
const LOCAL_PROOF_WARNING =
  "Local proof only — not public, not QA-approved, not for reader serving.";
const LAYOUT_WARNING =
  "Image-flattened/high-design PDF may need Canva/source layout correction after QA inventory.";

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
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

async function sha256File(filePath) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

function pageSmokeDir(page) {
  const padded = String(page).padStart(3, "0");
  return resolve(ROOT, `.magazine-proof-output/june-2026/pt/page-smoke/page-${padded}`);
}

function pageFileNames(page) {
  const padded = String(page).padStart(3, "0");
  return {
    sourceOnePage: `source-page-${padded}.pdf`,
    translated: `deepl-page-${padded}.pt.pdf`,
    metadata: "metadata.json",
    deeplStatus: "deepl-status.json",
  };
}

function fullLocalDir() {
  return resolve(ROOT, FULL_LOCAL_DIR);
}

function sanitizeErrorMessage(err) {
  const key = process.env.DEEPL_AUTH_KEY?.trim();
  let msg = err instanceof Error ? err.message : String(err);
  if (key && msg.includes(key)) {
    msg = msg.split(key).join("[REDACTED]");
  }
  return msg;
}

async function getSourcePageCount(sourcePdfPath) {
  const sourceBytes = readFileSync(sourcePdfPath);
  const sourceDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  return sourceDoc.getPageCount();
}

async function extractSinglePage(sourcePdfPath, pageNumber, outputPath) {
  const sourceBytes = readFileSync(sourcePdfPath);
  const sourceDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const pageCount = sourceDoc.getPageCount();
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
    throw new Error(`Page ${pageNumber} out of range (document has ${pageCount} pages).`);
  }
  const newDoc = await PDFDocument.create();
  const [copied] = await newDoc.copyPages(sourceDoc, [pageNumber - 1]);
  newDoc.addPage(copied);
  const pdfBytes = await newDoc.save();
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, pdfBytes);
  return { pageCount, onePageBytes: pdfBytes.length };
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildVisualQaTemplate(pageCount) {
  const pages = [];
  for (let p = 1; p <= pageCount; p += 1) {
    const row = {
      page: p,
      chuyQaStatus: "NOT_REVIEWED",
      translationWorked: "TBD",
      layoutUsable: "TBD",
      textOverflowCrop: "TBD",
      contactTruthIssue: "TBD",
      notes: "",
    };
    if (p === 3) {
      row.notes =
        "Prior single-page smoke: translation worked; layout mostly preserved; alignment/line-height polish needed; Suite 202 should be Suite 201 (871 Coleman Ave, San Jose, CA 95110).";
      row.contactTruthIssue = "Suite 202 incorrect — canonical Suite 201";
    }
    if (p === 4) {
      row.notes =
        "Prior single-page smoke: translation worked; cleaner layout; card spacing may need polish; Suite 202 should be Suite 201.";
      row.contactTruthIssue = "Suite 202 incorrect — canonical Suite 201";
    }
    pages.push(row);
  }
  return {
    gate: "MAGAZINE-DEEPL-PT-FULL-LOCAL-PROOF1",
    pageCount,
    canonicalContactTruth: {
      business: "Leonix Media / Leonix Global LLC",
      email: "info@leonixmedia.com",
      phone: "(408) 360-6500",
      address: "871 Coleman Avenue, Suite 201, San Jose, CA 95110",
      notCurrentTruth: ["Suite 202", "275 Coleman"],
    },
    pages,
  };
}

async function runDeepLTranslate(inputPath, outputPath, inputFilename) {
  loadEnvLocal();
  const authKey = process.env.DEEPL_AUTH_KEY?.trim();
  if (!authKey) {
    throw new Error("DEEPL_AUTH_KEY is required for --execute. Value was not printed.");
  }
  const client = new deepl.DeepLClient(authKey);
  return client.translateDocument(inputPath, outputPath, "es", DEEPL_TARGET, {
    filename: inputFilename,
  });
}

const fullMode = hasFlag("--full");
const sourcePdf = resolve(ROOT, argValue("--source", DEFAULT_SOURCE));
const target = argValue("--target", TARGET);
const execute = hasFlag("--execute");
const dryRun = hasFlag("--dry-run") || !execute;

if (BLOCKED_TARGETS.has(target)) {
  console.error("[magazine proof-translate-deepl] Held inactive or broad/all languages target refused.");
  process.exit(1);
}

if (target !== TARGET) {
  console.error("[magazine proof-translate-deepl] This smoke gate only allows target language pt.");
  process.exit(1);
}

if (!existsSync(sourcePdf)) {
  console.error("[magazine proof-translate-deepl] Source PDF missing. Expected:", sourcePdf);
  process.exit(1);
}

loadEnvLocal();

const DEEPL_PACKAGES = ["deepl-node", "@deepl/deepl-node"];
const hasDependency = DEEPL_PACKAGES.some((name) => packageHasDependency(name));
const hasKey = Boolean(process.env.DEEPL_AUTH_KEY?.trim());
const sourcePdfHash = await sha256File(sourcePdf);
const sourcePdfBytes = statSync(sourcePdf).size;

if (fullMode) {
  if (process.argv.some((a) => a.startsWith("--page="))) {
    console.log("[magazine proof-translate-deepl] note: --page ignored in --full mode (entire source PDF used).");
  }

  const outputDir = fullLocalDir();
  const translatedOutputPath = resolve(outputDir, FULL_OUTPUT_NAME);
  const metadataPath = resolve(outputDir, "metadata.json");
  const deeplStatusPath = resolve(outputDir, "deepl-status.json");
  const visualQaPath = resolve(outputDir, "visual-qa-template.json");

  let pageCount = null;
  try {
    pageCount = await getSourcePageCount(sourcePdf);
  } catch (err) {
    console.error("[magazine proof-translate-deepl] PAGE_COUNT_FAILED:", sanitizeErrorMessage(err));
    process.exit(1);
  }

  console.log("[magazine proof-translate-deepl] mode=", dryRun ? "full-local-dry-run" : "full-local-execute");
  console.log("[magazine proof-translate-deepl] target=pt (DeepL:", DEEPL_TARGET + ")");
  console.log("[magazine proof-translate-deepl] full mode=true");
  console.log("[magazine proof-translate-deepl] source PDF present=true");
  console.log("[magazine proof-translate-deepl] sourcePdfHash:", sourcePdfHash);
  console.log("[magazine proof-translate-deepl] sourcePdfBytes:", sourcePdfBytes);
  console.log("[magazine proof-translate-deepl] sourcePageCount:", pageCount);
  console.log(`[magazine proof-translate-deepl] dependency present=${hasDependency}`);
  console.log(`[magazine proof-translate-deepl] env present=${hasKey}`);
  console.log("[magazine proof-translate-deepl] output path:", translatedOutputPath);

  const baseMetadata = {
    gate: "MAGAZINE-DEEPL-PT-FULL-LOCAL-PROOF1",
    mode: "full-local",
    sourcePath: argValue("--source", DEFAULT_SOURCE),
    sourcePdfHash,
    sourcePdfBytes,
    sourcePageCount: pageCount,
    targetLanguage: TARGET,
    deeplTargetLanguage: DEEPL_TARGET,
    translatedOutputPath: `${FULL_LOCAL_DIR}/${FULL_OUTPUT_NAME}`,
    timestamp: new Date().toISOString(),
    providerCalled: false,
    translatedOutputExists: false,
    qaApproved: false,
    publiclyAvailable: false,
    dryRun,
    warnings: [IMAGE_FLATTENED_WARNING, LOCAL_PROOF_WARNING, LAYOUT_WARNING],
    secretPrinted: false,
  };

  writeJson(visualQaPath, buildVisualQaTemplate(pageCount));

  if (dryRun) {
    writeJson(metadataPath, {
      ...baseMetadata,
      result: "DRY_RUN_ONLY",
      message: "Full local mode checks passed. No paid DeepL API call.",
    });
    console.log("[magazine proof-translate-deepl] metadata written:", metadataPath);
    console.log("[magazine proof-translate-deepl] visual QA template written:", visualQaPath);
    console.log("[magazine proof-translate-deepl] dry run only. No paid API called.");
    process.exit(0);
  }

  if (!hasDependency) {
    console.error("[magazine proof-translate-deepl] HOLD: install deepl-node before executing document smoke.");
    process.exit(1);
  }

  if (!hasKey) {
    console.error("[magazine proof-translate-deepl] HOLD: DEEPL_AUTH_KEY is required. Value was not printed.");
    process.exit(1);
  }

  let deeplStatus = null;
  try {
    console.log("[magazine proof-translate-deepl] submitting FULL source PDF to DeepL (one call only)...");
    deeplStatus = await runDeepLTranslate(sourcePdf, translatedOutputPath, "leonix_media_june.pdf");
    console.log("[magazine proof-translate-deepl] DeepL full document translation completed.");
  } catch (err) {
    const msg = sanitizeErrorMessage(err);
    writeJson(metadataPath, {
      ...baseMetadata,
      providerCalled: true,
      result: "DEEPL_CALL_FAILED",
      error: msg,
    });
    if (err?.documentHandle) {
      writeJson(deeplStatusPath, {
        documentId: err.documentHandle.documentId,
        documentKey: "[present-not-logged]",
        error: msg,
      });
    }
    console.error("[magazine proof-translate-deepl] DEEPL_CALL_FAILED:", msg);
    process.exit(1);
  }

  const translatedExists = existsSync(translatedOutputPath);
  const translatedSize = translatedExists ? statSync(translatedOutputPath).size : 0;

  writeJson(deeplStatusPath, {
    status: deeplStatus?.status ?? null,
    billedCharacters: deeplStatus?.billedCharacters ?? null,
    secondsRemaining: deeplStatus?.secondsRemaining ?? null,
    errorMessage: deeplStatus?.errorMessage ?? null,
  });

  writeJson(metadataPath, {
    ...baseMetadata,
    providerCalled: true,
    translatedOutputExists: translatedExists,
    translatedOutputBytes: translatedSize,
    result: translatedExists ? "OUTPUT_FILE_GENERATED" : "OUTPUT_MISSING",
    message: translatedExists
      ? "Full local Portuguese proof PDF generated. Page-by-page visual QA required — not public, not QA-approved."
      : "DeepL call completed but output file missing.",
    deeplStatus: {
      status: deeplStatus?.status ?? null,
      billedCharacters: deeplStatus?.billedCharacters ?? null,
    },
  });

  console.log("[magazine proof-translate-deepl] translated output exists:", translatedExists);
  console.log("[magazine proof-translate-deepl] translated output path:", translatedOutputPath);
  console.log("[magazine proof-translate-deepl] translated output bytes:", translatedSize);
  console.log("[magazine proof-translate-deepl] metadata written:", metadataPath);
  console.log("[magazine proof-translate-deepl] deepl status written:", deeplStatusPath);
  console.log("[magazine proof-translate-deepl] visual QA template written:", visualQaPath);

  if (!translatedExists) {
    console.error("[magazine proof-translate-deepl] OUTPUT_MISSING after DeepL call.");
    process.exit(1);
  }

  process.exit(0);
}

// --- Single-page mode (unchanged behavior) ---
const pageRaw = argValue("--page", String(DEFAULT_PAGE));
const page = Number.parseInt(pageRaw, 10);
const outDirOverride = argValue("--out-dir", "");
const smokeDir = outDirOverride ? resolve(ROOT, outDirOverride) : pageSmokeDir(page);
const names = pageFileNames(page);
const onePageSourcePath = resolve(smokeDir, names.sourceOnePage);
const translatedOutputPath = resolve(smokeDir, names.translated);
const metadataPath = resolve(smokeDir, names.metadata);
const deeplStatusPath = resolve(smokeDir, names.deeplStatus);

if (!Number.isInteger(page) || page < 1) {
  console.error("[magazine proof-translate-deepl] --page must be a positive integer.");
  process.exit(1);
}

console.log("[magazine proof-translate-deepl] mode=", dryRun ? "page-dry-run" : "page-execute");
console.log("[magazine proof-translate-deepl] target=pt (DeepL:", DEEPL_TARGET + ")");
console.log("[magazine proof-translate-deepl] page=", page);
console.log("[magazine proof-translate-deepl] source PDF present=true");
console.log("[magazine proof-translate-deepl] sourcePdfHash:", sourcePdfHash);
console.log(`[magazine proof-translate-deepl] dependency present=${hasDependency}`);
console.log(`[magazine proof-translate-deepl] env present=${hasKey}`);
console.log("[magazine proof-translate-deepl] output directory:", smokeDir);

let extraction;
try {
  extraction = await extractSinglePage(sourcePdf, page, onePageSourcePath);
  console.log("[magazine proof-translate-deepl] one-page source extracted=true");
  console.log("[magazine proof-translate-deepl] source page count:", extraction.pageCount);
  console.log("[magazine proof-translate-deepl] one-page source path:", onePageSourcePath);
  console.log("[magazine proof-translate-deepl] one-page source bytes:", extraction.onePageBytes);
} catch (err) {
  console.error("[magazine proof-translate-deepl] PAGE_EXTRACTION_FAILED:", sanitizeErrorMessage(err));
  process.exit(1);
}

const onePageHash = await sha256File(onePageSourcePath);
const baseMetadata = {
  gate: "MAGAZINE-DEEPL-PT-SINGLE-PAGE-SMOKE1",
  mode: "page-smoke",
  sourcePath: argValue("--source", DEFAULT_SOURCE),
  sourcePdfHash,
  selectedPage: page,
  sourcePageCount: extraction.pageCount,
  targetLanguage: TARGET,
  deeplTargetLanguage: DEEPL_TARGET,
  onePageSourcePath: onePageSourcePath.replace(/\\/g, "/").replace(`${ROOT.replace(/\\/g, "/")}/`, ""),
  onePageSourceHash: onePageHash,
  onePageSourceBytes: extraction.onePageBytes,
  translatedOutputPath: names.translated,
  timestamp: new Date().toISOString(),
  providerCalled: false,
  translatedOutputExists: false,
  dryRun,
  warnings: [IMAGE_FLATTENED_WARNING, LOCAL_PROOF_WARNING],
  secretPrinted: false,
};

if (dryRun) {
  writeJson(metadataPath, {
    ...baseMetadata,
    result: "DRY_RUN_ONLY",
    message: "One-page source extracted locally. No paid DeepL API call.",
  });
  console.log("[magazine proof-translate-deepl] metadata written:", metadataPath);
  console.log("[magazine proof-translate-deepl] dry run only. No paid API called.");
  process.exit(0);
}

if (!hasDependency) {
  console.error("[magazine proof-translate-deepl] HOLD: install deepl-node before executing document smoke.");
  process.exit(1);
}

if (!hasKey) {
  console.error("[magazine proof-translate-deepl] HOLD: DEEPL_AUTH_KEY is required. Value was not printed.");
  process.exit(1);
}

let deeplStatus = null;
try {
  console.log("[magazine proof-translate-deepl] submitting one-page PDF to DeepL (not full magazine)...");
  deeplStatus = await runDeepLTranslate(onePageSourcePath, translatedOutputPath, `source-page-${String(page).padStart(3, "0")}.pdf`);
  console.log("[magazine proof-translate-deepl] DeepL document translation completed.");
} catch (err) {
  const msg = sanitizeErrorMessage(err);
  writeJson(metadataPath, {
    ...baseMetadata,
    providerCalled: true,
    result: "DEEPL_CALL_FAILED",
    error: msg,
  });
  if (err?.documentHandle) {
    writeJson(deeplStatusPath, {
      documentId: err.documentHandle.documentId,
      documentKey: "[present-not-logged]",
      error: msg,
    });
  }
  console.error("[magazine proof-translate-deepl] DEEPL_CALL_FAILED:", msg);
  process.exit(1);
}

const translatedExists = existsSync(translatedOutputPath);
const translatedSize = translatedExists ? statSync(translatedOutputPath).size : 0;

writeJson(deeplStatusPath, {
  status: deeplStatus?.status ?? null,
  billedCharacters: deeplStatus?.billedCharacters ?? null,
  secondsRemaining: deeplStatus?.secondsRemaining ?? null,
  errorMessage: deeplStatus?.errorMessage ?? null,
});

writeJson(metadataPath, {
  ...baseMetadata,
  providerCalled: true,
  translatedOutputExists: translatedExists,
  translatedOutputBytes: translatedSize,
  result: translatedExists ? "OUTPUT_FILE_GENERATED" : "OUTPUT_MISSING",
  message: translatedExists
    ? "DeepL returned a local proof PDF. Manual QA required — do not treat as public translation."
    : "DeepL call completed but output file missing.",
  deeplStatus: {
    status: deeplStatus?.status ?? null,
    billedCharacters: deeplStatus?.billedCharacters ?? null,
  },
});

console.log("[magazine proof-translate-deepl] translated output exists:", translatedExists);
console.log("[magazine proof-translate-deepl] translated output path:", translatedOutputPath);
console.log("[magazine proof-translate-deepl] translated output bytes:", translatedSize);
console.log("[magazine proof-translate-deepl] metadata written:", metadataPath);
console.log("[magazine proof-translate-deepl] deepl status written:", deeplStatusPath);

if (!translatedExists) {
  console.error("[magazine proof-translate-deepl] OUTPUT_MISSING after DeepL call.");
  process.exit(1);
}

process.exit(0);
