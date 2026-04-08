/**
 * Sample travel business profiles — replace with API later.
 */

export type ViajesNegocioFeaturedOffer = {
  title: string;
  destination: string;
  priceHint: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

export type ViajesNegocioProfileModel = {
  slug: string;
  businessName: string;
  logoSrc?: string;
  logoAlt?: string;
  tagline: string;
  destinationsServed: string[];
  languages: string[];
  about: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;
  verifiedPlaceholder?: boolean;
  featuredOffers: ViajesNegocioFeaturedOffer[];
};

export const VIAJES_NEGOCIO_PROFILES: Record<string, ViajesNegocioProfileModel> = {
  "viajes-del-valle": {
    slug: "viajes-del-valle",
    businessName: "Viajes Del Valle",
    logoAlt: "Logo Viajes Del Valle",
    tagline: "Europa, Caribe y cruceros con planificación en español.",
    destinationsServed: ["Italia", "España", "Grecia", "Caribe", "México"],
    languages: ["Español", "Inglés", "Italiano básico"],
    about:
      "Agencia boutique en la Bahía con 12 años armando itinerarios a medida. Enfoque en parejas y familias que buscan claridad en precios y tiempos libres.",
    whatsapp: "+15550102030",
    phone: "+1 (555) 010-2030",
    email: "hola@viajesdelvalle.example",
    website: "https://example.com/viajes-del-valle",
    verifiedPlaceholder: true,
    featuredOffers: [
      {
        title: "Roma + Venecia express",
        destination: "Italia",
        priceHint: "Desde $2,150 / persona",
        href: "/clasificados/viajes/oferta/roma-venecia-express",
        imageSrc: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Italia",
      },
      {
        title: "Costa Amalfitana",
        destination: "Italia",
        priceHint: "Consultar",
        href: "/clasificados/viajes/resultados?dest=amalfi",
        imageSrc: "https://images.unsplash.com/photo-1533105071730-74b4a9efbdd1?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Costa Amalfitana",
      },
    ],
  },
  "pura-vida-escapes": {
    slug: "pura-vida-escapes",
    businessName: "Pura Vida Escapes",
    logoAlt: "Logo Pura Vida Escapes",
    tagline: "Costa Rica: naturaleza, familia y ritmo tico.",
    destinationsServed: ["San José", "Arenal", "Manuel Antonio", "Guanacaste"],
    languages: ["Español", "Inglés"],
    about:
      "Operadores locales que combinan hospedaje auténtico, transporte privado y guías certificados. Ideal para primera visita o regreso con niños.",
    whatsapp: "+50688881234",
    verifiedPlaceholder: false,
    featuredOffers: [
      {
        title: "Arenal + Manuel Antonio",
        destination: "Costa Rica",
        priceHint: "Desde $1,420 / persona",
        href: "/clasificados/viajes/oferta/cr-familia-arenal-manuel",
        imageSrc: "https://images.unsplash.com/photo-1592405204553-2e719cb02c48?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Costa Rica",
      },
    ],
  },
  "bay-travel-co": {
    slug: "bay-travel-co",
    businessName: "Bay Travel Co.",
    logoAlt: "Logo Bay Travel",
    tagline: "Escapadas NorCal y Sierra sin complicaciones.",
    destinationsServed: ["Lago Tahoe", "Yosemite", "Sonoma", "Santa Cruz"],
    languages: ["Español", "Inglés"],
    about:
      "Pequeño equipo que arma salidas de fin de semana y puente largo desde Oakland y SF. Tarifas transparentes y grupos reducidos.",
    email: "hola@baytravel.example",
    featuredOffers: [
      {
        title: "Tahoe fin de semana",
        destination: "CA / NV",
        priceHint: "$389 / persona",
        href: "/clasificados/viajes/oferta/tahoe-fin-semana",
        imageSrc: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
        imageAlt: "Lago Tahoe",
      },
    ],
  },
};

export const VIAJES_NEGOCIO_SLUGS = Object.keys(VIAJES_NEGOCIO_PROFILES);

export function getViajesNegocioProfileBySlug(slug: string): ViajesNegocioProfileModel | undefined {
  return VIAJES_NEGOCIO_PROFILES[slug];
}
