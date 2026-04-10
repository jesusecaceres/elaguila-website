/** URL/query language for Autos Negocios application + preview (`?lang=es` | `?lang=en`). */

export type AutosNegociosLang = "es" | "en";

export function normalizeAutosNegociosLang(raw: string | null | undefined): AutosNegociosLang {
  return raw === "en" ? "en" : "es";
}

/** Merge `lang` into a path; preserves existing query (e.g. `demo=1`). */
export function withLangParam(path: string, lang: AutosNegociosLang): string {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");
  params.set("lang", lang);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : `${pathname}?lang=${lang}`;
}

/** Editor return link from preview: restores last explicit flush (`resume=1`), plus `lang`. */
export function withAutosEditorResumeFromPreview(path: string, lang: AutosNegociosLang): string {
  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");
  params.set("lang", lang);
  params.set("resume", "1");
  const qs = params.toString();
  return `${pathname}?${qs}`;
}
