/** Leonix platform language config — server/client safe, no provider secrets. */

/**
 * UI language (`viewerLanguage`) follows route `?lang=` for platform chrome.
 * Seller-entered listing content (`sourceContentLanguage`) is not translated here.
 */

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

/** Official Leonix launch UI languages — public selectors and routable ?lang=. */
export const OFFICIAL_LAUNCH_LANGUAGES = ["es", "en", "pt", "tl"] as const satisfies readonly SupportedLang[];

export type OfficialLaunchLang = (typeof OFFICIAL_LAUNCH_LANGUAGES)[number];

/**
 * Hidden future languages — preserved in registry/docs, inactive until trusted reviewer activation.
 * Route aliases zh-Hans / zh-Hant normalize to fallback (not official).
 */
export const HIDDEN_FUTURE_LANGUAGE_CODES = [
  "vi",
  "zh",
  "km",
  "ja",
  "ko",
  "hi",
  "hy",
  "ru",
  "pa",
] as const satisfies readonly SupportedLang[];

export type HiddenFutureLang = (typeof HIDDEN_FUTURE_LANGUAGE_CODES)[number];

export const PRIMARY_LANGUAGES = ["es", "en"] as const satisfies readonly SupportedLang[];

/** Magazine hub + June 2026 HTML reader — all active public languages. */
export const MAGAZINE_ROUTE_LANGUAGES = [
  "es",
  "en",
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

export type MagazineRouteLang = (typeof MAGAZINE_ROUTE_LANGUAGES)[number];

export function isMagazineRouteLanguage(lang: SupportedLang): lang is MagazineRouteLang {
  return (MAGAZINE_ROUTE_LANGUAGES as readonly SupportedLang[]).includes(lang);
}

export function magazineRouteAdditionalLanguages(): readonly SupportedLang[] {
  return MAGAZINE_ROUTE_LANGUAGES.filter((c) => c !== "es" && c !== "en");
}

/** Official non-primary languages in public More Languages dropdown. */
export const ADDITIONAL_LANGUAGES = ["pt", "tl"] as const satisfies readonly SupportedLang[];

/** @deprecated Alias for ADDITIONAL_LANGUAGES */
export const ACTIVE_ADDITIONAL_LANGUAGES = ADDITIONAL_LANGUAGES;

/** All known route codes — official launch + hidden future (excludes held RTL). */
export const ALL_SUPPORTED_LANGS = [
  ...OFFICIAL_LAUNCH_LANGUAGES,
  ...HIDDEN_FUTURE_LANGUAGE_CODES,
] as const satisfies readonly SupportedLang[];

/** Public-site routable + selector-visible languages (launch scope). */
export const ACTIVE_PUBLIC_LANGS = OFFICIAL_LAUNCH_LANGUAGES;

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

const OFFICIAL_LAUNCH_LANG_SET = new Set<string>(OFFICIAL_LAUNCH_LANGUAGES);
const HIDDEN_FUTURE_LANG_SET = new Set<string>(HIDDEN_FUTURE_LANGUAGE_CODES);
const ALL_KNOWN_LANG_SET = new Set<string>(ALL_SUPPORTED_LANGS);

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

const MAGAZINE_HERO_CTA_PT = {
  read: "Ler a revista",
  digital: "Ver edição digital",
} as const;

const MAGAZINE_HERO_CTA_TL = {
  read: "Basahin ang magazine",
  digital: "Tingnan ang digital edition",
} as const;

const MAGAZINE_HERO_CTA_KM = {
  read: "អានទស្សនាវ",
  digital: "មើលកំណែឌីជីថល",
} as const;

const MAGAZINE_HERO_CTA_ZH = {
  read: "阅读杂志",
  digital: "查看数字版",
} as const;

const MAGAZINE_HERO_CTA_JA = {
  read: "雑誌を読む",
  digital: "デジタル版を見る",
} as const;

const MAGAZINE_HERO_CTA_KO = {
  read: "매거진 읽기",
  digital: "디지털판 보기",
} as const;

const MAGAZINE_HERO_CTA_HI = {
  read: "पत्रिका पढ़ें",
  digital: "डिजिटल संस्करण देखें",
} as const;

const MAGAZINE_HERO_CTA_HY = {
  read: "Կարդալ ամսագիր",
  digital: "Դիտել թվային հրատարակությունը",
} as const;

const MAGAZINE_HERO_CTA_RU = {
  read: "Читать журнал",
  digital: "Смотреть цифровое издание",
} as const;

const MAGAZINE_HERO_CTA_PA = {
  read: "ਪੱਤਰਿਕਾ ਪੜ੍ਹੋ",
  digital: "ਡਿਜੀਟਲ ਐਡੀਸ਼ਨ ਦੇਖੋ",
} as const;

const MAGAZINE_HERO_CTA_BY_LANG: Record<SupportedLang, { read: string; digital: string }> = {
  es: MAGAZINE_HERO_CTA_ES,
  en: MAGAZINE_HERO_CTA_EN,
  vi: MAGAZINE_HERO_CTA_VI,
  pt: MAGAZINE_HERO_CTA_PT,
  tl: MAGAZINE_HERO_CTA_TL,
  km: MAGAZINE_HERO_CTA_KM,
  zh: MAGAZINE_HERO_CTA_ZH,
  ja: MAGAZINE_HERO_CTA_JA,
  ko: MAGAZINE_HERO_CTA_KO,
  hi: MAGAZINE_HERO_CTA_HI,
  hy: MAGAZINE_HERO_CTA_HY,
  ru: MAGAZINE_HERO_CTA_RU,
  pa: MAGAZINE_HERO_CTA_PA,
};

function magazineHeroCtaForLang(lang: SupportedLang): { read: string; digital: string } {
  return MAGAZINE_HERO_CTA_BY_LANG[lang];
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

export type LanguageStatus = "active" | "held" | "future";

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
    status: "future",
    providerCode: "vi",
    notes: "Hidden until trusted Vietnamese reviewer/team activation.",
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
    status: "future",
    providerCode: "km",
    notes: "Hidden until trusted reviewer/team activation.",
  },
  zh: {
    code: "zh",
    routeCode: "zh",
    label: LANGUAGE_LABELS.zh,
    nativeLabel: "简体中文",
    englishLabel: LANGUAGE_ENGLISH_NAMES.zh,
    direction: "ltr",
    status: "future",
    providerCode: "zh-CN",
    notes: "Route code zh; zh-Hans/zh-Hant aliases; hidden until trusted reviewer activation.",
  },
  ja: {
    code: "ja",
    routeCode: "ja",
    label: LANGUAGE_LABELS.ja,
    nativeLabel: LANGUAGE_LABELS.ja,
    englishLabel: LANGUAGE_ENGLISH_NAMES.ja,
    direction: "ltr",
    status: "future",
    providerCode: "ja",
    notes: "Hidden until trusted reviewer/team activation.",
  },
  ko: {
    code: "ko",
    routeCode: "ko",
    label: LANGUAGE_LABELS.ko,
    nativeLabel: LANGUAGE_LABELS.ko,
    englishLabel: LANGUAGE_ENGLISH_NAMES.ko,
    direction: "ltr",
    status: "future",
    providerCode: "ko",
    notes: "Hidden until trusted reviewer/team activation.",
  },
  hi: {
    code: "hi",
    routeCode: "hi",
    label: LANGUAGE_LABELS.hi,
    nativeLabel: LANGUAGE_LABELS.hi,
    englishLabel: LANGUAGE_ENGLISH_NAMES.hi,
    direction: "ltr",
    status: "future",
    providerCode: "hi",
    notes: "Hidden until trusted reviewer/team activation.",
  },
  hy: {
    code: "hy",
    routeCode: "hy",
    label: LANGUAGE_LABELS.hy,
    nativeLabel: LANGUAGE_LABELS.hy,
    englishLabel: LANGUAGE_ENGLISH_NAMES.hy,
    direction: "ltr",
    status: "future",
    providerCode: "hy",
    notes: "Hidden until trusted reviewer/team activation.",
  },
  ru: {
    code: "ru",
    routeCode: "ru",
    label: LANGUAGE_LABELS.ru,
    nativeLabel: LANGUAGE_LABELS.ru,
    englishLabel: LANGUAGE_ENGLISH_NAMES.ru,
    direction: "ltr",
    status: "future",
    providerCode: "ru",
    notes: "Hidden until trusted reviewer/team activation.",
  },
  pa: {
    code: "pa",
    routeCode: "pa",
    label: LANGUAGE_LABELS.pa,
    nativeLabel: LANGUAGE_LABELS.pa,
    englishLabel: LANGUAGE_ENGLISH_NAMES.pa,
    direction: "ltr",
    status: "future",
    providerCode: "pa",
    notes: "Hidden until trusted Punjabi reviewer/team activation.",
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

export function isOfficialLaunchLang(input: string | null | undefined): input is OfficialLaunchLang {
  const raw = normalizeLangInput(input);
  if (!raw || isHeldRtlLang(raw)) return false;
  if (raw === "fil") return true;
  return OFFICIAL_LAUNCH_LANG_SET.has(raw);
}

export function isHiddenFutureLang(input: string | null | undefined): boolean {
  const raw = normalizeLangInput(input);
  if (!raw) return false;
  if (raw === "zh-cn" || raw === "zh-hans" || raw === "zh-hant") return true;
  return HIDDEN_FUTURE_LANG_SET.has(raw);
}

/** Official launch languages only — used for public ?lang= and selectors. */
export function isSupportedLang(input: string | null | undefined): boolean {
  return isOfficialLaunchLang(input);
}

export function normalizeLang(input: string | null | undefined): SupportedLang {
  const raw = normalizeLangInput(input);
  if (!raw || isHeldRtlLang(raw)) return DEFAULT_LANG;
  if (raw === "fil") return "tl";
  if (raw === "zh-cn" || raw === "zh-hans" || raw === "zh-hant") return DEFAULT_LANG;
  if (OFFICIAL_LAUNCH_LANG_SET.has(raw)) return raw as OfficialLaunchLang;
  if (HIDDEN_FUTURE_LANG_SET.has(raw) || ALL_KNOWN_LANG_SET.has(raw)) return DEFAULT_LANG;
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
  const labels: Record<SupportedLang, string> = {
    es: "Idioma",
    en: "Language",
    vi: "Ngôn ngữ",
    pt: "Idioma",
    tl: "Wika",
    km: "ភាសា",
    zh: "语言",
    ja: "言語",
    ko: "언어",
    hi: "भाषा",
    hy: "Լեզու",
    ru: "Язык",
    pa: "ਭਾਸ਼ਾ",
  };
  return labels[lang];
}

/** Universal dropdown trigger — never localized per QR-FRONTDOOR1. */
export const UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER = "🌐 Languages";

/** Honest browser/Google fallback note — official launch scope only. */
export const OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE: Record<OfficialLaunchLang, string> = {
  es: "¿Necesitas otro idioma? Tu navegador puede ofrecer Google Translate y Google Lens puede ayudar con páginas impresas o visuales. Los idiomas oficiales de Leonix son Español, English, Português y Tagalog/Filipino.",
  en: "Need another language? Your browser may offer Google Translate, and Google Lens can help translate printed or visual magazine pages. Leonix official launch languages are Spanish, English, Portuguese, and Tagalog/Filipino.",
  pt: "Precisa de outro idioma? Seu navegador pode oferecer o Google Translate e o Google Lens pode ajudar com páginas impressas ou visuais. Os idiomas oficiais de lançamento da Leonix são Espanhol, Inglês, Português e Tagalog/Filipino.",
  tl: "Kailangan ng ibang wika? Maaaring mag-alok ang iyong browser ng Google Translate, at makakatulong ang Google Lens sa naka-print o visual na mga pahina. Ang opisyal na launch languages ng Leonix ay Spanish, English, Portuguese, at Tagalog/Filipino.",
};

export function getOfficialLaunchLanguageFallbackNote(lang: SupportedLang): string {
  const normalized = normalizeLang(lang);
  return OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE[normalized as OfficialLaunchLang];
}

export function moreLanguagesDropdownLabel(_currentLang: SupportedLang): string {
  return UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER;
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

/** Valid active lang from raw input; null for held/unknown. */
export function normalizePublicLang(value: string | null | undefined): SupportedLang | null {
  return normalizeSelectableLang(value);
}

/** Resolve lang from search params with safe fallback. */
export function resolvePublicLangFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
  fallback: SupportedLang = DEFAULT_LANG,
): SupportedLang {
  if (!searchParams) return fallback;

  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get("lang")
      : Array.isArray(searchParams.lang)
        ? searchParams.lang[0]
        : searchParams.lang;

  return normalizePublicLang(raw) ?? fallback;
}

/** Replace or append lang query param on internal hrefs; preserves other query params and hash. */
export function replaceLangInHref(pathOrUrl: string, lang: SupportedLang): string {
  return withLang(pathOrUrl, lang);
}

/** Set lang on internal href; optional extra query params; preserves hash. */
export function withLang(
  href: string,
  lang: SupportedLang,
  extraParams?: Record<string, string | number | boolean | null | undefined>,
): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const hashIndex = href.indexOf("#");
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const qIndex = withoutHash.indexOf("?");
  const path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const params = new URLSearchParams(qIndex >= 0 ? withoutHash.slice(qIndex + 1) : "");
  params.set("lang", lang);
  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      params.set(key, String(value));
    });
  }
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash}`;
}

export function isAdditionalLanguageActive(lang: SupportedLang): boolean {
  return (ADDITIONAL_LANGUAGES as readonly SupportedLang[]).includes(lang);
}

export type PublicTrackingParams = {
  lang: SupportedLang;
  sourcePage?: string;
  sourceCta?: string;
  service?: string;
  inquiryType?: string;
  source?: string;
  id?: string;
  category?: string;
  returnTo?: string;
};

/** Set lang + optional tracking params on internal hrefs; preserves existing query + hash. */
export function withPublicLangAndTracking(
  href: string,
  params: PublicTrackingParams,
): string {
  const { lang, ...extra } = params;
  return withLang(href, lang, extra);
}

/** Public language persistence — URL wins, then cookie, then localStorage. */
export const LEONIX_LANG_COOKIE = "leonix_lang";
export const LEONIX_LANG_STORAGE_KEY = "leonix_lang";
/** @deprecated Migrated to LEONIX_LANG_STORAGE_KEY on read/write. */
export const LEONIX_LANG_PREF_STORAGE_KEY = "leonix.lang.pref";
export const LEONIX_LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Valid active lang from URL query, or null when absent/invalid. */
export function readUrlLang(queryLang: string | null | undefined): SupportedLang | null {
  if (queryLang && isSupportedLang(queryLang)) return normalizeLang(queryLang);
  return null;
}

function readClientCookieLang(): SupportedLang | null {
  if (typeof document === "undefined") return null;
  const pattern = new RegExp(`(?:^|; )${LEONIX_LANG_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`);
  const match = document.cookie.match(pattern);
  const raw = match?.[1] ? decodeURIComponent(match[1]) : null;
  return raw && isSupportedLang(raw) ? normalizeLang(raw) : null;
}

function writeClientCookieLang(lang: SupportedLang): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LEONIX_LANG_COOKIE}=${encodeURIComponent(lang)}; path=/; max-age=${LEONIX_LANG_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function readClientLocalStorageLang(): SupportedLang | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(LEONIX_LANG_STORAGE_KEY) ??
      localStorage.getItem(LEONIX_LANG_PREF_STORAGE_KEY);
    return raw && isSupportedLang(raw) ? normalizeLang(raw) : null;
  } catch {
    return null;
  }
}

/** localStorage first, then cookie — client only (LANG-MAG-FINALLOCK1). */
export function readClientStoredLangPreference(): SupportedLang | null {
  return readClientLocalStorageLang() ?? readClientCookieLang();
}

/** @deprecated Alias for readClientStoredLangPreference. */
export function readPersistedLangPreference(): SupportedLang | null {
  return readClientStoredLangPreference();
}

/** Persist public lang to cookie + localStorage (both keys during migration). */
export function writePersistedLangPreference(lang: SupportedLang): void {
  if (typeof window === "undefined") return;
  writeClientCookieLang(lang);
  try {
    localStorage.setItem(LEONIX_LANG_STORAGE_KEY, lang);
    localStorage.setItem(LEONIX_LANG_PREF_STORAGE_KEY, lang);
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Append/replace lang on internal path query; preserves hash when provided. */
export function buildPathWithLang(
  pathname: string,
  searchParams: URLSearchParams,
  lang: SupportedLang,
  hash = "",
): string {
  const next = new URLSearchParams(searchParams.toString());
  next.set("lang", lang);
  const qs = next.toString();
  return `${pathname}${qs ? `?${qs}` : ""}${hash}`;
}

/** URL lang → cookie/localStorage → default. Client-safe. */
export function resolveRouteLang(queryLang: string | null | undefined): SupportedLang {
  const raw = (queryLang ?? "").trim();
  if (raw) {
    const fromUrl = readUrlLang(raw);
    if (fromUrl) return fromUrl;
    return normalizeLang(raw);
  }
  const stored = readClientStoredLangPreference();
  if (stored) return stored;
  return DEFAULT_LANG;
}

export function isPublicLangPersistenceExcludedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login")
  );
}
