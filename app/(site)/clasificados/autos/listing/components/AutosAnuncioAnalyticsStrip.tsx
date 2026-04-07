"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { AutosListingAnalyticsRow } from "@/app/clasificados/autos/shared/components/AutosListingAnalyticsRow";
import {
  aggregateRawListingAnalyticsEvents,
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
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: events, error } = await supabase
          .from("listing_analytics")
          .select("event_type, user_id")
          .eq("listing_id", listingId);
        if (cancelled) return;
        if (error) {
          setMetrics({ views: 0, uniqueViews: 0, saves: 0, shares: 0, contacts: 0 });
          return;
        }
        setMetrics(aggregateRawListingAnalyticsEvents(events ?? []));
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
