export const EMPLEOS_PUBLISH_SHARED_COPY = {
  es: {
    /** Legacy keys — kept for shared modal / tests; primary UX uses `finalStep`. */
    topActions: {
      vistaPrevia: "Vista previa",
      abrirVistaPrevia: "Abrir vista previa",
      deleteApplication: "Eliminar borrador",
      deleteConfirm: "¿Eliminar esta solicitud de la sesión? Se perderán los cambios no publicados.",
      ariaGroup: "Acciones del anuncio",
    },
    applicationPage: {
      quickSubtitle:
        "Crea un anuncio local claro para encontrar trabajadores en tu comunidad.",
      premiumSubtitle:
        "Completa cada sección. La vista previa y la publicación están al final, en el paso de revisión.",
      feriaSubtitle:
        "Completa cada sección. La vista previa y la publicación están al final, en el paso de revisión.",
    },
    gateFail: "Completa los campos marcados con * antes de la vista previa:",
    publishBlocked: "Completa los requisitos de vista previa antes de publicar.",
    finalStep: {
      title: "Revisión final",
      intro:
        "Cuando hayas revisado el contenido, usa los botones de abajo para ver el anuncio en la vista previa real o iniciar la publicación.",
      sessionDraftLine: "$24.99 por 30 días. El pago se activará en el flujo final de lanzamiento y no bloquea esta prueba QA.",
      previewCta: "Vista previa",
      publishCta: "Publicar",
      saveDraftCta: "Guardar borrador",
      deleteRequest: "Eliminar solicitud",
      deleteConfirm: "¿Eliminar esta solicitud de la sesión? Se perderán los cambios no publicados.",
    },
    stagedSuccess:
      "Publicación guardada en Leonix. Si activaste revisión manual (EMPLEOS_REQUIRE_LISTING_REVIEW), un administrador debe aprobar antes de aparecer en resultados.",
    publishModal: {
      title: "Confirmar publicación",
      intro: "$24.99 por 30 días. El pago se activará en el flujo final de lanzamiento; por ahora confirma que revisaste tu anuncio.",
      checks: [
        "Confirmo que la información es verídica y la puedo respaldar.",
        "Confirmo que las fotos y medios representan el empleo o evento anunciado.",
        "Acepto las reglas de la comunidad Leonix Clasificados para este anuncio.",
      ] as [string, string, string],
      confirmCta: "Publicar para QA (pago después)",
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
      deleteConfirm: "Delete this application from the session? Unpublished changes will be lost.",
      ariaGroup: "Listing actions",
    },
    applicationPage: {
      quickSubtitle: "Create a clear local job ad to find workers in your community.",
      premiumSubtitle: "Complete each section. Preview and publish are at the bottom, in the final review step.",
      feriaSubtitle: "Complete each section. Preview and publish are at the bottom, in the final review step.",
    },
    gateFail: "Complete required fields (*) before preview:",
    publishBlocked: "Complete preview requirements before publishing.",
    finalStep: {
      title: "Final review",
      intro:
        "When your content is ready, use the buttons below to open the real preview or start publishing.",
      sessionDraftLine: "$24.99 for 30 days. Payment will be activated in the final launch checkout flow and does not block this QA pass.",
      previewCta: "Preview",
      publishCta: "Publish",
      saveDraftCta: "Save draft",
      deleteRequest: "Delete application",
      deleteConfirm: "Delete this application from the session? Unpublished changes will be lost.",
    },
    stagedSuccess:
      "Saved to Leonix. If manual review is enabled (EMPLEOS_REQUIRE_LISTING_REVIEW), an admin must approve before it appears in results.",
    publishModal: {
      title: "Confirm publish",
      intro: "$24.99 for 30 days. Payment will be activated in the final launch checkout flow; for now confirm you reviewed your listing.",
      checks: [
        "I confirm the information is truthful and I can stand behind it.",
        "I confirm photos and media represent the job or event.",
        "I accept Leonix Clasificados community rules for this listing.",
      ] as [string, string, string],
      confirmCta: "Publish for QA (payment later)",
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
