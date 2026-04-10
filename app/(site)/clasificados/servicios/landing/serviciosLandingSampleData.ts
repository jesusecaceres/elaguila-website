/**
 * Blueprint sample data for `/clasificados/servicios`.
 * Shape mirrors future API rows so arrays can be swapped without layout changes.
 */

export type ServiciosLandingCtaKind = "call" | "detail";

export type ServiciosLandingFeaturedBusiness = {
  id: string;
  businessName: string;
  categoryKey: string;
  categoryLabelEs: string;
  city: string;
  zipOrArea: string;
  coverImageSrc: string;
  coverImageAlt: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  cta: {
    kind: ServiciosLandingCtaKind;
    labelEs: string;
    /** Future: listing slug for detail */
    detailHref?: string;
    telHref?: string;
  };
};

export type ServiciosQuickChip = {
  id: string;
  labelEs: string;
  /** Maps to `group` on `/clasificados/servicios/resultados` where applicable */
  resultsGroup?: string;
};

export type ServiciosLandingExploreCategory = {
  id: string;
  labelEs: string;
  icon: string;
  resultsGroup?: string;
};

export type ServiciosLandingRecentListing = {
  id: string;
  serviceTitleEs: string;
  businessNameEs: string;
  descriptionEs: string;
  coverImageSrc: string;
  coverImageAlt: string;
  rating: number;
  /** Shell hint for future seller mapping — independiente vs negocio balance on landing */
  sellerPresentation?: "business" | "independent";
  cta: {
    kind: ServiciosLandingCtaKind;
    labelEs: string;
    telHref?: string;
    detailHref?: string;
  };
};

export const SERVICIOS_LANDING_QUICK_CHIPS: ServiciosQuickChip[] = [
  { id: "plomeria", labelEs: "Plomería", resultsGroup: "home_trade" },
  { id: "electricista", labelEs: "Electricista", resultsGroup: "home_trade" },
  { id: "roof", labelEs: "Roofiero", resultsGroup: "home_trade" },
  { id: "limpieza", labelEs: "Limpieza", resultsGroup: "cleaning" },
  { id: "jardineria", labelEs: "Jardinería", resultsGroup: "home_trade" },
  { id: "tutoria", labelEs: "Tutoría", resultsGroup: "education" },
  { id: "auto", labelEs: "Reparación Auto", resultsGroup: "automotive" },
  { id: "more", labelEs: "Ver más" },
];

export const SERVICIOS_LANDING_EXPLORE_CATEGORIES: ServiciosLandingExploreCategory[] = [
  { id: "plomeria", labelEs: "Plomería", icon: "🔧", resultsGroup: "home_trade" },
  { id: "electricista", labelEs: "Electricista", icon: "⚡", resultsGroup: "home_trade" },
  { id: "roof", labelEs: "Roofiero", icon: "🏠", resultsGroup: "home_trade" },
  { id: "limpieza", labelEs: "Limpieza", icon: "✨", resultsGroup: "cleaning" },
  { id: "reparacion-auto", labelEs: "Reparación Auto", icon: "🚗", resultsGroup: "automotive" },
  { id: "tutoria", labelEs: "Tutoría", icon: "📚", resultsGroup: "education" },
  { id: "jardineria", labelEs: "Jardinería", icon: "🌿", resultsGroup: "home_trade" },
];

export const SERVICIOS_LANDING_FEATURED: ServiciosLandingFeaturedBusiness[] = [
  {
    id: "fb-1",
    businessName: "Soluciones Eléctricas Bay Area",
    categoryKey: "home_trade",
    categoryLabelEs: "Electricidad residencial",
    city: "San José",
    zipOrArea: "95112",
    coverImageSrc:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80",
    coverImageAlt: "Electricista revisando panel eléctrico",
    rating: 4.8,
    reviewCount: 126,
    featured: true,
    cta: {
      kind: "call",
      labelEs: "Llamar",
      telHref: "tel:+14085550123",
    },
  },
  {
    id: "fb-2",
    businessName: "Fontanería Express 24h",
    categoryKey: "home_trade",
    categoryLabelEs: "Plomería y fugas",
    city: "Fremont",
    zipOrArea: "94536",
    coverImageSrc:
      "https://images.unsplash.com/photo-1585704032915-c3400ca88ae2?auto=format&fit=crop&w=900&q=80",
    coverImageAlt: "Plomero trabajando en instalación de tuberías",
    rating: 4.9,
    reviewCount: 89,
    featured: true,
    cta: {
      kind: "detail",
      labelEs: "Ver más",
      detailHref: "/clasificados/servicios/resultados",
    },
  },
  {
    id: "fb-3",
    businessName: "Limpieza Pro Hogar",
    categoryKey: "cleaning",
    categoryLabelEs: "Limpieza profunda",
    city: "Oakland",
    zipOrArea: "94607",
    coverImageSrc:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    coverImageAlt: "Profesional de limpieza en hogar",
    rating: 4.7,
    reviewCount: 204,
    featured: true,
    cta: {
      kind: "call",
      labelEs: "Llamar",
      telHref: "tel:+15105550987",
    },
  },
];

export const SERVICIOS_LANDING_RECENT: ServiciosLandingRecentListing[] = [
  {
    id: "rc-1",
    serviceTitleEs: "Reparación de PC y redes",
    businessNameEs: "TechHelp Local",
    descriptionEs: "Diagnóstico, upgrades y soporte remoto el mismo día en el Área de la Bahía.",
    coverImageSrc:
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80",
    coverImageAlt: "Técnico reparando computadora",
    rating: 4.6,
    sellerPresentation: "independent",
    cta: { kind: "detail", labelEs: "Ver más", detailHref: "/clasificados/servicios/resultados" },
  },
  {
    id: "rc-2",
    serviceTitleEs: "Clases de inglés para negocios",
    businessNameEs: "Bridge Language Studio",
    descriptionEs: "Sesiones híbridas, material bilingüe y enfoque en presentaciones profesionales.",
    coverImageSrc:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    coverImageAlt: "Tutoría y estudio",
    rating: 4.9,
    sellerPresentation: "business",
    cta: { kind: "call", labelEs: "Llamar", telHref: "tel:+16505550111" },
  },
  {
    id: "rc-3",
    serviceTitleEs: "Cerrajería de urgencia",
    businessNameEs: "Llaves & Seguridad 7/7",
    descriptionEs: "Apertura, cambio de cerraduras y copias móviles con llegada en menos de 45 min.",
    coverImageSrc:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
    coverImageAlt: "Cerrajero con herramientas",
    rating: 4.5,
    sellerPresentation: "business",
    cta: { kind: "detail", labelEs: "Ver más", detailHref: "/clasificados/servicios/resultados" },
  },
];
