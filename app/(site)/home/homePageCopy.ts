/**
 * Gate HOME-LAUNCH — code-owned public Home copy (ES demo + EN parity; PT/TL kept for the
 * official launch dictionary). Every destination below is an existing public route; hrefs get
 * `?lang=` injected at render time so language is always preserved.
 */
import type { OfficialLaunchLang } from "@/app/lib/language";

export type HomePageLang = OfficialLaunchLang;

export type HomeDiscoverItemId =
  | "ofertas-locales"
  | "negocios-locales"
  | "revista"
  | "noticias"
  | "clasificados"
  | "recursos"
  | "viajes"
  | "iglesias";

export type HomeDiscoverItem = {
  id: HomeDiscoverItemId;
  title: string;
  description: string;
  href: string;
  /** Visually prominent doorway (Ofertas Locales). */
  featured?: boolean;
};

export type HomePageCopy = {
  hero: {
    eyebrow: string;
    title: string;
    supportPrimary: string;
    supportSecondary: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  edition: {
    eyebrow: string;
    title: string;
    body: string;
    ctaRead: string;
    ctaAll: string;
  };
  discover: {
    eyebrow: string;
    title: string;
    intro: string;
    exploreLabel: string;
    items: HomeDiscoverItem[];
  };
  destacados: {
    eyebrow: string;
    title: string;
    reserved: string;
    viewCta: string;
    exploreCta: string;
  };
  learn: {
    eyebrow: string;
    title: string;
    body: string;
    journeys: [string, string, string];
    cta: string;
  };
  business: {
    eyebrow: string;
    title: string;
    intro: string;
    digital: { title: string; body: string; cta: string };
    print: { title: string; body: string; cta: string };
  };
  convert: {
    eyebrow: string;
    title: string;
    body: string;
    newsletterCta: string;
    businessLine: string;
    businessCta: string;
    newsletterPlaceholder: string;
    newsletterAria: string;
    emailLabel: string;
  };
};

/** Existing public routes (Gate 0 route map). Order = visual order in the discovery grid. */
export const HOME_DISCOVER_ROUTES: Record<HomeDiscoverItemId, string> = {
  "ofertas-locales": "/clasificados/ofertas-locales",
  "negocios-locales": "/negocios-locales",
  revista: "/magazine",
  noticias: "/noticias",
  clasificados: "/clasificados",
  recursos: "/recursos-comunitarios",
  viajes: "/clasificados/viajes",
  iglesias: "/iglesias",
};

/** Existing routes for the business-facing sections. */
export const HOME_ROUTES = {
  learningCenter: "/aprender",
  digitalPresence: "/negocios-locales",
  magazineDigital: "/media-kit",
  featuredBusinesses: "/negocios-locales",
  newsletter: "/newsletter",
} as const;

export const HOME_ANCHORS = {
  explore: "explorar",
  learn: "aprende",
  advertise: "anunciate",
} as const;

function items(
  labels: Record<HomeDiscoverItemId, { title: string; description: string }>,
): HomeDiscoverItem[] {
  const order: HomeDiscoverItemId[] = [
    "ofertas-locales",
    "negocios-locales",
    "revista",
    "noticias",
    "clasificados",
    "recursos",
    "viajes",
    "iglesias",
  ];
  return order.map((id) => ({
    id,
    ...labels[id],
    href: HOME_DISCOVER_ROUTES[id],
    featured: id === "ofertas-locales",
  }));
}

export const HOME_PAGE_COPY: Record<HomePageLang, HomePageCopy> = {
  es: {
    hero: {
      eyebrow: "LEONIX MEDIA",
      title: "Tu comunidad. Todo en un solo lugar.",
      supportPrimary:
        "Descubre negocios locales, ofertas, oportunidades, recursos, historias y experiencias creadas para nuestra comunidad.",
      supportSecondary:
        "Leonix conecta familias, emprendedores, negocios y organizaciones a través de una revista premium, presencia digital bilingüe y herramientas para descubrir, conectar y crecer.",
      ctaPrimary: "Explorar Leonix",
      ctaSecondary: "Haz crecer tu negocio",
    },
    edition: {
      eyebrow: "EDICIÓN ACTUAL",
      title: "La Revista Leonix",
      body: "Historias, negocios, cultura y recursos para nuestra comunidad.",
      ctaRead: "Leer edición actual",
      ctaAll: "Ver todas las ediciones",
    },
    discover: {
      eyebrow: "DESCUBRE LEONIX",
      title: "¿Qué buscas hoy?",
      intro: "Explora la comunidad, encuentra oportunidades o descubre algo nuevo cerca de ti.",
      exploreLabel: "Explorar",
      items: items({
        "ofertas-locales": {
          title: "Ofertas Locales",
          description: "Cupones, especiales y promociones de negocios cerca de ti.",
        },
        "negocios-locales": {
          title: "Negocios Locales",
          description: "Encuentra negocios, servicios y profesionales de confianza en tu comunidad.",
        },
        revista: {
          title: "Revista",
          description: "La edición actual de Leonix con historias, cultura y negocios locales.",
        },
        noticias: {
          title: "Noticias",
          description: "Lo que está pasando en nuestra comunidad.",
        },
        clasificados: {
          title: "Clasificados",
          description: "Rentas, empleos, autos, ventas y más oportunidades locales.",
        },
        recursos: {
          title: "Recursos",
          description: "Organizaciones, apoyo y herramientas útiles para familias.",
        },
        viajes: {
          title: "Viajes",
          description: "Agencias y ofertas de viaje de nuestra comunidad.",
        },
        iglesias: {
          title: "Iglesias",
          description: "Comunidad de fe: encuentra una congregación cerca de ti.",
        },
      }),
    },
    destacados: {
      eyebrow: "DESTACADOS",
      title: "Negocios de nuestra comunidad",
      reserved:
        "Muy pronto encontrarás aquí negocios locales destacados y nuevas formas de conectar con ellos.",
      viewCta: "Ver negocio",
      exploreCta: "Explorar Negocios Locales",
    },
    learn: {
      eyebrow: "APRENDE Y CRECE",
      title: "De una idea a un negocio más fuerte.",
      body: "Educación práctica y gratuita para quienes quieren empezar, administrar o hacer crecer un negocio.",
      journeys: ["Tengo una idea", "Estoy empezando", "Ya tengo un negocio"],
      cta: "Explorar Centro de Aprendizaje",
    },
    business: {
      eyebrow: "PARA NEGOCIOS",
      title: "Haz crecer tu presencia con Leonix.",
      intro: "Elige cómo quieres conectar tu negocio con nuestra comunidad.",
      digital: {
        title: "Presencia Digital",
        body: "Una presencia profesional en Leonix para que las personas descubran tu negocio, conozcan lo que haces y encuentren formas directas de contactarte.",
        cta: "Explorar presencia digital",
      },
      print: {
        title: "Revista + Digital",
        body: "Combina visibilidad en la revista con presencia digital conectada para llevar a las personas del papel al contacto.",
        cta: "Ver opciones de revista + digital",
      },
    },
    convert: {
      eyebrow: "MANTENTE CONECTADO",
      title: "Sigue cerca de tu comunidad.",
      body: "Recibe nuevas ediciones, ofertas locales, recursos, eventos y novedades de Leonix.",
      newsletterCta: "Unirme al boletín",
      businessLine: "¿Tienes un negocio? Descubre cómo crecer con Leonix.",
      businessCta: "Ver opciones para negocios",
      newsletterPlaceholder: "Tu correo electrónico",
      newsletterAria: "Registro al boletín desde Inicio",
      emailLabel: "Correo electrónico",
    },
  },
  en: {
    hero: {
      eyebrow: "LEONIX MEDIA",
      title: "Your community. All in one place.",
      supportPrimary:
        "Discover local businesses, offers, opportunities, resources, stories, and experiences created for our community.",
      supportSecondary:
        "Leonix connects families, entrepreneurs, businesses, and organizations through a premium magazine, bilingual digital presence, and tools to discover, connect, and grow.",
      ctaPrimary: "Explore Leonix",
      ctaSecondary: "Grow your business",
    },
    edition: {
      eyebrow: "CURRENT EDITION",
      title: "Leonix Magazine",
      body: "Stories, businesses, culture, and resources for our community.",
      ctaRead: "Read current edition",
      ctaAll: "View all editions",
    },
    discover: {
      eyebrow: "DISCOVER LEONIX",
      title: "What are you looking for today?",
      intro: "Explore the community, find opportunities, or discover something new near you.",
      exploreLabel: "Explore",
      items: items({
        "ofertas-locales": {
          title: "Local Offers",
          description: "Coupons, specials, and promotions from businesses near you.",
        },
        "negocios-locales": {
          title: "Local Businesses",
          description: "Find trusted businesses, services, and professionals in your community.",
        },
        revista: {
          title: "Magazine",
          description: "The current Leonix edition with stories, culture, and local businesses.",
        },
        noticias: {
          title: "News",
          description: "What's happening in our community.",
        },
        clasificados: {
          title: "Classifieds",
          description: "Rentals, jobs, autos, for-sale listings, and more local opportunities.",
        },
        recursos: {
          title: "Resources",
          description: "Organizations, support, and useful tools for families.",
        },
        viajes: {
          title: "Travel",
          description: "Travel agencies and trip offers from our community.",
        },
        iglesias: {
          title: "Churches",
          description: "Faith community: find a congregation near you.",
        },
      }),
    },
    destacados: {
      eyebrow: "FEATURED",
      title: "Businesses from our community",
      reserved: "Soon you’ll find featured local businesses here and new ways to connect with them.",
      viewCta: "View business",
      exploreCta: "Explore Local Businesses",
    },
    learn: {
      eyebrow: "LEARN & GROW",
      title: "From an idea to a stronger business.",
      body: "Free practical education for people who want to start, manage, or grow a business.",
      journeys: ["I have an idea", "I’m getting started", "I already own a business"],
      cta: "Explore the Learning Center",
    },
    business: {
      eyebrow: "FOR BUSINESSES",
      title: "Grow your presence with Leonix.",
      intro: "Choose how you want to connect your business with our community.",
      digital: {
        title: "Digital Presence",
        body: "A professional Leonix presence that helps people discover your business, understand what you offer, and find direct ways to contact you.",
        cta: "Explore digital presence",
      },
      print: {
        title: "Magazine + Digital",
        body: "Combine magazine visibility with connected digital presence to move people from print to contact.",
        cta: "View magazine + digital options",
      },
    },
    convert: {
      eyebrow: "STAY CONNECTED",
      title: "Stay close to your community.",
      body: "Get new editions, local offers, resources, events, and Leonix updates.",
      newsletterCta: "Join the newsletter",
      businessLine: "Own a business? Discover how to grow with Leonix.",
      businessCta: "View business options",
      newsletterPlaceholder: "Your email address",
      newsletterAria: "Newsletter signup from Home",
      emailLabel: "Email address",
    },
  },
  pt: {
    hero: {
      eyebrow: "LEONIX MEDIA",
      title: "Sua comunidade. Tudo em um só lugar.",
      supportPrimary:
        "Descubra negócios locais, ofertas, oportunidades, recursos, histórias e experiências criadas para a nossa comunidade.",
      supportSecondary:
        "A Leonix conecta famílias, empreendedores, negócios e organizações por meio de uma revista premium, presença digital bilíngue e ferramentas para descobrir, conectar e crescer.",
      ctaPrimary: "Explorar a Leonix",
      ctaSecondary: "Faça seu negócio crescer",
    },
    edition: {
      eyebrow: "EDIÇÃO ATUAL",
      title: "A Revista Leonix",
      body: "Histórias, negócios, cultura e recursos para a nossa comunidade.",
      ctaRead: "Ler edição atual",
      ctaAll: "Ver todas as edições",
    },
    discover: {
      eyebrow: "DESCUBRA A LEONIX",
      title: "O que você procura hoje?",
      intro: "Explore a comunidade, encontre oportunidades ou descubra algo novo perto de você.",
      exploreLabel: "Explorar",
      items: items({
        "ofertas-locales": {
          title: "Ofertas Locais",
          description: "Cupons, especiais e promoções de negócios perto de você.",
        },
        "negocios-locales": {
          title: "Negócios Locais",
          description: "Encontre negócios, serviços e profissionais de confiança na sua comunidade.",
        },
        revista: {
          title: "Revista",
          description: "A edição atual da Leonix com histórias, cultura e negócios locais.",
        },
        noticias: {
          title: "Notícias",
          description: "O que está acontecendo na nossa comunidade.",
        },
        clasificados: {
          title: "Classificados",
          description: "Aluguéis, empregos, autos, vendas e mais oportunidades locais.",
        },
        recursos: {
          title: "Recursos",
          description: "Organizações, apoio e ferramentas úteis para famílias.",
        },
        viajes: {
          title: "Viagens",
          description: "Agências e ofertas de viagem da nossa comunidade.",
        },
        iglesias: {
          title: "Igrejas",
          description: "Comunidade de fé: encontre uma congregação perto de você.",
        },
      }),
    },
    destacados: {
      eyebrow: "DESTAQUES",
      title: "Negócios da nossa comunidade",
      reserved:
        "Em breve você encontrará aqui negócios locais em destaque e novas formas de se conectar com eles.",
      viewCta: "Ver negócio",
      exploreCta: "Explorar Negócios Locais",
    },
    learn: {
      eyebrow: "APRENDA E CRESÇA",
      title: "De uma ideia a um negócio mais forte.",
      body: "Educação prática e gratuita para quem quer começar, administrar ou fazer crescer um negócio.",
      journeys: ["Tenho uma ideia", "Estou começando", "Já tenho um negócio"],
      cta: "Explorar o Centro de Aprendizagem",
    },
    business: {
      eyebrow: "PARA NEGÓCIOS",
      title: "Faça sua presença crescer com a Leonix.",
      intro: "Escolha como você quer conectar seu negócio com a nossa comunidade.",
      digital: {
        title: "Presença Digital",
        body: "Uma presença profissional na Leonix para que as pessoas descubram seu negócio, conheçam o que você faz e encontrem formas diretas de contato.",
        cta: "Explorar presença digital",
      },
      print: {
        title: "Revista + Digital",
        body: "Combine visibilidade na revista com presença digital conectada para levar as pessoas do papel ao contato.",
        cta: "Ver opções de revista + digital",
      },
    },
    convert: {
      eyebrow: "FIQUE CONECTADO",
      title: "Fique perto da sua comunidade.",
      body: "Receba novas edições, ofertas locais, recursos, eventos e novidades da Leonix.",
      newsletterCta: "Entrar na newsletter",
      businessLine: "Tem um negócio? Descubra como crescer com a Leonix.",
      businessCta: "Ver opções para negócios",
      newsletterPlaceholder: "Seu e-mail",
      newsletterAria: "Cadastro na newsletter — Início",
      emailLabel: "E-mail",
    },
  },
  tl: {
    hero: {
      eyebrow: "LEONIX MEDIA",
      title: "Ang iyong komunidad. Lahat sa isang lugar.",
      supportPrimary:
        "Tuklasin ang mga lokal na negosyo, alok, oportunidad, resource, kwento, at karanasang ginawa para sa ating komunidad.",
      supportSecondary:
        "Ikinokonekta ng Leonix ang mga pamilya, entrepreneur, negosyo, at organisasyon sa pamamagitan ng premium magazine, bilingual na digital presence, at mga tool para tumuklas, kumonekta, at lumago.",
      ctaPrimary: "Tuklasin ang Leonix",
      ctaSecondary: "Palaguin ang iyong negosyo",
    },
    edition: {
      eyebrow: "KASALUKUYANG EDISYON",
      title: "Ang Leonix Magazine",
      body: "Mga kwento, negosyo, kultura, at resource para sa ating komunidad.",
      ctaRead: "Basahin ang kasalukuyang edisyon",
      ctaAll: "Tingnan ang lahat ng edisyon",
    },
    discover: {
      eyebrow: "TUKLASIN ANG LEONIX",
      title: "Ano ang hinahanap mo ngayon?",
      intro: "Tuklasin ang komunidad, humanap ng oportunidad, o tumuklas ng bago malapit sa iyo.",
      exploreLabel: "Tuklasin",
      items: items({
        "ofertas-locales": {
          title: "Mga Lokal na Alok",
          description: "Kupon, espesyal, at promosyon mula sa mga negosyong malapit sa iyo.",
        },
        "negocios-locales": {
          title: "Mga Lokal na Negosyo",
          description: "Humanap ng mapagkakatiwalaang negosyo, serbisyo, at propesyonal sa iyong komunidad.",
        },
        revista: {
          title: "Magazine",
          description: "Ang kasalukuyang edisyon ng Leonix na may mga kwento, kultura, at lokal na negosyo.",
        },
        noticias: {
          title: "Balita",
          description: "Ang nangyayari sa ating komunidad.",
        },
        clasificados: {
          title: "Classifieds",
          description: "Paupahan, trabaho, kotse, binebenta, at iba pang lokal na oportunidad.",
        },
        recursos: {
          title: "Mga Resource",
          description: "Organisasyon, suporta, at kapaki-pakinabang na tool para sa pamilya.",
        },
        viajes: {
          title: "Paglalakbay",
          description: "Mga travel agency at alok sa biyahe mula sa ating komunidad.",
        },
        iglesias: {
          title: "Mga Simbahan",
          description: "Komunidad ng pananampalataya: humanap ng kongregasyon malapit sa iyo.",
        },
      }),
    },
    destacados: {
      eyebrow: "TAMPOK",
      title: "Mga negosyo mula sa ating komunidad",
      reserved:
        "Malapit na, makikita mo rito ang mga tampok na lokal na negosyo at bagong paraan para kumonekta sa kanila.",
      viewCta: "Tingnan ang negosyo",
      exploreCta: "Tuklasin ang Mga Lokal na Negosyo",
    },
    learn: {
      eyebrow: "MATUTO AT LUMAGO",
      title: "Mula sa ideya tungo sa mas matatag na negosyo.",
      body: "Libre at praktikal na edukasyon para sa mga gustong magsimula, mamahala, o magpalago ng negosyo.",
      journeys: ["May ideya ako", "Nagsisimula pa lang ako", "May negosyo na ako"],
      cta: "Tuklasin ang Learning Center",
    },
    business: {
      eyebrow: "PARA SA MGA NEGOSYO",
      title: "Palaguin ang iyong presensya sa Leonix.",
      intro: "Piliin kung paano mo gustong ikonekta ang iyong negosyo sa ating komunidad.",
      digital: {
        title: "Digital Presence",
        body: "Isang propesyonal na presensya sa Leonix para matuklasan ng mga tao ang iyong negosyo, maunawaan ang inaalok mo, at makahanap ng direktang paraan para makipag-ugnayan.",
        cta: "Tuklasin ang digital presence",
      },
      print: {
        title: "Magazine + Digital",
        body: "Pagsamahin ang visibility sa magazine at konektadong digital presence para dalhin ang mga tao mula sa print patungo sa pakikipag-ugnayan.",
        cta: "Tingnan ang mga opsyon ng magazine + digital",
      },
    },
    convert: {
      eyebrow: "MANATILING KONEKTADO",
      title: "Manatiling malapit sa iyong komunidad.",
      body: "Tumanggap ng mga bagong edisyon, lokal na alok, resource, event, at balita mula sa Leonix.",
      newsletterCta: "Sumali sa newsletter",
      businessLine: "May negosyo ka ba? Alamin kung paano lumago sa Leonix.",
      businessCta: "Tingnan ang mga opsyon para sa negosyo",
      newsletterPlaceholder: "Ang iyong email",
      newsletterAria: "Newsletter signup mula sa Home",
      emailLabel: "Email",
    },
  },
};
