export const EMPLEOS_PUBLISH_SHARED_COPY = {
  es: {
    topActions: {
      vistaPrevia: "Vista previa",
      abrirVistaPrevia: "Abrir vista previa",
      deleteApplication: "Eliminar borrador",
      deleteConfirm: "¿Eliminar este borrador de la sesión? Se perderán los cambios no publicados.",
      ariaGroup: "Acciones del anuncio",
    },
    gateFail: "Completa los campos marcados con * antes de la vista previa:",
    publishBlocked: "Completa los requisitos de vista previa antes de la revisión final.",
    stagedSuccess:
      "Listo para el siguiente paso: tu intención de publicación quedó registrada solo en esta sesión (sin pago ni anuncio en vivo).",
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
      closeOverlayAria: "Cerrar",
    },
    previewNoDraft: {
      message: "No hay borrador de sesión para mostrar.",
      backLink: "Volver a editar",
    },
  },
  en: {
    topActions: {
      vistaPrevia: "Preview",
      abrirVistaPrevia: "Open preview",
      deleteApplication: "Delete application",
      deleteConfirm: "Delete this session draft? Unpublished changes will be lost.",
      ariaGroup: "Listing actions",
    },
    gateFail: "Complete required fields (*) before preview:",
    publishBlocked: "Complete preview requirements before the final review.",
    stagedSuccess:
      "Ready for the next step: your publish intent was recorded for this session only (no payment or live listing yet).",
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
      closeOverlayAria: "Close",
    },
    previewNoDraft: {
      message: "No session draft to display.",
      backLink: "Back to edit",
    },
  },
} as const;
