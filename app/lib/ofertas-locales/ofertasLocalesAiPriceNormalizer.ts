/**
 * Ofertas Locales retail price normalization — missing decimal repair (Gate OFERTAS-AI-QUALITY-2).
 * Scan compute cost should map to useful review rows via future store/client package pricing.
 */

export type OfertaLocalRetailPriceContext = {
  /** Full OCR line or nearby text for context signals. */
  sourceText: string;
  unitHint?: string;
  patternId?: string;
};

export type NormalizedRetailPrice = {
  priceText: string;
  priceAmount: number | null;
  salePriceText: string;
  savingsText: string;
  unit: string;
  quantity: string;
  dealType: string;
  offerText: string;
  patternId: string;
  weight: number;
  priceRepaired: boolean;
};

const PRICE_CONTEXT_RE =
  /\b(EA|EACH|LB|FOR|CRV|TAX|OZ|CT|PK|BAG|BOX|SALE\s+PRICE|DIGITAL|¢|CENT|\$)\b/i;

const MULTI_FOR_RE = /\b(\d+)\s+FOR\s+\$?\s*(\d{1,4}(?:\.\d{2})?)\b(?:\s*\+\s*CRV)?/i;
const BOGO_RE = /\bBUY\s+(\d+)\s+GET\s+(\d+)\s+FREE\b/i;
const DIGITAL_SALE_RE =
  /DIGITAL\s+-?\$?\s*(\d+(?:\.\d{2})?).*?(?:SALE\s+PRICE\s+\$?\s*(\d{1,4}(?:\.\d{2})?))?/i;
const DOLLAR_EA_RE = /\$\s*(\d{1,4}(?:\.\d{2})?)\s*(?:EA|EA\.|EACH)\b(?:\s*\+\s*CRV)?/i;
const BARE_EA_RE = /\b(\d{1,4}(?:\.\d{2})?)\s*(?:EA|EA\.|EACH)\b(?:\s*\+\s*CRV)?/i;
const DOLLAR_UNIT_RE = /\$\s*(\d{1,4}(?:\.\d{2})?)\s*(?:\/|PER\s+)?(LB|OZ|CT|PK|BAG|BOX)\b/i;
const CENT_LB_RE = /\b(\d+(?:\.\d{1,2})?)\s*¢\s*(?:\/\s*)?(LB|OZ|CT)?\b/i;
const SALE_PRICE_RE = /\bSALE\s+PRICE\s+\$?\s*(\d{1,4}(?:\.\d{2})?)\b/i;
const PLAIN_DOLLAR_RE = /\$\s*(\d{1,4}(?:\.\d{2})?)\b/;
const PERCENT_OFF_RE = /\b(\d{1,2})\s*%\s*OFF\b/i;
const SAVE_AMOUNT_RE = /\bSAVE\s+\$?\s*(\d{1,4}(?:\.\d{2})?)\b/i;
const WHEN_YOU_BUY_RE = /\bWHEN\s+YOU\s+BUY\s+(\d+)\b/i;

function hasStrongPriceContext(text: string): boolean {
  return PRICE_CONTEXT_RE.test(text);
}

/** Repair OCR retail prices missing decimal: 399 + EA -> 3.99 */
export function repairRetailPriceDigits(
  rawDigits: string,
  context: OfertaLocalRetailPriceContext
): { amount: number; display: string; repaired: boolean } | null {
  const cleaned = rawDigits.replace(/[^\d.]/g, "");
  if (!cleaned) return null;

  if (/\d+\.\d{1,2}/.test(cleaned)) {
    const amount = Number.parseFloat(cleaned);
    if (!Number.isFinite(amount)) return null;
    return { amount, display: formatUsd(amount), repaired: false };
  }

  if (!hasStrongPriceContext(context.sourceText)) return null;

  const digitsOnly = cleaned.replace(/\./g, "");
  if (!/^\d{2,4}$/.test(digitsOnly)) return null;

  const n = Number.parseInt(digitsOnly, 10);
  let amount: number | null = null;

  if (digitsOnly.length === 2) {
    amount = n / 100;
  } else if (digitsOnly.length === 3) {
    amount = n / 100;
  } else if (digitsOnly.length === 4) {
    amount = n / 100;
  }

  if (amount == null || !Number.isFinite(amount)) return null;
  if (amount < 0.25 || amount > 999.99) return null;

  return { amount, display: formatUsd(amount), repaired: true };
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function withCrvSuffix(text: string, source: string): string {
  return /\+\s*CRV/i.test(source) && !/CRV/i.test(text) ? `${text} + CRV` : text;
}

function parseNumericToken(raw: string, context: OfertaLocalRetailPriceContext) {
  if (raw.includes(".")) {
    const amount = Number.parseFloat(raw);
    return Number.isFinite(amount)
      ? { amount, display: formatUsd(amount), repaired: false }
      : null;
  }
  return repairRetailPriceDigits(raw, context);
}

/**
 * Parse and normalize flyer retail price OCR into display + numeric fields.
 */
export function normalizeOfertaLocalRetailPrice(sourceText: string): NormalizedRetailPrice | null {
  const text = sourceText.trim();
  if (!text) return null;
  const ctx: OfertaLocalRetailPriceContext = { sourceText: text };

  let m = text.match(MULTI_FOR_RE);
  if (m) {
    const qty = `${m[1]} for`;
    const parsed = parseNumericToken(m[2], ctx);
    const amount = parsed?.amount ?? Number.parseFloat(m[2]);
    const pricePart = parsed?.display ?? `$${m[2]}`;
    const priceText = withCrvSuffix(`${m[1]} for ${pricePart}`, text);
    return {
      priceText,
      priceAmount: Number.isFinite(amount) ? amount : null,
      salePriceText: pricePart,
      savingsText: "",
      unit: "",
      quantity: qty,
      dealType: "multi_buy",
      offerText: text,
      patternId: "multi_for",
      weight: 0.95,
      priceRepaired: parsed?.repaired ?? false,
    };
  }

  m = text.match(BOGO_RE);
  if (m) {
    return {
      priceText: `Buy ${m[1]} Get ${m[2]} Free`,
      priceAmount: null,
      salePriceText: "",
      savingsText: "",
      unit: "",
      quantity: `buy ${m[1]} get ${m[2]}`,
      dealType: "bogo",
      offerText: text,
      patternId: "bogo",
      weight: 0.92,
      priceRepaired: false,
    };
  }

  m = text.match(DIGITAL_SALE_RE);
  if (m) {
    const savingsParsed = m[1] ? parseNumericToken(m[1], ctx) : null;
    const saleRaw = m[2] ?? m[1];
    const saleParsed = parseNumericToken(saleRaw, ctx);
    const saleDisplay = saleParsed?.display ?? `$${saleRaw}`;
    const savingsDisplay = savingsParsed ? formatUsd(savingsParsed.amount) : m[1] ? `$${m[1]}` : "";
    return {
      priceText: withCrvSuffix(`${saleDisplay} EA`, text),
      priceAmount: saleParsed?.amount ?? null,
      salePriceText: saleDisplay,
      savingsText: savingsDisplay ? `Digital -${savingsDisplay}` : "",
      unit: "EA",
      quantity: "",
      dealType: "digital_coupon",
      offerText: text,
      patternId: "digital_sale",
      weight: 0.9,
      priceRepaired: Boolean(saleParsed?.repaired || savingsParsed?.repaired),
    };
  }

  m = text.match(DOLLAR_EA_RE);
  if (m) {
    const parsed = parseNumericToken(m[1], ctx);
    const display = parsed?.display ?? `$${m[1]}`;
    return {
      priceText: withCrvSuffix(`${display} EA`, text),
      priceAmount: parsed?.amount ?? Number.parseFloat(m[1]),
      salePriceText: display,
      savingsText: "",
      unit: "EA",
      quantity: "",
      dealType: "each",
      offerText: text,
      patternId: "dollar_ea",
      weight: 0.9,
      priceRepaired: parsed?.repaired ?? false,
    };
  }

  m = text.match(BARE_EA_RE);
  if (m && hasStrongPriceContext(text)) {
    const parsed = parseNumericToken(m[1], ctx);
    const display = parsed?.display ?? `$${m[1]}`;
    return {
      priceText: withCrvSuffix(`${display} EA`, text),
      priceAmount: parsed?.amount ?? Number.parseFloat(m[1]),
      salePriceText: display,
      savingsText: "",
      unit: "EA",
      quantity: "",
      dealType: "each",
      offerText: text,
      patternId: "bare_ea",
      weight: 0.88,
      priceRepaired: parsed?.repaired ?? false,
    };
  }

  m = text.match(DOLLAR_UNIT_RE);
  if (m) {
    const parsed = parseNumericToken(m[1], ctx);
    const display = parsed?.display ?? `$${m[1]}`;
    const unit = m[2].toUpperCase();
    return {
      priceText: `${display} ${unit}`,
      priceAmount: parsed?.amount ?? Number.parseFloat(m[1]),
      salePriceText: display,
      savingsText: "",
      unit,
      quantity: "",
      dealType: "each",
      offerText: text,
      patternId: "dollar_unit",
      weight: 0.88,
      priceRepaired: parsed?.repaired ?? false,
    };
  }

  m = text.match(CENT_LB_RE);
  if (m) {
    const cents = Number.parseFloat(m[1]);
    const unit = (m[2] ?? "LB").toUpperCase();
    const amount = cents >= 1 ? cents / 100 : cents;
    return {
      priceText: `${m[1]}¢ ${unit}`,
      priceAmount: amount,
      salePriceText: `${m[1]}¢`,
      savingsText: "",
      unit,
      quantity: "",
      dealType: "each",
      offerText: text,
      patternId: "cent_lb",
      weight: 0.88,
      priceRepaired: false,
    };
  }

  m = text.match(SALE_PRICE_RE);
  if (m) {
    const parsed = parseNumericToken(m[1], ctx);
    const display = parsed?.display ?? `$${m[1]}`;
    return {
      priceText: withCrvSuffix(`${display} EA`, text),
      priceAmount: parsed?.amount ?? Number.parseFloat(m[1]),
      salePriceText: display,
      savingsText: "",
      unit: "EA",
      quantity: "",
      dealType: "sale_price",
      offerText: text,
      patternId: "sale_price",
      weight: 0.85,
      priceRepaired: parsed?.repaired ?? false,
    };
  }

  m = text.match(WHEN_YOU_BUY_RE);
  if (m) {
    return {
      priceText: `When you buy ${m[1]}`,
      priceAmount: null,
      salePriceText: "",
      savingsText: "",
      unit: "",
      quantity: `when you buy ${m[1]}`,
      dealType: "multi_buy",
      offerText: text,
      patternId: "when_you_buy",
      weight: 0.55,
      priceRepaired: false,
    };
  }

  m = text.match(SAVE_AMOUNT_RE);
  if (m) {
    const parsed = parseNumericToken(m[1], ctx);
    const display = parsed?.display ?? `$${m[1]}`;
    return {
      priceText: `Save ${display}`,
      priceAmount: parsed?.amount ?? null,
      salePriceText: "",
      savingsText: display,
      unit: "",
      quantity: "",
      dealType: "sale_price",
      offerText: text,
      patternId: "save_amount",
      weight: 0.78,
      priceRepaired: parsed?.repaired ?? false,
    };
  }

  m = text.match(PERCENT_OFF_RE);
  if (m) {
    return {
      priceText: `${m[1]}% OFF`,
      priceAmount: null,
      salePriceText: "",
      savingsText: "",
      unit: "",
      quantity: "",
      dealType: "sale_price",
      offerText: text,
      patternId: "percent_off",
      weight: 0.8,
      priceRepaired: false,
    };
  }

  m = text.match(PLAIN_DOLLAR_RE);
  if (m && hasStrongPriceContext(text)) {
    const parsed = parseNumericToken(m[1], ctx);
    const display = parsed?.display ?? `$${m[1]}`;
    return {
      priceText: display,
      priceAmount: parsed?.amount ?? Number.parseFloat(m[1]),
      salePriceText: display,
      savingsText: "",
      unit: "",
      quantity: "",
      dealType: "each",
      offerText: text,
      patternId: "plain_dollar",
      weight: 0.72,
      priceRepaired: parsed?.repaired ?? false,
    };
  }

  if (/\bFREE\b/i.test(text)) {
    return {
      priceText: "FREE",
      priceAmount: null,
      salePriceText: "",
      savingsText: "",
      unit: "",
      quantity: "",
      dealType: "free_item",
      offerText: text,
      patternId: "free",
      weight: 0.65,
      priceRepaired: false,
    };
  }

  return null;
}

export function lineHasNormalizedRetailPrice(text: string): boolean {
  return normalizeOfertaLocalRetailPrice(text) != null;
}
