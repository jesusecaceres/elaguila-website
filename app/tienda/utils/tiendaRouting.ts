import type { Lang } from "../types/tienda";

export function normalizeLang(raw: unknown): Lang {
  return raw === "en" ? "en" : "es";
}

export function businessCardConfigurePath(slug: string): string {
  return `/tienda/configure/business-cards/${slug}`;
}

export function withLang(href: string, lang: Lang): string {
  if (!href) return `?lang=${lang}`;
  if (href === "#") return "#";

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  if (!beforeHash) {
    return hash || `?lang=${lang}`;
  }

  const [path, query = ""] = beforeHash.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  const q = params.toString();
  const base = q ? `${path}?${q}` : path;
  return `${base}${hash}`;
}

