/**
 * LEO-20D — CUSTOMER_JOURNEY buyer engagement sensor (PARTIAL only).
 * Consumes Executive Reporting ANALYTICS — does not re-query listing_analytics.
 * No conversion/CTR/abandonment rates. No seller checkout/publish funnel.
 */
import type { LeoSelfIntelligenceAdapterInput } from "@/app/leo/_lib/leoSelfIntelligenceAdapters";
import type { LeoSelfIntelligenceSensorResult } from "@/app/leo/_lib/leoSelfIntelligenceSensorTypes";
import type {
  LeoSelfIntelligenceCoverage,
  LeoSelfIntelligenceDimensionResult,
  LeoSelfIntelligenceFreshness,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

export const LEO_CUSTOMER_JOURNEY_BUYER_ENGAGEMENT_SENSOR_ID =
  "customer_journey.buyer_engagement.v1";

export const LEO_CUSTOMER_JOURNEY_REMAINING_BLIND_SPOT_SUBCOMPONENTS = [
  "SELLER_PUBLISH_FUNNEL",
  "CHECKOUT_TO_PAYMENT",
  "RENEWAL_JOURNEY",
  "END_TO_END_ATTRIBUTION",
] as const;

function freshnessFromGeneratedAt(
  generatedAt: string | null | undefined,
  nowMs: number,
): LeoSelfIntelligenceFreshness {
  if (!generatedAt) return "UNKNOWN";
  const t = Date.parse(generatedAt);
  if (!Number.isFinite(t)) return "UNKNOWN";
  const ageMs = nowMs - t;
  if (ageMs < 2 * 60 * 60 * 1000) return "CURRENT";
  if (ageMs < 24 * 60 * 60 * 1000) return "AGING";
  return "STALE";
}

function analyticsSignals(input: LeoSelfIntelligenceAdapterInput) {
  return (input.reporting?.signals ?? []).filter((s) => s.domain === "ANALYTICS");
}

function analyticsHealth(input: LeoSelfIntelligenceAdapterInput) {
  return input.reporting?.adapterHealth.find((h) => h.domain === "ANALYTICS") ?? null;
}

/** Pure sensor evaluation over executive reporting ANALYTICS output. */
export function evaluateLeoBuyerEngagementJourneySensor(
  input: LeoSelfIntelligenceAdapterInput,
): LeoSelfIntelligenceSensorResult {
  const health = analyticsHealth(input);
  const signals = analyticsSignals(input);
  const generatedAt = input.reporting?.generatedAt ?? null;
  const limitations: string[] = [
    "Buyer engagement only — not a complete customer journey.",
    "No CTR, conversion rate, drop-off rate, or abandonment rate is claimed.",
    "Seller checkout, publish, renewal, and end-to-end attribution remain unmeasured.",
    "Impressions/clicks/applies are event counts — not unique users.",
  ];

  if (!input.reporting) {
    return {
      sensorId: LEO_CUSTOMER_JOURNEY_BUYER_ENGAGEMENT_SENSOR_ID,
      dimension: "CUSTOMER_JOURNEY",
      availability: "UNAVAILABLE",
      coverage: "NONE",
      freshness: "UNKNOWN",
      evidenceRefs: [],
      measurementTypes: [],
      limitations: [...limitations, "No executive reporting snapshot available."],
      sourceSystem: "executive_reporting.analytics",
      lastObservedAt: null,
      epistemic: "UNKNOWN",
      confidence: "NONE",
    };
  }

  if (health?.availability === "UNAVAILABLE") {
    return {
      sensorId: LEO_CUSTOMER_JOURNEY_BUYER_ENGAGEMENT_SENSOR_ID,
      dimension: "CUSTOMER_JOURNEY",
      availability: "UNAVAILABLE",
      coverage: "NONE",
      freshness: freshnessFromGeneratedAt(generatedAt, input.nowMs),
      evidenceRefs: [`analytics_health:UNAVAILABLE`],
      measurementTypes: [],
      limitations: [
        ...limitations,
        health.limitation ?? "ANALYTICS unavailable — not zero.",
        "ZERO recorded events is distinct from UNAVAILABLE analytics.",
      ],
      sourceSystem: "executive_reporting.analytics",
      lastObservedAt: generatedAt,
      epistemic: "UNKNOWN",
      confidence: "NONE",
    };
  }

  const metricSignals = signals.filter((s) => s.signalType === "METRIC");
  const evidenceRefs = metricSignals.slice(0, 12).map((s) => s.signalId);
  const period =
    metricSignals.find((s) => s.metric?.period)?.metric?.period ??
    metricSignals[0]?.evidenceRefs.find((r) => r.startsWith("window:")) ??
    "bounded_window";

  const measurementTypes = [
    "listing_impression",
    "result_card_click",
    "listing_view",
    "listing_open",
    "cta_interactions",
    "lead_created",
    "apply_started",
    "apply_submitted",
  ];

  const categoryMeta = metricSignals
    .map((s) => s.metadataSummary ?? "")
    .find((m) => /categories_represented=|categories=/.test(m));
  if (categoryMeta) {
    limitations.push(`Coverage metadata: ${categoryMeta}`);
  } else {
    limitations.push("Category coverage is partial/unknown — not all Leonix categories are proven equally instrumented.");
  }

  limitations.push(`Explicit time window / period: ${period}.`);

  const hasAnyCount = metricSignals.some((s) => (s.count ?? 0) > 0);
  const emptySlice =
    health?.availability === "EMPTY" ||
    (metricSignals.length > 0 && metricSignals.every((s) => (s.count ?? 0) === 0));

  return {
    sensorId: LEO_CUSTOMER_JOURNEY_BUYER_ENGAGEMENT_SENSOR_ID,
    dimension: "CUSTOMER_JOURNEY",
    availability: metricSignals.length > 0 ? "PARTIAL" : health?.availability === "EMPTY" ? "PARTIAL" : "UNKNOWN",
    coverage: "PARTIAL",
    freshness: freshnessFromGeneratedAt(generatedAt, input.nowMs),
    evidenceRefs,
    measurementTypes,
    limitations: [
      ...limitations,
      emptySlice && !hasAnyCount
        ? "Zero events in the bounded ANALYTICS sample — zero ≠ unavailable."
        : "PARTIAL coverage forbids concluding overall journey health.",
    ],
    sourceSystem: "executive_reporting.analytics",
    lastObservedAt: generatedAt,
    epistemic: "CONFIRMED",
    confidence: metricSignals.length > 0 ? "MEDIUM" : "LOW",
  };
}

function mapSensorCoverage(
  coverage: LeoSelfIntelligenceSensorResult["coverage"],
): LeoSelfIntelligenceCoverage {
  if (coverage === "COMPLETE") return "KNOWN";
  if (coverage === "NONE") return "NONE";
  return "PARTIAL";
}

/**
 * CUSTOMER_JOURNEY dimension — buyer engagement PARTIAL only.
 * State UNKNOWN unless analytics unavailable → NOT_MEASURED/UNKNOWN with NONE coverage.
 * HEALTHY forbidden under PARTIAL (enforced here + health map).
 */
export function adaptLeoSelfIntelligenceCustomerJourney(
  input: LeoSelfIntelligenceAdapterInput,
): LeoSelfIntelligenceDimensionResult {
  const sensor = evaluateLeoBuyerEngagementJourneySensor(input);
  const coverage = mapSensorCoverage(sensor.coverage);

  if (sensor.availability === "UNAVAILABLE" || sensor.coverage === "NONE") {
    return {
      dimension: "CUSTOMER_JOURNEY",
      state: sensor.availability === "UNAVAILABLE" ? "UNKNOWN" : "NOT_MEASURED",
      reason:
        sensor.availability === "UNAVAILABLE"
          ? "Buyer engagement analytics are temporarily unavailable — not interpreted as zero activity."
          : "Buyer engagement journey sensor has no trustworthy coverage yet.",
      evidenceRefs: sensor.evidenceRefs,
      freshness: sensor.freshness,
      confidence: "NONE",
      epistemic: "UNKNOWN",
      limitations: sensor.limitations,
      coverage: "NONE",
      lastObservedAt: sensor.lastObservedAt,
    };
  }

  const signals = analyticsSignals(input);
  const countLines = signals
    .filter((s) => s.signalType === "METRIC" && s.sourceRef && s.sourceRef !== "buyer_engagement_slice")
    .slice(0, 6)
    .map((s) => `${s.title}: ${s.count ?? 0} events`);

  return {
    dimension: "CUSTOMER_JOURNEY",
    state: "UNKNOWN",
    reason:
      "Leonix can measure part of the buyer engagement path from listing impressions/opening through selected CTA/application events. Seller checkout, publish, renewal, and end-to-end abandonment are not yet measured as one canonical journey.",
    evidenceRefs: sensor.evidenceRefs,
    freshness: sensor.freshness,
    confidence: sensor.confidence,
    epistemic: sensor.epistemic,
    limitations: [
      ...sensor.limitations,
      ...(countLines.length
        ? [`Bounded ANALYTICS counts (events only): ${countLines.join("; ")}.`]
        : []),
      "PARTIAL buyer-engagement coverage cannot conclude HEALTHY journey health.",
    ],
    coverage,
    lastObservedAt: sensor.lastObservedAt,
  };
}
