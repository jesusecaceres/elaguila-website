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
    reviewTitle: isEs ? "Listo para revisar" : "Ready to review",
    reviewIntro: isEs
      ? "Usa los botones de arriba para abrir la vista previa en esta pestaña o en una nueva. Tu borrador se guarda automáticamente."
      : "Use the buttons above to open preview in this tab or a new tab. Your draft saves automatically.",
    reviewChecklistTitle: isEs ? "Antes de la vista previa" : "Before preview",
    reviewAllGood: isEs ? "No faltan datos estructurales clave." : "No key structural fields are missing.",
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
