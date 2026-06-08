/** @deprecated Prefer `@/app/lib/language` — re-exports for LANG-G1 call sites. */
export type LeonixSiteLang = import("./language").SupportedLang;

export {
  ACTIVE_ADDITIONAL_LANGUAGES,
  ADDITIONAL_LANGUAGES,
  DEFAULT_LANG,
  FUTURE_LANGUAGES,
  HELD_RTL_LANGUAGES,
  HELD_RTL_LANGUAGE_CODES,
  LANGUAGE_LABELS as LEONIX_LANG_LABELS,
  LANGUAGE_REGISTRY,
  LANGUAGE_SHORT as LEONIX_LANG_SHORT,
  MAGAZINE_HERO_CTAS as LEONIX_MAGAZINE_HERO_CTAS,
  PLANNED_NON_RTL_LANGUAGES,
  PLANNED_NON_RTL_LANGUAGE_CODES,
  PRIMARY_LANGUAGES,
  getLanguageDefinition,
  getLanguageDirection,
  getLanguageLabel,
  getLanguageNativeLabel,
  getProviderLanguageCode,
  heldLanguageNote,
  isActiveLanguage,
  isAdditionalLanguageActive,
  isHeldLanguage,
  isLanguageCode,
  isPlannedLanguage,
  languageAriaLabel as leonixLangAria,
  navCopyLang as leonixNavCopyLang,
  normalizeLang as resolveLeonixSiteLang,
  normalizeSelectableLang,
  replaceLangInHref as withLeonixLang,
  type FutureLanguage,
  type FutureLanguageCode,
  type HeldRtlLanguageCode,
  type LanguageCode,
  type LanguageDefinition,
  type LanguageDirection,
  type LanguageStatus,
  type PlannedNonRtlLanguageCode,
  type SupportedLang,
} from "./language";

import type { SupportedLang } from "./language";

/** @deprecated Use PRIMARY_LANGUAGES + ACTIVE_ADDITIONAL_LANGUAGES */
export const LEONIX_LANG_CODES: SupportedLang[] = ["es", "en", "vi"];
