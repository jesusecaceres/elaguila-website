import { navCopyLang, normalizeLang, replaceLangInHref, type SupportedLang } from "@/app/lib/language";

export type RentasLandingLang = "es" | "en";

export const RENTAS_LANDING_LANG_QUERY = "lang";

export function normalizeRentasLandingLang(raw: string | null | undefined): RentasLandingLang {
  return navCopyLang(normalizeLang(raw));
}

export function resolveRentasRouteLang(raw: string | null | undefined): SupportedLang {
  return normalizeLang(raw);
}

/** Append route lang to an href, preserving existing query params. */
export function withRentasLandingLang(href: string, routeLang: SupportedLang): string {
  if (href.startsWith("#")) return href;
  return replaceLangInHref(href, routeLang);
}
