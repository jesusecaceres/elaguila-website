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
    readerPreviewBadge: "Acceso y traducción",
    readerPreviewTitle: "Lee Leonix a tu manera",
    readerPreviewIntro:
      "Leonix mantiene su identidad en español para servir primero a nuestra comunidad. El QR extiende cada página impresa a la experiencia digital, y herramientas como Google Lens o la traducción de tu navegador o dispositivo pueden ayudarte a entenderla cuando lo necesites — sin que Leonix tenga que publicar cada idioma por separado.",
    readerPreviewSecondary:
      "El mismo QR también te conecta directo con el perfil de un negocio, un clasificado, un sitio web, el mapa, una llamada, un mensaje o un destino digital de Leonix.",
    futureFlipbookNote:
      "El diseño visual —PDF y flipbook— permanece en español: la edición original de Leonix Media.",
    originalEditionNote:
      "La edición visual mantiene su diseño original en español, lista para leer, descargar o compartir.",
    originalEditionTitle: "Edición actual (español)",
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
      body: "Leonix Media es más que publicidad: es la revista de nuestra comunidad. Cada edición reúne historias locales, editoriales comunitarias, recursos útiles, eventos, contenido juvenil y familiar, deportes, comida y cultura — junto con los negocios que hacen posible todo esto.",
      bullets: [
        "Historias, cultura y vida comunitaria del Bay Area.",
        "Recursos prácticos, eventos y oportunidades locales.",
        "Publicidad que conecta a los lectores con negocios y servicios útiles.",
        "Puente hacia la revista digital, Negocios Locales y Clasificados por QR.",
      ],
    },
    {
      id: "family-inspiration",
      title: "Familia, inspiración y El Águila",
      body: "Leonix Media nació al ver a un familiar cercano dedicar años a conectar negocios y comunidad a través de El Águila. Esa experiencia inspiró una pregunta: ¿cómo servir hoy a la comunidad con nuevas herramientas y tecnología? Leonix es nuestra propia respuesta — una marca y plataforma independiente, construida con gratitud hacia esa inspiración familiar.",
      bullets: [
        "El Águila y Leonix Media son organizaciones separadas, cada una con su propia identidad.",
        "Compartimos una conexión familiar y un respeto mutuo, no una estructura corporativa en común.",
        "Cuando tiene sentido, nos apoyamos — por ejemplo, El Águila puede ayudar a dar a conocer Leonix en sus propias redes y canales comunitarios.",
      ],
    },
    {
      id: "classifieds",
      title: "Vista previa de clasificados",
      body: "Leonix Clasificados es un marketplace comunitario amplio: rentas, empleos, autos, artículos en venta, comunidad y eventos, comida local, mascotas y perdidos, busco/se busca, clases y más. Cada anuncio te deja actuar de inmediato — con fotos, mapa, teléfono, SMS, WhatsApp, correo o sitio web del anunciante cuando están disponibles.",
      bullets: [
        "Rentas, empleos, autos, artículos en venta y más categorías comunitarias.",
        "Contacto directo: llamada, mensaje, WhatsApp, correo o sitio web del vendedor.",
        "Un anuncio en español puede llegar también a lectores en inglés gracias a la presentación bilingüe donde el sistema lo permite.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Explorar Clasificados",
    },
    {
      id: "local-business",
      title: "Negocios Locales",
      body: "Has trabajado años construyendo presencia en tu sitio web, Facebook, Instagram, Google, WhatsApp, fotos y video. Negocios Locales reúne esas conexiones en un solo lugar para que un cliente descubra tu trabajo y elija cómo contactarte — sin reemplazar lo que ya construiste.",
      bullets: [
        "Perfil con fotos, video (según el plan), descripción, servicios, horario e idiomas.",
        "Mapa, dirección, sitio web, redes sociales y contacto directo: teléfono, SMS, WhatsApp o correo.",
        "Tu negocio no pierde su voz en español para ser entendido por más clientes — Leonix ofrece presentación bilingüe donde el plan lo soporta.",
      ],
      ctaKey: "negocios",
      ctaLabel: "Explorar Negocios Locales",
    },
    {
      id: "digital-qr-bridge",
      title: "Revista digital y acceso por QR",
      body: "Un anuncio impreso no debe quedarse en el papel. El QR lleva al lector directo a la acción: el perfil del negocio, su sitio web, una llamada, SMS, WhatsApp, el mapa, una oferta, un clasificado o el contenido digital de la revista.",
      bullets: [
        "Escanea desde el anuncio impreso hacia una acción concreta en tu celular.",
        "Cuando ayude, usa Google Lens o la traducción de tu navegador o dispositivo.",
        "El impreso crea la atención; el QR la convierte en acción.",
      ],
    },
    {
      id: "advertise",
      title: "¿Quieres anunciarte?",
      body: "Leonix ofrece varias formas de conectar tu negocio con la comunidad local: revista impresa y digital, presencia en Negocios Locales, Clasificados cuando aplique, radio cuando aplique y acciones directas por QR. Cuéntanos de tu negocio y te mostramos el Media Kit y las formas de participar.",
      ctaKey: "advertise",
      ctaLabel: "Hablar con Leonix sobre publicidad",
    },
    {
      id: "newsletter",
      title: "Únete al boletín",
      body: "Recibe nuevas ediciones, anuncios importantes de Leonix, oportunidades locales, momentos destacados de la comunidad y promociones selectas — sin comprometernos a una frecuencia fija.",
      ctaKey: "newsletter",
      ctaLabel: "Suscribirme al boletín",
    },
    {
      id: "contact",
      title: "Contacto",
      body: "¿Preguntas sobre publicidad, presencia de tu negocio, radio, productos promocionales o alguna alianza? Escríbenos — es el mejor punto de partida para cualquier tema con Leonix.",
      ctaKey: "contact",
      ctaLabel: "Contactar a Leonix",
    },
  ],
};
