"use client";

import type { OfertaLocalPublicOfferCard } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";

const OVERLAY = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4";
const DRAWER =
  "max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#D4C4A8]/70 bg-[#FAF6F0] shadow-xl sm:rounded-2xl";
const BTN =
  "inline-flex rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926]";
const BTN_OUTLINE =
  "inline-flex rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferCard;
  onClose: () => void;
};

export function OfertasLocalesPublicOfferDetailDrawer({ lang, offer, onClose }: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang);
  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");
  const dates =
    offer.validFrom && offer.validUntil
      ? `${offer.validFrom} – ${offer.validUntil}`
      : offer.validFrom || offer.validUntil;

  return (
    <div className={OVERLAY} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={DRAWER} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 border-b border-[#D4C4A8]/60 bg-[#FAF6F0]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[#1E1814]">{c.offerDetailTitle}</p>
              <p className="mt-1 text-lg font-bold text-[#7A1E2C]">{offer.title}</p>
            </div>
            <button type="button" className={BTN_OUTLINE} onClick={onClose}>
              {c.close}
            </button>
          </div>
        </div>
        <div className="space-y-4 px-4 py-4 text-sm">
          <p className="font-medium text-[#1E1814]">{offer.businessName}</p>
          {location ? <p className="text-[#1E1814]/70">{location}</p> : null}
          {offer.address ? <p className="text-[#1E1814]/70">{offer.address}</p> : null}
          {dates ? (
            <p className="text-[#1E1814]/65">
              {c.validDates}: {dates}
            </p>
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
