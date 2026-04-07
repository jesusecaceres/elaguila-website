import type { Lang } from "../types/tienda";
import type { TiendaOrderSource } from "../types/orderHandoff";
import { LEONIX_TIENDA_CONTACT_PATH } from "../data/leonixContact";

export function normalizeLang(raw: unknown): Lang {
  return raw === "en" ? "en" : "es";
}

export function businessCardConfigurePath(
  slug: string,
  opts?: { entry?: "template" | "custom" | "leo" | "refresh" }
): string {
  const base = `/tienda/configure/business-cards/${slug}`;
  if (!opts?.entry) return base;
  return `${base}?entry=${opts.entry}`;
}

export function businessCardLeoPath(slug: string): string {
  return `/tienda/configure/business-cards/leo/${slug}`;
}

export function businessCardUploadPath(slug: string): string {
  return `/tienda/configure/business-cards/upload/${slug}`;
}

export function printUploadConfigurePath(slug: string): string {
  return `/tienda/configure/print-upload/${slug}`;
}

export function tiendaOrderPath(source: TiendaOrderSource, slug: string): string {
  return `/tienda/order/${source}/${slug}`;
}

export function tiendaCheckoutPlaceholderPath(source: TiendaOrderSource, slug: string): string {
  return `/tienda/checkout/${source}/${slug}`;
}

/** Admin-managed catalog product detail (public). */
export function tiendaCatalogProductPath(slug: string): string {
  return `/tienda/catalog/${slug}`;
}

/** Tienda help / quotes / orders — not the global site contact page. */
export function tiendaPublicContactPath(): string {
  return LEONIX_TIENDA_CONTACT_PATH;
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

