import type { ServiciosLang } from "../types/serviciosBusinessProfile";

export type PublicarCopy = {
  title: string;
  subtitle: string;
  nav: { id: string; label: string }[];
  saveHint: string;
  previewCta: string;
  previewOpen: string;
  publishReadiness: string;
  readyToPublish: string;
  notReady: string;
  missing: string;
  sections: {
    identity: string;
    hero: string;
    contact: string;
    quickFacts: string;
    about: string;
    services: string;
    gallery: string;
    trust: string;
    reviews: string;
    areas: string;
    promo: string;
    review: string;
  };
  labels: {
    businessName: string;
    slug: string;
    primaryCategory: string;
    subcategory: string;
    categoryLine: string;
    categoryLineHint: string;
    logoUrl: string;
    logoAlt: string;
    coverUrl: string;
    coverAlt: string;
    rating: string;
    reviewCount: string;
    locationSummary: string;
    phone: string;
    websiteUrl: string;
    websiteLabel: string;
    messageEnabled: string;
    hoursOpenNow: string;
    hoursToday: string;
    primaryCta: string;
    isFeatured: string;
    featuredLabel: string;
    aboutText: string;
    specialtiesLine: string;
    mapImageUrl: string;
    promoHeadline: string;
    promoFootnote: string;
    promoHref: string;
    addRow: string;
    remove: string;
    badgeKind: string;
    badgeLabel: string;
    qfKind: string;
    qfLabel: string;
    serviceTitle: string;
    serviceSecondary: string;
    serviceImage: string;
    serviceAlt: string;
    galleryUrl: string;
    galleryAlt: string;
    trustLabel: string;
    trustIcon: string;
    reviewAuthor: string;
    reviewQuote: string;
    reviewRating: string;
    reviewAvatar: string;
    areaLabel: string;
    areaKind: string;
  };
};

const es: PublicarCopy = {
  title: "Publicar perfil de servicios",
  subtitle: "Completa los datos de tu negocio. El borrador se guarda en este navegador; puedes previsualizar en cualquier momento.",
  nav: [
    { id: "section-identity", label: "Identidad" },
    { id: "section-hero", label: "Categoría y portada" },
    { id: "section-contact", label: "Contacto" },
    { id: "section-quick", label: "Datos rápidos" },
    { id: "section-about", label: "Acerca de" },
    { id: "section-services", label: "Servicios" },
    { id: "section-gallery", label: "Galería" },
    { id: "section-trust", label: "Confianza" },
    { id: "section-reviews", label: "Reseñas" },
    { id: "section-areas", label: "Zonas" },
    { id: "section-promo", label: "Oferta" },
    { id: "section-review", label: "Vista previa" },
  ],
  saveHint: "Borrador guardado automáticamente en este dispositivo.",
  previewCta: "Abrir vista previa pública",
  previewOpen: "Se abrirá en una pestaña nueva con el borrador actual.",
  publishReadiness: "Listo para publicar (mínimo)",
  readyToPublish: "Cumples los requisitos básicos para una futura publicación.",
  notReady: "Aún faltan campos mínimos (puedes seguir editando y previsualizar).",
  missing: "Falta",
  sections: {
    identity: "Identidad del negocio",
    hero: "Categoría y portada",
    contact: "Contacto y acciones",
    quickFacts: "Datos rápidos",
    about: "Acerca del negocio",
    services: "Servicios ofrecidos",
    gallery: "Galería / portafolio",
    trust: "Credenciales y confianza",
    reviews: "Reseñas y prueba social",
    areas: "Zonas de servicio",
    promo: "Oferta o cupón",
    review: "Revisar y previsualizar",
  },
  labels: {
    businessName: "Nombre comercial",
    slug: "Identificador URL (slug)",
    primaryCategory: "Categoría principal",
    subcategory: "Subcategoría",
    categoryLine: "Línea de categoría (opcional)",
    categoryLineHint: "Si la rellenas, sustituye a categoría + subcategoría.",
    logoUrl: "URL del logo",
    logoAlt: "Texto alternativo del logo",
    coverUrl: "URL de imagen de portada",
    coverAlt: "Texto alternativo de portada",
    rating: "Calificación (0–5)",
    reviewCount: "Número de reseñas",
    locationSummary: "Resumen de ubicación",
    phone: "Teléfono",
    websiteUrl: "Sitio web",
    websiteLabel: "Etiqueta del sitio web",
    messageEnabled: "Permitir mensaje / contacto",
    hoursOpenNow: "Etiqueta “abierto ahora”",
    hoursToday: "Horario de hoy",
    primaryCta: "Texto del botón principal",
    isFeatured: "Destacar negocio",
    featuredLabel: "Etiqueta de destacado",
    aboutText: "Descripción",
    specialtiesLine: "Especialidades (una línea)",
    mapImageUrl: "URL de imagen de mapa (opcional)",
    promoHeadline: "Titular de la oferta",
    promoFootnote: "Nota al pie",
    promoHref: "Enlace de la oferta",
    addRow: "Añadir",
    remove: "Quitar",
    badgeKind: "Tipo de insignia",
    badgeLabel: "Texto",
    qfKind: "Tipo",
    qfLabel: "Texto",
    serviceTitle: "Título",
    serviceSecondary: "Subtítulo",
    serviceImage: "URL de imagen",
    serviceAlt: "Texto alternativo",
    galleryUrl: "URL de imagen",
    galleryAlt: "Texto alternativo",
    trustLabel: "Etiqueta",
    trustIcon: "Icono",
    reviewAuthor: "Autor",
    reviewQuote: "Cita",
    reviewRating: "Calificación",
    reviewAvatar: "URL de avatar",
    areaLabel: "Zona",
    areaKind: "Tipo",
  },
};

const en: PublicarCopy = {
  title: "Publish services profile",
  subtitle: "Fill in your business details. Drafts save in this browser; you can preview anytime.",
  nav: [
    { id: "section-identity", label: "Identity" },
    { id: "section-hero", label: "Category & hero" },
    { id: "section-contact", label: "Contact" },
    { id: "section-quick", label: "Quick facts" },
    { id: "section-about", label: "About" },
    { id: "section-services", label: "Services" },
    { id: "section-gallery", label: "Gallery" },
    { id: "section-trust", label: "Trust" },
    { id: "section-reviews", label: "Reviews" },
    { id: "section-areas", label: "Areas" },
    { id: "section-promo", label: "Offer" },
    { id: "section-review", label: "Preview" },
  ],
  saveHint: "Draft auto-saved on this device.",
  previewCta: "Open public preview",
  previewOpen: "Opens in a new tab with your current draft.",
  publishReadiness: "Publish readiness (minimum)",
  readyToPublish: "You meet the basic bar for a future publish action.",
  notReady: "Some minimum fields are still missing (you can keep editing and preview).",
  missing: "Missing",
  sections: {
    identity: "Business identity",
    hero: "Category & hero",
    contact: "Contact & actions",
    quickFacts: "Quick facts",
    about: "About the business",
    services: "Services offered",
    gallery: "Gallery / portfolio",
    trust: "Trust & credentials",
    reviews: "Reviews & social proof",
    areas: "Service areas",
    promo: "Offer / coupon",
    review: "Review & preview",
  },
  labels: {
    businessName: "Business display name",
    slug: "URL slug",
    primaryCategory: "Primary category",
    subcategory: "Subcategory",
    categoryLine: "Category line (optional)",
    categoryLineHint: "When set, overrides primary + subcategory.",
    logoUrl: "Logo image URL",
    logoAlt: "Logo alt text",
    coverUrl: "Cover image URL",
    coverAlt: "Cover alt text",
    rating: "Rating (0–5)",
    reviewCount: "Review count",
    locationSummary: "Location summary",
    phone: "Phone",
    websiteUrl: "Website URL",
    websiteLabel: "Website label",
    messageEnabled: "Enable messaging / contact",
    hoursOpenNow: "“Open now” label",
    hoursToday: "Today’s hours line",
    primaryCta: "Primary button label",
    isFeatured: "Featured business",
    featuredLabel: "Featured label",
    aboutText: "Description",
    specialtiesLine: "Specialties (one line)",
    mapImageUrl: "Map image URL (optional)",
    promoHeadline: "Offer headline",
    promoFootnote: "Footnote",
    promoHref: "Offer link",
    addRow: "Add",
    remove: "Remove",
    badgeKind: "Badge kind",
    badgeLabel: "Label",
    qfKind: "Kind",
    qfLabel: "Label",
    serviceTitle: "Title",
    serviceSecondary: "Subtitle",
    serviceImage: "Image URL",
    serviceAlt: "Alt text",
    galleryUrl: "Image URL",
    galleryAlt: "Alt text",
    trustLabel: "Label",
    trustIcon: "Icon",
    reviewAuthor: "Author",
    reviewQuote: "Quote",
    reviewRating: "Rating",
    reviewAvatar: "Avatar URL",
    areaLabel: "Area",
    areaKind: "Kind",
  },
};

export function getPublicarCopy(lang: ServiciosLang): PublicarCopy {
  return lang === "en" ? en : es;
}
