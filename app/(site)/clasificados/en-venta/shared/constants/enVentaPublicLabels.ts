/**
 * Public display names for En Venta / Varios (internal slug `en-venta`).
 */

export const EN_VENTA_PUBLIC_LABEL = {
  es: "En Venta / Varios",
  en: "For Sale / Miscellaneous",
} as const;

export const EN_VENTA_PUBLIC_PRO_LABEL = {
  es: "En Venta / Varios Pro",
  en: "For Sale / Miscellaneous Pro",
} as const;

export function enVentaPublicLabel(lang: "es" | "en"): string {
  return EN_VENTA_PUBLIC_LABEL[lang];
}

export function enVentaPublicProLabel(lang: "es" | "en"): string {
  return EN_VENTA_PUBLIC_PRO_LABEL[lang];
}

/** e.g. "Publicar en En Venta / Varios" / "Post in For Sale / Miscellaneous" */
export function enVentaPublishInLabel(lang: "es" | "en"): string {
  return lang === "es" ? `Publicar en ${EN_VENTA_PUBLIC_LABEL.es}` : `Post in ${EN_VENTA_PUBLIC_LABEL.en}`;
}

/** e.g. "Buscar título, descripción, categoría…" */
export function enVentaSearchPlaceholder(lang: "es" | "en"): string {
  return lang === "es"
    ? "Buscar título, descripción, categoría…"
    : "Search title, description, category…";
}
