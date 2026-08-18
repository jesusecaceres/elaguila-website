import type { RecursosLang } from "./types";

/**
 * Centralized bilingual copy for the public `/recursos-comunitarios` page.
 * Keep literal ES/EN strings out of components — read from here instead.
 */
export const RECURSOS_PAGE_COPY = {
  es: {
    // LEONIX CERCA DE TI — new community-help hub intro
    brandEyebrow: "LEONIX CERCA DE TI",
    heroQuestion: "¿Qué necesitas hoy?",
    heroSupport: "Ayuda real. Cerca de casa.",
    categoriesIntro:
      "Estas son las categorías permanentes del directorio de ayuda comunitaria de Leonix.",
    categoriesComingSoonNote:
      "El directorio completo con organizaciones verificadas llega en una próxima etapa.",

    // Legacy hero (existing classifieds-backed lanes)
    eyebrow: "LEONIX RECURSOS COMUNITARIOS",
    title: "Recursos Comunitarios",
    subtitle: "Conecta con eventos, clases, iglesias y apoyo local para nuestra comunidad.",
    description:
      "Encuentra espacios comunitarios, actividades, aprendizaje, ayuda y conexiones locales en un solo lugar. Esta sección reúne recursos útiles para familias, organizaciones y vecinos.",
    ctaExplore: "Explorar recursos",
    ctaPost: "Publicar recurso",
    sectionLanes: "Explorar por recurso",
    explore: "EXPLORAR",
    searchEyebrow: "BÚSQUEDA COMUNITARIA",
    searchTitle: "Busca recursos por tema, ciudad o necesidad",
    searchDescription:
      "Muy pronto cada categoría tendrá una búsqueda clara con filtros consistentes para encontrar recursos, anuncios y oportunidades locales con menos pasos.",
    searchPlaceholder: "Buscar recurso, evento, clase o ayuda...",
    locationPlaceholder: "Ciudad o ZIP",
    searchButton: "Buscar",
    searchPreviewNote: "Vista previa visual — la búsqueda estará disponible pronto en cada categoría.",
    filterEventos: "Eventos",
    filterClases: "Clases",
    filterIglesias: "Iglesias",
    filterAyuda: "Ayuda",
    filterMascotas: "Mascotas",
    filterSolicitudes: "Solicitudes",
    promoTitle: "¿Tienes un recurso para compartir?",
    promoDescription:
      "Publica eventos, clases, ayuda comunitaria o información útil para que más personas puedan encontrarla.",
    promoButton: "Publicar recurso",
  },
  en: {
    brandEyebrow: "LEONIX NEAR YOU",
    heroQuestion: "What do you need today?",
    heroSupport: "Real help. Close to home.",
    categoriesIntro: "These are the permanent categories of the Leonix community-help directory.",
    categoriesComingSoonNote: "The full directory with verified organizations is coming in a future stage.",

    eyebrow: "LEONIX COMMUNITY RESOURCES",
    title: "Community Resources",
    subtitle: "Connect with events, classes, churches, and local support for our community.",
    description:
      "Find community spaces, activities, learning, support, and local connections in one place. This section brings together useful resources for families, organizations, and neighbors.",
    ctaExplore: "Explore resources",
    ctaPost: "Post resource",
    sectionLanes: "Explore by resource",
    explore: "EXPLORE",
    searchEyebrow: "COMMUNITY SEARCH",
    searchTitle: "Search resources by topic, city, or need",
    searchDescription:
      "Soon each category will use a clear search experience with consistent filters to find resources, listings, and local opportunities with fewer steps.",
    searchPlaceholder: "Search resource, event, class, or help...",
    locationPlaceholder: "City or ZIP",
    searchButton: "Search",
    searchPreviewNote: "Visual preview — search will be available soon in each category.",
    filterEventos: "Events",
    filterClases: "Classes",
    filterIglesias: "Churches",
    filterAyuda: "Help",
    filterMascotas: "Pets",
    filterSolicitudes: "Requests",
    promoTitle: "Have a resource to share?",
    promoDescription:
      "Post events, classes, community help, or useful information so more people can find it.",
    promoButton: "Post resource",
  },
} as const;

export type RecursosPageCopy = (typeof RECURSOS_PAGE_COPY)[RecursosLang];

export function getRecursosPageCopy(lang: RecursosLang): RecursosPageCopy {
  return RECURSOS_PAGE_COPY[lang];
}
