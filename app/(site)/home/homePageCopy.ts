export type HomePageLang = "es" | "en";

export type HomePageCopy = {
  ecosystem: {
    eyebrow: string;
    title: string;
    intro: string;
    points: [string, string, string];
  };
  pillars: {
    eyebrow: string;
    title: string;
    intro: string;
    items: Array<{ title: string; description: string; href: string }>;
  };
  destacados: {
    eyebrow: string;
    title: string;
    intro: string;
    reserved: string;
    viewCta: string;
    advertiseCta: string;
  };
  convert: {
    eyebrow: string;
    title: string;
    body: string;
    newsletterCta: string;
    advertiseCta: string;
    contactCta: string;
    newsletterPlaceholder: string;
    newsletterAria: string;
    emailLabel: string;
  };
};

export const HOME_PAGE_COPY: Record<HomePageLang, HomePageCopy> = {
  es: {
    ecosystem: {
      eyebrow: "ECOSISTEMA LOCAL",
      title: "Un solo espacio para oportunidades reales",
      intro:
        "Leonix Media combina revista, presencia digital bilingüe y herramientas locales para que familias y negocios encuentren lo que necesitan sin perderse entre plataformas.",
      points: [
        "Rentas, empleos, autos y artículos en venta en un marketplace activo.",
        "Eventos, recursos comunitarios y conexiones con organizaciones locales.",
        "Visibilidad para negocios que apoyan a nuestra comunidad con contenido premium.",
      ],
    },
    pillars: {
      eyebrow: "RUTAS PRINCIPALES",
      title: "Explora lo que Leonix ofrece hoy",
      intro: "Empieza por la revista o entra directo a las áreas que más usan familias y negocios locales.",
      items: [
        {
          title: "La Revista",
          description: "Edición digital y presencia impresa con historias de comunidad, cultura y negocios.",
          href: "/magazine",
        },
        {
          title: "Clasificados",
          description: "Rentas, empleos, autos, ventas y más oportunidades locales en un solo lugar.",
          href: "/clasificados",
        },
        {
          title: "Negocios Locales",
          description: "Descubre negocios de la comunidad y conecta con quienes sirven cerca de ti.",
          href: "/negocios-locales",
        },
        {
          title: "Recursos Comunitarios",
          description: "Organizaciones, apoyo y herramientas útiles para familias y líderes locales.",
          href: "/recursos-comunitarios",
        },
      ],
    },
    destacados: {
      eyebrow: "DESTACADOS",
      title: "Negocios destacados de la comunidad",
      intro:
        "Espacios premium para negocios que apoyan y conectan con nuestra comunidad. Aquí se destacarán anunciantes confirmados de Leonix Media.",
      reserved: "Próximamente: espacios destacados para anunciantes premium.",
      viewCta: "Ver negocio",
      advertiseCta: "Anúnciate con nosotros",
    },
    convert: {
      eyebrow: "MANTENTE CONECTADO",
      title: "Sé parte de la comunidad Leonix",
      body: "Recibe novedades de la revista y oportunidades locales, o reserva tu espacio como anunciante premium.",
      newsletterCta: "Unirme al boletín",
      advertiseCta: "Anúnciate con nosotros",
      contactCta: "Contacto",
      newsletterPlaceholder: "Tu correo electrónico",
      newsletterAria: "Registro al boletín desde Inicio",
      emailLabel: "Correo electrónico",
    },
  },
  en: {
    ecosystem: {
      eyebrow: "LOCAL ECOSYSTEM",
      title: "One place for real local opportunities",
      intro:
        "Leonix Media brings together a magazine, bilingual digital presence, and local tools so families and businesses find what they need without jumping between platforms.",
      points: [
        "Rentals, jobs, autos, and items for sale in an active marketplace.",
        "Events, community resources, and connections with local organizations.",
        "Visibility for businesses that support our community with premium content.",
      ],
    },
    pillars: {
      eyebrow: "CORE PATHS",
      title: "Explore what Leonix offers today",
      intro: "Start with the magazine or go straight to the areas families and local businesses use most.",
      items: [
        {
          title: "The Magazine",
          description: "Digital edition and print presence with community, culture, and business stories.",
          href: "/magazine",
        },
        {
          title: "Classifieds",
          description: "Rentals, jobs, autos, for-sale listings, and more local opportunities in one place.",
          href: "/clasificados",
        },
        {
          title: "Local Businesses",
          description: "Discover community businesses and connect with those who serve near you.",
          href: "/negocios-locales",
        },
        {
          title: "Community Resources",
          description: "Organizations, support, and useful tools for families and local leaders.",
          href: "/recursos-comunitarios",
        },
      ],
    },
    destacados: {
      eyebrow: "FEATURED",
      title: "Featured community businesses",
      intro:
        "Premium spaces for businesses that support and connect with our community. Confirmed Leonix Media advertisers will be highlighted here.",
      reserved: "Coming soon: featured spaces for premium advertisers.",
      viewCta: "View business",
      advertiseCta: "Advertise with us",
    },
    convert: {
      eyebrow: "STAY CONNECTED",
      title: "Be part of the Leonix community",
      body: "Get magazine updates and local opportunities, or reserve your space as a premium advertiser.",
      newsletterCta: "Join the newsletter",
      advertiseCta: "Advertise with us",
      contactCta: "Contact",
      newsletterPlaceholder: "Your email address",
      newsletterAria: "Newsletter signup from Home",
      emailLabel: "Email address",
    },
  },
};
