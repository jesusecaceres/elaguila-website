"use client";

import { useCallback, useEffect, useState } from "react";

import type { OfertaLocalPublicOfferCard } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import {
  ofertaLocalPublicOfferTypeLabel,
  ofertasLocalesPublicSearchCopy,
} from "./ofertasLocalesPublicSearchCopy";

const OVERLAY = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4";
const DRAWER =
  "max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#B8860B]/55 bg-gradient-to-b from-[#FFFCF7] to-[#F5EBD8] shadow-xl sm:rounded-2xl";
const BTN =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#6a1926]";
const BTN_OUTLINE =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const BADGE =
  "inline-flex rounded-full border border-[#B8860B]/60 bg-[#FDF8F0] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F]";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferCard;
  onClose: () => void;
  surface?: "ofertas" | "cupones";
};

function businessInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function OfertasLocalesPublicOfferDetailDrawer({ lang, offer, onClose, surface = "ofertas" }: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang, surface);
  const isCupones = surface === "cupones";
  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");
  const dates =
    offer.validFrom && offer.validUntil
      ? `${offer.validFrom} – ${offer.validUntil}`
      : offer.validFrom || offer.validUntil;
  const typeLabel = ofertaLocalPublicOfferTypeLabel(lang, offer.offerType);
  const initial = businessInitial(offer.businessName);

  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: offer.title || offer.businessName, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* user cancelled share or clipboard blocked */
    }
  }, [offer.title, offer.businessName]);

  const heading = isCupones ? c.couponDetails : c.offerDetailTitle;
  const closeLabel = isCupones ? c.closeCoupon : c.close;
  const hasContact = Boolean(offer.phoneHref || offer.websiteHref || offer.directionsHref);

  return (
    <div
      className={OVERLAY}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      data-testid={isCupones ? "cupones-offer-detail-drawer" : undefined}
      onClick={onClose}
    >
      <div className={DRAWER} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 border-b border-[#D4C4A8]/60 bg-[#FAF6F0]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]/80">{heading}</p>
              <div className="mt-2 flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#B8860B]/50 bg-[#FDF8F0] font-serif text-lg font-bold text-[#7A1E2C]"
                  aria-hidden
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1E1814]">{offer.businessName}</p>
                  <p className="mt-0.5 break-words font-serif text-lg font-bold leading-snug text-[#2A4536]">
                    {offer.title}
                  </p>
                </div>
              </div>
            </div>
            <button type="button" className={BTN_OUTLINE} onClick={onClose}>
              {closeLabel}
            </button>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4 text-sm">
          {offer.primaryAssetHref ? (
            <div className="overflow-hidden rounded-xl border border-[#B8860B]/45 bg-[#FDF8F0] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={offer.primaryAssetHref}
                alt={offer.primaryAssetLabel || offer.title}
                className="mx-auto max-h-[min(40vh,280px)] w-full object-contain object-center"
              />
            </div>
          ) : isCupones ? (
            <div className="rounded-xl border border-dashed border-[#D4C4A8]/80 bg-[#FAF6F0]/80 px-4 py-6 text-center">
              <p className="font-serif text-sm font-semibold text-[#8A6B1F]/90">{c.sourceUnavailable}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <span className={BADGE}>{typeLabel}</span>
            {offer.businessCategory ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#2A4536]/75">
                {offer.businessCategory}
              </span>
            ) : null}
          </div>

          {dates ? (
            <p className="text-sm font-medium text-[#1E1814]/75">
              {c.validDates}: {dates}
            </p>
          ) : null}

          {location || offer.address ? (
            <div className="rounded-xl border border-[#D4C4A8]/60 bg-white/70 px-3 py-2.5">
              {location ? <p className="text-sm text-[#1E1814]">{location}</p> : null}
              {offer.address ? <p className="text-sm text-[#1E1814]/70">{offer.address}</p> : null}
            </div>
          ) : null}

          {hasContact || isCupones ? (
            <div className="space-y-2">
              {isCupones ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2A4536]">{c.availableBusinessInfo}</p>
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {offer.phoneHref ? (
                  <a href={offer.phoneHref} className={BTN}>
                    {c.call}
                  </a>
                ) : null}
                {offer.websiteHref ? (
                  <a href={offer.websiteHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                    {c.website}
                  </a>
                ) : null}
                {offer.directionsHref ? (
                  <a href={offer.directionsHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                    {c.directions}
                  </a>
                ) : null}
                {isCupones ? (
                  <button type="button" className={BTN_OUTLINE} onClick={() => void handleShare()}>
                    {c.shareCoupon}
                  </button>
                ) : null}
              </div>
              {isCupones && shareCopied ? (
                <p className="text-xs font-medium text-[#2A4536]">{c.linkCopied}</p>
              ) : null}
            </div>
          ) : null}

          {offer.primaryAssetHref && !isCupones ? (
            <a href={offer.primaryAssetHref} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.viewSource}
            </a>
          ) : null}

          {offer.primaryAssetHref && isCupones ? (
            <a href={offer.primaryAssetHref} target="_blank" rel="noopener noreferrer" className={`${BTN} w-full`}>
              {c.viewSource}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
