/**
 * Ofertas Locales AI extraction quality — junk filters, price patterns, scoring (Gate OFERTAS-AI-QUALITY-1).
 */

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
  | "footer_header_zone";

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
]);

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
  { id: "dollar_unit", re: /\$\s*(\d+(?:\.\d{2})?)\s*(?:\/|PER\s+)?(LB|OZ|CT|PK|BAG|BOX)\b/i, weight: 0.88 },
  { id: "cent_lb", re: /\b(\d+(?:\.\d{1,2})?)\s*¢\s*(?:\/\s*)?(LB|OZ|CT)?\b/i, weight: 0.88 },
  { id: "bogo", re: /\bBUY\s+(\d+)\s+GET\s+(\d+)\s+FREE\b/i, weight: 0.92 },
  { id: "digital_sale", re: /DIGITAL\s+-?\$?\s*(\d+(?:\.\d{2})?).*?(?:SALE\s+PRICE\s+\$?\s*(\d+(?:\.\d{2})?))?/i, weight: 0.9 },
  { id: "sale_price", re: /\bSALE\s+PRICE\s+\$?\s*(\d+(?:\.\d{2})?)\b/i, weight: 0.85 },
  { id: "when_you_buy", re: /\bWHEN\s+YOU\s+BUY\s+(\d+)\b/i, weight: 0.7 },
  { id: "plain_dollar", re: /\$\s*(\d+(?:\.\d{2})?)\b/, weight: 0.75 },
  { id: "percent_off", re: /\b(\d{1,2})\s*%\s*OFF\b/i, weight: 0.8 },
  { id: "save_amount", re: /\bSAVE\s+\$?\s*(\d+(?:\.\d{2})?)\b/i, weight: 0.78 },
  { id: "free", re: /\bFREE\b/i, weight: 0.65 },
];

const SIZE_UNIT_RE =
  /\b(\d+(?:\.\d+)?\s*(?:-\s*\d+(?:\.\d+)?)?\s*(?:oz|lb|lbs|ct|pk|pack|ml|l|g|kg|gal|fl\.?\s*oz|count|botellas?|bottles?))\b/i;

const PAGE_CODE_RE = /^CA_\d+.*$/i;
const DATE_CODE_RE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

export type ParsedPriceEvidence = {
  priceText: string;
  priceAmount: number | null;
  regularPriceText: string;
  offerText: string;
  quantity: string;
  unit: string;
  patternId: string;
  weight: number;
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
  return OFERTAS_LOCALES_AI_PRICE_PATTERNS.some((p) => p.re.test(text));
}

export function parsePriceEvidence(text: string): ParsedPriceEvidence | null {
  let best: ParsedPriceEvidence | null = null;

  for (const pattern of OFERTAS_LOCALES_AI_PRICE_PATTERNS) {
    const match = text.match(pattern.re);
    if (!match) continue;

    let priceText = "";
    let priceAmount: number | null = null;
    let regularPriceText = "";
    let offerText = text.trim();
    let quantity = "";
    let unit = "";

    switch (pattern.id) {
      case "multi_for": {
        quantity = `${match[1]} for`;
        priceText = `${match[1]} for $${match[2]}`;
        priceAmount = Number.parseFloat(match[2]);
        break;
      }
      case "dollar_ea": {
        priceText = `$${match[1]} EA`;
        priceAmount = Number.parseFloat(match[1]);
        unit = "EA";
        break;
      }
      case "dollar_unit": {
        priceText = `$${match[1]} ${match[2].toUpperCase()}`;
        priceAmount = Number.parseFloat(match[1]);
        unit = match[2].toUpperCase();
        break;
      }
      case "cent_lb": {
        priceText = `${match[1]}¢${match[2] ? ` ${match[2].toUpperCase()}` : ""}`.trim();
        priceAmount = Number.parseFloat(match[1]) / 100;
        unit = (match[2] ?? "LB").toUpperCase();
        break;
      }
      case "bogo": {
        quantity = `buy ${match[1]} get ${match[2]}`;
        priceText = `Buy ${match[1]} Get ${match[2]} Free`;
        break;
      }
      case "digital_sale": {
        const sale = match[2] ?? match[1];
        priceText = `$${sale} EA`;
        priceAmount = Number.parseFloat(sale);
        regularPriceText = match[1] ? `Digital -$${match[1]}` : "";
        unit = "EA";
        break;
      }
      case "sale_price": {
        priceText = `$${match[1]} EA`;
        priceAmount = Number.parseFloat(match[1]);
        unit = "EA";
        break;
      }
      case "when_you_buy": {
        quantity = `when you buy ${match[1]}`;
        priceText = `When you buy ${match[1]}`;
        break;
      }
      case "plain_dollar": {
        priceText = `$${match[1]}`;
        priceAmount = Number.parseFloat(match[1]);
        break;
      }
      case "percent_off": {
        priceText = `${match[1]}% OFF`;
        break;
      }
      case "save_amount": {
        priceText = `Save $${match[1]}`;
        priceAmount = Number.parseFloat(match[1]);
        break;
      }
      case "free": {
        priceText = "FREE";
        break;
      }
      default:
        priceText = match[0]?.trim() ?? "";
    }

    const candidate: ParsedPriceEvidence = {
      priceText,
      priceAmount,
      regularPriceText,
      offerText,
      quantity,
      unit,
      patternId: pattern.id,
      weight: pattern.weight,
    };

    if (!best || candidate.weight > best.weight) {
      best = candidate;
    }
  }

  return best;
}

export function extractSizeUnitSnippet(text: string): string {
  const match = text.match(SIZE_UNIT_RE);
  return match?.[1]?.trim() ?? "";
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
}): number {
  let score = 0.35;

  if (params.priceText) score += 0.25 * Math.min(1, params.priceWeight);
  if (params.itemName.length >= 12) score += 0.12;
  if (params.description || params.unit) score += 0.08;
  if (params.quantity) score += 0.05;
  if (params.contextLineCount >= 2) score += 0.05;
  if (params.ocrConfidence != null) score += Math.min(0.15, params.ocrConfidence * 0.15);

  const nameKey = normalizeAiTextKey(params.itemName);
  if (nameKey.length < 8) score -= 0.15;
  if (nameKey === nameKey.toUpperCase() && nameKey.split(" ").length <= 2) score -= 0.1;
  if (!params.priceText) score -= 0.35;
  if (isBrandOnlyName(params.itemName)) score -= 0.4;
  if (isJunkOcrLine(params.itemName)) score -= 0.5;

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
};

export function logOfertaLocalAiExtraction(phase: string, payload: Record<string, unknown>): void {
  console.info(`[ofertas-locales ai] ${phase}`, payload);
}

export function incrementReject(
  counts: Record<string, number>,
  reason: OfertaLocalAiExtractionRejectReason
): void {
  counts[reason] = (counts[reason] ?? 0) + 1;
}
