/**
 * Ofertas Locales AI extraction quality — junk filters, price patterns, scoring.
 * Gate OFERTAS-AI-QUALITY-1 + OFERTAS-AI-QUALITY-2.
 */

import {
  lineHasNormalizedRetailPrice,
  normalizeOfertaLocalRetailPrice,
} from "./ofertasLocalesAiPriceNormalizer";

export type OfertaLocalAiExtractionRejectReason =
  | "junk_header"
  | "store_branding"
  | "brand_only"
  | "no_price"
  | "too_short"
  | "page_code"
  | "numeric_only"
  | "duplicate"
  | "weak_coupon"
  | "footer_header_zone"
  | "package_fine_print"
  | "low_confidence"
  | "weak_name";

/** Exact or near-exact junk phrases (normalized uppercase compare). */
export const OFERTAS_LOCALES_AI_JUNK_EXACT = new Set([
  "CARDENAS",
  "MARKETS",
  "CARDENAS MARKETS",
  "CARDENAS MARKET",
  "LA FIESTA",
  "GUÍA DE AHORROS",
  "GUIA DE AHORROS",
  "IN-STORE SAVINGS GUIDE",
  "IN STORE SAVINGS GUIDE",
  "VISIT OUR WEBSITE",
  "OPEN 7 DAYS WEEKLY",
  "OPEN 7 DAYS A WEEK",
  "PRICES EFFECTIVE",
  "NOT ALL ITEMS AVAILABLE",
  "PAGE",
  "VER",
  "DIGITAL",
  "SALE PRICE",
  "COUPON GOOD FOR",
  "MANUFACTURER'S COUPON",
  "MANUFACTURERS COUPON",
  "WHEN YOU BUY",
  "SAVE MORE",
  "LOW PRICES",
  "GOLD",
]);

/** Package/legal fine print — not ad product labels. */
export const OFERTAS_LOCALES_AI_PACKAGE_FINE_PRINT = [
  /\bNET\s*WT\b/i,
  /\bNET\s+\d/i,
  /\bCAUTION\b/i,
  /\bINGREDIENTS\b/i,
  /\bNUTRITION\b/i,
  /\bDISTRIBUTED\s+BY\b/i,
  /\bKEEP\s+REFRIGERATED\b/i,
  /\bTOTAL\s*NET\b/i,
  /\bTOTALNE/i,
  /\(\s*\d+\s*g\s*\)/i,
  /\bFL\s*OZ\b.*\b(L\d+|GAL|CAUTION)\b/i,
  /\bSERVING\s+SIZE\b/i,
  /\bCONTAINS\b/i,
  /\bMAY\s+CONTAIN\b/i,
  /\bU\.?\s*P\.?\s*C\.?\b/i,
  /\bSKU\b/i,
  /\bLOT\s*#/i,
];

/** Substrings that indicate header/footer/legal — reject if line is mostly this. */
export const OFERTAS_LOCALES_AI_JUNK_CONTAINS = [
  "PRICES EFFECTIVE",
  "NOT ALL ITEMS AVAILABLE",
  "IN-STORE SAVINGS",
  "SAVINGS GUIDE",
  "VISIT OUR WEBSITE",
  "CARDENAS MARKETS",
  "OPEN 7 DAYS",
  "MANUFACTURER'S COUPON",
  "COUPON GOOD FOR",
  "WHILE SUPPLIES LAST",
  "LIMITED TO",
  "WITH CARD",
  "MEMBERSHIP",
  "CA_",
  "_V11",
  "PAGE ",
  "PÁGINA",
];

/** Brand-only fragments without product descriptor. */
export const OFERTAS_LOCALES_AI_BRAND_ONLY = new Set([
  "LA FIESTA",
  "EL COMAL",
  "EL MEXICANO",
  "TAKIS",
  "NESTLE",
  "NESTLÉ",
  "OREO",
  "ELECTROLIT",
  "CRYSTAL GEYSER",
  "CARDENAS",
  "MARKETS",
]);

export const OFERTAS_LOCALES_AI_PRICE_PATTERNS: ReadonlyArray<{
  id: string;
  re: RegExp;
  weight: number;
}> = [
  { id: "multi_for", re: /\b(\d+)\s+FOR\s+\$?\s*(\d+(?:\.\d{2})?)\b/i, weight: 0.95 },
  { id: "dollar_ea", re: /\$\s*(\d+(?:\.\d{2})?)\s*(?:EA|EA\.|EACH)\b/i, weight: 0.9 },
  { id: "bare_ea", re: /\b(\d{2,4})\s*(?:EA|EA\.|EACH)\b/i, weight: 0.88 },
  { id: "dollar_unit", re: /\$\s*(\d+(?:\.\d{2})?)\s*(?:\/|PER\s+)?(LB|OZ|CT|PK|BAG|BOX)\b/i, weight: 0.88 },
  { id: "cent_lb", re: /\b(\d+(?:\.\d{1,2})?)\s*¢\s*(?:\/\s*)?(LB|OZ|CT)?\b/i, weight: 0.88 },
  { id: "bogo", re: /\bBUY\s+(\d+)\s+GET\s+(\d+)\s+FREE\b/i, weight: 0.92 },
  { id: "digital_sale", re: /DIGITAL\s+-?\$?\s*(\d+(?:\.\d{2})?).*?(?:SALE\s+PRICE\s+\$?\s*(\d+(?:\.\d{2})?))?/i, weight: 0.9 },
  { id: "sale_price", re: /\bSALE\s+PRICE\s+\$?\s*(\d+(?:\.\d{2})?)\b/i, weight: 0.85 },
  { id: "when_you_buy", re: /\bWHEN\s+YOU\s+BUY\s+(\d+)\b/i, weight: 0.55 },
  { id: "plain_dollar", re: /\$\s*(\d{2,4}(?:\.\d{2})?)\b/, weight: 0.72 },
  { id: "percent_off", re: /\b(\d{1,2})\s*%\s*OFF\b/i, weight: 0.8 },
  { id: "save_amount", re: /\bSAVE\s+\$?\s*(\d+(?:\.\d{2})?)\b/i, weight: 0.78 },
  { id: "free", re: /\bFREE\b/i, weight: 0.65 },
];

const GROCERY_PRODUCT_TERMS =
  /\b(chile|chili|queso|cheese|tortilla|tostada|botana|chip|agua|water|bebida|electrolit|cono|drumstick|helado|carne|pollo|res|pan|frijol|rice|arroz|leche|milk|limpiador|cleaner|paleta|snack|fresco|secos|pods|size|ma[ií]z|corn)\b/i;

const QUANTITY_PACK_RE = /\b(\d+\s*(?:pk|pack|ct|count))\b/i;

const SIZE_UNIT_RE =
  /\b(\d+(?:\.\d+)?\s*(?:-\s*\d+(?:\.\d+)?)?\s*(?:oz|lb|lbs|ct|pk|pack|ml|l|g|kg|gal|fl\.?\s*oz|count|botellas?|bottles?))\b/i;

const PAGE_CODE_RE = /^CA_\d+.*$/i;
const DATE_CODE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

export type ParsedPriceEvidence = {
  priceText: string;
  priceAmount: number | null;
  regularPriceText: string;
  salePriceText: string;
  savingsText: string;
  offerText: string;
  quantity: string;
  unit: string;
  dealType: string;
  patternId: string;
  weight: number;
  priceRepaired: boolean;
};

export function normalizeAiTextKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function lineHasPriceEvidence(text: string): boolean {
  return lineHasNormalizedRetailPrice(text) || OFERTAS_LOCALES_AI_PRICE_PATTERNS.some((p) => p.re.test(text));
}

export function parsePriceEvidence(text: string): ParsedPriceEvidence | null {
  const normalized = normalizeOfertaLocalRetailPrice(text);
  if (!normalized) return null;
  return {
    priceText: normalized.priceText,
    priceAmount: normalized.priceAmount,
    regularPriceText: "",
    salePriceText: normalized.salePriceText,
    savingsText: normalized.savingsText,
    offerText: normalized.offerText,
    quantity: normalized.quantity,
    unit: normalized.unit,
    dealType: normalized.dealType,
    patternId: normalized.patternId,
    weight: normalized.weight,
    priceRepaired: normalized.priceRepaired,
  };
}

export function extractSizeUnitSnippet(text: string): string {
  const sizeRe = new RegExp(SIZE_UNIT_RE.source, "gi");
  const matches = [...text.matchAll(sizeRe)];
  if (!matches.length) return "";
  return matches.map((m) => m[1]?.trim()).filter(Boolean).join(" · ");
}

export function extractQuantitySnippet(text: string): string {
  const match = text.match(QUANTITY_PACK_RE);
  return match?.[1]?.trim() ?? "";
}

export function isPackageFinePrint(text: string): boolean {
  const raw = text.trim();
  if (!raw) return false;
  if (lineHasPriceEvidence(raw)) return false;
  for (const re of OFERTAS_LOCALES_AI_PACKAGE_FINE_PRINT) {
    if (re.test(raw)) return true;
  }
  if (raw.length < 20) return false;
  const digitRatio = (raw.match(/\d/g)?.length ?? 0) / Math.max(raw.length, 1);
  const symbolRatio = (raw.match(/[^a-zA-Z0-9\sáéíóúñ]/g)?.length ?? 0) / Math.max(raw.length, 1);
  if (digitRatio > 0.35 && symbolRatio > 0.12) return true;
  if (/^[A-Z0-9\s\-().,/]{12,}$/.test(raw) && !GROCERY_PRODUCT_TERMS.test(raw)) return true;
  if (/\b\d+\s+[A-Z]{4,}\b/.test(raw) && /\(\s*\d+\s*g\s*\)/i.test(raw)) return true;
  return false;
}

const SPANISH_AD_HEADLINE_RE =
  /\b(secos|botanas|queso|tortillas?|tostadas?|bebidas|conos|paletas|ma[ií]z|fresco|carne|polino|res|agua|limpiador)\b/i;

const ENGLISH_SUBTITLE_RE =
  /\b(select varieties|pods|with|flavor|flavors|assorted|description|size)\b/i;

export function scoreProductNameLine(text: string): number {
  const raw = text.trim();
  if (!raw || isJunkOcrLine(raw) || isPackageFinePrint(raw) || isBrandOnlyName(raw)) return -1;

  let score = 0.2;
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 8) score += 0.25;
  if (GROCERY_PRODUCT_TERMS.test(raw)) score += 0.25;
  if (SPANISH_AD_HEADLINE_RE.test(raw)) score += 0.15;
  if (/[a-záéíóúñ]/.test(raw) && /[A-ZÁÉÍÓÚÑ]/.test(raw)) score += 0.08;
  if (extractSizeUnitSnippet(raw)) score += 0.05;
  if (words.length >= 4 && (raw.match(/,/g)?.length ?? 0) <= 1) score += 0.08;
  if (lineHasPriceEvidence(raw)) score -= 0.35;
  if (raw.length > 90) score -= 0.2;
  if (words.length === 1) score -= 0.25;
  if (/^[\d\s\-().,/]+$/.test(raw)) score -= 0.5;
  if (/(\b\w+\b)(?:\s*-\s*\1\b)/i.test(raw)) score -= 0.15;
  if (ENGLISH_SUBTITLE_RE.test(raw)) score -= 0.18;
  if ((raw.match(/,/g)?.length ?? 0) >= 2) score -= 0.12;
  if (/^[A-Za-z\s]+,\s*\d/.test(raw)) score -= 0.1;
  return score;
}

export function splitProductLabelAndSize(text: string): {
  itemName: string;
  description: string;
  unit: string;
  quantity: string;
} {
  let working = text.trim().replace(/\s+/g, " ");
  const sizes: string[] = [];
  let match: RegExpExecArray | null;
  const sizeRe = new RegExp(SIZE_UNIT_RE.source, "gi");
  while ((match = sizeRe.exec(working)) !== null) {
    if (match[1]) sizes.push(match[1].trim());
  }

  working = working
    .replace(/\s*[-–,|]\s*\d+(?:\.\d+)?\s*(?:oz|lb|lbs|ct|pk|pack|ml|l|g|kg|gal|fl\.?\s*oz|count|botellas?|bottles?).*$/i, "")
    .replace(/\(\s*\d+(?:\.\d+)?\s*g\s*\)/gi, "")
    .replace(/\bNET\s*WT\b.*$/i, "")
    .replace(/\bCAUTION\b.*$/i, "")
    .trim();

  working = working.replace(/^\d+\s+/, "").trim();

  const quantity = extractQuantitySnippet(text);
  const unit = sizes[0] ?? extractSizeUnitSnippet(text);
  const description = [...new Set(sizes)].join(" · ").slice(0, 240);

  return {
    itemName: working.slice(0, 160),
    description,
    unit,
    quantity,
  };
}

export function pickBestProductLabel(lines: string[]): {
  itemName: string;
  description: string;
  unit: string;
  quantity: string;
  supportingLines: string[];
} {
  const scored = lines
    .map((text, index) => ({ text: text.trim(), index, score: scoreProductNameLine(text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return { itemName: "", description: "", unit: "", quantity: "", supportingLines: [] };
  }

  const primary = scored[0].text;
  const split = splitProductLabelAndSize(primary);
  const supporting = scored.slice(1, 3).map((s) => s.text).filter((t) => !isPackageFinePrint(t));

  const extraSizes = supporting.flatMap((t) => extractSizeUnitSnippet(t).split(" · ").filter(Boolean));
  const descriptionParts = [split.description, ...extraSizes, ...supporting.filter((t) => t !== primary)]
    .filter(Boolean);
  const description = [...new Set(descriptionParts)].join(" · ").slice(0, 240);
  const unit = split.unit || extraSizes[0] || extractSizeUnitSnippet(supporting.join(" "));

  return {
    itemName: split.itemName,
    description,
    unit,
    quantity: split.quantity || extractQuantitySnippet(supporting.join(" ")),
    supportingLines: [primary, ...supporting],
  };
}

export function isJunkOcrLine(text: string): boolean {
  const raw = text.trim();
  if (!raw) return true;
  const key = normalizeAiTextKey(raw);

  if (OFERTAS_LOCALES_AI_JUNK_EXACT.has(key)) return true;
  if (raw.length <= 2) return true;
  if (PAGE_CODE_RE.test(raw)) return true;
  if (DATE_CODE_RE.test(raw)) return true;
  if (/^PAGE\s+\d+$/i.test(raw)) return true;
  if (/^\d+$/.test(raw)) return true;

  for (const fragment of OFERTAS_LOCALES_AI_JUNK_CONTAINS) {
    if (key.includes(normalizeAiTextKey(fragment))) return true;
  }
  if (isPackageFinePrint(raw)) return true;

  return false;
}

export function isBrandOnlyName(text: string): boolean {
  const key = normalizeAiTextKey(text);
  if (OFERTAS_LOCALES_AI_BRAND_ONLY.has(key)) return true;
  const words = key.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && OFERTAS_LOCALES_AI_BRAND_ONLY.has(key)) return true;
  // Very short all-caps without size/price
  if (words.length <= 2 && key === key.toUpperCase() && !SIZE_UNIT_RE.test(text) && !lineHasPriceEvidence(text)) {
    if (OFERTAS_LOCALES_AI_BRAND_ONLY.has(key)) return true;
  }
  return false;
}

export function isHeaderFooterZone(yMin: number | null, yMax: number | null): boolean {
  if (yMin == null) return false;
  if (yMin < 0.1) return true;
  if (yMax != null && yMax > 0.93) return true;
  return false;
}

export function scoreProductCandidate(params: {
  itemName: string;
  description: string;
  priceText: string;
  priceWeight: number;
  unit: string;
  quantity: string;
  contextLineCount: number;
  ocrConfidence: number | null;
  priceRepaired?: boolean;
}): number {
  let score = 0.3;

  if (params.priceText) score += 0.28 * Math.min(1, params.priceWeight);
  if (params.priceRepaired) score += 0.04;
  if (params.itemName.length >= 10) score += 0.14;
  if (params.description || params.unit) score += 0.1;
  if (params.quantity) score += 0.05;
  if (params.contextLineCount >= 2) score += 0.05;
  if (params.ocrConfidence != null) score += Math.min(0.12, params.ocrConfidence * 0.12);
  if (GROCERY_PRODUCT_TERMS.test(`${params.itemName} ${params.description}`)) score += 0.08;

  const nameKey = normalizeAiTextKey(params.itemName);
  if (nameKey.length < 8) score -= 0.2;
  if (nameKey === nameKey.toUpperCase() && nameKey.split(" ").length <= 2) score -= 0.12;
  if (!params.priceText) score -= 0.4;
  if (isBrandOnlyName(params.itemName)) score -= 0.45;
  if (isJunkOcrLine(params.itemName)) score -= 0.55;
  if (isPackageFinePrint(params.itemName)) score -= 0.6;

  return Math.max(0, Math.min(1, score));
}

export function buildSearchTags(itemName: string, description: string, category: string): string[] {
  const tags = new Set<string>();
  const addWords = (text: string) => {
    for (const w of text.toLowerCase().split(/[^a-z0-9áéíóúñ]+/i)) {
      const t = w.trim();
      if (t.length >= 4 && t.length <= 24) tags.add(t);
    }
  };
  addWords(itemName);
  if (description) addWords(description);
  if (category) tags.add(category.toLowerCase());
  return [...tags].slice(0, 8);
}

export function inferBroadCategory(text: string): string {
  const t = text.toLowerCase();
  if (/\b(queso|cheese|leche|milk|yogurt|crema)\b/.test(t)) return "Dairy";
  if (/\b(tortilla|pan|bread|bolillo|bakery)\b/.test(t)) return "Bakery";
  if (/\b(chile|chili|produce|verdura|fruta|tomate|cebolla)\b/.test(t)) return "Produce";
  if (/\b(agua|bebida|electrolit|soda|juice|refresco)\b/.test(t)) return "Beverages";
  if (/\b(carne|meat|pollo|chicken|res|beef|cerdo|pork)\b/.test(t)) return "Meat";
  if (/\b(pescado|seafood|shrimp|camarón)\b/.test(t)) return "Seafood";
  if (/\b(cono|ice cream|helado|frozen)\b/.test(t)) return "Frozen";
  if (/\b(botana|chip|snack|takis)\b/.test(t)) return "Snacks";
  if (/\b(cleaning|detergent|paper)\b/.test(t)) return "Grocery";
  return "";
}

export type OfertaLocalAiExtractionDebugStats = {
  ocrLineCount: number;
  priceBlockCount: number;
  candidatesGenerated: number;
  rejectedReasonCounts: Record<string, number>;
  insertedCount: number;
  priceRepairsApplied: number;
  duplicateRemovals: number;
  averageConfidence: number | null;
};

export const OFERTAS_LOCALES_AI_MIN_INSERT_CONFIDENCE = 0.48;

export function logOfertaLocalAiExtraction(phase: string, payload: Record<string, unknown>): void {
  console.info(`[ofertas-locales ai] ${phase}`, payload);
}

export function incrementReject(
  counts: Record<string, number>,
  reason: OfertaLocalAiExtractionRejectReason
): void {
  counts[reason] = (counts[reason] ?? 0) + 1;
}
