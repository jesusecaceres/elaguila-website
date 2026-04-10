import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type PublicarViajesPrivadoCopy = {
  documentTitle: string;
  navBack: string;
  workflowKicker: string;
  h1: string;
  intro: string;
  laneClarification: string;
  notAffiliate: string;
  notNegocios: string;
  moderationTitle: string;
  moderationBody: string;
  qualityTitle: string;
  qualityBody: string;
  stepLabels: string[];
  activeStepIndex: number;
  workflow: {
    previewWhat: { title: string; body: string };
    draftNote: { title: string; body: string };
    publishNext: { title: string; body: string };
  };
  trustBar: { title: string; body: string };
  sections: {
    category: string;
    main: string;
    audience: string;
    media: string;
    contact: string;
    publish: string;
  };
  sectionHints: {
    category: string;
    main: string;
    audience: string;
    media: string;
    contact: string;
    publish: string;
  };
  offerType: { label: string; options: Record<string, string> };
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
  peopleCount: { label: string; placeholder: string };
  reservationPolicy: { label: string; placeholder: string };
  audience: {
    families: string;
    couples: string;
    groups: string;
    spanishGuide: string;
    budgetTag: { label: string; empty: string; economy: string; moderate: string; premium: string };
    serviceLanguage: { label: string };
  };
  includesFlags: { hotel: string; transport: string; food: string };
  multimedia: {
    heroUrl: { label: string; placeholder: string };
    localFile: { label: string; helper: string };
    clearImage: string;
    tabUrl: string;
    tabFile: string;
    blocks: { hero: string; gallery: string };
    gallery: { label: string; helper: string };
    galleryAddUrl: string;
    galleryAddFile: string;
    galleryRemove: string;
    galleryMaxNote: string;
  };
  contact: {
    displayName: { label: string; placeholder: string };
    ctaType: { label: string; options: Record<string, string> };
    phone: { label: string; placeholder: string };
    phoneOffice: { label: string; placeholder: string };
    whatsapp: { label: string; placeholder: string };
    email: { label: string; placeholder: string };
    website: { label: string; placeholder: string };
  };
  contactUx: {
    websiteHint: string;
    whatsappHint: string;
    ctaExplain: string;
  };
  socialSection: string;
  socialFacebook: { label: string };
  socialInstagram: { label: string };
  socialTiktok: { label: string };
  socialYoutube: { label: string };
  socialTwitter: { label: string };
  recovery: {
    title: string;
    wrongLaneBody: string;
    goNegocios: string;
    hubViajes: string;
  };
  previewCta: string;
  previewBackEdit: string;
  resetDraft: string;
  publishCta: string;
  publishDisabledHint: string;
  publishModalTitle: string;
  publishModalBody: string;
  publishModalCta: string;
  publishModalDismiss: string;
  laneSummary: string;
  ctaRowHint: string;
};

function es(): PublicarViajesPrivadoCopy {
  return {
    documentTitle: "Viajes · particular · Leonix",
    navBack: "Volver a Publicar Viajes",
    workflowKicker: "Categoría · Medios · Formulario · Vista previa · Publicar",
    h1: "Tu oferta de viaje (particular)",
    intro:
      "Esta vía es para personas que publican un viaje, cupo o paquete propio. No es inventario de socios comerciales (afiliados) ni la solicitud de agencia/negocio.",
    laneClarification: "Tres caminos en Viajes: socios comerciales (solo Leonix), negocios con ficha, y esta vía particular con revisión.",
    notAffiliate: "Los socios comerciales no se crean aquí — se gestionan internamente.",
    notNegocios: "Si representas una agencia u operador, usa la vía Negocios.",
    moderationTitle: "Moderación",
    moderationBody:
      "Leonix puede revisar tu anuncio antes de publicarlo. Ofertas confusas, desactualizadas o poco verificables pueden no aprobarse.",
    qualityTitle: "Calidad",
    qualityBody:
      "Viajes es una categoría premium dentro de Clasificados: fotos claras, precios honestos y contacto verificable ayudan a la aprobación.",
    stepLabels: ["Categoría", "Medios", "Formulario", "Vista previa", "Publicar"],
    activeStepIndex: 2,
    workflow: {
      previewWhat: {
        title: "Vista previa",
        body: "Verás cómo podría verse tu ficha en Clasificados — aún es borrador en este dispositivo.",
      },
      draftNote: {
        title: "Borrador local",
        body: "Los datos se guardan en este navegador hasta que exista publicación y pago en una fase posterior.",
      },
      publishNext: {
        title: "Siguiente fase",
        body: "Publicación en vivo, pago y revisión en servidor conectarán con Supabase u otro backend — aún no activo.",
      },
    },
    trustBar: {
      title: "Confianza",
      body: "Leonix no procesa reservas ni pagos de viajes en esta vitrina. El siguiente paso técnico será pago/publicación cuando el sistema esté listo.",
    },
    sections: {
      category: "Categoría de oferta",
      main: "Detalle del viaje",
      audience: "¿Para quién es?",
      media: "Imagen principal",
      contact: "Contacto",
      publish: "Publicar",
    },
    sectionHints: {
      category: "Elige el tipo que mejor describe tu oferta.",
      main: "Información principal del paquete o cupo.",
      audience: "Opcional — ayuda a los lectores a ubicarse.",
      media: "URL o archivo local solo para vista previa; sin subida a la nube aún.",
      contact: "Cómo te contactarán — sin publicar hasta la fase de pago/revisión.",
      publish: "El botón prepara el siguiente paso; no completa pago ni lista en vivo hoy.",
    },
    offerType: {
      label: "Tipo de oferta",
      options: {
        "": "Selecciona…",
        day_trip: "Viaje de un día",
        weekend: "Escapada de fin de semana",
        resort: "Resort / estadía",
        tour: "Tour",
        excursion: "Excursión",
        cruise: "Crucero",
        activity: "Actividad en destino",
        transport: "Transporte / traslado",
        other: "Otro paquete",
      },
    },
    title: { label: "Título", placeholder: "Ej. Escapada Arenal · 3 noches" },
    destination: { label: "Destino", placeholder: "Ciudad, región o país" },
    departureCity: { label: "Ciudad o punto de salida", placeholder: "Ej. San José, SJO" },
    price: { label: "Precio / desde", placeholder: "Ej. $450 por persona" },
    duration: { label: "Duración", placeholder: "Ej. 4 días · 3 noches" },
    dates: { label: "Fechas o rango", placeholder: "Ej. 15–22 julio o flexibles" },
    dateUx: {
      modeFixed: "Fechas fijas",
      modeFlexible: "Flexible / por acordar",
      modeSeasonal: "Temporada o ventana",
      start: "Inicio",
      end: "Fin",
      note: "Nota (temporada, flexibilidad…)",
      previewHint: "Así se verá la línea de fechas en la ficha.",
    },
    shortDescription: { label: "Descripción corta" },
    includes: { label: "Qué incluye", placeholder: "Un ítem por línea o párrafo breve" },
    peopleCount: { label: "Número de personas (aprox.)", placeholder: "Ej. 2 adultos" },
    reservationPolicy: { label: "Política de reserva / términos (resumen)", placeholder: "Cancelación, depósitos, etc." },
    audience: {
      families: "Apto para familias",
      couples: "Para parejas",
      groups: "Para grupos",
      spanishGuide: "Guía o atención en español",
      budgetTag: {
        label: "Presupuesto (etiqueta)",
        empty: "—",
        economy: "Económico",
        moderate: "Moderado",
        premium: "Premium",
      },
      serviceLanguage: { label: "Idioma de atención" },
    },
    includesFlags: {
      hotel: "Incluye hotel",
      transport: "Incluye transporte",
      food: "Incluye comida",
    },
    multimedia: {
      heroUrl: { label: "URL de imagen (opcional)", placeholder: "https://…" },
      localFile: {
        label: "O sube una imagen (solo en este dispositivo)",
        helper:
          "Vista previa en este navegador. Archivos grandes se guardan en IndexedDB (más fiable que solo localStorage); si el navegador bloquea almacenamiento, usa una URL o una foto más pequeña. No hay subida a la nube.",
      },
      clearImage: "Quitar imagen",
      tabUrl: "Enlace URL",
      tabFile: "Archivo local",
      blocks: { hero: "Imagen principal", gallery: "Galería opcional" },
      gallery: {
        label: "Galería",
        helper: "Hasta 8 imágenes por URL o archivo pequeño (solo este dispositivo).",
      },
      galleryAddUrl: "Añadir URL",
      galleryAddFile: "Añadir archivo",
      galleryRemove: "Quitar",
      galleryMaxNote: "Máximo 8 imágenes.",
    },
    contact: {
      displayName: { label: "Nombre para mostrar", placeholder: "Tu nombre o cómo firmar" },
      ctaType: {
        label: "Tipo de contacto principal",
        options: {
          whatsapp: "WhatsApp",
          phone: "Llamada / SMS",
          email: "Correo",
        },
      },
      phone: { label: "Teléfono principal", placeholder: "+506 …" },
      phoneOffice: { label: "Teléfono alternativo", placeholder: "Opcional" },
      whatsapp: { label: "WhatsApp", placeholder: "Enlace o número" },
      email: { label: "Correo", placeholder: "tu@email.com" },
      website: { label: "Sitio web o red (opcional)", placeholder: "https://…" },
    },
    contactUx: {
      websiteHint: "Puedes pegar un enlace corto; lo normalizamos en vista previa.",
      whatsappHint: "Número con código de país o enlace wa.me",
      ctaExplain: "El CTA principal define el botón destacado; los demás campos aparecen como accesos adicionales en la ficha.",
    },
    socialSection: "Redes sociales (opcional)",
    socialFacebook: { label: "Facebook" },
    socialInstagram: { label: "Instagram" },
    socialTiktok: { label: "TikTok" },
    socialYoutube: { label: "YouTube" },
    socialTwitter: { label: "X (Twitter)" },
    recovery: {
      title: "¿Eres agencia o negocio?",
      wrongLaneBody: "Si publicas en nombre de una agencia u operador, debes usar la vía Negocios.",
      goNegocios: "Ir a solicitud de negocio",
      hubViajes: "Ir al hub de Viajes",
    },
    previewCta: "Ver vista previa en Clasificados",
    previewBackEdit: "Volver a editar",
    resetDraft: "Restablecer borrador",
    publishCta: "Continuar hacia publicación (siguiente fase)",
    publishDisabledHint: "",
    publishModalTitle: "Siguiente fase: pago y publicación",
    publishModalBody:
      "Aún no procesamos pago ni publicamos en el catálogo en vivo. En la siguiente fase del sistema, este paso enlazará con revisión, pago y publicación (por ejemplo mediante Supabase y pasarela). Tu borrador sigue guardado solo en este dispositivo.",
    publishModalCta: "Entendido",
    publishModalDismiss: "Cerrar",
    laneSummary: "Particular — no es socio comercial ni negocio.",
    ctaRowHint: "La vista previa usa tu borrador local. Afiliados solo en equipo Leonix.",
  };
}

function en(): PublicarViajesPrivadoCopy {
  return {
    documentTitle: "Viajes · private · Leonix",
    navBack: "Back to Publish Viajes",
    workflowKicker: "Category · Media · Form · Preview · Publish",
    h1: "Your travel offer (private)",
    intro:
      "This path is for individuals posting their own trip, spot, or package. It is not commercial partner inventory or the business/agency application.",
    laneClarification: "Three Viajes lanes: commercial partners (Leonix-only), business listings, and this private path with review.",
    notAffiliate: "Affiliate/partner inventory is not created here — it is managed internally.",
    notNegocios: "If you represent an agency or operator, use the Businesses path.",
    moderationTitle: "Moderation",
    moderationBody:
      "Leonix may review your listing before it goes live. Confusing, outdated, or hard-to-verify offers may not be approved.",
    qualityTitle: "Quality",
    qualityBody:
      "Viajes is a premium category: clear photos, honest pricing, and verifiable contact help approval.",
    stepLabels: ["Category", "Media", "Form", "Preview", "Publish"],
    activeStepIndex: 2,
    workflow: {
      previewWhat: {
        title: "Preview",
        body: "You’ll see how your card could look in Classifieds — still a draft on this device.",
      },
      draftNote: {
        title: "Local draft",
        body: "Data stays in this browser until live publishing and payment ship in a later phase.",
      },
      publishNext: {
        title: "Next phase",
        body: "Live listing, payment, and server-side review will connect via Supabase or another backend — not active yet.",
      },
    },
    trustBar: {
      title: "Trust",
      body: "Leonix does not process travel bookings or payments in this showcase. The technical next step will be payment/publishing when the system is ready.",
    },
    sections: {
      category: "Offer category",
      main: "Trip details",
      audience: "Who it’s for",
      media: "Hero image",
      contact: "Contact",
      publish: "Publish",
    },
    sectionHints: {
      category: "Pick the type that best describes your offer.",
      main: "Core information about the package or spot.",
      audience: "Optional — helps readers self-select.",
      media: "URL or local file for preview only; no cloud upload yet.",
      contact: "How people reach you — no live listing until the payment/review phase.",
      publish: "This button sets up the next step; it does not complete payment or go live today.",
    },
    offerType: {
      label: "Offer type",
      options: {
        "": "Choose…",
        day_trip: "Day trip",
        weekend: "Weekend getaway",
        resort: "Resort / stay",
        tour: "Tour",
        excursion: "Excursion",
        cruise: "Cruise",
        activity: "On‑destination activity",
        transport: "Transport / transfer",
        other: "Other package",
      },
    },
    title: { label: "Title", placeholder: "e.g. Arenal getaway · 3 nights" },
    destination: { label: "Destination", placeholder: "City, region, or country" },
    departureCity: { label: "Departure city or origin", placeholder: "e.g. San José, SJO" },
    price: { label: "Price / from", placeholder: "e.g. $450 per person" },
    duration: { label: "Duration", placeholder: "e.g. 4 days · 3 nights" },
    dates: { label: "Dates or range", placeholder: "e.g. Jul 15–22 or flexible" },
    dateUx: {
      modeFixed: "Fixed dates",
      modeFlexible: "Flexible / TBD",
      modeSeasonal: "Season or window",
      start: "Start",
      end: "End",
      note: "Note (season, flexibility…)",
      previewHint: "This is how the date line will read on the listing.",
    },
    shortDescription: { label: "Short description" },
    includes: { label: "What’s included", placeholder: "One line per item or a short paragraph" },
    peopleCount: { label: "Number of people (approx.)", placeholder: "e.g. 2 adults" },
    reservationPolicy: { label: "Reservation policy / terms (summary)", placeholder: "Cancellation, deposits, etc." },
    audience: {
      families: "Good for families",
      couples: "For couples",
      groups: "For groups",
      spanishGuide: "Guide or service in Spanish",
      budgetTag: {
        label: "Budget tag",
        empty: "—",
        economy: "Economy",
        moderate: "Moderate",
        premium: "Premium",
      },
      serviceLanguage: { label: "Service language" },
    },
    includesFlags: {
      hotel: "Includes lodging",
      transport: "Includes transport",
      food: "Includes meals",
    },
    multimedia: {
      heroUrl: { label: "Image URL (optional)", placeholder: "https://…" },
      localFile: {
        label: "Or upload an image (this device only)",
        helper:
          "Preview in this browser. Large files are stored in IndexedDB (more reliable than localStorage alone); if the browser blocks storage, use a URL or a smaller photo. Nothing is uploaded to the cloud.",
      },
      clearImage: "Remove image",
      tabUrl: "Image URL",
      tabFile: "Local file",
      blocks: { hero: "Hero image", gallery: "Optional gallery" },
      gallery: {
        label: "Gallery",
        helper: "Up to 8 images via URL or small local file (this device only).",
      },
      galleryAddUrl: "Add URL",
      galleryAddFile: "Add file",
      galleryRemove: "Remove",
      galleryMaxNote: "Maximum 8 images.",
    },
    contact: {
      displayName: { label: "Display name", placeholder: "Your name or how you sign" },
      ctaType: {
        label: "Primary contact type",
        options: {
          whatsapp: "WhatsApp",
          phone: "Call / SMS",
          email: "Email",
        },
      },
      phone: { label: "Primary phone", placeholder: "+1 …" },
      phoneOffice: { label: "Alternate phone", placeholder: "Optional" },
      whatsapp: { label: "WhatsApp", placeholder: "Link or number" },
      email: { label: "Email", placeholder: "you@email.com" },
      website: { label: "Website or profile (optional)", placeholder: "https://…" },
    },
    contactUx: {
      websiteHint: "Paste a short link; we normalize it in preview.",
      whatsappHint: "Country code or wa.me link",
      ctaExplain: "The primary CTA is the highlighted button; other fields show as extra links on the card.",
    },
    socialSection: "Social profiles (optional)",
    socialFacebook: { label: "Facebook" },
    socialInstagram: { label: "Instagram" },
    socialTiktok: { label: "TikTok" },
    socialYoutube: { label: "YouTube" },
    socialTwitter: { label: "X (Twitter)" },
    recovery: {
      title: "Are you a business?",
      wrongLaneBody: "If you post on behalf of an agency or operator, use the Businesses path.",
      goNegocios: "Go to business application",
      hubViajes: "Back to Viajes hub",
    },
    previewCta: "Preview in Classifieds",
    previewBackEdit: "Back to edit",
    resetDraft: "Reset draft",
    publishCta: "Continue to publishing (next phase)",
    publishDisabledHint: "",
    publishModalTitle: "Next phase: payment & publishing",
    publishModalBody:
      "We do not process payment or publish to the live catalog yet. In the next system phase, this step will link to review, payment, and publishing (e.g. via Supabase and a payment provider). Your draft remains only on this device.",
    publishModalCta: "Got it",
    publishModalDismiss: "Close",
    laneSummary: "Private seller — not a commercial partner or business listing.",
    ctaRowHint: "Preview uses your local draft. Affiliates are Leonix-internal only.",
  };
}

export function getPublicarViajesPrivadoCopy(lang: Lang): PublicarViajesPrivadoCopy {
  return lang === "en" ? en() : es();
}
