"use client";

import { useEffect, useRef } from "react";

/** One lightweight profile_view event per page load (best-effort). */
export function ServiciosProfileViewAnalytics({ listingSlug }: { listingSlug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/clasificados/servicios/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingSlug, eventType: "profile_view", meta: {} }),
    }).catch(() => {});
  }, [listingSlug]);
  return null;
}
