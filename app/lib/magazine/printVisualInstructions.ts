/** Language-independent copy for QR print landing — camera translation first, not site lang selector. */

export const PRINT_VISUAL_STEPS = {
  en: [
    "📱 Open a translation camera",
    "📖 Point at the magazine page",
    "🌎 Choose your language",
    "👀 Read through your phone",
    "🔗 Use Leonix links to connect",
  ],
  es: [
    "📱 Abre una cámara de traducción",
    "📖 Apunta a la página de la revista",
    "🌎 Elige tu idioma",
    "👀 Lee desde tu teléfono",
    "🔗 Usa los enlaces de Leonix para conectar",
  ],
} as const;

export const PRINT_QUICK_HELP = {
  heading: { en: "Quick instructions", es: "Instrucciones rápidas" },
  disclaimer: {
    en: "Quick translation help only — these are not full site language options.",
    es: "Solo ayuda rápida de traducción — no son opciones de idioma completo del sitio.",
  },
  lines: {
    es: "Usa Google Lens, Google Translate con cámara o Apple Translate para leer esta revista visual en tu idioma.",
    en: "Use Google Lens, Google Translate camera, or Apple Translate to read this visual magazine in your language.",
    vi: "Dùng Google Lens, camera Google Translate hoặc Apple Translate để đọc tạp chí hình ảnh này bằng ngôn ngữ của bạn.",
    tl: "Gamitin ang Google Lens, Google Translate camera, o Apple Translate para basahin ang magasin na ito sa iyong wika.",
    zh: "使用 Google Lens、Google Translate 相机或 Apple Translate，以你的语言阅读这本视觉杂志。",
  },
} as const;

export const PRINT_FORMAT_GUIDE = {
  printed: {
    heading: { en: "Printed magazine", es: "Revista impresa" },
    steps: {
      en: [
        "Open Google Lens, Google Translate camera, or Apple Translate.",
        "Point your phone at the printed magazine page.",
        "Pick your language.",
        "Read the translated text on your screen.",
        "Then use Leonix for links, contact, Media Kit, and business actions.",
      ],
      es: [
        "Abre Google Lens, Google Translate con cámara o Apple Translate.",
        "Apunta tu teléfono a la página impresa de la revista.",
        "Elige tu idioma.",
        "Lee el texto traducido en tu pantalla.",
        "Luego usa Leonix para enlaces, contacto, Media Kit y acciones de negocio.",
      ],
    },
  },
  digital: {
    heading: { en: "Digital magazine", es: "Revista digital" },
    steps: {
      en: [
        "Open the original digital magazine below.",
        "If it is image-based, browser translate may not work.",
        "Use Google Lens or Apple Translate from another device or from a screenshot.",
        "Return to Leonix for summaries, links, Media Kit, and contact actions.",
      ],
      es: [
        "Abre la revista digital original abajo.",
        "Si es basada en imágenes, la traducción del navegador puede no funcionar.",
        "Usa Google Lens o Apple Translate desde otro dispositivo o desde una captura de pantalla.",
        "Regresa a Leonix para resúmenes, enlaces, Media Kit y acciones de contacto.",
      ],
    },
    browserNote: {
      en: "Browser translate often cannot translate image-based flipbooks or PDF pages — use camera translation instead.",
      es: "La traducción del navegador muchas veces no traduce flipbooks o PDF basados en imágenes — usa traducción con cámara.",
    },
  },
} as const;

export const PRINT_SUMMARY_SECTION = {
  title: { en: "Leonix quick summary", es: "Resumen rápido de Leonix" },
  note: {
    en: "This summary helps, but the original visual magazine remains in Spanish.",
    es: "Este resumen ayuda, pero la revista visual original permanece en español.",
  },
} as const;

export const PRINT_WEBSITE_LANG_NOTE = {
  en: "The Español / English site selector is a website helper for Leonix summaries — it does not translate the full magazine.",
  es: "El selector Español / English del sitio es una ayuda para resúmenes de Leonix — no traduce la revista completa.",
} as const;

export const PRINT_PRIMARY_CTA = {
  openDigital: { en: "Open original digital magazine", es: "Abrir revista digital original" },
  downloadPdf: { en: "Download original PDF", es: "Descargar PDF original" },
  mediaKit: { en: "View Media Kit", es: "Ver Media Kit" },
  contact: { en: "Contact Leonix", es: "Contactar Leonix" },
} as const;
