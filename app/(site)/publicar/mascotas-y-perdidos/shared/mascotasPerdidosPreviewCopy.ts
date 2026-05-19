import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export const MASCOTAS_PERDIDOS_PREVIEW_COPY = {
  es: {
    noDraft: "No hay borrador para previsualizar.",
    backToForm: "Volver al formulario",
    edit: "Editar aviso",
    publishFree: "Publicar gratis",
    publishing: "Publicando…",
    blockedHint: "Completa los campos requeridos antes de publicar.",
    previewNote: "Vista previa — aún no se publica en Leonix Clasificados.",
    leonixPending: "Tu Leonix Ad ID se asignará al publicar.",
    contact: "Contacto",
    location: "Ubicación",
  },
  en: {
    noDraft: "No draft to preview.",
    backToForm: "Back to form",
    edit: "Edit notice",
    publishFree: "Publish for free",
    publishing: "Publishing…",
    blockedHint: "Complete required fields before publishing.",
    previewNote: "Preview — not published on Leonix Clasificados yet.",
    leonixPending: "Your Leonix Ad ID will be assigned when you publish.",
    contact: "Contact",
    location: "Location",
  },
} as const;

export function mascotasPerdidosPreviewCopy(lang: Lang) {
  return MASCOTAS_PERDIDOS_PREVIEW_COPY[lang];
}
