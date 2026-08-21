/**
 * Package B, Gate 10 — Lion Code / readiness adapter for opportunities.
 *
 * Reuses the ACTUAL underlying evaluations already certified in stewardship, rather than
 * inventing a parallel "sponsorship readiness score":
 *   - checkReadinessGate() — the exact same hard Health Map readiness gate stewardship uses
 *     before it will ever generate a recommendation (stewardship/repository.ts).
 *   - ownerGoalIsKnown() — the exact same owner-goal-confirmed check (stewardship/repository.ts).
 *   - The Lion Code rule itself is intentionally kept textually identical to
 *     stewardship/sixTests.ts's testLionCode(): "capacity-blocked + demand-generating action ⇒
 *     protect the business before selling visibility." It is not re-derived independently.
 *
 * An opportunity is not itself a Health-Map recommendation (it has no dimensionKey / template /
 * cost band), so the full six-test evaluator (which requires a RecommendationTemplate) does not
 * apply cleanly. Rather than force-fit an unrelated domain object into that evaluator, this
 * adapter surfaces the two checks that are actually meaningful for "should this be recommended
 * for action right now": Health Map readiness, and the Lion Code capacity-protection rule.
 * Opportunities that fail this check are NOT hidden — the doctrine (Package B, section 10)
 * requires showing them as an unactioned potential match, never suppressing them silently.
 */
import "server-only";

import { checkReadinessGate, ownerGoalIsKnown } from "../stewardship/repository";

export interface OpportunityReadinessResult {
  readinessIsReady: boolean;
  humanReviewRequired: boolean;
  capacityBlocked: boolean;
  ownerGoalKnown: boolean;
  /** True when Lion Code would counsel against pursuing this now (see doctrine above). */
  lionCodeConcern: boolean;
  /** True only when readiness is confirmed AND Lion Code has no concern. */
  recommendedForAction: boolean;
  explanationEs: string;
  explanationEn: string;
}

function buildResult(params: {
  readinessIsReady: boolean;
  humanReviewRequired: boolean;
  capacityBlocked: boolean;
  ownerGoalKnownVal: boolean;
  isDemandGenerating: boolean;
}): OpportunityReadinessResult {
  const { readinessIsReady, humanReviewRequired, capacityBlocked, ownerGoalKnownVal, isDemandGenerating } = params;

  // Textually identical rule to stewardship/sixTests.ts testLionCode().
  const lionCodeConcern = capacityBlocked && isDemandGenerating;
  const recommendedForAction = readinessIsReady && !lionCodeConcern;

  let explanationEs: string;
  let explanationEn: string;
  if (!readinessIsReady) {
    explanationEs = "El Mapa de salud del negocio no está en estado listo para recomendaciones — esta oportunidad se muestra solo como posible, no como recomendada para actuar todavía.";
    explanationEn = "The business's Health Map is not in a ready state for recommendations — this opportunity is shown only as potential, not yet recommended for action.";
  } else if (lionCodeConcern) {
    explanationEs = "La capacidad operativa del negocio no está confirmada. Generar más demanda ahora podría bajar la calidad del servicio, así que esta oportunidad no se recomienda para actuar todavía.";
    explanationEn = "The business's operating capacity is not confirmed. Generating more demand now could lower service quality, so this opportunity is not recommended for action yet.";
  } else if (humanReviewRequired) {
    explanationEs = "La evaluación de salud tiene una bandera de revisión humana activa — un miembro del equipo debe confirmar antes de actuar.";
    explanationEn = "The health assessment carries an active human-review flag — a staff member should confirm before acting.";
  } else {
    explanationEs = "El negocio está listo y no hay una preocupación de capacidad conocida — esta oportunidad puede recomendarse para acción.";
    explanationEn = "The business is ready and there is no known capacity concern — this opportunity can be recommended for action.";
  }

  return {
    readinessIsReady,
    humanReviewRequired,
    capacityBlocked,
    ownerGoalKnown: ownerGoalKnownVal,
    lionCodeConcern,
    recommendedForAction,
    explanationEs,
    explanationEn,
  };
}

/**
 * `isDemandGenerating` defaults to true because every opportunity type in Package B (editorial
 * match, sponsored feature, seasonal campaign, category feature, business campaign) is, by
 * definition, a visibility/demand-facing action — matching stewardship's own convention where
 * "leonix_product_or_advertising"-style interventions are treated as demand-generating.
 */
export async function evaluateOpportunityReadiness(businessId: string, isDemandGenerating = true): Promise<OpportunityReadinessResult> {
  const gate = await checkReadinessGate(businessId);
  const ownerGoalKnownVal = await ownerGoalIsKnown(businessId);

  if (!gate.ok) {
    return buildResult({
      readinessIsReady: false,
      humanReviewRequired: false,
      capacityBlocked: false,
      ownerGoalKnownVal,
      isDemandGenerating,
    });
  }

  const capacityBlocked = gate.dimensionResults.some(
    (d) => d.dimensionKey === "operations_and_capacity" && (d.status === "needs_attention" || d.status === "insufficient_information"),
  );

  return buildResult({
    readinessIsReady: true,
    humanReviewRequired: gate.humanReviewRequired,
    capacityBlocked,
    ownerGoalKnownVal,
    isDemandGenerating,
  });
}
