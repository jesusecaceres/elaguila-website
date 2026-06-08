/** Leonix platform language config — server/client safe, no provider secrets. */

export type LanguageDirection = "ltr" | "rtl";
export type LanguageStatus = "active" | "planned" | "held";

/** Routable site languages (URL ?lang=, header selector). */
export type SupportedLang = "es" | "en" | "vi";

export type PlannedNonRtlLanguageCode =
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

export type HeldRtlLanguageCode = "ar" | "fa";

export type LanguageCode = SupportedLang | PlannedNonRtlLanguageCode | HeldRtlLanguageCode;

export type LanguageDefinition = {
  code: LanguageCode;
  /** Value stored in `?lang=` when active; may differ from provider code. */
  routeCode: string;
  label: string;
  nativeLabel: string;
  englishLabel: string;
  direction: LanguageDirection;
  status: LanguageStatus;
  /** Google Cloud Translation language code when different from route code. */
  providerCode?: string;
  notes?: string;
};

export const DEFAULT_LANG: SupportedLang = "es";

export const PRIMARY_LANGUAGES = ["es", "en"] as const satisfies readonly SupportedLang[];

/** Live in More Languages dropdown — routable today. */
export const ACTIVE_ADDITIONAL_LANGUAGES = ["vi"] as const satisfies readonly SupportedLang[];

/** @deprecated Alias for ACTIVE_ADDITIONAL_LANGUAGES */
export const ADDITIONAL_LANGUAGES = ACTIVE_ADDITIONAL_LANGUAGES;

export const PLANNED_NON_RTL_LANGUAGE_CODES = [
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
] as const satisfies readonly PlannedNonRtlLanguageCode[];

export const HELD_RTL_LANGUAGE_CODES = ["ar", "fa"] as const satisfies readonly HeldRtlLanguageCode[];

const REGISTRY: Record<LanguageCode, LanguageDefinition> = {
  es: {
    code: "es",
    routeCode: "es",
    label: "Español",
    nativeLabel: "Español",
    englishLabel: "Spanish",
    direction: "ltr",
    status: "active",
    providerCode: "es",
  },
  en: {
    code: "en",
    routeCode: "en",
    label: "English",
    nativeLabel: "English",
    englishLabel: "English",
    direction: "ltr",
    status: "active",
    providerCode: "en",
  },
  vi: {
    code: "vi",
    routeCode: "vi",
    label: "Tiếng Việt",
    nativeLabel: "Tiếng Việt",
    englishLabel: "Vietnamese",
    direction: "ltr",
    status: "active",
    providerCode: "vi",
    notes: "Site UI + magazine reader active; Translate Ad cache/API blocked until SQL2E.",
  },
  pt: {
    code: "pt",
    routeCode: "pt",
    label: "Português",
    nativeLabel: "Português",
    englishLabel: "Portuguese",
    direction: "ltr",
    status: "planned",
    providerCode: "pt",
  },
  tl: {
    code: "tl",
    routeCode: "tl",
    label: "Tagalog / Filipino",
    nativeLabel: "Tagalog / Filipino",
    englishLabel: "Tagalog / Filipino",
    direction: "ltr",
    status: "planned",
    providerCode: "fil",
    notes: "Route code tl; Google Cloud Translation uses fil for Filipino.",
  },
  km: {
    code: "km",
    routeCode: "km",
    label: "Khmer / Cambodian",
    nativeLabel: "ភាសាខ្មែរ",
    englishLabel: "Khmer / Cambodian",
    direction: "ltr",
    status: "planned",
    providerCode: "km",
  },
  zh: {
    code: "zh",
    routeCode: "zh",
    label: "Chinese (Simplified)",
    nativeLabel: "简体中文",
    englishLabel: "Chinese (Simplified)",
    direction: "ltr",
    status: "planned",
    providerCode: "zh-CN",
    notes: "Route code zh; provider may use zh-CN or zh-Hans — verify at activation.",
  },
  ja: {
    code: "ja",
    routeCode: "ja",
    label: "Japanese",
    nativeLabel: "日本語",
    englishLabel: "Japanese",
    direction: "ltr",
    status: "planned",
    providerCode: "ja",
  },
  ko: {
    code: "ko",
    routeCode: "ko",
    label: "Korean",
    nativeLabel: "한국어",
    englishLabel: "Korean",
    direction: "ltr",
    status: "planned",
    providerCode: "ko",
  },
  hi: {
    code: "hi",
    routeCode: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    englishLabel: "Hindi",
    direction: "ltr",
    status: "planned",
    providerCode: "hi",
  },
  hy: {
    code: "hy",
    routeCode: "hy",
    label: "Armenian",
    nativeLabel: "Հայերեն",
    englishLabel: "Armenian",
    direction: "ltr",
    status: "planned",
    providerCode: "hy",
  },
  ru: {
    code: "ru",
    routeCode: "ru",
    label: "Russian",
    nativeLabel: "Русский",
    englishLabel: "Russian",
    direction: "ltr",
    status: "planned",
    providerCode: "ru",
  },
  pa: {
    code: "pa",
    routeCode: "pa",
    label: "Punjabi",
    nativeLabel: "ਪੰਜਾਬੀ",
    englishLabel: "Punjabi",
    direction: "ltr",
    status: "planned",
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

export const PLANNED_NON_RTL_LANGUAGES: readonly LanguageDefinition[] = PLANNED_NON_RTL_LANGUAGE_CODES.map(
  (code) => REGISTRY[code],
);

export const HELD_RTL_LANGUAGES: readonly LanguageDefinition[] = HELD_RTL_LANGUAGE_CODES.map(
  (code) => REGISTRY[code],
);

/** @deprecated Prefer PLANNED_NON_RTL_LANGUAGES — kept for LANG-G1 imports. */
export type FutureLanguageCode = PlannedNonRtlLanguageCode;

/** @deprecated Prefer PLANNED_NON_RTL_LANGUAGES */
export type FutureLanguage = {
  code: FutureLanguageCode;
  label: string;
  status: "planned";
};

/** @deprecated Prefer PLANNED_NON_RTL_LANGUAGES */
export const FUTURE_LANGUAGES: FutureLanguage[] = PLANNED_NON_RTL_LANGUAGES.map((def) => ({
  code: def.code as FutureLanguageCode,
  label: def.label,
  status: "planned" as const,
}));

export const LANGUAGE_LABELS: Record<SupportedLang, string> = {
  es: REGISTRY.es.label,
  en: REGISTRY.en.label,
  vi: REGISTRY.vi.label,
};

export const LANGUAGE_SHORT: Record<SupportedLang, string> = {
  es: "ES",
  en: "EN",
  vi: "VI",
};

const ACTIVE_ROUTE_CODES = new Set<string>([
  ...PRIMARY_LANGUAGES,
  ...ACTIVE_ADDITIONAL_LANGUAGES,
]);

export function isLanguageCode(value: string): value is LanguageCode {
  return value in REGISTRY;
}

export function normalizeLang(input: string | null | undefined): SupportedLang {
  const raw = (input ?? "").trim().toLowerCase();
  if (raw === "en" || raw === "vi") return raw;
  if (raw === "es") return "es";
  return DEFAULT_LANG;
}

/** Active routable lang only; returns null for planned/held/unknown codes. */
export function normalizeSelectableLang(input: string | null | undefined): SupportedLang | null {
  const raw = (input ?? "").trim().toLowerCase();
  if (raw === "es" || raw === "en" || raw === "vi") return raw;
  return null;
}

export function getLanguageDefinition(code: LanguageCode): LanguageDefinition {
  return REGISTRY[code];
}

export function getLanguageLabel(lang: LanguageCode | SupportedLang): string {
  if (isLanguageCode(lang)) return REGISTRY[lang].label;
  return LANGUAGE_LABELS[normalizeLang(lang)];
}

export function getLanguageNativeLabel(lang: LanguageCode | SupportedLang): string {
  if (isLanguageCode(lang)) return REGISTRY[lang].nativeLabel;
  return LANGUAGE_LABELS[normalizeLang(lang)];
}

export function getLanguageDirection(lang: LanguageCode | SupportedLang): LanguageDirection {
  if (isLanguageCode(lang)) return REGISTRY[lang].direction;
  return "ltr";
}

export function getProviderLanguageCode(lang: LanguageCode): string {
  const def = REGISTRY[lang];
  return def.providerCode ?? def.routeCode;
}

export function isActiveLanguage(lang: string | null | undefined): lang is SupportedLang {
  return normalizeSelectableLang(lang) != null;
}

export function isPlannedLanguage(lang: string | null | undefined): boolean {
  const raw = (lang ?? "").trim().toLowerCase();
  return (PLANNED_NON_RTL_LANGUAGE_CODES as readonly string[]).includes(raw);
}

export function isHeldLanguage(lang: string | null | undefined): boolean {
  const raw = (lang ?? "").trim().toLowerCase();
  return (HELD_RTL_LANGUAGE_CODES as readonly string[]).includes(raw);
}

/** Nav chrome copy: Spanish for es; English for en and vi (until dedicated VI chrome exists). */
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

export function heldLanguageNote(currentLang: SupportedLang): string {
  if (currentLang === "en") return "RTL — later";
  if (currentLang === "vi") return "RTL — sau";
  return "RTL — después";
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
  return (ACTIVE_ADDITIONAL_LANGUAGES as readonly SupportedLang[]).includes(lang);
}
