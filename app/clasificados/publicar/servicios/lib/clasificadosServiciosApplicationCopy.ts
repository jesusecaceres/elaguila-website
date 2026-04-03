import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

export type ClasificadosServiciosCopy = {
  pageTitle: string;
  pageSubtitle: string;
  saveHint: string;
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
  };
};

const es: ClasificadosServiciosCopy = {
  pageTitle: "Perfil de negocio · Servicios",
  pageSubtitle:
    "Un solo formulario para tu vitrina premium en Leonix. Completa cada sección; podrás refinar el texto con herramientas externas si lo deseas.",
  saveHint: "Borrador guardado en este navegador.",
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
      "No uses ratings inventados como sistema principal de reseñas. Estos testimonios son opcionales y sujetos a moderación futura.",
    dropzone: "Arrastra imágenes o haz clic para subir",
    upload: "Subir archivo",
    urlFallback: "O pega una URL de imagen",
    addUrl: "Añadir desde URL",
    remove: "Quitar",
    replace: "Cambiar",
    emptyGallery: "Aún no hay fotos en la galería.",
    invalidUrl: "Revisa el formato del enlace (https://…)",
  },
};

const en: ClasificadosServiciosCopy = {
  pageTitle: "Business profile · Services",
  pageSubtitle:
    "One guided form for your premium Leonix showcase. Complete each section; you can polish copy with external tools if needed.",
  saveHint: "Draft saved in this browser.",
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
      "Do not use fake star ratings as the main review system. Testimonials are optional and may be moderated later.",
    dropzone: "Drag images or click to upload",
    upload: "Upload file",
    urlFallback: "Or paste an image URL",
    addUrl: "Add from URL",
    remove: "Remove",
    replace: "Replace",
    emptyGallery: "No gallery photos yet.",
    invalidUrl: "Check the link format (https://…)",
  },
};

export function getClasificadosServiciosCopy(lang: ServiciosLang): ClasificadosServiciosCopy {
  return lang === "en" ? en : es;
}
