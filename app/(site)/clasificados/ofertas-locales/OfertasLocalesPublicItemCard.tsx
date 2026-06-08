"use client";

import type { OfertaLocalPublicSearchItem } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import {
  formatOfertaLocalPublicItemLocation,
  formatOfertaLocalPublicItemPriceDisplay,
  formatOfertaLocalPublicItemValidDates,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";

const CARD =
  "w-full rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-[#7A1E2C]/45 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25 active:scale-[0.99]";

type Props = {
  lang: OfertasLocalesAppLang;
  item: OfertaLocalPublicSearchItem;
  onSelect: (item: OfertaLocalPublicSearchItem) => void;
};

export function OfertasLocalesPublicItemCard({ lang, item, onSelect }: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang);
  const price = formatOfertaLocalPublicItemPriceDisplay(item);
  const location = formatOfertaLocalPublicItemLocation(item);
  const dates = formatOfertaLocalPublicItemValidDates(item, lang);
  const tag =
    item.category?.trim() ||
    item.searchTags.slice(0, 2).join(", ") ||
    item.subcategory?.trim() ||
    "";

  return (
    <button type="button" className={CARD} onClick={() => onSelect(item)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold text-[#1E1814]">{item.itemName}</p>
        <span className="shrink-0 text-sm font-bold text-[#7A1E2C]">{price}</span>
      </div>
      {item.unit?.trim() ? (
        <p className="mt-0.5 text-xs text-[#1E1814]/60">{item.unit}</p>
      ) : null}
      <p className="mt-2 text-sm font-medium text-[#1E1814]/85">{item.businessName}</p>
      {location ? <p className="mt-0.5 text-xs text-[#1E1814]/65">{location}</p> : null}
      {dates ? (
        <p className="mt-1 text-xs text-[#1E1814]/55">
          {c.validDates}: {dates}
        </p>
      ) : null}
      {tag ? <p className="mt-2 text-xs text-[#1E1814]/60">{tag}</p> : null}
      {item.sourcePage != null && item.sourcePage > 0 ? (
        <p className="mt-1 text-[11px] text-[#1E1814]/50">
          {c.sourcePage} {item.sourcePage}
        </p>
      ) : null}
      <p className="mt-3 text-xs font-semibold text-[#7A1E2C]">{c.viewDeal} →</p>
    </button>
  );
}
