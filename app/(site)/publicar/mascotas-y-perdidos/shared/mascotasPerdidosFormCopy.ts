import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export const MASCOTAS_PERDIDOS_FORM_COPY = {
  es: {
    pageSubtitle: "Aviso gratuito y sencillo. Revisa la vista previa antes de publicar (próximo paso).",
    sections: {
      main: "Tu aviso",
      location: "Ubicación",
      contact: "Contacto",
      media: "Imagen",
    },
    fields: {
      noticeType: "Tipo de aviso",
      title: "Título",
      description: "Descripción breve",
      city: "Ciudad",
      lastSeenLocation: "Última ubicación vista / lugar",
      contactPhone: "Teléfono / WhatsApp",
      email: "Correo electrónico (opcional)",
      image: "Subir imagen",
    },
    imageHint: "Una imagen obligatoria. Solo JPG, PNG o WebP. Sin PDF ni volante.",
    imageRemove: "Quitar imagen",
    previewCta: "Continuar a vista previa",
    gateFail: "Completa lo siguiente para continuar:",
    leonixNote:
      "El Leonix Ad ID (prefijo PET) se asignará al publicar en el siguiente paso. No es un ID final todavía.",
    handoffTitle: "Borrador guardado",
    handoffBody:
      "La vista previa y la publicación se conectarán en el siguiente paso del producto. Puedes seguir editando el formulario abajo.",
    handoffDismiss: "Entendido",
  },
  en: {
    pageSubtitle: "Free, simple notice. Preview before publishing (next step).",
    sections: {
      main: "Your notice",
      location: "Location",
      contact: "Contact",
      media: "Image",
    },
    fields: {
      noticeType: "Notice type",
      title: "Title",
      description: "Short description",
      city: "City",
      lastSeenLocation: "Last seen / location",
      contactPhone: "Phone / WhatsApp",
      email: "Email (optional)",
      image: "Upload image",
    },
    imageHint: "One required image. JPG, PNG, or WebP only. No PDF or flyer.",
    imageRemove: "Remove image",
    previewCta: "Continue to preview",
    gateFail: "Complete the following to continue:",
    leonixNote: "Your Leonix Ad ID (PET prefix) will be assigned when you publish in the next step—not a final ID yet.",
    handoffTitle: "Draft saved",
    handoffBody:
      "Preview and publishing will be wired in the next product step. You can keep editing the form below.",
    handoffDismiss: "Got it",
  },
} as const;

export function mascotasPerdidosFormCopy(lang: Lang) {
  return MASCOTAS_PERDIDOS_FORM_COPY[lang];
}
