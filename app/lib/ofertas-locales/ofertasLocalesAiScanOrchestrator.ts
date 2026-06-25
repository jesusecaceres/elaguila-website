import "server-only";

import { normalizeDocumentAiResultToOfertaLocalItems } from "./ofertasLocalesAiNormalizer";
import {
  isOfertaLocalGeminiConfigured,
  resolveOfertasAiExtractionProvider,
  type OfertasAiExtractionProvider,
} from "./ofertasLocalesGeminiConfig";
import { isOfertaLocalDocumentAiConfigured } from "./ofertasLocalesDocumentAiConfig";
import { runGeminiMultimodalOfertaLocalScan } from "./ofertasLocalesGeminiScanPipeline";
import {
  processOfertaLocalAssetWithDocumentAi,
  type OfertaLocalDocumentAiRawExtraction,
} from "./ofertasLocalesDocumentAiClient";
import type { OfertaLocalAiExtractionDebugStats } from "./ofertasLocalesAiExtractionQuality";
import type { OfertaLocalSearchableItemDraft } from "./ofertasLocalesTypes";

export type OfertaLocalAiScanExtractionParams = {
  fileBuffer: Buffer;
  mimeType: string;
  assetId: string;
  assetKind: "flyer" | "coupon";
  ofertaLocalId: string;
  ownerId: string;
  scanJobId: string;
  sourceAssetUrl: string;
  sourceFileName: string;
  sourceStoragePath: string;
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  validFrom?: string;
  validUntil?: string;
};

export type OfertaLocalAiScanExtractionResult = {
  items: OfertaLocalSearchableItemDraft[];
  providerUsed: OfertasAiExtractionProvider;
  modelUsed: string;
  pagesProcessed: number;
  rawCandidateCount: number;
  insertedCandidateCount: number;
  rejectedCount: number;
  rejectedReasonCounts: Record<string, number>;
  averageConfidence: number | null;
  priceRepairsApplied: number;
  rawOcrSummary: Record<string, unknown>;
  note: string;
  pageErrors: string[];
  confidenceAverage: number | null;
};

export async function runOfertaLocalAiScanExtraction(
  params: OfertaLocalAiScanExtractionParams
): Promise<OfertaLocalAiScanExtractionResult> {
  const provider = resolveOfertasAiExtractionProvider();

  if (!provider) {
    throw new Error(
      "No AI scan provider configured. Set GEMINI_API_KEY or Google Document AI credentials."
    );
  }

  console.info("[ofertas-locales ai] provider selected", { provider });

  if (provider === "gemini_multimodal") {
    try {
      const gemini = await runGeminiMultimodalOfertaLocalScan({
        fileBuffer: params.fileBuffer,
        mimeType: params.mimeType,
        assetId: params.assetId,
        assetKind: params.assetKind,
        ofertaLocalId: params.ofertaLocalId,
        scanJobId: params.scanJobId,
        ownerId: params.ownerId,
        sourceAssetUrl: params.sourceAssetUrl,
        sourceFileName: params.sourceFileName,
        sourceStoragePath: params.sourceStoragePath,
        businessName: params.businessName,
        businessAddress: params.businessAddress,
        businessCity: params.businessCity,
        businessState: params.businessState,
        businessZipCode: params.businessZipCode,
        validFrom: params.validFrom,
        validUntil: params.validUntil,
      });

      if (gemini.items.length > 0 || gemini.ok) {
        return {
          items: gemini.items,
          providerUsed: "gemini_multimodal",
          modelUsed: gemini.modelUsed,
          pagesProcessed: gemini.pagesProcessed,
          rawCandidateCount: gemini.rawCandidateCount,
          insertedCandidateCount: gemini.insertedCandidateCount,
          rejectedCount: gemini.rejectedCount,
          rejectedReasonCounts: gemini.rejectedReasonCounts,
          averageConfidence: gemini.averageConfidence,
          priceRepairsApplied: gemini.priceRepairsApplied,
          confidenceAverage: gemini.averageConfidence,
          note: gemini.note,
          pageErrors: gemini.pageErrors,
          rawOcrSummary: buildGeminiSummary(gemini),
        };
      }

      if (isOfertaLocalDocumentAiConfigured()) {
        console.warn("[ofertas-locales ai] gemini returned no items; falling back to document ai");
        return runDocumentAiFallback(params);
      }

      throw new Error(
        "Gemini extraction failed. Existing OCR fallback unavailable."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gemini extraction failed.";
      if (isOfertaLocalDocumentAiConfigured()) {
        console.warn("[ofertas-locales ai] gemini failed; falling back to document ai", {
          error: message.slice(0, 300),
        });
        return runDocumentAiFallback(params);
      }
      throw new Error("Gemini extraction failed. Existing OCR fallback unavailable.");
    }
  }

  return runDocumentAiFallback(params);
}

async function runDocumentAiFallback(
  params: OfertaLocalAiScanExtractionParams
): Promise<OfertaLocalAiScanExtractionResult> {
  if (!isOfertaLocalDocumentAiConfigured()) {
    if (isOfertaLocalGeminiConfigured()) {
      throw new Error("Document AI fallback is not configured.");
    }
    throw new Error("No AI scan provider available.");
  }

  console.info("[ofertas-locales ai] provider selected", { provider: "fallback_document_ai" });

  const extraction = await processOfertaLocalAssetWithDocumentAi({
    fileBuffer: params.fileBuffer,
    mimeType: params.mimeType,
    assetId: params.assetId,
    ofertaLocalId: params.ofertaLocalId,
    ownerId: params.ownerId,
  });

  const normalized = normalizeDocumentAiResultToOfertaLocalItems({
    extraction,
    sourceAssetId: params.assetId,
    sourceAssetUrl: params.sourceAssetUrl,
    sourceFileName: params.sourceFileName,
    assetKind: params.assetKind,
    businessName: params.businessName,
    businessAddress: params.businessAddress,
    businessCity: params.businessCity,
    businessState: params.businessState,
    businessZipCode: params.businessZipCode,
    validFrom: params.validFrom,
    validUntil: params.validUntil,
  });

  return {
    items: normalized.items,
    providerUsed: "fallback_document_ai",
    modelUsed: "google_document_ai",
    pagesProcessed: extraction.pagesProcessed,
    rawCandidateCount: extraction.pageLines.length,
    insertedCandidateCount: normalized.items.length,
    rejectedCount: sumRejectCounts(normalized.debug?.rejectedReasonCounts),
    rejectedReasonCounts: normalized.debug?.rejectedReasonCounts ?? {},
    averageConfidence: normalized.debug?.averageConfidence ?? extraction.confidenceAverage,
    priceRepairsApplied: normalized.debug?.priceRepairsApplied ?? 0,
    confidenceAverage: extraction.confidenceAverage,
    note: normalized.note,
    pageErrors: [],
    rawOcrSummary: buildDocumentAiSummary(extraction, params, normalized.debug),
  };
}

function buildGeminiSummary(
  gemini: Awaited<ReturnType<typeof runGeminiMultimodalOfertaLocalScan>>
): Record<string, unknown> {
  return {
    provider_used: gemini.providerUsed,
    model_used: gemini.modelUsed,
    page_count_processed: gemini.pagesProcessed,
    page_count_total: gemini.pageCountTotal,
    pages_capped: gemini.pagesCapped,
    raw_candidate_count: gemini.rawCandidateCount,
    inserted_count: gemini.insertedCandidateCount,
    rejected_count: gemini.rejectedCount,
    rejected_reason_counts: gemini.rejectedReasonCounts,
    average_confidence: gemini.averageConfidence,
    price_repairs_applied: gemini.priceRepairsApplied,
    crops_generated: gemini.cropsGenerated,
    crop_errors: gemini.cropErrors,
    rasterization_fallback: gemini.rasterizationFallback,
    page_errors: gemini.pageErrors,
  };
}

function sumRejectCounts(counts: Record<string, number> | undefined): number {
  if (!counts) return 0;
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

function buildDocumentAiSummary(
  extraction: OfertaLocalDocumentAiRawExtraction,
  params: OfertaLocalAiScanExtractionParams,
  debug: OfertaLocalAiExtractionDebugStats | undefined
): Record<string, unknown> {
  return {
    provider_used: "fallback_document_ai",
    model_used: "google_document_ai",
    page_count_processed: extraction.pagesProcessed,
    raw_candidate_count: extraction.pageLines.length,
    inserted_count: debug?.insertedCount ?? null,
    rejected_count: sumRejectCounts(debug?.rejectedReasonCounts),
    rejected_reason_counts: debug?.rejectedReasonCounts ?? {},
    average_confidence: debug?.averageConfidence ?? extraction.confidenceAverage,
    price_repairs_applied: debug?.priceRepairsApplied ?? 0,
    textLength: extraction.text.length,
    entityCount: extraction.entities.length,
    mimeType: params.mimeType,
    assetKind: params.assetKind,
  };
}
