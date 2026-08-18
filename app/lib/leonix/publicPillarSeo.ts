import type { Metadata } from "next";
import type { SupportedLang } from "@/app/lib/language";
import { LEONIX_MEDIA_SITE_NAME, LEONIX_SITE_ORIGIN, leonixPageTitle } from "@/app/lib/leonixBrand";

export type PublicPillarId =
  | "home"
  | "noticias"
  | "magazine"
  | "clasificados"
  | "negocios-locales"
  | "recursos-comunitarios"
  | "viajes"
  | "iglesias"
  | "productos-promocion";

type PillarSeoCopy = {
  title: string;
  description: string;
  schemaName: string;
};

export const PUBLIC_PILLAR_PATH: Record<PublicPillarId, string> = {
  home: "/home",
  noticias: "/noticias",
  magazine: "/magazine",
  clasificados: "/clasificados",
  "negocios-locales": "/negocios-locales",
  "recursos-comunitarios": "/recursos-comunitarios",
  viajes: "/clasificados/viajes",
  iglesias: "/iglesias",
  "productos-promocion": "/productos-promocion",
};

const PILLAR_SEO_ES: Record<PublicPillarId, PillarSeoCopy> = {
  home: {
    title: "Noticias, clasificados y comunidad en San José",
    description:
      "Leonix Media reúne noticias locales, clasificados, negocios, revista bilingüe, recursos comunitarios, viajes, iglesias y productos promocionales para San José y el Área de la Bahía.",
    schemaName: "Leonix Media",
  },
  noticias: {
    title: "Noticias locales en San José y el Área de la Bahía",
    description:
      "Titulares, cultura y comunidad para San José y el Área de la Bahía. Noticias locales en español e inglés de Leonix Media.",
    schemaName: "Noticias",
  },
  magazine: {
    title: "La Revista: comunidad, cultura y negocios",
    description:
      "Revista bilingüe de Leonix Media con comunidad, cultura y negocios. Explora la edición actual y el archivo digital e impreso.",
    schemaName: "La Revista",
  },
  clasificados: {
    title: "Clasificados en San José: autos, rentas, empleos y más",
    description:
      "Clasificados locales en San José: autos, rentas, empleos, bienes raíces, servicios, restaurantes, viajes, comunidad, clases y más en Leonix Media.",
    schemaName: "Clasificados",
  },
  "negocios-locales": {
    title: "Negocios locales en San José",
    description:
      "Descubre restaurantes, servicios, dealers de autos y bienes raíces en San José. Perfiles locales para conectar negocios con la comunidad.",
    schemaName: "Negocios Locales",
  },
  "recursos-comunitarios": {
    title: "Recursos comunitarios en San José y Santa Clara County",
    description:
      "Eventos, clases, iglesias y apoyo local para familias y organizaciones en San José y Santa Clara County. Recursos comunitarios de Leonix Media.",
    schemaName: "Recursos Comunitarios",
  },
  viajes: {
    title: "Viajes: destinos, ofertas y planificación",
    description:
      "Explora destinos, ofertas de socios, paquetes de agencias e ideas editoriales para planear tu próximo viaje con Leonix Media.",
    schemaName: "Viajes",
  },
  iglesias: {
    title: "Iglesias y comunidades de fe en San José",
    description:
      "Directorio gratuito y neutral de iglesias y comunidades de fe en San José. Leonix no vende rankings ni respalda congregaciones.",
    schemaName: "Iglesias",
  },
  "productos-promocion": {
    title: "Productos promocionales para negocios",
    description:
      "Tarjetas, volantes, letreros, banners y mercancía con marca para negocios. Productos promocionales de Leonix — no cupones ni ofertas de consumo.",
    schemaName: "Productos Promocionales",
  },
};

const PILLAR_SEO_EN: Record<PublicPillarId, PillarSeoCopy> = {
  home: {
    title: "News, classifieds, and community in San Jose",
    description:
      "Leonix Media brings together local news, classifieds, businesses, a bilingual magazine, community resources, travel, churches, and promotional products for San Jose and the Bay Area.",
    schemaName: "Leonix Media",
  },
  noticias: {
    title: "Local news in San Jose and the Bay Area",
    description:
      "Headlines, culture, and community for San Jose and the Bay Area. Local news in Spanish and English from Leonix Media.",
    schemaName: "News",
  },
  magazine: {
    title: "The Magazine: community, culture, and business",
    description:
      "Leonix Media’s bilingual magazine covering community, culture, and business. Browse the current edition and the digital and print archive.",
    schemaName: "The Magazine",
  },
  clasificados: {
    title: "Classifieds in San Jose: autos, rentals, jobs, and more",
    description:
      "Local classifieds in San Jose: autos, rentals, jobs, real estate, services, restaurants, travel, community, classes, and more on Leonix Media.",
    schemaName: "Classifieds",
  },
  "negocios-locales": {
    title: "Local businesses in San Jose",
    description:
      "Find restaurants, services, auto dealers, and real estate in San Jose. Local business profiles that connect companies with the community.",
    schemaName: "Local Businesses",
  },
  "recursos-comunitarios": {
    title: "Community resources in San Jose and Santa Clara County",
    description:
      "Events, classes, churches, and local support for families and organizations in San Jose and Santa Clara County. Community resources from Leonix Media.",
    schemaName: "Community Resources",
  },
  viajes: {
    title: "Travel: destinations, offers, and trip planning",
    description:
      "Explore destinations, partner offers, agency packages, and editorial ideas to plan your next trip with Leonix Media.",
    schemaName: "Travel",
  },
  iglesias: {
    title: "Churches and faith communities in San Jose",
    description:
      "A free, neutral directory of churches and faith communities in San Jose. Leonix does not sell rankings or endorse congregations.",
    schemaName: "Churches",
  },
  "productos-promocion": {
    title: "Promotional products for businesses",
    description:
      "Business cards, flyers, signs, banners, and branded merchandise for companies. Leonix promotional products — not consumer coupons or deals.",
    schemaName: "Promotional Products",
  },
};

export function getPublicPillarSeoCopy(id: PublicPillarId, lang: SupportedLang): PillarSeoCopy {
  return lang === "en" ? PILLAR_SEO_EN[id] : PILLAR_SEO_ES[id];
}

export function buildPublicPillarMetadata(id: PublicPillarId, lang: SupportedLang): Metadata {
  const copy = getPublicPillarSeoCopy(id, lang);
  const path = PUBLIC_PILLAR_PATH[id];
  const ogTitle = leonixPageTitle(copy.title);
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: ogTitle,
      description: copy.description,
      url: path,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "website",
      locale: lang === "en" ? "en_US" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: copy.description,
    },
  };
}

export function buildPublicPillarJsonLd(id: PublicPillarId, lang: SupportedLang): Record<string, unknown> {
  const copy = getPublicPillarSeoCopy(id, lang);
  const path = PUBLIC_PILLAR_PATH[id];
  const url = `${LEONIX_SITE_ORIGIN}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": id === "home" ? "WebPage" : "CollectionPage",
    name: copy.schemaName,
    description: copy.description,
    url,
    inLanguage: lang === "en" ? "en" : "es",
    isPartOf: {
      "@type": "WebSite",
      name: LEONIX_MEDIA_SITE_NAME,
      url: LEONIX_SITE_ORIGIN,
    },
  };
}
