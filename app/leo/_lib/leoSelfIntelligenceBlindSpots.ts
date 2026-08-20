/**
 * LEO-20A — Blind-spot model.
 * Missing sensors → NOT_MEASURED / UNKNOWN. Never HEALTHY by omission.
 */
import {
  LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS,
  type LeoSelfIntelligenceBlindSpot,
  type LeoSelfIntelligenceDeferredDimension,
  type LeoSelfIntelligenceDimensionResult,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

const DEFERRED_BLIND_SPOT_COPY: Record<
  LeoSelfIntelligenceDeferredDimension,
  Omit<LeoSelfIntelligenceBlindSpot, "dimension" | "state">
> = {
  BUSINESS_FOUNDATION: {
    reason: "Leonix mission/value-proposition/audience priorities are not encoded as a measurable Self-Intelligence sensor.",
    whatEvidenceIsMissing: "Canonical internal strategy profile with attributable priorities and product alignment evidence.",
    businessWhyItMatters: "Without foundation clarity, Next Right Move ranking can under-weight strategic context.",
    recommendedSensorOrFutureCapability: "Future owner-curated foundation record (not invented from marketing copy).",
  },
  CUSTOMER_JOURNEY: {
    reason: "End-to-end checkout/application/drop-off instrumentation is not available to Self-Intelligence.",
    whatEvidenceIsMissing: "Canonical funnel events across landing → publish → renewal with trustworthy attribution.",
    businessWhyItMatters: "Cannot truthfully say where customers get stuck without journey sensors.",
    recommendedSensorOrFutureCapability: "Future journey analytics adapter with explicit coverage claims.",
  },
  DISCOVERY_SEO: {
    reason: "No canonical SEO measurement adapter is wired into LEO Self-Intelligence.",
    whatEvidenceIsMissing: "Indexability, sitemap/schema health, and local discovery measurement sources.",
    businessWhyItMatters: "Discovery weakness can silently limit growth while ops look busy.",
    recommendedSensorOrFutureCapability: "Future SEO/discovery health adapter (technical + content evidence).",
  },
  TRUST_REPUTATION: {
    reason: "No canonical connected reputation/reviews feed is available to Self-Intelligence.",
    whatEvidenceIsMissing: "Verified reviews/testimonials/transparency signals with provenance.",
    businessWhyItMatters: "Trust gaps affect conversion and brand even when queues are empty.",
    recommendedSensorOrFutureCapability: "Future trust/reputation read adapter.",
  },
  MARKETING_CREATIVE: {
    reason: "No canonical social/content cadence or creative-performance sensor is available.",
    whatEvidenceIsMissing: "Campaign readiness, content gaps, and brand-consistency operational evidence.",
    businessWhyItMatters: "Marketing silence or inconsistency can be invisible to ops-focused dashboards.",
    recommendedSensorOrFutureCapability: "Future marketing/creative health adapter.",
  },
  COMMUNITY_IMPACT: {
    reason: "No defensible community-impact measurement exists for Self-Intelligence.",
    whatEvidenceIsMissing: "Local usefulness / participation evidence that is attributable and non-fabricated.",
    businessWhyItMatters: "Community value is part of Leonix identity but must not become a fake impact score.",
    recommendedSensorOrFutureCapability: "Future community-evidence adapter only when real sensors exist.",
  },
};

/** Deferred dimensions as explicit blind spots. */
export function buildLeoSelfIntelligenceDeferredBlindSpots(): LeoSelfIntelligenceBlindSpot[] {
  return LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS.map((dimension) => ({
    dimension,
    state: "NOT_MEASURED" as const,
    ...DEFERRED_BLIND_SPOT_COPY[dimension],
  }));
}

/** V1 dimensions that are NOT_MEASURED/UNKNOWN also become blind spots. */
export function buildLeoSelfIntelligenceMeasuredBlindSpots(
  dimensions: LeoSelfIntelligenceDimensionResult[],
): LeoSelfIntelligenceBlindSpot[] {
  const spots: LeoSelfIntelligenceBlindSpot[] = [];
  for (const d of dimensions) {
    if (d.state !== "NOT_MEASURED" && d.state !== "UNKNOWN") continue;
    if (d.coverage !== "NONE" && d.state === "UNKNOWN") {
      spots.push({
        dimension: d.dimension,
        state: "UNKNOWN",
        reason: d.reason,
        whatEvidenceIsMissing: "Enough conclusive evidence to choose HEALTHY/WATCH/NEEDS_ATTENTION/CRITICAL.",
        businessWhyItMatters: `Leonix ${d.dimension} cannot be decided truthfully right now.`,
        recommendedSensorOrFutureCapability: "Improve sensor coverage or wait for conclusive signals.",
      });
      continue;
    }
    spots.push({
      dimension: d.dimension,
      state: "NOT_MEASURED",
      reason: d.reason,
      whatEvidenceIsMissing: d.limitations[0] ?? "Trustworthy sensor/source for this dimension.",
      businessWhyItMatters: `Without ${d.dimension} measurement, blind spots can hide real risk.`,
      recommendedSensorOrFutureCapability: "Wire a canonical adapter when a real source exists.",
    });
  }
  return spots;
}

export function buildLeoSelfIntelligenceBlindSpots(
  v1Dimensions: LeoSelfIntelligenceDimensionResult[],
): LeoSelfIntelligenceBlindSpot[] {
  return [
    ...buildLeoSelfIntelligenceMeasuredBlindSpots(v1Dimensions),
    ...buildLeoSelfIntelligenceDeferredBlindSpots(),
  ];
}
