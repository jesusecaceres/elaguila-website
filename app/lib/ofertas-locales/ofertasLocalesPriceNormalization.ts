export type OfertaLocalNormalizedPrice = {
  originalText: string;
  displayText: string;
  amount: number | null;
  amountCents: number | null;
  parseStatus: "unknown" | "parsed" | "deal_text" | "manual" | "invalid";
};

export const OFERTAS_LOCALES_PRICE_NORMALIZATION_EXAMPLES = [
  "8.99",
  "$8.99",
  "2 for $5",
  "3/$10",
  ".99",
  "10.00",
  "1,299.99",
] as const;

const DEAL_TEXT_RE = /\b\d+\s*(for|x|\/)\s*\$?\s*\d/i;

function cleanPriceText(raw: string | null | undefined): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}

export function centsToDecimalString(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "";
  return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
}

export function normalizeOfertaLocalPrice(input: {
  priceText?: string | null;
  priceAmount?: number | string | null;
  manual?: boolean;
}): OfertaLocalNormalizedPrice {
  const originalText = cleanPriceText(input.priceText);
  const amountRaw = input.priceAmount;
  if (amountRaw != null && amountRaw !== "") {
    const numeric = typeof amountRaw === "number" ? amountRaw : Number(String(amountRaw).replace(/[$,]/g, ""));
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 999999) {
      return { originalText, displayText: originalText, amount: null, amountCents: null, parseStatus: "invalid" };
    }
    const amountCents = Math.round(numeric * 100);
    return {
      originalText: originalText || centsToDecimalString(amountCents),
      displayText: originalText || `$${centsToDecimalString(amountCents)}`,
      amount: amountCents / 100,
      amountCents,
      parseStatus: input.manual ? "manual" : "parsed",
    };
  }

  if (!originalText) {
    return { originalText: "", displayText: "", amount: null, amountCents: null, parseStatus: "unknown" };
  }
  if (DEAL_TEXT_RE.test(originalText)) {
    return { originalText, displayText: originalText, amount: null, amountCents: null, parseStatus: "deal_text" };
  }

  const match = originalText.match(/(?:\$)?\s*((?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d{1,2})|\d+(?:\.\d{1,2})?)/);
  if (!match?.[1]) {
    return { originalText, displayText: originalText, amount: null, amountCents: null, parseStatus: "unknown" };
  }
  const normalizedNumber = match[1].replace(/,/g, "");
  const numeric = normalizedNumber.startsWith(".") ? Number(`0${normalizedNumber}`) : Number(normalizedNumber);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 999999) {
    return { originalText, displayText: originalText, amount: null, amountCents: null, parseStatus: "invalid" };
  }
  const amountCents = Math.round(numeric * 100);
  return {
    originalText,
    displayText: originalText,
    amount: amountCents / 100,
    amountCents,
    parseStatus: "parsed",
  };
}
