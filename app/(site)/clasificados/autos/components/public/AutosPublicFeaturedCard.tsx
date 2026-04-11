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
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)]/55 bg-[color:var(--lx-card)] shadow-[0_16px_48px_-18px_rgba(42,36,22,0.22)] ring-1 ring-[color:var(--lx-gold-border)]/25 transition hover:shadow-[0_20px_56px_-16px_rgba(42,36,22,0.26)] active:opacity-95"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--lx-section)]">
        <Image
          src={listing.primaryImageUrl}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 28vw"
          priority
        />
        <span className="absolute left-3 top-3 rounded-full border border-[color:var(--lx-gold-border)] bg-[linear-gradient(135deg,rgba(201,168,74,0.95),rgba(184,149,74,0.92))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FFFCF7] shadow-sm">
          {copy.featuredBadge}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-5 sm:p-6">
        <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-[color:var(--lx-text)] sm:text-xl">{listing.vehicleTitle}</h3>
        <p className="text-[1.65rem] font-bold tabular-nums leading-none text-[color:var(--lx-gold)] sm:text-[1.85rem]">{formatAutosUsd(listing.price)}</p>
        {listing.monthlyEstimate ? (
          <p className="text-xs font-medium text-[color:var(--lx-muted)]">{listing.monthlyEstimate}</p>
        ) : null}
        <p className="text-sm text-[color:var(--lx-text-2)]">
          {formatAutosMiles(listing.mileage)} · {loc}
        </p>
        {listing.sellerType === "dealer" && listing.dealerName ? (
          <div className="mt-1 flex items-center gap-3 border-t border-[color:var(--lx-nav-border)] pt-3">
            {listing.dealerLogoUrl ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]">
                <Image src={listing.dealerLogoUrl} alt="" width={40} height={40} className="object-contain p-0.5" />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[color:var(--lx-text)]">{listing.dealerName}</p>
              {listing.dealerRating != null ? (
                <p className="text-[11px] font-medium text-[color:var(--lx-muted)]">
                  ★ {listing.dealerRating.toFixed(1)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="mt-2 flex justify-end border-t border-[color:var(--lx-nav-border)] pt-3">
          <span className="inline-flex min-h-[44px] min-w-[8rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(201,168,74,0.95),rgba(184,149,74,0.92))] px-4 text-xs font-bold text-[#FFFCF7] shadow-sm">
            {copy.cardViewDetails}
          </span>
        </div>
      </div>
    </Link>
  );
}
