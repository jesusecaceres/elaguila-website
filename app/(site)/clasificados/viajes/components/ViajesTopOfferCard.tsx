import Image from "next/image";
import Link from "next/link";

import type { ViajesTopOffer } from "../data/viajesLandingSampleData";
import { type ViajesUi, viajesBadgeLabel } from "../data/viajesUiCopy";
import { VIAJES_LANDING_CTA_ORANGE } from "../lib/viajesLandingVisual";
import { withViajesOfferBackParam } from "../lib/viajesOfferLink";

function StarRow({ count, ariaLabel }: { count: number; ariaLabel: string }) {
  if (count <= 0) return null;
  const full = Math.min(5, Math.max(0, Math.round(count)));
  return (
    <span className="text-amber-500" aria-label={ariaLabel}>
      {"★".repeat(full)}
      <span className="text-[color:var(--lx-muted)]/40">{"☆".repeat(5 - full)}</span>
    </span>
  );
}

export function ViajesTopOfferCard({ offer, homeBackHref, ui }: { offer: ViajesTopOffer; homeBackHref: string; ui: ViajesUi }) {
  const affiliateDisclosure =
    ui.lang === "en" && offer.affiliateDisclosureShortEn ? offer.affiliateDisclosureShortEn : offer.affiliateDisclosureShort;
  const starAria =
    ui.lang === "en" ? `${Math.min(5, Math.max(0, Math.round(offer.stars)))} of 5 stars` : `${Math.min(5, Math.max(0, Math.round(offer.stars)))} de 5 estrellas`;

  const href =
    offer.href.includes("/oferta/") && offer.listingKind !== "editorial"
      ? withViajesOfferBackParam(offer.href, homeBackHref)
      : offer.href;

  const shell =
    offer.listingKind === "affiliate"
      ? "border-amber-200/80 bg-[#fffdf9] shadow-[0_10px_36px_-18px_rgba(30,50,70,0.12)]"
      : offer.listingKind === "business"
        ? "border-[color:var(--lx-gold-border)] bg-[#fffefb] shadow-[0_10px_36px_-18px_rgba(30,24,16,0.1)]"
        : "border-dashed border-[color:var(--lx-gold-border)] bg-[#faf7f0] shadow-[0_8px_28px_-16px_rgba(30,24,16,0.08)]";

  const sourcePill =
    offer.listingKind === "affiliate" ? (
      <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
        {ui.cards.sourceAffiliate}
      </span>
    ) : offer.listingKind === "business" ? (
      <span className="rounded-full bg-[color:var(--lx-section)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
        {ui.cards.sourceBusiness}
      </span>
    ) : (
      <span className="rounded-full bg-[#2A2620] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FAF7F2]">{ui.cards.sourceIdeas}</span>
    );

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-[2px] hover:shadow-[0_22px_48px_-20px_rgba(30,50,80,0.18)] ${shell}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={offer.imageSrc}
          alt={offer.imageAlt}
          fill
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)] shadow-sm backdrop-blur-sm">
            {viajesBadgeLabel(offer.badge, ui)}
          </span>
          {sourcePill}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[color:var(--lx-text)]">{offer.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[color:var(--lx-text-2)]">{offer.supportingLine}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[color:var(--lx-muted)]">
          <StarRow count={offer.stars} ariaLabel={starAria} />
          {offer.stars > 0 ? <span className="hidden sm:inline">·</span> : null}
          <span>{offer.locationLine}</span>
        </div>
        <p className="mt-3 text-lg font-bold text-[color:var(--lx-text)]">
          {offer.listingKind === "editorial" ? ui.cards.readFree : offer.priceFrom}
        </p>
        <div className="mt-2 flex flex-col gap-1 text-xs text-[color:var(--lx-muted)]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden>🗓️</span>
            {offer.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden>✈️</span>
            {offer.departureContext}
          </span>
          {offer.listingKind === "affiliate" && affiliateDisclosure ? (
            <p className="mt-1 rounded-lg border border-amber-200/60 bg-amber-50/80 px-2 py-1.5 text-[10px] font-medium leading-snug text-amber-950">
              {affiliateDisclosure}
            </p>
          ) : null}
          {offer.listingKind === "business" && offer.businessName ? (
            <span className="mt-1 rounded-lg bg-[color:var(--lx-section)] px-2 py-1 text-[11px] font-medium text-[color:var(--lx-text-2)]">
              {offer.businessName}
            </span>
          ) : null}
          {offer.partnerLabel && offer.listingKind === "affiliate" ? (
            <span className="mt-1 rounded-lg bg-[rgba(212,188,106,0.15)] px-2 py-1 text-[11px] font-medium text-[color:var(--lx-text-2)]">{offer.partnerLabel}</span>
          ) : null}
        </div>
        <div className="mt-auto flex justify-end pt-4">
          <Link
            href={href}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white shadow-[0_10px_22px_-8px_rgba(234,88,12,0.45)] transition hover:brightness-105"
            style={{ backgroundColor: VIAJES_LANDING_CTA_ORANGE }}
          >
            {offer.listingKind === "editorial" ? ui.cards.explore : ui.cards.viewOffer}
          </Link>
        </div>
      </div>
    </article>
  );
}
