/**
 * TODAY-3 — the pure Six-Test Engine. Deliberately NOT "server-only" (no I/O, no secret) so it is
 * directly unit-testable, matching the healthMap/logic.ts and diyConcierge/logic.ts convention.
 * Every test is deterministic — no generative AI, no fabricated evidence, no vanity/fear scoring.
 * Any fail or blocked result must prevent the parent recommendation from ever reaching approved
 * (enforced in repository.ts/API layer, since a cross-table DB CHECK cannot span two tables).
 */
import { SIX_TEST_RULE_VERSION } from "./constants";
import type { RecommendationConfidence, RecommendationTemplate, SixTestKey, SixTestResult } from "./types";

export type SixTestInput = {
  /** The Health Map dimension result status this recommendation is drawn from. */
  dimensionStatus: string;
  /** True only when the latest business_recommendation_readiness row for the source run is 'ready'. */
  readinessIsReady: boolean;
  /** True when a human-review flag is layered on the readiness gate. */
  humanReviewRequired: boolean;
  /** The candidate template under evaluation. */
  template: RecommendationTemplate;
  /** True only when at least one owner_confirmed/staff_confirmed fact exists in business_and_owner_goals. */
  ownerGoalKnown: boolean;
  /** True when operations_and_capacity's dimension status is itself needs_attention/insufficient_information —
   * i.e. the business's own capacity is not yet confirmed sufficient. */
  capacityBlocked: boolean;
};

export type SixTestOutcome = {
  testKey: SixTestKey;
  result: SixTestResult;
  explanationEs: string;
  explanationEn: string;
  confidence: RecommendationConfidence;
  evidenceRefs: readonly string[];
  ruleVersion: string;
};

function outcome(testKey: SixTestKey, result: SixTestResult, explanationEs: string, explanationEn: string, confidence: RecommendationConfidence, evidenceRefs: readonly string[] = []): SixTestOutcome {
  return { testKey, result, explanationEs, explanationEn, confidence, evidenceRefs, ruleVersion: SIX_TEST_RULE_VERSION };
}

function testNeed(input: SixTestInput): SixTestOutcome {
  if (input.dimensionStatus === "blocked_by_contradiction") {
    return outcome("need", "blocked", "Hay una contradicción sin resolver que impide confirmar la necesidad.", "There's an unresolved contradiction that prevents confirming the need.", "low");
  }
  if (input.template.appliesToDimensionStatuses.includes(input.dimensionStatus)) {
    return outcome("need", "pass", "El Mapa de salud confirma una necesidad real y verificada en esta área.", "The Health Map confirms a real, verified need in this area.", "high", [`dimension_status:${input.dimensionStatus}`]);
  }
  return outcome("need", "fail", "El resultado actual del Mapa de salud no respalda esta necesidad específica.", "The current Health Map result does not support this specific need.", "medium");
}

function testReadiness(input: SixTestInput): SixTestOutcome {
  // Defense in depth: the hard readiness gate already blocks recommendation creation entirely
  // unless the source run's readiness is 'ready'. This test re-confirms that truth was not lost
  // between the gate and evaluation, and independently reflects a human-review flag as a caution.
  if (!input.readinessIsReady) {
    return outcome("readiness", "blocked", "La preparación para recomendaciones no está en estado listo.", "Recommendation readiness is not in the ready state.", "high");
  }
  if (input.humanReviewRequired) {
    return outcome("readiness", "caution", "Esta evaluación tiene una bandera de revisión humana activa.", "This assessment carries an active human-review flag.", "medium");
  }
  return outcome("readiness", "pass", "La preparación para recomendaciones está confirmada como lista.", "Recommendation readiness is confirmed ready.", "high");
}

function testCapacity(input: SixTestInput): SixTestOutcome {
  if (input.capacityBlocked && input.template.isDemandGenerating) {
    return outcome("capacity", "fail", "Esta acción podría generar más demanda de la que el negocio puede manejar hoy.", "This action could generate more demand than the business can handle today.", "medium", ["dimension:operations_and_capacity"]);
  }
  if (input.capacityBlocked) {
    return outcome("capacity", "caution", "La capacidad operativa aún no está confirmada, aunque esta acción específica no genera más demanda.", "Operating capacity is not yet confirmed, though this specific action does not generate more demand.", "medium");
  }
  return outcome("capacity", "pass", "No hay evidencia de que esta acción exceda la capacidad conocida del negocio.", "There's no evidence this action exceeds the business's known capacity.", "medium");
}

function testLifeAlignment(input: SixTestInput): SixTestOutcome {
  if (!input.ownerGoalKnown) {
    return outcome("life_alignment", "caution", "Las metas del dueño no están confirmadas todavía — no se puede afirmar que esta acción encaje con su vida deseada.", "The owner's goals are not confirmed yet — this action's fit with their desired life cannot be claimed.", "low");
  }
  return outcome("life_alignment", "pass", "Las metas confirmadas del dueño no contradicen esta acción.", "The owner's confirmed goals do not contradict this action.", "medium", ["fact_category:business_and_owner_goals"]);
}

function testValue(input: SixTestInput): SixTestOutcome {
  if (input.template.costBand === "500_plus") {
    return outcome("value", "caution", "Esta opción tiene un costo más alto; existen opciones más pequeñas y verdaderas a considerar primero.", "This option carries a higher cost; smaller, truer options exist to consider first.", "medium");
  }
  return outcome("value", "pass", "El valor esperado es razonable frente al esfuerzo y costo requeridos.", "The expected value is reasonable relative to the required effort and cost.", "medium");
}

function testLionCode(input: SixTestInput): SixTestOutcome {
  if (input.template.primaryIntervention === "leonix_product_or_advertising" && input.capacityBlocked) {
    return outcome("lion_code", "fail", "Vender visibilidad a un negocio que aún no está listo para más demanda protegería las ganancias antes que al negocio.", "Selling visibility to a business not yet ready for more demand would protect profit before the business.", "high");
  }
  return outcome("lion_code", "pass", "Esta recomendación protege antes de vender, enseña en lugar de crear dependencia innecesaria, y respeta al empresario.", "This recommendation protects before it profits, teaches rather than creating unnecessary dependency, and respects the entrepreneur.", "high");
}

/** Evaluates all six tests deterministically. Never calls an AI provider. */
export function evaluateSixTests(input: SixTestInput): readonly SixTestOutcome[] {
  return [
    testNeed(input),
    testReadiness(input),
    testCapacity(input),
    testLifeAlignment(input),
    testValue(input),
    testLionCode(input),
  ];
}

/** Any fail or blocked result prevents approval — never overridden away, never silently passed. */
export function sixTestsAllowApproval(outcomes: readonly SixTestOutcome[]): boolean {
  return outcomes.every((o) => o.result !== "fail" && o.result !== "blocked");
}
