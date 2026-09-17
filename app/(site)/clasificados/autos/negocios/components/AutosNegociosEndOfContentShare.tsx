"use client";

import { FiShare2 } from "react-icons/fi";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import {
  autosAnalyticsContextFromProps,
  autosGlobalShareRecorderFromContext,
} from "@/app/lib/clasificados/autos/analytics/autosGlobalAnalytics";
import type { AutosPublicListingAnalyticsProps } from "../../lib/autosAnalyticsIdentity";

/**
 * Quiet share moment after the vehicle content, so a visitor who has just
 * reviewed the vehicle can pass it on. Same shared share engine and the same
 * `listing_share` analytics event as the gallery utility row (tagged
 * `placement: "end_of_content"`); no counts, no second Like. In Preview it
 * opens the native share sheet without persisting analytics.
 */
export function AutosNegociosEndOfContentShare({
  lang,
  listingSourceId,
  leonixAdId,
  listingTitle,
  listingUrl,
  publicAnalytics,
}: {
  lang: "es" | "en";
  listingSourceId?: string | null;
  leonixAdId?: string | null;
  listingTitle?: string | null;
  listingUrl?: string | null;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
}) {
  const sourceId = listingSourceId?.trim() ?? "";

  // Owner lock (2026-09-17): the bottom Share moment must always exist on a Dealer vehicle ad —
  // a draft/child Preview with no real canonical URL yet shows a truthful, disabled "available
  // after publish" state instead of silently vanishing (and never fabricates a public URL).
  if (!sourceId) {
    return (
      <section
        className="flex flex-col items-start gap-3 rounded-2xl border border-[#D6C7AD]/70 bg-[#FBF7EF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        aria-label={lang === "en" ? "Share this vehicle" : "Comparte este vehículo"}
        data-autos-end-of-content-share="1"
        data-autos-end-of-content-share-unavailable="1"
      >
        <p className="text-sm font-semibold text-[#1F241C]">
          {lang === "en"
            ? "Know someone looking for this car? Share this vehicle."
            : "¿Conoces a alguien que busca este auto? Comparte este vehículo."}
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-full border border-[#D6C7AD] bg-[#F3ECDD] px-4 py-2 text-sm font-semibold text-[#8A7A68]"
        >
          <FiShare2 className="h-4 w-4 shrink-0" aria-hidden />
          {lang === "en" ? "You'll be able to share once published" : "Podrás compartir este anuncio cuando se publique"}
        </button>
      </section>
    );
  }

  const isPublic = Boolean(publicAnalytics);
  const analyticsCtx = isPublic
    ? autosAnalyticsContextFromProps(
        publicAnalytics ?? {
          listingSourceId: sourceId,
          leonixAdId,
          lane: "negocios",
        },
      )
    : null;
  const record = analyticsCtx
    ? (method: string, meta?: Record<string, unknown>) => {
        const recorder = autosGlobalShareRecorderFromContext(analyticsCtx, "detail_share");
        return recorder?.(method, { ...meta, placement: "end_of_content" });
      }
    : undefined;

  return (
    <section
      className="flex flex-col items-start gap-3 rounded-2xl border border-[#D6C7AD]/70 bg-[#FBF7EF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      aria-label={lang === "en" ? "Share this vehicle" : "Comparte este vehículo"}
      data-autos-end-of-content-share="1"
    >
      <p className="text-sm font-semibold text-[#1F241C]">
        {lang === "en"
          ? "Know someone looking for this car? Share this vehicle."
          : "¿Conoces a alguien que busca este auto? Comparte este vehículo."}
      </p>
      <LeonixShareButton
        listingId={sourceId}
        listingUrl={listingUrl?.trim() || ""}
        listingTitle={listingTitle?.trim() || (lang === "en" ? "Leonix Autos listing" : "Anuncio Leonix Autos")}
        variant="default"
        lang={lang}
        category="autos"
        persistEngagement={isPublic}
        recordShareEvent={record}
        directNativeShare
        className="shrink-0"
      />
    </section>
  );
}
