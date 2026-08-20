/**
 * LEO-20A — Deterministic Next Right Move ranking (recommendation only).
 * leoCanExecuteWithCurrentAuthority is always false — CAPABILITY != AUTHORITY.
 */
import type {
  LeoSelfIntelligenceBlindSpot,
  LeoSelfIntelligenceDimensionResult,
  LeoSelfIntelligenceImpactLevel,
  LeoSelfIntelligenceNextMove,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

function impactRank(v: LeoSelfIntelligenceImpactLevel): number {
  switch (v) {
    case "CRITICAL":
      return 5;
    case "HIGH":
      return 4;
    case "MEDIUM":
      return 3;
    case "LOW":
      return 2;
    default:
      return 0;
  }
}

function effortPenalty(effort: LeoSelfIntelligenceNextMove["effort"]): number {
  if (effort === "LOW") return 0;
  if (effort === "MEDIUM") return 1;
  return 2;
}

function scoreMove(m: LeoSelfIntelligenceNextMove): number {
  return (
    impactRank(m.severity) * 6 +
    impactRank(m.operationalImpact) * 3 +
    impactRank(m.customerImpact) * 3 +
    impactRank(m.revenueImpact) * 3 +
    impactRank(m.trustImpact) * 2 +
    impactRank(m.strategicValue) * 2 +
    (m.confidence === "HIGH" ? 3 : m.confidence === "MEDIUM" ? 2 : m.confidence === "LOW" ? 1 : 0) -
    effortPenalty(m.effort) -
    m.dependencyOrder
  );
}

function moveFromDimension(d: LeoSelfIntelligenceDimensionResult): LeoSelfIntelligenceNextMove | null {
  if (d.state === "HEALTHY" || d.state === "NOT_MEASURED") return null;
  if (d.state === "UNKNOWN" && d.coverage === "NONE") return null;

  const severity: LeoSelfIntelligenceImpactLevel =
    d.state === "CRITICAL"
      ? "CRITICAL"
      : d.state === "NEEDS_ATTENTION"
        ? "HIGH"
        : d.state === "WATCH"
          ? "MEDIUM"
          : "LOW";

  const title =
    d.state === "CRITICAL"
      ? `Resolve critical ${d.dimension.toLowerCase().replace(/_/g, " ")} risk`
      : d.state === "NEEDS_ATTENTION"
        ? `Clear ${d.dimension.toLowerCase().replace(/_/g, " ")} attention items`
        : d.state === "WATCH"
          ? `Review ${d.dimension.toLowerCase().replace(/_/g, " ")} watch items`
          : `Clarify inconclusive ${d.dimension.toLowerCase().replace(/_/g, " ")} evidence`;

  return {
    id: `nrm:${d.dimension}:${d.state}`.toLowerCase(),
    title,
    whyNow: d.reason,
    evidenceRefs: d.evidenceRefs.slice(0, 8),
    expectedBenefit:
      d.state === "CRITICAL" || d.state === "NEEDS_ATTENTION"
        ? "Reduce active operational/customer risk with evidence-backed owner action."
        : "Prevent silent degradation by reviewing supported concerns.",
    risk: "Acting without reading the linked evidence could mis-prioritize work.",
    effort: d.state === "WATCH" || d.state === "UNKNOWN" ? "LOW" : "MEDIUM",
    severity,
    customerImpact:
      d.dimension === "OPERATIONS" || d.dimension === "PRODUCT_OPERATIONAL_HEALTH" ? severity : "LOW",
    revenueImpact: d.dimension === "REVENUE_MONETIZATION_HEALTH" ? severity : "LOW",
    trustImpact: d.dimension === "OPERATIONS" ? "MEDIUM" : "LOW",
    operationalImpact:
      d.dimension === "OPERATIONS" || d.dimension === "TECHNOLOGY_READINESS" ? severity : "MEDIUM",
    strategicValue: d.state === "CRITICAL" ? "HIGH" : "MEDIUM",
    reversibility: "EASY",
    confidence: d.confidence,
    dependencyOrder: d.state === "CRITICAL" ? 0 : d.state === "NEEDS_ATTENTION" ? 1 : 2,
    ownerActionRequired: true,
    leoCanPrepare: d.dimension === "OPERATIONS" || d.dimension === "PRODUCT_OPERATIONAL_HEALTH",
    leoCanExecuteWithCurrentAuthority: false,
    limitations: [
      "Recommendation only — does not grant execution authority.",
      ...d.limitations.slice(0, 2),
    ],
    relatedDimension: d.dimension,
  };
}

function moveFromBlindSpot(b: LeoSelfIntelligenceBlindSpot): LeoSelfIntelligenceNextMove | null {
  // Blind spots are diagnostic facts — only promote strategically important instrumentation gaps
  // as LOW-effort "acknowledge / plan sensor" recommendations, not fake urgent builds.
  if (b.dimension !== "CUSTOMER_JOURNEY" && b.dimension !== "DISCOVERY_SEO") return null;
  return {
    id: `nrm:blind:${b.dimension}`.toLowerCase(),
    title: `Acknowledge ${b.dimension.toLowerCase().replace(/_/g, " ")} blind spot`,
    whyNow: b.reason,
    evidenceRefs: [`blind_spot:${b.dimension}`],
    expectedBenefit: "Keeps decision-making honest by not treating unmeasured areas as healthy.",
    risk: "Turning a blind spot into an immediate large build can waste effort without sensor design.",
    effort: "LOW",
    severity: "LOW",
    customerImpact: b.dimension === "CUSTOMER_JOURNEY" ? "MEDIUM" : "LOW",
    revenueImpact: "LOW",
    trustImpact: "LOW",
    operationalImpact: "LOW",
    strategicValue: "MEDIUM",
    reversibility: "EASY",
    confidence: "HIGH",
    dependencyOrder: 8,
    ownerActionRequired: false,
    leoCanPrepare: true,
    leoCanExecuteWithCurrentAuthority: false,
    limitations: [
      "Diagnostic recommendation — not an automatic engineering ticket.",
      b.whatEvidenceIsMissing,
    ],
    relatedDimension: b.dimension,
  };
}

export function rankLeoSelfIntelligenceNextMoves(input: {
  dimensions: LeoSelfIntelligenceDimensionResult[];
  blindSpots: LeoSelfIntelligenceBlindSpot[];
  maxMoves?: number;
}): { topNextMove: LeoSelfIntelligenceNextMove | null; additionalNextMoves: LeoSelfIntelligenceNextMove[] } {
  const maxMoves = input.maxMoves ?? 5;
  const candidates: LeoSelfIntelligenceNextMove[] = [];

  for (const d of input.dimensions) {
    const m = moveFromDimension(d);
    if (m) candidates.push(m);
  }
  for (const b of input.blindSpots) {
    const m = moveFromBlindSpot(b);
    if (m) candidates.push(m);
  }

  candidates.sort((a, b) => {
    const diff = scoreMove(b) - scoreMove(a);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });

  const bounded = candidates.slice(0, maxMoves);
  return {
    topNextMove: bounded[0] ?? null,
    additionalNextMoves: bounded.slice(1),
  };
}
