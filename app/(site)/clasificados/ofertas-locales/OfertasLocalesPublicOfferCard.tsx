"use client";

import Link from "next/link";

import { ofertaLocalPublicDetailPath } from "@/app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers";
import type { OfertaLocalPublicOfferCard } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";

const CARD =
  "block w-full rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-[#7A1E2C]/45 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferCard;
  surface?: "ofertas" | "cupones";
  /** When provided on the Cupones surface, the card opens the coupon drawer instead of navigating. */
  onSelect?: (offer: OfertaLocalPublicOfferCard) => void;
};

export function OfertasLocalesPublicOfferCard({ lang, offer, surface = "ofertas", onSelect }: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang, surface);
  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");
  const dates =
    offer.validFrom && offer.validUntil
      ? `${offer.validFrom} – ${offer.validUntil}`
      : offer.validFrom || offer.validUntil;

  const inner = (
    <>
      <p className="text-base font-semibold text-[#1E1814]">{offer.title}</p>
      <p className="mt-1 text-sm font-medium text-[#1E1814]/85">{offer.businessName}</p>
      {location ? <p className="mt-0.5 text-xs text-[#1E1814]/65">{location}</p> : null}
      {dates ? (
        <p className="mt-1 text-xs text-[#1E1814]/55">
          {c.validDates}: {dates}
        </p>
      ) : null}
      {offer.businessCategory ? (
        <p className="mt-2 text-xs text-[#1E1814]/60">{offer.businessCategory}</p>
      ) : null}
      <p className="mt-3 text-xs font-semibold text-[#7A1E2C]">{c.viewDeal} →</p>
    </>
  );

  if (surface === "cupones" && onSelect) {
    return (
      <button type="button" className={CARD} onClick={() => onSelect(offer)} aria-label={`${c.viewDeal}: ${offer.title}`}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={ofertaLocalPublicDetailPath(offer.id, lang)} className={CARD}>
      {inner}
    </Link>
  );
}
