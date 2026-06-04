export type LeonixSiteLang = "es" | "en" | "vi";

export const LEONIX_LANG_CODES: LeonixSiteLang[] = ["es", "en", "vi"];

export const LEONIX_LANG_LABELS: Record<LeonixSiteLang, string> = {
  es: "Español",
  en: "English",
  vi: "Tiếng Việt",
};

/** Compact header pills (full names via title + aria). */
export const LEONIX_LANG_SHORT: Record<LeonixSiteLang, string> = {
  es: "ES",
  en: "EN",
  vi: "VI",
};

export function resolveLeonixSiteLang(raw: string | null | undefined): LeonixSiteLang {
  if (raw === "en" || raw === "vi") return raw;
  return "es";
}

export function leonixLangAria(lang: LeonixSiteLang): string {
  if (lang === "en") return "Language";
  if (lang === "vi") return "Ngôn ngữ";
  return "Idioma";
}

/** Nav chrome copy: Spanish for es; English for en and vi (magazine reader is vi-capable). */
export function leonixNavCopyLang(routeLang: LeonixSiteLang): "es" | "en" {
  return routeLang === "es" ? "es" : "en";
}

export const LEONIX_MAGAZINE_HERO_CTAS: Record<
  LeonixSiteLang,
  { read: string; digital: string }
> = {
  es: { read: "Leer la revista", digital: "Ver edición digital" },
  en: { read: "Read the magazine", digital: "View digital edition" },
  vi: { read: "Đọc tạp chí", digital: "Xem phiên bản kỹ thuật số" },
};

/** Replace or append lang query param on internal hrefs. */
export function withLeonixLang(href: string, routeLang: LeonixSiteLang): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const qIndex = href.indexOf("?");
  const path = qIndex >= 0 ? href.slice(0, qIndex) : href;
  const params = new URLSearchParams(qIndex >= 0 ? href.slice(qIndex + 1) : "");
  params.set("lang", routeLang);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
