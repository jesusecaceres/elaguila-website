/**
 * LEO-20D — Executive Reporting ANALYTICS adapter (buyer engagement counts only).
 * WHAT IS HAPPENING — no conversion rates, no SI conclusions.
 */
import "server-only";

import {
  fetchLeoBuyerEngagementAnalyticsSlice,
  type LeoBuyerEngagementStageCounts,
} from "@/app/lib/analytics/server/fetchLeoBuyerEngagementAnalyticsSlice";
import {
  buildLeoExecutiveSignal,
  clampAdapterLimit,
  emptyAdapterResult,
} from "@/app/leo/_lib/leoExecutiveReportingAdapter";
import type {
  LeoExecutiveReportingAdapter,
  LeoExecutiveReportingAdapterInput,
} from "@/app/leo/_lib/leoExecutiveReportingTypes";

const STAGE_LABELS: Array<{
  key: keyof LeoBuyerEngagementStageCounts;
  title: string;
  sourceRef: string;
}> = [
  { key: "listing_impression", title: "Listing impressions", sourceRef: "listing_impression" },
  { key: "result_card_click", title: "Result card clicks", sourceRef: "result_card_click" },
  { key: "listing_view", title: "Listing views", sourceRef: "listing_view" },
  { key: "listing_open", title: "Listing opens", sourceRef: "listing_open" },
  { key: "cta_interactions", title: "CTA / contact interactions", sourceRef: "cta_interactions" },
  { key: "lead_created", title: "Lead created events", sourceRef: "lead_created" },
  { key: "apply_started", title: "Apply started events", sourceRef: "apply_started" },
  { key: "apply_submitted", title: "Apply submitted events", sourceRef: "apply_submitted" },
];

export const leoAnalyticsReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "ANALYTICS",
  async getExecutiveSignals(input: LeoExecutiveReportingAdapterInput) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const slice = await fetchLeoBuyerEngagementAnalyticsSlice({ nowMs });

    if (slice.unavailable) {
      return emptyAdapterResult(
        "ANALYTICS",
        "UNAVAILABLE",
        nowMs,
        slice.unavailableNote ?? "listing_analytics unavailable — not zero engagement.",
      );
    }

    const period = slice.windowLabel;
    const signals = STAGE_LABELS.map((stage) => {
      const count = slice.stages[stage.key];
      return buildLeoExecutiveSignal({
        domain: "ANALYTICS",
        sourceKind: "listing_analytics",
        sourceRef: stage.sourceRef,
        nowMs,
        title: stage.title,
        summary: `${count} ${stage.title.toLowerCase()} recorded in the ${slice.windowDays}-day bounded analytics sample (${slice.windowStartIso.slice(0, 10)} → ${slice.windowEndIso.slice(0, 10)}). Counts are events, not unique users or conversion rates.`,
        signalType: "METRIC",
        severity: "INFORMATIONAL",
        status: count === 0 ? "EMPTY" : "INFORMATIONAL",
        count,
        metric: { value: count, unit: "events", period },
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: [
          `listing_analytics:${stage.sourceRef}:${period}`,
          `window:${slice.windowStartIso}/${slice.windowEndIso}`,
        ],
        availability: "PARTIAL",
        metadataSummary: [
          `categories_represented=${slice.categoriesRepresented.length}`,
          `source_tables=${slice.sourceTablesRepresented.length || 0}`,
          `sample_rows=${slice.rowCount}`,
          slice.sampleCapped ? "sample_capped=true" : "sample_capped=false",
        ].join("; "),
        priorityRank: 7,
      });
    });

    // Coverage summary signal (still counts-only, no rates).
    signals.unshift(
      buildLeoExecutiveSignal({
        domain: "ANALYTICS",
        sourceKind: "listing_analytics",
        sourceRef: "buyer_engagement_slice",
        nowMs,
        title: "Buyer engagement analytics slice",
        summary: `${slice.rowCount} deduped listing_analytics rows in the last ${slice.windowDays} days (bounded sample). Categories represented: ${slice.categoriesRepresented.length || 0}. This is operational event volume — not a conversion funnel.`,
        signalType: "METRIC",
        severity: "INFORMATIONAL",
        status: slice.rowCount === 0 ? "EMPTY" : "INFORMATIONAL",
        count: slice.rowCount,
        metric: { value: slice.rowCount, unit: "events", period },
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: [`listing_analytics:slice:${period}`],
        availability: "PARTIAL",
        metadataSummary: `window=${period}; categories=${slice.categoriesRepresented.join(",") || "none"}; source_tables=${slice.sourceTablesRepresented.join(",") || "none"}`,
        priorityRank: 7,
      }),
    );

    return {
      domain: "ANALYTICS",
      availability: "PARTIAL",
      signals: signals.slice(0, limit),
      limitations: [
        ...slice.limitations,
        "ANALYTICS reports operational listing_analytics counts only — no CTR, conversion, or abandonment rates.",
        "Does not join payment records or invent a seller publish funnel.",
      ],
      generatedAt: slice.generatedAt,
    };
  },
};
