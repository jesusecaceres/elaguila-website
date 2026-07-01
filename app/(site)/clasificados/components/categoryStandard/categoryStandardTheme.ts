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

export type CategoryStandardCopyEntry = {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  searchPhEs: string;
  searchPhEn: string;
  quickFiltersEs: readonly string[];
  quickFiltersEn: readonly string[];
};

export const CATEGORY_STANDARD_COPY: Record<CategoryStandardKey, CategoryStandardCopyEntry> = {
  "en-venta": {
    titleEs: "Varios",
    titleEn: "For Sale",
    descEs: "Compra, vende o regala artículos locales en tu comunidad.",
    descEn: "Buy, sell, or give local items in your community.",
    searchPhEs: "Buscar en En Venta…",
    searchPhEn: "Search For Sale…",
    quickFiltersEs: ["Electrónica", "Hogar", "Muebles", "Ropa", "Herramientas", "Gratis", "Recogida local"],
    quickFiltersEn: ["Electronics", "Home", "Furniture", "Clothing", "Tools", "Free", "Local pickup"],
  },
  rentas: {
    titleEs: "Rentas",
    titleEn: "Rentals",
    descEs: "Encuentra cuartos, apartamentos, espacios y oportunidades de vivienda.",
    descEn: "Find rooms, apartments, spaces, and housing opportunities.",
    searchPhEs: "Buscar rentas, ciudad o palabra clave…",
    searchPhEn: "Search rentals, city, or keyword…",
    quickFiltersEs: ["Cuarto", "Apartamento", "Casa", "Estudio", "Privado", "Negocio", "Mascotas"],
    quickFiltersEn: ["Room", "Apartment", "House", "Studio", "Private", "Business", "Pets OK"],
  },
  empleos: {
    titleEs: "Empleos",
    titleEn: "Jobs",
    descEs: "Oportunidades de trabajo y negocios que están contratando.",
    descEn: "Job opportunities and businesses that are hiring.",
    searchPhEs: "Buscar empleo, oficio o empresa…",
    searchPhEn: "Search jobs, trade, or company…",
    quickFiltersEs: ["Tiempo completo", "Medio tiempo", "Construcción", "Limpieza", "Cocina", "Ventas", "Oficio"],
    quickFiltersEn: ["Full-time", "Part-time", "Construction", "Cleaning", "Kitchen", "Sales", "Trade"],
  },
  autos: {
    titleEs: "Autos",
    titleEn: "Autos",
    descEs: "Autos privados, concesionarios y oportunidades de compra local.",
    descEn: "Private sellers, dealers, and local buying opportunities.",
    searchPhEs: "Buscar marca, modelo o palabra clave…",
    searchPhEn: "Search make, model, or keyword…",
    quickFiltersEs: ["Sedan", "SUV", "Camioneta", "Bajo millaje", "Económico", "Familiar", "Concesionario"],
    quickFiltersEn: ["Sedan", "SUV", "Truck", "Low mileage", "Economy", "Family", "Dealer"],
  },
  "bienes-raices": {
    titleEs: "Bienes Raíces",
    titleEn: "Real Estate",
    descEs: "Casas, propiedades, terrenos y oportunidades inmobiliarias.",
    descEn: "Homes, properties, land, and real estate opportunities.",
    searchPhEs: "Buscar propiedad, ciudad o zona…",
    searchPhEn: "Search property, city, or area…",
    quickFiltersEs: ["Venta", "Renta", "Casa", "Departamento", "Terreno", "Comercial", "Agente"],
    quickFiltersEn: ["Sale", "Rent", "House", "Condo", "Land", "Commercial", "Agent"],
  },
  servicios: {
    titleEs: "Servicios",
    titleEn: "Services",
    descEs: "Profesionales y servicios confiables cerca de ti.",
    descEn: "Trusted professionals and services near you.",
    searchPhEs: "Buscar servicio, oficio o negocio…",
    searchPhEn: "Search service, trade, or business…",
    quickFiltersEs: ["Hogar", "Limpieza", "Reparaciones", "Belleza", "Salud", "Legal", "Tecnología"],
    quickFiltersEn: ["Home", "Cleaning", "Repairs", "Beauty", "Health", "Legal", "Tech"],
  },
  restaurantes: {
    titleEs: "Restaurantes",
    titleEn: "Restaurants",
    descEs: "Comida local, menús, antojos y lugares para visitar.",
    descEn: "Local food, menus, cravings, and places to visit.",
    searchPhEs: "Buscar comida, restaurante o antojo…",
    searchPhEn: "Search food, restaurant, or craving…",
    quickFiltersEs: ["Mexicana", "Pupusas", "Tacos", "Mariscos", "Panadería", "Familiar", "Cerca de mí"],
    quickFiltersEn: ["Mexican", "Pupusas", "Tacos", "Seafood", "Bakery", "Family", "Near me"],
  },
  viajes: {
    titleEs: "Viajes",
    titleEn: "Travel",
    descEs: "Ofertas, agencias y recursos para planear tu próximo viaje.",
    descEn: "Offers, agencies, and resources to plan your next trip.",
    searchPhEs: "Buscar destino, agencia o paquete…",
    searchPhEn: "Search destination, agency, or package…",
    quickFiltersEs: ["Escapadas", "Tours", "Cruceros", "Familiar", "México", "Fin de semana", "Agencia"],
    quickFiltersEn: ["Getaways", "Tours", "Cruises", "Family", "Mexico", "Weekend", "Agency"],
  },
  comunidad: {
    titleEs: "Comunidad y Eventos",
    titleEn: "Community & Events",
    descEs: "Encuentra actividades, reuniones, avisos y momentos que conectan a la comunidad.",
    descEn: "Find activities, gatherings, notices, and moments that connect the community.",
    searchPhEs: "Buscar eventos, ayuda o avisos...",
    searchPhEn: "Search events, help, or notices...",
    quickFiltersEs: ["Eventos", "Ayuda", "Avisos", "Voluntariado", "Familias", "Comunidad", "Gratis"],
    quickFiltersEn: ["Events", "Help", "Notices", "Volunteering", "Families", "Community", "Free"],
  },
  clases: {
    titleEs: "Clases",
    titleEn: "Classes",
    descEs: "Cursos, talleres y aprendizaje comunitario para todas las edades.",
    descEn: "Courses, workshops, and community learning for all ages.",
    searchPhEs: "Buscar idiomas, música, tutoría...",
    searchPhEn: "Search languages, music, tutoring...",
    quickFiltersEs: ["Idiomas", "Música", "Tutoría", "Arte", "Computación", "Oficios", "Niños"],
    quickFiltersEn: ["Languages", "Music", "Tutoring", "Art", "Computers", "Trades", "Kids"],
  },
  busco: {
    titleEs: "Busco / Se busca",
    titleEn: "Wanted / Looking for",
    descEs: "Publica solicitudes para encontrar artículos, ayuda, recursos o algo específico que necesitas.",
    descEn: "Post requests to find items, help, resources, or something specific you need.",
    searchPhEs: "Buscar solicitudes o necesidades...",
    searchPhEn: "Search requests or needs...",
    quickFiltersEs: ["Necesito", "Busco trabajo", "Transporte", "Ayuda", "Recomendación", "Perdido", "Comunidad"],
    quickFiltersEn: ["Need", "Looking for work", "Transportation", "Help", "Recommendation", "Lost", "Community"],
  },
  "mascotas-y-perdidos": {
    titleEs: "Mascotas y Perdidos",
    titleEn: "Pets & Lost",
    descEs: "Avisos para mascotas perdidas o encontradas, adopciones y objetos perdidos.",
    descEn: "Notices for lost or found pets, adoptions, and lost items.",
    searchPhEs: "Buscar mascota, objeto o aviso...",
    searchPhEn: "Search pet, item, or notice...",
    quickFiltersEs: [
      "Mascota perdida",
      "Mascota encontrada",
      "Adopción",
      "Objeto perdido",
      "Objeto encontrado",
    ],
    quickFiltersEn: ["Lost pet", "Found pet", "Adoption", "Lost item", "Found item"],
  },
  iglesias: {
    titleEs: "Iglesias",
    titleEn: "Churches",
    descEs: "Encuentra espacios de fe, comunidad y conexión espiritual.",
    descEn: "Find spaces for faith, community, and spiritual connection.",
    searchPhEs: "Buscar iglesia, comunidad o ciudad…",
    searchPhEn: "Search church, community, or city…",
    quickFiltersEs: ["Servicios", "Comunidad", "Familias"],
    quickFiltersEn: ["Services", "Community", "Families"],
  },
};

export function categoryStandardSearchPlaceholder(key: CategoryStandardKey, lang: Lang): string {
  const c = CATEGORY_STANDARD_COPY[key];
  return lang === "es" ? c.searchPhEs : c.searchPhEn;
}

export function categoryStandardQuickFilters(key: CategoryStandardKey, lang: Lang): readonly string[] {
  const c = CATEGORY_STANDARD_COPY[key];
  return lang === "es" ? c.quickFiltersEs : c.quickFiltersEn;
}

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

/** Below global site Navbar from `(site)/layout` — do not nest a second Navbar. */
export const CATEGORY_STANDARD_MAIN =
  "relative mx-auto w-full max-w-[1080px] min-w-0 px-3.5 pb-12 pt-[calc(2.75rem+env(safe-area-inset-top,0px))] sm:px-4 sm:pt-6 lg:px-5 lg:pt-8";

/** Compact Leonix chip for category landing rails. */
export const CATEGORY_STANDARD_CHIP =
  "inline-flex h-[30px] max-w-full shrink-0 snap-start items-center rounded-md border border-[#C9A84A]/45 bg-[#FBF7EF] px-2.5 text-[11px] font-semibold leading-none text-[#3D3428] transition hover:border-[#C9A84A]/70 hover:bg-[#FFFDF7] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40 sm:text-xs";
