/**
 * LEO-20D — Pure buyer-engagement count helpers (no DB).
 * Shared by server reader + offline verifiers.
 */
import type { DashboardAnalyticsEventRow } from "@/app/lib/analytics/server/dashboardAnalyticsMetrics";

/** Deterministic Executive Reporting / SI window for buyer engagement counts. */
export const LEO_BUYER_ENGAGEMENT_WINDOW_DAYS = 7;
export const LEO_BUYER_ENGAGEMENT_WINDOW_MS = LEO_BUYER_ENGAGEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
/** Bounded sample — not a full ledger export of the window. */
export const LEO_BUYER_ENGAGEMENT_ROW_LIMIT = 5000;

export type LeoBuyerEngagementStageCounts = {
  listing_impression: number;
  result_card_click: number;
  listing_view: number;
  listing_open: number;
  /** Sum of contact/CTA click event types — not a conversion rate. */
  cta_interactions: number;
  lead_created: number;
  apply_started: number;
  apply_submitted: number;
};

export function countLeoBuyerEngagementStages(
  events: DashboardAnalyticsEventRow[],
): LeoBuyerEngagementStageCounts {
  const stages: LeoBuyerEngagementStageCounts = {
    listing_impression: 0,
    result_card_click: 0,
    listing_view: 0,
    listing_open: 0,
    cta_interactions: 0,
    lead_created: 0,
    apply_started: 0,
    apply_submitted: 0,
  };

  for (const row of events) {
    const t = row.event_type ?? "";
    if (t === "listing_impression") stages.listing_impression += 1;
    else if (t === "result_card_click") stages.result_card_click += 1;
    else if (t === "listing_view") stages.listing_view += 1;
    else if (t === "listing_open") stages.listing_open += 1;
    else if (t === "lead_created") stages.lead_created += 1;
    else if (t === "apply_started") stages.apply_started += 1;
    else if (t === "apply_submitted") stages.apply_submitted += 1;
    else if (
      t === "cta_click" ||
      t === "phone_click" ||
      t === "whatsapp_click" ||
      t === "email_click" ||
      t === "message_click" ||
      t === "website_click" ||
      t === "directions_click" ||
      t === "contact_click" ||
      t === "outbound_click"
    ) {
      stages.cta_interactions += 1;
    }
  }
  return stages;
}

export function uniqueSortedStrings(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const t = (v ?? "").trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
