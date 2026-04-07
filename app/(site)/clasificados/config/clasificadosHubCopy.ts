/**
 * Clasificados hub (/clasificados): UI strings (per language).
 */

import type { Lang } from "./clasificadosHub";

const CLASIFICADOS_HUB_UI = {
  es: {
    pageTitle: "Clasificados",
    subtitle: "El mercado que construimos juntos, para nuestra comunidad.",

    authSignIn: "Iniciar sesión",
    authCreate: "Crear cuenta",

    ctaPost: "Publicar anuncio",

    sectionBrowse: "Explorar por categoría",

    cat: {
      rentas: { label: "Rentas", hint: "Casas, cuartos y propiedades." },
      "bienes-raices": {
        label: "Bienes Raíces",
        hint: "Casas, departamentos, terrenos y espacios comerciales.",
      },
      "en-venta": { label: "En venta", hint: "Artículos nuevos y usados cerca de ti." },
      empleos: { label: "Empleos", hint: "Oportunidades cerca de ti." },
      servicios: {
        label: "Servicios",
        hint: "Profesionales y negocios confiables.",
      },
      autos: { label: "Autos", hint: "Autos y oferta de dealers." },
      clases: { label: "Clases", hint: "Aprende y comparte en comunidad." },
      comunidad: {
        label: "Comunidad",
        hint: "Actividades y anuncios comunitarios.",
      },
      restaurantes: {
        label: "Restaurantes",
        hint: "Opciones locales, menús y reseñas.",
      },
      travel: {
        label: "Viajes",
        hint: "Ofertas, agentes y rentas de carros.",
      },
    },

    trustLine:
      "Un espacio confiable, familiar y comunitario. Los anuncios gratis siempre permanecen visibles en la búsqueda.",

    routeLogin: "/clasificados/login",
    routeContacto: "/contacto",
  },
  en: {
    pageTitle: "Classifieds",
    subtitle: "The marketplace we build together, for our community.",

    authSignIn: "Sign in",
    authCreate: "Create account",

    ctaPost: "Post listing",

    sectionBrowse: "Browse by category",

    cat: {
      rentas: { label: "Rentals", hint: "Homes, rooms, and properties." },
      "bienes-raices": {
        label: "Real estate",
        hint: "Homes, condos, land, and commercial spaces.",
      },
      "en-venta": { label: "For sale", hint: "New and used goods near you." },
      empleos: { label: "Jobs", hint: "Opportunities near you." },
      servicios: { label: "Services", hint: "Trusted pros and businesses." },
      autos: { label: "Autos", hint: "Cars and dealer inventory." },
      clases: { label: "Classes", hint: "Learn and share with community." },
      comunidad: { label: "Community", hint: "Activities and community posts." },
      restaurantes: {
        label: "Restaurants",
        hint: "Local spots, menus, and reviews.",
      },
      travel: { label: "Travel", hint: "Deals, agents, and car rentals." },
    },

    trustLine:
      "A trusted, family-safe, community-first marketplace. Free listings always remain visible in search.",

    routeLogin: "/clasificados/login",
    routeContacto: "/contacto",
  },
} as const;

export function getClasificadosHubCopy(lang: Lang) {
  return CLASIFICADOS_HUB_UI[lang];
}
