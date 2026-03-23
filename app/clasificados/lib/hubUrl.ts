import type { HubCategoryKey, Lang } from "../config/clasificadosHub";

/** Append `lang` to a path, preserving `#hash` if present. */
export function appendLangToPath(path: string, lang: Lang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

export function buildHubCategoryListUrl(cat: HubCategoryKey, lang: Lang): string {
  return appendLangToPath(`/clasificados/lista?cat=${cat}`, lang);
}

export function buildHubListUrl(lang: Lang, cat?: HubCategoryKey): string {
  const base = "/clasificados/lista";
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  if (cat) sp.set("cat", cat);
  return `${base}?${sp.toString()}`;
}

export function buildHubPostEntryHref(lang: Lang): string {
  return `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar/bienes-raices?lang=${lang}`)}`;
}
