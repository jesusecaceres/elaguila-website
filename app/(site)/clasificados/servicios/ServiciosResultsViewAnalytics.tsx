"use client";

import { useEffect, useRef } from "react";

/** Best-effort aggregate event when results grid is shown (no per-slug payload). */
export function ServiciosResultsViewAnalytics({ listingSlugs }: { listingSlugs: string[] }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || listingSlugs.length === 0) return;
    sent.current = true;
    const slug = listingSlugs[0];
    void fetch("/api/clasificados/servicios/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingSlug: slug,
        eventType: "search_results_view",
        meta: { resultCount: listingSlugs.length, sampleSlugs: listingSlugs.slice(0, 12) },
      }),
    }).catch(() => {});
  }, [listingSlugs]);
  return null;
}
