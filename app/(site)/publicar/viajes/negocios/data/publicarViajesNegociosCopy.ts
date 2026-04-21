import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type PublicarViajesNegociosUi = {
  documentTitle: string;
  navBack: string;
  h1: string;
  intro: string;
  /** Short line under H1 — workflow position */
  workflowKicker: string;
  sections: {
    main: string;
    audience: string;
    media: string;
    business: string;
  };
  sectionHints: {
    main: string;
    audience: string;
    media: string;
    business: string;
  };
  workflow: {
    previewWhat: { title: string; body: string };
    afterSubmit: { title: string; body: string };
    moderation: { title: string; body: string };
  };
  trustBar: { title: string; body: string };
  lifecycle: { title: string; intro: string; items: string[] };
  productMode: { title: string; body: string };
  stepLabels: string[];
  activeStepIndex: number;
  offerType: { label: string; options: Record<string, string> };
  ctaType: { label: string; options: Record<string, string> };
  title: { label: string; placeholder: string };
  destination: { label: string; placeholder: string };
  departureCity: { label: string; placeholder: string };
  price: { label: string; placeholder: string };
  duration: { label: string; placeholder: string };
  dates: { label: string; placeholder: string };
  dateUx: {
    modeFixed: string;
    modeFlexible: string;
    modeSeasonal: string;
    start: string;
    end: string;
    note: string;
    previewHint: string;
  };
  shortDescription: { label: string };
  includes: { label: string; placeholder: string };
  audience: {
    families: string;
    couples: string;
    groups: string;
    spanishGuide: string;
    budgetTag: { label: string; empty: string; economy: string; moderate: string; premium: string };
    serviceLanguage: { label: string };
    includesHotel: string;
    includesTransport: string;
    includesFood: string;
  };
  multimedia: {
    heroUrl: { label: string; placeholder: string };
    localFile: { label: string; helper: string };
    clearImage: string;
    tabUrl: string;
    tabFile: string;
    gallery: { label: string; helper: string; placeholder: string };
    galleryAddUrl: string;
    galleryAddFile: string;
    galleryRemove: string;
    galleryMaxNote: string;
    blocks: { hero: string; gallery: string; logo: string; video: string };
    logo: { label: string };
    video: { label: string; placeholder: string };
    videoFile: string;
    videoFileHint: string;
  };
  business: {
    name: { label: string };
    phone: { label: string };
    phoneOffice: { label: string };
    email: { label: string };
    whatsapp: { label: string };
    website: { label: string };
    socials: { label: string; placeholder: string };
    socialSection: string;
    socialFacebook: { label: string };
    socialInstagram: { label: string };
    socialTiktok: { label: string };
    socialYoutube: { label: string };
    socialTwitter: { label: string };
    destinationsServed: { label: string; placeholder: string };
    languages: { label: string; placeholder: string };
  };
  contactUx: {
    websiteHint: string;
    whatsappHint: string;
    ctaExplain: string;
  };
  recovery: {
    title: string;
    wrongLaneBody: string;
    goPrivado: string;
    hubViajes: string;
  };
  previewCta: string;
  /** Back link label on draft-driven preview page */
  previewBackEdit: string;
  resetDraft: string;
  /** Opens honest publish handoff (no live submit) */
  publishHandoffCta: string;
  publishModal: {
    title: string;
    intro: string;
    bullets: string[];
    standardPlus: string;
    honestNote: string;
    close: string;
    /** Primary action — persists staged row and routes to success */
    submitReview: string;
    submitting: string;
  };
  ctaRowHint: string;
};

function es(): PublicarViajesNegociosUi {
  return {
    documentTitle: "Solicitud negocio Viajes · Leonix",
    navBack: "Volver a publicar Viajes",
    h1: "Solicitud de oferta — negocio de viajes",
    intro:
      "Completa un borrador de calidad comercial. Los datos se guardan en Leonix como solicitud en revisión: no es publicación libre al catálogo; un administrador aprueba antes de que aparezca en Viajes público. Leonix no es agencia de reservas ni vendedor final.",
    workflowKicker: "Paso 2 de 4 · Borrador de oferta",
    sections: {
      main: "1. Oferta y logística del viaje",
      audience: "2. Público e inclusiones",
      media: "3. Medios visuales",
      business: "4. Identidad y contacto del negocio",
    },
    sectionHints: {
      main: "Tipo de producto, ruta, precio publicado y qué incluye — lo que un viajero necesita para decidir.",
      audience: "Perfil del viajero y señales de servicio (hotel, transporte, idioma).",
      media: "Imagen principal y material opcional; la subida gestionada llegará con el panel de negocio.",
      business: "Quién responde y cómo te contactan — puede solicitarse verificación antes de publicar.",
    },
    workflow: {
      previewWhat: {
        title: "Qué verás en vista previa",
        body: "Tu borrador en esta pantalla se guarda en el navegador y alimenta la vista previa pública de ejemplo. Titular, destino, inclusiones, negocio y CTAs — coherente con Viajes en Clasificados.",
      },
      afterSubmit: {
        title: "Después del envío (próximamente)",
        body: "Revisión de calidad, posibles solicitudes de documentos o sitio web, y activación en la categoría cuando corresponda al plan Standard / Plus del negocio.",
      },
      moderation: {
        title: "Moderación y confianza",
        body: "Viajes exige más claridad que un clasificado genérico: identidad del negocio, ofertas vigentes y canales de contacto verificables. Los anunciantes nuevos en viajes pueden pasar revisión manual.",
      },
    },
    trustBar: {
      title: "Expectativas de confianza en Viajes",
      body: "Podemos pedir sitio web, redes o teléfono comercial; las ofertas caducadas se retiran. Leonix no es la agencia de reservas — tú sigues siendo el vendedor del servicio.",
    },
    lifecycle: {
      title: "Después, en el panel de negocio (planeado)",
      intro: "Sin backend aún — visión de producto:",
      items: [
        "Editar, pausar o duplicar ofertas",
        "Renovar vigencia y destacados",
        "Subir galería y video con herramientas Leonix",
        "Métricas de clics y leads",
        "Ajustar plan Standard / Plus",
      ],
    },
    productMode: {
      title: "Modo producto actual",
      body: "Vitrina de descubrimiento: sin checkout de viajes en Leonix. El envío crea un registro en cola de moderación; tras aprobación puede aparecer en resultados públicos. Socios comerciales y piezas editoriales siguen gestionándose por canales internos.",
    },
    stepLabels: ["Entrada", "Borrador", "Vista previa", "Envío"],
    activeStepIndex: 1,
    offerType: {
      label: "Tipo de oferta",
      options: {
        "": "Selecciona…",
        paquete: "Paquete",
        tour: "Tour / excursión",
        crucero: "Crucero",
        resort: "Resort / hotel",
        escapada: "Escapada",
      },
    },
    ctaType: {
      label: "Tipo de CTA principal",
      options: {
        whatsapp: "WhatsApp",
        telefono: "Teléfono",
        correo: "Correo",
        sitio: "Sitio web",
      },
    },
    title: { label: "Título", placeholder: "Ej. Riviera Maya todo incluido 5 noches" },
    destination: { label: "Destino", placeholder: "Ciudad, región o país" },
    departureCity: { label: "Ciudad de salida", placeholder: "Ej. San José, SFO…" },
    price: { label: "Precio / precio desde", placeholder: "USD, por persona…" },
    duration: { label: "Duración", placeholder: "Ej. 5 días / 4 noches" },
    dates: { label: "Fechas o rango", placeholder: "Temporada, meses o fechas fijas" },
    dateUx: {
      modeFixed: "Fechas fijas",
      modeFlexible: "Flexible / por acordar",
      modeSeasonal: "Temporada o ventana",
      start: "Inicio",
      end: "Fin",
      note: "Nota (temporada, flexibilidad, blackout…)",
      previewHint: "Vista previa del texto que verá el viajero en la ficha.",
    },
    shortDescription: { label: "Descripción corta" },
    includes: { label: "Qué incluye", placeholder: "Un ítem por línea o párrafo breve" },
    audience: {
      families: "Apto para familias",
      couples: "Para parejas",
      groups: "Para grupos",
      spanishGuide: "Guía en español",
      budgetTag: {
        label: "Etiqueta de presupuesto",
        empty: "—",
        economy: "Económico",
        moderate: "Moderado",
        premium: "Premium",
      },
      serviceLanguage: { label: "Idioma de atención" },
      includesHotel: "Incluye hotel",
      includesTransport: "Incluye transporte",
      includesFood: "Incluye comida",
    },
    multimedia: {
      heroUrl: { label: "Imagen principal (URL de prueba)", placeholder: "https://…" },
      localFile: {
        label: "O sube imagen principal (solo este dispositivo)",
        helper:
          "Archivos grandes van a IndexedDB; URL sigue siendo la opción más ligera. No hay subida a la nube en esta fase.",
      },
      clearImage: "Quitar imagen local / URL en borrador",
      tabUrl: "Enlace URL",
      tabFile: "Archivo local",
      gallery: {
        label: "Galería",
        helper: "Añade hasta 8 imágenes por URL o archivo pequeño (solo este dispositivo).",
        placeholder: "Notas opcionales sobre la galería",
      },
      galleryAddUrl: "Añadir URL",
      galleryAddFile: "Añadir archivo",
      galleryRemove: "Quitar",
      galleryMaxNote: "Máximo 8 imágenes en galería.",
      blocks: {
        hero: "Imagen principal",
        gallery: "Galería",
        logo: "Logo",
        video: "Video",
      },
      logo: { label: "Logo del negocio (URL opcional)" },
      video: { label: "Video (URL opcional)", placeholder: "YouTube o Vimeo" },
      videoFile: "Archivo de video (solo referencia local)",
      videoFileHint: "No subimos video a la nube aquí: guardamos solo el nombre del archivo como referencia en el borrador.",
    },
    business: {
      name: { label: "Nombre del negocio" },
      phone: { label: "Teléfono principal" },
      phoneOffice: { label: "Teléfono oficina / alternativo" },
      email: { label: "Correo de contacto" },
      whatsapp: { label: "WhatsApp" },
      website: { label: "Sitio web" },
      socials: { label: "Redes (texto libre, legado)", placeholder: "@usuario o enlaces" },
      socialSection: "Redes sociales (enlaces)",
      socialFacebook: { label: "Facebook" },
      socialInstagram: { label: "Instagram" },
      socialTiktok: { label: "TikTok" },
      socialYoutube: { label: "YouTube" },
      socialTwitter: { label: "X (Twitter)" },
      destinationsServed: { label: "Destinos que atienden", placeholder: "Separados por coma" },
      languages: { label: "Idiomas", placeholder: "Ej. Español, inglés" },
    },
    contactUx: {
      websiteHint: "Puedes pegar dominio sin https; lo normalizamos en vista previa.",
      whatsappHint: "Número con código de país o enlace https://wa.me/…",
      ctaExplain:
        "El CTA principal es el botón destacado en la ficha. Usa los campos de contacto según el canal que quieras priorizar.",
    },
    recovery: {
      title: "¿Entraste por error?",
      wrongLaneBody: "Si eres particular (no agencia), usa la vía Particular. Si representas un negocio, quédate aquí.",
      goPrivado: "Ir a solicitud particular",
      hubViajes: "Ir al hub de Viajes",
    },
    previewCta: "Vista previa de la ficha pública",
    previewBackEdit: "Volver a editar borrador",
    resetDraft: "Borrar borrador local",
    publishHandoffCta: "Publicar — qué sigue",
    publishModal: {
      title: "Enviar solicitud a revisión",
      intro:
        "Al enviar, guardamos tu borrador como solicitud en Leonix (staging / moderación). No aparece en el catálogo público hasta aprobación.",
      bullets: [
        "Revisión de identidad del negocio, oferta y medios antes de aprobar.",
        "Si iniciaste sesión, la solicitud queda en tu panel de Viajes con su estado.",
        "Tras aprobación puede mostrarse en resultados públicos con el mismo modelo de descubrimiento (sin checkout en Leonix).",
      ],
      standardPlus:
        "Planes Standard / Plus definen visibilidad cuando el billing esté activo; aquí no se cobra al enviar la solicitud.",
      honestNote: "Esto no es “ya estás en vivo al mundo”: es envío a revisión interna.",
      close: "Cerrar",
      submitReview: "Enviar a revisión",
      submitting: "Enviando…",
    },
    ctaRowHint:
      "La vista previa sigue usando tu borrador local (leonix:viajes:negocios:draft:v1). El envío guarda una copia en servidor para la cola de moderación.",
  };
}

function en(): PublicarViajesNegociosUi {
  return {
    documentTitle: "Viajes business application · Leonix",
    navBack: "Back to Viajes publishing",
    h1: "Business travel offer application",
    intro:
      "Complete a commercial-quality draft. Submitting saves a staged request in Leonix for review — it is not free-for-all publishing. After admin approval it can appear on public Viajes. Leonix is not the merchant of record.",
    workflowKicker: "Step 2 of 4 · Offer draft",
    sections: {
      main: "1. Trip offer & logistics",
      audience: "2. Audience & inclusions",
      media: "3. Visual media",
      business: "4. Business identity & contact",
    },
    sectionHints: {
      main: "Product type, route, published price, and inclusions — what a traveler needs to decide.",
      audience: "Traveler profile and service signals (hotel, transport, language).",
      media: "Hero image and optional assets; managed upload will arrive with the business dashboard.",
      business: "Who responds and how — verification may be requested before publishing.",
    },
    workflow: {
      previewWhat: {
        title: "What preview shows",
        body: "Your draft on this screen is saved in the browser and powers the sample public preview: headline, destination, inclusions, business block, and CTAs — consistent with Viajes in Classifieds.",
      },
      afterSubmit: {
        title: "After submit (coming later)",
        body: "Quality review, possible requests for documents or website, and activation in the category aligned with your Standard / Plus business plan.",
      },
      moderation: {
        title: "Moderation & trust",
        body: "Viajes requires more clarity than a generic classified: business identity, valid offers, and verifiable contact channels. New travel advertisers may receive manual review.",
      },
    },
    trustBar: {
      title: "Trust expectations in Viajes",
      body: "We may request website, socials, or business phone; expired offers are removed. Leonix is not the booking agency — you remain the seller of the service.",
    },
    lifecycle: {
      title: "Later, in the business dashboard (planned)",
      intro: "No backend yet — product direction:",
      items: [
        "Edit, pause, or duplicate offers",
        "Renew validity and featured placement",
        "Upload gallery and video with Leonix tools",
        "Clicks and lead metrics",
        "Adjust Standard / Plus plan",
      ],
    },
    productMode: {
      title: "Current product mode",
      body: "Discovery-first: no travel checkout on Leonix. Submit creates a moderation-queue record; after approval it may appear in public results. Partner and editorial inventory still use internal tooling.",
    },
    stepLabels: ["Entry", "Draft", "Preview", "Submit"],
    activeStepIndex: 1,
    offerType: {
      label: "Offer type",
      options: {
        "": "Choose…",
        paquete: "Package",
        tour: "Tour / excursion",
        crucero: "Cruise",
        resort: "Resort / hotel",
        escapada: "Getaway",
      },
    },
    ctaType: {
      label: "Primary CTA type",
      options: {
        whatsapp: "WhatsApp",
        telefono: "Phone",
        correo: "Email",
        sitio: "Website",
      },
    },
    title: { label: "Title", placeholder: "e.g. Riviera Maya all-inclusive, 5 nights" },
    destination: { label: "Destination", placeholder: "City, region, or country" },
    departureCity: { label: "Departure city", placeholder: "e.g. San José, SFO…" },
    price: { label: "Price / from price", placeholder: "USD, per person…" },
    duration: { label: "Duration", placeholder: "e.g. 5 days / 4 nights" },
    dates: { label: "Dates or range", placeholder: "Season, months, or fixed dates" },
    dateUx: {
      modeFixed: "Fixed dates",
      modeFlexible: "Flexible / TBD",
      modeSeasonal: "Season or window",
      start: "Start",
      end: "End",
      note: "Note (season, flexibility, blackouts…)",
      previewHint: "Preview of the line travelers will see on the listing.",
    },
    shortDescription: { label: "Short description" },
    includes: { label: "What’s included", placeholder: "One item per line or a short paragraph" },
    audience: {
      families: "Good for families",
      couples: "For couples",
      groups: "For groups",
      spanishGuide: "Spanish-speaking guide",
      budgetTag: {
        label: "Budget tag",
        empty: "—",
        economy: "Economy",
        moderate: "Moderate",
        premium: "Premium",
      },
      serviceLanguage: { label: "Service language" },
      includesHotel: "Includes hotel",
      includesTransport: "Includes transport",
      includesFood: "Includes meals",
    },
    multimedia: {
      heroUrl: { label: "Hero image (test URL)", placeholder: "https://…" },
      localFile: {
        label: "Or upload a hero image (this device only)",
        helper: "Large files use IndexedDB; a URL is still the lightest option. No cloud upload in this phase.",
      },
      clearImage: "Clear local / draft hero image",
      tabUrl: "Image URL",
      tabFile: "Local file",
      gallery: {
        label: "Gallery",
        helper: "Add up to 8 images via URL or small local file (this device only).",
        placeholder: "Optional gallery notes",
      },
      galleryAddUrl: "Add URL",
      galleryAddFile: "Add file",
      galleryRemove: "Remove",
      galleryMaxNote: "Maximum 8 gallery images.",
      blocks: {
        hero: "Hero image",
        gallery: "Gallery",
        logo: "Logo",
        video: "Video",
      },
      logo: { label: "Business logo (optional URL)" },
      video: { label: "Video (optional URL)", placeholder: "YouTube or Vimeo" },
      videoFile: "Video file (local reference only)",
      videoFileHint: "We do not upload video to the cloud here — only the filename is stored as a draft note.",
    },
    business: {
      name: { label: "Business name" },
      phone: { label: "Primary phone" },
      phoneOffice: { label: "Office / alternate phone" },
      email: { label: "Contact email" },
      whatsapp: { label: "WhatsApp" },
      website: { label: "Website" },
      socials: { label: "Social (freeform, legacy)", placeholder: "@handle or links" },
      socialSection: "Social profiles (links)",
      socialFacebook: { label: "Facebook" },
      socialInstagram: { label: "Instagram" },
      socialTiktok: { label: "TikTok" },
      socialYoutube: { label: "YouTube" },
      socialTwitter: { label: "X (Twitter)" },
      destinationsServed: { label: "Destinations you serve", placeholder: "Comma-separated" },
      languages: { label: "Languages", placeholder: "e.g. Spanish, English" },
    },
    contactUx: {
      websiteHint: "You may paste a domain without https; we normalize in preview.",
      whatsappHint: "Number with country code or a https://wa.me/… link",
      ctaExplain:
        "The primary CTA is the highlighted button on the listing. Fill contact fields to match the channel you want to prioritize.",
    },
    recovery: {
      title: "Wrong lane?",
      wrongLaneBody: "If you are a private seller (not an agency), use the Private path. If you represent a business, stay here.",
      goPrivado: "Go to private application",
      hubViajes: "Back to Viajes hub",
    },
    previewCta: "Preview public listing",
    previewBackEdit: "Back to edit draft",
    resetDraft: "Clear local draft",
    publishHandoffCta: "Publish — what happens next",
    publishModal: {
      title: "Submit for review",
      intro:
        "Submitting saves your draft as a staged Viajes request in Leonix. It does not appear in public results until an administrator approves it.",
      bullets: [
        "Manual review of business identity, offer, and media before approval.",
        "If you are signed in, the request appears in your Viajes dashboard with status.",
        "After approval it can show in public discovery (still no checkout on Leonix).",
      ],
      standardPlus:
        "Standard / Plus plans control visibility when billing is active; submitting the request does not charge you.",
      honestNote: "This is not “you are live to the world” — it is internal review first.",
      close: "Close",
      submitReview: "Submit for review",
      submitting: "Submitting…",
    },
    ctaRowHint:
      "Preview still uses your local draft (leonix:viajes:negocios:draft:v1). Submit also stores a server copy for the moderation queue.",
  };
}

export function getPublicarViajesNegociosCopy(lang: Lang): PublicarViajesNegociosUi {
  return lang === "en" ? en() : es();
}
