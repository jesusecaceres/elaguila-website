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
        "Leonix combina revista impresa, presencia digital y acciones por QR para ayudar a que más clientes encuentren, entiendan y contacten tu negocio.",
      expandMore: "Ver más",
      expandLess: "Ver menos",
      cards: [
        {
          title: "Revista impresa premium",
          body: "Tu negocio aparece en una publicación diseñada para conectar con la comunidad latina local.",
          detail:
            "Tu anuncio aparece dentro de una revista diseñada para sentirse local, confiable y profesional. La meta no es solo verse bonito; es poner tu negocio frente a una comunidad que quiere apoyar negocios locales.",
          accent: "burgundy",
        },
        {
          title: "Presencia digital bilingüe",
          body: "Tu anuncio también puede vivir en una experiencia digital clara, profesional y fácil de compartir.",
          detail:
            "Tu presencia digital ayuda a que el anuncio no termine en una sola página. Los clientes pueden encontrar tu información, compartirla y volver a verla desde su celular.",
          accent: "gold",
        },
        {
          title: "QR + acciones reales",
          body: "Convierte la atención en llamadas, mensajes, mapas, enlaces, ofertas y más información.",
          detail:
            "El QR ayuda a llevar a las personas desde la revista a una acción concreta: llamar, abrir un mapa, mandar mensaje, visitar un sitio web, ver redes sociales o pedir más información.",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "Una presencia organizada para mostrar teléfono, ubicación, redes, fotos, reseñas y enlaces importantes.",
          detail:
            "Negocios Locales organiza tu información en un solo lugar para que el cliente no tenga que buscar entre plataformas separadas. Teléfono, dirección, mapa, redes, fotos y enlaces pueden vivir juntos.",
          accent: "green",
        },
        {
          title: "Oportunidad de lanzamiento fundador",
          body: "Sé parte de los primeros negocios en aparecer con Leonix Media durante la etapa de lanzamiento.",
          detail:
            "Durante el lanzamiento, los primeros negocios ayudan a construir la red inicial de Leonix Media. Esto crea oportunidad de visibilidad temprana mientras la comunidad empieza a conocer la plataforma.",
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
          title: "Elige tu camino",
          body: "Selecciona el tipo de presencia que quieres: anuncio impreso, presencia digital, QR, Media Kit o paquete de lanzamiento.",
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
        "Escanea el QR para ver pasos simples, o usa el QR del traductor para intentar abrir Google Lens o Google Translate en tu teléfono.",
      callout: "Escanea. Traduce. Lee. Conecta.",
      explanation:
        "Escanea el QR para aprender cómo traducir la revista visual con Google Lens, Google Translate o Apple Translate. Después usa Leonix para abrir enlaces, contactar negocios y ver acciones rápidas.",
      mobileNote:
        "Ya escaneaste el QR — no escanees tu propia pantalla. Usa Google Lens, Google Translate con cámara o Apple Translate sobre la revista impresa o digital.",
      openReaderLabel: "Ver pasos de traducción QR",
      heroStripSummary:
        "Usa la guía QR para traducir la revista visual y regresa a Leonix para enlaces y acciones.",
      detailNote: "Guía detallada de traducción QR",
      benefitsAria: "Beneficios del acceso QR",
      benefits: [
        {
          title: "Traduce con cámara",
          body: "Google Lens, Google Translate con cámara o Apple Translate leen la revista visual en tu idioma.",
        },
        {
          title: "Enlaces y acciones Leonix",
          body: "Después de leer, usa Leonix para llamar, abrir mapas, ver Media Kit y contactar negocios.",
        },
        {
          title: "Revista original en español",
          body: "La edición visual (PDF/flipbook) permanece en español — Leonix no la traduce automáticamente.",
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
      headline: "Abre la edición visual original — con apoyo en tu idioma",
      intro:
        "Puedes abrir la revista digital original y ver sus páginas tal como fueron diseñadas. Leonix también ofrece resúmenes, destacados y acciones rápidas en el idioma que elijas.",
      visualNote:
        "Las páginas visuales de la revista (PDF/FlipHTML5) son la edición original — no una traducción automática de todo el arte.",
      highlightsNote:
        "En el sitio encontrarás resúmenes y CTAs en tu idioma para orientarte sin prometer una revista visual traducida al 100%.",
      mobileNote:
        "En móvil, elige tu idioma en Leonix y usa los resúmenes. No escanees tu propia pantalla para traducir.",
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
