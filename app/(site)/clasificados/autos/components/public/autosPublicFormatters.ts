import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";

/** Spanish uses the same $-prefixed grouped format as English for USD; locale mainly changes the
 * decimal/grouping separators, which are identical for es-US and en-US. Passing the viewer's own
 * locale keeps this correct if that ever changes, rather than hardcoding en-US regardless of who
 * is looking at the price. */
export function formatAutosUsd(n: number, lang: AutosPublicLang = "en"): string {
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// "mi" alone reads as the Spanish possessive "my" out of context — "millas" is the unambiguous,
// standard unit word used in Spanish-language US auto listings.
const MILES_UNIT: Record<AutosPublicLang, string> = { es: "millas", en: "mi" };

/** Distance is always reported in miles (US market) — never converted to km — but the unit
 * abbreviation and number grouping still follow the viewer's own locale. */
export function formatAutosMiles(n: number, lang: AutosPublicLang = "en"): string {
  const value = new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(Math.round(n));
  return `${value} ${MILES_UNIT[lang]}`;
}

export function formatAutosLocation(city: string, state: string): string {
  return `${city}, ${state}`;
}
