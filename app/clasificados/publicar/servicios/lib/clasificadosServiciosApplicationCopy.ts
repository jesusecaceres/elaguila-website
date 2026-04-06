import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

export type ClasificadosServiciosCopy = {
  pageTitle: string;
  pageSubtitle: string;
  saveHint: string;
  /** Primary CTA — saves draft and opens preview */
  previewCta: string;
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
    serviceAreas: string;
    phone: string;
    website: string;
    whatsapp: string;
    languages: string;
    logo: string;
    cover: string;
    gallery: string;
    about: string;
    specialties: string;
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
    dropzone: string;
    upload: string;
    urlFallback: string;
    addUrl: string;
    remove: string;
    replace: string;
    emptyGallery: string;
    invalidUrl: string;
    galleryFeaturedHint: string;
    galleryMoreHint: string;
    videosHint: string;
    videoUrlPlaceholder: string;
    addVideoUrl: string;
    videoPrimary: string;
    customService: string;
    customServicePlaceholder: string;
    aboutServicesGapNote: string;
    leonixVerified: string;
    leonixVerifiedHint: string;
    offerImage: string;
    offerPdf: string;
    moveUp: string;
    moveDown: string;
    featuredToggle: string;
  };
};

const es: ClasificadosServiciosCopy = {
  pageTitle: "Perfil de negocio · Servicios",
  pageSubtitle:
    "Un solo formulario para tu vitrina premium en Leonix. Completa cada sección; podrás refinar el texto con herramientas externas si lo deseas.",
  saveHint: "Borrador guardado en este navegador.",
  previewCta: "Ver vista previa",
  linkPreviewShell: "Ver ejemplo de página pública (solo diseño)",
  linkBack: "Volver a categorías",
  langToggle: "English",
  required: "Requerido",
  sections: {
    type: "1 · Tipo de negocio",
    basic: "2 · Información básica",
    media: "3 · Imágenes y marca",
    about: "4 · Sobre el negocio",
    services: "5 · Servicios que ofreces",
    reasons: "6 · ¿Por qué elegirte?",
    quickFacts: "7 · Datos rápidos",
    contact: "8 · Contacto y acciones",
    social: "9 · Redes sociales",
    hours: "10 · Horarios",
    testimonials: "11 · Testimonios (opcional)",
    offer: "12 · Oferta o cupón (opcional)",
  },
  labels: {
    businessType: "Tipo de negocio",
    businessName: "Nombre del negocio",
    city: "Ciudad principal",
    serviceAreas: "Zonas / área de servicio (opcional)",
    phone: "Teléfono",
    website: "Sitio web",
    whatsapp: "WhatsApp",
    languages: "Idiomas",
    logo: "Logo del negocio",
    cover: "Imagen de portada",
    gallery: "Galería de trabajos",
    about: "Sobre nosotros",
    specialties: "Especialidades (una línea corta)",
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
    offerTitle: "Título de la oferta",
    offerDetails: "Detalles",
    offerLink: "Enlace (opcional)",
    offerNote: "Más adelante podrá vincularse al ecosistema de cupones Leonix.",
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
    galleryFeaturedHint:
      "Selecciona las 4 imágenes principales que quieres mostrar en tu anuncio (icono de estrella).",
    galleryMoreHint: "Las imágenes adicionales podrán verse al abrir la galería.",
    videosHint: "Puedes agregar hasta 2 videos (archivo o enlace, por ejemplo YouTube).",
    videoUrlPlaceholder: "https://… (YouTube o archivo en línea)",
    addVideoUrl: "Añadir video por URL",
    videoPrimary: "Video principal / tour",
    customService: "Otro servicio",
    customServicePlaceholder: "Ej.: instalación de marcos a medida",
    aboutServicesGapNote:
      "Si algo de tu oferta no encaja en las opciones sugeridas, detállalo aquí: especialidades, materiales, alcance y condiciones. Ayuda a los clientes a entender exactamente qué resuelves.",
    leonixVerified: "Mostrar interés en Verificado Leonix",
    leonixVerifiedHint: "Es un distintivo de confianza; la verificación real se confirma en un paso posterior.",
    offerImage: "Imagen de la oferta (opcional)",
    offerPdf: "PDF / archivo de la oferta (opcional)",
    moveUp: "Arriba",
    moveDown: "Abajo",
    featuredToggle: "Principal en anuncio",
  },
};

const en: ClasificadosServiciosCopy = {
  pageTitle: "Business profile · Services",
  pageSubtitle:
    "One guided form for your premium Leonix showcase. Complete each section; you can polish copy with external tools if needed.",
  saveHint: "Draft saved in this browser.",
  previewCta: "Preview",
  linkPreviewShell: "View example public page (design only)",
  linkBack: "Back to categories",
  langToggle: "Español",
  required: "Required",
  sections: {
    type: "1 · Business type",
    basic: "2 · Basic information",
    media: "3 · Brand & media",
    about: "4 · About the business",
    services: "5 · Services you offer",
    reasons: "6 · Why choose you",
    quickFacts: "7 · Quick facts",
    contact: "8 · Contact & actions",
    social: "9 · Social media",
    hours: "10 · Hours",
    testimonials: "11 · Testimonials (optional)",
    offer: "12 · Offer / coupon (optional)",
  },
  labels: {
    businessType: "Business type",
    businessName: "Business name",
    city: "Main city",
    serviceAreas: "Service areas (optional)",
    phone: "Phone",
    website: "Website",
    whatsapp: "WhatsApp",
    languages: "Languages",
    logo: "Business logo",
    cover: "Cover image",
    gallery: "Work gallery",
    about: "About you",
    specialties: "Specialties (one short line)",
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
    offerTitle: "Offer title",
    offerDetails: "Details",
    offerLink: "Link (optional)",
    offerNote: "Later this can connect to Leonix coupon tools.",
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
    galleryFeaturedHint:
      "Pick up to 4 main photos for your listing (star toggle). Those appear in the hero gallery grid.",
    galleryMoreHint: "Additional photos will be available when the expanded gallery opens.",
    videosHint: "You can add up to 2 videos (upload or URL, e.g. YouTube).",
    videoUrlPlaceholder: "https://… (YouTube or direct file)",
    addVideoUrl: "Add video URL",
    videoPrimary: "Primary / tour video",
    customService: "Other service",
    customServicePlaceholder: "e.g. custom trim installation",
    aboutServicesGapNote:
      "If your offer is not fully covered by the suggested chips, describe specialties, scope, and constraints here so clients know exactly what you deliver.",
    leonixVerified: "Show interest in Leonix Verified",
    leonixVerifiedHint: "A trust badge; real verification is confirmed in a later step.",
    offerImage: "Offer image (optional)",
    offerPdf: "Offer PDF / file (optional)",
    moveUp: "Up",
    moveDown: "Down",
    featuredToggle: "Featured on listing",
  },
};

export function getClasificadosServiciosCopy(lang: ServiciosLang): ClasificadosServiciosCopy {
  return lang === "en" ? en : es;
}
