/** @deprecated Prefer `@/app/lib/language` — re-exports for LANG-G1 call sites. */
export type LeonixSiteLang = import("./language").SupportedLang;

export {
  ADDITIONAL_LANGUAGES,
  DEFAULT_LANG,
  FUTURE_LANGUAGES,
  LANGUAGE_LABELS as LEONIX_LANG_LABELS,
  LANGUAGE_SHORT as LEONIX_LANG_SHORT,
  MAGAZINE_HERO_CTAS as LEONIX_MAGAZINE_HERO_CTAS,
  PRIMARY_LANGUAGES,
  getLanguageLabel,
  languageAriaLabel as leonixLangAria,
  navCopyLang as leonixNavCopyLang,
  normalizeLang as resolveLeonixSiteLang,
  replaceLangInHref as withLeonixLang,
  type SupportedLang,
} from "./language";

import type { SupportedLang } from "./language";

/** @deprecated Use PRIMARY_LANGUAGES + ADDITIONAL_LANGUAGES */
export const LEONIX_LANG_CODES: SupportedLang[] = ["es", "en", "vi"];
