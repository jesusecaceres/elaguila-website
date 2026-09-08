import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export const MASCOTAS_PERDIDOS_PREVIEW_COPY = {
  es: {
    noDraft: "No hay borrador para previsualizar.",
    backToForm: "Volver al formulario",
    edit: "Volver a editar",
    publishCta: "Publicar aviso",
    publishing: "Publicando…",
    blockedHint: "Completa los campos requeridos antes de publicar.",
    previewNote: "Vista previa — aún no se publica en Leonix Clasificados.",
    leonixPending: "Tu Leonix Ad ID se asignará al publicar.",
    resultCardPreviewTitle: "Vista previa en resultados",
    resultCardPreviewHint: "Así se verá tu aviso en la lista de Mascotas y Perdidos.",
    publishModal: {
      title: "Confirmar publicación",
      intro: "Antes de publicar, confirma una vez más lo siguiente.",
      checks: [
        "Confirmo que la información es verídica y la puedo respaldar.",
        "Confirmo que las fotos representan el aviso.",
        "Acepto las reglas de la comunidad Leonix Clasificados.",
      ] as [string, string, string],
      confirmCta: "Confirmar y publicar",
      cancelCta: "Cancelar",
      blockedHint: "Marca las tres casillas para continuar.",
      closeOverlayAria: "Cerrar",
    },
  },
  en: {
    noDraft: "No draft to preview.",
    backToForm: "Back to form",
    edit: "Back to edit",
    publishCta: "Publish notice",
    publishing: "Publishing…",
    blockedHint: "Complete required fields before publishing.",
    previewNote: "Preview — not published on Leonix Clasificados yet.",
    leonixPending: "Your Leonix Ad ID will be assigned when you publish.",
    resultCardPreviewTitle: "Results preview",
    resultCardPreviewHint: "This is how your notice will appear in the Lost & Found Pets listing.",
    publishModal: {
      title: "Confirm publish",
      intro: "Before publishing, confirm the following once more.",
      checks: [
        "I confirm the information is truthful and I can stand behind it.",
        "I confirm the photos represent the notice.",
        "I accept Leonix Clasificados community rules.",
      ] as [string, string, string],
      confirmCta: "Confirm and publish",
      cancelCta: "Cancel",
      blockedHint: "Check all three boxes to continue.",
      closeOverlayAria: "Close",
    },
  },
} as const;

export function mascotasPerdidosPreviewCopy(lang: Lang) {
  return MASCOTAS_PERDIDOS_PREVIEW_COPY[lang];
}
