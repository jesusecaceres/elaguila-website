/**
 * LEO-20D — Bounded platform read of public.listing_analytics for buyer engagement.
 * Reuses dashboard aggregation helpers. Not a new warehouse. No event writes.
 * ZERO rows with successful query ≠ UNAVAILABLE.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  aggregateDashboardAnalyticsTotals,
  dedupeDashboardAnalyticsRows,
  type DashboardAnalyticsEventRow,
  type DashboardAnalyticsTotals,
  ZERO_DASHBOARD_ANALYTICS_TOTALS,
} from "@/app/lib/analytics/server/dashboardAnalyticsMetrics";
import {
  countLeoBuyerEngagementStages,
  uniqueSortedStrings,
  LEO_BUYER_ENGAGEMENT_ROW_LIMIT,
  LEO_BUYER_ENGAGEMENT_WINDOW_DAYS,
  LEO_BUYER_ENGAGEMENT_WINDOW_MS,
  type LeoBuyerEngagementStageCounts,
} from "@/app/lib/analytics/server/leoBuyerEngagementAnalyticsPure";

export {
  countLeoBuyerEngagementStages,
  LEO_BUYER_ENGAGEMENT_ROW_LIMIT,
  LEO_BUYER_ENGAGEMENT_WINDOW_DAYS,
  LEO_BUYER_ENGAGEMENT_WINDOW_MS,
  type LeoBuyerEngagementStageCounts,
} from "@/app/lib/analytics/server/leoBuyerEngagementAnalyticsPure";

const EVENT_SELECT =
  "id, listing_id, canonical_ad_id, event_type, user_id, created_at, category, owner_user_id, event_source, source_table, source_id";

export type LeoBuyerEngagementAnalyticsSlice = {
  unavailable: boolean;
  unavailableNote: string | null;
  windowStartIso: string;
  windowEndIso: string;
  windowDays: number;
  windowLabel: string;
  generatedAt: string;
  /** Rows returned after dedupe within the bounded sample. */
  rowCount: number;
  sampleCapped: boolean;
  totals: DashboardAnalyticsTotals;
  stages: LeoBuyerEngagementStageCounts;
  categoriesRepresented: string[];
  sourceTablesRepresented: string[];
  eventTypesRepresented: string[];
  limitations: string[];
};

/**
 * Platform-wide bounded listing_analytics slice for LEO Executive Reporting ANALYTICS.
 * Owner-dashboard readers remain separate; this does not change write semantics.
 */
export async function fetchLeoBuyerEngagementAnalyticsSlice(input?: {
  nowMs?: number;
  windowMs?: number;
  rowLimit?: number;
}): Promise<LeoBuyerEngagementAnalyticsSlice> {
  const nowMs = input?.nowMs ?? Date.now();
  const windowMs = input?.windowMs ?? LEO_BUYER_ENGAGEMENT_WINDOW_MS;
  const rowLimit = input?.rowLimit ?? LEO_BUYER_ENGAGEMENT_ROW_LIMIT;
  const windowEndIso = new Date(nowMs).toISOString();
  const windowStartIso = new Date(nowMs - windowMs).toISOString();
  const windowDays = Math.round(windowMs / (24 * 60 * 60 * 1000)) || LEO_BUYER_ENGAGEMENT_WINDOW_DAYS;
  const windowLabel = `last_${windowDays}_days`;
  const generatedAt = windowEndIso;

  const baseLimitations = [
    `Counts cover a bounded ${windowDays}-day window (${windowStartIso} → ${windowEndIso}).`,
    `Sample capped at latest ${rowLimit} listing_analytics rows in-window — not a full export.`,
    "Event counts are not unique users, conversion rates, CTR, or abandonment rates.",
    "Category instrumentation is uneven — represented categories are not 'all categories'.",
    "Seller checkout, publish, and renewal journeys are not included in this slice.",
  ];

  if (!isSupabaseAdminConfigured()) {
    return {
      unavailable: true,
      unavailableNote: "Supabase admin client is not configured — analytics unavailable (not zero).",
      windowStartIso,
      windowEndIso,
      windowDays,
      windowLabel,
      generatedAt,
      rowCount: 0,
      sampleCapped: false,
      totals: { ...ZERO_DASHBOARD_ANALYTICS_TOTALS },
      stages: countLeoBuyerEngagementStages([]),
      categoriesRepresented: [],
      sourceTablesRepresented: [],
      eventTypesRepresented: [],
      limitations: [...baseLimitations, "Analytics store not reachable in this environment."],
    };
  }

  try {
    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from("listing_analytics")
      .select(EVENT_SELECT)
      .gte("created_at", windowStartIso)
      .lte("created_at", windowEndIso)
      .order("created_at", { ascending: false })
      .limit(rowLimit);

    if (error) {
      return {
        unavailable: true,
        unavailableNote: `listing_analytics query failed — unavailable (not zero). ${error.message}`,
        windowStartIso,
        windowEndIso,
        windowDays,
        windowLabel,
        generatedAt,
        rowCount: 0,
        sampleCapped: false,
        totals: { ...ZERO_DASHBOARD_ANALYTICS_TOTALS },
        stages: countLeoBuyerEngagementStages([]),
        categoriesRepresented: [],
        sourceTablesRepresented: [],
        eventTypesRepresented: [],
        limitations: [...baseLimitations, "Query failure — do not treat as zero buyer engagement."],
      };
    }

    const raw = (data ?? []) as DashboardAnalyticsEventRow[];
    const events = dedupeDashboardAnalyticsRows(raw);
    const sampleCapped = raw.length >= rowLimit;
    const stages = countLeoBuyerEngagementStages(events);
    const totals = aggregateDashboardAnalyticsTotals(events);

    return {
      unavailable: false,
      unavailableNote: null,
      windowStartIso,
      windowEndIso,
      windowDays,
      windowLabel,
      generatedAt,
      rowCount: events.length,
      sampleCapped,
      totals,
      stages,
      categoriesRepresented: uniqueSortedStrings(events.map((e) => e.category)),
      sourceTablesRepresented: uniqueSortedStrings(events.map((e) => e.source_table)),
      eventTypesRepresented: uniqueSortedStrings(events.map((e) => e.event_type)),
      limitations: [
        ...baseLimitations,
        ...(sampleCapped
          ? ["Sample hit row cap — quieter older events in-window may be under-represented."]
          : []),
        events.length === 0
          ? "Zero events in this bounded sample means no recorded activity in the slice — not that analytics is unavailable."
          : "Buyer engagement slice only — not an end-to-end customer journey.",
      ],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return {
      unavailable: true,
      unavailableNote: `listing_analytics read threw — unavailable (not zero). ${msg}`,
      windowStartIso,
      windowEndIso,
      windowDays,
      windowLabel,
      generatedAt,
      rowCount: 0,
      sampleCapped: false,
      totals: { ...ZERO_DASHBOARD_ANALYTICS_TOTALS },
      stages: countLeoBuyerEngagementStages([]),
      categoriesRepresented: [],
      sourceTablesRepresented: [],
      eventTypesRepresented: [],
      limitations: [...baseLimitations, "Unexpected read failure — unavailable ≠ zero."],
    };
  }
}
