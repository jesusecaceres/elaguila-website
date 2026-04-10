"use client";

import Image from "next/image";
import Link from "next/link";
import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import { autosLiveVehiclePath } from "../filters/autosBrowseFilterContract";
import { formatAutosLocation, formatAutosMiles, formatAutosUsd } from "../components/public/autosPublicFormatters";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import { trackAutosListingEvent } from "../lib/autosListingAnalyticsClient";

function formatBadgeKey(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AutosLandingInventoryCard({
  listing,
  copy,
  lang,
  variant = "featured",
}: {
  listing: AutosPublicListing;
  copy: AutosPublicBlueprintCopy;
  lang: AutosPublicLang;
  variant?: "featured" | "recent";
}) {
  const loc = formatAutosLocation(listing.city, listing.state);
  const href = `${autosLiveVehiclePath(listing.id)}?lang=${lang}`;
  const trackLane = listing.sellerType === "dealer" ? "negocios" : "privado";
  const badges = (listing.badges ?? []).slice(0, 2).map(formatBadgeKey);
  const isDealer = listing.sellerType === "dealer";
  const laneLabel = isDealer ? copy.sellerLaneBadgeDealer : copy.sellerLaneBadgePrivate;
  const sellerLine = isDealer
    ? listing.dealerName ?? copy.sellerDealerFooter
    : listing.privateSellerLabel ?? copy.sellerPrivateFooter;

  return (
    <Link
      href={href}
      onClick={() => trackAutosListingEvent(listing.id, AUTOS_CLASSIFIEDS_EVENT.resultCardClick, { lane: trackLane })}
      className="group flex min-w-0 max-w-full flex-col overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_10px_36px_-14px_rgba(42,36,22,0.2)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_14px_44px_-12px_rgba(42,36,22,0.24)] active:opacity-95"
    >
      <div
        className={`relative w-full overflow-hidden bg-[color:var(--lx-section)] ${
          variant === "featured" ? "aspect-[16/10]" : "aspect-[5/3]"
        }`}
      >
        <Image
          src={listing.primaryImageUrl}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width:640px) 92vw, (max-width:1280px) 33vw, 16vw"
        />
        <div className="absolute left-2 top-2 z-[1] flex max-w-[calc(100%-5rem)] flex-wrap gap-1">
          {listing.featured ? (
            <span className="rounded-full border border-[color:var(--lx-gold-border)] bg-[linear-gradient(135deg,rgba(201,168,74,0.95),rgba(184,149,74,0.92))] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#FFFCF7] shadow-sm">
              {copy.featuredBadge}
            </span>
          ) : null}
          {badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)]/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[color:var(--lx-text-2)] shadow-sm backdrop-blur-sm"
            >
              {b}
            </span>
          ))}
        </div>
        <div className="absolute right-2 top-2 z-[1]">
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm backdrop-blur-sm ${
              isDealer
                ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)]"
                : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)]/95 text-[color:var(--lx-text-2)]"
            }`}
          >
            {laneLabel}
          </span>
        </div>
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${variant === "featured" ? "gap-2 p-4" : "gap-1.5 p-3 sm:p-4"}`}>
        <div className="min-w-0">
          <p className="font-serif text-[15px] font-semibold leading-snug text-[color:var(--lx-text)] sm:text-base">{listing.vehicleTitle}</p>
          {listing.trim ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-[color:var(--lx-muted)]">{listing.trim}</p>
          ) : null}
        </div>
        <p className={`font-bold tabular-nums text-[color:var(--lx-gold)] ${variant === "featured" ? "text-xl sm:text-2xl" : "text-lg"}`}>
          {formatAutosUsd(listing.price)}
        </p>
        {listing.monthlyEstimate && variant === "featured" ? (
          <p className="text-[11px] font-medium text-[color:var(--lx-muted)]">{listing.monthlyEstimate}</p>
        ) : null}
        <p className="text-xs text-[color:var(--lx-text-2)]">
          {formatAutosMiles(listing.mileage)} · {loc}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--lx-nav-border)] pt-3">
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[color:var(--lx-text-2)]" title={sellerLine}>
            {sellerLine}
          </span>
          <span className="inline-flex min-h-[40px] min-w-[6.5rem] shrink-0 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 text-xs font-bold text-[color:var(--lx-text)] transition group-hover:border-[color:var(--lx-gold-border)] group-hover:bg-[color:var(--lx-nav-hover)]">
            {copy.cardViewDetails}
          </span>
        </div>
      </div>
    </Link>
  );
}
