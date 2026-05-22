/**
 * Public display names for En Venta (internal slug `en-venta`).
 * Spanish: Varios — English: For Sale (not "Various").
 */

export const EN_VENTA_PUBLIC_LABEL = {
  es: "Varios",
  en: "For Sale",
} as const;

export const EN_VENTA_PUBLIC_PRO_LABEL = {
  es: "Varios Pro",
  en: "For Sale Pro",
} as const;

export function enVentaPublicLabel(lang: "es" | "en"): string {
  return EN_VENTA_PUBLIC_LABEL[lang];
}

export function enVentaPublicProLabel(lang: "es" | "en"): string {
  return EN_VENTA_PUBLIC_PRO_LABEL[lang];
}

/** e.g. "Publicar en Varios" / "Post in For Sale" */
export function enVentaPublishInLabel(lang: "es" | "en"): string {
  return lang === "es" ? `Publicar en ${EN_VENTA_PUBLIC_LABEL.es}` : `Post in ${EN_VENTA_PUBLIC_LABEL.en}`;
}

/** e.g. "Buscar en Varios…" */
export function enVentaSearchPlaceholder(lang: "es" | "en"): string {
  return lang === "es" ? `Buscar en ${EN_VENTA_PUBLIC_LABEL.es}…` : `Search ${EN_VENTA_PUBLIC_LABEL.en}…`;
}
