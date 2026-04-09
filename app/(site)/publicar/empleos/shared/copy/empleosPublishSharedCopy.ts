export const EMPLEOS_PUBLISH_SHARED_COPY = {
  es: {
    topActions: {
      vistaPrevia: "Vista previa",
      abrirVistaPrevia: "Abrir vista previa",
      deleteApplication: "Eliminar borrador",
      deleteConfirm: "¿Eliminar este borrador de la sesión? Se perderán los cambios no publicados.",
    },
    gateFail: "Completa los campos marcados con * antes de la vista previa:",
    publishModal: {
      title: "Confirmar publicación",
      intro: "El pago y la publicación en vivo llegarán en una fase posterior. Por ahora confirma que revisaste tu anuncio.",
      checks: [
        "Confirmo que la información es verídica y la puedo respaldar.",
        "Confirmo que las fotos y medios representan el empleo o evento anunciado.",
        "Acepto las reglas de la comunidad Leonix Clasificados para este anuncio.",
      ] as [string, string, string],
      confirmCta: "Continuar (sin pago aún)",
      cancelCta: "Cancelar",
      blockedHint: "Marca las tres casillas para continuar.",
    },
  },
  en: {
    topActions: {
      vistaPrevia: "Preview",
      abrirVistaPrevia: "Open preview",
      deleteApplication: "Delete application",
      deleteConfirm: "Delete this session draft? Unpublished changes will be lost.",
    },
    gateFail: "Complete required fields (*) before preview:",
    publishModal: {
      title: "Confirm publish",
      intro: "Payment and live listing will arrive in a later phase. For now confirm you reviewed your listing.",
      checks: [
        "I confirm the information is truthful and I can stand behind it.",
        "I confirm photos and media represent the job or event.",
        "I accept Leonix Clasificados community rules for this listing.",
      ] as [string, string, string],
      confirmCta: "Continue (no payment yet)",
      cancelCta: "Cancel",
      blockedHint: "Check all three boxes to continue.",
    },
  },
} as const;
