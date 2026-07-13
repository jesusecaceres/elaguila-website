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
  "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#B8860B]/55 bg-gradient-to-b from-[#FFFCF7] to-[#F5EBD8] text-left shadow-sm transition-all hover:border-[#B8860B]/85 hover:shadow-[0_8px_28px_rgba(30,24,20,0.12)]";
const IMAGE_FRAME =
  "relative flex aspect-square w-full max-h-[220px] items-center justify-center overflow-hidden bg-[#FDF8F0] px-3 py-3 sm:max-h-[200px]";
const BTN_VIEW =
  "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-semibold text-[#1E1814] transition hover:border-[#7A1E2C]/40 sm:text-sm";
const BTN_ADD =
  "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6a1926] sm:text-sm";
const BTN_ADDED =
  "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 sm:text-sm";

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
    <article className={CARD} data-testid="ofertas-public-item-card">
      <button type="button" className="block w-full text-left" onClick={() => onSelect(item)}>
        <div className={IMAGE_FRAME} data-testid="ofertas-item-card-preview">
          {item.sourceAssetHref ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.sourceAssetHref}
              alt={item.itemName}
              className="h-full w-full object-contain object-center"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#D4C4A8]/80 bg-[#FAF6F0]/80 px-4 text-center">
              <span className="font-serif text-sm font-semibold text-[#8A6B1F]/90">{c.productImageUnavailable}</span>
            </div>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(item)}>
            <p className="font-serif text-base font-bold leading-snug text-[#2A4536] sm:text-lg">{item.itemName}</p>
          </button>
          {price ? (
            <span className="shrink-0 rounded-lg border border-[#B8860B]/45 bg-[#FDF8F0] px-2 py-1 text-sm font-bold text-[#7A1E2C]">
              {price}
            </span>
          ) : null}
        </div>

        {item.unit?.trim() ? <p className="mt-0.5 text-xs text-[#1E1814]/60">{item.unit}</p> : null}

        <button type="button" className="mt-2 block w-full text-left" onClick={() => onSelect(item)}>
          <p className="text-sm font-semibold text-[#1E1814]">{item.businessName}</p>
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

        <div className="mt-auto flex flex-wrap items-stretch gap-2 pt-4">
          <button type="button" className={BTN_VIEW} onClick={() => onSelect(item)}>
            {c.viewDetail}
          </button>
          {isAdded ? (
            <>
              <button type="button" className={BTN_ADDED} onClick={onOpenList}>
                {c.addedToList}
              </button>
              <button
                type="button"
                className="w-full text-center text-xs text-[#1E1814]/55 underline sm:w-auto"
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
      </div>
    </article>
  );
}
