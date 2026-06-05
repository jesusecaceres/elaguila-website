import { navCopyLang, normalizeLang, replaceLangInHref, type SupportedLang } from "@/app/lib/language";
import type { HubCategoryKey, Lang } from "../config/clasificadosHub";

export type { Lang };

/** Route lang for URLs (preserves es/en/vi). */
export function resolveRouteLang(raw: string | null | undefined): SupportedLang {
  return normalizeLang(raw);
}

/** Display copy lang for hub pages (vi → en chrome). */
export function resolveHubCopyLang(raw: string | null | undefined): Lang {
  return navCopyLang(normalizeLang(raw));
}

/** Append route lang to internal paths; preserves other query params. */
export function appendRouteLangToPath(path: string, raw: string | null | undefined): string {
  return replaceLangInHref(path, normalizeLang(raw));
}

/** Canonical path for each hub category (category-owned listing surface). */
export const HUB_CATEGORY_PATH: Record<HubCategoryKey, string> = {
  "en-venta": "/clasificados/en-venta",
  rentas: "/clasificados/rentas",
  "bienes-raices": "/clasificados/bienes-raices",
  autos: "/clasificados/autos",
  servicios: "/clasificados/servicios",
  empleos: "/clasificados/empleos",
  clases: "/clasificados/clases",
  comunidad: "/clasificados/comunidad",
  busco: "/clasificados/busco",
  "mascotas-y-perdidos": "/clasificados/mascotas-y-perdidos",
  restaurantes: "/clasificados/restaurantes",
  travel: "/clasificados/viajes",
};

/** Append `lang` to a path, preserving `#hash` if present. */
export function appendLangToPath(path: string, lang: Lang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

/** Hub → category landing (replaces old `/clasificados/lista?cat=`). */
export function buildHubCategoryPageUrl(cat: HubCategoryKey, lang: Lang): string {
  const base = HUB_CATEGORY_PATH[cat];
  return appendLangToPath(base, lang);
}

/**
 * Category browse URL with optional filters (GET query only; category pages own behavior).
 * `cat` must be a hub category key or a slug that maps to `/clasificados/{cat}`.
 */
export function buildCategoryBrowseUrl(
  cat: string,
  lang: Lang,
  extra?: Record<string, string | undefined>
): string {
  const path =
    cat in HUB_CATEGORY_PATH ? HUB_CATEGORY_PATH[cat as HubCategoryKey] : `/clasificados/${cat}`;
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && v !== "") sp.set(k, v);
    }
  }
  return `${path}?${sp.toString()}`;
}

/** Post-login redirect: category chooser first (`/clasificados/publicar`), not a single category slug. */
export function buildHubPostEntryHref(lang: Lang): string {
  return `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar?lang=${lang}`)}`;
}
