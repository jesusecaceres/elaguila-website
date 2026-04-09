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
      ? "Arriba tienes Vista previa, Publicar anuncio y Eliminar solicitud. La vista previa abre en esta ventana después de guardar el borrador."
      : "Above you’ll find Preview, Publish listing, and Delete application. Preview opens in this window after saving your draft.",
    reviewChecklistTitle: isEs ? "Lista de completitud" : "Completeness",
    reviewAllGood: isEs
      ? "Los datos mínimos para una vista previa sólida están listos."
      : "Minimum data for a solid preview is in place.",
    reviewNotReadyTitle: isEs ? "Aún no está listo para vista previa" : "Not ready for preview yet",
    reviewNotReadyIntro: isEs
      ? "Completa los requisitos estructurales en los pasos indicados abajo. Vista previa y publicación se desbloquean cuando la ficha esté completa."
      : "Finish the structural requirements in the steps below. Preview and publish unlock once the listing shell is complete.",
    gatingPreviewTapBlocked: isEs
      ? "Te llevamos al primer paso pendiente. Completa la lista antes de abrir la vista previa."
      : "We moved you to the first step that still needs work. Finish the checklist before opening preview.",
    gatingPublishTapBlocked: isEs
      ? "Te llevamos al primer paso pendiente. Completa la lista antes de continuar a publicar."
      : "We moved you to the first step that still needs work. Finish the checklist before publishing.",
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
