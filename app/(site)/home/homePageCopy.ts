import type { OfficialLaunchLang } from "@/app/lib/language";

export type HomePageLang = OfficialLaunchLang;

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
  pt: {
    ecosystem: {
      eyebrow: "ECOSSISTEMA LOCAL",
      title: "Um só lugar para oportunidades reais",
      intro:
        "A Leonix Media reúne revista, presença digital bilíngue e ferramentas locais para que famílias e negócios encontrem o que precisam sem pular entre plataformas.",
      points: [
        "Aluguéis, empregos, autos e artigos à venda em um marketplace ativo.",
        "Eventos, recursos comunitários e conexões com organizações locais.",
        "Visibilidade para negócios que apoiam nossa comunidade com conteúdo premium.",
      ],
    },
    pillars: {
      eyebrow: "ROTAS PRINCIPAIS",
      title: "Explore o que a Leonix oferece hoje",
      intro: "Comece pela revista ou entre direto nas áreas que famílias e negócios locais mais usam.",
      items: [
        {
          title: "A Revista",
          description: "Edição digital e presença impressa com histórias de comunidade, cultura e negócios.",
          href: "/magazine",
        },
        {
          title: "Classificados",
          description: "Aluguéis, empregos, autos, vendas e mais oportunidades locais em um só lugar.",
          href: "/clasificados",
        },
        {
          title: "Negócios Locais",
          description: "Descubra negócios da comunidade e conecte-se com quem atende perto de você.",
          href: "/negocios-locales",
        },
        {
          title: "Recursos Comunitários",
          description: "Organizações, apoio e ferramentas úteis para famílias e líderes locais.",
          href: "/recursos-comunitarios",
        },
      ],
    },
    destacados: {
      eyebrow: "DESTAQUES",
      title: "Negócios em destaque da comunidade",
      intro:
        "Espaços premium para negócios que apoiam e conectam com nossa comunidade. Anunciantes confirmados da Leonix Media aparecerão aqui.",
      reserved: "Em breve: espaços em destaque para anunciantes premium.",
      viewCta: "Ver negócio",
      advertiseCta: "Anuncie conosco",
    },
    convert: {
      eyebrow: "FIQUE CONECTADO",
      title: "Faça parte da comunidade Leonix",
      body: "Receba novidades da revista e oportunidades locais, ou reserve seu espaço como anunciante premium.",
      newsletterCta: "Entrar na newsletter",
      advertiseCta: "Anuncie conosco",
      contactCta: "Contato",
      newsletterPlaceholder: "Seu e-mail",
      newsletterAria: "Cadastro na newsletter — Início",
      emailLabel: "E-mail",
    },
  },
  tl: {
    ecosystem: {
      eyebrow: "LOKAL NA EKOSISTEMA",
      title: "Isang lugar para tunay na lokal na oportunidad",
      intro:
        "Pinagsasama ng Leonix Media ang magazine, bilingual digital presence, at lokal na tool para makita ng pamilya at negosyo ang kailangan nila nang hindi lumilipat-lipat ng platform.",
      points: [
        "Paupahan, trabaho, kotse, at binebentang gamit sa aktibong marketplace.",
        "Mga event, community resource, at koneksyon sa lokal na organisasyon.",
        "Visibility para sa negosyong sumusuporta sa ating komunidad na may premium content.",
      ],
    },
    pillars: {
      eyebrow: "PANGUNAHING RUTA",
      title: "Tuklasin ang inaalok ng Leonix ngayon",
      intro: "Magsimula sa magazine o diretso sa mga lugar na madalas gamitin ng pamilya at lokal na negosyo.",
      items: [
        {
          title: "Ang Magazine",
          description: "Digital edition at print presence na may kwento ng komunidad, kultura, at negosyo.",
          href: "/magazine",
        },
        {
          title: "Classifieds",
          description: "Paupahan, trabaho, kotse, binebentang gamit, at iba pang lokal na oportunidad sa isang lugar.",
          href: "/clasificados",
        },
        {
          title: "Mga Lokal na Negosyo",
          description: "Tuklasin ang negosyo sa komunidad at kumonekta sa mga naglilingkod malapit sa iyo.",
          href: "/negocios-locales",
        },
        {
          title: "Mga Community Resource",
          description: "Organisasyon, suporta, at kapaki-pakinabang na tool para sa pamilya at lokal na lider.",
          href: "/recursos-comunitarios",
        },
      ],
    },
    destacados: {
      eyebrow: "DESTACADO",
      title: "Mga negosyong destacado sa komunidad",
      intro:
        "Premium na espasyo para sa negosyong sumusuporta at kumokonekta sa ating komunidad. Dito makikita ang kumpirmadong advertiser ng Leonix Media.",
      reserved: "Malapit na: destacadong espasyo para sa premium advertiser.",
      viewCta: "Tingnan ang negosyo",
      advertiseCta: "Mag-advertise sa amin",
    },
    convert: {
      eyebrow: "MANATILING KONEKTADO",
      title: "Maging bahagi ng komunidad ng Leonix",
      body: "Tumanggap ng update sa magazine at lokal na oportunidad, o i-reserve ang iyong espasyo bilang premium advertiser.",
      newsletterCta: "Sumali sa newsletter",
      advertiseCta: "Mag-advertise sa amin",
      contactCta: "Kontak",
      newsletterPlaceholder: "Ang iyong email",
      newsletterAria: "Newsletter signup mula sa Home",
      emailLabel: "Email",
    },
  },
};
