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
  "w-full rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-[#7A1E2C]/45 hover:shadow-md";
const BTN_VIEW =
  "text-xs font-semibold text-[#7A1E2C] hover:underline";
const BTN_ADD =
  "rounded-lg border border-[#7A1E2C]/35 bg-[#7A1E2C]/5 px-2.5 py-1.5 text-xs font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/10";
const BTN_ADDED =
  "rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900";

type Props = {
  lang: OfertasLocalesAppLang;
  item: OfertaLocalPublicSearchItem;
  isAdded: boolean;
  onSelect: (item: OfertaLocalPublicSearchItem) => void;
  onAdd: (item: OfertaLocalPublicSearchItem) => void;
  onRemove: (itemId: string) => void;
  onOpenList: () => void;
};

export function OfertasLocalesPublicItemCard({
  lang,
  item,
  isAdded,
  onSelect,
  onAdd,
  onRemove,
  onOpenList,
}: Props) {
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
    <article className={CARD}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(item)}>
          <p className="text-base font-semibold text-[#1E1814]">{item.itemName}</p>
        </button>
        <span className="shrink-0 text-sm font-bold text-[#7A1E2C]">{price}</span>
      </div>
      {item.unit?.trim() ? (
        <p className="mt-0.5 text-xs text-[#1E1814]/60">{item.unit}</p>
      ) : null}
      <button type="button" className="mt-2 block w-full text-left" onClick={() => onSelect(item)}>
        <p className="text-sm font-medium text-[#1E1814]/85">{item.businessName}</p>
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
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={BTN_VIEW} onClick={() => onSelect(item)}>
          {c.viewDeal} →
        </button>
        {isAdded ? (
          <>
            <button type="button" className={BTN_ADDED} onClick={onOpenList}>
              {c.addedToList}
            </button>
            <button
              type="button"
              className="text-xs text-[#1E1814]/55 underline"
              onClick={() => onRemove(item.id)}
            >
              {c.removeFromList}
            </button>
          </>
        ) : (
          <button type="button" className={BTN_ADD} onClick={() => onAdd(item)}>
            {c.addToList}
          </button>
        )}
      </div>
    </article>
  );
}
