import type { BilingualPair } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";

/** Defaults for `/clasificados/en-venta` hub — must match previous inline copy in `en-venta/page.tsx`. */
export const EN_VENTA_HUB_LANDING_DEFAULTS: {
  es: Record<string, string>;
  en: Record<string, string>;
} = {
  es: {
    hero: "En Venta",
    sub: "Compra y vende artículos locales con claridad y confianza.",
    searchPh: "Buscar en En Venta…",
    search: "Buscar",
    publish: "Publicar artículo",
    lista: "Ver todos los anuncios",
    trust: "Comunidad Leonix · anuncios moderados · contacto directo",
  },
  en: {
    hero: "For Sale",
    sub: "Buy and sell local items with clarity and trust.",
    searchPh: "Search For Sale…",
    search: "Search",
    publish: "Post an item",
    lista: "Browse all listings",
    trust: "Leonix community · moderated listings · direct contact",
  },
};

/** Defaults for `/clasificados/publicar/en-venta` plan picker — match previous inline copy. */
export const EN_VENTA_PUBLISH_HUB_DEFAULTS: {
  es: Record<string, string>;
  en: Record<string, string>;
} = {
  es: {
    title: "En Venta — elige tu plan",
    subtitle:
      "Gratis para publicar rápido. Pro mejora un anuncio concreto. Storefront (próximamente) será para tiendas y presencia de vendedor.",
    freeTitle: "Gratis",
    freeDesc: "Listado básico y flujo corto. Ideal para ventas ocasionales.",
    proTitle: "Pro",
    proDesc: "Anuncio premium: más fotos, video y mejor presentación por listado.",
    sfTitle: "Storefront",
    sfDesc: "Próximamente — perfil de tienda y capa de negocio para vendedores frecuentes.",
    back: "Todas las categorías",
    langToggle: "English",
  },
  en: {
    title: "For sale — pick your lane",
    subtitle:
      "Free for quick posts. Pro upgrades a single listing. Storefront (coming soon) is for shop-style seller presence.",
    freeTitle: "Free",
    freeDesc: "Basic listing and a short flow. Best for occasional sellers.",
    proTitle: "Pro",
    proDesc: "Premium listing: more photos, video, and stronger presentation per ad.",
    sfTitle: "Storefront",
    sfDesc: "Coming soon — store profile and business layer for frequent sellers.",
    back: "All categories",
    langToggle: "Español",
  },
};

export function pickBilingual(
  lang: "es" | "en",
  defaults: { es: Record<string, string>; en: Record<string, string> },
  key: string
): string {
  return defaults[lang][key] ?? defaults.es[key] ?? "";
}
