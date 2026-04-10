import type { BilingualPair } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";

/** Defaults for `/clasificados/en-venta` hub — must match previous inline copy in `en-venta/page.tsx`. */
export const EN_VENTA_HUB_LANDING_DEFAULTS: {
  es: Record<string, string>;
  en: Record<string, string>;
} = {
  es: {
    hero: "En Venta",
    sub: "Compra y vende artículos fácil y rápido en nuestra plataforma.",
    searchPh: "Buscar en En Venta…",
    search: "Buscar",
    publish: "Publicar artículo",
    lista: "Ver todos los anuncios →",
    trust: "Comunidad Leonix · anuncios moderados · contacto directo",
    badge: "CLASIFICADOS",
    socialProof: "Miles de artículos, personas reales, oportunidades todos los días.",
    cityPh: "Ciudad",
    categoriesTitle: "Explora por categoría",
    trust1Title: "Publica gratis",
    trust1Sub: "Llega a miles de compradores",
    trust2Title: "Transacciones seguras",
    trust2Sub: "Tu seguridad es nuestra prioridad",
    trust3Title: "Comunidad confiable",
    trust3Sub: "Personas reales, anuncios reales",
    bottomSellTitle: "¿Listo para vender algo?",
    bottomSellSub: "Publica tu artículo en minutos y llega a miles de personas.",
    bottomSellCta: "Publicar ahora →",
    sellerTrust: "Compra a particulares y a negocios. Publica como persona o como negocio.",
    sellerLinkInd: "Particular",
    sellerLinkBiz: "Negocio",
    handoff:
      "Busca por palabra clave, ciudad o categoría para explorar resultados filtrados.",
    browseChipNewest: "Más recientes",
    browseChipNear: "Cerca de ti",
    browseChipShip: "Envío disponible",
    browseChipFeatured: "Destacados",
    mobileStickyPublish: "Publicar",
    mobileStickyBrowse: "Explorar",
  },
  en: {
    hero: "For Sale",
    sub: "Buy and sell items easily and quickly on our marketplace.",
    searchPh: "Search For Sale…",
    search: "Search",
    publish: "Post an item",
    lista: "Browse all listings →",
    trust: "Leonix community · moderated listings · direct contact",
    badge: "CLASSIFIEDS",
    socialProof: "Thousands of listings, real people, new opportunities every day.",
    cityPh: "City",
    categoriesTitle: "Browse by category",
    trust1Title: "Post for free",
    trust1Sub: "Reach thousands of buyers",
    trust2Title: "Safer transactions",
    trust2Sub: "Your safety is our priority",
    trust3Title: "Trusted community",
    trust3Sub: "Real people, real listings",
    bottomSellTitle: "Ready to sell something?",
    bottomSellSub: "Publish in minutes and reach thousands of people.",
    bottomSellCta: "Post now →",
    sellerTrust: "Buy from individuals and businesses. Post as a person or as a business.",
    sellerLinkInd: "Individual",
    sellerLinkBiz: "Business",
    handoff: "Search by keyword, city, or category to explore filtered results.",
    browseChipNewest: "Latest",
    browseChipNear: "Near you",
    browseChipShip: "Shipping available",
    browseChipFeatured: "Featured",
    mobileStickyPublish: "Post",
    mobileStickyBrowse: "Browse",
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
