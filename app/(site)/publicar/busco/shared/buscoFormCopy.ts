import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export const BUSCO_FORM_COPY = {
  es: {
    pageSubtitle: "Completa los datos de tu solicitud. Revisa la vista previa antes de publicar (próximamente).",
    sections: {
      main: "Tu solicitud",
      location: "Ubicación",
      contact: "Contacto",
      media: "Imagen (opcional)",
    },
    fields: {
      type: "Tipo de búsqueda",
      typeOther: "¿Qué buscas?",
      title: "Título",
      description: "Descripción breve",
      city: "Ciudad",
      zone: "Última ubicación / zona",
      budget: "Presupuesto aproximado",
      phone: "Teléfono / WhatsApp",
      email: "Correo electrónico",
      image: "Foto (opcional)",
    },
    imageHint: "Una imagen máximo. JPG, PNG o WebP.",
    imageRemove: "Quitar imagen",
    previewCta: "Ver vista previa",
    gateFail: "Completa lo siguiente para continuar:",
    contactHint: "Indica al menos teléfono/WhatsApp o correo para que te puedan contactar.",
  },
  en: {
    pageSubtitle: "Fill in your request details. Review the preview before publishing (coming soon).",
    sections: {
      main: "Your request",
      location: "Location",
      contact: "Contact",
      media: "Image (optional)",
    },
    fields: {
      type: "Request type",
      typeOther: "What are you looking for?",
      title: "Title",
      description: "Short description",
      city: "City",
      zone: "Last known location / area",
      budget: "Approximate budget",
      phone: "Phone / WhatsApp",
      email: "Email",
      image: "Photo (optional)",
    },
    imageHint: "One image max. JPG, PNG, or WebP.",
    imageRemove: "Remove image",
    previewCta: "View preview",
    gateFail: "Complete the following to continue:",
    contactHint: "Provide at least phone/WhatsApp or email so people can reach you.",
  },
} as const;

export function buscoFormCopy(lang: Lang) {
  return BUSCO_FORM_COPY[lang];
}
