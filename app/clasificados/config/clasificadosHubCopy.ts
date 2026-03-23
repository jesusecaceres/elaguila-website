/**
 * Clasificados hub (/clasificados): UI strings and route fragments (per language).
 */

import type { Lang } from "./clasificadosHub";

const CLASIFICADOS_HUB_UI = {
  es: {
    pageTitle: "Clasificados",
    subtitle: "El mercado que construimos juntos, para nuestra comunidad.",

    authSignIn: "Iniciar sesión",
    authCreate: "Crear cuenta",

    ctaPost: "Publicar anuncio",
    ctaView: "Ver anuncios",
    ctaMemberships: "Membresías",
    ctaSeeOptions: "Ver opciones y precios",

    sectionBrowse: "Explorar por categoría",
    sectionFeatured: "Destacados por categoría",
    sectionFeaturedHint:
      "Una vista previa de anuncios destacados. Explora todo en la lista completa.",

    viewMore: "Ver más",

    cat: {
      rentas: { label: "Rentas", hint: "Casas, cuartos y propiedades." },
      "en-venta": { label: "En venta", hint: "Compra y vende local." },
      "bienes-raices": { label: "Bienes Raíces", hint: "Venta de propiedades e inmuebles." },
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

    membershipsTitle: "Membresías",
    membershipsSubtitle:
      "Opciones claras para personas y negocios. Elige la que mejor se adapta a cómo publicas y vendes.",

    personalHeading: "Personal",
    negociosHeading: "Negocios",

    freeTitle: "Gratis",
    freeBullets: [
      "7 días por anuncio; menos fotos; sin video",
      "Límite bajo de republicaciones",
      "Ideal para anuncios ocasionales",
    ] as const,

    proTitle: "LEONIX Pro",
    proBullets: [
      "Por anuncio: $9.99 (en venta), $24.99 (rentas/empleos)",
      "30 días por anuncio; más fotos y video",
      "Vistas, guardados, compartidos; 1 asistencia de visibilidad",
      "Formas de contacto (llamar o texto)",
    ] as const,

    standardTitle: "Standard",
    standardPrice: "$49 al mes",
    standardBullets: [
      "Perfil profesional para tu negocio",
      "Presencia por categoría",
      "Solo imágenes (sin video); contacto por llamada",
      "1 asistencia de visibilidad por anuncio activo / 30 días",
    ] as const,

    plusTitle: "Plus",
    plusPrice: "$125 al mes",
    plusBullets: [
      "Perfil premium para vender mejor",
      "Más formas de contacto (mensaje, email, videollamada, cotización)",
      "Mayor visibilidad y prioridad",
      "2 asistencias de visibilidad por anuncio activo / 30 días",
    ] as const,

    printTitle: "¿Quieres más exposición en revista?",
    printBody:
      "Los paquetes de revista y perfil premium se manejan por separado para proteger el valor de la edición impresa.",
    printCta: "Solicita el Media Kit",

    trustLine:
      "Un espacio confiable, familiar y comunitario. Los anuncios gratis siempre permanecen visibles en la búsqueda.",

    routePost: "/clasificados/publicar",
    routeList: "/clasificados/lista",
    routeMemberships: "/clasificados/membresias",
    routeLogin: "/clasificados/login",
    routeContacto: "/contacto",
  },
  en: {
    pageTitle: "Classifieds",
    subtitle: "The marketplace we build together, for our community.",

    authSignIn: "Sign in",
    authCreate: "Create account",

    ctaPost: "Post listing",
    ctaView: "View listings",
    ctaMemberships: "Memberships",
    ctaSeeOptions: "See options & pricing",

    sectionBrowse: "Browse by category",
    sectionFeatured: "Featured by category",
    sectionFeaturedHint:
      "A preview of featured listings. Browse everything in the full results.",

    viewMore: "View more",

    cat: {
      rentas: { label: "Rentals", hint: "Homes, rooms, and properties." },
      "en-venta": { label: "For sale", hint: "Buy and sell locally." },
      "bienes-raices": { label: "Real Estate", hint: "Properties and real estate for sale." },
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

    membershipsTitle: "Memberships",
    membershipsSubtitle:
      "Clear options for personal sellers and businesses. Choose the one that fits how you post and sell.",

    personalHeading: "Personal",
    negociosHeading: "Business",

    freeTitle: "Gratis",
    freeBullets: [
      "7 days per listing; fewer photos; no video",
      "Low repost limit",
      "Best for occasional posts",
    ] as const,

    proTitle: "LEONIX Pro",
    proBullets: [
      "Per listing: $9.99 (for sale), $24.99 (rentals/jobs)",
      "30 days per listing; more photos and video",
      "Views, saves, shares; 1 visibility assist",
      "Contact options (call or text)",
    ] as const,

    standardTitle: "Standard",
    standardPrice: "$49/month",
    standardBullets: [
      "Professional business profile",
      "Category presence",
      "Images only (no video); contact by call",
      "1 visibility assist per active listing / 30 days",
    ] as const,

    plusTitle: "Plus",
    plusPrice: "$125/month",
    plusBullets: [
      "Premium profile built to convert",
      "More contact options (message, email, video call, quote)",
      "More visibility and priority",
      "2 visibility assists per active listing / 30 days",
    ] as const,

    printTitle: "Want more exposure in print?",
    printBody:
      "Magazine packages and premium profile opportunities are handled separately to protect the value of print.",
    printCta: "Request the Media Kit",

    trustLine:
      "A trusted, family-safe, community-first marketplace. Free listings always remain visible in search.",

    routePost: "/clasificados/publicar",
    routeList: "/clasificados/lista",
    routeMemberships: "/clasificados/membresias",
    routeLogin: "/clasificados/login",
    routeContacto: "/contacto",
  },
} as const;

export function getClasificadosHubCopy(lang: Lang) {
  return CLASIFICADOS_HUB_UI[lang];
}
