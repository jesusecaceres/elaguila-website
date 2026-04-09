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

  return (
    <Link
      href={href}
      onClick={() => trackAutosListingEvent(listing.id, AUTOS_CLASSIFIEDS_EVENT.resultCardClick, { lane: trackLane })}
      className={`group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_6px_24px_-8px_rgba(42,36,22,0.12)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_10px_32px_-10px_rgba(42,36,22,0.16)] active:opacity-95 ${
        compact ? "max-w-full" : ""
      }`}
    >
      <div className={`relative w-full overflow-hidden bg-[color:var(--lx-section)] ${compact ? "aspect-[4/3]" : "aspect-[5/4] sm:aspect-[4/3]"}`}>
        <Image
          src={listing.primaryImageUrl}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
        />
        {listing.featured ? (
          <span className="absolute left-2 top-2 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
            {copy.featuredBadge}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-[color:var(--lx-text)] sm:text-[15px]">{listing.vehicleTitle}</p>
        <p className="text-lg font-bold tabular-nums text-[color:var(--lx-gold)]">{formatAutosUsd(listing.price)}</p>
        {listing.monthlyEstimate ? (
          <p className="text-[11px] font-medium text-[color:var(--lx-muted)]">{listing.monthlyEstimate}</p>
        ) : null}
        <p className="text-xs text-[color:var(--lx-text-2)]">
          {formatAutosMiles(listing.mileage)} · {loc}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[color:var(--lx-nav-border)] pt-2.5">
          <span className="truncate text-[11px] font-semibold text-[color:var(--lx-text-2)]">{sellerLabel}</span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              listing.sellerType === "dealer"
                ? "border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text-2)]"
                : "bg-[color:var(--lx-section)] text-[color:var(--lx-muted)]"
            }`}
          >
            {listing.sellerType === "dealer" ? copy.sellerDealerFooter : copy.sellerPrivateFooter}
          </span>
        </div>
      </div>
    </Link>
  );
}
