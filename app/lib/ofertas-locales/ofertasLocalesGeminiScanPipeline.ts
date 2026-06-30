import "server-only";

import { extractOfertasPageWithGemini } from "./ofertasLocalesGeminiPageExtractor";
import {
  selectGeminiModelForPageCount,
  type OfertasAiExtractionProvider,
} from "./ofertasLocalesGeminiConfig";
import { mapGeminiCandidatesToOfertaLocalItems } from "./ofertasLocalesGeminiNormalizer";
import {
  getOfertaLocalGeminiScanPageConcurrency,
  prepareOfertaLocalScanPageImages,
  type OfertaLocalPageImage,
} from "./ofertasLocalesPdfPageImages";
import { applyOfertaLocalScanItemCrops } from "./ofertasLocalesScanCropGenerator";
import type { OfertaLocalSearchableItemDraft } from "./ofertasLocalesTypes";

function logAiStage(stage: string, payload: Record<string, unknown>, level: "info" | "warn" = "info") {
  const logger = level === "warn" ? console.warn : console.info;
  logger(`[ofertas-locales-ai] ${stage}`, payload);
}

export type RunGeminiMultimodalScanParams = {
  fileBuffer: Buffer;
  mimeType: string;
  assetId: string;
  assetKind: "flyer" | "coupon";
  ofertaLocalId: string;
  scanJobId: string;
  ownerId: string;
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

export type GeminiMultimodalScanResult = {
  ok: boolean;
  providerUsed: OfertasAiExtractionProvider;
  modelUsed: string;
  pagesProcessed: number;
  pageCountTotal: number;
  pagesCapped: boolean;
  rawCandidateCount: number;
  insertedCandidateCount: number;
  rejectedCount: number;
  rejectedReasonCounts: Record<string, number>;
  averageConfidence: number | null;
  priceRepairsApplied: number;
  pageErrors: string[];
  renderWarnings: string[];
  rasterizationFallback: boolean;
  cropsGenerated: number;
  cropErrors: string[];
  items: OfertaLocalSearchableItemDraft[];
  note: string;
};

export async function runGeminiMultimodalOfertaLocalScan(
  params: RunGeminiMultimodalScanParams
): Promise<GeminiMultimodalScanResult> {
  console.info("[ofertas-locales ai] provider selected", { provider: "gemini_multimodal" });
  logAiStage("FILE_READY", {
    scanJobId: params.scanJobId,
    ofertaLocalId: params.ofertaLocalId,
    sourceFileName: params.sourceFileName,
    sourceStoragePath: params.sourceStoragePath,
    sourceAssetUrl: params.sourceAssetUrl,
    mimeType: params.mimeType,
    sizeBytes: params.fileBuffer.length,
  });

  const prepared = await prepareOfertaLocalScanPageImages({
    fileBuffer: params.fileBuffer,
    mimeType: params.mimeType,
  });
  logAiStage("METADATA_DISCOVERED", {
    scanJobId: params.scanJobId,
    totalPages: prepared.totalPageCount,
    sourceFileName: params.sourceFileName,
  });

  const modelUsed = selectGeminiModelForPageCount(prepared.pages.length);
  const concurrency = getOfertaLocalGeminiScanPageConcurrency();

  const pageResults = await mapPool(prepared.pages, concurrency, (page) =>
    extractOfertasPageWithGemini({
      imageBytes: page.imageBytes,
      mimeType: page.mimeType,
      pageNumber: page.pageNumber,
      sourceFileName: params.sourceFileName,
      sourceStoragePath: params.sourceStoragePath,
      modelName: modelUsed,
    })
  );

  const pageErrors: string[] = [...prepared.renderWarnings];
  const rejectedReasonCounts: Record<string, number> = {};
  let rawCandidateCount = 0;
  let rejectedCount = 0;
  let priceRepairsApplied = 0;
  const allCandidates = [];

  for (const result of pageResults) {
    if (!result.ok && result.error) {
      pageErrors.push(`Page ${result.pageNumber}: ${result.error}`);
    }
    logAiStage("GEMINI_RESPONSE_RECEIVED", {
      scanJobId: params.scanJobId,
      pageNumber: result.pageNumber,
      candidatesCount: result.candidates.length,
      model: modelUsed,
      provider: "gemini_multimodal",
    });
    rawCandidateCount += result.rawCandidateCount;
    rejectedCount += result.validationStats.rejectedCount;
    priceRepairsApplied += result.validationStats.priceRepairsApplied;
    for (const [reason, count] of Object.entries(result.validationStats.rejectedReasonCounts)) {
      rejectedReasonCounts[reason] = (rejectedReasonCounts[reason] ?? 0) + count;
    }
    allCandidates.push(...result.candidates);
  }

  const items = mapGeminiCandidatesToOfertaLocalItems({
    candidates: allCandidates,
    sourceAssetId: params.assetId,
    sourceAssetUrl: params.sourceAssetUrl,
    sourceFileName: params.sourceFileName,
    sourceStoragePath: params.sourceStoragePath,
    assetKind: params.assetKind,
    businessName: params.businessName,
    businessAddress: params.businessAddress,
    businessCity: params.businessCity,
    businessState: params.businessState,
    businessZipCode: params.businessZipCode,
    validFrom: params.validFrom,
    validUntil: params.validUntil,
  });

  const cropResult = await applyOfertaLocalScanItemCrops({
    items,
    ofertaLocalId: params.ofertaLocalId,
    scanJobId: params.scanJobId,
    sourceAssetId: params.assetId,
    pageImages: prepared.pages,
  });
  if (cropResult.cropErrors.length > 0) {
    pageErrors.push(...cropResult.cropErrors.slice(0, 10).map((e) => `crop: ${e}`));
  }

  const confidenceValues = items
    .map((item) => item.confidence)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const averageConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, v) => sum + v, 0) / confidenceValues.length
      : null;

  const pagesWithErrors = pageResults.filter((r) => !r.ok).length;
  const note =
    items.length > 0
      ? pagesWithErrors > 0
        ? `Gemini extracted ${items.length} item(s) for review; ${pagesWithErrors} page(s) had errors.`
        : `Gemini extracted ${items.length} item(s) for owner review.`
      : pagesWithErrors > 0
        ? "Gemini extraction completed but no valid product rows were found; some pages had errors."
        : "Gemini extraction completed but no valid product rows were found.";

  console.info("[ofertas-locales ai] items inserted", {
    candidateCount: items.length,
    pagesProcessed: prepared.pages.length,
    priceRepairsApplied,
  });

  return {
    ok: items.length > 0 || pageResults.some((r) => r.ok),
    providerUsed: "gemini_multimodal",
    modelUsed,
    pagesProcessed: prepared.pages.length,
    pageCountTotal: prepared.totalPageCount,
    pagesCapped: prepared.pagesCapped,
    rawCandidateCount,
    insertedCandidateCount: items.length,
    rejectedCount,
    rejectedReasonCounts,
    averageConfidence,
    priceRepairsApplied,
    pageErrors,
    renderWarnings: prepared.renderWarnings,
    rasterizationFallback: prepared.rasterizationFallback,
    cropsGenerated: cropResult.cropsGenerated,
    cropErrors: cropResult.cropErrors,
    items,
    note,
  };
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
