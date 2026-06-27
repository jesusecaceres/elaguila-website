"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
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
  if (!sourceId || typeof likeCount !== "number" || !Number.isFinite(likeCount)) return null;

  const listing = autosGlobalListingFromRow({ id: sourceId, leonix_ad_id: leonixAdId });
  const engagementKey = autosEngagementListingKey({ id: sourceId, leonix_ad_id: leonixAdId });
  const copy = COPY[lang];
  const safeCount = Math.max(0, Math.floor(likeCount));

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
            {copy.countLabel(safeCount)}
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
