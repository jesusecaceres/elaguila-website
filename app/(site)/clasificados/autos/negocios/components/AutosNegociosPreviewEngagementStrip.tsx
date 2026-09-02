"use client";

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
  ownerUserId,
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
  /** Globalization Build D-F3 — the vehicle/dealer owner's user id, so LeonixLikeButton can
   * block self-engagement the same way the results-grid cards already do. */
  ownerUserId?: string | null;
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

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${alignStart ? "justify-start" : "justify-end"} ${className}`}
      data-autos-gallery-utility-row="1"
      data-autos-preview-engagement={isPublic ? "0" : "1"}
      aria-label={lang === "es" ? "Acciones del anuncio" : "Listing actions"}
    >
      {isPublic && analyticsCtx ? (
        <>
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
            ownerUserId={ownerUserId}
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
            recordShareEvent={autosGlobalShareRecorderFromContext(analyticsCtx, "detail_share")}
            ownerUserId={ownerUserId}
          />
        </>
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
    </div>
  );
}
