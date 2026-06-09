import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getEsCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "Inicio", href: "#inicio", active: true },
      { label: "Qué obtienes", href: "#que-obtienes" },
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Acceso QR", href: "#qr" },
      { label: "Contacto", href: "#contacto" },
    ],
    launchCta: "Únete al lanzamiento",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — Inicio",
    navAria: "Navegación principal",
    langAria: "Idioma",
    hero: {
      badge: "PRÓXIMAMENTE",
      title: "Leonix Media",
      valueLines: [
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
      paragraph:
        "Conecta tu negocio con la comunidad latina y multicultural del Bay Area a través de una revista premium, presencia digital bilingüe y herramientas que convierten la atención en acción.",
      ctas: [
        { label: "Anúnciate con nosotros", variant: "primary" },
        { label: "Ver Media Kit", variant: "secondary" },
        { label: "Únete al lanzamiento", variant: "green" },
      ],
      trustChips: ["Hecho para nuestra comunidad", "Confianza local", "Acción digital"],
      valueAria: "Propuesta de valor",
      trustAria: "Confianza",
      mediaVisual: {
        label: "Revista premium + presencia digital",
        qrOverlay: "Escanea. Elige idioma. Conecta.",
        magazineAlt: "Vista previa decorativa de la revista Leonix Media",
      },
      magazineCta: "Ver edición digital",
    },
    marketplace: {
      eyebrow: "CLASIFICADOS + MARKETPLACE LOCAL",
      headline: "La comunidad viene por lo útil. Los negocios ganan visibilidad.",
      intro:
        "Leonix no es solo publicidad. También estamos construyendo un marketplace local donde la comunidad puede buscar, publicar y compartir oportunidades reales: rentas, empleos, autos privados, cosas en venta, eventos, comida, mascotas y más.",
      bridge:
        "Más razones para visitar Leonix significa más oportunidades para que los negocios sean vistos.",
      cardsAria: "Categorías del marketplace local",
      cards: [
        {
          title: "Varios gratis",
          body: "Cosas en venta, artículos del hogar, herramientas, ropa y más. Publicaciones pensadas para atraer tráfico local y compartir oportunidades entre vecinos.",
        },
        {
          title: "Rentas",
          body: "Cuartos, apartamentos, espacios y oportunidades de vivienda con fotos, descripción, ubicación, precio y contacto.",
        },
        {
          title: "Empleos",
          body: "Negocios que están contratando pueden conectar con personas de la comunidad que buscan trabajo y nuevas oportunidades.",
        },
        {
          title: "Autos privados",
          body: "Publicaciones de autos con fotos, descripción, precio y contacto para compradores locales.",
        },
        {
          title: "Comida + eventos",
          body: "Pop-ups, comida local, actividades, eventos comunitarios y momentos que hacen que la gente regrese.",
        },
        {
          title: "Busco + mascotas",
          body: "La comunidad también puede buscar, compartir necesidades, conectar por mascotas, objetos perdidos, adopciones o apoyo local.",
        },
      ],
      closing:
        "Clasificados trae tráfico. Negocios Locales convierte esa atención en llamadas, visitas y clientes.",
      exploreCta: { label: "Explorar Clasificados" },
    },
    whatYouGet: {
      eyebrow: "QUÉ OBTIENES",
      headline: "Más que un anuncio: una presencia completa para tu negocio.",
      intro:
        "Leonix combina una revista impresa mensual, un perfil central en Negocios Locales y acciones por QR para ayudar a que más clientes encuentren, entiendan y contacten tu negocio.",
      expandMore: "Ver más",
      expandLess: "Ver menos",
      cards: [
        {
          title: "Revista impresa mensual",
          body: "Tu negocio puede aparecer en una revista mensual diseñada para conectar con la comunidad latina local.",
          detail:
            "Leonix publica una revista impresa mensual en español para visibilidad local de confianza. La colocación en impreso depende de tu paquete publicitario — no todo negocio aparece en cada edición sin contrato.",
          accent: "burgundy",
        },
        {
          title: "Presencia digital bilingüe",
          body: "Tu negocio también puede aparecer en páginas Leonix con formularios y acciones nativas en el idioma que elijan tus clientes.",
          detail:
            "Las páginas digitales complementan tu anuncio impreso y tu perfil en Negocios Locales con información compartible a la que los clientes pueden volver desde su celular.",
          accent: "gold",
        },
        {
          title: "QR + acciones reales",
          body: "Convierte la atención impresa en llamadas, mensajes, mapas, visitas web, redes sociales, ofertas y rutas de contacto.",
          detail:
            "El QR conecta cada edición mensual con acción digital. Los lectores pueden escanear, usar herramientas de traducción del teléfono o las páginas Leonix en su idioma, y llegar a tu negocio sin saltar de plataforma en plataforma.",
          accent: "qr",
        },
        {
          title: "Negocios Locales + presencia digital",
          body: "Creamos una página central para tu negocio donde los clientes pueden encontrar tus redes, sitio web, teléfono, ubicación, fotos, reseñas, ofertas y formas de contacto en un solo lugar.",
          detail:
            "Negocios Locales es más que un anuncio — reúne tu presencia en línea para que los clientes descubran y exploren tu negocio sin buscar en plataformas separadas.",
          accent: "green",
        },
        {
          title: "Oportunidad de lanzamiento fundador",
          body: "Sé parte de los primeros negocios en aparecer con Leonix Media durante la etapa de lanzamiento.",
          detail:
            "Durante el lanzamiento, los primeros negocios ayudan a construir la red inicial de Leonix Media. Es una oportunidad de visibilidad temprana — no un formato publicitario aparte.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "CÓMO FUNCIONA",
      headline: "Un proceso claro para lanzar tu presencia con Leonix.",
      intro:
        "Te guiamos desde la información inicial hasta una presencia lista para imprimir, compartir y conectar.",
      stepsAria: "Pasos del proceso",
      steps: [
        {
          title: "Elige tu presencia",
          body: "Selecciona si quieres aparecer en la revista impresa mensual, crear tu presencia digital en Negocios Locales, activar acciones por QR o combinar varias opciones de lanzamiento.",
        },
        {
          title: "Envíanos tu información",
          body: "Compártenos logo, fotos, teléfono, dirección, redes, enlaces, oferta y los detalles principales de tu negocio.",
        },
        {
          title: "Preparamos tu presencia",
          body: "Organizamos tu anuncio, tu información digital y los elementos que ayudan al cliente a entender y contactar tu negocio.",
        },
        {
          title: "Lanza y conecta",
          body: "Tu negocio queda listo para aparecer ante la comunidad y convertir interés en llamadas, mensajes, visitas y conexiones.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "ACCESO QR",
      headline: "Del anuncio impreso al celular del cliente.",
      intro:
        "Cada edición mensual puede conectar la revista física con acciones digitales: escanear, traducir, abrir mapa, llamar, visitar redes, ver ofertas y contactar al negocio.",
      callout: "Escanea. Traduce. Lee. Conecta.",
      explanation:
        "Cuando se distribuye la revista impresa, los lectores pueden escanear códigos QR en los anuncios. Para leer la revista visual, pueden usar la cámara del teléfono, Google Lens, Google Translate o Apple Live Text en páginas impresas, pantallas de escritorio o capturas. Para navegar el sitio Leonix, pueden usar las páginas traducidas de Leonix o el modo sitio web de Google Translate como apoyo. Los formularios nativos de contacto y publicidad de Leonix siguen siendo la ruta oficial de contacto.",
      mobileNote:
        "En el celular, no escanees tu propia pantalla. Usa primero las páginas y resúmenes de Leonix en tu idioma. Google Lens y Apple Live Text son opcionales para impreso o capturas.",
      openReaderLabel: "Ver pasos de traducción QR",
      heroStripSummary:
        "Cada edición impresa mensual puede conectar lectores con llamadas, mapas, enlaces, redes y formularios nativos de Leonix.",
      detailNote: "Guía detallada de traducción QR",
      benefitsAria: "Beneficios del acceso QR",
      benefits: [
        {
          title: "Del impreso al celular",
          body: "El QR convierte la atención de la revista en llamadas, mapas, visitas web, redes, ofertas y formularios nativos de contacto.",
        },
        {
          title: "Cámara y traducción web",
          body: "Google Lens, Google Translate y Apple Live Text ayudan a leer páginas visuales. El modo sitio web de Google Translate ayuda a navegar Leonix — los formularios nativos siguen siendo oficiales.",
        },
        {
          title: "Revista visual original en español",
          body: "La edición visual PDF/FlipHTML5 permanece en español. Leonix no promete una revista visual totalmente traducida.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "MEDIA KIT",
      headline: "Lo que encontrarás en el Media Kit",
      intro:
        "El Media Kit reúne la explicación completa de cómo Leonix Media combina revista impresa, presencia digital, QR, acciones reales y paquetes publicitarios para ayudar a que tu negocio se vea mejor y sea más fácil de contactar.",
      pdfHonestyLine:
        "El PDF descargable puede ser la edición original en español mientras preparamos versiones traducidas. El sitio explica las opciones en tu idioma.",
      cardsAria: "Contenido del Media Kit",
      cards: [
        {
          title: "Por qué anunciarte con Leonix",
          body: "Conoce cómo Leonix ayuda a crear alcance, confianza y acción para negocios locales que quieren conectar con la comunidad latina y multicultural.",
        },
        {
          title: "QR + botones de acción",
          body: "Mira cómo un anuncio impreso puede llevar al cliente a llamar, abrir el mapa, enviar mensaje, visitar tu sitio web, ver redes sociales, reseñas y más.",
        },
        {
          title: "Negocios Locales + presencia digital",
          body: "Entiende cómo tu negocio puede tener una presencia organizada con teléfono, dirección, mapa, fotos, reseñas, redes, sitio web y botones de contacto.",
        },
        {
          title: "Paquetes y próximos pasos",
          body: "Revisa las opciones de publicidad, niveles de visibilidad y el proceso para empezar con Leonix Media.",
        },
      ],
      ctaHeading: "¿Listo para ver los detalles?",
      viewCta: { label: "Ver Media Kit" },
      downloadCta: { label: "Descargar Media Kit" },
      requestInfoCta: { label: "Solicitar información publicitaria" },
      supportingLine:
        "Abre el Media Kit para ver formatos, beneficios, paquetes y próximos pasos.",
    },
    digitalMagazine: {
      eyebrow: "REVISTA DIGITAL",
      headline: "Edición visual original + apoyo multilingüe",
      intro:
        "Puedes abrir la revista visual original en español y ver sus páginas tal como fueron diseñadas. Leonix también ofrece resúmenes, destacados y acciones rápidas en tu idioma seleccionado cuando están disponibles.",
      visualNote:
        "Las páginas visuales de la revista (PDF/FlipHTML5) son la edición original en español — no una traducción automática de todo el arte.",
      highlightsNote:
        "Usa las páginas Leonix para contexto y CTAs en tu idioma. Google Lens o capturas pueden ayudar a leer páginas visuales. Un futuro compañero HTML mejorará el alcance multilingüe sin reemplazar la edición visual original.",
      mobileNote:
        "En móvil, elige tu idioma en Leonix y usa los resúmenes. Las herramientas de cámara del teléfono pueden ayudar con páginas impresas o en pantalla — no escanees tu propia pantalla para traducir.",
      readHighlightsCta: { label: "Leer destacados en tu idioma" },
      openOriginalCta: { label: "Abrir revista digital original" },
      learnQrCta: { label: "Cómo funciona el acceso QR" },
    },
    finalCta: {
      eyebrow: "LISTO PARA LANZAR",
      headline: "Reserva tu espacio antes del lanzamiento.",
      body: "Leonix Media está preparando su lanzamiento para conectar negocios locales con la comunidad latina y multicultural del Bay Area. Si quieres aparecer desde el inicio, este es el momento de levantar la mano.",
      ctas: [
        { label: "Anúnciate con nosotros", variant: "primary" },
        { label: "Ver Media Kit", variant: "secondary", external: true },
        { label: "Únete al lanzamiento", variant: "green" },
      ],
      mediaKitDownload: { label: "Descargar Media Kit" },
    },
    contact: {
      title: "Contacto",
      body: "¿Tienes preguntas sobre publicidad, el Media Kit o la etapa de lanzamiento? Contáctanos y te ayudamos a elegir el mejor camino para tu negocio.",
      emailLabel: "Correo",
      email: "info@leonixmedia.com",
      phoneLabel: "Teléfono",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "Dirección",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "Área",
      area: "San José • Silicon Valley • Comunidad Latina",
    },
    newsletter: {
      title: "Sé parte del lanzamiento",
      body: "Recibe noticias, oportunidades y actualizaciones de Leonix Media.",
      placeholder: "Tu correo electrónico",
      button: "Notifícame",
      formAria: "Registro al boletín",
      emailLabel: "Correo electrónico",
    },
    footer: "© 2026 Leonix Media. Hecho para nuestra comunidad.",
  });
}
