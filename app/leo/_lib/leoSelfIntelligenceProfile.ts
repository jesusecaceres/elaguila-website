/**
 * LEO-20A — Dynamic Leonix Internal Intelligence Profile assembler.
 * No persistence. No aggregate numeric health score.
 */
import { adaptLeoSelfIntelligenceV1Dimensions } from "@/app/leo/_lib/leoSelfIntelligenceAdapters";
import type { LeoSelfIntelligenceAdapterInput } from "@/app/leo/_lib/leoSelfIntelligenceAdapters";
import { buildLeoSelfIntelligenceBlindSpots } from "@/app/leo/_lib/leoSelfIntelligenceBlindSpots";
import { buildLeoSelfIntelligenceHealthMap } from "@/app/leo/_lib/leoSelfIntelligenceHealthMap";
import { rankLeoSelfIntelligenceNextMoves } from "@/app/leo/_lib/leoSelfIntelligenceNextMove";
import {
  LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS,
  LEO_SELF_INTELLIGENCE_NOT_CLAIMING,
  type LeonixInternalIntelligenceProfile,
  type LeoSelfIntelligenceFreshness,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

function overallFreshness(
  dimensions: LeonixInternalIntelligenceProfile["dimensions"],
): { overall: LeoSelfIntelligenceFreshness; notes: string[] } {
  const notes: string[] = [];
  const ranks: Record<LeoSelfIntelligenceFreshness, number> = {
    CURRENT: 0,
    AGING: 1,
    STALE: 2,
    UNKNOWN: 3,
  };
  let worst: LeoSelfIntelligenceFreshness = "CURRENT";
  let saw = false;
  for (const d of dimensions) {
    if (d.state === "NOT_MEASURED") continue;
    saw = true;
    if (ranks[d.freshness] > ranks[worst]) worst = d.freshness;
  }
  if (!saw) {
    return { overall: "UNKNOWN", notes: ["No measured V1 dimensions contributed freshness."] };
  }
  if (worst === "STALE") notes.push("At least one measured dimension is STALE.");
  if (worst === "AGING") notes.push("At least one measured dimension is AGING.");
  if (worst === "UNKNOWN") notes.push("Freshness unknown for one or more measured dimensions.");
  return { overall: worst, notes };
}

function composeOverallInterpretation(
  healthMap: LeonixInternalIntelligenceProfile["healthMap"],
): string {
  const attention = healthMap.filter(
    (d) => d.state === "CRITICAL" || d.state === "NEEDS_ATTENTION" || d.state === "WATCH",
  );
  const healthy = healthMap.filter((d) => d.state === "HEALTHY");
  const unknown = healthMap.filter((d) => d.state === "UNKNOWN");
  const deferred = LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS.map((d) => d.replace(/_/g, " ").toLowerCase());

  const parts: string[] = [];
  if (attention.length > 0) {
    parts.push(
      attention
        .map((d) => `${d.dimension.replace(/_/g, " ").toLowerCase()} is ${d.state.replace(/_/g, " ").toLowerCase()}`)
        .join("; "),
    );
  }
  if (healthy.length > 0) {
    parts.push(
      `${healthy.map((d) => d.dimension.replace(/_/g, " ").toLowerCase()).join(", ")} look stable within known coverage`,
    );
  }
  if (unknown.length > 0) {
    parts.push(
      `${unknown.map((d) => d.dimension.replace(/_/g, " ").toLowerCase()).join(", ")} remain inconclusive`,
    );
  }
  parts.push(
    `${deferred.slice(0, 3).join(", ")} (and related deferred areas) are not currently measurable`,
  );

  const text = parts.join(". ") + ".";
  // Never allow numeric score language.
  return text.replace(/\b\d{1,3}\s*%/g, "[score omitted]");
}

/** Assemble dynamic profile from adapter input (pure). */
export function assembleLeonixInternalIntelligenceProfile(
  input: LeoSelfIntelligenceAdapterInput,
): LeonixInternalIntelligenceProfile {
  const generatedAt = new Date(input.nowMs).toISOString();
  const dimensions = adaptLeoSelfIntelligenceV1Dimensions(input);
  const healthMap = buildLeoSelfIntelligenceHealthMap(dimensions);
  const blindSpots = buildLeoSelfIntelligenceBlindSpots(healthMap);
  const { topNextMove, additionalNextMoves } = rankLeoSelfIntelligenceNextMoves({
    dimensions: healthMap,
    blindSpots,
  });

  const measured = healthMap.filter((d) => d.state !== "NOT_MEASURED");
  const withCoverage = healthMap.filter((d) => d.coverage !== "NONE");
  const freshnessSummary = overallFreshness(healthMap);

  const limitations = [
    "Self-Intelligence V1 is a dynamic interpretation layer — not a second source of operational truth.",
    "No aggregate health percentage or letter grade is produced.",
    "Deferred dimensions remain NOT_MEASURED until real sensors exist.",
    ...healthMap.flatMap((d) => d.limitations).slice(0, 8),
  ];

  return {
    generatedAt,
    dimensions: healthMap,
    healthMap,
    blindSpots,
    topNextMove,
    additionalNextMoves,
    evidenceCoverage: {
      v1DimensionsWithCoverage: withCoverage.length,
      v1DimensionsMeasured: measured.length,
      deferredNotMeasured: LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS.length,
      notes: [
        "V1 measures OPERATIONS, REVENUE_MONETIZATION_HEALTH, TECHNOLOGY_READINESS, PRODUCT_OPERATIONAL_HEALTH only.",
      ],
    },
    freshnessSummary,
    limitations: [...new Set(limitations)].slice(0, 16),
    overallInterpretation: composeOverallInterpretation(healthMap),
    notClaiming: LEO_SELF_INTELLIGENCE_NOT_CLAIMING,
  };
}

/** Owner-facing conversation summary from profile. */
export function composeLeoSelfIntelligenceConversationSummary(
  profile: LeonixInternalIntelligenceProfile,
): string {
  const known = profile.healthMap
    .filter((d) => d.state !== "NOT_MEASURED")
    .map((d) => `${d.dimension.replace(/_/g, " ")}: ${d.state.replace(/_/g, " ")} — ${d.reason}`)
    .slice(0, 4);
  const blind = profile.blindSpots
    .filter((b) =>
      ["DISCOVERY_SEO", "CUSTOMER_JOURNEY", "TRUST_REPUTATION", "MARKETING_CREATIVE", "COMMUNITY_IMPACT", "BUSINESS_FOUNDATION"].includes(
        b.dimension,
      ),
    )
    .slice(0, 3)
    .map((b) => `${b.dimension.replace(/_/g, " ")} is ${b.state.replace(/_/g, " ")} — ${b.reason}`);

  const nrm = profile.topNextMove
    ? `Next right move: ${profile.topNextMove.title}. ${profile.topNextMove.whyNow}`
    : "No urgent Next Right Move from current measured evidence.";

  return [
    profile.overallInterpretation,
    "",
    "WHAT WE KNOW:",
    ...(known.length ? known.map((l) => `- ${l}`) : ["- No measured V1 dimension conclusions yet."]),
    "",
    "WHAT WE CANNOT CURRENTLY MEASURE:",
    ...(blind.length ? blind.map((l) => `- ${l}`) : ["- No deferred blind spots listed."]),
    "",
    "NEXT RIGHT MOVE:",
    `- ${nrm}`,
    "",
    "Recommendations do not grant execution authority.",
  ].join("\n");
}
