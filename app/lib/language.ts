/** Leonix platform language config — server/client safe, no provider secrets. */

export type LanguageDirection = "ltr" | "rtl";

/** Routable active non-RTL site languages (URL ?lang=, header selector). */
export type SupportedLang =
  | "es"
  | "en"
  | "vi"
  | "pt"
  | "tl"
  | "km"
  | "zh"
  | "ja"
  | "ko"
  | "hi"
  | "hy"
  | "ru"
  | "pa";

export type HeldRtlLang = "ar" | "fa";

export type LanguageCode = SupportedLang | HeldRtlLang;

export const DEFAULT_LANG: SupportedLang = "es";

export const PRIMARY_LANGUAGES = ["es", "en"] as const satisfies readonly SupportedLang[];

/** Active community languages in More Languages dropdown (non-primary). */
export const ADDITIONAL_LANGUAGES = [
  "vi",
  "pt",
  "tl",
  "km",
  "zh",
  "ja",
  "ko",
  "hi",
  "hy",
  "ru",
  "pa",
] as const satisfies readonly SupportedLang[];

/** @deprecated Alias for ADDITIONAL_LANGUAGES */
export const ACTIVE_ADDITIONAL_LANGUAGES = ADDITIONAL_LANGUAGES;

export const ALL_SUPPORTED_LANGS = [...PRIMARY_LANGUAGES, ...ADDITIONAL_LANGUAGES] as const satisfies readonly SupportedLang[];

export type HeldRtlLanguageEntry = {
  code: HeldRtlLang;
  englishName: string;
  label: string;
  status: "held-rtl";
};

export const HELD_RTL_LANGUAGES: readonly HeldRtlLanguageEntry[] = [
  { code: "ar", englishName: "Arabic", label: "العربية", status: "held-rtl" },
  { code: "fa", englishName: "Persian / Farsi", label: "فارسی", status: "held-rtl" },
];

export const HELD_RTL_LANGUAGE_CODES = ["ar", "fa"] as const satisfies readonly HeldRtlLang[];

export const LANGUAGE_LABELS: Record<SupportedLang, string> = {
  es: "Español",
  en: "English",
  vi: "Tiếng Việt",
  pt: "Português",
  tl: "Tagalog / Filipino",
  km: "Khmer / Cambodian",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  hi: "हिन्दी",
  hy: "Հայերեն",
  ru: "Русский",
  pa: "ਪੰਜਾਬੀ",
};

export const LANGUAGE_ENGLISH_NAMES: Record<SupportedLang, string> = {
  es: "Spanish",
  en: "English",
  vi: "Vietnamese",
  pt: "Portuguese",
  tl: "Tagalog / Filipino",
  km: "Khmer / Cambodian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  hy: "Armenian",
  ru: "Russian",
  pa: "Punjabi",
};

/** Google Cloud Translation provider codes (route code may differ). */
export const PROVIDER_LANGUAGE_CODES: Record<SupportedLang, string> = {
  es: "es",
  en: "en",
  vi: "vi",
  pt: "pt",
  tl: "fil",
  km: "km",
  zh: "zh-CN",
  ja: "ja",
  ko: "ko",
  hi: "hi",
  hy: "hy",
  ru: "ru",
  pa: "pa",
};

export const LANGUAGE_SHORT: Record<SupportedLang, string> = {
  es: "ES",
  en: "EN",
  vi: "VI",
  pt: "PT",
  tl: "TL",
  km: "KM",
  zh: "ZH",
  ja: "JA",
  ko: "KO",
  hi: "HI",
  hy: "HY",
  ru: "RU",
  pa: "PA",
};

const SUPPORTED_LANG_SET = new Set<string>(ALL_SUPPORTED_LANGS);

const MAGAZINE_HERO_CTA_ES = {
  read: "Leer la revista",
  digital: "Ver edición digital",
} as const;

const MAGAZINE_HERO_CTA_EN = {
  read: "Read the magazine",
  digital: "View digital edition",
} as const;

const MAGAZINE_HERO_CTA_VI = {
  read: "Đọc tạp chí",
  digital: "Xem phiên bản kỹ thuật số",
} as const;

function magazineHeroCtaForLang(lang: SupportedLang): { read: string; digital: string } {
  if (lang === "es") return MAGAZINE_HERO_CTA_ES;
  if (lang === "vi") return MAGAZINE_HERO_CTA_VI;
  return MAGAZINE_HERO_CTA_EN;
}

export const MAGAZINE_HERO_CTAS = Object.fromEntries(
  ALL_SUPPORTED_LANGS.map((code) => [code, magazineHeroCtaForLang(code)]),
) as Record<SupportedLang, { read: string; digital: string }>;

/** @deprecated GLOBAL-BASE1 — all non-RTL languages are active; kept for import compat. */
export type PlannedNonRtlLanguageCode = never;

/** @deprecated GLOBAL-BASE1 — all non-RTL languages are active. */
export const PLANNED_NON_RTL_LANGUAGE_CODES = [] as const;

/** @deprecated GLOBAL-BASE1 — all non-RTL languages are active. */
export const PLANNED_NON_RTL_LANGUAGES = [] as const;

/** @deprecated GLOBAL-BASE1 */
export type FutureLanguageCode = never;

/** @deprecated GLOBAL-BASE1 */
export type FutureLanguage = { code: never; label: string; status: "planned" };

/** @deprecated GLOBAL-BASE1 */
export const FUTURE_LANGUAGES: FutureLanguage[] = [];

/** @deprecated Use HELD_RTL_LANGUAGES entries — registry retained for direction lookup. */
export type HeldRtlLanguageCode = HeldRtlLang;

export type LanguageStatus = "active" | "held";

export type LanguageDefinition = {
  code: LanguageCode;
  routeCode: string;
  label: string;
  nativeLabel: string;
  englishLabel: string;
  direction: LanguageDirection;
  status: LanguageStatus;
  providerCode?: string;
  notes?: string;
};

const REGISTRY: Record<LanguageCode, LanguageDefinition> = {
  es: {
    code: "es",
    routeCode: "es",
    label: LANGUAGE_LABELS.es,
    nativeLabel: LANGUAGE_LABELS.es,
    englishLabel: LANGUAGE_ENGLISH_NAMES.es,
    direction: "ltr",
    status: "active",
    providerCode: "es",
  },
  en: {
    code: "en",
    routeCode: "en",
    label: LANGUAGE_LABELS.en,
    nativeLabel: LANGUAGE_LABELS.en,
    englishLabel: LANGUAGE_ENGLISH_NAMES.en,
    direction: "ltr",
    status: "active",
    providerCode: "en",
  },
  vi: {
    code: "vi",
    routeCode: "vi",
    label: LANGUAGE_LABELS.vi,
    nativeLabel: LANGUAGE_LABELS.vi,
    englishLabel: LANGUAGE_ENGLISH_NAMES.vi,
    direction: "ltr",
    status: "active",
    providerCode: "vi",
  },
  pt: {
    code: "pt",
    routeCode: "pt",
    label: LANGUAGE_LABELS.pt,
    nativeLabel: LANGUAGE_LABELS.pt,
    englishLabel: LANGUAGE_ENGLISH_NAMES.pt,
    direction: "ltr",
    status: "active",
    providerCode: "pt",
  },
  tl: {
    code: "tl",
    routeCode: "tl",
    label: LANGUAGE_LABELS.tl,
    nativeLabel: LANGUAGE_LABELS.tl,
    englishLabel: LANGUAGE_ENGLISH_NAMES.tl,
    direction: "ltr",
    status: "active",
    providerCode: "fil",
    notes: "Route code tl; Google Cloud Translation uses fil for Filipino.",
  },
  km: {
    code: "km",
    routeCode: "km",
    label: LANGUAGE_LABELS.km,
    nativeLabel: "ភាសាខ្មែរ",
    englishLabel: LANGUAGE_ENGLISH_NAMES.km,
    direction: "ltr",
    status: "active",
    providerCode: "km",
  },
  zh: {
    code: "zh",
    routeCode: "zh",
    label: LANGUAGE_LABELS.zh,
    nativeLabel: "简体中文",
    englishLabel: LANGUAGE_ENGLISH_NAMES.zh,
    direction: "ltr",
    status: "active",
    providerCode: "zh-CN",
    notes: "Route code zh; provider uses zh-CN (Simplified).",
  },
  ja: {
    code: "ja",
    routeCode: "ja",
    label: LANGUAGE_LABELS.ja,
    nativeLabel: LANGUAGE_LABELS.ja,
    englishLabel: LANGUAGE_ENGLISH_NAMES.ja,
    direction: "ltr",
    status: "active",
    providerCode: "ja",
  },
  ko: {
    code: "ko",
    routeCode: "ko",
    label: LANGUAGE_LABELS.ko,
    nativeLabel: LANGUAGE_LABELS.ko,
    englishLabel: LANGUAGE_ENGLISH_NAMES.ko,
    direction: "ltr",
    status: "active",
    providerCode: "ko",
  },
  hi: {
    code: "hi",
    routeCode: "hi",
    label: LANGUAGE_LABELS.hi,
    nativeLabel: LANGUAGE_LABELS.hi,
    englishLabel: LANGUAGE_ENGLISH_NAMES.hi,
    direction: "ltr",
    status: "active",
    providerCode: "hi",
  },
  hy: {
    code: "hy",
    routeCode: "hy",
    label: LANGUAGE_LABELS.hy,
    nativeLabel: LANGUAGE_LABELS.hy,
    englishLabel: LANGUAGE_ENGLISH_NAMES.hy,
    direction: "ltr",
    status: "active",
    providerCode: "hy",
  },
  ru: {
    code: "ru",
    routeCode: "ru",
    label: LANGUAGE_LABELS.ru,
    nativeLabel: LANGUAGE_LABELS.ru,
    englishLabel: LANGUAGE_ENGLISH_NAMES.ru,
    direction: "ltr",
    status: "active",
    providerCode: "ru",
  },
  pa: {
    code: "pa",
    routeCode: "pa",
    label: LANGUAGE_LABELS.pa,
    nativeLabel: LANGUAGE_LABELS.pa,
    englishLabel: LANGUAGE_ENGLISH_NAMES.pa,
    direction: "ltr",
    status: "active",
    providerCode: "pa",
  },
  ar: {
    code: "ar",
    routeCode: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    englishLabel: "Arabic",
    direction: "rtl",
    status: "held",
    providerCode: "ar",
    notes: "RTL — held for dedicated layout gate.",
  },
  fa: {
    code: "fa",
    routeCode: "fa",
    label: "Persian / Farsi",
    nativeLabel: "فارسی",
    englishLabel: "Persian / Farsi",
    direction: "rtl",
    status: "held",
    providerCode: "fa",
    notes: "RTL — held for dedicated layout gate.",
  },
};

export const LANGUAGE_REGISTRY: Readonly<Record<LanguageCode, LanguageDefinition>> = REGISTRY;

function normalizeLangInput(input: string | null | undefined): string {
  return (input ?? "").trim().toLowerCase();
}

export function isHeldRtlLang(input: string | null | undefined): boolean {
  const raw = normalizeLangInput(input);
  return raw === "ar" || raw === "fa";
}

export function isSupportedLang(input: string | null | undefined): boolean {
  const raw = normalizeLangInput(input);
  if (!raw || isHeldRtlLang(raw)) return false;
  if (raw === "fil") return true;
  if (raw === "zh-cn" || raw === "zh-hans") return true;
  return SUPPORTED_LANG_SET.has(raw);
}

export function normalizeLang(input: string | null | undefined): SupportedLang {
  const raw = normalizeLangInput(input);
  if (!raw || isHeldRtlLang(raw)) return DEFAULT_LANG;
  if (raw === "fil") return "tl";
  if (raw === "zh-cn" || raw === "zh-hans") return "zh";
  if (SUPPORTED_LANG_SET.has(raw)) return raw as SupportedLang;
  return DEFAULT_LANG;
}

/** Active routable lang; returns null for held/unknown codes. */
export function normalizeSelectableLang(input: string | null | undefined): SupportedLang | null {
  return isSupportedLang(input) ? normalizeLang(input) : null;
}

export function isLanguageCode(value: string): value is LanguageCode {
  return value in REGISTRY;
}

export function getLanguageDefinition(code: LanguageCode): LanguageDefinition {
  return REGISTRY[code];
}

export function getLanguageLabel(lang: SupportedLang): string {
  return LANGUAGE_LABELS[lang];
}

export function getLanguageEnglishName(lang: SupportedLang): string {
  return LANGUAGE_ENGLISH_NAMES[lang];
}

export function getLanguageNativeLabel(lang: LanguageCode | SupportedLang): string {
  if (isLanguageCode(lang)) return REGISTRY[lang].nativeLabel;
  return LANGUAGE_LABELS[normalizeLang(lang)];
}

export function getLanguageDirection(lang: LanguageCode | SupportedLang): LanguageDirection {
  if (isLanguageCode(lang)) return REGISTRY[lang].direction;
  return "ltr";
}

export function getProviderLanguageCode(lang: SupportedLang): string {
  return PROVIDER_LANGUAGE_CODES[lang];
}

export function isActiveLanguage(lang: string | null | undefined): lang is SupportedLang {
  return isSupportedLang(lang);
}

/** @deprecated GLOBAL-BASE1 — all non-RTL languages are active. */
export function isPlannedLanguage(_lang: string | null | undefined): boolean {
  return false;
}

/** @deprecated Use isHeldRtlLang */
export function isHeldLanguage(lang: string | null | undefined): boolean {
  return isHeldRtlLang(lang);
}

/** Nav chrome copy: Spanish for es; English for all other active languages until dedicated copy exists. */
export function navCopyLang(routeLang: SupportedLang): "es" | "en" {
  return routeLang === "es" ? "es" : "en";
}

/** Hand-authored static page copy (ES/EN/VI today); community langs fall back to EN. */
export function staticPageCopyLang(routeLang: SupportedLang): "es" | "en" | "vi" {
  if (routeLang === "es") return "es";
  if (routeLang === "vi") return "vi";
  return "en";
}

export function languageAriaLabel(lang: SupportedLang): string {
  if (lang === "en") return "Language";
  if (lang === "vi") return "Ngôn ngữ";
  if (lang === "es") return "Idioma";
  return "Language";
}

export function moreLanguagesDropdownLabel(currentLang: SupportedLang): string {
  return navCopyLang(currentLang) === "en" ? "More languages" : "Más idiomas";
}

/** @deprecated GLOBAL-BASE1 — planned languages are now active. */
export function plannedLanguageNote(_currentLang: SupportedLang): string {
  return "Coming soon";
}

/** @deprecated RTL languages are hidden from public dropdown in GLOBAL-BASE1. */
export function heldLanguageNote(currentLang: SupportedLang): string {
  if (currentLang === "en") return "RTL — later";
  if (currentLang === "vi") return "RTL — sau";
  return "RTL — después";
}

/** Replace or append lang query param on internal hrefs; preserves other query params and hash. */
export function replaceLangInHref(pathOrUrl: string, lang: SupportedLang): string {
  if (!pathOrUrl.startsWith("/") || pathOrUrl.startsWith("//")) return pathOrUrl;
  const hashIndex = pathOrUrl.indexOf("#");
  const withoutHash = hashIndex >= 0 ? pathOrUrl.slice(0, hashIndex) : pathOrUrl;
  const hash = hashIndex >= 0 ? pathOrUrl.slice(hashIndex) : "";
  const qIndex = withoutHash.indexOf("?");
  const path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const params = new URLSearchParams(qIndex >= 0 ? withoutHash.slice(qIndex + 1) : "");
  params.set("lang", lang);
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash}`;
}

export function isAdditionalLanguageActive(lang: SupportedLang): boolean {
  return (ADDITIONAL_LANGUAGES as readonly SupportedLang[]).includes(lang);
}
