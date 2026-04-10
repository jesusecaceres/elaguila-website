import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function getAutosApplicationStepShellCopy(lang: AutosNegociosLang) {
  const isEs = lang === "es";
  return {
    category: isEs ? "Clasificados" : "Classifieds",
    laneNegocios: isEs ? "Negocios" : "Business",
    lanePrivado: isEs ? "Privado" : "Private",
    progress: (current: number, total: number) =>
      isEs ? `Paso ${current} de ${total}` : `Step ${current} of ${total}`,
    previous: isEs ? "Anterior" : "Previous",
    next: isEs ? "Siguiente" : "Next",
    mobileStepLabel: isEs ? "Ir al paso" : "Go to step",
    reviewTitle: isEs ? "Revisión final" : "Final review",
    reviewIntro: isEs
      ? "Completa la lista de arriba; luego usa vista previa o publicar (con las confirmaciones requeridas)."
      : "Finish the checklist above; then use preview or publish (with the required confirmations).",
    finalStepPublishHeading: isEs ? "Antes de publicar" : "Before publishing",
    finalStepActionsIntro: isEs
      ? "La vista previa guarda el borrador una vez en este navegador y abre la vista en esta misma ventana."
      : "Preview saves the draft once in this browser and opens in this window.",
    reviewChecklistTitle: isEs ? "Lista de completitud" : "Completeness",
    reviewAllGood: isEs
      ? "Los datos mínimos para una vista previa sólida están listos."
      : "Minimum data for a solid preview is in place.",
    reviewNotReadyTitle: isEs ? "Aún no está listo para vista previa" : "Not ready for preview yet",
    reviewNotReadyIntro: isEs
      ? "Completa los pasos indicados; luego podrás abrir vista previa o publicar."
      : "Complete the steps below; then you can open preview or publish.",
    gatingPreviewTapBlocked: isEs
      ? "Te llevamos al primer paso pendiente. Completa la lista antes de abrir la vista previa."
      : "We moved you to the first step that still needs work. Finish the checklist before opening preview.",
    gatingPublishTapBlocked: isEs
      ? "Te llevamos al primer paso pendiente. Completa la lista antes de continuar a publicar."
      : "We moved you to the first step that still needs work. Finish the checklist before publishing.",
    gatingPublishChecksBlocked: isEs
      ? "Marca las tres confirmaciones para continuar a confirmar y pago."
      : "Check all three confirmations to continue to confirmation and payment.",
    stepNeedsAttentionShort: isEs ? "Pendiente" : "Needs attention",
  };
}

/** Step titles follow the same order for both lanes; lane toggles labels where copy differs. */
export function getAutosApplicationStepLabels(lang: AutosNegociosLang, lane: "negocios" | "privado"): string[] {
  const isEs = lang === "es";
  return [
    isEs ? "Información principal" : "Main information",
    isEs ? "Especificaciones" : "Specifications",
    lane === "negocios"
      ? isEs
        ? "Destacados y equipamiento"
        : "Highlights & equipment"
      : isEs
        ? "Destacados"
        : "Highlights",
    isEs ? "Fotos y medios" : "Photos & media",
    lane === "negocios"
      ? isEs
        ? "Negocio / contacto"
        : "Business / contact"
      : isEs
        ? "Vendedor / contacto"
        : "Seller / contact",
    isEs ? "Descripción" : "Description",
    isEs ? "Vista previa / revisión" : "Preview / review",
  ];
}
