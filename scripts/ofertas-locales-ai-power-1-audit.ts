/**
 * Gate OFERTAS-AI-POWER-1 — Gemini multimodal flyer extraction audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  rejectGeminiCandidateReason,
  repairGeminiCandidatePrice,
  validateAndSanitizeGeminiCandidates,
} from "../app/lib/ofertas-locales/ofertasLocalesGeminiCandidateValidator";
import { mapGeminiCandidatesToOfertaLocalItems } from "../app/lib/ofertas-locales/ofertasLocalesGeminiNormalizer";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  const prompt = read("app/lib/ofertas-locales/ofertasLocalesGeminiPrompt.ts");
  const extractor = read("app/lib/ofertas-locales/ofertasLocalesGeminiPageExtractor.ts");
  const validator = read("app/lib/ofertas-locales/ofertasLocalesGeminiCandidateValidator.ts");
  const pipeline = read("app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts");
  const orchestrator = read("app/lib/ofertas-locales/ofertasLocalesAiScanOrchestrator.ts");
  const pdfPages = read("app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts");
  const scanHandler = read("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");
  const packageJson = read("package.json");

  assert.match(extractor, /extractOfertasPageWithGemini/, "gemini page extractor helper");
  assert.match(prompt, /big 8 with small 99/, "split visual price rules in prompt");
  assert.match(prompt, /2 FOR \$5/, "multi-buy rules in prompt");
  assert.match(validator, /rejectGeminiCandidateReason/, "candidate rejection helper");
  assert.match(validator, /repairGeminiCandidatePrice/, "gemini price repair helper");
  assert.match(pipeline, /mapPool/, "page concurrency pool");
  assert.match(orchestrator, /fallback_document_ai/, "document ai fallback path");
  assert.match(pdfPages, /prepareOfertaLocalScanPageImages/, "pdf page image helper");
  assert.match(scanHandler, /runOfertaLocalAiScanExtraction/, "scan handler uses orchestrator");
  assert.match(scanHandler, /isAnyOfertaLocalAiScanProviderConfigured/, "gemini or doc ai gate");
  assert.match(packageJson, /@google\/generative-ai/, "gemini sdk dependency");

  // Store branding rejection
  assert.equal(rejectGeminiCandidateReason({
    productName: "CARDENAS MARKETS",
    priceText: "",
    priceAmount: null,
    rawEvidence: "",
  }), "store_branding");

  // Package fine print rejection
  assert.equal(rejectGeminiCandidateReason({
    productName: "NET WT 12 OZ INGREDIENTS WATER",
    priceText: "",
    priceAmount: null,
    rawEvidence: "NET WT CAUTION",
  }), "junk_or_fine_print");

  // Price repair $399 -> $3.99
  const repaired399 = repairGeminiCandidatePrice({
    priceText: "$399",
    priceAmount: 399,
    rawEvidence: "$399 EA",
    dealType: "each",
  });
  assert.equal(repaired399.priceAmount, 3.99);
  assert.equal(repaired399.priceRepaired, true);

  // 99¢ handling
  const centRepair = repairGeminiCandidatePrice({
    priceText: "99¢ LB",
    priceAmount: null,
    rawEvidence: "99¢ LB",
    dealType: "weight_based",
  });
  assert.equal(centRepair.priceAmount, 0.99);

  // Multi-buy 2 FOR $5
  const multiBuy = repairGeminiCandidatePrice({
    priceText: "2 FOR $5",
    priceAmount: 5,
    rawEvidence: "2 FOR $5",
    dealType: "multi_buy",
  });
  assert.match(multiBuy.priceText, /2 for/i);
  assert.equal(multiBuy.dealType, "multi_buy");

  // Validation + needs_review mapping
  const validated = validateAndSanitizeGeminiCandidates(
    [
      {
        product_name: "Fresh Strawberries",
        price_text: "$3.99",
        price_amount: 3.99,
        unit: "EA",
        deal_type: "SINGLE_UNIT",
        source_page: 1,
        confidence_score: 0.82,
        raw_evidence: "Fresh Strawberries $3.99 EA",
        search_tags: ["berries"],
      },
    ],
    1
  );
  assert.equal(validated.candidates.length, 1);

  const items = mapGeminiCandidatesToOfertaLocalItems({
    candidates: validated.candidates,
    sourceAssetId: "asset-1",
    sourceAssetUrl: "https://example.com/flyer.pdf",
    sourceFileName: "flyer.pdf",
    sourceStoragePath: "ofertas/flyer.pdf",
    assetKind: "flyer",
    businessName: "Test Market",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZipCode: "",
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].reviewStatus, "needs_review");
  assert.equal(items[0].isActive, false);

  // GEMINI_API_KEY check is server-side only (no NEXT_PUBLIC)
  assert.match(read("app/lib/ofertas-locales/ofertasLocalesGeminiConfig.ts"), /GEMINI_API_KEY/);
  assert.doesNotMatch(read("app/lib/ofertas-locales/ofertasLocalesGeminiConfig.ts"), /NEXT_PUBLIC_GEMINI/);

  console.log("OFERTAS-AI-POWER-1 audit passed.");
}

run();
