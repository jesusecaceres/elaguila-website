"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
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
  autosPreviewPremiumCardClass,
  autosPreviewRectBadgeClass,
  autosPreviewSectionEyebrowClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";

function coverUrl(listing: AutoDealerListing): string | null {
  const primary = listing.mediaImages?.find((m) => m.isPrimary)?.url ?? listing.mediaImages?.[0]?.url;
  if (primary?.trim()) return primary.trim();
  return listing.heroImages?.[0]?.trim() || null;
}

function specLine(listing: AutoDealerListing): string | null {
  const parts: string[] = [];
  if (listing.transmission) parts.push(listing.transmission);
  if (listing.drivetrain) parts.push(listing.drivetrain);
  if (listing.engine) parts.push(listing.engine);
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
      className={`${autosPreviewPremiumCardClass} mb-6 scroll-mt-28 p-4 sm:p-5`}
      aria-label={autosResultsCardPreviewTitle(lang)}
    >
      <p className={autosPreviewSectionEyebrowClass}>{autosResultsCardPreviewTitle(lang)}</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[10px] border border-[#D6C7AD]/70 bg-[#FBF7EF] sm:w-[220px]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center text-xs font-medium text-[#8A6B1F]">
              {lang === "es" ? "Foto de portada" : "Cover photo"}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${autosPreviewRectBadgeClass} bg-[#7A1E2C] text-[#FFFCF7] border-[#7A1E2C]`}>
              {autosResultsCardDealerBadge(lang)}
            </span>
          </div>
          {dealerName || listing.dealerLogo ? (
            <div className="mt-2.5 flex items-center gap-2.5 border-b border-[#D6C7AD]/55 pb-2.5">
              {listing.dealerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.dealerLogo}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-[8px] border border-[#D6C7AD]/70 bg-[#FFFDF7] object-contain p-1"
                />
              ) : null}
              {dealerName ? (
                <span className="min-w-0 truncate text-sm font-bold text-[#1F241C]">{dealerName}</span>
              ) : null}
            </div>
          ) : null}
          <h3 className="mt-2 text-lg font-bold leading-snug text-[#1F241C] sm:text-xl">{title}</h3>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {price ? <span className="text-xl font-extrabold tabular-nums text-[#7A1E2C]">{price}</span> : null}
            {mileage ? <span className="text-sm font-semibold text-[#5C5346]">{mileage}</span> : null}
          </div>
          {location ? <p className="mt-1 text-sm text-[#5C5346]">{location}</p> : null}
          {specs ? <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{specs}</p> : null}
          <p className="mt-2 text-xs font-medium text-[#8A6B1F]">
            {autosResultsCardInventoryHint(lang, used, inventoryVehicleLimit)}
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-[#8A7A68]">{autosResultsCardLeonixIdNote(lang)}</p>
          <div className="mt-auto pt-3">
            <span
              className="inline-flex min-h-[44px] cursor-default items-center rounded-[10px] bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFCF7] opacity-95"
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
