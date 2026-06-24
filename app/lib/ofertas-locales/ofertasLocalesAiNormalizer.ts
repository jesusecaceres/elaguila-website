import type {
  OfertaLocalDocumentAiBoundingBox,
  OfertaLocalDocumentAiRawExtraction,
} from "./ofertasLocalesDocumentAiClient";
import {
  buildSearchTags,
  incrementReject,
  inferBroadCategory,
  isBrandOnlyName,
  isHeaderFooterZone,
  isJunkOcrLine,
  isPackageFinePrint,
  lineHasPriceEvidence,
  logOfertaLocalAiExtraction,
  normalizeAiTextKey,
  OFERTAS_LOCALES_AI_MIN_INSERT_CONFIDENCE,
  parsePriceEvidence,
  pickBestProductLabel,
  scoreProductCandidate,
  type OfertaLocalAiExtractionDebugStats,
  type OfertaLocalAiExtractionRejectReason,
} from "./ofertasLocalesAiExtractionQuality";
import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import type { OfertaLocalCandidateType, OfertaLocalSearchableItemDraft } from "./ofertasLocalesTypes";

const COUPON_OFFER_RE =
  /(\d{1,2}\s*%\s*off|save\s+\$?\d+(?:\.\d{2})?|buy\s+\d+\s+get\s+\d+|bogo|free)/i;

const MAX_FLYER_ITEMS = 80;
const MAX_COUPON_ITEMS = 40;

export type OfertaLocalAiNormalizerParams = {
  extraction: OfertaLocalDocumentAiRawExtraction;
  sourceAssetId: string;
  sourceAssetUrl: string;
  sourceFileName?: string;
  assetKind: "flyer" | "coupon";
  businessName?: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZipCode?: string;
  validFrom?: string;
  validUntil?: string;
};

export type OfertaLocalAiNormalizerResult = {
  items: OfertaLocalSearchableItemDraft[];
  note: string;
  debug: OfertaLocalAiExtractionDebugStats;
};

type ParsedLine = {
  text: string;
  pageNumber: number | null;
  confidence: number | null;
  boundingBox: OfertaLocalDocumentAiBoundingBox | null;
  index: number;
};

type ProductCandidateDraft = {
  itemName: string;
  description: string;
  priceText: string;
  priceAmount: number | null;
  regularPriceText: string;
  salePriceText: string;
  savingsText: string;
  offerText: string;
  quantity: string;
  unit: string;
  dealType: string;
  category: string;
  sourcePage: number | null;
  sourceContext: string;
  sourceBbox: OfertaLocalDocumentAiBoundingBox | null;
  confidence: number | null;
  contextLines: string[];
  pricePatternId: string;
  priceWeight: number;
  priceRepaired: boolean;
};

function linesFromExtraction(extraction: OfertaLocalDocumentAiRawExtraction): ParsedLine[] {
  if (extraction.pageLines.length > 0) {
    return extraction.pageLines.map((l, index) => ({
      text: l.text.trim(),
      pageNumber: l.pageNumber,
      confidence: l.confidence,
      boundingBox: l.boundingBox,
      index,
    }));
  }
  return extraction.text
    .split(/\r?\n/)
    .map((text, index) => ({
      text: text.trim(),
      pageNumber: null,
      confidence: null,
      boundingBox: null,
      index,
    }))
    .filter((l) => l.text.length > 0);
}

function bboxOverlapX(a: OfertaLocalDocumentAiBoundingBox, b: OfertaLocalDocumentAiBoundingBox): boolean {
  return !(a.xMax < b.xMin || b.xMax < a.xMin);
}

function collectContextLinesForPrice(priceLine: ParsedLine, pageLines: ParsedLine[]): ParsedLine[] {
  const pb = priceLine.boundingBox;
  const samePage = pageLines.filter(
    (l) =>
      l.index !== priceLine.index &&
      l.pageNumber === priceLine.pageNumber &&
      !isJunkOcrLine(l.text) &&
      !isPackageFinePrint(l.text)
  );

  if (pb) {
    const picked = samePage
      .map((l) => {
        const lb = l.boundingBox!;
        const verticalGap = pb.yMin - lb.yMax;
        const centerDelta = Math.abs((lb.xMin + lb.xMax) / 2 - (pb.xMin + pb.xMax) / 2);
        const aligned = bboxOverlapX(pb, lb) || centerDelta < 0.18;
        return { line: l, verticalGap, aligned };
      })
      .filter(({ line, verticalGap, aligned }) => {
        const lb = line.boundingBox!;
        if (!aligned) return false;
        if (isHeaderFooterZone(lb.yMin, lb.yMax)) return false;
        if (lineHasPriceEvidence(line.text)) return false;
        if (lb.yMax > pb.yMin + 0.04) return false;
        if (verticalGap < 0 || verticalGap > 0.14) return false;
        return true;
      })
      .sort((a, b) => a.verticalGap - b.verticalGap)
      .map((entry) => entry.line);
    if (picked.length > 0) return picked.slice(0, 5);
  }

  const idx = pageLines.findIndex((l) => l.index === priceLine.index);
  const above: ParsedLine[] = [];
  for (let i = idx - 1; i >= 0 && above.length < 5; i--) {
    const line = pageLines[i];
    if (line.pageNumber !== priceLine.pageNumber) break;
    if (isJunkOcrLine(line.text) || isPackageFinePrint(line.text)) continue;
    if (lineHasPriceEvidence(line.text)) break;
    above.unshift(line);
  }
  return above;
}

function buildCandidateFromPriceBlock(
  priceLine: ParsedLine,
  pageLines: ParsedLine[],
  stats: OfertaLocalAiExtractionDebugStats
): ProductCandidateDraft | null {
  const priceEvidence = parsePriceEvidence(priceLine.text);
  if (!priceEvidence) return null;
  if (priceEvidence.priceRepaired) stats.priceRepairsApplied++;

  const contextLines = collectContextLinesForPrice(priceLine, pageLines);
  const label = pickBestProductLabel(contextLines.map((l) => l.text));

  const itemName = label.itemName.trim();
  const description = label.description.trim();
  const quantity = priceEvidence.quantity || label.quantity;
  const mergedText = [itemName, description, priceLine.text, ...label.supportingLines].filter(Boolean).join(" ");
  const category = inferBroadCategory(mergedText);
  const finalUnit = priceEvidence.unit || label.unit;
  const contextText = [...label.supportingLines, priceLine.text].filter(Boolean).join(" | ");

  const confidence = scoreProductCandidate({
    itemName,
    description,
    priceText: priceEvidence.priceText,
    priceWeight: priceEvidence.weight,
    unit: finalUnit,
    quantity,
    contextLineCount: contextLines.length,
    ocrConfidence: priceLine.confidence,
    priceRepaired: priceEvidence.priceRepaired,
  });

  return {
    itemName,
    description,
    priceText: priceEvidence.priceText,
    priceAmount: priceEvidence.priceAmount,
    regularPriceText: priceEvidence.regularPriceText,
    salePriceText: priceEvidence.salePriceText,
    savingsText: priceEvidence.savingsText,
    offerText: priceEvidence.offerText,
    quantity,
    unit: finalUnit,
    dealType: priceEvidence.dealType,
    category,
    sourcePage: priceLine.pageNumber,
    sourceContext: contextText.slice(0, 480),
    sourceBbox: priceLine.boundingBox,
    confidence,
    contextLines: [...label.supportingLines, priceLine.text],
    pricePatternId: priceEvidence.patternId,
    priceWeight: priceEvidence.weight,
    priceRepaired: priceEvidence.priceRepaired,
  };
}

function rejectReasonForCandidate(
  candidate: ProductCandidateDraft,
  isCoupon: boolean
): OfertaLocalAiExtractionRejectReason | null {
  const name = candidate.itemName.trim();
  const nameKey = normalizeAiTextKey(name);

  if (!name || name.length < 4) return "too_short";
  if (/^\d+$/.test(name)) return "numeric_only";
  if (PAGE_CODE(name)) return "page_code";
  if (isJunkOcrLine(name)) return "junk_header";
  if (isPackageFinePrint(name)) return "package_fine_print";
  if (isBrandOnlyName(name)) return "brand_only";
  if (STORE_BRAND(nameKey)) return "store_branding";
  if (name.split(/\s+/).length < 2 && name.length < 10) return "weak_name";

  const hasPrice =
    Boolean(candidate.priceText?.trim()) ||
    Boolean(candidate.salePriceText?.trim()) ||
    Boolean(candidate.offerText?.trim()) ||
    candidate.priceAmount != null ||
    candidate.dealType === "bogo" ||
    candidate.dealType === "free_item";

  if (!hasPrice && !isCoupon) return "no_price";
  if (
    candidate.pricePatternId === "when_you_buy" &&
    candidate.priceAmount == null &&
    !/\$\s*\d/.test(`${candidate.offerText} ${candidate.priceText}`)
  ) {
    return "no_price";
  }
  if (isCoupon && !hasPrice && !COUPON_OFFER_RE.test(candidate.offerText)) return "weak_coupon";

  if (candidate.confidence != null && candidate.confidence < OFERTAS_LOCALES_AI_MIN_INSERT_CONFIDENCE) {
    return "low_confidence";
  }

  return null;
}

function PAGE_CODE(name: string): boolean {
  return /^CA_\d+/i.test(name.trim());
}

function STORE_BRAND(key: string): boolean {
  return key === "CARDENAS" || key === "MARKETS" || key === "CARDENAS MARKETS";
}

function candidateDedupeKey(candidate: ProductCandidateDraft): string {
  return [
    normalizeAiTextKey(candidate.itemName),
    normalizeAiTextKey(candidate.priceText || candidate.offerText),
    candidate.sourcePage ?? 0,
  ].join("|");
}

function mergeDuplicateCandidate(
  existing: ProductCandidateDraft,
  incoming: ProductCandidateDraft
): ProductCandidateDraft {
  return (incoming.confidence ?? 0) >= (existing.confidence ?? 0) ? incoming : existing;
}

function toItemDraft(
  candidate: ProductCandidateDraft,
  params: OfertaLocalAiNormalizerParams,
  candidateType: OfertaLocalCandidateType
): OfertaLocalSearchableItemDraft {
  const itemName = candidate.itemName.trim();
  const normalizedItemName = normalizeOfertaLocalSearchText(itemName);
  const isCoupon = params.assetKind === "coupon";

  return {
    itemName,
    normalizedItemName,
    description: candidate.description,
    category: candidate.category,
    subcategory: "",
    priceText: candidate.priceText,
    priceAmount: candidate.priceAmount,
    regularPriceText: candidate.regularPriceText,
    unit: candidate.unit,
    dealType: isCoupon ? "coupon_offer" : candidate.dealType || "price_special",
    quantity: candidate.quantity,
    searchTags: buildSearchTags(itemName, candidate.description, candidate.category),
    validFrom: params.validFrom,
    validUntil: params.validUntil,
    sourceAssetId: params.sourceAssetId,
    sourceAssetUrl: params.sourceAssetUrl,
    sourceFileName: params.sourceFileName ?? "",
    sourcePage: candidate.sourcePage,
    sourceContext: candidate.sourceContext,
    sourceBbox: candidate.sourceBbox,
    sourceCropUrl: "",
    candidateType,
    couponTitle: isCoupon ? itemName : "",
    offerText: candidate.offerText,
    terms: candidate.savingsText || candidate.regularPriceText,
    confidence: candidate.confidence,
    reviewStatus: "needs_review",
    reviewerNote:
      candidate.confidence != null && candidate.confidence < 0.62
        ? "low_confidence"
        : candidate.priceRepaired
          ? "price_repaired"
          : "",
    isActive: false,
    isSponsored: false,
    sponsorshipWeight: null,
    businessName: params.businessName,
    businessAddress: params.businessAddress,
    businessCity: params.businessCity,
    businessState: params.businessState,
    businessZipCode: params.businessZipCode,
    extractedJson: {
      pricePatternId: candidate.pricePatternId,
      dealType: candidate.dealType,
      salePriceText: candidate.salePriceText,
      savingsText: candidate.savingsText,
      priceRepaired: candidate.priceRepaired,
      contextLines: candidate.contextLines,
      assetKind: params.assetKind,
      hasBoundingBox: Boolean(candidate.sourceBbox),
      qualityScore: candidate.confidence,
    },
  };
}

function finalizeCandidates(
  rawCandidates: ProductCandidateDraft[],
  params: OfertaLocalAiNormalizerParams,
  stats: OfertaLocalAiExtractionDebugStats,
  isCoupon: boolean
): OfertaLocalSearchableItemDraft[] {
  const deduped = new Map<string, ProductCandidateDraft>();

  for (const candidate of rawCandidates) {
    stats.candidatesGenerated++;
    const reject = rejectReasonForCandidate(candidate, isCoupon);
    if (reject) {
      incrementReject(stats.rejectedReasonCounts, reject);
      continue;
    }

    const key = candidateDedupeKey(candidate);
    const existing = deduped.get(key);
    if (existing) {
      stats.duplicateRemovals++;
      deduped.set(key, mergeDuplicateCandidate(existing, candidate));
      continue;
    }
    deduped.set(key, candidate);
  }

  const sorted = [...deduped.values()].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  const limit = isCoupon ? MAX_COUPON_ITEMS : MAX_FLYER_ITEMS;
  const items = sorted.slice(0, limit).map((c) => toItemDraft(c, params, isCoupon ? "coupon" : "product_deal"));

  if (items.length > 0) {
    const avg =
      items.reduce((sum, item) => sum + (item.confidence ?? 0), 0) / Math.max(items.length, 1);
    stats.averageConfidence = Math.round(avg * 1000) / 1000;
  }

  return items;
}

function normalizeCouponLines(
  pageLines: ParsedLine[],
  params: OfertaLocalAiNormalizerParams,
  stats: OfertaLocalAiExtractionDebugStats
): OfertaLocalSearchableItemDraft[] {
  const raw: ProductCandidateDraft[] = [];

  for (const line of pageLines) {
    if (isJunkOcrLine(line.text) || isPackageFinePrint(line.text)) {
      incrementReject(stats.rejectedReasonCounts, "junk_header");
      continue;
    }
    if (!COUPON_OFFER_RE.test(line.text) && !lineHasPriceEvidence(line.text)) continue;

    const candidate = buildCandidateFromPriceBlock(line, pageLines, stats);
    if (candidate) raw.push(candidate);
  }

  return finalizeCandidates(raw, params, stats, true);
}

function normalizeFlyerByPriceBlocks(
  pageLines: ParsedLine[],
  params: OfertaLocalAiNormalizerParams,
  stats: OfertaLocalAiExtractionDebugStats
): OfertaLocalSearchableItemDraft[] {
  const priceLines = pageLines.filter((line) => {
    if (isJunkOcrLine(line.text) || isPackageFinePrint(line.text)) return false;
    if (line.boundingBox && isHeaderFooterZone(line.boundingBox.yMin, line.boundingBox.yMax)) {
      incrementReject(stats.rejectedReasonCounts, "footer_header_zone");
      return false;
    }
    return lineHasPriceEvidence(line.text);
  });

  stats.priceBlockCount = priceLines.length;
  logOfertaLocalAiExtraction("price blocks found", { count: priceLines.length });

  const raw = priceLines
    .map((priceLine) => buildCandidateFromPriceBlock(priceLine, pageLines, stats))
    .filter((c): c is ProductCandidateDraft => c != null);

  return finalizeCandidates(raw, params, stats, false);
}

/**
 * Deterministic OCR normalizer — price-centered product cards (Gate OFERTAS-AI-QUALITY-2).
 */
export function normalizeDocumentAiResultToOfertaLocalItems(
  params: OfertaLocalAiNormalizerParams
): OfertaLocalAiNormalizerResult {
  const pageLines = linesFromExtraction(params.extraction);
  const stats: OfertaLocalAiExtractionDebugStats = {
    ocrLineCount: pageLines.length,
    priceBlockCount: 0,
    candidatesGenerated: 0,
    rejectedReasonCounts: {},
    insertedCount: 0,
    priceRepairsApplied: 0,
    duplicateRemovals: 0,
    averageConfidence: null,
  };

  logOfertaLocalAiExtraction("ocr lines parsed", { count: pageLines.length });

  if (pageLines.length === 0) {
    return {
      items: [],
      note: "No extractable text returned from Document AI.",
      debug: stats,
    };
  }

  const items =
    params.assetKind === "coupon"
      ? normalizeCouponLines(pageLines, params, stats)
      : normalizeFlyerByPriceBlocks(pageLines, params, stats);

  stats.insertedCount = items.length;

  logOfertaLocalAiExtraction("candidates generated", { count: stats.candidatesGenerated });
  logOfertaLocalAiExtraction("candidates rejected", { reasonCounts: stats.rejectedReasonCounts });
  logOfertaLocalAiExtraction("price repairs applied", { count: stats.priceRepairsApplied });
  logOfertaLocalAiExtraction("duplicate removals", { count: stats.duplicateRemovals });
  logOfertaLocalAiExtraction("items inserted", {
    count: stats.insertedCount,
    averageConfidence: stats.averageConfidence,
  });

  if (items.length === 0) {
    return {
      items: [],
      note:
        params.extraction.text.length > 0
          ? "No se encontraron sugerencias claras en el OCR. Revisa el archivo o intenta con mejor calidad."
          : "Raw scan stored; no safe deterministic item candidates extracted.",
      debug: stats,
    };
  }

  return {
    items,
    note: `${items.length} sugerencia(s) extraída(s) del OCR para revisión. No se publican automáticamente.`,
    debug: stats,
  };
}

/** Test helper — exported for audit scripts. */
export function debugParseOfertaLocalPriceLine(text: string) {
  return parsePriceEvidence(text);
}

export function debugIsJunkOfertaLocalAiLine(text: string) {
  return isJunkOcrLine(text);
}

export function debugIsPackageFinePrintLine(text: string) {
  return isPackageFinePrint(text);
}

export { repairRetailPriceDigits } from "./ofertasLocalesAiPriceNormalizer";
