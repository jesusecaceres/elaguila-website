/**
 * Gate OFERTAS-AI-QUALITY-2 — Strict price repair + product card accuracy audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  debugIsJunkOfertaLocalAiLine,
  debugIsPackageFinePrintLine,
  debugParseOfertaLocalPriceLine,
  normalizeDocumentAiResultToOfertaLocalItems,
  repairRetailPriceDigits,
} from "../app/lib/ofertas-locales/ofertasLocalesAiNormalizer";
import { pickBestProductLabel } from "../app/lib/ofertas-locales/ofertasLocalesAiExtractionQuality";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  const priceNormalizer = read("app/lib/ofertas-locales/ofertasLocalesAiPriceNormalizer.ts");
  const quality = read("app/lib/ofertas-locales/ofertasLocalesAiExtractionQuality.ts");
  const normalizer = read("app/lib/ofertas-locales/ofertasLocalesAiNormalizer.ts");

  assert.match(priceNormalizer, /repairRetailPriceDigits/, "price repair helper");
  assert.match(quality, /pickBestProductLabel/, "product label picker");
  assert.match(quality, /isPackageFinePrint/, "package fine print filter");
  assert.match(normalizer, /priceRepairsApplied/, "price repair stats");
  assert.match(normalizer, /duplicateRemovals/, "duplicate removal stats");
  assert.match(normalizer, /averageConfidence/, "average confidence stats");

  // --- Price decimal repair ---
  const repaired399 = repairRetailPriceDigits("399", { sourceText: "$399 EA" });
  assert.ok(repaired399);
  assert.equal(repaired399!.amount, 3.99);
  assert.equal(repaired399!.display, "$3.99");
  assert.equal(repaired399!.repaired, true);

  const repaired899 = repairRetailPriceDigits("899", { sourceText: "899 EA" });
  assert.ok(repaired899);
  assert.equal(repaired899!.amount, 8.99);

  const noRepairWithoutContext = repairRetailPriceDigits("399", { sourceText: "item 399" });
  assert.equal(noRepairWithoutContext, null, "no blind 3-digit repair without price context");

  const parsed399 = debugParseOfertaLocalPriceLine("$399 EA");
  assert.ok(parsed399);
  assert.equal(parsed399!.priceAmount, 3.99);
  assert.match(parsed399!.priceText, /\$3\.99\s*EA/i);
  assert.equal(parsed399!.priceRepaired, true);

  const parsed899 = debugParseOfertaLocalPriceLine("$899 EA");
  assert.ok(parsed899);
  assert.equal(parsed899!.priceAmount, 8.99);

  // --- Multi-buy and cent prices ---
  const twoForFive = debugParseOfertaLocalPriceLine("2 FOR $5");
  assert.ok(twoForFive);
  assert.match(twoForFive!.priceText, /2 for \$5/i);
  assert.equal(twoForFive!.dealType, "multi_buy");

  const threeForTen = debugParseOfertaLocalPriceLine("3 FOR $10");
  assert.ok(threeForTen);
  assert.match(threeForTen!.priceText, /3 for \$10/i);

  const centLb = debugParseOfertaLocalPriceLine("99¢ LB");
  assert.ok(centLb);
  assert.equal(centLb!.priceAmount, 0.99);
  assert.match(centLb!.unit, /LB/i);

  // --- Junk / package rejection ---
  assert.equal(debugIsJunkOfertaLocalAiLine("CARDENAS"), true);
  assert.equal(debugIsJunkOfertaLocalAiLine("MARKETS"), true);
  assert.equal(debugIsJunkOfertaLocalAiLine("Chiles Secos La Fiesta"), false);

  assert.equal(
    debugIsPackageFinePrintLine("22 TOSTADAS - 7 oz (198 g) - TOTALNE..."),
    true,
    "package tostada fragment"
  );
  assert.equal(
    debugIsPackageFinePrintLine("NET 172.4 FL OZ CAUTION L34 GAL..."),
    true,
    "package cleaner fragment"
  );

  // --- Product name / unit separation ---
  const tostadaLabel = pickBestProductLabel([
    "Tostadas de Maíz Cárdenas",
    "Corn Tostadas, 7 oz",
  ]);
  assert.match(tostadaLabel.itemName, /Tostadas de Maíz Cárdenas/i);
  assert.match(tostadaLabel.unit, /7\s*oz/i);

  const takisLabel = pickBestProductLabel([
    "Botanas Takis Fiesta Size Tortilla Chips",
    "17 oz",
  ]);
  assert.match(takisLabel.itemName, /Takis/i);
  assert.match(takisLabel.unit, /17\s*oz/i);

  // --- Price-centered grouping fixture (Cardenas-style) ---
  const sample = normalizeDocumentAiResultToOfertaLocalItems({
    extraction: {
      text: "",
      pagesProcessed: 1,
      pageLines: [
        {
          pageNumber: 1,
          text: "CARDENAS MARKETS",
          confidence: 0.9,
          boundingBox: { xMin: 0.1, yMin: 0.02, xMax: 0.9, yMax: 0.08 },
        },
        {
          pageNumber: 1,
          text: "Chiles Secos La Fiesta",
          confidence: 0.88,
          boundingBox: { xMin: 0.1, yMin: 0.2, xMax: 0.4, yMax: 0.26 },
        },
        {
          pageNumber: 1,
          text: "Chili Pods, Select Varieties, 1.5-3 oz",
          confidence: 0.86,
          boundingBox: { xMin: 0.1, yMin: 0.27, xMax: 0.45, yMax: 0.33 },
        },
        {
          pageNumber: 1,
          text: "3 FOR $5",
          confidence: 0.92,
          boundingBox: { xMin: 0.12, yMin: 0.34, xMax: 0.28, yMax: 0.4 },
        },
        {
          pageNumber: 1,
          text: "Takis Fiesta Size Tortilla Chips",
          confidence: 0.9,
          boundingBox: { xMin: 0.55, yMin: 0.2, xMax: 0.95, yMax: 0.28 },
        },
        {
          pageNumber: 1,
          text: "$499 EA",
          confidence: 0.91,
          boundingBox: { xMin: 0.58, yMin: 0.34, xMax: 0.72, yMax: 0.4 },
        },
        {
          pageNumber: 1,
          text: "Electrolit 21 oz",
          confidence: 0.87,
          boundingBox: { xMin: 0.1, yMin: 0.45, xMax: 0.35, yMax: 0.51 },
        },
        {
          pageNumber: 1,
          text: "2 FOR $5 + CRV",
          confidence: 0.9,
          boundingBox: { xMin: 0.12, yMin: 0.52, xMax: 0.3, yMax: 0.58 },
        },
        {
          pageNumber: 1,
          text: "22 TOSTADAS - 7 oz (198 g) - TOTALNE...",
          confidence: 0.7,
          boundingBox: { xMin: 0.6, yMin: 0.45, xMax: 0.95, yMax: 0.52 },
        },
        {
          pageNumber: 1,
          text: "When you buy 3",
          confidence: 0.6,
          boundingBox: { xMin: 0.6, yMin: 0.92, xMax: 0.8, yMax: 0.96 },
        },
      ],
      entities: [],
      confidenceAverage: 0.88,
      rawSummary: { mimeType: "application/pdf", textLength: 200, entityCount: 0, pageLineCount: 10 },
    },
    sourceAssetId: "asset-q2",
    sourceAssetUrl: "https://example.com/cardenas-flyer.pdf",
    assetKind: "flyer",
  });

  assert.ok(sample.items.length >= 3, "expected multiple grouped product rows");
  assert.ok(
    sample.items.some((i) => /chiles secos la fiesta/i.test(i.itemName) && /3 for \$5/i.test(i.priceText)),
    "chiles + 3 for $5"
  );
  assert.ok(
    sample.items.some((i) => /takis/i.test(i.itemName) && i.priceAmount === 4.99),
    "takis + repaired $4.99 EA"
  );
  assert.ok(
    sample.items.some((i) => /electrolit/i.test(i.itemName) && /2 for \$5/i.test(i.priceText)),
    "electrolit + 2 for $5 + CRV"
  );
  assert.ok(!sample.items.some((i) => /^cardenas$/i.test(i.itemName)), "no CARDENAS junk row");
  assert.ok(!sample.items.some((i) => /TOTALNE/i.test(i.itemName)), "no package fragment row");
  assert.ok(!sample.items.some((i) => /^when you buy 3$/i.test(i.itemName)), "no when-you-buy-only row");
  assert.ok(sample.items.every((i) => i.reviewStatus === "needs_review"), "still needs review");
  assert.ok(sample.items.every((i) => i.isActive === false), "not auto-published");

  assert.ok(sample.debug.priceRepairsApplied >= 1, "price repairs logged");
  assert.ok(typeof sample.debug.averageConfidence === "number", "average confidence computed");

  console.log("Gate OFERTAS-AI-QUALITY-2 — Ofertas Locales AI extraction quality audit passed.");
}

run();
