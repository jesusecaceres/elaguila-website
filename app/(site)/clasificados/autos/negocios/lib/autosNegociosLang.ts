/** URL/query language for Autos publish application + preview. */

import { navCopyLang, normalizeLang, resolveRouteLang, withLang, type SupportedLang } from "@/app/lib/language";

export type AutosNegociosLang = "es" | "en";

/** Client route lang — URL → cookie → default; preserves all SupportedLang in hrefs. */
export function resolveAutosRouteLang(raw: string | null | undefined): SupportedLang {
  return resolveRouteLang(raw);
}

/** UI copy lang (ES/EN fallback). */
export function normalizeAutosNegociosLang(raw: string | null | undefined): AutosNegociosLang {
  return navCopyLang(normalizeLang(raw));
}

/** Merge `lang` into a path; preserves existing query (e.g. `demo=1`). */
export function withLangParam(path: string, lang: SupportedLang): string {
  return withLang(path, lang);
}

/** Editor return link from preview: restores last explicit flush (`resume=1`), plus `lang`. */
export function withAutosEditorResumeFromPreview(path: string, lang: SupportedLang): string {
  return withLang(path, lang, { resume: "1" });
}
