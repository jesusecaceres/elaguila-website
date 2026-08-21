/**
 * LEO-20A — Dynamic Leonix Internal Intelligence Profile assembler.
 * No persistence. No aggregate numeric health score.
 * LEO-20C: DISCOVERY_SEO technical readiness (PARTIAL); search performance NOT_MEASURED.
 * LEO-20D: CUSTOMER_JOURNEY buyer engagement (PARTIAL); seller/checkout/renewal NOT_MEASURED.
 */
import { adaptLeoSelfIntelligenceV1Dimensions } from "@/app/leo/_lib/leoSelfIntelligenceAdapters";
import type { LeoSelfIntelligenceAdapterInput } from "@/app/leo/_lib/leoSelfIntelligenceAdapters";
import { adaptLeoSelfIntelligenceCustomerJourney } from "@/app/leo/_lib/leoSelfIntelligenceCustomerJourneyAdapter";
import { adaptLeoSelfIntelligenceDiscoverySeo } from "@/app/leo/_lib/leoSelfIntelligenceDiscoverySeoAdapter";
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
    return { overall: "UNKNOWN", notes: ["No measured dimensions contributed freshness."] };
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
  const deferred = LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS.map((d) =>
    d.replace(/_/g, " ").toLowerCase(),
  );

  const parts: string[] = [];
  if (attention.length > 0) {
    parts.push(
      attention
        .map(
          (d) =>
            `${d.dimension.replace(/_/g, " ").toLowerCase()} is ${d.state.replace(/_/g, " ").toLowerCase()}`,
        )
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
  parts.push(
    "discovery SEO has partial technical readiness only — search performance remains unmeasured",
  );
  parts.push(
    "customer journey has partial buyer engagement only — seller checkout/publish/renewal remain unmeasured",
  );

  const text = parts.join(". ") + ".";
  return text.replace(/\b\d{1,3}\s*%/g, "[score omitted]");
}

/** Assemble dynamic profile from adapter input (pure). */
export function assembleLeonixInternalIntelligenceProfile(
  input: LeoSelfIntelligenceAdapterInput,
): LeonixInternalIntelligenceProfile {
  const generatedAt = new Date(input.nowMs).toISOString();
  const dimensions = [
    ...adaptLeoSelfIntelligenceV1Dimensions(input),
    adaptLeoSelfIntelligenceDiscoverySeo({ nowMs: input.nowMs }),
    adaptLeoSelfIntelligenceCustomerJourney(input),
  ];
  const healthMap = buildLeoSelfIntelligenceHealthMap(dimensions);
  const blindSpots = buildLeoSelfIntelligenceBlindSpots(healthMap);
  const { topNextMove, additionalNextMoves } = rankLeoSelfIntelligenceNextMoves({
    dimensions: healthMap,
    blindSpots,
  });

  const primaryIds = [
    "OPERATIONS",
    "REVENUE_MONETIZATION_HEALTH",
    "TECHNOLOGY_READINESS",
    "PRODUCT_OPERATIONAL_HEALTH",
  ] as const;
  const measured = healthMap.filter((d) => d.state !== "NOT_MEASURED");
  const withCoverage = healthMap.filter((d) => d.coverage !== "NONE");
  const freshnessSummary = overallFreshness(healthMap);

  const limitations = [
    "Self-Intelligence is a dynamic interpretation layer — not a second source of operational truth.",
    "No aggregate health percentage or letter grade is produced.",
    "Deferred dimensions remain NOT_MEASURED until real sensors exist.",
    "DISCOVERY_SEO technical readiness is PARTIAL; search performance stays NOT_MEASURED.",
    "CUSTOMER_JOURNEY buyer engagement is PARTIAL; seller/checkout/renewal stay NOT_MEASURED.",
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
      v1DimensionsWithCoverage: withCoverage.filter((d) =>
        (primaryIds as readonly string[]).includes(d.dimension),
      ).length,
      v1DimensionsMeasured: measured.filter((d) =>
        (primaryIds as readonly string[]).includes(d.dimension),
      ).length,
      deferredNotMeasured: LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS.length,
      notes: [
        "V1 primary: OPERATIONS, REVENUE_MONETIZATION_HEALTH, TECHNOLOGY_READINESS, PRODUCT_OPERATIONAL_HEALTH.",
        "DISCOVERY_SEO: PARTIAL technical readiness only (LEO-20C); search performance NOT_MEASURED.",
        "CUSTOMER_JOURNEY: PARTIAL buyer engagement only (LEO-20D); no conversion/abandonment rates.",
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
    .slice(0, 6);
  const seo = profile.healthMap.find((d) => d.dimension === "DISCOVERY_SEO");
  const seoPerformance = profile.blindSpots.find(
    (b) => b.dimension === "DISCOVERY_SEO" && b.subcomponent === "SEARCH_PERFORMANCE",
  );
  const journey = profile.healthMap.find((d) => d.dimension === "CUSTOMER_JOURNEY");
  const journeyBlind = profile.blindSpots.filter(
    (b) => b.dimension === "CUSTOMER_JOURNEY" && Boolean(b.subcomponent),
  );
  const blind = profile.blindSpots
    .filter(
      (b) =>
        ["TRUST_REPUTATION", "MARKETING_CREATIVE", "COMMUNITY_IMPACT", "BUSINESS_FOUNDATION"].includes(
          b.dimension,
        ) ||
        (b.dimension === "DISCOVERY_SEO" && b.subcomponent === "SEARCH_PERFORMANCE") ||
        (b.dimension === "CUSTOMER_JOURNEY" && Boolean(b.subcomponent)),
    )
    .slice(0, 5)
    .map((b) => {
      const label = b.subcomponent
        ? `${b.dimension.replace(/_/g, " ")} / ${b.subcomponent.replace(/_/g, " ")}`
        : b.dimension.replace(/_/g, " ");
      return `${label} is ${b.state.replace(/_/g, " ")} — ${b.reason}`;
    });

  const nrm = profile.topNextMove
    ? `Next right move: ${profile.topNextMove.title}. ${profile.topNextMove.whyNow}`
    : "No urgent Next Right Move from current measured evidence.";

  const seoAnswer = seo
    ? [
        "SEO / DISCOVERY (honest split):",
        `- Technical readiness (PARTIAL): ${seo.reason}`,
        seoPerformance
          ? `- Search performance: NOT MEASURED — ${seoPerformance.reason}`
          : "- Search performance: NOT MEASURED.",
      ].join("\n")
    : null;

  const journeyAnswer = journey
    ? [
        "CUSTOMER JOURNEY (honest split):",
        `- Buyer engagement (PARTIAL): ${journey.reason}`,
        journeyBlind.length
          ? `- Still unmeasured: ${journeyBlind
              .map((b) => (b.subcomponent ?? "").replace(/_/g, " ").toLowerCase())
              .filter(Boolean)
              .join("; ")}.`
          : "- Seller checkout/publish/renewal remain unmeasured.",
        "- I cannot honestly identify end-to-end abandonment from this slice alone.",
      ].join("\n")
    : null;

  return [
    profile.overallInterpretation,
    "",
    "WHAT WE KNOW:",
    ...(known.length ? known.map((l) => `- ${l}`) : ["- No measured dimension conclusions yet."]),
    "",
    ...(seoAnswer ? [seoAnswer, ""] : []),
    ...(journeyAnswer ? [journeyAnswer, ""] : []),
    "WHAT WE CANNOT CURRENTLY MEASURE:",
    ...(blind.length ? blind.map((l) => `- ${l}`) : ["- No deferred blind spots listed."]),
    "",
    "NEXT RIGHT MOVE:",
    `- ${nrm}`,
    "",
    "Recommendations do not grant execution authority.",
  ].join("\n");
}
