"use client";

import { FiShare2 } from "react-icons/fi";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import {
  autosAnalyticsContextFromProps,
  autosGlobalLikeRecorderFromContext,
  autosGlobalShareRecorderFromContext,
} from "@/app/lib/clasificados/autos/analytics/autosGlobalAnalytics";
import type { AutosPublicListingAnalyticsProps } from "../../lib/autosAnalyticsIdentity";

/**
 * Compact Like/Share utility row below gallery — preview-safe or public DB-backed.
 */
export function AutosNegociosPreviewEngagementStrip({
  lang,
  className = "",
  alignStart = false,
  listingSourceId,
  leonixAdId,
  listingTitle,
  listingUrl,
  likeCount = 0,
  publicAnalytics,
  shareListingId,
}: {
  lang: "es" | "en";
  className?: string;
  /** Left-align Like/Share inside unified canvas utility row. */
  alignStart?: boolean;
  listingSourceId?: string | null;
  leonixAdId?: string | null;
  listingTitle?: string | null;
  listingUrl?: string | null;
  likeCount?: number;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
  /**
   * Owner lock (2026-09-17, Gate 01A): Share's own truthful identity, independent of Like's
   * stricter public/persisted-engagement gate. A canonical-active Preview (the owner viewing
   * their own already-published listing before a full page reload) has a real public URL and
   * must get a real, active Share button even though Like/analytics stay off there to avoid
   * recording a fake self-engagement. Falls back to `listingSourceId` when this isn't passed,
   * so Share is never worse than before for callers that only ever pass `listingSourceId`.
   */
  shareListingId?: string | null;
}) {
  const sourceId = listingSourceId?.trim() ?? "";
  const isPublic = Boolean(sourceId && publicAnalytics);
  const analyticsCtx = isPublic
    ? autosAnalyticsContextFromProps(
        publicAnalytics ?? {
          listingSourceId: sourceId,
          leonixAdId,
          lane: "negocios",
        },
      )
    : null;
  const safeCount =
    typeof likeCount === "number" && Number.isFinite(likeCount) ? Math.max(0, Math.floor(likeCount)) : 0;

  const shareId = isPublic ? sourceId : shareListingId?.trim() || "";
  const canShare = Boolean(shareId && listingUrl?.trim());
  const shareTitle = listingTitle?.trim() || (lang === "en" ? "Leonix Autos listing" : "Anuncio Leonix Autos");

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${alignStart ? "justify-start" : "justify-end"} ${className}`}
      data-autos-gallery-utility-row="1"
      data-autos-preview-engagement={isPublic ? "0" : "1"}
      aria-label={lang === "es" ? "Acciones del anuncio" : "Listing actions"}
    >
      {isPublic && analyticsCtx ? (
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
      ) : (
        <LeonixLikeButton
          listingId={null}
          variant="small"
          lang={lang}
          category="autos"
          persistEngagement={false}
          likeCount={0}
          countDisplay="numeric"
          numericShowZero
          previewLabelMode="iconOnly"
        />
      )}
      {canShare ? (
        <LeonixShareButton
          listingId={shareId}
          listingTitle={shareTitle}
          listingUrl={listingUrl?.trim() || ""}
          variant="small"
          lang={lang}
          category="autos"
          persistEngagement={isPublic}
          recordShareEvent={isPublic && analyticsCtx ? autosGlobalShareRecorderFromContext(analyticsCtx, "detail_share") : undefined}
        />
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          data-autos-share-unavailable="1"
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-[#D4A574]/60 bg-white/60 px-3 py-1.5 text-sm font-medium text-[#8A7A68]"
        >
          <FiShare2 className="h-4 w-4 shrink-0" aria-hidden />
          <span>{lang === "es" ? "Compartir" : "Share"}</span>
        </button>
      )}
    </div>
  );
}
