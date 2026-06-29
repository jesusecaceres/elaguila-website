"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMapPin } from "react-icons/fi";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import { autosSavedListingExtras } from "@/app/lib/autosSavedListingIdentity";
import {
  autosEngagementListingKey,
  autosGlobalLikeRecorder,
  autosGlobalListingFromRow,
  autosGlobalSaveRecorder,
  autosGlobalShareRecorder,
} from "../../lib/recordAutosGlobalAnalytics";
import { autosLiveVehiclePath } from "../../filters/autosBrowseFilterContract";
import { formatAutosLocation, formatAutosMiles, formatAutosUsd } from "./autosPublicFormatters";
import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import { trackAutosListingEvent } from "../../lib/autosListingAnalyticsClient";

export function AutosPublicStandardCard({
  listing,
  copy,
  lang,
  compact = false,
}: {
  listing: AutosPublicListing;
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
  compact?: boolean;
}) {
  const loc = formatAutosLocation(listing.city, listing.state);
  const sellerLabel =
    listing.sellerType === "dealer"
      ? listing.dealerName ?? copy.sellerDealerFooter
      : listing.privateSellerLabel ?? copy.sellerPrivateFooter;

  const href = `${autosLiveVehiclePath(listing.id)}?lang=${lang}`;
  const trackLane = listing.sellerType === "dealer" ? "negocios" : "privado";
  const globalListing = autosGlobalListingFromRow({
    id: listing.id,
    leonix_ad_id: listing.leonixAdId,
  });
  const engagementKey = autosEngagementListingKey({
    id: listing.id,
    leonix_ad_id: listing.leonixAdId,
  });
  const saveExtras = autosSavedListingExtras({
    id: listing.id,
    leonix_ad_id: listing.leonixAdId,
  });
  const listingShareUrl =
    typeof window !== "undefined" ? `${window.location.origin}${href}` : "";

  const isDealer = listing.sellerType === "dealer";
  const laneClass = isDealer
    ? "border-l-[3px] border-[#D4A574]/85"
    : "border-l-[3px] border-[#E5E5E5]";

  // Leonix design system classes
  const RESULT_CARD = "group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_10px_32px_-20px_rgba(212,165,116,0.15)] transition-all duration-200 hover:border-[#D4A574]/50 hover:shadow-[0_14px_44px_-24px_rgba(212,165,116,0.20)] active:opacity-95";
  const MEDIA_CONTAINER = `relative w-full overflow-hidden bg-[#F5F0E8] ${compact ? "h-32" : "h-40 sm:h-44"}`;
  const INFO_SECTION = `flex min-w-0 flex-1 flex-col gap-1.5 ${compact ? "p-3" : "p-3 sm:p-3.5"}`;
  const VEHICLE_TITLE = `line-clamp-2 font-serif font-semibold leading-snug tracking-tight text-[#1A1A1A] ${compact ? "text-sm" : "text-[15px] sm:text-base"}`;
  const PRICE_LINE = `font-bold tabular-nums text-[#2A7F3E] ${compact ? "text-lg" : "text-lg sm:text-xl"}`;
  const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";
  const SELLER_ROW = "mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5]/50 pt-2.5";
  const SELLER_CHIP = "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide";
  const DEALER_CHIP = "border border-[#D4A574]/50 bg-[#FFFAF0] text-[#1A1A1A]";
  const PRIVATE_CHIP = "border border-[#E5E5E5] bg-[#FFFEF7] text-[#4A4A4A]";
  const CTA_BUTTON = "inline-flex min-h-[40px] min-w-[6.5rem] items-center justify-center rounded-full border border-[#D4A574]/50 bg-[linear-gradient(135deg,rgba(212,165,116,0.12),rgba(193,154,107,0.08))] px-3 text-[11px] font-bold text-[#1A1A1A] transition-all duration-200 hover:border-[#D4A574] hover:bg-[linear-gradient(135deg,rgba(212,165,116,0.18),rgba(193,154,107,0.12))]";
  const ENGAGEMENT_ROW = "flex items-center gap-3 mt-2 pt-2 border-t border-[#E5E5E5]/50";

  return (
    <Link
      href={href}
      onClick={() => {
        trackAutosListingEvent(listing.id, AUTOS_CLASSIFIEDS_EVENT.resultCardClick, {
          lane: trackLane,
          leonixAdId: listing.leonixAdId,
        });
      }}
      className={`${RESULT_CARD} ${laneClass} ${compact ? "max-w-full" : ""}`}
    >
      <div className={MEDIA_CONTAINER}>
        <Image
          src={listing.primaryImageUrl}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 26vw"
        />
        {listing.featured ? (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-[#D4A574]/50 bg-[#FFFAF0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#D4A574] shadow-sm">
            {copy.featuredBadge}
          </span>
        ) : null}
        {listing.hasVideo ? (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-[#1A1A1A]/20 bg-[#1A1A1A]/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
            {copy.filterVideo}
          </span>
        ) : null}
      </div>
      <div className={INFO_SECTION}>
        <p className={VEHICLE_TITLE}>
          {listing.vehicleTitle}
        </p>
        <p className={PRICE_LINE}>
          {formatAutosUsd(listing.price)}
        </p>
        {listing.monthlyEstimate ? (
          <p className="text-[11px] font-medium text-[#7A7A7A]">{listing.monthlyEstimate}</p>
        ) : null}
        <div className={LOCATION_ROW}>
          <FiMapPin className="w-4 h-4 text-[#D4A574] flex-shrink-0" />
          <span className="truncate">{loc}</span>
          <span className="text-[#7A7A7A]">•</span>
          <span>{formatAutosMiles(listing.mileage)}</span>
        </div>
        <div className={SELLER_ROW}>
          <span className="min-w-0 truncate text-[12px] font-semibold text-[#1A1A1A]">{sellerLabel}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`${SELLER_CHIP} ${isDealer ? DEALER_CHIP : PRIVATE_CHIP}`}>
              {isDealer ? copy.sellerLaneBadgeDealer : copy.sellerLaneBadgePrivate}
            </span>
            <span className={CTA_BUTTON}>
              {copy.cardViewDetails}
            </span>
          </div>
        </div>
        
        {/* Engagement Metrics */}
        <div className={ENGAGEMENT_ROW}>
          <LeonixLikeButton
            listingId={engagementKey}
            ownerUserId={listing.ownerUserId ?? undefined}
            variant="small"
            lang={lang as "es" | "en"}
            category="autos"
            persistEngagement={Boolean(engagementKey)}
            recordLikeEvent={globalListing ? autosGlobalLikeRecorder(globalListing) : undefined}
          />
          <LeonixSaveButton
            listingId={engagementKey}
            ownerUserId={listing.ownerUserId ?? undefined}
            variant="small"
            lang={lang as "es" | "en"}
            category="autos"
            persistEngagement={Boolean(engagementKey)}
            saveExtras={saveExtras}
            recordSaveEvent={globalListing ? autosGlobalSaveRecorder(globalListing) : undefined}
          />
          <LeonixShareButton
            listingId={engagementKey}
            ownerUserId={listing.ownerUserId ?? undefined}
            listingTitle={listing.vehicleTitle}
            listingUrl={listingShareUrl}
            variant="small"
            lang={lang as "es" | "en"}
            category="autos"
            persistEngagement={Boolean(engagementKey)}
            recordShareEvent={
              globalListing ? autosGlobalShareRecorder(globalListing, "results_card_share") : undefined
            }
          />
        </div>
      </div>
    </Link>
  );
}
