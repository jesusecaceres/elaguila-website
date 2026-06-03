"use client";

import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { leonixAnalyticsAllowed } from "@/app/lib/leonixPublicConsent";
import {
  autosGlobalListingFromRow,
  mapAutosOpsEventToGlobal,
  recordAutosGlobalAnalyticsEvent,
} from "./recordAutosGlobalAnalytics";

/**
 * Best-effort fire-and-forget: legacy ops log + global /api/analytics/events (AUTO1).
 * Sets `clientListingAnalytics: true` on legacy metadata so a future mirror would skip double-count.
 */
export function trackAutosListingEvent(
  listingId: string,
  eventType: string,
  opts?: {
    lane?: AutosClassifiedsLane;
    leonixAdId?: string | null;
    metadata?: Record<string, unknown>;
    /** Ops-only legacy row — skip global listing_analytics (detail view uses profile analytics). */
    legacyOnly?: boolean;
  },
): void {
  if (typeof window === "undefined" || !listingId || !leonixAnalyticsAllowed()) return;

  const sourceId = listingId.trim();
  const listing = autosGlobalListingFromRow({
    id: sourceId,
    leonix_ad_id: opts?.leonixAdId,
  });
  const globalType = opts?.legacyOnly ? null : mapAutosOpsEventToGlobal(eventType);
  const eventSource =
    eventType === "result_card_click"
      ? "results_card"
      : globalType === "listing_view"
        ? "detail"
        : "detail_contact";

  if (listing && globalType) {
    recordAutosGlobalAnalyticsEvent(listing, globalType, {
      event_source: eventSource,
      metadata: {
        autosOpsEventType: eventType,
        lane: opts?.lane,
        ...(opts?.metadata ?? {}),
      },
    });
  }

  try {
    const body = JSON.stringify({
      listingId: sourceId,
      leonixAdId: opts?.leonixAdId?.trim() ? opts.leonixAdId.trim() : undefined,
      eventType,
      lane: opts?.lane,
      metadata: {
        ...(opts?.metadata ?? {}),
        clientListingAnalytics: Boolean(listing && globalType),
      },
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/clasificados/autos/public/analytics/event", blob);
      return;
    }
    void fetch("/api/clasificados/autos/public/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
