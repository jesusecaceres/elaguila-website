#!/usr/bin/env node
/**
 * August 2026 Page 12 — PNG to one-page PDF proof input (prep only).
 *
 * Gate: AUGUST-2026-PAGE12-PNG-TO-DEEPL-PROOF-PREP1
 * Does NOT call DeepL. Does NOT modify source PNG. Does NOT write to public/.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GATE = "AUGUST-2026-PAGE12-PNG-TO-DEEPL-PROOF-PREP1";
const SOURCE_PNG = "design-references/magazine/2026-august/01-master-samples/august-2026-012-back-cover-master-sample.png";
const OUTPUT_DIR = ".magazine-proof-output/2026-august/_inputs/page-smoke/page-012";
const OUTPUT_PDF = "source-page-012-from-png.pdf";

/** 8 in × 11.5 in at 72 pt/in */
const PAGE_WIDTH_PT = 576;
const PAGE_HEIGHT_PT = 828;
const TRIM_SIZE = "8 × 11.5 in";

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256Buffer(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const sourcePath = resolve(ROOT, SOURCE_PNG);
  if (!existsSync(sourcePath)) {
    console.error(`[${GATE}] missing source PNG: ${SOURCE_PNG}`);
    process.exit(1);
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
  const outDir = resolve(ROOT, OUTPUT_DIR);
  mkdirSync(outDir, { recursive: true });

  const pdfPath = resolve(outDir, OUTPUT_PDF);
  writeFileSync(pdfPath, pdfBytes);
  const pdfHash = sha256Buffer(pdfBytes);
  const pdfSize = pdfBytes.length;
  const under10Mb = pdfSize < 10 * 1024 * 1024;

  const metadata = {
    gate: GATE,
    sourcePngRelativePath: SOURCE_PNG,
    sourcePngHash: sourceHash,
    sourcePngBytes: sourceSize,
    sourcePngWidth: imgW,
    sourcePngHeight: imgH,
    sourcePngRatio: sourceRatio,
    outputPdfRelativePath: `${OUTPUT_DIR}/${OUTPUT_PDF}`,
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
    nextGate: "AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF1",
    timestamp: new Date().toISOString(),
  };

  writeFileSync(resolve(outDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

  const readme = `# Page 12 Local Proof Input (August 2026)

Gate: \`${GATE}\`

## Status

- **Local proof input only** — not public, not final, not print-ready, not FlipHTML5-ready
- **DeepL has not been called**
- **Translated editions are digital-only**
- **Printed magazine remains Spanish-only**

## Files

| File | Purpose |
|------|---------|
| \`source-page-012-from-png.pdf\` | One-page PDF built from Page 12 master PNG for future DeepL experiment |
| \`metadata.json\` | Source/output hashes, sizes, flattening risk flags |
| \`README.md\` | This file |

## Source

\`${SOURCE_PNG}\`

## Next Gate

\`AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF1\` — one controlled provider call (after explicit approval); local output only.
`;

  writeFileSync(resolve(outDir, "README.md"), readme);

  console.log(`[${GATE}] source PNG: ${SOURCE_PNG}`);
  console.log(`[${GATE}] source dimensions: ${imgW} × ${imgH} (ratio ${sourceRatio})`);
  console.log(`[${GATE}] output PDF: ${OUTPUT_DIR}/${OUTPUT_PDF}`);
  console.log(`[${GATE}] output bytes: ${pdfSize} (under 10 MB: ${under10Mb})`);
  console.log(`[${GATE}] providerCalled: false`);
  console.log(`[${GATE}] nextGate: ${metadata.nextGate}`);

  if (!under10Mb) {
    console.error(`[${GATE}] PDF exceeds 10 MB — DeepL upload would fail.`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(`[${GATE}] failed:`, err.message);
  process.exit(1);
});
