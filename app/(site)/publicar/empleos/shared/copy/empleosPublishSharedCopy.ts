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
      sessionDraftLine: "$24.99 por 30 días. El pago seguro usa Leonix Revenue OS; la activación ocurre después del webhook de Stripe.",
      previewCta: "Vista previa",
      publishCta: "Publicar",
      saveDraftCta: "Guardar borrador",
      deleteRequest: "Eliminar solicitud",
      deleteConfirm: "¿Eliminar esta solicitud de la sesión? Se perderán los cambios no publicados.",
    },
    stagedSuccess:
      "Borrador guardado en Leonix. Para empleos de pago, completa el checkout seguro; la publicación activa depende del webhook de Stripe.",
    publishModal: {
      title: "Confirmar publicación",
      intro: "$24.99 por 30 días. Al confirmar guardamos tu anuncio y te llevamos al pago seguro de Leonix. La activación ocurre solo después del pago confirmado.",
      checks: [
        "Confirmo que la información es verídica y la puedo respaldar.",
        "Confirmo que las fotos y medios representan el empleo o evento anunciado.",
        "Acepto las reglas de la comunidad Leonix Clasificados para este anuncio.",
      ] as [string, string, string],
      confirmCta: "Pagar y publicar empleo",
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
      sessionDraftLine: "$24.99 for 30 days. Secure payment uses Leonix Revenue OS; activation happens after the Stripe webhook.",
      previewCta: "Preview",
      publishCta: "Publish",
      saveDraftCta: "Save draft",
      deleteRequest: "Delete application",
      deleteConfirm: "Delete this application from the session? Unpublished changes will be lost.",
    },
    stagedSuccess:
      "Draft saved on Leonix. For paid job posts, complete secure checkout; live activation depends on the Stripe webhook.",
    publishModal: {
      title: "Confirm publish",
      intro: "$24.99 for 30 days. When you confirm we save your listing and take you to Leonix secure checkout. Activation only happens after confirmed payment.",
      checks: [
        "I confirm the information is truthful and I can stand behind it.",
        "I confirm photos and media represent the job or event.",
        "I accept Leonix Clasificados community rules for this listing.",
      ] as [string, string, string],
      confirmCta: "Pay and publish job post",
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
