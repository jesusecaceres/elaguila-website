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
import { autosResultsCardDealerBadge } from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  autosPreviewPremiumCardClass,
  autosPreviewRectBadgeClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

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
  const saveExtras = autosSavedListingExtras({
    id: listing.id,
    leonix_ad_id: listing.leonixAdId,
  });
  const listingShareUrl =
    typeof window !== "undefined" ? `${window.location.origin}${href}` : "";
  const imageUrl = listing.primaryImageUrl?.trim();

  const isDealer = listing.sellerType === "dealer";
  const laneClass = isDealer
    ? "border-l-[3px] border-[#D4A574]/85"
    : "border-l-[3px] border-[#E5E5E5]";

  if (isDealer) {
    const specs = [listing.transmission, listing.drivetrain, listing.fuelType].filter(Boolean).join(" · ") || null;
    return (
      <Link
        href={href}
        onClick={() => {
          trackAutosListingEvent(listing.id, AUTOS_CLASSIFIEDS_EVENT.resultCardClick, {
            lane: trackLane,
            leonixAdId: listing.leonixAdId,
          });
        }}
        className={`${autosPreviewPremiumCardClass} group flex min-w-0 flex-col overflow-hidden transition-all duration-200 hover:shadow-[0_14px_36px_-18px_rgba(122,30,44,0.22)] active:opacity-95 ${compact ? "max-w-full" : ""}`}
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#F3EEE4]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 26vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">
              {lang === "es" ? "Sin foto" : "No photo"}
            </div>
          )}
          <span className={`${autosPreviewRectBadgeClass} absolute left-2.5 top-2.5 border-[#7A1E2C] bg-[#7A1E2C] text-[#FFFCF7]`}>
            {autosResultsCardDealerBadge(lang)}
          </span>
          {listing.featured ? (
            <span className="absolute right-2.5 top-2.5 rounded-full border border-[#D4A574]/50 bg-[#FFFAF0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#D4A574] shadow-sm">
              {copy.featuredBadge}
            </span>
          ) : listing.hasVideo ? (
            <span className="absolute right-2.5 top-2.5 rounded-full border border-[#1A1A1A]/20 bg-[#1A1A1A]/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
              {copy.filterVideo}
            </span>
          ) : null}
        </div>
        <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${compact ? "p-3" : "p-3.5"}`}>
          {listing.dealerName || listing.dealerLogoUrl ? (
            <div className="flex min-w-0 items-center gap-2">
              {listing.dealerLogoUrl ? (
                <Image
                  src={listing.dealerLogoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 rounded-[5px] border border-[#D6C7AD]/70 bg-[#FFFDF7] object-contain p-0.5"
                />
              ) : null}
              {listing.dealerName ? (
                <span className="min-w-0 truncate text-[11px] font-bold text-[#8A6B1F]">{listing.dealerName}</span>
              ) : null}
            </div>
          ) : null}
          <p className={`line-clamp-2 min-h-[2.5rem] font-serif font-semibold leading-snug tracking-tight text-[#1F241C] ${compact ? "text-sm" : "text-[15px] sm:text-base"}`}>
            {listing.vehicleTitle}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className={`font-extrabold tabular-nums text-[#7A1E2C] ${compact ? "text-lg" : "text-lg sm:text-xl"}`}>
              {formatAutosUsd(listing.price, lang)}
            </span>
            <span className="text-sm font-semibold tabular-nums text-[#5C5346]">{formatAutosMiles(listing.mileage, lang)}</span>
          </div>
          {listing.monthlyEstimate ? (
            <p className="text-[11px] font-medium text-[#8A7A68]">{listing.monthlyEstimate}</p>
          ) : null}
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-[#5C5346]">
            <FiMapPin className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
            <span className="truncate">{loc}</span>
          </p>
          {specs ? <p className="line-clamp-2 text-[11px] leading-snug text-[#8A7A68]">{specs}</p> : null}
          <div className="mt-2 border-t border-[#D6C7AD]/55 pt-2.5">
            <span className="inline-flex min-h-[36px] w-full items-center justify-center gap-1 rounded-[10px] border border-[#7A1E2C]/35 bg-[#FFFCF7] px-3 text-[12px] font-bold text-[#7A1E2C]">
              {copy.cardViewDetails}
            </span>
          </div>
          <div className="mt-auto flex items-center gap-3 border-t border-[#E5E5E5]/50 pt-2">
            <LeonixLikeButton
              listingId={listing.id}
              ownerUserId={listing.ownerUserId ?? undefined}
              variant="small"
              lang={lang as "es" | "en"}
              category="autos"
              persistEngagement={Boolean(listing.id)}
              recordLikeEvent={globalListing ? autosGlobalLikeRecorder(globalListing) : undefined}
            />
            <LeonixSaveButton
              listingId={listing.id}
              ownerUserId={listing.ownerUserId ?? undefined}
              variant="small"
              lang={lang as "es" | "en"}
              category="autos"
              persistEngagement={Boolean(listing.id)}
              saveExtras={saveExtras}
              recordSaveEvent={globalListing ? autosGlobalSaveRecorder(globalListing) : undefined}
            />
            <LeonixShareButton
              listingId={listing.id}
              ownerUserId={listing.ownerUserId ?? undefined}
              listingTitle={listing.vehicleTitle}
              listingUrl={listingShareUrl}
              variant="small"
              lang={lang as "es" | "en"}
              category="autos"
              persistEngagement={Boolean(listing.id)}
              recordShareEvent={
                globalListing ? autosGlobalShareRecorder(globalListing, "results_card_share") : undefined
              }
            />
          </div>
        </div>
      </Link>
    );
  }

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
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 26vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#F8F1E6,#EFE3D1)] px-4 text-center">
            <span className="rounded-full border border-[#D4A574]/35 bg-[#FFFEF7]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A7164]">
              {lang === "es" ? "Sin foto" : "No photo"}
            </span>
          </div>
        )}
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
          {formatAutosUsd(listing.price, lang)}
        </p>
        {listing.monthlyEstimate ? (
          <p className="text-[11px] font-medium text-[#7A7A7A]">{listing.monthlyEstimate}</p>
        ) : null}
        <div className={LOCATION_ROW}>
          <FiMapPin className="w-4 h-4 text-[#D4A574] flex-shrink-0" />
          <span className="truncate">{loc}</span>
          <span className="text-[#7A7A7A]">•</span>
          <span>{formatAutosMiles(listing.mileage, lang)}</span>
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
            listingId={listing.id}
            ownerUserId={listing.ownerUserId ?? undefined}
            variant="small"
            lang={lang as "es" | "en"}
            category="autos"
            persistEngagement={Boolean(listing.id)}
            recordLikeEvent={globalListing ? autosGlobalLikeRecorder(globalListing) : undefined}
          />
          <LeonixSaveButton
            listingId={listing.id}
            ownerUserId={listing.ownerUserId ?? undefined}
            variant="small"
            lang={lang as "es" | "en"}
            category="autos"
            persistEngagement={Boolean(listing.id)}
            saveExtras={saveExtras}
            recordSaveEvent={globalListing ? autosGlobalSaveRecorder(globalListing) : undefined}
          />
          <LeonixShareButton
            listingId={listing.id}
            ownerUserId={listing.ownerUserId ?? undefined}
            listingTitle={listing.vehicleTitle}
            listingUrl={listingShareUrl}
            variant="small"
            lang={lang as "es" | "en"}
            category="autos"
            persistEngagement={Boolean(listing.id)}
            recordShareEvent={
              globalListing ? autosGlobalShareRecorder(globalListing, "results_card_share") : undefined
            }
          />
        </div>
      </div>
    </Link>
  );
}
