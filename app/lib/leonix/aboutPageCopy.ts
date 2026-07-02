export type AboutPageLang = "es" | "en";

export type AboutPageCopy = {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaAdvertise: string;
  ctaClassifieds: string;
  ctaMagazine: string;
  ctaLaunch: string;
  whatWeAreTitle: string;
  whatWeAreBody: string;
  connectsTitle: string;
  connectsCards: string[];
  whyTitle: string;
  whyBody: string;
  ecosystemTitle: string;
  ecosystemCards: Array<{ title: string; href: string }>;
  rootsTitle: string;
  rootsBody: string;
  finalTitle: string;
  ctaContact: string;
  langSwitch: string;
};

const ES: AboutPageCopy = {
  metaTitle: "Sobre Leonix Media",
  metaDescription:
    "Leonix Media es una plataforma local bilingüe que conecta negocios, familias, comunidades y oportunidades en el Área de la Bahía y el norte de California.",
  heroTitle: "Sobre Leonix Media",
  heroSubtitle:
    "Leonix Media es una plataforma local bilingüe que conecta negocios, familias, comunidades y oportunidades en el Área de la Bahía y el norte de California.",
  ctaAdvertise: "Anúnciate con Leonix",
  ctaClassifieds: "Explorar Clasificados",
  ctaMagazine: "Ver edición digital",
  ctaLaunch: "Ver presentación de lanzamiento",
  whatWeAreTitle: "Qué somos",
  whatWeAreBody:
    "Somos una red de medios, clasificados, revista digital, productos promocionales y conexiones locales creada para ayudar a los negocios y comunidades a ser encontrados, contactados y recordados.",
  connectsTitle: "Lo que Leonix conecta",
  connectsCards: [
    "Negocios con clientes",
    "Compradores con vendedores",
    "Empleadores con candidatos",
    "Iglesias con familias",
    "Eventos con comunidades",
    "Viajeros con ofertas",
    "Vecinos con recursos locales",
  ],
  whyTitle: "Por qué existe Leonix",
  whyBody:
    "Porque muchos negocios locales necesitan algo más que una publicación: necesitan presencia, confianza, visibilidad, contactos reales y una forma simple de aparecer en digital, impreso, móvil y comunidad.",
  ecosystemTitle: "Nuestro ecosistema",
  ecosystemCards: [
    { title: "Revista Leonix", href: "/magazine" },
    { title: "Clasificados", href: "/clasificados" },
    { title: "Negocios Locales", href: "/negocios-locales" },
    { title: "Productos Promocionales", href: "/productos-promocion" },
    { title: "Media Kit", href: "/media-kit" },
    { title: "QR + herramientas multilingües", href: "/coming-soon-v2" },
  ],
  rootsTitle: "Raíces locales",
  rootsBody:
    "Nacimos para servir a la comunidad latina y multicultural del Área de la Bahía, empezando por San José y creciendo hacia el norte de California.",
  finalTitle: "¿Listo para rugir con Leonix?",
  ctaContact: "Contactar Leonix",
  langSwitch: "English",
};

const EN: AboutPageCopy = {
  metaTitle: "About Leonix Media",
  metaDescription:
    "Leonix Media is a bilingual local platform connecting businesses, families, communities, and opportunities across the Bay Area and Northern California.",
  heroTitle: "About Leonix Media",
  heroSubtitle:
    "Leonix Media is a bilingual local platform connecting businesses, families, communities, and opportunities across the Bay Area and Northern California.",
  ctaAdvertise: "Advertise with Leonix",
  ctaClassifieds: "Explore Classifieds",
  ctaMagazine: "View digital edition",
  ctaLaunch: "View launch presentation",
  whatWeAreTitle: "What we are",
  whatWeAreBody:
    "We are a media, classifieds, digital magazine, promotional products, and local connection network built to help businesses and communities be found, contacted, and remembered.",
  connectsTitle: "What Leonix connects",
  connectsCards: [
    "Businesses with customers",
    "Buyers with sellers",
    "Employers with candidates",
    "Churches with families",
    "Events with communities",
    "Travelers with offers",
    "Neighbors with local resources",
  ],
  whyTitle: "Why Leonix exists",
  whyBody:
    "Because many local businesses need more than a post. They need presence, trust, visibility, real contact paths, and a simple way to show up across digital, print, mobile, and community.",
  ecosystemTitle: "Our ecosystem",
  ecosystemCards: [
    { title: "Leonix Magazine", href: "/magazine" },
    { title: "Classifieds", href: "/clasificados" },
    { title: "Local Businesses", href: "/negocios-locales" },
    { title: "Promotional Products", href: "/productos-promocion" },
    { title: "Media Kit", href: "/media-kit" },
    { title: "QR + multilingual tools", href: "/coming-soon-v2" },
  ],
  rootsTitle: "Local roots",
  rootsBody:
    "We were built to serve the Latino and multicultural community of the Bay Area, starting in San Jose and growing across Northern California.",
  finalTitle: "Ready to roar with Leonix?",
  ctaContact: "Contact Leonix",
  langSwitch: "Español",
};

export function getAboutPageCopy(lang: AboutPageLang): AboutPageCopy {
  return lang === "en" ? EN : ES;
}
