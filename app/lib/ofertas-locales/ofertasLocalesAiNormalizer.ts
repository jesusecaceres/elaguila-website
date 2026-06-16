import type {
  OfertaLocalDocumentAiBoundingBox,
  OfertaLocalDocumentAiRawExtraction,
} from "./ofertasLocalesDocumentAiClient";
import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import type { OfertaLocalCandidateType, OfertaLocalSearchableItemDraft } from "./ofertasLocalesTypes";

const SALE_PRICE_RE =
  /(\$?\d{1,4}(?:\.\d{2})?)\s*(?:\/|per)?\s*([a-zA-Z]{1,12})?|(?:^|\s)(\d{1,4}\.\d{2})(?:\s|$)/;

const REGULAR_PRICE_RE =
  /(?:reg\.?|regular|was|before)\s*(\$?\d{1,4}(?:\.\d{2})?)/i;

const COUPON_OFFER_RE =
  /(\d{1,2}\s*%\s*off|save\s+\$?\d+(?:\.\d{2})?|buy\s+\d+\s+get\s+\d+|bogo|free)/i;

const DEPARTMENT_HINTS = [
  "produce",
  "meat",
  "seafood",
  "dairy",
  "bakery",
  "deli",
  "frozen",
  "grocery",
  "beverages",
  "pantry",
];

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
};

type ParsedLine = {
  text: string;
  pageNumber: number | null;
  confidence: number | null;
  boundingBox: OfertaLocalDocumentAiBoundingBox | null;
};

function parseSalePrice(line: string): {
  priceText: string;
  priceAmount: number | null;
  unit: string;
  regularPriceText: string;
} {
  const regularMatch = line.match(REGULAR_PRICE_RE);
  const regularPriceText = regularMatch?.[1]?.startsWith("$")
    ? regularMatch[1]
    : regularMatch?.[1]
      ? `$${regularMatch[1].replace("$", "")}`
      : "";

  const match = line.match(SALE_PRICE_RE);
  if (!match) {
    return { priceText: "", priceAmount: null, unit: "", regularPriceText };
  }
  const raw = (match[1] ?? match[3] ?? "").replace("$", "");
  const amount = Number.parseFloat(raw);
  const priceText = raw ? `$${raw}` : "";
  const unit = (match[2] ?? "").trim().toLowerCase();
  return {
    priceText,
    priceAmount: Number.isFinite(amount) ? amount : null,
    unit,
    regularPriceText,
  };
}

function inferCategory(contextLines: string[]): string {
  const blob = contextLines.join(" ").toLowerCase();
  for (const hint of DEPARTMENT_HINTS) {
    if (blob.includes(hint)) return hint.charAt(0).toUpperCase() + hint.slice(1);
  }
  return "";
}

function lineLooksLikeProduct(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 140) return false;
  if (/^https?:\/\//i.test(t)) return false;
  if (/^\d+$/.test(t)) return false;
  if (/^(page|página)\s+\d+/i.test(t)) return false;
  return SALE_PRICE_RE.test(t) || (t.split(/\s+/).length <= 10 && /[a-zA-Z]{3,}/.test(t));
}

function lineLooksLikeCoupon(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 180) return false;
  if (/^https?:\/\//i.test(t)) return false;
  return (
    COUPON_OFFER_RE.test(t) ||
    SALE_PRICE_RE.test(t) ||
    /\$\s*\d/.test(t) ||
    (t.split(/\s+/).length <= 14 && /[a-zA-Z]{4,}/.test(t))
  );
}

function buildSourceContext(pageLines: ParsedLine[], index: number): string {
  const parts: string[] = [];
  const current = pageLines[index];
  if (current.pageNumber != null) {
    parts.push(`Page ${current.pageNumber}`);
  }
  const prev = pageLines[index - 1]?.text?.trim();
  if (prev && prev.length <= 60 && !SALE_PRICE_RE.test(prev)) {
    parts.push(prev);
  }
  const category = inferCategory(pageLines.slice(Math.max(0, index - 3), index + 1).map((l) => l.text));
  if (category) parts.push(category);
  return parts.join(" · ").slice(0, 240);
}

function candidateTypeForAssetKind(assetKind: "flyer" | "coupon"): OfertaLocalCandidateType {
  return assetKind === "coupon" ? "coupon" : "product_deal";
}

function linesFromExtraction(extraction: OfertaLocalDocumentAiRawExtraction): ParsedLine[] {
  if (extraction.pageLines.length > 0) {
    return extraction.pageLines.map((l) => ({
      text: l.text,
      pageNumber: l.pageNumber,
      confidence: l.confidence,
      boundingBox: l.boundingBox,
    }));
  }
  return extraction.text
    .split(/\r?\n/)
    .map((text) => ({ text: text.trim(), pageNumber: null, confidence: null, boundingBox: null }))
    .filter((l) => l.text.length > 0);
}

/**
 * Deterministic OCR normalizer — real Document AI text/layout only; no LLM, no sample data.
 */
export function normalizeDocumentAiResultToOfertaLocalItems(
  params: OfertaLocalAiNormalizerParams
): OfertaLocalAiNormalizerResult {
  const pageLines = linesFromExtraction(params.extraction);
  const isCoupon = params.assetKind === "coupon";
  const candidateType = candidateTypeForAssetKind(params.assetKind);

  if (pageLines.length === 0) {
    return {
      items: [],
      note: "No extractable text returned from Document AI.",
    };
  }

  const items: OfertaLocalSearchableItemDraft[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < pageLines.length; i++) {
    const line = pageLines[i];
    const text = line.text.trim();
    if (!text) continue;
    if (isCoupon ? !lineLooksLikeCoupon(text) : !lineLooksLikeProduct(text)) continue;

    const { priceText, priceAmount, unit, regularPriceText } = parseSalePrice(text);
    const strippedName = text.replace(SALE_PRICE_RE, "").replace(REGULAR_PRICE_RE, "").replace(/\s+/g, " ").trim();
    const itemName = strippedName || text;
    const normalizedItemName = normalizeOfertaLocalSearchText(itemName);
    const key = `${normalizedItemName}|${priceText}|${line.pageNumber ?? 0}`;
    if (!normalizedItemName || seen.has(key)) continue;
    seen.add(key);

    const sourceContext = buildSourceContext(pageLines, i);
    const offerMatch = text.match(COUPON_OFFER_RE);
    const offerText = isCoupon ? offerMatch?.[0] ?? priceText : priceText;
    const couponTitle = isCoupon ? itemName : "";
    const terms = isCoupon && text.length > itemName.length + 8 ? text.slice(itemName.length).trim() : "";

    const lineConfidence = line.confidence ?? params.extraction.confidenceAverage;
    const lowConfidence = lineConfidence != null && lineConfidence < 0.55;

    items.push({
      itemName,
      normalizedItemName,
      description: isCoupon ? terms : "",
      category: inferCategory(pageLines.slice(Math.max(0, i - 4), i).map((l) => l.text)),
      subcategory: "",
      priceText: isCoupon ? offerText : priceText,
      priceAmount,
      regularPriceText: regularPriceText,
      unit,
      dealType: isCoupon ? (terms ? "coupon_terms" : "coupon_offer") : priceText ? "price_special" : "mention",
      quantity: "",
      searchTags: normalizedItemName ? [normalizedItemName] : [],
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      sourceAssetId: params.sourceAssetId,
      sourceAssetUrl: params.sourceAssetUrl,
      sourceFileName: params.sourceFileName ?? "",
      sourcePage: line.pageNumber,
      sourceContext,
      sourceBbox: line.boundingBox,
      sourceCropUrl: "",
      candidateType,
      couponTitle,
      offerText,
      terms,
      confidence: lineConfidence,
      reviewStatus: "needs_review",
      reviewerNote: "",
      isActive: false,
      isSponsored: false,
      sponsorshipWeight: null,
      businessName: params.businessName,
      businessAddress: params.businessAddress,
      businessCity: params.businessCity,
      businessState: params.businessState,
      businessZipCode: params.businessZipCode,
      extractedJson: {
        ocrLine: text,
        assetKind: params.assetKind,
        hasBoundingBox: Boolean(line.boundingBox),
      },
    });

    if (items.length >= 50) break;
  }

  if (items.length === 0) {
    return {
      items: [],
      note:
        params.extraction.text.length > 0
          ? "No se encontraron sugerencias claras en el OCR. Revisa el archivo o intenta con mejor calidad."
          : "Raw scan stored; no safe deterministic item candidates extracted.",
    };
  }

  return {
    items,
    note: `${items.length} sugerencia(s) extraída(s) del OCR para revisión. No se publican automáticamente.`,
  };
}
