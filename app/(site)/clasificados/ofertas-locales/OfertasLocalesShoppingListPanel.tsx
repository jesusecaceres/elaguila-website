"use client";

import { useCallback, useState } from "react";
import {
  formatOfertaLocalPublicItemPriceDisplay,
  formatOfertaLocalPublicItemValidDates,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers";
import {
  buildOfertaLocalShoppingListGoogleMapsDirUrl,
  formatOfertaLocalShoppingListPlainText,
  groupOfertaLocalShoppingListByBusiness,
  OFERTAS_LOCALES_SHOPPING_LIST_MAX_NOTE,
  OFERTAS_LOCALES_SHOPPING_LIST_MAX_QTY,
  OFERTAS_LOCALES_SHOPPING_LIST_MIN_QTY,
  type OfertaLocalShoppingListState,
} from "@/app/lib/ofertas-locales/ofertasLocalesShoppingList";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";

const OVERLAY = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-stretch sm:justify-end sm:p-0";
const PANEL =
  "flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#D4C4A8]/70 bg-[#FAF6F0] shadow-xl sm:max-h-full sm:min-h-full sm:rounded-none";
const BTN =
  "rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_OUTLINE =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const INPUT =
  "w-full rounded-lg border border-[#D4C4A8]/90 bg-white px-2 py-1.5 text-xs text-[#1E1814] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/20";

type Props = {
  lang: OfertasLocalesAppLang;
  list: OfertaLocalShoppingListState;
  storeCount: number;
  itemCount: number;
  onClose: () => void;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateNote: (itemId: string, note: string) => void;
  onClear: () => void;
};

export function OfertasLocalesShoppingListPanel({
  lang,
  list,
  storeCount,
  itemCount,
  onClose,
  onRemove,
  onUpdateQuantity,
  onUpdateNote,
  onClear,
}: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang);
  const groups = groupOfertaLocalShoppingListByBusiness(list);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const mapsDir = buildOfertaLocalShoppingListGoogleMapsDirUrl(list);

  const onCopyList = useCallback(async () => {
    setCopyMessage(null);
    const text = formatOfertaLocalShoppingListPlainText(list, lang);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyMessage(c.copyListSuccess);
        return;
      }
      setCopyMessage(c.copyListFailed);
    } catch {
      setCopyMessage(c.copyListFailed);
    }
  }, [c.copyListFailed, c.copyListSuccess, lang, list]);

  return (
    <div className={OVERLAY} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={PANEL} onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[#D4C4A8]/60 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[#1E1814]">{c.myShoppingList}</p>
              <p className="mt-1 text-xs text-[#1E1814]/65">
                {c.listSummary(storeCount, itemCount)}
              </p>
            </div>
            <button type="button" className={BTN_OUTLINE} onClick={onClose}>
              {c.close}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {groups.length === 0 ? (
            <p className="text-sm text-[#1E1814]/70">{c.listEmpty}</p>
          ) : (
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                {c.storesInList}
              </p>
              {groups.map((group) => (
                <section
                  key={group.businessKey}
                  className="rounded-xl border border-[#D4C4A8]/70 bg-white px-3 py-3"
                >
                  <p className="text-sm font-semibold text-[#1E1814]">{group.businessName}</p>
                  <p className="text-xs text-[#1E1814]/65">
                    {[group.city, group.state, group.zipCode].filter(Boolean).join(", ")}
                  </p>
                  <ul className="mt-3 space-y-3">
                    {group.items.map((item) => {
                      const price = formatOfertaLocalPublicItemPriceDisplay(item);
                      const dates = formatOfertaLocalPublicItemValidDates(item, lang);
                      return (
                        <li key={item.itemId} className="rounded-lg bg-[#FAF6F0]/80 px-2.5 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-[#1E1814]">{item.itemName}</p>
                              <p className="text-sm font-bold text-[#7A1E2C]">{price}</p>
                              {item.unit?.trim() ? (
                                <p className="text-xs text-[#1E1814]/60">{item.unit}</p>
                              ) : null}
                              {dates ? (
                                <p className="mt-0.5 text-[11px] text-[#1E1814]/55">
                                  {c.validDates}: {dates}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              className="text-xs font-medium text-red-700 underline"
                              onClick={() => onRemove(item.itemId)}
                            >
                              {c.removeFromList}
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-[#1E1814]/60">{c.quantityLabel}</span>
                            <button
                              type="button"
                              className="h-7 w-7 rounded border border-[#D4C4A8] bg-white text-sm"
                              onClick={() =>
                                onUpdateQuantity(item.itemId, item.quantity - 1)
                              }
                              disabled={item.quantity <= OFERTAS_LOCALES_SHOPPING_LIST_MIN_QTY}
                            >
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="h-7 w-7 rounded border border-[#D4C4A8] bg-white text-sm"
                              onClick={() =>
                                onUpdateQuantity(item.itemId, item.quantity + 1)
                              }
                              disabled={item.quantity >= OFERTAS_LOCALES_SHOPPING_LIST_MAX_QTY}
                            >
                              +
                            </button>
                          </div>
                          <label className="mt-2 block">
                            <span className="text-[11px] text-[#1E1814]/55">{c.noteLabel}</span>
                            <input
                              className={INPUT}
                              value={item.note}
                              maxLength={OFERTAS_LOCALES_SHOPPING_LIST_MAX_NOTE}
                              placeholder={c.notePlaceholder}
                              onChange={(e) => onUpdateNote(item.itemId, e.target.value)}
                            />
                          </label>
                          {item.sourceAssetHref ? (
                            <a
                              href={item.sourceAssetHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-xs font-medium text-[#7A1E2C] underline"
                            >
                              {c.viewSource}
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-[#D4C4A8]/60 px-4 py-3">
          <button type="button" className={`${BTN} w-full`} onClick={() => void onCopyList()}>
            {c.copyList}
          </button>
          {copyMessage ? <p className="text-center text-xs text-[#1E1814]/70">{copyMessage}</p> : null}
          {mapsDir.url ? (
            <a
              href={mapsDir.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN} w-full text-center`}
            >
              {c.openMap}
            </a>
          ) : (
            <button
              type="button"
              className={`${BTN_OUTLINE} w-full`}
              disabled
              title={mapsDir.reason === "no_address" ? c.openMapNoAddress : c.openMapEmpty}
            >
              {c.openMap}
            </button>
          )}
          {groups.length > 0 ? (
            <button type="button" className={`${BTN_OUTLINE} w-full text-red-700`} onClick={onClear}>
              {c.clearList}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
