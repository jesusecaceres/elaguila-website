"use client";

import { useCallback, useEffect, useState } from "react";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { getBrowserAuthUserForEngagement } from "@/app/lib/supabase/browser";
import {
  autosEngagementListingKey,
  autosGlobalLikeRecorder,
  autosGlobalListingFromRow,
  autosGlobalShareRecorder,
} from "../../lib/recordAutosGlobalAnalytics";

type AutosEngagementRowLang = "es" | "en";

const COPY = {
  es: {
    heading: "Interacción",
    likes: "Me gusta",
    share: "Compartir",
    countLabel: (count: number) => `${count} ${count === 1 ? "Me gusta" : "Me gusta"}`,
  },
  en: {
    heading: "Engagement",
    likes: "Like",
    share: "Share",
    countLabel: (count: number) => `${count} ${count === 1 ? "Like" : "Likes"}`,
  },
} as const;

export function AutosEngagementRow({
  listingSourceId,
  leonixAdId,
  lang,
  listingTitle,
  listingUrl,
  likeCount,
  eventSource = "detail_share",
  className = "",
}: {
  /** autos_classifieds_listings.id */
  listingSourceId?: string | null;
  leonixAdId?: string | null;
  lang: AutosEngagementRowLang;
  listingTitle?: string | null;
  listingUrl?: string | null;
  /** Durable DB-backed count. The row stays hidden when absent to avoid fake counts. */
  likeCount?: number;
  eventSource?: "detail_share" | "results_card_share";
  className?: string;
}) {
  const sourceId = listingSourceId?.trim() ?? "";
  const listing = autosGlobalListingFromRow({ id: sourceId, leonix_ad_id: leonixAdId });
  const engagementKey = autosEngagementListingKey({ id: sourceId, leonix_ad_id: leonixAdId });
  const copy = COPY[lang];
  const hasRealCount = typeof likeCount === "number" && Number.isFinite(likeCount);
  const safeCount = hasRealCount ? Math.max(0, Math.floor(likeCount)) : 0;
  const [displayCount, setDisplayCount] = useState(safeCount);
  const [canUpdateDurableCount, setCanUpdateDurableCount] = useState(false);

  useEffect(() => {
    setDisplayCount(safeCount);
  }, [safeCount, engagementKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const user = await getBrowserAuthUserForEngagement();
      if (!cancelled) setCanUpdateDurableCount(Boolean(user));
    })();
    return () => {
      cancelled = true;
    };
  }, [engagementKey]);

  const handleLikeToggle = useCallback(
    (isLiked: boolean) => {
      const applyDelta = () => setDisplayCount((current) => Math.max(0, current + (isLiked ? 1 : -1)));
      if (canUpdateDurableCount) {
        applyDelta();
        return;
      }
      void (async () => {
        const user = await getBrowserAuthUserForEngagement();
        if (!user) return;
        setCanUpdateDurableCount(true);
        applyDelta();
      })();
    },
    [canUpdateDurableCount],
  );

  if (!sourceId || !hasRealCount) return null;

  return (
    <section
      className={`rounded-[18px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-14px_rgba(42,36,22,0.18)] ${className}`}
      aria-label={copy.heading}
      data-autos-engagement-row="1"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
            {copy.heading}
          </p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)]" aria-live="polite">
            {copy.countLabel(displayCount)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <LeonixLikeButton
            listingId={engagementKey}
            variant="small"
            lang={lang}
            category="autos"
            persistEngagement={Boolean(engagementKey)}
            recordLikeEvent={listing ? autosGlobalLikeRecorder(listing) : undefined}
            onToggle={handleLikeToggle}
          />
          <LeonixShareButton
            listingId={engagementKey}
            listingTitle={listingTitle?.trim() || (lang === "en" ? "Leonix Autos listing" : "Anuncio Leonix Autos")}
            listingUrl={listingUrl?.trim() || ""}
            variant="small"
            lang={lang}
            category="autos"
            persistEngagement={Boolean(engagementKey)}
            recordShareEvent={listing ? autosGlobalShareRecorder(listing, eventSource) : undefined}
          />
        </div>
      </div>
    </section>
  );
}
