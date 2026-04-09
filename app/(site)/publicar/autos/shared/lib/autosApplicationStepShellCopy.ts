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
