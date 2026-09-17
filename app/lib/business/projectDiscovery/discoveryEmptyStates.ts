/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — required empty-state copy (MD
 * <empty_states>: "never a blank card"). Centralized so every screen uses identical wording and
 * the test suite can assert on it directly rather than duplicating strings.
 */
import type { BilingualLabel } from "./discoveryLabels";

export const EMPTY_STATE_NO_DISCOVERY: BilingualLabel = {
  es: "Aún no hay descubrimiento de cliente para este negocio. Inicie uno para comenzar a capturar lo que el cliente dice.",
  en: "There is no client discovery for this business yet. Start one to begin capturing what the client says.",
};

export const EMPTY_STATE_NO_PROJECT_INTENT: BilingualLabel = {
  es: "Aún no hay un proyecto agregado a este descubrimiento. Agregue un proyecto (por ejemplo, Sitio web) para empezar.",
  en: "No project has been added to this discovery yet. Add a project (for example, Website) to get started.",
};

export const EMPTY_STATE_NO_NOTES: BilingualLabel = {
  es: "Aún no hay notas de reunión guardadas para este descubrimiento.",
  en: "No meeting notes have been saved for this discovery yet.",
};

export const EMPTY_STATE_NO_ASSETS: BilingualLabel = {
  es: "Aún no hay archivos o referencias visuales adjuntas a este descubrimiento.",
  en: "No files or visual references are attached to this discovery yet.",
};

export const EMPTY_STATE_QUESTIONS_CLIENT_COMPLETE_LEONIX_REMAINS: BilingualLabel = {
  es: "No hay más preguntas para el cliente en este momento. Quedan decisiones internas de Leonix pendientes — vea la sección de Decisiones de Leonix.",
  en: "There are no more client questions right now. Leonix decisions are still outstanding internally — see the Leonix Decisions section.",
};

export const EMPTY_STATE_QUESTIONS_RESEARCH_REMAINS: BilingualLabel = {
  es: "No hay más preguntas para el cliente en este momento. Queda investigación oficial pendiente.",
  en: "There are no more client questions right now. Official research is still outstanding.",
};

export const EMPTY_STATE_QUESTIONS_ACTUALLY_READY: BilingualLabel = {
  es: "No hay más preguntas para el cliente. Este proyecto está listo para el plan del proyecto.",
  en: "There are no more client questions. This project is ready for the blueprint.",
};

export const EMPTY_STATE_QUESTIONS_NON_WEBSITE: BilingualLabel = {
  es: "Este tipo de proyecto todavía no tiene su propio cuestionario adaptativo — esa parte llegará en una futura mejora. Puede capturar notas y referencias mientras tanto.",
  en: "This project type does not have its own adaptive questionnaire yet — that part is future work. You can still capture notes and references in the meantime.",
};

export function questionsEmptyStateFor(clientDiscoveryComplete: boolean, leonixDecisionsRemain: boolean, officialResearchRemains: boolean): BilingualLabel {
  if (!clientDiscoveryComplete) return EMPTY_STATE_QUESTIONS_ACTUALLY_READY;
  if (leonixDecisionsRemain) return EMPTY_STATE_QUESTIONS_CLIENT_COMPLETE_LEONIX_REMAINS;
  if (officialResearchRemains) return EMPTY_STATE_QUESTIONS_RESEARCH_REMAINS;
  return EMPTY_STATE_QUESTIONS_ACTUALLY_READY;
}
