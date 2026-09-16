/**
 * SQL2E — Translate Ad locale allowlists (API validation, Supabase cache, Google provider).
 * Central source of truth; keep aligned with translation_records CHECK constraints.
 */

/** Non-RTL dynamic translation targets unlocked in SQL2E. ar/fa held for RTL gate. */
export const TRANSLATE_AD_TARGET_LOCALE_CODES = [
  "es",
  "en",
  "vi",
  "pt",
  "tl",
  "fil",
  "km",
  "zh",
  "zh-CN",
  "zh-Hans",
  "ja",
  "ko",
  "hi",
  "hy",
  "ru",
  "pa",
] as const;

export type TranslateAdTargetLocale = (typeof TRANSLATE_AD_TARGET_LOCALE_CODES)[number];

export const TRANSLATE_AD_SOURCE_LOCALE_CODES = [
  ...TRANSLATE_AD_TARGET_LOCALE_CODES,
  "unknown",
] as const;

export type TranslateAdSourceLocale = (typeof TRANSLATE_AD_SOURCE_LOCALE_CODES)[number];

/** RTL locales held — rejected at API; not in DB target constraint. */
export const HELD_RTL_TRANSLATE_LOCALE_CODES = ["ar", "fa"] as const;

const VALID_TARGET_SET = new Set<string>(TRANSLATE_AD_TARGET_LOCALE_CODES);
const VALID_SOURCE_SET = new Set<string>(TRANSLATE_AD_SOURCE_LOCALE_CODES);

export function isValidTranslateAdTargetLocale(locale: string): locale is TranslateAdTargetLocale {
  return VALID_TARGET_SET.has(locale);
}

export function isValidTranslateAdSourceLocale(locale: string): locale is TranslateAdSourceLocale {
  return VALID_SOURCE_SET.has(locale);
}

/**
 * Maps internal/route locale codes to Google Cloud Translation language codes.
 *
 * Tagalog: route `tl` → Google `fil` (Filipino). Alias `fil` passes through.
 * Chinese: route `zh` → Google `zh-CN` (Simplified). Aliases `zh-CN` / `zh-Hans` pass through.
 */
export function mapTranslateAdLocaleToGoogle(locale: TranslateAdTargetLocale): string {
  switch (locale) {
    case "en":
      return "en";
    case "es":
      return "es";
    case "vi":
      return "vi";
    case "pt":
      return "pt";
    case "tl":
      return "fil";
    case "fil":
      return "fil";
    case "km":
      return "km";
    case "zh":
      return "zh-CN";
    case "zh-CN":
      return "zh-CN";
    case "zh-Hans":
      return "zh-Hans";
    case "ja":
      return "ja";
    case "ko":
      return "ko";
    case "hi":
      return "hi";
    case "hy":
      return "hy";
    case "ru":
      return "ru";
    case "pa":
      return "pa";
    default: {
      const _exhaustive: never = locale;
      return _exhaustive;
    }
  }
}

/**
 * Servicios Live Launch Perfection ⚠️16 (2026-09-13) — reverse mapping for provider language
 * DETECTION output (Google `detectLanguage` codes). Exact allowlist codes pass through; region
 * tags collapse to their base (`es-419` → `es`, `en-US` → `en`, `pt-BR` → `pt`); any Chinese
 * variant maps to the Simplified route code; `und` and anything outside the allowlist → `unknown`.
 */
export function mapGoogleLanguageCodeToTranslateAdSourceLocale(code: string): TranslateAdSourceLocale {
  const raw = (code ?? "").trim();
  if (!raw) return "unknown";
  if (isValidTranslateAdSourceLocale(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower === "und") return "unknown";
  if (lower.startsWith("zh")) return "zh-CN";
  const base = lower.split(/[-_]/)[0] ?? "";
  return isValidTranslateAdSourceLocale(base) ? base : "unknown";
}

/** Preserve known source locales for cache keys; collapse unrecognized values to `unknown`. */
export function normalizeTranslateAdSourceLocale(
  sourceLocale: TranslateAdSourceLocale,
): TranslateAdSourceLocale {
  if (sourceLocale === "unknown") return "unknown";
  if (VALID_SOURCE_SET.has(sourceLocale)) {
    return sourceLocale;
  }
  return "unknown";
}

/**
 * Human-readable language names, spoken IN each language — used only to truthfully label the
 * shared Translate Ad control (e.g. "View original (Spanish)" / "Ver original (inglés)"). Never
 * used for translation payloads/provider calls. Locales outside this table (or "unknown") have no
 * entry on purpose: callers must fall back to a locale-less label rather than fabricate a name.
 */
const TRANSLATE_AD_LOCALE_NAME_IN_ENGLISH: Partial<Record<TranslateAdTargetLocale, string>> = {
  es: "Spanish",
  en: "English",
  vi: "Vietnamese",
  pt: "Portuguese",
  tl: "Tagalog",
  fil: "Filipino",
  km: "Khmer",
  zh: "Chinese",
  "zh-CN": "Chinese (Simplified)",
  "zh-Hans": "Chinese (Simplified)",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  hy: "Armenian",
  ru: "Russian",
  pa: "Punjabi",
};

const TRANSLATE_AD_LOCALE_NAME_IN_SPANISH: Partial<Record<TranslateAdTargetLocale, string>> = {
  es: "español",
  en: "inglés",
  vi: "vietnamita",
  pt: "portugués",
  tl: "tagalo",
  fil: "filipino",
  km: "jemer",
  zh: "chino",
  "zh-CN": "chino (simplificado)",
  "zh-Hans": "chino (simplificado)",
  ja: "japonés",
  ko: "coreano",
  hi: "hindi",
  hy: "armenio",
  ru: "ruso",
  pa: "panyabí",
};

/**
 * Name of `locale` as it would be said in `uiLocale`. Returns null for "unknown" or any locale
 * without a name on file — never guesses a language name. `uiLocale` values outside es/en (there
 * are none in current site chrome) fall back to the English name table.
 */
export function translateAdLocaleDisplayName(
  locale: TranslateAdSourceLocale,
  uiLocale: TranslateAdTargetLocale,
): string | null {
  if (locale === "unknown") return null;
  const table = uiLocale === "es" ? TRANSLATE_AD_LOCALE_NAME_IN_SPANISH : TRANSLATE_AD_LOCALE_NAME_IN_ENGLISH;
  return table[locale] ?? null;
}
