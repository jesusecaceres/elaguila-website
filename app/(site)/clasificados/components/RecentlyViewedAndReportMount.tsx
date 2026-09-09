"use client";

/**
 * Globalization Build D — small shared adapter for server-rendered category detail pages that
 * cannot call client-only hooks/browser APIs directly. Composes the two EXISTING shared
 * contracts (recentlyViewed.ts's addListingView, and the canonical LeonixInlineListingReport)
 * behind one mount point — no new engine, no new storage model, no new report flow.
 *
 * Callers are responsible for only rendering this on a genuinely live/public listing (never a
 * draft/preview/pending row) — this component does not itself re-derive that state.
 */

import { useEffect } from "react";
import { addListingView } from "@/app/lib/recentlyViewed";
import { LeonixInlineListingReport } from "@/app/clasificados/components/LeonixInlineListingReport";

export function RecentlyViewedAndReportMount({
  listingId,
  lang,
}: {
  listingId: string;
  lang: "es" | "en";
}) {
  useEffect(() => {
    if (!listingId.trim()) return;
    void addListingView(listingId);
  }, [listingId]);

  if (!listingId.trim()) return null;
  return <LeonixInlineListingReport listingId={listingId} lang={lang} />;
}
