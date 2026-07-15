"use client";

import type { AutosNegociosLang } from "../lib/autosNegociosLang";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { buildVehicleTitle } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { countApplicationInventoryVehicles } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosResultsCardDealerBadge,
  autosResultsCardInventoryHint,
  autosResultsCardLeonixIdNote,
  autosResultsCardPreviewTitle,
  autosResultsCardViewDetails,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  AUTOS_PREVIEW_SECTION_IDS,
  autosPreviewBurgundyPrimaryBtnClass,
  autosPreviewPremiumCardClass,
  autosPreviewRectBadgeClass,
  autosPreviewSectionEyebrowClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";
import { FiMapPin } from "react-icons/fi";

function coverUrl(listing: AutoDealerListing): string | null {
  const primary = listing.mediaImages?.find((m) => m.isPrimary)?.url ?? listing.mediaImages?.[0]?.url;
  if (primary?.trim()) return primary.trim();
  return listing.heroImages?.[0]?.trim() || null;
}

function specLine(listing: AutoDealerListing): string | null {
  const parts: string[] = [];
  if (listing.transmission) parts.push(listing.transmission);
  if (listing.drivetrain) parts.push(listing.drivetrain);
  if (listing.fuelType) parts.push(listing.fuelType);
  if (!parts.length) return null;
  return parts.join(" · ");
}

export function AutosNegociosResultsCardPreview({
  lang,
  listing,
  additionalCount,
  inventoryVehicleLimit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
}: {
  lang: AutosNegociosLang;
  listing: AutoDealerListing;
  additionalCount: number;
  inventoryVehicleLimit?: number;
}) {
  const title =
    buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim) ||
    listing.vehicleTitle ||
    (lang === "es" ? "Tu vehículo" : "Your vehicle");
  const location = [listing.city, listing.state].filter(Boolean).join(", ");
  const used = countApplicationInventoryVehicles(additionalCount);
  const img = coverUrl(listing);
  const specs = specLine(listing);
  const priceUsd = formatUsdIntegerInputDisplay(listing.price);
  const price = priceUsd ? `$${priceUsd}` : null;
  const mileageRaw = formatMileageInputDisplay(listing.mileage);
  const mileage = mileageRaw ? `${mileageRaw} mi` : null;
  const dealerName = listing.dealerName?.trim();

  return (
    <section
      id={AUTOS_PREVIEW_SECTION_IDS.resultsCard}
      className={`${autosPreviewPremiumCardClass} mb-5 scroll-mt-28 border-l-[3px] border-l-[#C9A84A] p-3.5 sm:p-4`}
      aria-label={autosResultsCardPreviewTitle(lang)}
    >
      <p className={autosPreviewSectionEyebrowClass}>{autosResultsCardPreviewTitle(lang)}</p>
      <div className="mt-2.5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
        <div className="relative aspect-[16/10] h-32 w-full shrink-0 overflow-hidden rounded-[10px] border border-[#D6C7AD]/70 bg-[#FBF7EF] sm:h-[8.5rem] sm:w-[11.5rem]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">
              {lang === "es" ? "Sin foto" : "No photo"}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${autosPreviewRectBadgeClass} border-[#7A1E2C] bg-[#7A1E2C] text-[#FFFCF7]`}>
              {autosResultsCardDealerBadge(lang)}
            </span>
            {dealerName || listing.dealerLogo ? (
              <div className="flex min-w-0 items-center gap-2">
                {listing.dealerLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.dealerLogo}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-[6px] border border-[#D6C7AD]/70 bg-[#FFFDF7] object-contain p-0.5"
                  />
                ) : null}
                {dealerName ? (
                  <span className="min-w-0 truncate text-xs font-bold text-[#1F241C]">{dealerName}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1F241C] sm:text-[17px]">{title}</h3>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            {price ? <span className="text-lg font-extrabold tabular-nums text-[#7A1E2C] sm:text-xl">{price}</span> : null}
            {mileage ? <span className="text-sm font-semibold tabular-nums text-[#5C5346]">{mileage}</span> : null}
          </div>
          {location ? (
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-[#5C5346]">
              <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
          {specs ? <p className="line-clamp-2 text-[11px] leading-snug text-[#5C5346]">{specs}</p> : null}
          <p className="text-[10px] font-medium text-[#8A6B1F]">
            {autosResultsCardInventoryHint(lang, used, inventoryVehicleLimit)}
          </p>
          <p className="text-[10px] leading-snug text-[#8A7A68]">{autosResultsCardLeonixIdNote(lang)}</p>
          <div className="mt-auto pt-1">
            <span
              className={`${autosPreviewBurgundyPrimaryBtnClass} inline-flex min-h-[40px] cursor-default items-center px-4 text-xs opacity-95`}
              aria-disabled="true"
            >
              {autosResultsCardViewDetails(lang)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
