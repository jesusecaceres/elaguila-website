import {
  EN_VENTA_PUBLIC_LABEL,
  EN_VENTA_PUBLIC_PRO_LABEL,
  enVentaPublishInLabel,
  enVentaSearchPlaceholder,
} from "@/app/clasificados/en-venta/shared/constants/enVentaPublicLabels";

/** Defaults for `/clasificados/en-venta` hub — must match previous inline copy in `en-venta/page.tsx`. */
export const EN_VENTA_HUB_LANDING_DEFAULTS: {  es: Record<string, string>;
  en: Record<string, string>;
} = {
  es: {
    hero: EN_VENTA_PUBLIC_LABEL.es,
    sub: "Compra y vende con claridad, en un espacio pensado para presentar bien cada artículo.",
    premiumTagline: "Anuncios reales. Mejor presentación. Mayor confianza.",
    searchPh: enVentaSearchPlaceholder("es"),
    search: "Buscar",
    publish: enVentaPublishInLabel("es"),    lista: "Ver todos los anuncios →",
    trust: "Comunidad Leonix · anuncios moderados · contacto directo",
    badge: "CLASIFICADOS",
    socialProof:
      "Anuncios moderados por el equipo Leonix; compradores y vendedores reales (sin inventar inventario ni volumen).",
    cityPh: "Ciudad",
    categoriesTitle: "Explora por categoría",
    trust1Title: "Publica sin costo",
    trust1Sub: "Varios Pro incluido: más fotos, video y mejor presentación.",    trust2Title: "Transacciones seguras",
    trust2Sub: "Tu seguridad es nuestra prioridad",
    trust3Title: "Comunidad confiable",
    trust3Sub: "Personas reales, anuncios reales",
    bottomSellTitle: "¿Listo para vender algo?",
    bottomSellSub:
      "Fotos claras, categorías ordenadas y Varios Pro incluido para que tu artículo se vea y se encuentre.",    bottomSellCta: "Publicar ahora →",
    sellerTrust:
      "Particulares y negocios en el mismo marketplace: compra con criterio y vende con buena presentación.",
    sellerLinkInd: "Particular",
    sellerLinkBiz: "Negocio",
    handoff:
      "Entra por categoría o usa palabra clave y ciudad; en resultados filtra por vendedor, envío y más.",
    browseSectionLabel: "Atajos de exploración",
    browseChipNewest: "Últimas publicaciones",
    browseChipNear: "En tu zona",
    browseChipShip: "Con envío",
    browseChipFeatured: "Recién refrescados",    browseChipPickup: "Recogida local",
    exposureHint:
      "Los anuncios refrescados recientemente pueden aparecer arriba; el catálogo principal sigue por más recientes y no penaliza a particulares por defecto.",    mobileStickyPublish: "Publicar",
    mobileStickyBrowse: "Explorar",
  },
  en: {
    hero: "For Sale",
    sub: "Buy and sell with clarity—in a space designed to present every item well.",
    premiumTagline: "Real listings. Stronger presentation. More trust.",
    searchPh: "Search For Sale…",
    search: "Search",
    publish: "Post an item",
    lista: "Browse all listings →",
    trust: "Leonix community · moderated listings · direct contact",
    badge: "CLASSIFIEDS",
    socialProof:
      "Leonix-moderated listings; real buyers and sellers (we do not claim inventory counts we have not measured).",
    cityPh: "City",
    categoriesTitle: "Browse by category",
    trust1Title: "Post for free",
    trust1Sub: "Reach buyers and earn visibility when you choose Pro.",
    trust2Title: "Safer transactions",
    trust2Sub: "Your safety is our priority",
    trust3Title: "Trusted community",
    trust3Sub: "Real people, real listings",
    bottomSellTitle: "Ready to sell something?",
    bottomSellSub:
      "Clear photos, tidy categories, and Pro options so your listing looks sharp and gets found.",
    bottomSellCta: "Post now →",
    sellerTrust:
      "Individuals and businesses in one marketplace—buy with confidence, sell with polish.",
    sellerLinkInd: "Individual",
    sellerLinkBiz: "Business",
    handoff:
      "Start from a category or use keyword and city; on results, filter by seller, shipping, and more.",
    browseSectionLabel: "Browse shortcuts",
    browseChipNewest: "Latest listings",
    browseChipNear: "Near you",
    browseChipShip: "Shipping",
    browseChipFeatured: "Recently refreshed",    browseChipPickup: "Local pickup",
    exposureHint:
      "Pro listings with active renewed visibility may appear above the fold; the main catalog stays newest-first and does not bury private sellers by default.",
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
    title: `${EN_VENTA_PUBLIC_PRO_LABEL.es} — incluido sin costo`,
    subtitle:
      "Publica con más detalles, fotos y opciones de contacto. Sin pago. Sin comisión. Refresca tu anuncio para volver a subirlo entre los listados recientes.",
    freeTitle: "Gratis",
    freeDesc: "Ruta interna — no disponible en publicación pública.",
    proTitle: EN_VENTA_PUBLIC_PRO_LABEL.es,
    proDesc: "Anuncio Pro incluido sin costo: más fotos, video y mejor presentación.",    sfTitle: "Storefront",
    sfDesc: "Próximamente — perfil de tienda y capa de negocio para vendedores frecuentes.",
    back: "Todas las categorías",
    langToggle: "English",
    laneProBadge: "Incluido sin costo",
    laneSfEmoji: "🏪",
  },
  en: {
    title: `${EN_VENTA_PUBLIC_PRO_LABEL.en} — included at no charge`,
    subtitle:
      "Post with more details, photos, and contact options. No payment. No commission. Refresh your listing to move it back among recent listings.",
    freeTitle: "Free",
    freeDesc: "Internal route — not offered on the public publish path.",
    proTitle: EN_VENTA_PUBLIC_PRO_LABEL.en,
    proDesc: "Pro listing included at no charge: more photos, video, and stronger presentation.",    sfTitle: "Storefront",
    sfDesc: "Coming soon — store profile and business layer for frequent sellers.",
    back: "All categories",
    langToggle: "Español",
    laneProBadge: "Included at no charge",
    laneSfEmoji: "🏪",
  },
};

export function pickBilingual(
  lang: "es" | "en",
  defaults: { es: Record<string, string>; en: Record<string, string> },
  key: string
): string {
  return defaults[lang][key] ?? defaults.es[key] ?? "";
}
