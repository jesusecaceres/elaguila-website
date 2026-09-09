"use client";

import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { leonixAnalyticsAllowed } from "@/app/lib/leonixPublicConsent";
import {
  autosGlobalListingFromRow,
  mapAutosOpsEventToGlobal,
  recordAutosGlobalAnalyticsEvent,
} from "./recordAutosGlobalAnalytics";

/**
 * Best-effort fire-and-forget write to the canonical shared /api/analytics/events pipeline
 * (AUTO1).
 *
 * Globalization Build D-F3 — this used to ALSO beacon/fetch a second, Autos-only write to the
 * legacy `autos_classifieds_analytics_events` table via `/api/clasificados/autos/public/
 * analytics/event`. That table had zero readers (`rollupAutosListingEventCounts` in
 * `autosClassifiedsAnalyticsService.ts` has no callers anywhere in the app — the real owner-facing
 * summary already reads only the canonical `listing_analytics` table) and wasn't gated by the
 * same self-engagement/dedupe guards the canonical endpoint has, so it was pure duplicate-write
 * risk with no benefit. The legacy endpoint/table are left in place (dormant, documented) for
 * backward compatibility, but nothing writes to them anymore.
 */
export function trackAutosListingEvent(
  listingId: string,
  eventType: string,
  opts?: {
    lane?: AutosClassifiedsLane;
    leonixAdId?: string | null;
    metadata?: Record<string, unknown>;
  },
): void {
  if (typeof window === "undefined" || !listingId || !leonixAnalyticsAllowed()) return;

  const sourceId = listingId.trim();
  const listing = autosGlobalListingFromRow({
    id: sourceId,
    leonix_ad_id: opts?.leonixAdId,
  });
  const globalType = mapAutosOpsEventToGlobal(eventType);
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
}
