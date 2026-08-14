"use client";

import { useEffect, useState } from "react";
import { AutosListingAnalyticsRow } from "@/app/clasificados/autos/shared/components/AutosListingAnalyticsRow";
import {
  AUTOS_LISTING_ANALYTICS_PUBLIC_LABELS,
  type AutosListingAnalyticsSnapshot,
} from "@/app/clasificados/autos/shared/types/autosListingAnalytics";

type Lang = "es" | "en";

/**
 * Live Autos listing (`/clasificados/anuncio/[id]`): 4-up analytics under gallery — same rollup as dashboard.
 */
export function AutosAnuncioAnalyticsStrip({ listingId, lang }: { listingId: string; lang: Lang }) {
  const [metrics, setMetrics] = useState<AutosListingAnalyticsSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Package F Build F2, Gate 1 (P0 security fix) — previously queried listing_analytics
      // directly from the browser (raw user_id values reached the client for aggregation). Now
      // calls the server aggregate route, which runs the SAME rollup function and returns only
      // the final counts, never a raw row.
      try {
        const res = await fetch(`/api/clasificados/autos/listing/${encodeURIComponent(listingId)}/analytics-summary`);
        if (cancelled) return;
        if (!res.ok) {
          setMetrics({ views: 0, uniqueViews: 0, saves: 0, shares: 0, contacts: 0 });
          return;
        }
        const snapshot = (await res.json()) as AutosListingAnalyticsSnapshot;
        setMetrics(snapshot);
      } catch {
        if (!cancelled) setMetrics({ views: 0, uniqueViews: 0, saves: 0, shares: 0, contacts: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const lab = AUTOS_LISTING_ANALYTICS_PUBLIC_LABELS[lang];

  if (metrics === null) {
    return (
      <div
        className="mb-6 h-[128px] animate-pulse rounded-[20px] border border-[#C9B46A]/25 bg-[#F5F5F5]/80"
        aria-busy="true"
        aria-label={lang === "es" ? "Cargando métricas" : "Loading metrics"}
      />
    );
  }

  return (
    <div className="mb-6">
      <AutosListingAnalyticsRow
        metrics={metrics}
        labels={{
          kicker: lab.kicker,
          views: lab.views,
          saves: lab.saves,
          shares: lab.shares,
          contacts: lab.contacts,
          footnote: lab.liveFootnote,
        }}
      />
    </div>
  );
}
