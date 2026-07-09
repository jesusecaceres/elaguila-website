#!/usr/bin/env node
/**
 * August 2026 Batch 2 — Pages 5 & 6 PNG to one-page PDF proof inputs (prep only).
 *
 * Gate: AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP1
 * Does NOT call DeepL. Does NOT modify source PNGs. Does NOT write to public/.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GATE = "AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP1";
const NEXT_GATE = "AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF1";

/** 8 in × 11.5 in at 72 pt/in */
const PAGE_WIDTH_PT = 576;
const PAGE_HEIGHT_PT = 828;
const TRIM_SIZE = "8 × 11.5 in";

const PAGES = [
  {
    pageNumber: 5,
    padded: "005",
    sourcePng:
      "design-references/magazine/2026-august/01-master-samples/august-2026-005-agenda-de-agosto-master-sample.png",
    outputDir: ".magazine-proof-output/2026-august/_inputs/page-smoke/page-005",
    outputPdf: "source-page-005-from-png.pdf",
    riskLevel: "HIGH",
    layoutType: "dense event/card layout",
    qaFocus:
      "Card lists, event blocks, short copy, possible overflow after translation",
  },
  {
    pageNumber: 6,
    padded: "006",
    sourcePng:
      "design-references/magazine/2026-august/01-master-samples/august-2026-006-negocios-comunidad-master-sample.png",
    outputDir: ".magazine-proof-output/2026-august/_inputs/page-smoke/page-006",
    outputPdf: "source-page-006-from-png.pdf",
    riskLevel: "MEDIUM",
    layoutType: "editorial/business community page",
    qaFocus: "Headline/body/card mix with Leonix CTA; text shift after translation",
  },
];

function sha256Buffer(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function preparePage(pageConfig) {
  const sourcePath = resolve(ROOT, pageConfig.sourcePng);
  if (!existsSync(sourcePath)) {
    throw new Error(`missing source PNG: ${pageConfig.sourcePng}`);
  }

  const pngBytes = readFileSync(sourcePath);
  const sourceHash = sha256Buffer(pngBytes);
  const sourceSize = pngBytes.length;

  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBytes);
  const imgW = pngImage.width;
  const imgH = pngImage.height;
  const sourceRatio = Number((imgW / imgH).toFixed(4));

  const page = pdfDoc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
  const scale = Math.min(PAGE_WIDTH_PT / imgW, PAGE_HEIGHT_PT / imgH);
  const scaledW = imgW * scale;
  const scaledH = imgH * scale;
  const x = (PAGE_WIDTH_PT - scaledW) / 2;
  const y = (PAGE_HEIGHT_PT - scaledH) / 2;

  page.drawImage(pngImage, {
    x,
    y,
    width: scaledW,
    height: scaledH,
  });

  const pdfBytes = await pdfDoc.save();
  const outDir = resolve(ROOT, pageConfig.outputDir);
  mkdirSync(outDir, { recursive: true });

  const pdfPath = resolve(outDir, pageConfig.outputPdf);
  writeFileSync(pdfPath, pdfBytes);
  const pdfHash = sha256Buffer(pdfBytes);
  const pdfSize = pdfBytes.length;
  const under10Mb = pdfSize < 10 * 1024 * 1024;

  const metadata = {
    gate: GATE,
    pageNumber: pageConfig.pageNumber,
    sourcePngRelativePath: pageConfig.sourcePng,
    sourcePngHash: sourceHash,
    sourcePngBytes: sourceSize,
    sourcePngWidth: imgW,
    sourcePngHeight: imgH,
    sourcePngRatio: sourceRatio,
    outputPdfRelativePath: `${pageConfig.outputDir}/${pageConfig.outputPdf}`,
    outputPdfBytes: pdfSize,
    outputPdfHash: pdfHash,
    outputPdfPageWidthPoints: PAGE_WIDTH_PT,
    outputPdfPageHeightPoints: PAGE_HEIGHT_PT,
    outputPdfTrimSize: TRIM_SIZE,
    expectedDeepLBehavior: "IMAGE_FLATTENED_LIKELY",
    extractableTextExpected: false,
    providerCalled: false,
    publicAsset: false,
    finalPdf: false,
    printReady: false,
    digitalProofInputOnly: true,
    under10Mb,
    riskLevel: pageConfig.riskLevel,
    layoutType: pageConfig.layoutType,
    qaFocus: pageConfig.qaFocus,
    nextGate: NEXT_GATE,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(resolve(outDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

  const readme = `# Page ${pageConfig.pageNumber} Local Proof Input (August 2026)

Gate: \`${GATE}\`

## Status

- **Local proof input only** — not public, not final, not print-ready, not FlipHTML5-ready
- **DeepL has not been called**
- **Translated editions are digital-only**
- **Printed magazine remains Spanish-only**

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
| \`${pageConfig.outputPdf}\` | One-page PDF built from Page ${pageConfig.pageNumber} master PNG for future DeepL experiment |
| \`metadata.json\` | Source/output hashes, sizes, flattening risk flags |
| \`README.md\` | This file |

## Source

\`${pageConfig.sourcePng}\`

## Next Gate

\`${NEXT_GATE}\` — controlled English proof (max 2 provider calls: one per page); local output only.
`;

  writeFileSync(resolve(outDir, "README.md"), readme);

  return {
    pageNumber: pageConfig.pageNumber,
    sourcePng: pageConfig.sourcePng,
    imgW,
    imgH,
    sourceRatio,
    sourceHash,
    sourceSize,
    outputPdf: `${pageConfig.outputDir}/${pageConfig.outputPdf}`,
    pdfSize,
    pdfHash,
    under10Mb,
    riskLevel: pageConfig.riskLevel,
    layoutType: pageConfig.layoutType,
  };
}

async function main() {
  const results = [];

  for (const pageConfig of PAGES) {
    const result = await preparePage(pageConfig);
    results.push(result);

    console.log(`[${GATE}] Page ${result.pageNumber}`);
    console.log(`[${GATE}]   source PNG: ${result.sourcePng}`);
    console.log(`[${GATE}]   source dimensions: ${result.imgW} × ${result.imgH} (ratio ${result.sourceRatio})`);
    console.log(`[${GATE}]   output PDF: ${result.outputPdf}`);
    console.log(`[${GATE}]   output bytes: ${result.pdfSize} (under 10 MB: ${result.under10Mb})`);
    console.log(`[${GATE}]   risk: ${result.riskLevel}`);
  }

  console.log(`[${GATE}] providerCalled: false`);
  console.log(`[${GATE}] nextGate: ${NEXT_GATE}`);

  const overLimit = results.filter((r) => !r.under10Mb);
  if (overLimit.length > 0) {
    console.error(
      `[${GATE}] PDF(s) exceed 10 MB — pages: ${overLimit.map((r) => r.pageNumber).join(", ")}`,
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(`[${GATE}] failed:`, err.message);
  process.exit(1);
});
