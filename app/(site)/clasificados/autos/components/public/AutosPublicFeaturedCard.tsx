"use client";

import Image from "next/image";
import Link from "next/link";
import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import { autosLiveVehiclePath } from "../../filters/autosBrowseFilterContract";
import { formatAutosLocation, formatAutosMiles, formatAutosUsd } from "./autosPublicFormatters";
import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../../lib/autosPublicBlueprintCopy";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import { trackAutosListingEvent } from "../../lib/autosListingAnalyticsClient";

export function AutosPublicFeaturedCard({
  listing,
  copy,
  lang,
}: {
  listing: AutosPublicListing;
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
}) {
  const loc = formatAutosLocation(listing.city, listing.state);
  const href = `${autosLiveVehiclePath(listing.id)}?lang=${lang}`;
  const trackLane = listing.sellerType === "dealer" ? "negocios" : "privado";

  return (
    <Link
      href={href}
      onClick={() => trackAutosListingEvent(listing.id, AUTOS_CLASSIFIEDS_EVENT.resultCardClick, { lane: trackLane })}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(42,36,22,0.18)] transition hover:shadow-[0_16px_48px_-12px_rgba(42,36,22,0.22)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--lx-section)]">
        <Image
          src={listing.primaryImageUrl}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 33vw"
          priority
        />
        <span className="absolute left-3 top-3 rounded-full border border-[color:var(--lx-gold-border)] bg-[linear-gradient(135deg,rgba(201,168,74,0.95),rgba(184,149,74,0.92))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FFFCF7] shadow-sm">
          {copy.featuredBadge}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <h3 className="text-lg font-bold leading-snug tracking-tight text-[color:var(--lx-text)] sm:text-xl">{listing.vehicleTitle}</h3>
        <p className="text-2xl font-bold tabular-nums text-[color:var(--lx-gold)] sm:text-[1.65rem]">{formatAutosUsd(listing.price)}</p>
        {listing.monthlyEstimate ? (
          <p className="text-xs font-medium text-[color:var(--lx-muted)]">{listing.monthlyEstimate}</p>
        ) : null}
        <p className="text-sm text-[color:var(--lx-text-2)]">
          {formatAutosMiles(listing.mileage)} · {loc}
        </p>
        {listing.sellerType === "dealer" && listing.dealerName ? (
          <div className="mt-auto flex items-center gap-2 border-t border-[color:var(--lx-nav-border)] pt-3">
            {listing.dealerLogoUrl ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]">
                <Image src={listing.dealerLogoUrl} alt="" width={36} height={36} className="object-contain p-0.5" />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[color:var(--lx-text)]">{listing.dealerName}</p>
              {listing.dealerRating != null ? (
                <p className="text-[11px] font-medium text-[color:var(--lx-muted)]">
                  ★ {listing.dealerRating.toFixed(1)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
