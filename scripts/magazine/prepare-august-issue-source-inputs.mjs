#!/usr/bin/env node
/**
 * August 2026 Issue Source Intake Foundation.
 *
 * Gate: AUGUST-2026-ISSUE-MANIFEST-AND-FULL-SOURCE-INTAKE-FOUNDATION1
 * Does NOT call DeepL. Does NOT call Google Translate. Does NOT write to public/.
 * Does NOT modify source PNGs/PDFs. Default mode is dry-run.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GATE = "AUGUST-2026-ISSUE-MANIFEST-AND-FULL-SOURCE-INTAKE-FOUNDATION1";
const MANIFEST_RELATIVE =
  "design-references/magazine/2026-august/august-2026-issue-manifest.json";
const OUTPUT_DIR_RELATIVE =
  ".magazine-proof-output/2026-august/_inputs/issue-foundation";
const ISSUE_ES_OUTPUT_RELATIVE = `${OUTPUT_DIR_RELATIVE}/es`;

const FULL_PDF_FOLDERS = [
  "design-references/magazine/2026-august/02-source-layouts",
  "design-references/magazine/2026-august/03-spanish-final",
  "design-references/magazine/2026-august/06-print-ready-pdf",
];

const PAGE_WIDTH_PT = 576;
const PAGE_HEIGHT_PT = 828;
const TRIM_SIZE = "8 x 11.5 in";
const ALLOWED_SOURCES = new Set(["auto", "full-pdf", "page-png"]);

function usage() {
  return [
    "Usage:",
    "  node scripts/magazine/prepare-august-issue-source-inputs.mjs --source=auto --dry-run",
    "  node scripts/magazine/prepare-august-issue-source-inputs.mjs --source=auto --execute",
    "",
    "Allowed flags:",
    "  --dry-run",
    "  --execute",
    "  --source=auto",
    "  --source=full-pdf",
    "  --source=page-png",
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = {
    dryRun: true,
    execute: false,
    source: "auto",
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--execute") {
      parsed.execute = true;
      parsed.dryRun = false;
      continue;
    }

    if (arg.startsWith("--source=")) {
      const source = arg.slice("--source=".length);
      if (!ALLOWED_SOURCES.has(source)) {
        throw new Error(`unsupported --source value: ${source}\n${usage()}`);
      }
      parsed.source = source;
      continue;
    }

    throw new Error(`unsupported flag: ${arg}\n${usage()}`);
  }

  return parsed;
}

function toRelative(absPath) {
  return relative(ROOT, absPath).replaceAll("\\", "/");
}

function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function readJson(relativePath) {
  const absPath = resolve(ROOT, relativePath);
  return JSON.parse(readFileSync(absPath, "utf8"));
}

function listFilesRecursive(relativeDir, predicate) {
  const rootDir = resolve(ROOT, relativeDir);
  if (!existsSync(rootDir)) {
    return [];
  }

  const results = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absPath);
      } else if (entry.isFile() && predicate(absPath)) {
        results.push(absPath);
      }
    }
  }

  return results.sort((a, b) => toRelative(a).localeCompare(toRelative(b)));
}

function validateManifest(manifest) {
  if (manifest?.issue?.slug !== "2026-august") {
    throw new Error("manifest issue.slug must be 2026-august");
  }

  if (manifest?.issue?.pageCount !== 12) {
    throw new Error("manifest issue.pageCount must be 12");
  }

  if (!Array.isArray(manifest.pages) || manifest.pages.length !== 12) {
    throw new Error("manifest must list exactly 12 pages");
  }

  const pageNumbers = manifest.pages.map((page) => page.pageNumber);
  const expected = Array.from({ length: 12 }, (_, index) => index + 1);
  const missing = expected.filter((pageNumber) => !pageNumbers.includes(pageNumber));
  if (missing.length > 0) {
    throw new Error(`manifest missing pages: ${missing.join(", ")}`);
  }
}

function findFullPdfCandidates() {
  const candidates = [];

  for (const folder of FULL_PDF_FOLDERS) {
    const pdfs = listFilesRecursive(folder, (absPath) => extname(absPath).toLowerCase() === ".pdf");
    for (const absPath of pdfs) {
      const bytes = statSync(absPath).size;
      candidates.push({
        path: toRelative(absPath),
        folder,
        bytes,
        status: "FULL_ISSUE_PDF_CANDIDATE",
      });
    }
  }

  return candidates;
}

function inspectManifestPageSources(manifest) {
  return manifest.pages.map((page) => {
    const sourceAbs = page.sourceFile ? resolve(ROOT, page.sourceFile) : null;
    const exists = sourceAbs ? existsSync(sourceAbs) : false;
    const sourceBytes = exists ? statSync(sourceAbs).size : null;
    const sourceHash = exists ? sha256Buffer(readFileSync(sourceAbs)) : null;

    return {
      pageNumber: page.pageNumber,
      pageTitle: page.pageTitle,
      pageType: page.pageType,
      sourceStatus: exists && page.sourceStatus !== "MISSING_SOURCE" ? page.sourceStatus : "MISSING_SOURCE",
      manifestSourceStatus: page.sourceStatus,
      sourceFile: page.sourceFile,
      sourceFormat: page.sourceFormat,
      sourceExists: exists,
      sourceBytes,
      sourceHash,
      riskLevel: page.riskLevel,
      translate: page.translate,
      englishStatus: page.languageStatus?.en?.translationStatus ?? "UNKNOWN",
      portugueseStatus: page.languageStatus?.pt?.translationStatus ?? "UNKNOWN",
      tagalogStatus: page.languageStatus?.tl?.translationStatus ?? "UNKNOWN",
    };
  });
}

function chooseSourceStrategy(args, fullPdfCandidates, availablePngPages) {
  if (args.source === "full-pdf") {
    return fullPdfCandidates.length > 0 ? "full-pdf" : "none";
  }

  if (args.source === "page-png") {
    return availablePngPages.length > 0 ? "page-png" : "none";
  }

  if (fullPdfCandidates.length > 0) {
    return "full-pdf";
  }

  if (availablePngPages.length > 0) {
    return "page-png";
  }

  return "none";
}

async function writePngPagePdf(pageSource, createdOutputs) {
  const sourceAbs = resolve(ROOT, pageSource.sourceFile);
  const pngBytes = readFileSync(sourceAbs);
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBytes);
  const page = pdfDoc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);

  const scale = Math.min(PAGE_WIDTH_PT / pngImage.width, PAGE_HEIGHT_PT / pngImage.height);
  const width = pngImage.width * scale;
  const height = pngImage.height * scale;
  const x = (PAGE_WIDTH_PT - width) / 2;
  const y = (PAGE_HEIGHT_PT - height) / 2;

  page.drawImage(pngImage, { x, y, width, height });

  const pdfBytes = await pdfDoc.save();
  const padded = String(pageSource.pageNumber).padStart(3, "0");
  const outDirRelative = `${ISSUE_ES_OUTPUT_RELATIVE}/page-${padded}`;
  const outFileRelative = `${outDirRelative}/source-page-${padded}-from-png.pdf`;
  const outDirAbs = resolve(ROOT, outDirRelative);

  mkdirSync(outDirAbs, { recursive: true });
  writeFileSync(resolve(ROOT, outFileRelative), pdfBytes);

  createdOutputs.push({
    pageNumber: pageSource.pageNumber,
    source: pageSource.sourceFile,
    output: outFileRelative,
    bytes: pdfBytes.length,
    hash: sha256Buffer(pdfBytes),
    sourceMethod: "page-png",
    trimSize: TRIM_SIZE,
    providerCalled: false,
    publicAsset: false,
  });
}

async function splitFullIssuePdf(fullPdfCandidate, manifest, createdOutputs) {
  const sourceAbs = resolve(ROOT, fullPdfCandidate.path);
  const sourceBytes = readFileSync(sourceAbs);
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const sourcePageCount = sourcePdf.getPageCount();
  const pagesToCopy = Math.min(sourcePageCount, manifest.pages.length);

  for (let index = 0; index < pagesToCopy; index += 1) {
    const pageNumber = index + 1;
    const padded = String(pageNumber).padStart(3, "0");
    const outDirRelative = `${ISSUE_ES_OUTPUT_RELATIVE}/page-${padded}`;
    const outFileRelative = `${outDirRelative}/source-page-${padded}-from-full-issue.pdf`;
    const outDirAbs = resolve(ROOT, outDirRelative);
    const onePagePdf = await PDFDocument.create();
    const [copiedPage] = await onePagePdf.copyPages(sourcePdf, [index]);
    onePagePdf.addPage(copiedPage);
    const pdfBytes = await onePagePdf.save();

    mkdirSync(outDirAbs, { recursive: true });
    writeFileSync(resolve(ROOT, outFileRelative), pdfBytes);

    createdOutputs.push({
      pageNumber,
      source: fullPdfCandidate.path,
      output: outFileRelative,
      bytes: pdfBytes.length,
      hash: sha256Buffer(pdfBytes),
      sourceMethod: "full-pdf",
      providerCalled: false,
      publicAsset: false,
    });
  }

  return {
    sourcePageCount,
    splitPageCount: pagesToCopy,
    exactPageCountMatch: sourcePageCount === manifest.pages.length,
  };
}

function createReadme(status) {
  return `# August 2026 Issue Source Intake Foundation

Gate: \`${GATE}\`

## Status

- Provider called: **${status.providerCalled ? "TRUE" : "FALSE"}**
- Public output created: **${status.publicOutputCreated ? "TRUE" : "FALSE"}**
- Source originals modified: **${status.sourceOriginalsModified ? "TRUE" : "FALSE"}**
- Mode: **${status.mode}**
- Source selection: **${status.requestedSource}**
- Selected strategy: **${status.selectedStrategy}**

## Source Result

- Full issue PDF status: **${status.fullIssuePdfStatus}**
- Page PNG fallback status: **${status.pagePngFallbackStatus}**
- Missing source pages: **${status.missingSourcePages.join(", ") || "NONE"}**
- Ready for language proof plan: **${status.readyForLanguageProofPlan ? "YES" : "NO"}**
- Ready for full issue translation: **${status.readyForFullIssueTranslation ? "YES" : "NO"}**

## Guardrails

- No DeepL call.
- No Google Translate call.
- No public assets.
- No source file modification.
- Local outputs only under \`${OUTPUT_DIR_RELATIVE}/\`.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = readJson(MANIFEST_RELATIVE);
  validateManifest(manifest);

  const fullPdfCandidates = findFullPdfCandidates();
  const pageSources = inspectManifestPageSources(manifest);
  const availablePngPages = pageSources.filter(
    (page) => page.sourceExists && page.sourceFormat === "png" && page.sourceStatus !== "MISSING_SOURCE",
  );
  const missingPages = pageSources
    .filter((page) => !page.sourceExists || page.sourceStatus === "MISSING_SOURCE")
    .map((page) => page.pageNumber);
  const selectedStrategy = chooseSourceStrategy(args, fullPdfCandidates, availablePngPages);
  const createdOutputs = [];
  let fullPdfSplit = {
    attempted: false,
    result: null,
  };
  let pagePngPrep = {
    attempted: false,
    createdPageCount: 0,
  };

  if (args.execute && selectedStrategy === "full-pdf") {
    fullPdfSplit.attempted = true;
    fullPdfSplit.result = await splitFullIssuePdf(fullPdfCandidates[0], manifest, createdOutputs);
  }

  if (args.execute && selectedStrategy === "page-png") {
    pagePngPrep.attempted = true;
    for (const pageSource of availablePngPages) {
      await writePngPagePdf(pageSource, createdOutputs);
    }
    pagePngPrep.createdPageCount = createdOutputs.length;
  }

  const fullIssuePdfStatus =
    fullPdfCandidates.length > 0 ? "FULL_ISSUE_PDF_FOUND" : "NO_FULL_ISSUE_PDF_FOUND";
  const pagePngFallbackStatus =
    availablePngPages.length === manifest.pages.length
      ? "PAGE_PNG_FALLBACK_AVAILABLE_FULL"
      : availablePngPages.length > 0
        ? "PAGE_PNG_FALLBACK_AVAILABLE_PARTIAL"
        : "PAGE_PNG_FALLBACK_NOT_AVAILABLE";
  const readyForFullIssueTranslation = missingPages.length === 0 && (fullPdfCandidates.length > 0 || availablePngPages.length === 12);
  const readyForLanguageProofPlan = availablePngPages.length > 0 || fullPdfCandidates.length > 0;
  const statuses = [
    fullIssuePdfStatus,
    pagePngFallbackStatus,
    ...(missingPages.length > 0 ? ["MISSING_SOURCE_PAGES"] : []),
    ...(readyForLanguageProofPlan ? ["READY_FOR_LANGUAGE_PROOF_PLAN"] : []),
    ...(readyForFullIssueTranslation ? [] : ["NOT_READY_FOR_FULL_ISSUE_TRANSLATION"]),
  ];

  const inventory = {
    gate: GATE,
    timestamp: new Date().toISOString(),
    mode: args.execute ? "execute" : "dry-run",
    requestedSource: args.source,
    selectedStrategy,
    manifestPath: MANIFEST_RELATIVE,
    outputDirectory: OUTPUT_DIR_RELATIVE,
    fullPdfCandidates,
    pageSources,
    availablePagePngCount: availablePngPages.length,
    availablePagePngPages: availablePngPages.map((page) => page.pageNumber),
    missingSourcePages: missingPages,
    createdOutputs,
  };

  const status = {
    gate: GATE,
    timestamp: inventory.timestamp,
    mode: inventory.mode,
    requestedSource: args.source,
    selectedStrategy,
    statuses,
    manifestRead: true,
    manifestPageCount: manifest.pages.length,
    allTwelvePagesRead: manifest.pages.length === 12,
    fullIssuePdfStatus,
    fullPdfFound: fullPdfCandidates.length > 0,
    fullPdfCandidatePath: fullPdfCandidates[0]?.path ?? null,
    fullPdfSplitAttempted: fullPdfSplit.attempted,
    fullPdfSplitResult: fullPdfSplit.result,
    pagePngFallbackStatus,
    availablePagePngCount: availablePngPages.length,
    availablePagePngPages: availablePngPages.map((page) => page.pageNumber),
    missingSourcePages: missingPages,
    pagePngPrepAttempted: pagePngPrep.attempted,
    pagePngPrepCreatedPageCount: pagePngPrep.createdPageCount,
    createdOutputCount: createdOutputs.length,
    readyForLanguageProofPlan,
    readyForFullIssueTranslation,
    providerCalled: false,
    apiCalled: false,
    publicOutputCreated: false,
    sourceOriginalsModified: false,
    nextRecommendedGates: [
      "AUGUST-2026-PORTUGUESE-PROOF-PLAN1",
      "AUGUST-2026-TAGALOG-PROOF-PLAN1",
      "AUGUST-2026-PAGES7-11-MASTER-SAMPLES-PLAN1",
      "AUGUST-2026-FULL-ISSUE-PDF-SOURCE-INTAKE1",
    ],
  };

  const outputDirAbs = resolve(ROOT, OUTPUT_DIR_RELATIVE);
  mkdirSync(outputDirAbs, { recursive: true });
  writeFileSync(
    resolve(outputDirAbs, "source-inventory.json"),
    `${JSON.stringify(inventory, null, 2)}\n`,
  );
  writeFileSync(
    resolve(outputDirAbs, "source-intake-status.json"),
    `${JSON.stringify(status, null, 2)}\n`,
  );
  writeFileSync(resolve(outputDirAbs, "README.md"), createReadme(status));

  console.log(`[${GATE}] mode: ${status.mode}`);
  console.log(`[${GATE}] requestedSource: ${status.requestedSource}`);
  console.log(`[${GATE}] selectedStrategy: ${status.selectedStrategy}`);
  console.log(`[${GATE}] manifestRead: ${status.manifestRead}`);
  console.log(`[${GATE}] allTwelvePagesRead: ${status.allTwelvePagesRead}`);
  console.log(`[${GATE}] fullIssuePdfStatus: ${status.fullIssuePdfStatus}`);
  console.log(`[${GATE}] pagePngFallbackStatus: ${status.pagePngFallbackStatus}`);
  console.log(`[${GATE}] availablePagePngPages: ${status.availablePagePngPages.join(", ")}`);
  console.log(`[${GATE}] missingSourcePages: ${status.missingSourcePages.join(", ") || "NONE"}`);
  console.log(`[${GATE}] createdOutputCount: ${status.createdOutputCount}`);
  console.log(`[${GATE}] providerCalled: ${status.providerCalled}`);
  console.log(`[${GATE}] publicOutputCreated: ${status.publicOutputCreated}`);
  console.log(`[${GATE}] sourceOriginalsModified: ${status.sourceOriginalsModified}`);
  console.log(`[${GATE}] readyForLanguageProofPlan: ${status.readyForLanguageProofPlan}`);
  console.log(`[${GATE}] readyForFullIssueTranslation: ${status.readyForFullIssueTranslation}`);
}

main().catch((err) => {
  console.error(`[${GATE}] failed:`, err.message);
  process.exit(1);
});
