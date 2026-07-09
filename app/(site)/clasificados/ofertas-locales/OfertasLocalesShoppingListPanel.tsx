"use client";

import { useCallback, useState } from "react";
import { FiMapPin, FiShoppingCart, FiSmartphone } from "react-icons/fi";
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
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_OUTLINE =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const QTY_BTN =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#D4C4A8] bg-white text-base font-semibold text-[#1E1814] hover:border-[#7A1E2C]/35 disabled:cursor-not-allowed disabled:opacity-45";
const INPUT =
  "w-full rounded-lg border border-[#D4C4A8]/90 bg-white px-2 py-2 text-xs text-[#1E1814] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/20";

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
        <div className="border-b border-[#D4C4A8]/60 bg-gradient-to-r from-[#FDF8F0] to-[#FFFCF7] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#B8860B]/40 bg-white text-[#7A1E2C]">
                <FiShoppingCart className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#1E1814]">{c.shoppingListTitle}</p>
                <p className="mt-0.5 text-xs font-medium text-[#7A1E2C]">
                  {itemCount > 0
                    ? c.listSummary(storeCount, itemCount)
                    : c.shoppingListEmptyHelper}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#1E1814]/55">
                  <FiSmartphone className="h-3 w-3 shrink-0" aria-hidden />
                  {c.savedOnDevice}
                </p>
              </div>
            </div>
            <button type="button" className={`${BTN_OUTLINE} !w-auto shrink-0 px-3`} onClick={onClose}>
              {c.close}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D4C4A8]/80 bg-white/70 px-4 py-8 text-center">
              <FiShoppingCart className="mx-auto h-8 w-8 text-[#B8860B]/70" aria-hidden />
              <p className="mt-3 text-sm text-[#1E1814]/70">{c.shoppingListEmptyHelper}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                {c.storesInList}
              </p>
              {groups.map((group) => (
                <section
                  key={group.businessKey}
                  className="overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm"
                >
                  <div className="border-b border-[#D4C4A8]/50 bg-[#FAF6F0]/60 px-3 py-2.5">
                    <p className="text-sm font-semibold text-[#1E1814]">{group.businessName}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#1E1814]/65">
                      <FiMapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {[group.city, group.state, group.zipCode].filter(Boolean).join(", ") ||
                        (lang === "es" ? "Ubicación no indicada" : "Location not listed")}
                    </p>
                  </div>
                  <ul className="divide-y divide-[#D4C4A8]/40">
                    {group.items.map((item) => {
                      const price = formatOfertaLocalPublicItemPriceDisplay(item);
                      const dates = formatOfertaLocalPublicItemValidDates(item, lang);
                      return (
                        <li key={item.itemId} className="px-3 py-2.5">
                          <div className="flex gap-2.5">
                            {item.sourceAssetHref ? (
                              <a
                                href={item.sourceAssetHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#D4C4A8]/60 bg-[#FAF6F0]"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.sourceAssetHref}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </a>
                            ) : (
                              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#D4C4A8]/60 bg-[#FAF6F0] text-[#B8860B]/70">
                                <FiShoppingCart className="h-5 w-5" aria-hidden />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[#1E1814]">
                                    {item.itemName}
                                  </p>
                                  <p className="text-sm font-bold text-[#7A1E2C]">{price}</p>
                                  {item.unit?.trim() ? (
                                    <p className="text-[11px] text-[#1E1814]/60">{item.unit}</p>
                                  ) : null}
                                  {dates ? (
                                    <p className="mt-0.5 text-[10px] text-[#1E1814]/55">
                                      {c.validDates}: {dates}
                                    </p>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-medium text-red-700 underline"
                                  onClick={() => onRemove(item.itemId)}
                                >
                                  {c.removeFromList}
                                </button>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-[#1E1814]/60">{c.quantityLabel}</span>
                                <button
                                  type="button"
                                  className={QTY_BTN}
                                  onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1)}
                                  disabled={item.quantity <= OFERTAS_LOCALES_SHOPPING_LIST_MIN_QTY}
                                  aria-label={lang === "es" ? "Disminuir cantidad" : "Decrease quantity"}
                                >
                                  −
                                </button>
                                <span className="min-w-[1.75rem] text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className={QTY_BTN}
                                  onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1)}
                                  disabled={item.quantity >= OFERTAS_LOCALES_SHOPPING_LIST_MAX_QTY}
                                  aria-label={lang === "es" ? "Aumentar cantidad" : "Increase quantity"}
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
                                  className="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-[#7A1E2C] underline"
                                >
                                  {c.viewSource}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-[#D4C4A8]/60 bg-[#FAF6F0]/80 px-4 py-3">
          <button type="button" className={BTN} onClick={() => void onCopyList()}>
            {c.copyList}
          </button>
          {copyMessage ? <p className="text-center text-xs text-[#1E1814]/70">{copyMessage}</p> : null}
          {mapsDir.url ? (
            <a href={mapsDir.url} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.openMap}
            </a>
          ) : (
            <button
              type="button"
              className={BTN_OUTLINE}
              disabled
              title={mapsDir.reason === "no_address" ? c.openMapNoAddress : c.openMapEmpty}
            >
              {c.openMap}
            </button>
          )}
          <p className="text-center text-[11px] leading-snug text-[#1E1814]/55">{c.mapHandoffNote}</p>
          {groups.length > 0 ? (
            <button type="button" className={`${BTN_OUTLINE} text-red-700`} onClick={onClear}>
              {c.clearList}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
