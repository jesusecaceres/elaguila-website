/**
 * Viajes-local public price display — no fabricated $0 / NaN / double currency.
 */

export type ViajesPriceDisplayLang = "es" | "en";

function stripCurrencyNoise(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/\$\s*\$/g, "$")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract a numeric amount when the string is primarily a price figure. */
export function parseViajesPriceAmount(raw: string | null | undefined): number | null {
  const t = stripCurrencyNoise(String(raw ?? ""));
  if (!t) return null;
  if (/gratis|free\b|sin\s+costo|no\s+cost/i.test(t) && !/\d/.test(t)) return 0;
  const m = t.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]!.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isViajesExplicitlyFreePrice(raw: string | null | undefined): boolean {
  const t = stripCurrencyNoise(String(raw ?? ""));
  if (!t) return false;
  if (/^(gratis|free|sin\s+costo)$/i.test(t)) return true;
  if (/gratis|free\b/i.test(t) && parseViajesPriceAmount(t) === 0) return true;
  return false;
}

/**
 * Format a public Viajes price label.
 * - empty / unparseable non-free → "" (caller hides)
 * - explicit free → Gratis / Free
 * - numeric 0 without free language → "" (do not invent $0)
 * - preserves user "Desde" / "From" when already present
 */
export function formatViajesPublicPrice(
  raw: string | null | undefined,
  lang: ViajesPriceDisplayLang = "es",
): string {
  const t = stripCurrencyNoise(String(raw ?? ""));
  if (!t) return "";
  if (/nan|undefined|null|\[object object\]/i.test(t)) return "";

  if (isViajesExplicitlyFreePrice(t)) {
    return lang === "en" ? "Free" : "Gratis";
  }

  const amount = parseViajesPriceAmount(t);
  if (amount === null) {
    // Non-numeric truthful language (e.g. "Consultar", "Ask provider") — keep as-is if safe.
    if (/consultar|ask\s+provider|precio\s+a\s+consultar|contact/i.test(t)) return t;
    // If it already looks like a composed price phrase, return cleaned.
    if (/\$|usd|mxn|eur|persona|person|desde|from/i.test(t)) return t;
    return t;
  }

  if (amount === 0) {
    // Bare zero is not treated as free unless explicit free language was present.
    return "";
  }

  const hasDesde = /\bdesde\b|\bfrom\b/i.test(t);
  const hasPerson = /persona|person|pp\b/i.test(t);
  const formatted = amount.toLocaleString(lang === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  });

  // Avoid double $ when original already had a symbol and we rebuild.
  if (hasDesde && hasPerson) {
    return lang === "en" ? `From ${formatted} / person` : `Desde ${formatted} / persona`;
  }
  if (hasDesde) {
    return lang === "en" ? `From ${formatted}` : `Desde ${formatted}`;
  }
  if (hasPerson) {
    return lang === "en" ? `${formatted} / person` : `${formatted} / persona`;
  }

  // If the original string already looks well-formed with $, prefer cleaned original
  // (preserves custom suffixes the user typed).
  if (/\$/.test(t) && !/\$\s*\$/.test(t) && !/nan/i.test(t)) {
    return t;
  }

  return formatted;
}

/** Hide price UI when formatter returns empty. */
export function viajesPublicPriceOrEmpty(
  raw: string | null | undefined,
  lang: ViajesPriceDisplayLang = "es",
): string {
  return formatViajesPublicPrice(raw, lang);
}
