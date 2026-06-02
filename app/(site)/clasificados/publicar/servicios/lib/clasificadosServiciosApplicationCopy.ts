import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";
import {
  MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION,
  MAX_CUSTOM_BUSINESS_HIGHLIGHTS,
} from "./serviciosHighlightCaps";
import { MAX_CUSTOM_SERVICES_OFFERED, MAX_SERVICES_SELECTION } from "./serviciosSelectionCaps";

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
  deleteApplication: string;
  deleteConfirm: string;
  previewMissingBanner: string;
  /** When sessionStorage cannot store the full draft (quota) */
  storageWriteFailed: string;
  /** Jump to step button in strict-preview block */
  goToStep: string;
  listingPhaseDraft: string;
  listingPhasePreview: string;
  listingPhasePublish: string;
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
    whatsappHelp: string;
    whatsappBusinessUrl: string;
    whatsappBusinessUrlHelp: string;
    quoteMessagePhone: string;
    quoteMessagePhoneHelp: string;
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
    businessFocusPlaceholder: string;
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
    xTwitter: string;
    snapchat: string;
    contactReviewsHeading: string;
    googleReviews: string;
    yelpReviews: string;
    contactExtraLinksHeading: string;
    extraLinkUrl: string;
    extraLinkLabel: string;
    extraLinkLabelHelp: string;
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
    /** Step promotions — overall intro (Phase 7A) */
    promotionsSectionIntro: string;
    promoAddPromotion: string;
    promoRemovePromotion: string;
    promoMaxNote: string;
    promotionSlot: (index: number) => string;
    promoTitlePlaceholder: string;
    promoDetailsPlaceholder: string;
    promoLinkPlaceholder: string;
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
    addedCustomServicesSection: string;
    customServicesMax: string;
    /** When the advertiser reaches the preset selection cap */
    selectionMaxSuggestedPresets: string;
    servicesSuggestedHeading: string;
    addOtherServiceHeading: string;
    customServicesHelperHint: string;
    highlightsSectionTitle: string;
    highlightsSectionHelper: string;
    highlightsSuggestedHeading: string;
    addOtherHighlightHeading: string;
    highlightCustomPlaceholder: string;
    addedHighlightsSection: string;
    customHighlightsMax: string;
    selectionMaxPresetHighlights: string;
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
    offerQrLater: string;
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
    /** Final step — after confirmations, points to Vista previa / Publicar */
    finalStepActionsIntro: string;
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
    contactHubIntro: string;
    contactHubEmpty: string;
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
    paymentsSection: string;
    paymentsSectionHint: string;
    paymentsOtherLabel: string;
    paymentsPlaceholder: string;
    paymentsAdd: string;
    paymentsAddedList: string;
    paymentsCustomMax: string;
    paymentsStandardHeading: string;
    amenitiesSection: string;
    amenitiesSectionHint: string;
    amenitiesOtherLabel: string;
    amenitiesPlaceholder: string;
    amenitiesAdd: string;
    amenitiesAddedList: string;
    amenitiesCustomMax: string;
    credentialsSection: string;
    credentialsSectionHint: string;
    hasLicense: string;
    licenseType: string;
    licenseTypePlaceholder: string;
    licenseNumber: string;
    licenseAuthority: string;
    licenseAuthorityPlaceholder: string;
    licenseExpiration: string;
    hasInsurance: string;
    insuranceType: string;
    insuranceTypePlaceholder: string;
    certificationsLabel: string;
    certificationsPlaceholder: string;
    certificationsAdd: string;
    certificationsAddedList: string;
    certificationsCustomMax: string;
    licenseDocumentLink: string;
    licenseDocumentLinkHelp: string;
    insuranceDocumentLink: string;
    insuranceDocumentLinkHelp: string;
  };
};

const es: ClasificadosServiciosCopy = {
  pageTitle: "Publicar tu negocio en Servicios",
  pageSubtitle:
    "Completa tu perfil paso a paso. Leonix muestra en la vitrina solo lo que llenes con datos reales — contacto, servicios, horarios y promociones.",
  saveHint: "Borrador guardado en este navegador.",
  previewCta: "Vista previa",
  publishCta: "Publicar",
  publishModalTitle: "Publicar listado",
  publishModalIntro:
    "Revisamos que tu perfil tenga lo esencial para la vitrina pública. Al publicar verás si quedó en la base de datos, en el archivo de pruebas locales (solo desarrollo), o como respaldo en este navegador.",
  publishMissingTitle: "Completa lo siguiente para continuar:",
  publishClose: "Seguir editando",
  publishSubmit: "Publicar ahora",
  publishBusy: "Publicando…",
  publishError: "No se pudo publicar. Intenta de nuevo.",
  publishLocalNote:
    "Si no hay base de datos configurada, en desarrollo Leonix puede guardar en un archivo local del proyecto para que resultados y pruebas lo vean. Si tampoco aplica, queda respaldo en este navegador.",
  publishConfirmMissing:
    "Marca las tres casillas de confirmación arriba para poder publicar.",
  deleteApplication: "Eliminar solicitud",
  deleteConfirm: "¿Borrar todo el borrador de Servicios en esta sesión y empezar de nuevo?",
  previewMissingBanner: "Completa lo siguiente antes de la vista previa:",
  storageWriteFailed:
    "No se pudo guardar el borrador completo en el navegador (puede ser por tamaño). Reduce fotos o videos y vuelve a intentar.",
  goToStep: "Ir al paso {n}",
  listingPhaseDraft: "Borrador · sigue completando tu perfil.",
  listingPhasePreview: "Listo para vista previa · revisa el diseño antes de publicar.",
  listingPhasePublish: "Listo para publicar · puedes enviar tu listado.",
  linkBack: "Volver a categorías",
  langToggle: "English",
  required: "Requerido",
  sections: {
    type: "1 · Tipo de negocio",
    basic: "2 · Datos básicos y contacto",
    media: "3 · Imágenes y videos",
    about: "4 · Sobre el negocio",
    services: "5 · Servicios que ofreces",
    reasons: "¿Por qué elegirte?",
    quickFacts: "Datos rápidos",
    contact: "6 · Vista de contacto",
    social: "Redes sociales",
    hours: "7 · Horarios",
    testimonials: "Testimonios (opcional)",
    offer: "8 · Promoción (opcional)",
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
    whatsappHelp: "Para que clientes te escriban directo por WhatsApp.",
    whatsappBusinessUrl: "Enlace de WhatsApp Business o canal (opcional)",
    whatsappBusinessUrlHelp:
      "Opcional. Solo pega un enlace real de WhatsApp Business, wa.me, mensaje o canal. No uses www.whatsapp.com. Para que clientes te escriban directo, usa el número de WhatsApp.",
    quoteMessagePhone: "Número para mensajes/cotizaciones",
    quoteMessagePhoneHelp:
      "Este número recibirá mensajes de clientes interesados en pedir información o una cotización.",
    contactPhonesHeading: "Teléfonos y WhatsApp",
    contactEmailWebHeading: "Correo y sitio web",
    contactSocialHeading: "Redes sociales (URL pública)",
    languageOtherHelp: "Un idioma por línea. También puedes pegar varios separados por coma.",
    languages: "Idiomas",
    logo: "Logo del negocio",
    cover: "Imagen de portada",
    gallery: "Galería de trabajos",
    about: "Sobre nosotros",
    businessFocus: "Eslogan o frase principal",
    businessFocusHelper:
      "Escribe una frase corta que represente tu negocio. No repitas todos tus servicios; usa una frase clara para atraer clientes.",
    businessFocusPlaceholder: "Ej.: Tu ayuda legal cuando más la necesitas",
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
    xTwitter: "X (Twitter)",
    snapchat: "Snapchat",
    contactReviewsHeading: "Opiniones externas (opcional)",
    googleReviews: "Opiniones en Google (URL)",
    yelpReviews: "Opiniones en Yelp (URL)",
    contactExtraLinksHeading: "Enlaces adicionales (opcional)",
    extraLinkUrl: "URL",
    extraLinkLabel: "Describe tu enlace (opcional)",
    extraLinkLabelHelp:
      "Escribe el texto que quieres mostrar en el botón. Ejemplo: Agendar cita, Sitio web, Formulario de consulta. Si la dejas vacía, mostraremos “Enlace adicional”.",
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
    customChipPlaceholder: "Consulta gratis",
    customChipShortHint:
      "Usa pocas palabras. Ejemplos: Consulta gratis, Atención bilingüe, Más de 10 años, Disponible hoy.",
    addCustomChip: "Añadir",
    addedCustomServicesSection: "Servicios agregados:",
    customServicesMax: `Máximo ${MAX_CUSTOM_SERVICES_OFFERED} servicios personalizados`,
    selectionMaxSuggestedPresets: `Puedes elegir hasta ${MAX_SERVICES_SELECTION} servicios sugeridos.`,
    servicesSuggestedHeading: "Servicios sugeridos:",
    addOtherServiceHeading: "Agregar otro servicio:",
    customServicesHelperHint:
      "Puedes agregar varios servicios. Los primeros aparecerán destacados en el anuncio.",
    highlightsSectionTitle: "Highlights del negocio",
    highlightsSectionHelper: "Selecciona detalles que ayuden al cliente a confiar y decidir más rápido.",
    highlightsSuggestedHeading: "Sugeridos:",
    addOtherHighlightHeading: "Agregar otro highlight:",
    highlightCustomPlaceholder: "Ej.: Financiamiento disponible",
    addedHighlightsSection: "Highlights agregados:",
    customHighlightsMax: `Máximo ${MAX_CUSTOM_BUSINESS_HIGHLIGHTS} highlights personalizados`,
    selectionMaxPresetHighlights: `Puedes elegir hasta ${MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION} sugeridos.`,
    selectionMaxThree: "Máximo 3 opciones",
    aboutServicesGapNote:
      "Si algo de tu oferta no encaja en las opciones sugeridas, detállalo aquí: especialidades, materiales, alcance y condiciones. Ayuda a los clientes a entender exactamente qué resuelves.",
    leonixVerified: "Mostrar interés en Verificado Leonix",
    leonixVerifiedHint:
      "No otorga el distintivo: Leonix lo asigna en un paso controlado. Esto solo registra tu interés.",
    offerImage: "Imagen opcional",
    offerPdf: "PDF o volante (opcional)",
    offerQrLater: "",
    promotionsSectionIntro:
      "Añade hasta 4 ofertas breves para tu vitrina. Usa promociones claras, específicas y fáciles de entender.",
    promoAddPromotion: "Añadir promoción",
    promoRemovePromotion: "Quitar promoción",
    promoMaxNote: "Puedes agregar hasta 4 promociones.",
    promotionSlot: (n: number) => `Promoción ${n}`,
    promoTitlePlaceholder: "Ej.: 15% en primera visita",
    promoDetailsPlaceholder: "Incluye condiciones, fechas o qué servicio aplica.",
    promoLinkPlaceholder: "https://",
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
    finalStepActionsIntro:
      "Cuando termines las confirmaciones arriba, usa los botones de abajo para ver la vista previa o publicar. Tu progreso se guarda en esta sesión.",
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
    languageOtherPlaceholder: "",
    contactDataHeading: "Tus datos de contacto",
    contactHubIntro:
      "Leonix arma tu hub de contacto con lo que llenaste en el paso 2: teléfono, WhatsApp, correo, sitio, dirección, redes, opiniones y enlaces extra. Solo aparece lo que tenga datos válidos.",
    contactHubEmpty:
      "Aún no hay métodos de contacto listos. Completa teléfono, WhatsApp, correo o sitio web en “Datos básicos y contacto”.",
    contactVisibleHeading: "Vista previa del hub de contacto",
    contactPrimaryCtaHeading: "Destacado en la vitrina",
    contactPrimaryCtaHelp:
      "Leonix prioriza automáticamente: WhatsApp, llamada, correo y sitio web según los datos válidos que ingresaste.",
    contactSecondaryHeading: "Acciones secundarias",
    contactSummaryIntro: "Así se verá en tu vitrina pública:",
    contactSummaryCall: "Llamada",
    contactSummaryWhatsapp: "WhatsApp",
    contactSummaryWebsite: "Sitio web",
    contactSummaryEmail: "Correo",
    contactSummaryNone: "Completa al menos un contacto válido en el paso 2 para ver acciones aquí.",
    contactMessageFootnote:
      "No necesitas elegir botones manualmente: el hub se actualiza solo cuando agregas o cambias tus datos de contacto.",
    paymentsSection: "Pagos",
    paymentsSectionHint: "Opcional. Indica cómo pueden pagar tus clientes.",
    paymentsOtherLabel: "Otro método de pago",
    paymentsPlaceholder: "Ej.: Apple Pay",
    paymentsAdd: "Añadir",
    paymentsAddedList: "Métodos agregados:",
    paymentsCustomMax: "Has alcanzado el máximo de métodos personalizados (24).",
    paymentsStandardHeading: "Métodos estándar",
    amenitiesSection: "Opciones y facilidades",
    amenitiesSectionHint: "Selecciona detalles útiles para que el cliente entienda cómo trabajas.",
    amenitiesOtherLabel: "Otra opción o facilidad",
    amenitiesPlaceholder: "Ej.: Servicio para propiedades comerciales",
    amenitiesAdd: "Añadir",
    amenitiesAddedList: "Opciones agregadas:",
    amenitiesCustomMax: "Has alcanzado el máximo de opciones personalizadas (24).",
    credentialsSection: "Credenciales, licencia y seguro",
    credentialsSectionHint:
      "Agrega información que ayude al cliente a confiar. No marques nada como verificado a menos que Leonix lo verifique.",
    hasLicense: "Tengo licencia",
    licenseType: "Tipo de licencia",
    licenseTypePlaceholder: "Ej.: Contratista, cosmetología, plomería",
    licenseNumber: "Número de licencia",
    licenseAuthority: "Autoridad o estado emisor",
    licenseAuthorityPlaceholder: "Ej.: California, CSLB, junta estatal",
    licenseExpiration: "Fecha de vencimiento",
    hasInsurance: "Tengo seguro",
    insuranceType: "Tipo de seguro",
    insuranceTypePlaceholder: "Ej.: Responsabilidad general",
    certificationsLabel: "Certificaciones",
    certificationsPlaceholder: "Ej.: Técnico certificado",
    certificationsAdd: "Añadir",
    certificationsAddedList: "Certificaciones agregadas:",
    certificationsCustomMax: "Has alcanzado el máximo de certificaciones (24).",
    licenseDocumentLink: "Enlace al documento de licencia",
    licenseDocumentLinkHelp: "Opcional. Enlace https a un PDF o página con tu licencia.",
    insuranceDocumentLink: "Enlace al documento de seguro o certificado",
    insuranceDocumentLinkHelp: "Opcional. Enlace https a póliza, certificado o constancia.",
  },
};

const en: ClasificadosServiciosCopy = {
  pageTitle: "Publish your business in Services",
  pageSubtitle:
    "Complete your profile step by step. Leonix only shows what you fill in with real data — contact, services, hours, and promotions.",
  saveHint: "Draft saved in this browser.",
  previewCta: "Preview",
  publishCta: "Publish",
  publishModalTitle: "Publish listing",
  publishModalIntro:
    "We verify essentials for your public showcase. After publishing you’ll see whether it saved to the database, the local dev file (development only), or browser-only fallback.",
  publishMissingTitle: "Complete the following to continue:",
  publishClose: "Keep editing",
  publishSubmit: "Publish now",
  publishBusy: "Publishing…",
  publishError: "Could not publish. Please try again.",
  publishLocalNote:
    "Without a database, `next dev` can still persist to a local project file so results and QA see it. Otherwise a browser-only copy is kept on this device.",
  publishConfirmMissing:
    "Check all three confirmation boxes above before publishing.",
  deleteApplication: "Delete application",
  deleteConfirm: "Delete this session’s Servicios draft and start over?",
  previewMissingBanner: "Complete the following before preview:",
  storageWriteFailed:
    "Could not save the full draft in the browser (storage may be full). Try fewer photos or videos, then try again.",
  goToStep: "Go to step {n}",
  listingPhaseDraft: "Draft · keep filling out your profile.",
  listingPhasePreview: "Preview-ready · review the layout before publishing.",
  listingPhasePublish: "Publish-ready · you can submit your listing.",
  linkBack: "Back to categories",
  langToggle: "Español",
  required: "Required",
  sections: {
    type: "1 · Business type",
    basic: "2 · Basics & contact",
    media: "3 · Images & video",
    about: "4 · About the business",
    services: "5 · Services you offer",
    reasons: "Why choose you",
    quickFacts: "Quick facts",
    contact: "6 · Contact preview",
    social: "Social media",
    hours: "7 · Hours",
    testimonials: "Testimonials (optional)",
    offer: "8 · Promotion (optional)",
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
    whatsappHelp: "So customers can message you directly on WhatsApp.",
    whatsappBusinessUrl: "WhatsApp Business or channel link (optional)",
    whatsappBusinessUrlHelp:
      "Optional. Use a real WhatsApp Business, wa.me, message, or channel link. Do not use www.whatsapp.com. For direct customer messages, use the WhatsApp number.",
    quoteMessagePhone: "Number for messages / quotes",
    quoteMessagePhoneHelp:
      "This number receives messages from customers who want information or a quote.",
    contactPhonesHeading: "Phones & WhatsApp",
    contactEmailWebHeading: "Email & website",
    contactSocialHeading: "Social profiles (public URL)",
    languageOtherHelp: "One language per line. You can also paste several separated by commas.",
    languages: "Languages",
    logo: "Business logo",
    cover: "Cover image",
    gallery: "Work gallery",
    about: "About you",
    businessFocus: "Tagline or main phrase",
    businessFocusHelper:
      "Write a short phrase that represents your business. Do not repeat every service — use one clear line to attract clients.",
    businessFocusPlaceholder: "Ex: Your legal help when you need it most",
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
    xTwitter: "X (Twitter)",
    snapchat: "Snapchat",
    contactReviewsHeading: "External reviews (optional)",
    googleReviews: "Google Reviews (URL)",
    yelpReviews: "Yelp Reviews (URL)",
    contactExtraLinksHeading: "Additional links (optional)",
    extraLinkUrl: "URL",
    extraLinkLabel: "Describe your link (optional)",
    extraLinkLabelHelp:
      "Text shown on the button. Ex: Book appointment, Website, Intake form. If empty, we show “Additional link”.",
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
    customChipPlaceholder: "Free consultation",
    customChipShortHint:
      "Keep it short. Examples: Free consultation, Bilingual service, 10+ years, Available today.",
    addCustomChip: "Add",
    addedCustomServicesSection: "Added services:",
    customServicesMax: `Up to ${MAX_CUSTOM_SERVICES_OFFERED} custom services`,
    selectionMaxSuggestedPresets: `You can select up to ${MAX_SERVICES_SELECTION} suggested services.`,
    servicesSuggestedHeading: "Suggested services:",
    addOtherServiceHeading: "Add another service:",
    customServicesHelperHint:
      "You can add multiple services. The first ones may appear highlighted in the listing.",
    highlightsSectionTitle: "Business highlights",
    highlightsSectionHelper: "Select details that help customers trust the business and decide faster.",
    highlightsSuggestedHeading: "Suggested:",
    addOtherHighlightHeading: "Add another highlight:",
    highlightCustomPlaceholder: "Ex: Financing available",
    addedHighlightsSection: "Added highlights:",
    customHighlightsMax: `Up to ${MAX_CUSTOM_BUSINESS_HIGHLIGHTS} custom highlights`,
    selectionMaxPresetHighlights: `You can select up to ${MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION} suggested highlights.`,
    selectionMaxThree: "Maximum 3 options",
    aboutServicesGapNote:
      "If your offer is not fully covered by the suggested chips, describe specialties, scope, and constraints here so clients know exactly what you deliver.",
    leonixVerified: "Show interest in Leonix Verified",
    leonixVerifiedHint:
      "This does not grant the badge — Leonix assigns verification in a controlled step. This only records your interest.",
    offerImage: "Optional image",
    offerPdf: "Optional PDF / flyer",
    offerQrLater: "",
    promotionsSectionIntro:
      "Add up to 4 short offers for your profile. Use clear, specific promotions customers can understand quickly.",
    promoAddPromotion: "Add promotion",
    promoRemovePromotion: "Remove promotion",
    promoMaxNote: "You can add up to 4 promotions.",
    promotionSlot: (n: number) => `Promotion ${n}`,
    promoTitlePlaceholder: "Ex: 15% off first visit",
    promoDetailsPlaceholder: "Include conditions, dates, or which service applies.",
    promoLinkPlaceholder: "https://",
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
    finalStepActionsIntro:
      "When you finish the confirmations above, use the buttons below to preview or publish. Your progress is saved for this session.",
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
    languageOtherPlaceholder: "",
    contactDataHeading: "Your contact details",
    contactHubIntro:
      "Leonix builds your contact hub from step 2: phone, WhatsApp, email, website, address, socials, review links, and extra URLs. Only filled, valid entries appear.",
    contactHubEmpty:
      "No contact methods are ready yet. Add phone, WhatsApp, email, or website under “Basics & contact.”",
    contactVisibleHeading: "Contact hub preview",
    contactPrimaryCtaHeading: "Highlight order",
    contactPrimaryCtaHelp:
      "Leonix automatically prioritizes WhatsApp, call, email, and website based on the valid details you entered.",
    contactSecondaryHeading: "Secondary actions",
    contactSummaryIntro: "This is what your public showcase will show:",
    contactSummaryCall: "Call",
    contactSummaryWhatsapp: "WhatsApp",
    contactSummaryWebsite: "Website",
    contactSummaryEmail: "Email",
    contactSummaryNone: "Add at least one valid contact in step 2 to see actions here.",
    contactMessageFootnote:
      "You do not pick buttons manually — the hub updates when you add or change contact details.",
    paymentsSection: "Payments",
    paymentsSectionHint: "Optional. Tell customers how they can pay you.",
    paymentsOtherLabel: "Other payment method",
    paymentsPlaceholder: "Ex: Apple Pay",
    paymentsAdd: "Add",
    paymentsAddedList: "Added methods:",
    paymentsCustomMax: "You’ve reached the maximum number of custom payment methods (24).",
    paymentsStandardHeading: "Standard methods",
    amenitiesSection: "Options & amenities",
    amenitiesSectionHint: "Select helpful details so customers understand how you work.",
    amenitiesOtherLabel: "Other option or amenity",
    amenitiesPlaceholder: "Ex: Service for commercial properties",
    amenitiesAdd: "Add",
    amenitiesAddedList: "Added options:",
    amenitiesCustomMax: "You’ve reached the maximum number of custom options (24).",
    credentialsSection: "Credentials, license & insurance",
    credentialsSectionHint:
      "Add information that helps customers trust your business. Do not mark anything as verified unless Leonix verifies it.",
    hasLicense: "I have a license",
    licenseType: "License type",
    licenseTypePlaceholder: "Ex: Contractor, cosmetology, plumbing",
    licenseNumber: "License number",
    licenseAuthority: "Issuing authority or state",
    licenseAuthorityPlaceholder: "Ex: California, CSLB, state board",
    licenseExpiration: "Expiration date",
    hasInsurance: "I am insured",
    insuranceType: "Insurance type",
    insuranceTypePlaceholder: "Ex: General liability",
    certificationsLabel: "Certifications",
    certificationsPlaceholder: "Ex: Certified technician",
    certificationsAdd: "Add",
    certificationsAddedList: "Added certifications:",
    certificationsCustomMax: "You’ve reached the maximum of 24 certifications.",
    licenseDocumentLink: "License document link",
    licenseDocumentLinkHelp: "Optional. https link to a PDF or page for your license.",
    insuranceDocumentLink: "Insurance or certificate document link",
    insuranceDocumentLinkHelp: "Optional. https link to policy, certificate, or proof.",
  },
};

export function getClasificadosServiciosCopy(lang: ServiciosLang): ClasificadosServiciosCopy {
  return lang === "en" ? en : es;
}
