/**
 * LEO-20A / 20C / 20D — Blind-spot model.
 * Missing sensors → NOT_MEASURED / UNKNOWN. Never HEALTHY by omission.
 * LEO-20C: DISCOVERY_SEO technical readiness is partial; search performance remains a blind spot.
 * LEO-20D: CUSTOMER_JOURNEY buyer engagement is partial; seller/checkout/renewal remain blind spots.
 */
import { LEO_DISCOVERY_SEO_SEARCH_PERFORMANCE_NOT_MEASURED } from "@/app/lib/seo/leonixDiscoveryContracts";
import { LEO_CUSTOMER_JOURNEY_REMAINING_BLIND_SPOT_SUBCOMPONENTS } from "@/app/leo/_lib/leoSelfIntelligenceCustomerJourneyAdapter";
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

const JOURNEY_SUBCOMPONENT_COPY: Record<
  (typeof LEO_CUSTOMER_JOURNEY_REMAINING_BLIND_SPOT_SUBCOMPONENTS)[number],
  Omit<LeoSelfIntelligenceBlindSpot, "dimension" | "state" | "subcomponent">
> = {
  SELLER_PUBLISH_FUNNEL: {
    reason: "Seller preview → publish lifecycle is not measured as one canonical Self-Intelligence journey.",
    whatEvidenceIsMissing: "Queryable seller-funnel stage events with trustworthy category coverage.",
    businessWhyItMatters: "Owners can see buyer engagement while still missing where sellers stall before going live.",
    recommendedSensorOrFutureCapability: "Future seller-publish journey sensor after global funnel events exist.",
  },
  CHECKOUT_TO_PAYMENT: {
    reason: "Checkout start → payment completion is not joined into the buyer engagement journey sensor.",
    whatEvidenceIsMissing: "Compatible checkout-start events correlated to payment records with proven population/window/grain.",
    businessWhyItMatters: "Payment health is measured separately; checkout drop-off must not be invented from engagement counts.",
    recommendedSensorOrFutureCapability: "Future checkout instrumentation + reporting adapter (not a payment-join guess).",
  },
  RENEWAL_JOURNEY: {
    reason: "Listing renewal / entitlement renewal journeys are not measured in Self-Intelligence V1 journey coverage.",
    whatEvidenceIsMissing: "Canonical renewal stage events with time windows and coverage claims.",
    businessWhyItMatters: "Renewal friction can silently shrink inventory while buyer engagement still looks active.",
    recommendedSensorOrFutureCapability: "Future renewal journey sensor when durable events exist.",
  },
  END_TO_END_ATTRIBUTION: {
    reason: "End-to-end attribution from discovery through publish/payment is not available.",
    whatEvidenceIsMissing: "Compatible multi-stage population, window, grain, and dedupe across systems.",
    businessWhyItMatters: "Without attribution, LEO cannot honestly name end-to-end abandonment or conversion.",
    recommendedSensorOrFutureCapability: "Future attribution architecture only when stages are proven compatible.",
  },
};

/** Search performance subcomponent — remains NOT_MEASURED after technical readiness lands. */
export function buildLeoDiscoverySeoPerformanceBlindSpot(): LeoSelfIntelligenceBlindSpot {
  return {
    dimension: "DISCOVERY_SEO",
    subcomponent: "SEARCH_PERFORMANCE",
    state: "NOT_MEASURED",
    reason:
      "Search performance (rankings, impressions, clicks, CTR, indexation, organic landings) is not measured. Technical crawler/sitemap readiness is a separate partial sensor.",
    whatEvidenceIsMissing: LEO_DISCOVERY_SEO_SEARCH_PERFORMANCE_NOT_MEASURED.join(" "),
    businessWhyItMatters:
      "Technical foundations can look fine while discovery demand silently weakens — performance must stay explicit.",
    recommendedSensorOrFutureCapability:
      "Future read-only Search Console (or equivalent) integration via canonical reporting — not invented from robots/sitemap.",
  };
}

/** Remaining CUSTOMER_JOURNEY stages after buyer-engagement PARTIAL lands. */
export function buildLeoCustomerJourneyRemainingBlindSpots(): LeoSelfIntelligenceBlindSpot[] {
  return LEO_CUSTOMER_JOURNEY_REMAINING_BLIND_SPOT_SUBCOMPONENTS.map((subcomponent) => ({
    dimension: "CUSTOMER_JOURNEY" as const,
    subcomponent,
    state: "NOT_MEASURED" as const,
    ...JOURNEY_SUBCOMPONENT_COPY[subcomponent],
  }));
}

/** Deferred dimensions as explicit blind spots. */
export function buildLeoSelfIntelligenceDeferredBlindSpots(): LeoSelfIntelligenceBlindSpot[] {
  return LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS.map((dimension) => ({
    dimension,
    state: "NOT_MEASURED" as const,
    ...DEFERRED_BLIND_SPOT_COPY[dimension],
  }));
}

/** V1 / measured dimensions that are NOT_MEASURED/UNKNOWN also become blind spots. */
export function buildLeoSelfIntelligenceMeasuredBlindSpots(
  dimensions: LeoSelfIntelligenceDimensionResult[],
): LeoSelfIntelligenceBlindSpot[] {
  const spots: LeoSelfIntelligenceBlindSpot[] = [];
  for (const d of dimensions) {
    // Partial dimensions with dedicated subcomponent blind spots.
    if (d.dimension === "DISCOVERY_SEO" || d.dimension === "CUSTOMER_JOURNEY") continue;
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
    buildLeoDiscoverySeoPerformanceBlindSpot(),
    ...buildLeoCustomerJourneyRemainingBlindSpots(),
    ...buildLeoSelfIntelligenceDeferredBlindSpots(),
  ];
}
