"use client";

/**
 * Fire-and-forget Digital Contact analytics beacon — isolated to its own
 * `digital_contact_analytics_events` table (never mirrors into Listing Analytics).
 */
export function trackDigitalContactEvent(
  profileSlug: string,
  eventType: string,
  meta?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ profileSlug, eventType, meta: meta ?? {} });
    const url = "/api/digital-contact/events";
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the page */
  }
}
