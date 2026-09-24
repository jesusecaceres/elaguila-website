export type AboutPageLang = "es" | "en";

export type AboutPageCopy = {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaAdvertise: string;
  ctaClassifieds: string;
  ctaMagazine: string;
  ctaLearn: string;
  ctaVirtualCall: string;
  whatWeAreTitle: string;
  whatWeAreBody: string;
  businessDevTitle: string;
  businessDevBody: string;
  connectsTitle: string;
  connectsCards: string[];
  approachTitle: string;
  approachPoints: string[];
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
    "Leonix Media es una plataforma bilingüe de desarrollo empresarial y medios que conecta negocios, familias y comunidades en el Área de la Bahía y el norte de California a través de revista, clasificados, radio, productos promocionales y presencia digital.",
  heroTitle: "Sobre Leonix Media",
  heroSubtitle:
    "Somos una plataforma bilingüe de desarrollo empresarial y medios para el Área de la Bahía y el norte de California. Ayudamos a los negocios a ser encontrados, contactados y recordados.",
  ctaAdvertise: "Anúnciate con Leonix",
  ctaClassifieds: "Explorar Clasificados",
  ctaMagazine: "Ver edición digital",
  ctaLearn: "Centro de Aprendizaje",
  ctaVirtualCall: "Llamada virtual",
  whatWeAreTitle: "Qué somos",
  whatWeAreBody:
    "Leonix Media es una red de medios, clasificados, revista digital bilingüe, radio local, productos promocionales y conexiones comunitarias creada para ayudar a los negocios y comunidades a crecer. No somos solo una publicación: somos presencia, confianza y acción.",
  businessDevTitle: "Desarrollo empresarial",
  businessDevBody:
    "Trabajamos junto a los negocios locales para construir presencia real: perfil digital, publicidad en revista, clasificados activos, productos con tu marca, cobertura en radio y herramientas para llegar a tu comunidad. Cada canal refuerza al otro.",
  connectsTitle: "Lo que Leonix conecta",
  connectsCards: [
    "Negocios con clientes",
    "Compradores con vendedores",
    "Empleadores con candidatos",
    "Iglesias con familias",
    "Eventos con comunidades",
    "Viajeros con ofertas",
    "Vecinos con recursos locales",
    "Marcas con audiencias bilingües",
  ],
  approachTitle: "Nuestro enfoque",
  approachPoints: [
    "Primero la comunidad — construimos para servir, no para explotar.",
    "Bilingüe por diseño — español e inglés en cada canal.",
    "Presencia práctica — visible en digital, impreso, radio y móvil.",
    "Sin atajos — reputación y confianza sobre volumen.",
    "Stewardship — administramos lo que se nos confía con integridad.",
  ],
  whyTitle: "Por qué existe Leonix",
  whyBody:
    "Porque muchos negocios locales merecen más que una publicación. Merecen presencia, confianza, visibilidad, contactos reales y una forma simple de aparecer en digital, impreso, radio, móvil y comunidad — todo en un ecosistema bilingüe que los conoce.",
  ecosystemTitle: "Nuestro ecosistema",
  ecosystemCards: [
    { title: "Revista Leonix", href: "/magazine" },
    { title: "Clasificados", href: "/clasificados" },
    { title: "Negocios Locales", href: "/negocios-locales" },
    { title: "Radio · La Kaliente 1370", href: "/contacto?inquiryType=radio" },
    { title: "Productos Promocionales", href: "/productos-promocion" },
    { title: "Media Kit", href: "/media-kit" },
    { title: "Centro de Aprendizaje", href: "/aprender" },
  ],
  rootsTitle: "Raíces locales",
  rootsBody:
    "Nacimos para servir a la comunidad latina y multicultural del Área de la Bahía, empezando por San José y creciendo hacia el norte de California. Hablamos el idioma de los negocios y el idioma de las familias — con respeto y sin letra chica.",
  finalTitle: "¿Listo para crecer con Leonix?",
  ctaContact: "Contactar Leonix",
  langSwitch: "English",
};

const EN: AboutPageCopy = {
  metaTitle: "About Leonix Media",
  metaDescription:
    "Leonix Media is a bilingual business development and media platform connecting businesses, families, and communities across the Bay Area and Northern California through magazine, classifieds, radio, promotional products, and digital presence.",
  heroTitle: "About Leonix Media",
  heroSubtitle:
    "We are a bilingual business development and media platform for the Bay Area and Northern California. We help local businesses be found, contacted, and remembered.",
  ctaAdvertise: "Advertise with Leonix",
  ctaClassifieds: "Explore Classifieds",
  ctaMagazine: "View digital edition",
  ctaLearn: "Learning Center",
  ctaVirtualCall: "Virtual Call",
  whatWeAreTitle: "What we are",
  whatWeAreBody:
    "Leonix Media is a network of media, classifieds, a bilingual digital magazine, local radio, promotional products, and community connections built to help businesses and communities grow. We are not just a publication — we are presence, trust, and action.",
  businessDevTitle: "Business development",
  businessDevBody:
    "We work alongside local businesses to build real presence: digital profile, magazine advertising, active classifieds, branded merchandise, radio coverage, and tools for reaching your community. Each channel reinforces the others.",
  connectsTitle: "What Leonix connects",
  connectsCards: [
    "Businesses with customers",
    "Buyers with sellers",
    "Employers with candidates",
    "Churches with families",
    "Events with communities",
    "Travelers with offers",
    "Neighbors with local resources",
    "Brands with bilingual audiences",
  ],
  approachTitle: "Our approach",
  approachPoints: [
    "Community first — we build to serve, not to exploit.",
    "Bilingual by design — Spanish and English across every channel.",
    "Practical presence — visible in digital, print, radio, and mobile.",
    "No shortcuts — reputation and trust over volume.",
    "Stewardship — we manage what is entrusted to us with integrity.",
  ],
  whyTitle: "Why Leonix exists",
  whyBody:
    "Because many local businesses deserve more than a post. They deserve presence, trust, visibility, real contact paths, and a simple way to show up across digital, print, radio, mobile, and community — all in a bilingual ecosystem that knows them.",
  ecosystemTitle: "Our ecosystem",
  ecosystemCards: [
    { title: "Leonix Magazine", href: "/magazine" },
    { title: "Classifieds", href: "/clasificados" },
    { title: "Local Businesses", href: "/negocios-locales" },
    { title: "Radio · La Kaliente 1370", href: "/contacto?inquiryType=radio" },
    { title: "Promotional Products", href: "/productos-promocion" },
    { title: "Media Kit", href: "/media-kit" },
    { title: "Learning Center", href: "/aprender" },
  ],
  rootsTitle: "Local roots",
  rootsBody:
    "We were built to serve the Latino and multicultural community of the Bay Area, starting in San Jose and growing across Northern California. We speak the language of business and the language of families — with respect and no fine print.",
  finalTitle: "Ready to grow with Leonix?",
  ctaContact: "Contact Leonix",
  langSwitch: "Español",
};

export function getAboutPageCopy(lang: AboutPageLang): AboutPageCopy {
  return lang === "en" ? EN : ES;
}
