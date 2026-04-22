"use client";

import { useEffect, useRef } from "react";

/** Global results impression — `listing_slug` is intentionally NULL (see analytics migration). */
export function ServiciosResultsViewAnalytics({ resultCount }: { resultCount: number }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/clasificados/servicios/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingSlug: null,
        eventType: "search_results_view",
        meta: { resultCount, path: "/clasificados/servicios/resultados" },
      }),
    }).catch(() => {});
  }, [resultCount]);
  return null;
}
