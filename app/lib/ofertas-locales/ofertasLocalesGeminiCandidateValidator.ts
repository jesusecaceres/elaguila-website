import {
  isBrandOnlyName,
  isJunkOcrLine,
  isPackageFinePrint,
} from "./ofertasLocalesAiExtractionQuality";
import {
  normalizeOfertaLocalRetailPrice,
  repairRetailPriceDigits,
} from "./ofertasLocalesAiPriceNormalizer";
import { validateGeminiSourceBbox, type GeminiSourceBbox } from "./ofertasLocalesGeminiBbox";
import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import type { OfertaLocalSourceBoundingBox } from "./ofertasLocalesTypes";

export const OFERTAS_GEMINI_SUPPORTED_UNITS = [
  "LB",
  "EA",
  "OZ",
  "GAL",
  "PK",
  "FL_OZ",
  "LITER",
  "UNIT",
  "UNKNOWN",
] as const;

export type OfertaLocalGeminiUnit = (typeof OFERTAS_GEMINI_SUPPORTED_UNITS)[number];

export const OFERTAS_GEMINI_SUPPORTED_DEAL_TYPES = [
  "SINGLE_UNIT",
  "MULTI_BUY",
  "WEIGHT_BASED",
  "BOGO",
  "DIGITAL_COUPON",
  "FREE",
] as const;

export type OfertaLocalGeminiDealType = (typeof OFERTAS_GEMINI_SUPPORTED_DEAL_TYPES)[number];

export type OfertaLocalGeminiRawCandidate = {
  product_name?: unknown;
  brand?: unknown;
  description?: unknown;
  price_text?: unknown;
  price_amount?: unknown;
  sale_price_text?: unknown;
  regular_price_text?: unknown;
  savings_text?: unknown;
  unit?: unknown;
  quantity?: unknown;
  deal_type?: unknown;
  category?: unknown;
  search_tags?: unknown;
  source_page?: unknown;
  confidence_score?: unknown;
  needs_review_reason?: unknown;
  raw_evidence?: unknown;
  source_bbox?: unknown;
};

export type OfertaLocalGeminiValidatedCandidate = {
  productName: string;
  brand: string;
  description: string;
  priceText: string;
  priceAmount: number | null;
  salePriceText: string;
  regularPriceText: string;
  savingsText: string;
  unit: string;
  quantity: string;
  dealType: string;
  category: string;
  searchTags: string[];
  sourcePage: number;
  confidenceScore: number;
  needsReviewReason: string;
  rawEvidence: string;
  priceRepaired: boolean;
  sourceBbox: OfertaLocalSourceBoundingBox | null;
  sourceBboxGemini: GeminiSourceBbox | null;
};

export type OfertaLocalGeminiValidationStats = {
  rawCandidateCount: number;
  acceptedCount: number;
  rejectedCount: number;
  rejectedReasonCounts: Record<string, number>;
  priceRepairsApplied: number;
  duplicateRemovals: number;
};

const STORE_BRAND_RE =
  /^(CARDENAS|MARKETS|CARDENAS\s+MARKETS|EL\s+AGUILA|FOOD\s+BASICS|SAVE\s+MART|LUCKY|SAFEWAY|WALMART|TARGET|COSTCO)$/i;

function normalizeUnit(raw: unknown): string {
  const key = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/FL\.?\s*OZ/i, "FL_OZ");
  if ((OFERTAS_GEMINI_SUPPORTED_UNITS as readonly string[]).includes(key)) {
    return key === "UNKNOWN" ? "" : key;
  }
  if (/^LB|LBS|POUND/i.test(key)) return "LB";
  if (/^EA|EACH/i.test(key)) return "EA";
  if (/^OZ/i.test(key)) return "OZ";
  if (/^GAL/i.test(key)) return "GAL";
  if (/^PK|PACK/i.test(key)) return "PK";
  if (/^LITER|LITRE|L\b/i.test(key)) return "LITER";
  return "";
}

function normalizeDealType(raw: unknown): string {
  const key = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  switch (key) {
    case "SINGLE_UNIT":
      return "each";
    case "MULTI_BUY":
      return "multi_buy";
    case "WEIGHT_BASED":
      return "weight_based";
    case "BOGO":
      return "bogo";
    case "DIGITAL_COUPON":
      return "digital_coupon";
    case "FREE":
      return "free_item";
    default:
      return "each";
  }
}

function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function sanitizeString(raw: unknown, maxLen = 240): string {
  if (raw == null) return "";
  return String(raw).replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function sanitizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    const tag = sanitizeString(entry, 48).toLowerCase();
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= 12) break;
  }
  return out;
}

function hasPriceEvidence(priceText: string, rawEvidence: string, priceAmount: number | null): boolean {
  if (priceText.trim()) return true;
  if (priceAmount != null && Number.isFinite(priceAmount)) return true;
  return /\$|\bFOR\b|¢|FREE|BOGO|BUY\s+\d+\s+GET/i.test(rawEvidence);
}

export function rejectGeminiCandidateReason(candidate: {
  productName: string;
  priceText: string;
  priceAmount: number | null;
  rawEvidence: string;
}): string | null {
  const name = candidate.productName.trim();
  if (!name) return "empty_product_name";

  if (STORE_BRAND_RE.test(name.trim())) return "store_branding";

  if (isJunkOcrLine(name) || isPackageFinePrint(name) || isBrandOnlyName(name)) {
    return "junk_or_fine_print";
  }

  const combined = `${name} ${candidate.rawEvidence}`.trim();
  if (isPackageFinePrint(combined) && !hasPriceEvidence(candidate.priceText, candidate.rawEvidence, candidate.priceAmount)) {
    return "package_fine_print";
  }

  if (
    !hasPriceEvidence(candidate.priceText, candidate.rawEvidence, candidate.priceAmount) &&
    !/\bFREE\b/i.test(name)
  ) {
    return "no_price";
  }

  return null;
}

function candidateDedupeKey(candidate: OfertaLocalGeminiValidatedCandidate): string {
  return [
    normalizeOfertaLocalSearchText(candidate.productName),
    normalizeOfertaLocalSearchText(candidate.priceText || candidate.rawEvidence),
    candidate.sourcePage,
  ].join("|");
}

/** Deterministic price repair after Gemini output. */
export function repairGeminiCandidatePrice(params: {
  priceText: string;
  priceAmount: number | null;
  rawEvidence: string;
  dealType: string;
}): {
  priceText: string;
  priceAmount: number | null;
  salePriceText: string;
  dealType: string;
  priceRepaired: boolean;
} {
  const contextText = [params.priceText, params.rawEvidence].filter(Boolean).join(" ").trim();
  let priceRepaired = false;
  let priceText = params.priceText.trim();
  let priceAmount = params.priceAmount;
  let dealType = params.dealType;
  let salePriceText = "";

  const normalized = normalizeOfertaLocalRetailPrice(contextText);
  if (normalized) {
    priceText = normalized.priceText || priceText;
    priceAmount = normalized.priceAmount ?? priceAmount;
    salePriceText = normalized.salePriceText;
    dealType = normalized.dealType || dealType;
    priceRepaired = normalized.priceRepaired;
    return { priceText, priceAmount, salePriceText, dealType, priceRepaired };
  }

  if (priceText && !priceAmount) {
    const dollarMatch = priceText.match(/\$\s*(\d{2,4})(?:\.\d{2})?/);
    if (dollarMatch) {
      const repaired = repairRetailPriceDigits(dollarMatch[1], { sourceText: contextText });
      if (repaired?.repaired) {
        priceAmount = repaired.amount;
        priceText = priceText.replace(/\$\s*\d{2,4}/, repaired.display);
        priceRepaired = true;
      }
    }
  }

  if (priceAmount != null && Number.isFinite(priceAmount) && priceAmount >= 100 && contextText) {
    const digits = String(Math.round(priceAmount));
    const repaired = repairRetailPriceDigits(digits, { sourceText: contextText });
    if (repaired?.repaired) {
      priceAmount = repaired.amount;
      if (!priceText.includes(repaired.display)) {
        priceText = repaired.display;
      }
      priceRepaired = true;
    }
  }

  if (/99\s*¢/i.test(contextText) && (priceAmount == null || priceAmount >= 1)) {
    priceAmount = 0.99;
    if (!priceText) priceText = "99¢";
    priceRepaired = true;
  }

  return { priceText, priceAmount, salePriceText, dealType, priceRepaired };
}

export function validateAndSanitizeGeminiCandidates(
  rawRows: unknown[],
  fallbackPageNumber: number
): { candidates: OfertaLocalGeminiValidatedCandidate[]; stats: OfertaLocalGeminiValidationStats } {
  const rejectedReasonCounts: Record<string, number> = {};
  const accepted: OfertaLocalGeminiValidatedCandidate[] = [];
  const dedupe = new Map<string, OfertaLocalGeminiValidatedCandidate>();
  let priceRepairsApplied = 0;
  let duplicateRemovals = 0;

  for (const row of rawRows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      rejectedReasonCounts.malformed_row = (rejectedReasonCounts.malformed_row ?? 0) + 1;
      continue;
    }

    const raw = row as OfertaLocalGeminiRawCandidate;
    const productName = sanitizeString(raw.product_name, 160);
    const sourcePageRaw = raw.source_page;
    const sourcePage =
      typeof sourcePageRaw === "number" && Number.isFinite(sourcePageRaw)
        ? Math.max(1, Math.floor(sourcePageRaw))
        : fallbackPageNumber;

    const priceText = sanitizeString(raw.price_text, 64);
    let priceAmount =
      typeof raw.price_amount === "number" && Number.isFinite(raw.price_amount)
        ? raw.price_amount
        : null;
    const rawEvidence = sanitizeString(raw.raw_evidence, 400);

    const rejectReason = rejectGeminiCandidateReason({
      productName,
      priceText,
      priceAmount,
      rawEvidence,
    });
    if (rejectReason) {
      rejectedReasonCounts[rejectReason] = (rejectedReasonCounts[rejectReason] ?? 0) + 1;
      continue;
    }

    let dealType = normalizeDealType(raw.deal_type);
    const repaired = repairGeminiCandidatePrice({
      priceText,
      priceAmount,
      rawEvidence,
      dealType,
    });
    if (repaired.priceRepaired) priceRepairsApplied += 1;

    const bboxValidated = validateGeminiSourceBbox(raw.source_bbox);

    const candidate: OfertaLocalGeminiValidatedCandidate = {
      productName,
      brand: sanitizeString(raw.brand, 80),
      description: sanitizeString(raw.description, 240),
      priceText: repaired.priceText,
      priceAmount: repaired.priceAmount,
      salePriceText: sanitizeString(raw.sale_price_text || repaired.salePriceText, 64),
      regularPriceText: sanitizeString(raw.regular_price_text, 64),
      savingsText: sanitizeString(raw.savings_text, 64),
      unit: normalizeUnit(raw.unit),
      quantity: sanitizeString(raw.quantity, 64),
      dealType: repaired.dealType,
      category: sanitizeString(raw.category, 80),
      searchTags: sanitizeTags(raw.search_tags),
      sourcePage,
      confidenceScore: clampConfidence(raw.confidence_score),
      needsReviewReason: sanitizeString(raw.needs_review_reason, 240),
      rawEvidence,
      priceRepaired: repaired.priceRepaired,
      sourceBbox: bboxValidated?.normalized ?? null,
      sourceBboxGemini: bboxValidated?.geminiBbox ?? null,
    };

    const key = candidateDedupeKey(candidate);
    if (dedupe.has(key)) {
      duplicateRemovals += 1;
      rejectedReasonCounts.duplicate = (rejectedReasonCounts.duplicate ?? 0) + 1;
      const existing = dedupe.get(key)!;
      if (candidate.confidenceScore > existing.confidenceScore) {
        dedupe.set(key, candidate);
      }
      continue;
    }
    dedupe.set(key, candidate);
  }

  for (const candidate of dedupe.values()) {
    accepted.push(candidate);
  }

  const stats: OfertaLocalGeminiValidationStats = {
    rawCandidateCount: rawRows.length,
    acceptedCount: accepted.length,
    rejectedCount: rawRows.length - accepted.length,
    rejectedReasonCounts,
    priceRepairsApplied,
    duplicateRemovals,
  };

  if (stats.rejectedCount > 0) {
    console.info("[ofertas-locales ai] candidates rejected", {
      rawCandidateCount: stats.rawCandidateCount,
      acceptedCount: stats.acceptedCount,
      rejectedReasonCounts: stats.rejectedReasonCounts,
    });
  }

  if (priceRepairsApplied > 0) {
    console.info("[ofertas-locales ai] price repairs applied", { priceRepairsApplied });
  }

  return { candidates: accepted, stats };
}

/** Parse Gemini JSON response safely — strips markdown fences if present. */
export function parseGeminiJsonArray(rawText: string): { rows: unknown[]; error?: string } {
  const trimmed = rawText.trim();
  if (!trimmed) return { rows: [], error: "empty_response" };

  let jsonText = trimmed;
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) jsonText = fenceMatch[1].trim();

  const arrayStart = jsonText.indexOf("[");
  const arrayEnd = jsonText.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    jsonText = jsonText.slice(arrayStart, arrayEnd + 1);
  }

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!Array.isArray(parsed)) return { rows: [], error: "not_json_array" };
    return { rows: parsed };
  } catch {
    return { rows: [], error: "invalid_json" };
  }
}
