import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Gate CAT-STD-1 — category visual + copy tokens (UI only). */
export type CategoryStandardKey =
  | "en-venta"
  | "rentas"
  | "empleos"
  | "autos"
  | "bienes-raices"
  | "servicios"
  | "restaurantes"
  | "viajes"
  | "comunidad"
  | "clases"
  | "busco"
  | "mascotas-y-perdidos"
  | "iglesias";

export type CategoryStandardTheme = {
  gradient: string;
  accentBorder: string;
  markStroke: string;
};

export const CATEGORY_STANDARD_THEME: Record<CategoryStandardKey, CategoryStandardTheme> = {
  "en-venta": {
    gradient:
      "linear-gradient(135deg, rgba(201,168,74,0.14) 0%, rgba(250,246,238,0.95) 42%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#C9A84A]/40",
    markStroke: "#2A4536",
  },
  rentas: {
    gradient:
      "linear-gradient(135deg, rgba(90,120,100,0.12) 0%, rgba(250,246,238,0.92) 48%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#7A9A82]/35",
    markStroke: "#2A4536",
  },
  empleos: {
    gradient:
      "linear-gradient(135deg, rgba(61,90,115,0.1) 0%, rgba(250,246,238,0.94) 50%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#5B7C99]/30",
    markStroke: "#2A4536",
  },
  autos: {
    gradient:
      "linear-gradient(135deg, rgba(42,69,54,0.1) 0%, rgba(248,244,236,0.94) 52%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#2A4536]/25",
    markStroke: "#2A4536",
  },
  "bienes-raices": {
    gradient:
      "linear-gradient(135deg, rgba(122,30,44,0.06) 0%, rgba(250,246,238,0.94) 48%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#C9A84A]/38",
    markStroke: "#2A4536",
  },
  servicios: {
    gradient:
      "linear-gradient(135deg, rgba(85,107,62,0.12) 0%, rgba(250,246,238,0.94) 50%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#556B3E]/28",
    markStroke: "#2A4536",
  },
  restaurantes: {
    gradient:
      "linear-gradient(135deg, rgba(122,30,44,0.08) 0%, rgba(253,248,240,0.96) 55%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#C9A84A]/42",
    markStroke: "#2A4536",
  },
  viajes: {
    gradient:
      "linear-gradient(135deg, rgba(61,120,140,0.12) 0%, rgba(250,246,238,0.94) 48%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#5B8A9A]/32",
    markStroke: "#2A4536",
  },
  comunidad: {
    gradient:
      "linear-gradient(135deg, rgba(61,90,115,0.1) 0%, rgba(250,246,238,0.94) 50%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#5B7C99]/28",
    markStroke: "#2A4536",
  },
  clases: {
    gradient:
      "linear-gradient(135deg, rgba(169,140,42,0.12) 0%, rgba(250,246,238,0.94) 50%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#C9A84A]/35",
    markStroke: "#2A4536",
  },
  busco: {
    gradient:
      "linear-gradient(135deg, rgba(90,120,180,0.1) 0%, rgba(250,246,238,0.94) 50%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#7A8EB8]/30",
    markStroke: "#2A4536",
  },
  "mascotas-y-perdidos": {
    gradient:
      "linear-gradient(135deg, rgba(85,107,62,0.1) 0%, rgba(250,246,238,0.94) 50%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#556B3E]/28",
    markStroke: "#2A4536",
  },
  iglesias: {
    gradient:
      "linear-gradient(135deg, rgba(201,168,74,0.1) 0%, rgba(250,246,238,0.96) 55%, rgba(255,253,247,1) 100%)",
    accentBorder: "border-[#C9A84A]/35",
    markStroke: "#2A4536",
  },
};

export const CATEGORY_STANDARD_COPY: Record<
  CategoryStandardKey,
  { titleEs: string; titleEn: string; descEs: string; descEn: string }
> = {
  "en-venta": {
    titleEs: "Varios",
    titleEn: "Miscellaneous",
    descEs: "Compra, vende o regala artículos útiles dentro de tu comunidad.",
    descEn: "Buy, sell, or give useful items within your community.",
  },
  rentas: {
    titleEs: "Rentas",
    titleEn: "Rentals",
    descEs: "Encuentra cuartos, apartamentos, casas y espacios disponibles cerca de tu comunidad.",
    descEn: "Find rooms, apartments, homes, and spaces available near your community.",
  },
  empleos: {
    titleEs: "Empleos",
    titleEn: "Jobs",
    descEs: "Conecta oportunidades de trabajo con personas locales que buscan crecer.",
    descEn: "Connect job opportunities with local people looking to grow.",
  },
  autos: {
    titleEs: "Autos",
    titleEn: "Autos",
    descEs: "Compra y vende vehículos con información clara, ubicación y contacto directo.",
    descEn: "Buy and sell vehicles with clear information, location, and direct contact.",
  },
  "bienes-raices": {
    titleEs: "Bienes Raíces",
    titleEn: "Real Estate",
    descEs: "Explora propiedades, agentes y oportunidades inmobiliarias cerca de tu comunidad.",
    descEn: "Explore properties, agents, and real estate opportunities near your community.",
  },
  servicios: {
    titleEs: "Servicios",
    titleEn: "Services",
    descEs: "Encuentra profesionales confiables para hogares, negocios y proyectos locales.",
    descEn: "Find trusted professionals for homes, businesses, and local projects.",
  },
  restaurantes: {
    titleEs: "Restaurantes",
    titleEn: "Restaurants",
    descEs: "Descubre comida local, menús, antojos y lugares para visitar.",
    descEn: "Discover local food, menus, cravings, and places to visit.",
  },
  viajes: {
    titleEs: "Viajes",
    titleEn: "Travel",
    descEs: "Encuentra ofertas, agencias y recursos para planear tu próximo viaje.",
    descEn: "Find offers, agencies, and resources to plan your next trip.",
  },
  comunidad: {
    titleEs: "Comunidad y Eventos",
    titleEn: "Community & Events",
    descEs: "Encuentra actividades, reuniones, avisos y momentos que conectan a la comunidad.",
    descEn: "Find activities, gatherings, notices, and moments that connect the community.",
  },
  clases: {
    titleEs: "Clases",
    titleEn: "Classes",
    descEs: "Descubre cursos, talleres y oportunidades de aprendizaje para todas las edades.",
    descEn: "Discover courses, workshops, and learning opportunities for all ages.",
  },
  busco: {
    titleEs: "Busco / Se busca",
    titleEn: "Wanted / Looking for",
    descEs: "Publica necesidades, peticiones y búsquedas locales para conectar con ayuda real.",
    descEn: "Post needs, requests, and local searches to connect with real help.",
  },
  "mascotas-y-perdidos": {
    titleEs: "Mascotas y Perdidos",
    titleEn: "Pets & Lost",
    descEs: "Comparte mascotas, adopciones, objetos perdidos y apoyo comunitario.",
    descEn: "Share pets, adoptions, lost items, and community support.",
  },
  iglesias: {
    titleEs: "Iglesias",
    titleEn: "Churches",
    descEs: "Encuentra espacios de fe, comunidad y conexión espiritual.",
    descEn: "Find spaces for faith, community, and spiritual connection.",
  },
};

export function categoryStandardTitle(key: CategoryStandardKey, lang: Lang): string {
  const c = CATEGORY_STANDARD_COPY[key];
  return lang === "es" ? c.titleEs : c.titleEn;
}

export function categoryStandardDescription(key: CategoryStandardKey, lang: Lang): string {
  const c = CATEGORY_STANDARD_COPY[key];
  return lang === "es" ? c.descEs : c.descEn;
}

export const CATEGORY_STANDARD_UI = {
  es: {
    search: "Buscar",
    cityZip: "Ciudad o ZIP",
    moreFilters: "Más filtros",
    clearFilters: "Limpiar filtros",
    viewAll: "Ver todos los anuncios",
    postIn: (label: string) => `Publicar en ${label}`,
    results: "Resultados",
    back: "Volver",
    activeFilters: "Filtros activos",
    count: (n: number) => `${n} resultado${n === 1 ? "" : "s"}`,
  },
  en: {
    search: "Search",
    cityZip: "City or ZIP",
    moreFilters: "More filters",
    clearFilters: "Clear filters",
    viewAll: "View all listings",
    postIn: (label: string) => `Post in ${label}`,
    results: "Results",
    back: "Back",
    activeFilters: "Active filters",
    count: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
  },
} as const;

export function categoryStandardUi(lang: Lang) {
  return CATEGORY_STANDARD_UI[lang];
}

/** Shared page background for clasificados category surfaces */
export const CATEGORY_STANDARD_PAGE_BG =
  "min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]";

export const CATEGORY_STANDARD_MAIN =
  "relative mx-auto w-full max-w-6xl min-w-0 px-4 pt-20 sm:px-6 lg:px-8";
