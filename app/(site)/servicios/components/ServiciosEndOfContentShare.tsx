"use client";

import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  serviciosGlobalListingFromRow,
  serviciosGlobalShareRecorder,
} from "@/app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics";

/**
 * Servicios Owner QA (SVC-QA-21) — a quiet share moment after the business's service content, so a
 * visitor who has just evaluated the business can pass it on. Same shared share engine and the same
 * `listing_share` analytics event as the hero (tagged `placement: "end_of_content"`); no counts, no
 * second Like/Save. In Preview it opens the native share sheet without persisting analytics.
 */
export function ServiciosEndOfContentShare({
  lang,
  listingId,
  listingTitle,
  listingShareUrl,
  ownerUserId,
  listingSourceId,
  listingSlug,
  persistEngagement = false,
}: {
  lang: ServiciosLang;
  listingId: string;
  listingTitle: string;
  listingShareUrl?: string;
  ownerUserId?: string | null;
  listingSourceId?: string | null;
  listingSlug?: string;
  persistEngagement?: boolean;
}) {
  const id = listingId.trim();
  if (!id) return null;
  const globalListing =
    persistEngagement && (listingSourceId ?? "").trim() && (listingSlug ?? "").trim()
      ? serviciosGlobalListingFromRow({
          id: (listingSourceId ?? "").trim(),
          slug: (listingSlug ?? "").trim(),
          leonix_ad_id: /^[A-Z]+-\d{4}-\d{6}$/.test(id) ? id : null,
        })
      : null;
  const record = globalListing ? serviciosGlobalShareRecorder(globalListing, "detail_share") : undefined;

  return (
    <section
      className="flex flex-col items-start gap-3 rounded-2xl border border-[#E8D7B8] bg-[#FCF9F2] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      aria-label={lang === "en" ? "Share this business" : "Comparte este negocio"}
      data-servicios-end-of-content-share="1"
    >
      <p className="text-sm font-semibold text-[#2F2A23]">
        {lang === "en"
          ? "Know someone who needs this service? Share this business."
          : "¿Conoces a alguien que necesite este servicio? Comparte este negocio."}
      </p>
      <LeonixShareButton
        listingId={id}
        listingUrl={listingShareUrl}
        ownerUserId={ownerUserId}
        listingTitle={listingTitle}
        variant="default"
        lang={lang}
        category="servicios"
        persistEngagement={persistEngagement}
        recordShareEvent={record ? (method, meta) => record(method, { ...meta, placement: "end_of_content" }) : undefined}
        directNativeShare
        className="shrink-0"
      />
    </section>
  );
}
