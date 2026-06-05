/** Leonix platform language config — server/client safe, no provider secrets. */

export type SupportedLang = "es" | "en" | "vi";

export const DEFAULT_LANG: SupportedLang = "es";

export const PRIMARY_LANGUAGES = ["es", "en"] as const satisfies readonly SupportedLang[];

export const ADDITIONAL_LANGUAGES = ["vi"] as const satisfies readonly SupportedLang[];

export type FutureLanguageCode = "tl" | "km" | "zh" | "ja";

export type FutureLanguage = {
  code: FutureLanguageCode;
  label: string;
  status: "planned";
};

/** Config only — not routable until a future gate activates them. */
export const FUTURE_LANGUAGES: FutureLanguage[] = [
  { code: "tl", label: "Tagalog / Filipino", status: "planned" },
  { code: "km", label: "Khmer / Cambodian", status: "planned" },
  { code: "zh", label: "Chinese", status: "planned" },
  { code: "ja", label: "Japanese", status: "planned" },
];

export const LANGUAGE_LABELS: Record<SupportedLang, string> = {
  es: "Español",
  en: "English",
  vi: "Tiếng Việt",
};

export const LANGUAGE_SHORT: Record<SupportedLang, string> = {
  es: "ES",
  en: "EN",
  vi: "VI",
};

export function normalizeLang(input: string | null | undefined): SupportedLang {
  if (input === "en" || input === "vi") return input;
  return DEFAULT_LANG;
}

export function getLanguageLabel(lang: SupportedLang): string {
  return LANGUAGE_LABELS[lang];
}

/** Nav chrome copy: Spanish for es; English for en and vi. */
export function navCopyLang(routeLang: SupportedLang): "es" | "en" {
  return routeLang === "es" ? "es" : "en";
}

export function languageAriaLabel(lang: SupportedLang): string {
  if (lang === "en") return "Language";
  if (lang === "vi") return "Ngôn ngữ";
  return "Idioma";
}

export function moreLanguagesDropdownLabel(currentLang: SupportedLang): string {
  const copyLang = navCopyLang(currentLang);
  return copyLang === "en" ? "More languages" : "Más idiomas";
}

export function plannedLanguageNote(currentLang: SupportedLang): string {
  if (currentLang === "en") return "Coming soon";
  if (currentLang === "vi") return "Sắp có";
  return "Próximamente";
}

export const MAGAZINE_HERO_CTAS: Record<SupportedLang, { read: string; digital: string }> = {
  es: { read: "Leer la revista", digital: "Ver edición digital" },
  en: { read: "Read the magazine", digital: "View digital edition" },
  vi: { read: "Đọc tạp chí", digital: "Xem phiên bản kỹ thuật số" },
};

/** Replace or append lang query param on internal hrefs; preserves other query params. */
export function replaceLangInHref(pathOrUrl: string, lang: SupportedLang): string {
  if (!pathOrUrl.startsWith("/") || pathOrUrl.startsWith("//")) return pathOrUrl;
  const qIndex = pathOrUrl.indexOf("?");
  const path = qIndex >= 0 ? pathOrUrl.slice(0, qIndex) : pathOrUrl;
  const params = new URLSearchParams(qIndex >= 0 ? pathOrUrl.slice(qIndex + 1) : "");
  params.set("lang", lang);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function isAdditionalLanguageActive(lang: SupportedLang): boolean {
  return (ADDITIONAL_LANGUAGES as readonly SupportedLang[]).includes(lang);
}
