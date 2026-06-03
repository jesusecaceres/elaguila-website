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
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";

function coverUrl(listing: AutoDealerListing): string | null {
  const primary = listing.mediaImages?.find((m) => m.isPrimary)?.url ?? listing.mediaImages?.[0]?.url;
  if (primary?.trim()) return primary.trim();
  return listing.heroImages?.[0]?.trim() || null;
}

function specLine(listing: AutoDealerListing, lang: AutosNegociosLang): string | null {
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
}: {
  lang: AutosNegociosLang;
  listing: AutoDealerListing;
  additionalCount: number;
}) {
  const title =
    buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim) ||
    listing.vehicleTitle ||
    (lang === "es" ? "Tu vehículo" : "Your vehicle");
  const location = [listing.city, listing.state].filter(Boolean).join(", ");
  const used = countApplicationInventoryVehicles(additionalCount);
  const img = coverUrl(listing);
  const specs = specLine(listing, lang);
  const priceUsd = formatUsdIntegerInputDisplay(listing.price);
  const price = priceUsd ? `$${priceUsd}` : null;
  const mileageRaw = formatMileageInputDisplay(listing.mileage);
  const mileage = mileageRaw ? `${mileageRaw} ${lang === "es" ? "mi" : "mi"}` : null;

  return (
    <section
      className="mb-6 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.1)]"
      aria-label={autosResultsCardPreviewTitle(lang)}
    >
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6E5418]">{autosResultsCardPreviewTitle(lang)}</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-[#F0E8DC] sm:max-w-[200px]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-[#8A7A68]">
              {lang === "es" ? "Foto de portada" : "Cover photo"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#2A2620] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FAF7F2]">
              {autosResultsCardDealerBadge(lang)}
            </span>
            {listing.dealerName ? (
              <span className="truncate text-xs font-semibold text-[#5C5346]">{listing.dealerName}</span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-bold text-[#1E1810]">{title}</h3>
          <div className="mt-1 flex flex-wrap gap-x-3 text-sm font-semibold text-[#1E1810]">
            {price ? <span>{price}</span> : null}
            {mileage ? <span>{mileage}</span> : null}
          </div>
          {location ? <p className="mt-1 text-xs text-[#5C5346]">{location}</p> : null}
          {specs ? <p className="mt-1 text-xs text-[#5C5346]">{specs}</p> : null}
          <p className="mt-2 text-xs font-medium text-[#6E5418]">
            {autosResultsCardInventoryHint(lang, used, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT)}
          </p>
          <p className="mt-3 text-[10px] text-[#8A7A68]">{autosResultsCardLeonixIdNote(lang)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#E8DFD0] pt-3">
        <span
          className="inline-flex min-h-[40px] cursor-default items-center rounded-xl bg-[#2A2620]/90 px-4 text-sm font-bold text-[#FAF7F2] opacity-90"
          aria-disabled="true"
        >
          {autosResultsCardViewDetails(lang)}
        </span>
        {listing.dealerLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.dealerLogo} alt="" className="h-8 max-w-[100px] object-contain" />
        ) : null}
      </div>
    </section>
  );
}
