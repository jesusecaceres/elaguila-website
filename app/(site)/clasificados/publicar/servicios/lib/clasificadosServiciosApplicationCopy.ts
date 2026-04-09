import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

export type ClasificadosServiciosCopy = {
  pageTitle: string;
  pageSubtitle: string;
  saveHint: string;
  /** Primary CTA — saves draft and opens preview */
  previewCta: string;
  /** Transitional publish (readiness-gated; no payments) */
  publishCta: string;
  publishModalTitle: string;
  publishModalIntro: string;
  publishMissingTitle: string;
  publishClose: string;
  publishSubmit: string;
  publishBusy: string;
  publishError: string;
  publishLocalNote: string;
  /** Shown when the three attestations are not checked before publish */
  publishConfirmMissing: string;
  /** Opens preview without running strict checklist (draft may be partial) */
  openPreviewCta: string;
  /** Explains strict vs utility preview — under the two preview actions */
  openPreviewHelp: string;
  deleteApplication: string;
  deleteConfirm: string;
  sessionSaveHint: string;
  expertSampleFootnote: string;
  previewMissingBanner: string;
  /** When sessionStorage cannot store the full draft (quota) */
  storageWriteFailed: string;
  /** Jump to step button in strict-preview block */
  goToStep: string;
  listingPhaseDraft: string;
  listingPhasePreview: string;
  listingPhasePublish: string;
  linkPreviewShell: string;
  linkBack: string;
  langToggle: string;
  required: string;
  sections: {
    type: string;
    basic: string;
    media: string;
    about: string;
    services: string;
    reasons: string;
    quickFacts: string;
    contact: string;
    social: string;
    hours: string;
    testimonials: string;
    offer: string;
  };
  labels: {
    businessType: string;
    businessName: string;
    city: string;
    cityPlaceholder: string;
    serviceAreas: string;
    physicalAddressSection: string;
    physicalAddressIntro: string;
    physicalStreet: string;
    physicalSuite: string;
    physicalAddressCity: string;
    physicalRegion: string;
    physicalPostalCode: string;
    phone: string;
    phoneOffice: string;
    email: string;
    website: string;
    whatsapp: string;
    whatsappBusinessUrl: string;
    contactPhonesHeading: string;
    contactEmailWebHeading: string;
    contactSocialHeading: string;
    languageOtherHelp: string;
    languages: string;
    logo: string;
    cover: string;
    gallery: string;
    about: string;
    businessFocus: string;
    businessFocusHelper: string;
    aboutHelper: string;
    servicesHint: string;
    reasonsHint: string;
    quickHint: string;
    primaryCta: string;
    secondaryCta: string;
    enableCall: string;
    enableMessage: string;
    enableWhatsapp: string;
    enableWebsite: string;
    enableEmail: string;
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
    closed: string;
    open: string;
    close: string;
    testimonialAuthor: string;
    testimonialQuote: string;
    addTestimonial: string;
    offerTitle: string;
    offerDetails: string;
    offerLink: string;
    offerNote: string;
    testimonialsNote: string;
    /** Step promo — overall intro */
    promoSectionIntro: string;
    offerTitleHelp: string;
    offerDetailsHelp: string;
    offerLinkHelp: string;
    offerImageHelp: string;
    offerPdfHelp: string;
    dropzone: string;
    upload: string;
    urlFallback: string;
    addUrl: string;
    remove: string;
    replace: string;
    emptyGallery: string;
    invalidUrl: string;
    invalidEmail: string;
    galleryFeaturedHint: string;
    galleryMoreHint: string;
    videosHint: string;
    videoUrlPlaceholder: string;
    addVideoUrl: string;
    videoPrimary: string;
    customService: string;
    customServicePlaceholder: string;
    customReason: string;
    customQuickFact: string;
    customChipPlaceholder: string;
    customChipShortHint: string;
    addCustomChip: string;
    selectionMaxFour: string;
    selectionMaxThree: string;
    aboutServicesGapNote: string;
    leonixVerified: string;
    leonixVerifiedHint: string;
    offerImage: string;
    offerPdf: string;
    moveUp: string;
    moveDown: string;
    featuredToggle: string;
    galleryMultiSelectHint: string;
    featuredStripTitle: string;
    featuredStripHint: string;
    moveFeaturedLeft: string;
    moveFeaturedRight: string;
    offerPrimaryLabel: string;
    offerPrimaryNone: string;
    offerPrimaryLink: string;
    offerPrimaryImage: string;
    offerPrimaryPdf: string;
    offerQrLater: string;
    offerAssetContractNote: string;
    /** How logo / cover / featured / gallery relate in the public profile */
    mediaStructureIntro: string;
    logoHelp: string;
    coverHelp: string;
    /** {total} and {featured} placeholders */
    galleryStatusLine: string;
    mediaUploadedBadge: string;
    videoFromFile: string;
    videoFromUrl: string;
    offerAssetsIntro: string;
    /** Primary actions live in the bottom bar on all screen sizes */
    bottomActionsHint: string;
    assetFromFile: string;
    assetFromUrl: string;
    /** Section heading for optional clips */
    videosTitle: string;
    /** {n} and {max} — total gallery photos */
    galleryCountLine: string;
    /** {n} and {max} — attached videos */
    videosCountLine: string;
    /** Shown when gallery is full (static hint under uploader) */
    galleryLimitHint: string;
    /** Shown when both video slots are used */
    videosLimitHint: string;
    /** List vs featured grid (Bienes-style clarity) */
    galleryListOrderHint: string;
    /** Wrong MIME for logo/cover/gallery file picker */
    mediaWrongFileType: string;
    /** Wrong MIME for video file picker */
    mediaWrongVideoType: string;
    /** Wrong MIME for offer PDF picker */
    mediaWrongPdfType: string;
    /** Some files skipped because only {max} fit */
    galleryPartialAdd: string;
    /** Shown under the hours section — how schedule appears on the public profile */
    hoursOutputHint: string;
    /** Paso 2 — ciudad vs zonas */
    cityHelp: string;
    serviceAreasHelp: string;
    languageOtherLabel: string;
    languageOtherPlaceholder: string;
    /** Paso contacto — visibilidad */
    contactDataHeading: string;
    contactVisibleHeading: string;
    contactPrimaryCtaHeading: string;
    contactPrimaryCtaHelp: string;
    contactSecondaryHeading: string;
    contactSummaryIntro: string;
    contactSummaryCall: string;
    contactSummaryWhatsapp: string;
    contactSummaryWebsite: string;
    contactSummaryEmail: string;
    contactSummaryNone: string;
    /** In-app message channel not offered in this phase */
    contactMessageFootnote: string;
  };
};

const es: ClasificadosServiciosCopy = {
  pageTitle: "Perfil de negocio · Servicios",
  pageSubtitle:
    "Un solo formulario para tu vitrina premium en Leonix. Completa cada sección; podrás refinar el texto con herramientas externas si lo deseas.",
  saveHint: "Borrador guardado en este navegador.",
  previewCta: "Ver vista previa",
  publishCta: "Publicar",
  publishModalTitle: "Publicar listado",
  publishModalIntro:
    "Revisamos que tu perfil tenga lo esencial. Esto es una base de publicación; el pago y el panel completo vienen después.",
  publishMissingTitle: "Completa lo siguiente para continuar:",
  publishClose: "Seguir editando",
  publishSubmit: "Publicar ahora",
  publishBusy: "Publicando…",
  publishError: "No se pudo publicar. Intenta de nuevo.",
  publishLocalNote:
    "Se guardó en este navegador porque la nube no está disponible. Otros dispositivos no verán el listado hasta que haya servidor.",
  publishConfirmMissing:
    "Marca las tres casillas de confirmación en el formulario (sección antes de publicar) para continuar.",
  openPreviewCta: "Abrir vista previa (utilidad)",
  openPreviewHelp:
    "«Ver vista previa» solo navega cuando ya cumples el checklist completo y verás la vitrina terminada. «Abrir vista previa (utilidad)» guarda tu borrador y abre la página de vista previa aunque falten datos: verás la lista de pendientes, no el diseño final.",
  deleteApplication: "Eliminar solicitud",
  deleteConfirm: "¿Borrar todo el borrador de Servicios en esta sesión y empezar de nuevo?",
  sessionSaveHint:
    "Borrador en esta sesión del navegador: se conserva al ir a vista previa y volver, y al actualizar en la misma pestaña. Al cerrar la pestaña o el navegador se descarta.",
  expertSampleFootnote: "Ver ejemplo de vitrina (solo diseño)",
  previewMissingBanner: "Completa lo siguiente antes de la vista previa estricta:",
  storageWriteFailed:
    "No se pudo guardar el borrador completo en el navegador (puede ser por tamaño). Reduce fotos o videos y vuelve a intentar.",
  goToStep: "Ir al paso {n}",
  listingPhaseDraft: "Borrador · sigue completando tu perfil.",
  listingPhasePreview: "Listo para vista previa · revisa el diseño antes de publicar.",
  listingPhasePublish: "Listo para publicar · puedes enviar tu listado.",
  linkPreviewShell: "Ver ejemplo de página pública (solo diseño)",
  linkBack: "Volver a categorías",
  langToggle: "English",
  required: "Requerido",
  sections: {
    type: "1 · Tipo de negocio",
    basic: "2 · Datos básicos y contacto",
    media: "3 · Imágenes y marca",
    about: "4 · Sobre el negocio",
    services: "5 · Servicios que ofreces",
    reasons: "6 · ¿Por qué elegirte?",
    quickFacts: "7 · Datos rápidos",
    contact: "8 · Acciones visibles",
    social: "9 · Redes sociales",
    hours: "10 · Horarios",
    testimonials: "11 · Testimonios (opcional)",
    offer: "12 · Promoción destacada (opcional)",
  },
  labels: {
    businessType: "Tipo de negocio",
    businessName: "Nombre del negocio",
    city: "Ciudad principal",
    cityPlaceholder: "Ej. San José",
    serviceAreas: "Zonas de servicio",
    physicalAddressSection: "Dirección física (opcional)",
    physicalAddressIntro:
      "Solo si tienes una ubicación pública (oficina o local). Los servicios solo a domicilio pueden dejarlo vacío.",
    physicalStreet: "Dirección",
    physicalSuite: "Suite / unidad (opcional)",
    physicalAddressCity: "Ciudad",
    physicalRegion: "Estado",
    physicalPostalCode: "Código ZIP",
    phone: "Teléfono principal",
    phoneOffice: "Teléfono de oficina (opcional)",
    email: "Correo electrónico",
    website: "Sitio web",
    whatsapp: "WhatsApp (número)",
    whatsappBusinessUrl: "WhatsApp — enlace de perfil o negocio (opcional)",
    contactPhonesHeading: "Teléfonos y WhatsApp",
    contactEmailWebHeading: "Correo y sitio web",
    contactSocialHeading: "Redes sociales (URL pública)",
    languageOtherHelp: "Un idioma por línea. También puedes pegar varios separados por coma.",
    languages: "Idiomas",
    logo: "Logo del negocio",
    cover: "Imagen de portada",
    gallery: "Galería de trabajos",
    about: "Sobre nosotros",
    businessFocus: "Enfoque del negocio (una línea corta)",
    businessFocusHelper:
      "Agrega una frase breve para resumir tu enfoque, experiencia o tipo de trabajo principal. No repitas todos tus servicios.",
    aboutHelper:
      "Describe tu experiencia y cómo ayudas a tus clientes. Puedes borradorar ideas aquí y pulir el texto con IA externamente si te hace falta.",
    servicesHint: "Marca los servicios que ofreces (según tu tipo de negocio).",
    reasonsHint: "Elige lo que mejor te representa.",
    quickHint: "Datos rápidos que aparecen bajo el encabezado.",
    primaryCta: "Acción principal del botón destacado",
    secondaryCta: "Acciones secundarias adicionales (opcional)",
    enableCall: "Llamar",
    enableMessage: "Mensaje",
    enableWhatsapp: "WhatsApp",
    enableWebsite: "Sitio web",
    enableEmail: "Correo",
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    closed: "Cerrado",
    open: "Abre",
    close: "Cierra",
    testimonialAuthor: "Nombre",
    testimonialQuote: "Testimonio",
    addTestimonial: "Añadir testimonio",
    offerTitle: "Título",
    offerDetails: "Detalles",
    offerLink: "Enlace",
    offerNote: "",
    testimonialsNote:
      "No son reseñas públicas con estrellas de Leonix: son testimonios opcionales que tú proporcionas. Podrían moderarse más adelante.",
    dropzone: "Arrastra imágenes o haz clic para subir",
    upload: "Subir archivo",
    urlFallback: "O pega una URL de imagen",
    addUrl: "Añadir desde URL",
    remove: "Quitar",
    replace: "Cambiar",
    emptyGallery: "Aún no hay fotos en la galería.",
    invalidUrl: "Revisa el formato del enlace (https://…)",
    invalidEmail: "Revisa el formato del correo (ej. nombre@dominio.com)",
    galleryFeaturedHint:
      "Selecciona las 4 imágenes principales que quieres mostrar en tu anuncio (icono de estrella).",
    galleryMoreHint: "Las imágenes adicionales podrán verse al abrir la galería.",
    galleryMultiSelectHint: "Puedes elegir varias fotos a la vez desde el selector de archivos.",
    featuredStripTitle: "Orden en la galería principal",
    featuredStripHint: "Así aparecerán en la vista previa. Usa las flechas para cambiar el orden.",
    moveFeaturedLeft: "Mover antes",
    moveFeaturedRight: "Mover después",
    videosHint: "Puedes agregar hasta 2 videos (archivo o enlace, por ejemplo YouTube).",
    videoUrlPlaceholder: "https://… (YouTube o archivo en línea)",
    addVideoUrl: "Añadir video por URL",
    videoPrimary: "Video principal / tour",
    customService: "Otro servicio",
    customServicePlaceholder: "Ej.: marcos a medida",
    customReason: "Otro motivo",
    customQuickFact: "Otro dato rápido",
    customChipPlaceholder: "Etiqueta breve",
    customChipShortHint: "Usa pocas palabras",
    addCustomChip: "Añadir",
    selectionMaxFour: "Máximo 4 opciones",
    selectionMaxThree: "Máximo 3 opciones",
    aboutServicesGapNote:
      "Si algo de tu oferta no encaja en las opciones sugeridas, detállalo aquí: especialidades, materiales, alcance y condiciones. Ayuda a los clientes a entender exactamente qué resuelves.",
    leonixVerified: "Mostrar interés en Verificado Leonix",
    leonixVerifiedHint:
      "No otorga el distintivo: Leonix lo asigna en un paso controlado. Esto solo registra tu interés.",
    offerImage: "Imagen opcional",
    offerPdf: "PDF o volante (opcional)",
    offerPrimaryLabel: "Si añades varios recursos, ¿cuál mostrar primero?",
    offerPrimaryNone: "Sin preferencia",
    offerPrimaryLink: "Enlace",
    offerPrimaryImage: "Imagen",
    offerPrimaryPdf: "PDF",
    offerQrLater: "",
    offerAssetContractNote: "Solo ordena el foco visual cuando hay más de un archivo o enlace.",
    promoSectionIntro:
      "Añade una promoción breve para tu vitrina: descuento, temporada, estimado gratis, consulta inicial o paquete especial. Sé concreto; un bloque corto funciona mejor que un texto largo.",
    offerTitleHelp: "Titular directo: qué ofreces y para quién (ej. “15% en limpieza profunda esta semana”).",
    offerDetailsHelp:
      "Incluye la oferta, quién califica, condiciones y vigencia si aplica. Evita letras pequeñas ilegibles: lo esencial aquí.",
    offerLinkHelp: "Opcional. Úsalo si la promoción vive en tu web, formulario o calendario.",
    offerImageHelp: "Opcional. Sube un gráfico o foto si ya tienes material promocional.",
    offerPdfHelp: "Opcional. PDF o volante si quieres que el cliente pueda abrir un archivo.",
    moveUp: "Arriba",
    moveDown: "Abajo",
    featuredToggle: "Principal en anuncio",
    mediaStructureIntro:
      "Logo y portada definen el encabezado. La galería muestra hasta 4 fotos destacadas en el anuncio; el resto aparece al ampliar. Todo se guarda en este navegador hasta que salgas del flujo o publiques.",
    logoHelp: "Cuadrada o casi cuadrada; se muestra junto al nombre.",
    coverHelp: "Imagen ancha detrás del encabezado (como portada).",
    galleryStatusLine: "{total} foto(s) · {featured} destacada(s) (máx. 4)",
    mediaUploadedBadge: "Listo · toca el recuadro para cambiar",
    videoFromFile: "Video subido",
    videoFromUrl: "Enlace / URL",
    offerAssetsIntro: "",
    bottomActionsHint:
      "Barra inferior: «Ver vista previa» (estricta) y publicar. La utilidad «Abrir vista previa» solo está arriba junto al texto explicativo.",
    assetFromFile: "Archivo",
    assetFromUrl: "URL",
    videosTitle: "Videos (opcional)",
    galleryCountLine: "{n} / {max} fotos en la galería",
    videosCountLine: "{n} / {max} videos adjuntos",
    galleryLimitHint: "Límite alcanzado (máx. {max}). Quita una foto para añadir más.",
    videosLimitHint: "Ya tienes el máximo de videos ({max}). Quita uno para cambiar.",
    galleryListOrderHint:
      "El orden de la lista es el orden completo de la galería. Las destacadas pueden ser cualquiera de esas fotos; no tienen que ser las primeras.",
    mediaWrongFileType: "Ese archivo no es una imagen. Usa JPG, PNG, WebP u otro formato de imagen.",
    mediaWrongVideoType: "Ese archivo no es un video. Usa MP4, WebM u otro formato de video.",
    mediaWrongPdfType: "El archivo debe ser PDF.",
    galleryPartialAdd: "Solo cabían algunas fotos nuevas (máx. {max} en total).",
    hoursOutputHint:
      "En tu vitrina: destacamos el horario de hoy y mostramos la semana completa en el panel de contacto.",
    cityHelp: "Ciudad donde se ubica principalmente tu negocio.",
    serviceAreasHelp: "Describe vecindades, condados o el radio donde atiendes.",
    languageOtherLabel: "Otros idiomas",
    languageOtherPlaceholder: "Chino\nJaponés",
    contactDataHeading: "Tus datos de contacto",
    contactVisibleHeading: "Qué puede usar el cliente en la vitrina",
    contactPrimaryCtaHeading: "Destacado en la vitrina",
    contactPrimaryCtaHelp:
      "Leonix prioriza automáticamente: WhatsApp, llamada, correo, sitio y mensaje (si aplica), según lo que actives y los datos válidos.",
    contactSecondaryHeading: "Acciones secundarias",
    contactSummaryIntro: "Vista previa lógica según lo activado:",
    contactSummaryCall: "Llamada",
    contactSummaryWhatsapp: "WhatsApp",
    contactSummaryWebsite: "Sitio web",
    contactSummaryEmail: "Correo",
    contactSummaryNone: "Aún no hay un método de contacto válido activo.",
    contactMessageFootnote:
      "El canal “Mensaje” dentro de la vitrina no está activo en esta fase. Activa llamada, WhatsApp, correo o sitio según corresponda.",
  },
};

const en: ClasificadosServiciosCopy = {
  pageTitle: "Business profile · Services",
  pageSubtitle:
    "One guided form for your premium Leonix showcase. Complete each section; you can polish copy with external tools if needed.",
  saveHint: "Draft saved in this browser.",
  previewCta: "View preview",
  publishCta: "Publish",
  publishModalTitle: "Publish listing",
  publishModalIntro:
    "We check that your profile has the essentials. This is a publish foundation; payments and the full dashboard come later.",
  publishMissingTitle: "Complete the following to continue:",
  publishClose: "Keep editing",
  publishSubmit: "Publish now",
  publishBusy: "Publishing…",
  publishError: "Could not publish. Please try again.",
  publishLocalNote:
    "Saved on this browser because cloud publish isn’t available. Other devices won’t see it until the server is configured.",
  publishConfirmMissing:
    "Check all three confirmation boxes in the form (section before publishing) to continue.",
  openPreviewCta: "Open preview (utility)",
  openPreviewHelp:
    "“View preview” only navigates once every checklist item is satisfied and shows the finished showcase. “Open preview (utility)” saves your draft and opens the preview page even if data is missing: you’ll see what’s left to complete, not the final layout.",
  deleteApplication: "Delete application",
  deleteConfirm: "Delete this session’s Servicios draft and start over?",
  sessionSaveHint:
    "Session draft: kept when you open preview and return, and when you refresh in the same tab. Closing the tab or browser clears it.",
  expertSampleFootnote: "View sample showcase (design only)",
  previewMissingBanner: "Complete the following before strict preview:",
  storageWriteFailed:
    "Could not save the full draft in the browser (storage may be full). Try fewer photos or videos, then try again.",
  goToStep: "Go to step {n}",
  listingPhaseDraft: "Draft · keep filling out your profile.",
  listingPhasePreview: "Preview-ready · review the layout before publishing.",
  listingPhasePublish: "Publish-ready · you can submit your listing.",
  linkPreviewShell: "View example public page (design only)",
  linkBack: "Back to categories",
  langToggle: "Español",
  required: "Required",
  sections: {
    type: "1 · Business type",
    basic: "2 · Basics & contact",
    media: "3 · Brand & media",
    about: "4 · About the business",
    services: "5 · Services you offer",
    reasons: "6 · Why choose you",
    quickFacts: "7 · Quick facts",
    contact: "8 · Visible actions",
    social: "9 · Social media",
    hours: "10 · Hours",
    testimonials: "11 · Testimonials (optional)",
    offer: "12 · Featured promotion (optional)",
  },
  labels: {
    businessType: "Business type",
    businessName: "Business name",
    city: "Main city",
    cityPlaceholder: "e.g. San Jose",
    serviceAreas: "Service areas",
    physicalAddressSection: "Physical address (optional)",
    physicalAddressIntro:
      "Only if you have a public storefront or office. Mobile-only providers can leave this blank.",
    physicalStreet: "Street address",
    physicalSuite: "Suite / unit (optional)",
    physicalAddressCity: "City",
    physicalRegion: "State",
    physicalPostalCode: "ZIP code",
    phone: "Main phone",
    phoneOffice: "Office phone (optional)",
    email: "Email",
    website: "Website",
    whatsapp: "WhatsApp (number)",
    whatsappBusinessUrl: "WhatsApp — business or profile link (optional)",
    contactPhonesHeading: "Phones & WhatsApp",
    contactEmailWebHeading: "Email & website",
    contactSocialHeading: "Social profiles (public URL)",
    languageOtherHelp: "One language per line. You can also paste several separated by commas.",
    languages: "Languages",
    logo: "Business logo",
    cover: "Cover image",
    gallery: "Work gallery",
    about: "About you",
    businessFocus: "Business focus (one short line)",
    businessFocusHelper:
      "Add a short phrase summarizing your focus, experience, or main type of work. Do not repeat your full services list.",
    aboutHelper:
      "Describe your experience and how you help clients. Draft here and refine with an external AI assistant if you want.",
    servicesHint: "Select the services you offer (based on your business type).",
    reasonsHint: "Pick what best represents you.",
    quickHint: "Quick highlights shown below the hero.",
    primaryCta: "Primary button action",
    secondaryCta: "Additional secondary actions (optional)",
    enableCall: "Call",
    enableMessage: "Message",
    enableWhatsapp: "WhatsApp",
    enableWebsite: "Website",
    enableEmail: "Email",
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    closed: "Closed",
    open: "Opens",
    close: "Closes",
    testimonialAuthor: "Name",
    testimonialQuote: "Quote",
    addTestimonial: "Add testimonial",
    offerTitle: "Headline",
    offerDetails: "Details",
    offerLink: "Link",
    offerNote: "",
    testimonialsNote:
      "These are optional testimonials you provide — not Leonix public star reviews. They may be moderated later.",
    dropzone: "Drag images or click to upload",
    upload: "Upload file",
    urlFallback: "Or paste an image URL",
    addUrl: "Add from URL",
    remove: "Remove",
    replace: "Replace",
    emptyGallery: "No gallery photos yet.",
    invalidUrl: "Check the link format (https://…)",
    invalidEmail: "Check the email format (e.g. name@domain.com)",
    galleryFeaturedHint:
      "Pick up to 4 main photos for your listing (star toggle). Those appear in the hero gallery grid.",
    galleryMoreHint: "Additional photos will be available when the expanded gallery opens.",
    galleryMultiSelectHint: "You can select multiple photos at once in the file picker.",
    featuredStripTitle: "Order in the main gallery",
    featuredStripHint: "This is how they appear in preview. Use arrows to reorder.",
    moveFeaturedLeft: "Move earlier",
    moveFeaturedRight: "Move later",
    videosHint: "You can add up to 2 videos (upload or URL, e.g. YouTube).",
    videoUrlPlaceholder: "https://… (YouTube or direct file)",
    addVideoUrl: "Add video URL",
    videoPrimary: "Primary / tour video",
    customService: "Other service",
    customServicePlaceholder: "e.g. custom trim",
    customReason: "Other reason",
    customQuickFact: "Other quick fact",
    customChipPlaceholder: "Short label",
    customChipShortHint: "Keep it short",
    addCustomChip: "Add",
    selectionMaxFour: "Maximum 4 options",
    selectionMaxThree: "Maximum 3 options",
    aboutServicesGapNote:
      "If your offer is not fully covered by the suggested chips, describe specialties, scope, and constraints here so clients know exactly what you deliver.",
    leonixVerified: "Show interest in Leonix Verified",
    leonixVerifiedHint:
      "This does not grant the badge — Leonix assigns verification in a controlled step. This only records your interest.",
    offerImage: "Optional image",
    offerPdf: "Optional PDF / flyer",
    offerPrimaryLabel: "If you add several assets, which should lead?",
    offerPrimaryNone: "No preference",
    offerPrimaryLink: "Link",
    offerPrimaryImage: "Image",
    offerPrimaryPdf: "PDF",
    offerQrLater: "",
    offerAssetContractNote: "This only sets visual emphasis when more than one link or file is present.",
    promoSectionIntro:
      "Add one short promotion for your profile: a seasonal offer, discount, free estimate, consultation, or package. Keep it clear and scannable—a tight block beats a long paragraph.",
    offerTitleHelp: "Use a direct headline: what you offer and for whom (e.g. “15% off deep cleaning this week”).",
    offerDetailsHelp:
      "Include the offer, who qualifies, conditions, and timing if relevant. Keep must-know terms here—avoid tiny-print surprises.",
    offerLinkHelp: "Optional. Use when the promo lives on your site, booking page, or form.",
    offerImageHelp: "Optional. Upload a graphic if you already have promo artwork.",
    offerPdfHelp: "Optional. Add a PDF or flyer if clients should open a file.",
    moveUp: "Up",
    moveDown: "Down",
    featuredToggle: "Featured on listing",
    mediaStructureIntro:
      "Logo and cover shape the header. The gallery uses up to 4 featured photos on the listing; the rest appear when visitors expand the gallery. Everything stays in this browser until you leave the flow or publish.",
    logoHelp: "Square-ish; shown next to your business name.",
    coverHelp: "Wide image behind the header (banner).",
    galleryStatusLine: "{total} photo(s) · {featured} featured (max 4)",
    mediaUploadedBadge: "Added · tap the box to replace",
    videoFromFile: "Uploaded clip",
    videoFromUrl: "From link",
    offerAssetsIntro: "",
    bottomActionsHint:
      "Bottom bar: strict “View preview” plus publish. The utility “Open preview” lives in the header with the explanation above.",
    assetFromFile: "File",
    assetFromUrl: "URL",
    videosTitle: "Videos (optional)",
    galleryCountLine: "{n} / {max} photos in gallery",
    videosCountLine: "{n} / {max} videos attached",
    galleryLimitHint: "Limit reached (max {max}). Remove a photo to add more.",
    videosLimitHint: "Maximum videos reached ({max}). Remove one to change.",
    galleryListOrderHint:
      "The list order is the full gallery order. Featured picks can be any of those photos — they do not have to be first.",
    mediaWrongFileType: "That file is not an image. Use JPG, PNG, WebP, or another image format.",
    mediaWrongVideoType: "That file is not a video. Use MP4, WebM, or another video format.",
    mediaWrongPdfType: "The file must be a PDF.",
    galleryPartialAdd: "Only some new photos fit (max {max} total).",
    hoursOutputHint:
      "On your public profile: we highlight today’s hours and show the full week in the contact panel.",
    cityHelp: "City where your business is primarily based.",
    serviceAreasHelp: "Describe neighborhoods, counties, or the radius you serve.",
    languageOtherLabel: "Other languages",
    languageOtherPlaceholder: "Mandarin\nJapanese",
    contactDataHeading: "Your contact details",
    contactVisibleHeading: "What clients can use on your showcase",
    contactPrimaryCtaHeading: "Highlight order",
    contactPrimaryCtaHelp:
      "Leonix uses a fixed priority: WhatsApp, call, email, website, then message when available—based on what you enable with valid details.",
    contactSecondaryHeading: "Secondary actions",
    contactSummaryIntro: "Logical preview from your toggles:",
    contactSummaryCall: "Call",
    contactSummaryWhatsapp: "WhatsApp",
    contactSummaryWebsite: "Website",
    contactSummaryEmail: "Email",
    contactSummaryNone: "No valid contact method is active yet.",
    contactMessageFootnote:
      "The in-showcase “Message” channel is not active in this phase. Enable call, WhatsApp, email, or website as needed.",
  },
};

export function getClasificadosServiciosCopy(lang: ServiciosLang): ClasificadosServiciosCopy {
  return lang === "en" ? en : es;
}
