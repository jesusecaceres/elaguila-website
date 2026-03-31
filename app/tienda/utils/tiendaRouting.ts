import type { Lang } from "../types/tienda";

export function normalizeLang(raw: unknown): Lang {
  return raw === "en" ? "en" : "es";
}

export function withLang(href: string, lang: Lang): string {
  if (!href) return `?lang=${lang}`;
  if (href === "#") return "#";
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

