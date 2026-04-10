import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type BrLandingCopy = {
  navClasificados: string;
  navBreadcrumbCurrent: string;
  categoryEyebrow: string;
  pageTitle: string;
  heroSubtitle: string;
  publishEyebrow: string;
  publishPrivado: string;
  publishNegocio: string;
  searchKeywordLabel: string;
  searchKeywordPlaceholder: string;
  searchOperationLabel: string;
  searchOperationAny: string;
  searchOperationSale: string;
  searchOperationRent: string;
  searchPropertyLabel: string;
  searchPropertyPlaceholder: string;
  searchPropertyHouse: string;
  searchPropertyApartment: string;
  searchPropertyLand: string;
  searchPropertyCommercial: string;
  searchCityLabel: string;
  searchCityPlaceholder: string;
  searchSubmit: string;
  quickFiltersHeading: string;
  chipLabel: Record<
    "sale" | "rent" | "house" | "apartment" | "land" | "private" | "business" | "pool" | "pets" | "furnished",
    string
  >;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredCtaProperties: string;
  featuredCtaExplore: string;
  sectionDestacadasTitle: string;
  sectionDestacadasSubtitle: string;
  sectionRecientesTitle: string;
  sectionRecientesSubtitle: string;
  sectionPrivadoTitle: string;
  sectionPrivadoSubtitle: string;
  sectionNegociosTitle: string;
  sectionNegociosSubtitle: string;
  bandMoreInResults: string;
  footerTitle: string;
  footerBody: string;
  footerCtaExploreAll: string;
  footerCtaPublish: string;
  footerTrustLine: string;
  sellerPrivado: string;
  sellerNegocio: string;
  mapSoftView: string;
  mapLocation: string;
  mapArea: string;
  mapZoom: string;
  mapHint: string;
  mapAriaCluster: string;
};

const ES: BrLandingCopy = {
  navClasificados: "Clasificados",
  navBreadcrumbCurrent: "Bienes Raíces",
  categoryEyebrow: "Leonix Clasificados",
  pageTitle: "Bienes Raíces",
  heroSubtitle:
    "Encuentra propiedades en venta o renta con claridad y confianza. Un solo lugar para particulares y profesionales.",
  publishEyebrow: "Publicar",
  publishPrivado: "Publicar como Privado",
  publishNegocio: "Publicar como Negocio",
  searchKeywordLabel: "Ubicación o palabras clave",
  searchKeywordPlaceholder: "Ej. Cumbres, San Pedro, centro…",
  searchOperationLabel: "Operación",
  searchOperationAny: "Venta o renta",
  searchOperationSale: "Venta",
  searchOperationRent: "Renta",
  searchPropertyLabel: "Tipo de propiedad",
  searchPropertyPlaceholder: "Seleccionar",
  searchPropertyHouse: "Casa",
  searchPropertyApartment: "Departamento",
  searchPropertyLand: "Terreno",
  searchPropertyCommercial: "Comercial",
  searchCityLabel: "Ciudad o zona",
  searchCityPlaceholder: "Ej. Monterrey",
  searchSubmit: "Buscar",
  quickFiltersHeading: "Filtros rápidos",
  chipLabel: {
    sale: "Venta",
    rent: "Renta",
    house: "Casa",
    apartment: "Departamento",
    land: "Terreno",
    private: "Privado",
    business: "Negocio",
    pool: "Piscina",
    pets: "Mascotas",
    furnished: "Amueblado",
  },
  featuredTitle: "Propiedad destacada",
  featuredSubtitle:
    "Ejemplo editorial de inventario premium — misma estructura que usarán las fichas publicadas.",
  featuredCtaProperties: "Ver propiedades",
  featuredCtaExplore: "Explorar resultados",
  sectionDestacadasTitle: "Destacadas",
  sectionDestacadasSubtitle:
    "Mayor vitrina para anuncios con señales de confianza — sin ocultar el ecosistema completo.",
  sectionRecientesTitle: "Recientes",
  sectionRecientesSubtitle: "Mezcla representativa de lo que llega al marketplace (demo).",
  sectionPrivadoTitle: "Privado",
  sectionPrivadoSubtitle: "Particulares con visibilidad clara y trato directo.",
  sectionNegociosTitle: "Negocios",
  sectionNegociosSubtitle:
    "Inmobiliarias, agentes y desarrolladores — merchandising premium dentro del mismo sitio.",
  bandMoreInResults: "Ver más en resultados",
  footerTitle: "¿Listo para el siguiente paso?",
  footerBody:
    "Explora todo el inventario con filtros claros, o publica con el flujo que mejor se adapte a ti — particular o negocio — sin salir de Leonix.",
  footerCtaExploreAll: "Explorar todas las propiedades",
  footerCtaPublish: "Publicar tu propiedad",
  footerTrustLine: "Leonix Clasificados · Anuncios moderados · Contacto directo entre partes",
  sellerPrivado: "Privado",
  sellerNegocio: "Negocio",
  mapSoftView: "Vista suave",
  mapLocation: "Monterrey, NL",
  mapArea: "Área",
  mapZoom: "Acercar",
  mapHint: "Solo se muestran pocos puntos · sin “millón de pins”",
  mapAriaCluster: "38 anuncios en la zona. Acercar mapa.",
};

const EN: BrLandingCopy = {
  navClasificados: "Classifieds",
  navBreadcrumbCurrent: "Real estate",
  categoryEyebrow: "Leonix Classifieds",
  pageTitle: "Real estate",
  heroSubtitle:
    "Find properties for sale or rent with clarity and confidence. One place for private sellers and professionals.",
  publishEyebrow: "Post a listing",
  publishPrivado: "Post as a private seller",
  publishNegocio: "Post as a business",
  searchKeywordLabel: "Location or keywords",
  searchKeywordPlaceholder: "e.g. Cumbres, San Pedro, downtown…",
  searchOperationLabel: "Transaction",
  searchOperationAny: "Sale or rent",
  searchOperationSale: "Sale",
  searchOperationRent: "Rent",
  searchPropertyLabel: "Property type",
  searchPropertyPlaceholder: "Choose",
  searchPropertyHouse: "House",
  searchPropertyApartment: "Apartment",
  searchPropertyLand: "Land",
  searchPropertyCommercial: "Commercial",
  searchCityLabel: "City or area",
  searchCityPlaceholder: "e.g. Monterrey",
  searchSubmit: "Search",
  quickFiltersHeading: "Quick filters",
  chipLabel: {
    sale: "Sale",
    rent: "Rent",
    house: "House",
    apartment: "Apartment",
    land: "Land",
    private: "Private",
    business: "Business",
    pool: "Pool",
    pets: "Pets allowed",
    furnished: "Furnished",
  },
  featuredTitle: "Featured property",
  featuredSubtitle:
    "Editorial-style premium inventory preview — the same structure published listings will use.",
  featuredCtaProperties: "View properties",
  featuredCtaExplore: "Browse results",
  sectionDestacadasTitle: "Featured",
  sectionDestacadasSubtitle:
    "Stronger showcase for listings with trust signals — without hiding the full marketplace.",
  sectionRecientesTitle: "Recent",
  sectionRecientesSubtitle: "A representative mix of what’s arriving on the marketplace (demo).",
  sectionPrivadoTitle: "Private",
  sectionPrivadoSubtitle: "Private sellers with clear visibility and direct contact.",
  sectionNegociosTitle: "Businesses",
  sectionNegociosSubtitle:
    "Brokerages, agents, and developers — premium merchandising within the same experience.",
  bandMoreInResults: "See more in results",
  footerTitle: "Ready for the next step?",
  footerBody:
    "Browse the full inventory with clear filters, or publish with the flow that fits you best — private or business — without leaving Leonix.",
  footerCtaExploreAll: "Explore all properties",
  footerCtaPublish: "Post your property",
  footerTrustLine: "Leonix Classifieds · Moderated listings · Direct contact between parties",
  sellerPrivado: "Private",
  sellerNegocio: "Business",
  mapSoftView: "Soft view",
  mapLocation: "Monterrey, NL",
  mapArea: "Area",
  mapZoom: "Zoom in",
  mapHint: "Only a few pins · no “million markers” clutter",
  mapAriaCluster: "38 listings in this area. Zoom map in.",
};

export function getBrLandingCopy(lang: Lang): BrLandingCopy {
  return lang === "en" ? EN : ES;
}
