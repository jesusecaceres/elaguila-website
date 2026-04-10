export type RentasLandingLang = "es" | "en";

export const RENTAS_LANDING_LANG_QUERY = "lang";

export function normalizeRentasLandingLang(raw: string | null | undefined): RentasLandingLang {
  return raw === "en" ? "en" : "es";
}

/** Append `lang` to an href, preserving existing query params. */
export function withRentasLandingLang(href: string, lang: RentasLandingLang): string {
  if (href.startsWith("#")) return href;
  try {
    const u = new URL(href, "https://leonix.local");
    u.searchParams.set(RENTAS_LANDING_LANG_QUERY, lang);
    return u.pathname + u.search + u.hash;
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}${RENTAS_LANDING_LANG_QUERY}=${lang}`;
  }
}
