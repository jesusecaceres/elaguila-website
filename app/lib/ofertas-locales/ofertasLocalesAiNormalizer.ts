import type { OfertaLocalDocumentAiRawExtraction } from "./ofertasLocalesDocumentAiClient";
import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import type { OfertaLocalSearchableItemDraft } from "./ofertasLocalesTypes";

const PRICE_LINE_RE =
  /(\$?\d{1,4}(?:\.\d{2})?)\s*(?:\/|per)?\s*([a-zA-Z]{1,12})?|(?:^|\s)(\d{1,4}\.\d{2})(?:\s|$)/;

export type OfertaLocalAiNormalizerParams = {
  extraction: OfertaLocalDocumentAiRawExtraction;
  sourceAssetId: string;
  sourceAssetUrl: string;
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

function parsePriceLine(line: string): { priceText: string; priceAmount: number | null; unit: string } {
  const match = line.match(PRICE_LINE_RE);
  if (!match) {
    return { priceText: "", priceAmount: null, unit: "" };
  }
  const raw = (match[1] ?? match[3] ?? "").replace("$", "");
  const amount = Number.parseFloat(raw);
  const priceText = raw ? `$${raw}` : "";
  const unit = (match[2] ?? "").trim().toLowerCase();
  return {
    priceText,
    priceAmount: Number.isFinite(amount) ? amount : null,
    unit,
  };
}

function lineLooksLikeItem(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 120) return false;
  if (/^https?:\/\//i.test(t)) return false;
  if (/^\d+$/.test(t)) return false;
  return PRICE_LINE_RE.test(t) || (t.split(/\s+/).length <= 8 && /[a-zA-Z]{3,}/.test(t));
}

/**
 * Deterministic placeholder normalizer — no OpenAI/Gemini.
 * Returns rough candidates only; may return zero items when parsing is unsafe.
 */
export function normalizeDocumentAiResultToOfertaLocalItems(
  params: OfertaLocalAiNormalizerParams
): OfertaLocalAiNormalizerResult {
  const lines = params.extraction.text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      items: [],
      note: "No extractable text returned from Document AI.",
    };
  }

  const items: OfertaLocalSearchableItemDraft[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!lineLooksLikeItem(line)) continue;
    const { priceText, priceAmount, unit } = parsePriceLine(line);
    const itemName = line.replace(PRICE_LINE_RE, "").replace(/\s+/g, " ").trim() || line;
    const normalizedItemName = normalizeOfertaLocalSearchText(itemName);
    const key = `${normalizedItemName}|${priceText}`;
    if (!normalizedItemName || seen.has(key)) continue;
    seen.add(key);

    const lowConfidence = params.extraction.confidenceAverage != null && params.extraction.confidenceAverage < 0.6;

    items.push({
      itemName,
      normalizedItemName,
      description: "",
      category: "",
      subcategory: "",
      priceText,
      priceAmount,
      unit,
      dealType: priceText ? "price_special" : "mention",
      quantity: "",
      searchTags: normalizedItemName ? [normalizedItemName] : [],
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      sourceAssetId: params.sourceAssetId,
      sourceAssetUrl: params.sourceAssetUrl,
      sourcePage: null,
      sourceCropUrl: "",
      confidence: params.extraction.confidenceAverage,
      reviewStatus: lowConfidence || !priceText ? "needs_review" : "pending",
      reviewerNote: "",
      isActive: false,
      isSponsored: false,
      sponsorshipWeight: null,
      businessName: params.businessName,
      businessAddress: params.businessAddress,
      businessCity: params.businessCity,
      businessState: params.businessState,
      businessZipCode: params.businessZipCode,
    });

    if (items.length >= 40) break;
  }

  return {
    items,
    note:
      items.length > 0
        ? "Placeholder normalizer produced draft candidates for owner review."
        : "Raw scan stored; no safe deterministic item candidates extracted.",
  };
}
