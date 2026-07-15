"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import {
  autosGlobalLikeRecorderFromContext,
  autosGlobalShareRecorderFromContext,
  autosAnalyticsContextFromProps,
} from "@/app/lib/clasificados/autos/analytics/autosGlobalAnalytics";
import type { AutosPublicListingAnalyticsProps } from "../../lib/autosAnalyticsIdentity";

type AutosEngagementRowLang = "es" | "en";

const COPY = {
  es: {
    heading: "Interacción",
    share: "Compartir",
  },
  en: {
    heading: "Engagement",
    share: "Share",
  },
} as const;

export function AutosEngagementRow({
  listingSourceId,
  leonixAdId,
  lang,
  listingTitle,
  listingUrl,
  likeCount = 0,
  eventSource = "detail_share",
  publicAnalytics,
  className = "",
}: {
  /** autos_classifieds_listings.id */
  listingSourceId?: string | null;
  leonixAdId?: string | null;
  lang: AutosEngagementRowLang;
  listingTitle?: string | null;
  listingUrl?: string | null;
  /** Durable DB-backed count from user_liked_listings. 0 → heart only. */
  likeCount?: number;
  eventSource?: "detail_share" | "results_card_share";
  publicAnalytics?: AutosPublicListingAnalyticsProps;
  className?: string;
}) {
  const sourceId = listingSourceId?.trim() ?? "";
  const analyticsCtx =
    autosAnalyticsContextFromProps(
      publicAnalytics ?? {
        listingSourceId: sourceId,
        leonixAdId,
        lane: "negocios",
      },
    ) ?? null;
  const copy = COPY[lang];
  const safeCount = typeof likeCount === "number" && Number.isFinite(likeCount) ? Math.max(0, Math.floor(likeCount)) : 0;

  if (!sourceId || !analyticsCtx) return null;

  const shareEventSource = eventSource === "results_card_share" ? "results_card_share" : "detail_share";

  return (
    <section
      className={`rounded-[18px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_28px_-14px_rgba(42,36,22,0.18)] ${className}`}
      aria-label={copy.heading}
      data-autos-engagement-row="1"
      data-autos-like-count={String(safeCount)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
          {copy.heading}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <LeonixLikeButton
            listingId={sourceId}
            variant="small"
            lang={lang}
            category="autos"
            persistEngagement
            likeCount={safeCount}
            countDisplay="numeric"
            numericShowZero
            previewLabelMode="iconOnly"
            recordLikeEvent={autosGlobalLikeRecorderFromContext(analyticsCtx)}
          />
          <LeonixShareButton
            listingId={sourceId}
            listingTitle={listingTitle?.trim() || (lang === "en" ? "Leonix Autos listing" : "Anuncio Leonix Autos")}
            listingUrl={listingUrl?.trim() || ""}
            variant="small"
            lang={lang}
            category="autos"
            persistEngagement
            directNativeShare
            recordShareEvent={autosGlobalShareRecorderFromContext(analyticsCtx, shareEventSource)}
          />
        </div>
      </div>
    </section>
  );
}
