/** Language-independent copy for QR print landing — camera translation first, not site lang selector. */

export const PRINT_HERO = {
  title: {
    en: "SCAN → TRANSLATE → READ → CONNECT",
    es: "ESCANEA → TRADUCE → LEE → CONECTA",
  },
  explanation: {
    en: "This magazine is a Spanish visual magazine. Use your phone camera translation tools to read it in your language.",
    es: "Esta revista visual está en español. Usa herramientas de traducción con cámara de tu teléfono para leerla en tu idioma.",
  },
  trustNote: {
    en: "Leonix gives you the guide, links, Media Kit, and contact actions. Your phone translation app helps read the magazine page.",
    es: "Leonix te da la guía, enlaces, Media Kit y acciones de contacto. Tu app de traducción ayuda a leer la página de la revista.",
  },
} as const;

export const PRINT_APP_LAUNCHERS = {
  heading: {
    en: "Start with a translation app",
    es: "Empieza con una app de traducción",
  },
  helper: {
    en: "Tap one option below. If it does not open on your phone, use the simple steps underneath.",
    es: "Toca una opción abajo. Si no se abre en tu teléfono, usa los pasos simples de abajo.",
  },
  googleLens: {
    label: { en: "Open Google Lens", es: "Abrir Google Lens" },
    href: "https://lens.google/",
  },
  googleTranslate: {
    label: { en: "Open Google Translate", es: "Abrir Google Translate" },
    href: "https://translate.google.com/",
  },
  iphoneSteps: {
    label: { en: "iPhone: translation steps", es: "iPhone: pasos de traducción" },
    hash: "iphone-translation-steps",
  },
  androidSteps: {
    label: { en: "Android: camera steps", es: "Android: pasos con cámara" },
    hash: "android-translation-steps",
  },
  disclaimer: {
    en: "App buttons may open differently depending on your phone, browser, and installed apps.",
    es: "Los botones pueden abrirse de forma diferente según tu teléfono, navegador y apps instaladas.",
  },
} as const;

export const PRINT_DESKTOP_HELPER = {
  heading: {
    en: "On desktop or another device?",
    es: "¿Estás en computadora u otro dispositivo?",
  },
  copy: {
    en: "Open the magazine on this screen, then use your phone translation app to point at the magazine page.",
    es: "Abre la revista en esta pantalla y usa la app de traducción de tu teléfono para apuntar a la página de la revista.",
  },
  qrLabel: {
    en: "Scan to reopen this help guide",
    es: "Escanea para volver a abrir esta guía",
  },
  qrNote: {
    en: "This QR reopens the Leonix help guide — it does not automatically open a translator app.",
    es: "Este QR vuelve a abrir la guía de Leonix — no abre automáticamente una app de traducción.",
  },
} as const;

export const PRINT_ALREADY_ON_PHONE = {
  heading: {
    en: "Already on your phone?",
    es: "¿Ya estás en tu teléfono?",
  },
  intro: {
    en: "You cannot scan your own phone screen with the same phone. Use one of these options:",
    es: "No puedes escanear la pantalla de tu propio teléfono con el mismo teléfono. Usa una de estas opciones:",
  },
  steps: {
    en: [
      "Open the magazine on a desktop, tablet, or another phone.",
      "Use Google Lens, Google Translate, or Apple Translate to point at that screen.",
      "Or take a screenshot of the magazine page and translate the screenshot/image.",
      "Return to Leonix for links, summaries, Media Kit, and contact actions.",
    ],
    es: [
      "Abre la revista en una computadora, tableta u otro teléfono.",
      "Usa Google Lens, Google Translate o Apple Translate para apuntar a esa pantalla.",
      "O toma una captura de la página de la revista y traduce la imagen.",
      "Regresa a Leonix para enlaces, resumen, Media Kit y contacto.",
    ],
  },
} as const;

export const PRINT_DEVICE_STEPS = {
  iphone: {
    id: "iphone-translation-steps",
    heading: { en: "iPhone / Apple Translate", es: "iPhone / Apple Translate" },
    steps: {
      en: [
        "Open the Camera app and point at the magazine text.",
        "Tap the Live Text icon when it appears, then choose Translate.",
        "Or open Photos → select a screenshot → tap Translate (top-right).",
        "Pick your language and read the translation on screen.",
      ],
      es: [
        "Abre la app Cámara y apunta al texto de la revista.",
        "Toca el ícono de Texto en vivo cuando aparezca, luego elige Traducir.",
        "O abre Fotos → selecciona una captura → toca Traducir (arriba a la derecha).",
        "Elige tu idioma y lee la traducción en pantalla.",
      ],
    },
  },
  android: {
    id: "android-translation-steps",
    heading: { en: "Android / Google camera", es: "Android / cámara Google" },
    steps: {
      en: [
        "Open the Google app or Google Lens.",
        "Tap the Lens / camera icon in the search bar.",
        "Point at the magazine page or upload a screenshot.",
        "Select text and choose your language to read the translation.",
      ],
      es: [
        "Abre la app Google o Google Lens.",
        "Toca el ícono de Lens / cámara en la barra de búsqueda.",
        "Apunta a la página de la revista o sube una captura de pantalla.",
        "Selecciona el texto y elige tu idioma para leer la traducción.",
      ],
    },
  },
} as const;

export const PRINT_VISUAL_STEPS = {
  en: [
    "📱 Open a translation app",
    "📖 Point at the magazine page",
    "🌎 Choose your language",
    "👀 Read on your phone",
    "🔗 Use Leonix to connect",
  ],
  es: [
    "📱 Abre una app de traducción",
    "📖 Apunta a la página de la revista",
    "🌎 Elige tu idioma",
    "👀 Lee en tu teléfono",
    "🔗 Usa Leonix para conectar",
  ],
} as const;

export const PRINT_QUICK_HELP = {
  heading: {
    en: "Quick instructions in other languages",
    es: "Instrucciones rápidas en otros idiomas",
  },
  disclaimer: {
    en: "Instruction text only — not full website language options.",
    es: "Solo texto instructivo — no son opciones de idioma completo del sitio.",
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
    heading: {
      en: "If you have the printed magazine",
      es: "Si tienes la revista impresa",
    },
    steps: {
      en: [
        "Open Google Lens, Google Translate camera, or Apple Translate.",
        "Point your phone at the printed magazine page.",
        "Pick your language.",
        "Read the translated text on your screen.",
        "Use Leonix for links, contact, Media Kit, and business actions.",
      ],
      es: [
        "Abre Google Lens, Google Translate con cámara o Apple Translate.",
        "Apunta tu teléfono a la página impresa de la revista.",
        "Elige tu idioma.",
        "Lee la traducción en tu pantalla.",
        "Usa Leonix para enlaces, contacto, Media Kit y acciones de negocio.",
      ],
    },
  },
  digital: {
    heading: {
      en: "If you are viewing the digital magazine",
      es: "Si estás viendo la revista digital",
    },
    steps: {
      en: [
        "Open the original digital magazine.",
        "If it appears as images, browser translate may not work.",
        "Use another device or a screenshot with Google Lens, Google Translate, or Apple Translate.",
        "Return to Leonix for links, summaries, Media Kit, and contact actions.",
      ],
      es: [
        "Abre la revista digital original.",
        "Si aparece como imágenes, la traducción del navegador puede no funcionar.",
        "Usa otro dispositivo o una captura con Google Lens, Google Translate o Apple Translate.",
        "Regresa a Leonix para enlaces, resumen, Media Kit y contacto.",
      ],
    },
    browserNote: {
      en: "Browser translate often cannot translate image-based flipbooks or PDF pages — use camera or screenshot translation instead.",
      es: "La traducción del navegador muchas veces no traduce flipbooks o PDF basados en imágenes — usa traducción con cámara o captura.",
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
  en: "The Español / English site selector helps the Leonix website — it does not translate the visual magazine.",
  es: "El selector Español / English ayuda el sitio de Leonix — no traduce la revista visual.",
} as const;

export const PRINT_PRIMARY_CTA = {
  openDigital: { en: "Open original digital magazine", es: "Abrir revista digital original" },
  downloadPdf: { en: "Download original PDF", es: "Descargar PDF original" },
  mediaKit: { en: "View Media Kit", es: "Ver Media Kit" },
  contact: { en: "Contact Leonix", es: "Contactar Leonix" },
} as const;
