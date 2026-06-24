import type { LeadLang } from "./leadCaptureValidation";

/** Public contact/lead forms — free-text location (any city or country). */
export function getGlobalLocationLabel(lang: LeadLang): string {
  return lang === "en" ? "City, state/region, and country" : "Ciudad, estado/región y país";
}

export function getGlobalLocationPlaceholder(lang: LeadLang): string {
  return lang === "en"
    ? "Example: San Jose, California, United States"
    : "Ej. San José, California, Estados Unidos";
}

export function getGlobalLocationHelper(lang: LeadLang): string {
  return lang === "en" ? "You can enter any city or country." : "Puedes escribir cualquier ciudad o país.";
}

/** Trim and cap length; preserves free-entered location text (no NorCal restriction). */
export function normalizeLocationForSubmit(value: string): string {
  return String(value ?? "").trim().slice(0, 120);
}
