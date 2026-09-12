/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — discovery catalog for project type
 * "other" (MD §7 "Other approved project type"). Previously had zero dedicated discovery and fell
 * through to the generic Website catalog (Gate 10.1 GAP17 finding) — a real, honest generic
 * catch-all engine instead, per MD Gate 10.2 <phase_12>: "Do not route it through Website questions
 * unless it actually becomes a Website-family project."
 *
 * Deliberately the smallest, most generic catalog in this domain — "other" exists specifically for
 * work that does NOT fit any named type, so its own questions must stay generic rather than
 * guessing at a shape.
 */
import type { SpecializedRequirementDefinition } from "./specializedDiscoveryEngine";

export const OTHER_PROJECT_CATALOG_VERSION = "other_project_discovery_v1";

export type OtherProjectSection = "definition" | "context" | "constraints" | "assets" | "execution" | "approval";

export const OTHER_PROJECT_SECTIONS: readonly OtherProjectSection[] = ["definition", "context", "constraints", "assets", "execution", "approval"];

type OtherReq = SpecializedRequirementDefinition<OtherProjectSection>;

export const OTHER_PROJECT_REQUIREMENTS: readonly OtherReq[] = [
  {
    fieldKey: "other_project_deliverable", section: "definition",
    labelEn: "Project name / deliverable", labelEs: "Nombre del proyecto / entregable",
    operatorGuidanceEn: "What is actually being delivered — captured in real terms, never a placeholder.", operatorGuidanceEs: "Qué se entrega realmente — capturado en términos reales, nunca un marcador de posición.",
    clientQuestionEn: "What exactly are we creating or delivering for you?", clientQuestionEs: "¿Qué exactamente estamos creando o entregando para usted?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_client_goal", section: "definition",
    labelEn: "Client goal", labelEs: "Objetivo del cliente",
    operatorGuidanceEn: "The real driving reason — never assumed.", operatorGuidanceEs: "La razón real que impulsa esto — nunca asumida.",
    clientQuestionEn: "What do you want this to accomplish?", clientQuestionEs: "¿Qué quiere que esto logre?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_audience", section: "context",
    labelEn: "Audience", labelEs: "Audiencia",
    operatorGuidanceEn: "Who this is actually for.", operatorGuidanceEs: "Para quién es realmente esto.",
    clientQuestionEn: "Who is this for?", clientQuestionEs: "¿Para quién es esto?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: true, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_desired_outcome", section: "context",
    labelEn: "Desired outcome", labelEs: "Resultado deseado",
    operatorGuidanceEn: "What success looks like — in the client's own words.", operatorGuidanceEs: "Cómo se ve el éxito — en las propias palabras del cliente.",
    clientQuestionEn: "What does success look like for this project?", clientQuestionEs: "¿Cómo se ve el éxito para este proyecto?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_references_preferences", section: "context",
    labelEn: "References / preferences", labelEs: "Referencias / preferencias",
    operatorGuidanceEn: "Anything the client has already shown or described as a direction.", operatorGuidanceEs: "Cualquier cosa que el cliente ya haya mostrado o descrito como dirección.",
    clientQuestionEn: "Do you have any references or examples of what you like?", clientQuestionEs: "¿Tiene alguna referencia o ejemplo de lo que le gusta?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_constraints", section: "constraints",
    labelEn: "Constraints", labelEs: "Restricciones",
    operatorGuidanceEn: "Anything that genuinely limits the approach — technical, legal, or otherwise.", operatorGuidanceEs: "Cualquier cosa que realmente limite el enfoque — técnica, legal, o de otro tipo.",
    clientQuestionEn: "Are there any constraints we should know about (technical, legal, brand, etc.)?", clientQuestionEs: "¿Hay alguna restricción que debamos conocer (técnica, legal, de marca, etc.)?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_deadline", section: "constraints",
    labelEn: "Deadline", labelEs: "Fecha límite",
    operatorGuidanceEn: "A real date/trigger, never invented.", operatorGuidanceEs: "Una fecha/motivo real, nunca inventado.",
    clientQuestionEn: "Is there a deadline driving this?", clientQuestionEs: "¿Hay una fecha límite que impulse esto?",
    valueType: "text", defaultCompletenessClass: "required_before_launch", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: true, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_budget_commercial_note", section: "constraints",
    labelEn: "Budget / commercial consideration (if appropriate)", labelEs: "Presupuesto / consideración comercial (si corresponde)",
    operatorGuidanceEn: "Never a price quote — only whether a commercial constraint/consideration genuinely exists, flagged for Leonix, never shown as a client-facing price.", operatorGuidanceEs: "Nunca una cotización de precio — solo si realmente existe una consideración comercial, señalada para Leonix, nunca mostrada como un precio al cliente.",
    clientQuestionEn: "Is there a budget consideration we should be aware of?", clientQuestionEs: "¿Hay alguna consideración de presupuesto que debamos tener en cuenta?",
    valueType: "text", defaultCompletenessClass: "optional", whoShouldAnswer: "CLIENT",
    priority: 4, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_existing_assets", section: "assets",
    labelEn: "Existing assets", labelEs: "Activos existentes",
    operatorGuidanceEn: "Reuses the canonical asset store — never a second upload path.", operatorGuidanceEs: "Reutiliza el almacén de activos canónico — nunca una segunda vía de carga.",
    clientQuestionEn: "Do you have any existing materials we should use or reference?", clientQuestionEs: "¿Tiene materiales existentes que debamos usar o referenciar?",
    valueType: "asset_ref", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_missing_information", section: "execution",
    labelEn: "Known missing information", labelEs: "Información faltante conocida",
    operatorGuidanceEn: "An honest running list — never silently dropped because the type is unusual.", operatorGuidanceEs: "Una lista honesta — nunca eliminada silenciosamente porque el tipo es inusual.",
    clientQuestionEn: "(Internal — not asked to the client)", clientQuestionEs: "(Interno — no se pregunta al cliente)",
    valueType: "text", defaultCompletenessClass: "needs_leonix_decision", whoShouldAnswer: "LEONIX",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_leonix_recommendation", section: "execution",
    labelEn: "Leonix recommendation", labelEs: "Recomendación de Leonix",
    operatorGuidanceEn: "Staff's own professional recommendation for how to approach this non-standard project.", operatorGuidanceEs: "La recomendación profesional propia del personal sobre cómo abordar este proyecto no estándar.",
    clientQuestionEn: "(Internal — not asked to the client)", clientQuestionEs: "(Interno — no se pregunta al cliente)",
    valueType: "text", defaultCompletenessClass: "needs_leonix_decision", whoShouldAnswer: "LEONIX",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "other_project_execution_owner", section: "execution",
    labelEn: "Execution owner / destination", labelEs: "Responsable de ejecución / destino",
    operatorGuidanceEn: "Who/what team actually executes this — never left implicit for a non-standard project.", operatorGuidanceEs: "Quién/qué equipo ejecuta realmente esto — nunca dejado implícito para un proyecto no estándar.",
    clientQuestionEn: "(Internal — not asked to the client)", clientQuestionEs: "(Interno — no se pregunta al cliente)",
    valueType: "text", defaultCompletenessClass: "needs_leonix_decision", whoShouldAnswer: "LEONIX",
    priority: 1, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "decision_maker_approver", section: "approval",
    labelEn: "Approver", labelEs: "Persona que aprueba",
    operatorGuidanceEn: "Shared with every other family's approval section.", operatorGuidanceEs: "Compartido con la sección de aprobación de cada otra familia.",
    clientQuestionEn: "Who will give final approval on this?", clientQuestionEs: "¿Quién dará la aprobación final de esto?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];
