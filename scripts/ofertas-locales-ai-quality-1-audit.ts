/**
 * Gate OFERTAS-AI-QUALITY-1 — Ofertas Locales AI extraction quality audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  debugIsJunkOfertaLocalAiLine,
  debugParseOfertaLocalPriceLine,
  normalizeDocumentAiResultToOfertaLocalItems,
} from "../app/lib/ofertas-locales/ofertasLocalesAiNormalizer";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  const quality = read("app/lib/ofertas-locales/ofertasLocalesAiExtractionQuality.ts");
  const normalizer = read("app/lib/ofertas-locales/ofertasLocalesAiNormalizer.ts");
  const scanHandler = read("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");

  assert.match(quality, /OFERTAS_LOCALES_AI_JUNK_EXACT/, "junk exact list");
  assert.match(quality, /multi_for/, "2 FOR $5 pattern");
  assert.match(quality, /dollar_ea/, "$4.99 EA pattern");
  assert.match(normalizer, /collectContextLinesForPrice/, "price block grouping");
  assert.match(normalizer, /rejectReasonForCandidate/, "post filters");
  assert.match(normalizer, /candidateDedupeKey/, "dedupe");
  assert.match(scanHandler, /scan normalization summary/, "scan debug logs");

  assert.equal(debugIsJunkOfertaLocalAiLine("CARDENAS"), true);
  assert.equal(debugIsJunkOfertaLocalAiLine("MARKETS"), true);
  assert.equal(debugIsJunkOfertaLocalAiLine("GUÍA DE AHORROS"), true);
  assert.equal(debugIsJunkOfertaLocalAiLine("La Fiesta"), true);
  assert.equal(debugIsJunkOfertaLocalAiLine("Chiles Secos La Fiesta"), false);

  const multiFor = debugParseOfertaLocalPriceLine("3 FOR $5");
  assert.ok(multiFor);
  assert.match(multiFor!.priceText, /3 for \$5/i);

  const eaPrice = debugParseOfertaLocalPriceLine("$4.99 EA");
  assert.ok(eaPrice);
  assert.equal(eaPrice!.priceAmount, 4.99);

  const centLb = debugParseOfertaLocalPriceLine("99¢ LB");
  assert.ok(centLb);

  const sample = normalizeDocumentAiResultToOfertaLocalItems({
    extraction: {
      text: "",
      pagesProcessed: 1,
      pageLines: [
        { pageNumber: 1, text: "CARDENAS MARKETS", confidence: 0.9, boundingBox: { xMin: 0.1, yMin: 0.02, xMax: 0.9, yMax: 0.08 } },
        { pageNumber: 1, text: "Chiles Secos La Fiesta", confidence: 0.88, boundingBox: { xMin: 0.1, yMin: 0.2, xMax: 0.4, yMax: 0.26 } },
        { pageNumber: 1, text: "Chili Pods, Select Varieties, 1.5-3 oz", confidence: 0.86, boundingBox: { xMin: 0.1, yMin: 0.27, xMax: 0.45, yMax: 0.33 } },
        { pageNumber: 1, text: "3 FOR $5", confidence: 0.92, boundingBox: { xMin: 0.12, yMin: 0.34, xMax: 0.28, yMax: 0.4 } },
        { pageNumber: 1, text: "Botanas Takis Fiesta Size Tortilla Chips, 17 oz", confidence: 0.9, boundingBox: { xMin: 0.55, yMin: 0.2, xMax: 0.95, yMax: 0.28 } },
        { pageNumber: 1, text: "$4.99 EA", confidence: 0.91, boundingBox: { xMin: 0.58, yMin: 0.34, xMax: 0.72, yMax: 0.4 } },
      ],
      entities: [],
      confidenceAverage: 0.9,
      rawSummary: { mimeType: "application/pdf", textLength: 100, entityCount: 0, pageLineCount: 6 },
    },
    sourceAssetId: "asset-1",
    sourceAssetUrl: "https://example.com/flyer.pdf",
    assetKind: "flyer",
  });

  assert.ok(sample.items.length >= 2, "expected grouped product rows");
  assert.ok(
    sample.items.some((i) => /chiles secos la fiesta/i.test(i.itemName) && /3 for \$5/i.test(i.priceText)),
    "chiles + 3 for $5"
  );
  assert.ok(
    sample.items.some((i) => /takis/i.test(i.itemName) && /\$4\.99/i.test(i.priceText)),
    "takis + $4.99 EA"
  );
  assert.ok(!sample.items.some((i) => /^cardenas$/i.test(i.itemName)), "no CARDENAS junk row");
  assert.ok(sample.items.every((i) => i.reviewStatus === "needs_review"), "still needs review");
  assert.ok(sample.items.every((i) => i.isActive === false), "not auto active");

  console.log("Gate OFERTAS-AI-QUALITY-1 — Ofertas Locales AI extraction quality audit passed.");
}

run();
