import type { QrGuideCopy } from "./types";

export const QR_GUIDE_ES: QrGuideCopy = {
  eyebrow: "Guía QR · Traducción",
  backToMagazine: "Volver a la revista",
  heroTitle: "Traduce la revista",
  truthLine:
    "La revista visual está en español. Usa las herramientas de traducción de tu teléfono para leerla en tu idioma.",
  trustNote:
    "Leonix no traduce automáticamente el PDF ni el flipbook. Leonix te da la guía, enlaces, Media Kit y acciones de contacto.",
  decisionPrompt: "¿Cómo estás leyendo la revista?",
  translationOptionsCta: "Ver opciones de traducción",
  cards: {
    printed: {
      title: "Revista impresa",
      steps: [
        "Abre la cámara de tu teléfono, Google Lens, Google Translate con cámara o Apple Live Text.",
        "Apunta a la página impresa.",
        "Toca Traducir / elige tu idioma.",
        "Regresa a Leonix para enlaces, contacto, Media Kit y acciones.",
      ],
      announcement:
        "Cuando recibas la revista impresa, podrás escanear el QR y usar el mismo proceso descrito aquí.",
    },
    desktop: {
      title: "Revista digital en computadora, tableta u otra pantalla",
      steps: [
        "Abre Google Lens, Google Translate con cámara o Cámara/Live Text de Apple en tu teléfono.",
        "Apunta tu teléfono a la revista en esta pantalla.",
        "Toca Traducir y elige tu idioma.",
        "Regresa a Leonix para enlaces y acciones.",
      ],
      captureNote:
        "En muchos teléfonos puedes capturar el texto traducido para no tener que seguir apuntando a la pantalla.",
      qrLabel: "Escanea para volver a esta guía",
      qrNote:
        "Este QR reabre la guía Leonix en tu teléfono — no abre automáticamente una app de traducción.",
    },
    onPhone: {
      title: "Ya estás en este teléfono",
      intro: "No puedes escanear la pantalla de tu propio teléfono con el mismo teléfono.",
      steps: [
        "Toma una captura de la página de la revista.",
        "Abre la captura en Google Fotos, Google Lens, la app Google o las herramientas de imagen de tu teléfono.",
        "Toca el ícono Lens / Traducir.",
        "Selecciona o resalta el texto con el dedo si hace falta.",
        "Elige tu idioma y lee la traducción.",
      ],
      screenshotPlaceholder:
        "Próximamente: imagen de ejemplo del flujo Lens en captura de pantalla.",
      htmlCompanionComing:
        "Próximamente: abrir versión de texto para una lectura móvil más fácil.",
      openTextVersionLabel: "Abrir versión de texto (próximamente)",
    },
    website: {
      title: "Traducir el sitio Leonix",
      intro: "¿Quieres navegar Leonix en otro idioma?",
      note: "Usa el modo sitio web de Google Translate para explorar Leonix. Esto ayuda a navegar el sitio, no garantiza traducir imágenes del PDF/flipbook. Formularios y CTAs deben usar las páginas nativas de Leonix en tu idioma.",
      ctaLabel: "Traducir sitio Leonix (Google)",
    },
  },
  deviceExpand: {
    apple: {
      title: "iPhone / Apple",
      steps: [
        "Abre Cámara y apunta al texto de la revista.",
        "Toca el ícono de Texto en vivo cuando aparezca, luego Traducir.",
        "O abre Fotos → selecciona una captura → toca Traducir.",
        "La interfaz puede variar según la versión de iOS.",
      ],
    },
    android: {
      title: "Android / Google",
      steps: [
        "Abre Google Lens, la app Google o Google Translate con cámara.",
        "Toca el ícono Lens en la barra de búsqueda, cámara o galería.",
        "Apunta a la página o abre una captura de pantalla.",
        "Resalta el texto con el dedo si hace falta y elige tu idioma.",
      ],
    },
  },
  websiteLangNote:
    "El selector 🌐 Languages ayuda el sitio Leonix — no traduce la revista visual.",
  summaryTitle: "Resumen rápido de Leonix",
  summaryNote:
    "Este resumen ayuda, pero la revista visual original permanece en español.",
  actionsEyebrow: "Acciones Leonix",
  actions: {
    openDigital: "Abrir revista digital original",
    downloadPdf: "Descargar PDF original",
    mediaKit: "Ver Media Kit",
    contact: "Contactar Leonix",
  },
};
