"use client";

import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { leonixAnalyticsAllowed } from "@/app/lib/leonixPublicConsent";

/** Best-effort fire-and-forget; never throws to callers. */
export function trackAutosListingEvent(
  listingId: string,
  eventType: string,
  opts?: { lane?: AutosClassifiedsLane; metadata?: Record<string, unknown> },
): void {
  if (typeof window === "undefined" || !listingId || !leonixAnalyticsAllowed()) return;
  try {
    const body = JSON.stringify({
      listingId,
      eventType,
      lane: opts?.lane,
      metadata: opts?.metadata,
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
