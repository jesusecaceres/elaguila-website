/**
 * Gate BCO-6A — pure, deterministic Health Map calculation engine. No AI model call, no network
 * crawling, no hidden weighted scoring, no numeric score. Every conclusion is derived from
 * explicit rule-registry conditions applied to the Living Business Book's own records, and every
 * conclusion carries traceable supporting record references (fact/evidence/unknown/contradiction
 * ids) — never a bare label.
 */
import { deriveFactFreshness } from "../livingBook/logic";
import type { BusinessContradiction, BusinessEvidence, BusinessFact, BusinessUnknown } from "../livingBook/types";
import { CORE_READINESS_DIMENSIONS, HEALTH_DIMENSION_KEYS, MAX_REASON_LENGTH } from "./constants";
import { HEALTH_RULE_REGISTRY, ruleForDimension, type DimensionRule, type StructuredValueCondition } from "./ruleRegistry";
import type {
  BusinessHealthDimensionResult, BusinessHealthFinding, BusinessRecommendationReadiness, HealthConfidence, HealthDimensionKey,
  HealthDimensionStatus, HealthEvidenceStrength, HealthFindingSeverity, HealthFindingType, HealthFreshness,
} from "./types";

export type HealthCalculationInput = {
  businessId: string;
  /** All active (non-superseded, non-rejected) facts for this business. */
  facts: readonly BusinessFact[];
  evidence: readonly BusinessEvidence[];
  unknowns: readonly BusinessUnknown[];
  /** All contradictions (open and resolved) — only OPEN ones block a dimension. */
  contradictions: readonly BusinessContradiction[];
  nowIso: string;
};

export type DimensionCalculation = Omit<
  BusinessHealthDimensionResult,
  "id" | "assessmentRunId" | "createdAt" | "calculatedAt"
> & { calculatedAt: string };

export type FindingDraft = Omit<BusinessHealthFinding, "id" | "assessmentRunId" | "dimensionResultId" | "createdAt">;

function readStructuredField(value: unknown, field: "answer" | "choice"): string | boolean | null {
  if (value === null || typeof value !== "object") return null;
  const v = (value as Record<string, unknown>)[field];
  if (typeof v === "boolean" || typeof v === "string") return v;
  return null;
}

function conditionMatches(fact: BusinessFact | undefined, condition: StructuredValueCondition): boolean {
  if (!fact) return false;
  const fieldValue = readStructuredField(fact.value, condition.field);
  if (fieldValue === null) return false;
  return (condition.matchValues as readonly (string | boolean)[]).includes(fieldValue);
}

/** Present (active) facts for a dimension's relevant fact keys, one row per key (the caller already filtered to active-only). */
function factsByKey(facts: readonly BusinessFact[]): Map<string, BusinessFact> {
  const map = new Map<string, BusinessFact>();
  for (const f of facts) {
    if (f.status !== "active") continue;
    map.set(f.factKey, f);
  }
  return map;
}

function worstFreshness(freshnesses: readonly HealthFreshness[]): HealthFreshness {
  if (freshnesses.some((f) => f === "stale")) return "stale";
  if (freshnesses.some((f) => f === "unknown")) return "unknown";
  if (freshnesses.some((f) => f === "aging")) return "aging";
  if (freshnesses.length > 0) return "fresh";
  return "unknown";
}

function evidenceStrengthFor(evidenceRows: readonly BusinessEvidence[]): HealthEvidenceStrength {
  if (evidenceRows.length === 0) return "none";
  const highCount = evidenceRows.filter((e) => e.reliability === "high").length;
  if (highCount >= 2) return "high";
  if (highCount >= 1 || evidenceRows.length >= 2) return "medium";
  return "low";
}

/**
 * Calculates one dimension's result. Ordering matters and is the core determinism guarantee:
 *   1. an OPEN contradiction touching a present relevant fact always wins -> blocked_by_contradiction
 *   2. a known, structured negative signal (a real answered fact revealing a problem) -> needs_attention
 *   3. missing required information (never escalated to needs_attention on its own) -> insufficient_information
 *   4. otherwise -> strong or stable, based on confirmation/evidence/freshness/helpful-fact coverage
 */
export function calculateDimension(dimensionKey: HealthDimensionKey, input: HealthCalculationInput): DimensionCalculation {
  const rule = ruleForDimension(dimensionKey);
  const activeByKey = factsByKey(input.facts);
  const presentRelevant = rule.relevantFactKeys.map((k) => activeByKey.get(k)).filter((f): f is BusinessFact => Boolean(f));
  const presentIds = new Set(presentRelevant.map((f) => f.id));

  const openContradictions = input.contradictions.filter(
    (c) => c.status === "open" && ((c.claimAFactId && presentIds.has(c.claimAFactId)) || (c.claimBFactId && presentIds.has(c.claimBFactId))),
  );

  const relatedEvidence = input.evidence.filter((e) => e.relatedFactId && presentIds.has(e.relatedFactId));
  const relatedUnknowns = input.unknowns.filter(
    (u) => u.status === "open" && u.relatedFactId !== null && presentIds.has(u.relatedFactId),
  );

  const freshness = worstFreshness(
    presentRelevant.map((f) => deriveFactFreshness(f.lastVerifiedAt, input.nowIso)),
  );
  const evidenceStrength = evidenceStrengthFor(relatedEvidence);

  const supportingFactIds = presentRelevant.map((f) => f.id);
  const supportingEvidenceIds = relatedEvidence.map((e) => e.id);
  const relatedUnknownIds = relatedUnknowns.map((u) => u.id);
  const relatedContradictionIds = openContradictions.map((c) => c.id);

  const base = {
    businessId: input.businessId,
    dimensionKey,
    supportingFactIds,
    supportingEvidenceIds,
    relatedUnknownIds,
    relatedContradictionIds,
    freshness,
    evidenceStrength,
    calculationVersion: rule.calculationVersion,
    calculatedAt: input.nowIso,
  };

  // 1. Material contradiction always wins.
  if (openContradictions.length > 0) {
    const t = rule.explanationTemplates.blocked_by_contradiction;
    return {
      ...base,
      status: "blocked_by_contradiction",
      confidence: "low",
      explanationEs: t.es,
      explanationEn: t.en,
      limitationsEs: "Esta contradicción debe resolverse antes de confiar en esta información.",
      limitationsEn: "This contradiction must be resolved before this information can be trusted.",
    };
  }

  // 2. Known negative signal from an actually-answered structured fact.
  const negativeSignal = rule.negativeSignalConditions.some((c) => conditionMatches(activeByKey.get(c.factKey), c));
  if (negativeSignal) {
    const t = rule.explanationTemplates.needs_attention;
    return {
      ...base,
      status: "needs_attention",
      confidence: presentRelevant.length > 0 ? "medium" : "low",
      explanationEs: t.es,
      explanationEn: t.en,
      limitationsEs: null,
      limitationsEn: null,
    };
  }

  // 3. Missing required information -> insufficient_information, never auto-escalated.
  const missingRequired = rule.requiredFactKeys.filter((k) => !activeByKey.has(k));
  if (missingRequired.length > 0) {
    const t = rule.explanationTemplates.insufficient_information;
    return {
      ...base,
      status: "insufficient_information",
      confidence: "low",
      explanationEs: t.es,
      explanationEn: t.en,
      limitationsEs: "Falta información requerida para evaluar esta dimensión con confianza.",
      limitationsEn: "Required information is missing to assess this dimension with confidence.",
    };
  }

  // 4. All required present -> strong vs stable, plus confidence.
  const missingHelpful = rule.helpfulFactKeys.filter((k) => !activeByKey.has(k));
  const requiredFacts = rule.requiredFactKeys.map((k) => activeByKey.get(k)).filter((f): f is BusinessFact => Boolean(f));
  const allRequiredOwnerConfirmed = requiredFacts.every((f) => f.confirmationState === "owner_confirmed" || f.sourceClass === "owner_confirmed");
  const freshEnough = freshness === "fresh" || freshness === "aging";
  const hasEvidence = evidenceStrength !== "none";

  const isStrong = allRequiredOwnerConfirmed && freshness === "fresh" && hasEvidence && missingHelpful.length === 0;

  if (isStrong) {
    const t = rule.explanationTemplates.strong;
    return { ...base, status: "strong", confidence: "high", explanationEs: t.es, explanationEn: t.en, limitationsEs: null, limitationsEn: null };
  }

  const confidence: HealthConfidence = allRequiredOwnerConfirmed && freshEnough ? "medium" : "low";
  const t = rule.explanationTemplates.stable;
  return {
    ...base,
    status: "stable",
    confidence,
    explanationEs: t.es,
    explanationEn: t.en,
    limitationsEs: missingHelpful.length > 0 ? "Información complementaria útil todavía no está disponible." : null,
    limitationsEn: missingHelpful.length > 0 ? "Helpful supporting information is not yet available." : null,
  };
}

export function calculateAllDimensions(input: HealthCalculationInput): DimensionCalculation[] {
  return HEALTH_DIMENSION_KEYS.map((key) => calculateDimension(key, input));
}

/** One finding per dimension result, reflecting exactly what that result already concluded — never a new inference. */
export function findingsForDimension(dim: DimensionCalculation): FindingDraft[] {
  const drafts: FindingDraft[] = [];
  const commonRefs = {
    supportingFactIds: dim.supportingFactIds,
    supportingEvidenceIds: dim.supportingEvidenceIds,
    relatedUnknownIds: dim.relatedUnknownIds,
    relatedContradictionIds: dim.relatedContradictionIds,
    confidence: dim.confidence,
    visibility: "owner_and_staff" as const,
    status: "active" as const,
  };

  const typeAndSeverity: Record<HealthDimensionStatus, { type: HealthFindingType; severity: HealthFindingSeverity }> = {
    strong: { type: "strength", severity: "info" },
    stable: { type: "strength", severity: "info" },
    needs_attention: { type: "risk", severity: "medium" },
    insufficient_information: { type: "unknown", severity: "low" },
    blocked_by_contradiction: { type: "contradiction", severity: "high" },
  };

  const { type, severity } = typeAndSeverity[dim.status];
  drafts.push({
    ...commonRefs,
    businessId: dim.businessId,
    findingType: type,
    severity,
    titleEs: `${dim.dimensionKey}: ${dim.status}`,
    titleEn: `${dim.dimensionKey}: ${dim.status}`,
    explanationEs: dim.explanationEs,
    explanationEn: dim.explanationEn,
  });
  return drafts;
}

export type ReadinessCalculation = Omit<BusinessRecommendationReadiness, "id" | "assessmentRunId" | "createdAt" | "updatedAt" | "humanReviewRequired" | "humanReviewMarkedByEmail" | "humanReviewMarkedAt" | "humanReviewNote">;

/**
 * Deterministic priority order (documented, not implicit): a material contradiction always blocks
 * first; capacity risk is checked next since recommending growth into a business that cannot
 * absorb it is actively harmful; an unresolved sensitive/unconfirmed fact requires a human before
 * anything is generated; missing information on the three core dimensions blocks after that;
 * otherwise the business is ready.
 */
export function calculateReadiness(
  dimensions: readonly DimensionCalculation[],
  input: HealthCalculationInput,
  calculationVersion: string,
): ReadinessCalculation {
  const activeByKey = factsByKey(input.facts);

  const blockedDimensions = dimensions.filter((d) => d.status === "blocked_by_contradiction");
  if (blockedDimensions.length > 0) {
    const blockingContradictionIds = [...new Set(blockedDimensions.flatMap((d) => d.relatedContradictionIds))];
    return {
      businessId: input.businessId,
      readinessStatus: "resolve_contradictions_first",
      reasonEs: "Hay contradicciones sin resolver que deben aclararse antes de generar cualquier recomendación.".slice(0, MAX_REASON_LENGTH),
      reasonEn: "There are unresolved contradictions that must be clarified before any recommendation can be generated.".slice(0, MAX_REASON_LENGTH),
      blockingDimensionKeys: blockedDimensions.map((d) => d.dimensionKey),
      blockingUnknownIds: [],
      blockingContradictionIds,
      calculationVersion,
    };
  }

  const capacityRule = HEALTH_RULE_REGISTRY.find((r) => r.dimensionKey === "operations_and_capacity") as DimensionRule;
  const capacityRisk = capacityRule.capacityRiskConditions.some((c) => conditionMatches(activeByKey.get(c.factKey), c));
  if (capacityRisk) {
    return {
      businessId: input.businessId,
      readinessStatus: "capacity_risk",
      reasonEs: "La información conocida indica que más demanda podría perjudicar al negocio en este momento.".slice(0, MAX_REASON_LENGTH),
      reasonEn: "The known information indicates that more demand could harm the business right now.".slice(0, MAX_REASON_LENGTH),
      blockingDimensionKeys: ["operations_and_capacity"],
      blockingUnknownIds: [],
      blockingContradictionIds: [],
      calculationVersion,
    };
  }

  const unconfirmedSensitive = HEALTH_RULE_REGISTRY.flatMap((rule) =>
    rule.sensitiveFactKeys
      .map((k) => activeByKey.get(k))
      .filter((f): f is BusinessFact => f !== undefined)
      .filter((f) => f.confirmationState !== "owner_confirmed"),
  );
  if (unconfirmedSensitive.length > 0) {
    return {
      businessId: input.businessId,
      readinessStatus: "human_review_required",
      reasonEs: "Esta evaluación contiene información sensible que un miembro del equipo debe revisar antes de continuar.".slice(0, MAX_REASON_LENGTH),
      reasonEn: "This assessment contains sensitive information that a team member must review before continuing.".slice(0, MAX_REASON_LENGTH),
      blockingDimensionKeys: [],
      blockingUnknownIds: [],
      blockingContradictionIds: [],
      calculationVersion,
    };
  }

  const coreInsufficient = dimensions.filter((d) => CORE_READINESS_DIMENSIONS.includes(d.dimensionKey) && d.status === "insufficient_information");
  if (coreInsufficient.length > 0) {
    const blockingUnknownIds = [...new Set(coreInsufficient.flatMap((d) => d.relatedUnknownIds))];
    return {
      businessId: input.businessId,
      readinessStatus: "needs_more_information",
      reasonEs: "Falta información esencial sobre el negocio antes de poder generar una recomendación con confianza.".slice(0, MAX_REASON_LENGTH),
      reasonEn: "Essential information about the business is missing before a recommendation can be generated with confidence.".slice(0, MAX_REASON_LENGTH),
      blockingDimensionKeys: coreInsufficient.map((d) => d.dimensionKey),
      blockingUnknownIds,
      blockingContradictionIds: [],
      calculationVersion,
    };
  }

  return {
    businessId: input.businessId,
    readinessStatus: "ready",
    reasonEs: "La información disponible es suficiente y consistente para considerar una recomendación en el futuro.".slice(0, MAX_REASON_LENGTH),
    reasonEn: "The available information is sufficient and consistent to consider a recommendation in the future.".slice(0, MAX_REASON_LENGTH),
    blockingDimensionKeys: [],
    blockingUnknownIds: [],
    blockingContradictionIds: [],
    calculationVersion,
  };
}

export function summarizeCounts(dimensions: readonly DimensionCalculation[]) {
  return {
    totalDimensionsAssessed: dimensions.length,
    strongCount: dimensions.filter((d) => d.status === "strong").length,
    stableCount: dimensions.filter((d) => d.status === "stable").length,
    needsAttentionCount: dimensions.filter((d) => d.status === "needs_attention").length,
    insufficientInformationCount: dimensions.filter((d) => d.status === "insufficient_information").length,
    contradictionBlockedCount: dimensions.filter((d) => d.status === "blocked_by_contradiction").length,
  };
}

/** Owner-safe shaping: only owner_and_staff-visibility findings, and never staff-only internal machinery. */
export function shapeFindingsForOwnerView(findings: readonly BusinessHealthFinding[]): BusinessHealthFinding[] {
  return findings.filter((f) => f.status === "active" && f.visibility === "owner_and_staff");
}

export function shapeDimensionResultsForOwnerView(results: readonly BusinessHealthDimensionResult[]): Pick<
  BusinessHealthDimensionResult,
  "dimensionKey" | "status" | "explanationEs" | "explanationEn" | "limitationsEs" | "limitationsEn" | "calculatedAt"
>[] {
  // Owner view never exposes confidence machinery, supporting record ids, evidence strength, or
  // freshness internals -- only the plain-language conclusion and its limitations.
  return results.map((r) => ({
    dimensionKey: r.dimensionKey,
    status: r.status,
    explanationEs: r.explanationEs,
    explanationEn: r.explanationEn,
    limitationsEs: r.limitationsEs,
    limitationsEn: r.limitationsEn,
    calculatedAt: r.calculatedAt,
  }));
}
