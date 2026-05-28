export type LeonixComingSoonLang = "es" | "en";

export type LeonixNavItem = { label: string; href: string; active?: boolean };

export type LeonixCategoryCard = {
  title: string;
  subtitle: string;
  tagline: string;
  iconTone: "burgundy" | "green" | "gold";
};

export type LeonixFeatureItem = { title: string; description: string };

export type HeroAccent = "burgundy" | "gold";

export type HeroLinePart = { text: string; accent?: HeroAccent };

export type HeroLine = { parts: HeroLinePart[] };

export type LeonixComingSoonCopy = {
  langToggle: { es: string; en: string };
  nav: LeonixNavItem[];
  navLaunch: string;
  badge: string;
  heroTitle: string;
  heroLines: [HeroLine, HeroLine, HeroLine];
  heroParagraph: string;
  ctaAdvertise: string;
  ctaMediaKit: string;
  ctaLaunch: string;
  trustChips: [string, string, string];
  cards: LeonixCategoryCard[];
  features: LeonixFeatureItem[];
  launchTitle: string;
  launchBody: string;
  emailPlaceholder: string;
  notifyButton: string;
  notifySubmitting: string;
  notifySuccess: string;
  notifyError: string;
  multilingualLabel: string;
  multilingualTitle: string;
  multilingualSummary: [string, string, string];
  multilingualBody: string;
  heroValueLabel: string;
  mobileNavAria: string;
  featureSectionLabel: string;
  categorySectionLabel: string;
  magazineAlt: string;
  magazineCaption: string;
  magazineRibbon: string;
  footerGeo: string;
  footerCopyright: string;
  socialAria: string;
  trustAria: string;
  heroValueAria: string;
  pageAria: string;
};

export const LEONIX_COMING_SOON_COPY: Record<LeonixComingSoonLang, LeonixComingSoonCopy> = {
  es: {
    langToggle: { es: "Español", en: "English" },
    nav: [
      { label: "Inicio", href: "#inicio", active: true },
      { label: "Anúnciate", href: "#anunciate" },
      { label: "Ediciones", href: "#ediciones" },
      { label: "Beneficios", href: "#beneficios" },
      { label: "Sobre Nosotros", href: "#sobre" },
      { label: "Contacto", href: "/contact?lang=es" },
    ],
    navLaunch: "Únete al lanzamiento",
    badge: "PRÓXIMAMENTE",
    heroTitle: "Leonix Media",
    heroLines: [
      {
        parts: [
          { text: "Publicidad impresa en " },
          { text: "español", accent: "burgundy" },
          { text: "." },
        ],
      },
      {
        parts: [
          { text: "Exposición digital " },
          { text: "bilingüe", accent: "burgundy" },
          { text: "." },
        ],
      },
      {
        parts: [
          { text: "Acceso " },
          { text: "multilingüe", accent: "burgundy" },
          { text: " por " },
          { text: "QR", accent: "gold" },
          { text: "." },
        ],
      },
    ],
    heroParagraph:
      "Conectando negocios locales con la comunidad latina a través de una revista premium, visibilidad digital y herramientas que generan acción.",
    ctaAdvertise: "Anúnciate con nosotros",
    ctaMediaKit: "Descargar Media Kit",
    ctaLaunch: "Únete al lanzamiento",
    trustChips: ["Hecho para nuestra comunidad", "Confianza local", "Resultados reales"],
    cards: [
      {
        title: "Clasificados",
        subtitle: "Rentas, empleos y varios.",
        tagline: "¡Vende tus cosas gratis!",
        iconTone: "burgundy",
      },
      {
        title: "Nuestros Negocios",
        subtitle: "Restaurantes, servicios, bienes raíces, autos y viajes.",
        tagline: "",
        iconTone: "green",
      },
      {
        title: "Comunidad",
        subtitle: "Clases, recursos y conexiones locales.",
        tagline: "",
        iconTone: "gold",
      },
    ],
    features: [
      {
        title: "Revista mensual premium",
        description: "Contenido local que informa, inspira y conecta.",
      },
      {
        title: "Edición digital semanal",
        description: "Accede desde cualquier dispositivo, donde estés.",
      },
      {
        title: "QR + CTAs",
        description: "Conecta tu anuncio con llamadas, mensajes, mapas y más.",
      },
      {
        title: "Un solo enlace para tu negocio",
        description: "Toda tu información, ofertas y redes en un solo lugar.",
      },
    ],
    launchTitle: "Sé parte del lanzamiento",
    launchBody: "Recibe noticias, oportunidades y el lanzamiento oficial de Leonix Media.",
    emailPlaceholder: "Tu correo electrónico",
    notifyButton: "Notifícame",
    notifySubmitting: "Enviando…",
    notifySuccess: "¡Listo! Te avisaremos cuando lancemos.",
    notifyError: "No pudimos guardar tu correo. Inténtalo de nuevo.",
    multilingualLabel: "Acceso multilingüe",
    multilingualTitle: "Escanea. Traduce. Conecta.",
    multilingualSummary: [
      "Revista impresa en español",
      "Experiencia digital bilingüe",
      "QR: el lector elige idioma con herramientas de escaneo",
    ],
    multilingualBody:
      "La revista impresa llega en español. Lo digital es bilingüe (español e inglés). Al escanear un código QR, los lectores pueden usar herramientas de escaneo y traducción—como Google Lens o Apple Translate—para ver contenido digital en su idioma preferido. Leonix no traduce automáticamente toda la revista impresa a todos los idiomas.",
    heroValueLabel: "En tres líneas",
    mobileNavAria: "Navegación móvil",
    featureSectionLabel: "Herramientas para anunciantes",
    categorySectionLabel: "Para la comunidad",
    magazineAlt: "Vista previa decorativa de la revista Leonix Media",
    magazineCaption: "Vista previa visual — el contenido interactivo vive en esta página.",
    magazineRibbon: "Revista & digital",
    footerGeo: "San José • Silicon Valley • Comunidad Latina",
    footerCopyright: "© 2025 Leonix Media. Todos los derechos reservados.",
    socialAria: "Redes sociales (próximamente)",
    trustAria: "Confianza",
    heroValueAria: "Propuesta principal",
    pageAria: "Leonix Media — Próximamente",
  },
  en: {
    langToggle: { es: "Español", en: "English" },
    nav: [
      { label: "Home", href: "#inicio", active: true },
      { label: "Advertise", href: "#anunciate" },
      { label: "Editions", href: "#ediciones" },
      { label: "Benefits", href: "#beneficios" },
      { label: "About Us", href: "#sobre" },
      { label: "Contact", href: "/contact?lang=en" },
    ],
    navLaunch: "Join the launch",
    badge: "COMING SOON",
    heroTitle: "Leonix Media",
    heroLines: [
      {
        parts: [
          { text: "Spanish " },
          { text: "print advertising", accent: "burgundy" },
          { text: "." },
        ],
      },
      {
        parts: [
          { text: "Bilingual " },
          { text: "digital exposure", accent: "burgundy" },
          { text: "." },
        ],
      },
      {
        parts: [
          { text: "Multilingual ", accent: "burgundy" },
          { text: "access through " },
          { text: "QR", accent: "gold" },
          { text: "." },
        ],
      },
    ],
    heroParagraph:
      "Connecting local businesses with the Latino community through a premium magazine, digital visibility and action-driven tools.",
    ctaAdvertise: "Advertise with us",
    ctaMediaKit: "Download Media Kit",
    ctaLaunch: "Join the launch",
    trustChips: ["Built for our community", "Local trust", "Real results"],
    cards: [
      {
        title: "Classifieds",
        subtitle: "Rentals, jobs and misc.",
        tagline: "Sell your items free!",
        iconTone: "burgundy",
      },
      {
        title: "Local Businesses",
        subtitle: "Restaurants, services, real estate, autos and travel.",
        tagline: "",
        iconTone: "green",
      },
      {
        title: "Community",
        subtitle: "Classes, resources and local connections.",
        tagline: "",
        iconTone: "gold",
      },
    ],
    features: [
      {
        title: "Premium monthly magazine",
        description: "Local content that informs, inspires and connects.",
      },
      {
        title: "Weekly digital edition",
        description: "Access from any device, wherever you are.",
      },
      {
        title: "QR + CTAs",
        description: "Connect your ad with calls, messages, maps and more.",
      },
      {
        title: "One link for your business",
        description: "All your info, offers and socials in one place.",
      },
    ],
    launchTitle: "Be part of the launch",
    launchBody: "Receive news, opportunities and the official Leonix Media launch.",
    emailPlaceholder: "Your email address",
    notifyButton: "Notify Me",
    notifySubmitting: "Sending…",
    notifySuccess: "You're on the list. We'll notify you at launch.",
    notifyError: "We couldn't save your email. Please try again.",
    multilingualLabel: "Multilingual access",
    multilingualTitle: "Scan. Translate. Connect.",
    multilingualSummary: [
      "Print magazine in Spanish",
      "Bilingual digital experience",
      "QR: reader-led language tools on scan",
    ],
    multilingualBody:
      "The print magazine is in Spanish. Digital content is bilingual (Spanish and English). When readers scan a QR code, they can use scan-and-translate tools—such as Google Lens or Apple Translate—to view digital content in their preferred language. Leonix does not automatically translate the entire printed magazine into every language.",
    heroValueLabel: "In three lines",
    mobileNavAria: "Mobile navigation",
    featureSectionLabel: "Tools for advertisers",
    categorySectionLabel: "For the community",
    magazineAlt: "Decorative Leonix Media magazine preview",
    magazineCaption: "Visual preview — interactive content lives on this page.",
    magazineRibbon: "Magazine & digital",
    footerGeo: "San José • Silicon Valley • Latino Community",
    footerCopyright: "© 2025 Leonix Media. All rights reserved.",
    socialAria: "Social media (coming soon)",
    trustAria: "Trust",
    heroValueAria: "Main value proposition",
    pageAria: "Leonix Media — Coming Soon",
  },
};

export const LEONIX_COMING_SOON_NEWSLETTER_SOURCE = "coming-soon-live";

export function leonixAdvertiseHref(lang: LeonixComingSoonLang) {
  return `/contact?lang=${lang}`;
}

export function leonixMediaKitHref(lang: LeonixComingSoonLang) {
  return `/media-kit?lang=${lang}`;
}

export function leonixLaunchHref(lang: LeonixComingSoonLang) {
  return `/contact?interest=launch&lang=${lang}`;
}
