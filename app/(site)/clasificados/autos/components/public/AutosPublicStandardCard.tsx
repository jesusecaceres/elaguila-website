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

  const isDealer = listing.sellerType === "dealer";
  const laneClass = isDealer
    ? "border-l-[3px] border-[color:var(--lx-gold)]/85"
    : "border-l-[3px] border-[color:var(--lx-nav-border)]";

  return (
    <Link
      href={href}
      onClick={() => trackAutosListingEvent(listing.id, AUTOS_CLASSIFIEDS_EVENT.resultCardClick, { lane: trackLane })}
      className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_28px_-10px_rgba(42,36,22,0.14)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_14px_40px_-12px_rgba(42,36,22,0.18)] active:opacity-95 ${laneClass} ${
        compact ? "max-w-full" : ""
      }`}
    >
      <div
        className={`relative w-full overflow-hidden bg-[color:var(--lx-section)] ${compact ? "aspect-[4/3]" : "aspect-[16/11] sm:aspect-[5/3]"}`}
      >
        <Image
          src={listing.primaryImageUrl}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 26vw"
        />
        {listing.featured ? (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)] shadow-sm">
            {copy.featuredBadge}
          </span>
        ) : null}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-2 ${compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5"}`}>
        <p
          className={`line-clamp-2 font-serif font-semibold leading-snug tracking-tight text-[color:var(--lx-text)] ${
            compact ? "min-h-[2.35rem] text-sm" : "min-h-[2.75rem] text-[15px] sm:text-base"
          }`}
        >
          {listing.vehicleTitle}
        </p>
        <p className={`font-bold tabular-nums text-[color:var(--lx-gold)] ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
          {formatAutosUsd(listing.price)}
        </p>
        {listing.monthlyEstimate ? (
          <p className="text-[11px] font-medium text-[color:var(--lx-muted)]">{listing.monthlyEstimate}</p>
        ) : null}
        <p className={`text-[color:var(--lx-text-2)] ${compact ? "text-xs" : "text-sm"}`}>
          {formatAutosMiles(listing.mileage)} · {loc}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--lx-nav-border)] pt-3">
          <span className="min-w-0 truncate text-[12px] font-semibold text-[color:var(--lx-text)]">{sellerLabel}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                isDealer
                  ? "border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)]"
                  : "border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text-2)]"
              }`}
            >
              {isDealer ? copy.sellerLaneBadgeDealer : copy.sellerLaneBadgePrivate}
            </span>
            <span className="inline-flex min-h-[40px] min-w-[6.5rem] items-center justify-center rounded-full border border-[color:var(--lx-gold-border)]/50 bg-[linear-gradient(135deg,rgba(201,168,74,0.12),rgba(184,149,74,0.08))] px-3 text-[11px] font-bold text-[color:var(--lx-text)]">
              {copy.cardViewDetails}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
