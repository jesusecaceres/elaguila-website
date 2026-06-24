import type {
  OfertaLocalDocumentAiBoundingBox,
  OfertaLocalDocumentAiRawExtraction,
} from "./ofertasLocalesDocumentAiClient";
import {
  buildSearchTags,
  extractSizeUnitSnippet,
  incrementReject,
  inferBroadCategory,
  isBrandOnlyName,
  isHeaderFooterZone,
  isJunkOcrLine,
  lineHasPriceEvidence,
  logOfertaLocalAiExtraction,
  normalizeAiTextKey,
  parsePriceEvidence,
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
  offerText: string;
  quantity: string;
  unit: string;
  category: string;
  sourcePage: number | null;
  sourceContext: string;
  sourceBbox: OfertaLocalDocumentAiBoundingBox | null;
  confidence: number | null;
  contextLines: string[];
  pricePatternId: string;
  priceWeight: number;
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
    (l) => l.index !== priceLine.index && l.pageNumber === priceLine.pageNumber && !isJunkOcrLine(l.text)
  );

  if (pb) {
    const picked = samePage.filter((l) => {
      if (!l.boundingBox) return false;
      const lb = l.boundingBox;
      if (isHeaderFooterZone(lb.yMin, lb.yMax)) return false;
      if (lineHasPriceEvidence(l.text) && l.text !== priceLine.text) return false;
      // Product text sits above the price tag on weekly ad grids.
      if (lb.yMax > pb.yMin + 0.04) return false;
      if (pb.yMin - lb.yMax > 0.28) return false;
      const centerDelta = Math.abs((lb.xMin + lb.xMax) / 2 - (pb.xMin + pb.xMax) / 2);
      return bboxOverlapX(pb, lb) || centerDelta < 0.18;
    });
    picked.sort((a, b) => (a.boundingBox?.yMin ?? 0) - (b.boundingBox?.yMin ?? 0));
    if (picked.length > 0) return picked.slice(-4);
  }

  // Index fallback: gather up to 4 non-price lines immediately above the price line.
  const idx = pageLines.findIndex((l) => l.index === priceLine.index);
  const above: ParsedLine[] = [];
  for (let i = idx - 1; i >= 0 && above.length < 4; i--) {
    const line = pageLines[i];
    if (line.pageNumber !== priceLine.pageNumber) break;
    if (isJunkOcrLine(line.text)) continue;
    if (lineHasPriceEvidence(line.text)) break;
    above.unshift(line);
  }
  return above;
}

function buildProductNameAndDescription(contextLines: ParsedLine[], priceLine: ParsedLine): {
  itemName: string;
  description: string;
  unit: string;
} {
  const texts = contextLines.map((l) => l.text.trim()).filter(Boolean);
  const sizeSnippets: string[] = [];
  const nameParts: string[] = [];

  for (const t of texts) {
    const size = extractSizeUnitSnippet(t);
    if (size) sizeSnippets.push(size);
    if (isJunkOcrLine(t) || isBrandOnlyName(t)) continue;
    if (lineHasPriceEvidence(t)) continue;
    nameParts.push(t);
  }

  let itemName = nameParts.join(" · ").replace(/\s+/g, " ").trim();
  if (!itemName && texts.length) {
    itemName = texts.filter((t) => !isJunkOcrLine(t)).join(" · ").trim();
  }

  const priceSize = extractSizeUnitSnippet(priceLine.text);
  if (priceSize) sizeSnippets.push(priceSize);

  const description = [...new Set(sizeSnippets)].join(" · ").slice(0, 240);
  const unit = extractSizeUnitSnippet(description) || "";

  return { itemName, description, unit };
}

function buildCandidateFromPriceBlock(priceLine: ParsedLine, pageLines: ParsedLine[]): ProductCandidateDraft | null {
  const priceEvidence = parsePriceEvidence(priceLine.text);
  if (!priceEvidence) return null;

  const contextLines = collectContextLinesForPrice(priceLine, pageLines);
  const { itemName, description, unit } = buildProductNameAndDescription(contextLines, priceLine);

  const mergedText = [itemName, description, priceLine.text, ...contextLines.map((l) => l.text)]
    .filter(Boolean)
    .join(" ");
  const category = inferBroadCategory(mergedText);
  const finalUnit = priceEvidence.unit || unit;
  const contextText = contextLines.map((l) => l.text).join(" | ");

  const confidence = scoreProductCandidate({
    itemName,
    description,
    priceText: priceEvidence.priceText,
    priceWeight: priceEvidence.weight,
    unit: finalUnit,
    quantity: priceEvidence.quantity,
    contextLineCount: contextLines.length,
    ocrConfidence: priceLine.confidence,
  });

  return {
    itemName,
    description,
    priceText: priceEvidence.priceText,
    priceAmount: priceEvidence.priceAmount,
    regularPriceText: priceEvidence.regularPriceText,
    offerText: priceEvidence.offerText,
    quantity: priceEvidence.quantity,
    unit: finalUnit,
    category,
    sourcePage: priceLine.pageNumber,
    sourceContext: [contextText, priceLine.text].filter(Boolean).join(" · ").slice(0, 480),
    sourceBbox: priceLine.boundingBox,
    confidence,
    contextLines: contextLines.map((l) => l.text),
    pricePatternId: priceEvidence.patternId,
    priceWeight: priceEvidence.weight,
  };
}

function rejectReasonForCandidate(
  candidate: ProductCandidateDraft,
  isCoupon: boolean
): OfertaLocalAiExtractionRejectReason | null {
  const name = candidate.itemName.trim();
  const nameKey = normalizeAiTextKey(name);

  if (!name || name.length < 3) return "too_short";
  if (/^\d+$/.test(name)) return "numeric_only";
  if (PAGE_CODE(name)) return "page_code";
  if (isJunkOcrLine(name)) return "junk_header";
  if (isBrandOnlyName(name)) return "brand_only";
  if (STORE_BRAND(nameKey)) return "store_branding";

  const hasPrice =
    Boolean(candidate.priceText?.trim()) ||
    Boolean(candidate.offerText?.trim()) ||
    candidate.priceAmount != null;

  if (!hasPrice && !isCoupon) return "no_price";
  if (
    candidate.pricePatternId === "when_you_buy" &&
    candidate.priceAmount == null &&
    !/\$\s*\d/.test(`${candidate.offerText} ${candidate.priceText}`)
  ) {
    return "no_price";
  }
  if (isCoupon && !hasPrice && !COUPON_OFFER_RE.test(candidate.offerText)) return "weak_coupon";

  if (candidate.confidence != null && candidate.confidence < 0.42 && !isCoupon) {
    if (!hasPrice) return "no_price";
    if (name.length < 8) return "too_short";
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
    normalizeAiTextKey(candidate.priceText),
    candidate.sourcePage ?? 0,
  ].join("|");
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
    dealType: isCoupon ? "coupon_offer" : candidate.quantity ? "multi_buy" : "price_special",
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
    terms: candidate.regularPriceText,
    confidence: candidate.confidence,
    reviewStatus: "needs_review",
    reviewerNote: candidate.confidence != null && candidate.confidence < 0.55 ? "low_confidence" : "",
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
      contextLines: candidate.contextLines,
      assetKind: params.assetKind,
      hasBoundingBox: Boolean(candidate.sourceBbox),
      qualityScore: candidate.confidence,
    },
  };
}

function normalizeCouponLines(
  pageLines: ParsedLine[],
  params: OfertaLocalAiNormalizerParams,
  stats: OfertaLocalAiExtractionDebugStats
): OfertaLocalSearchableItemDraft[] {
  const items: OfertaLocalSearchableItemDraft[] = [];
  const seen = new Set<string>();

  for (const line of pageLines) {
    if (isJunkOcrLine(line.text)) {
      incrementReject(stats.rejectedReasonCounts, "junk_header");
      continue;
    }
    if (!COUPON_OFFER_RE.test(line.text) && !lineHasPriceEvidence(line.text)) continue;

    const candidate = buildCandidateFromPriceBlock(line, pageLines);
    if (!candidate) continue;
    stats.candidatesGenerated++;

    const reject = rejectReasonForCandidate(candidate, true);
    if (reject) {
      incrementReject(stats.rejectedReasonCounts, reject);
      continue;
    }

    const key = candidateDedupeKey(candidate);
    if (seen.has(key)) {
      incrementReject(stats.rejectedReasonCounts, "duplicate");
      continue;
    }
    seen.add(key);
    items.push(toItemDraft(candidate, params, "coupon"));
    if (items.length >= MAX_COUPON_ITEMS) break;
  }

  return items;
}

function normalizeFlyerByPriceBlocks(
  pageLines: ParsedLine[],
  params: OfertaLocalAiNormalizerParams,
  stats: OfertaLocalAiExtractionDebugStats
): OfertaLocalSearchableItemDraft[] {
  const priceLines = pageLines.filter((line) => {
    if (isJunkOcrLine(line.text)) return false;
    if (line.boundingBox && isHeaderFooterZone(line.boundingBox.yMin, line.boundingBox.yMax)) {
      incrementReject(stats.rejectedReasonCounts, "footer_header_zone");
      return false;
    }
    return lineHasPriceEvidence(line.text);
  });

  stats.priceBlockCount = priceLines.length;
  logOfertaLocalAiExtraction("price blocks found", { count: priceLines.length });

  const items: OfertaLocalSearchableItemDraft[] = [];
  const seen = new Set<string>();

  for (const priceLine of priceLines) {
    const candidate = buildCandidateFromPriceBlock(priceLine, pageLines);
    if (!candidate) continue;
    stats.candidatesGenerated++;

    const reject = rejectReasonForCandidate(candidate, false);
    if (reject) {
      incrementReject(stats.rejectedReasonCounts, reject);
      continue;
    }

    const key = candidateDedupeKey(candidate);
    if (seen.has(key)) {
      incrementReject(stats.rejectedReasonCounts, "duplicate");
      continue;
    }
    seen.add(key);

    items.push(toItemDraft(candidate, params, "product_deal"));
    if (items.length >= MAX_FLYER_ITEMS) break;
  }

  items.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  return items;
}

/**
 * Deterministic OCR normalizer — groups price blocks with nearby product text (Gate OFERTAS-AI-QUALITY-1).
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
  logOfertaLocalAiExtraction("items inserted", { count: stats.insertedCount });

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
