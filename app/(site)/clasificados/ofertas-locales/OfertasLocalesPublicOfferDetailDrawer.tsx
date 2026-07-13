"use client";

import { useCallback, useEffect, useState } from "react";

import type { OfertaLocalPublicOfferCard } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";

const OVERLAY = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4";
const DRAWER =
  "max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#D4C4A8]/70 bg-[#FAF6F0] shadow-xl sm:rounded-2xl";
const BTN =
  "inline-flex items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926]";
const BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const BADGE =
  "inline-flex items-center rounded-full border border-[#2A4536]/25 bg-[#2A4536]/8 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2A4536]";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferCard;
  onClose: () => void;
  surface?: "ofertas" | "cupones";
};

export function OfertasLocalesPublicOfferDetailDrawer({ lang, offer, onClose, surface = "ofertas" }: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang, surface);
  const isCupones = surface === "cupones";
  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");
  const dates =
    offer.validFrom && offer.validUntil
      ? `${offer.validFrom} – ${offer.validUntil}`
      : offer.validFrom || offer.validUntil;

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
      /* user cancelled share or clipboard blocked — no fake tracking */
    }
  }, [offer.title, offer.businessName]);

  const heading = isCupones ? c.couponDetails : c.offerDetailTitle;
  const closeLabel = isCupones ? c.closeCoupon : c.close;

  return (
    <div className={OVERLAY} role="dialog" aria-modal="true" aria-label={heading} onClick={onClose}>
      <div className={DRAWER} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 border-b border-[#D4C4A8]/60 bg-[#FAF6F0]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]/80">{heading}</p>
              <p className="mt-1 break-words text-lg font-bold text-[#7A1E2C]">{offer.title}</p>
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
          ) : null}

          <div className="space-y-1.5">
            <p className="font-medium text-[#1E1814]">{offer.businessName}</p>
            {offer.businessCategory ? <p className="text-[#1E1814]/70">{offer.businessCategory}</p> : null}
            {location ? <p className="text-[#1E1814]/70">{location}</p> : null}
            {offer.address ? <p className="text-[#1E1814]/70">{offer.address}</p> : null}
            {dates ? (
              <p className="text-[#1E1814]/65">
                {c.validDates}: {dates}
              </p>
            ) : null}
          </div>

          {isCupones && offer.offerType ? (
            <div>
              <span className={BADGE}>{offer.offerType.replace(/_/g, " ")}</span>
            </div>
          ) : null}

          {isCupones ? (
            <p className="rounded-lg border border-[#D4C4A8]/60 bg-white/60 px-3 py-2 text-[13px] text-[#1E1814]/70">
              {c.noExtraDetails}
            </p>
          ) : null}

          <div className="space-y-2">
            {isCupones ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2A4536]">{c.availableBusinessInfo}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
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
            {isCupones && shareCopied ? <p className="text-xs font-medium text-[#2A4536]">{c.linkCopied}</p> : null}
          </div>

          {offer.primaryAssetHref ? (
            <a href={offer.primaryAssetHref} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.viewSource}
            </a>
          ) : (
            <p className="text-[#1E1814]/70">{c.sourceUnavailable}</p>
          )}
        </div>
      </div>
    </div>
  );
}
