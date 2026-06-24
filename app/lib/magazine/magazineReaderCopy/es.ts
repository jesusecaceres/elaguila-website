import type { MagazineReaderLangBundle } from "./types";

export const MAGAZINE_READER_ES: MagazineReaderLangBundle = {
  issueMeta: {
    title: "Leonix Media — Revista Junio 2026",
    monthLabel: "Junio",
  },
  ui: {
    languageEyebrow: "IDIOMA DE LECTURA",
    originalMagazineLabel: "Revista original en español",
    languageChooserHint: "Elija un idioma para leer los anuncios y la información principal.",
    readerPreviewBadge: "Vista de lectura traducida",
    readerPreviewIntro:
      "Esta vista resume anuncios, clasificados y contacto en su idioma. La edición visual impresa y digital permanece en español.",
    futureFlipbookNote:
      "Las ediciones visuales completas en inglés o vietnamita serán archivos separados cuando estén disponibles. Hoy, el flipbook y PDF originales permanecen en español.",
    originalEditionNote:
      "La edición visual original está en español. Esta vista ayuda a leer la información principal en su idioma.",
    originalEditionTitle: "Edición visual original (español)",
    viewFlipbookSpanish: "Ver flipbook en español",
    downloadPdf: "Descargar PDF original",
    viewMediaKit: "Ver Media Kit",
    openFullReader: "Abrir lector completo",
    backToMagazine: "Volver a la revista",
    backToComingSoon: "Volver a Próximamente",
    readPageTitle: "Lector — Junio 2026",
    readPageSubtitle:
      "La revista visual original sigue en español. Este lector te ayuda a entender la información principal en tu idioma seleccionado.",
    issuePageTitle: "Edición Junio 2026",
    issuePageIntro:
      "La edición de lanzamiento de Leonix Media conecta negocios locales, comunidad, cultura y oportunidades. Elija cómo explorarla.",
    issuePageReaderCta: "Abrir lector traducido",
    issuePageHubCta: "Ir al hub de la revista",
    closeFlipbook: "Cerrar",
    langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
    printSourceBadge: "DESDE IMPRESO · QR",
    printSourceTitle: "Bienvenido desde la revista impresa",
    printSourceIntro:
      "Escaneaste el QR de Leonix. Este lector es el puente multilingüe: elige idioma, lee resúmenes y acciones, y abre la edición visual original cuando quieras.",
    printSourceStepScan: "Escanea el QR desde materiales impresos o digitales de Leonix.",
    printSourceStepLanguage: "Elige tu idioma en Leonix para leer resúmenes e información local.",
    printSourceStepHighlights: "Usa los resúmenes y CTAs en tu idioma — el sitio es el puente multilingüe.",
    printSourceStepOriginal:
      "Abre la revista digital original (PDF/flipbook) cuando quieras ver la edición visual en español.",
    printSourceMobileNote:
      "Si ya estás en el celular, no escanees tu propia pantalla. Usa el selector de idioma arriba y este lector.",
    printQrCaption: "QR oficial · Junio 2026 · leonixmedia.com",
    openLanguageReader: "Abrir lector en tu idioma",
    mediaKitPdfEsLabel: "Media Kit (PDF español original)",
    mediaKitPdfEnLabel: "Media Kit (PDF English)",
  },
  sections: [
    {
      id: "about-leonix",
      title: "Sobre Leonix Media",
      body: "Leonix Media conecta negocios locales con la comunidad latina y multicultural del Bay Area a través de publicidad impresa en español, presencia digital bilingüe y herramientas que convierten la atención en llamadas, visitas y conexiones reales.",
    },
    {
      id: "about-magazine",
      title: "Sobre El Águila y la revista",
      body: "Leonix Media es la revista premium del ecosistema El Águila: comunidad, cultura y negocios en una edición digital e impresa. La edición de junio 2026 reúne historias locales, anuncios de negocios, inspiración comunitaria y puentes hacia el marketplace de clasificados.",
      bullets: [
        "Revista impresa premium diseñada para la comunidad latina local.",
        "Edición digital con flipbook y PDF en español (original visual).",
        "Conexión con clasificados, Negocios Locales y acciones por QR.",
      ],
    },
    {
      id: "featured-ads",
      title: "Vista previa de anuncios destacados",
      body: "Esta edición incluye espacios publicitarios para negocios locales. Los anuncios muestran la categoría, el mensaje principal y la información de contacto original del anunciante — sin nombres inventados ni precios en esta vista de lectura.",
      bullets: [
        "Restaurantes y comida local — menú, ubicación y contacto del anunciante.",
        "Servicios profesionales — plomería, electricidad, limpieza y reparaciones.",
        "Salud, belleza y bienestar — clínicas, dentistas y servicios comunitarios.",
        "Cultura, deportes, recetas e inspiración para la comunidad.",
      ],
    },
    {
      id: "classifieds",
      title: "Vista previa de clasificados",
      body: "Leonix no es solo publicidad. El marketplace local conecta a la comunidad con oportunidades reales: rentas, empleos, autos privados, artículos en venta, eventos, comida, mascotas y más.",
      bullets: [
        "Rentas y vivienda en el Bay Area.",
        "Empleos y oportunidades de trabajo local.",
        "Autos privados, artículos en venta y servicios comunitarios.",
        "Busco, mascotas y apoyo local.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Explorar clasificados",
    },
    {
      id: "local-business",
      title: "Vista previa de perfil de negocio local",
      body: "Negocios Locales organiza teléfono, dirección, mapa, redes sociales, fotos y enlaces en una sola presencia digital. Los datos comerciales y de contacto se mantienen en su forma original.",
      bullets: [
        "Teléfono, dirección y redes del negocio — sin traducción automática de datos comerciales.",
        "Mapa, llamadas y mensajes desde el celular.",
        "Fotos, reseñas y enlaces importantes en un solo lugar.",
      ],
    },
    {
      id: "qr-access",
      title: "Revista digital y acceso multilingüe por QR",
      body: "La revista mantiene su identidad en español para servir primero a nuestra comunidad latina. Con el QR, los clientes abren la experiencia digital y pueden usar herramientas de traducción del dispositivo o navegador cuando lo necesiten.",
      bullets: [
        "Escanea desde el anuncio impreso hacia acciones concretas en el celular.",
        "Traducción del navegador, Google Lens o Apple Translate cuando aplique.",
        "Esta vista de lectura estructurada complementa — no reemplaza — el flipbook visual en español.",
      ],
      ctaKey: "comingSoon",
      ctaLabel: "Conocer Leonix Media",
    },
    {
      id: "advertise",
      title: "¿Quieres anunciarte?",
      body: "Conecta tu negocio con lectores locales a través de la revista impresa, edición digital y presencia bilingüe. Contáctanos para conocer el Media Kit y opciones de lanzamiento — sin precios ni garantías en esta vista.",
      ctaKey: "advertise",
      ctaLabel: "Anúnciate con nosotros",
    },
    {
      id: "newsletter",
      title: "Únete al boletín",
      body: "Sé de los primeros en recibir nuevas ediciones, anuncios importantes, oportunidades locales y actualizaciones de Leonix Media.",
      ctaKey: "newsletter",
      ctaLabel: "Suscribirme al boletín",
    },
    {
      id: "contact",
      title: "Contacto / solicitar más información",
      body: "Estamos listos para ayudarte con publicidad, Media Kit y presencia digital. Los datos de contacto comercial se mantienen en su forma original.",
      bullets: [
        "Consultas sobre anuncios en revista impresa y digital.",
        "Media Kit y paquetes de lanzamiento — solicitar detalles por contacto.",
        "Información comercial sin traducción automática en esta vista.",
      ],
      ctaKey: "contact",
      ctaLabel: "Contactar a Leonix Media",
    },
  ],
};
