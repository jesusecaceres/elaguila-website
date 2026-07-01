"use client";

import type { OfertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";

type Props = {
  open: boolean;
  lang: "es" | "en";
  c: OfertasLocalesPublicSearchCopy;
  category: string;
  marketType: string;
  offerType: string;
  sort: string;
  onCategoryChange: (v: string) => void;
  onMarketTypeChange: (v: string) => void;
  onOfferTypeChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
};

const INPUT =
  "mt-1 w-full min-h-[2.625rem] rounded-lg border border-[#D6C7AD]/90 bg-white px-3 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

export function OfertasLocalesFiltersDrawer({
  open,
  lang,
  c,
  category,
  marketType,
  offerType,
  sort,
  onCategoryChange,
  onMarketTypeChange,
  onOfferTypeChange,
  onSortChange,
  onClose,
  onApply,
  onClear,
}: Props) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40"
        aria-label={c.close}
        onClick={onClose}
      />
      <div
        className={
          "fixed z-[61] flex flex-col overflow-hidden border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_-12px_48px_-16px_rgba(42,36,22,0.28)] " +
          "inset-x-0 bottom-0 top-[12vh] rounded-t-2xl max-lg:max-h-[88vh] " +
          "lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-full lg:max-w-[400px] lg:rounded-none lg:rounded-l-2xl"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="ofertas-locales-filters-title"
      >
        <div className="flex items-center justify-between border-b border-[#D6C7AD]/60 px-4 py-3">
          <h2 id="ofertas-locales-filters-title" className="font-serif text-base font-bold text-[#2A4536]">
            {c.filtersButton}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
          >
            {c.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">
            {lang === "es" ? "Categoría de oferta" : "Deal category"}
          </p>
          <div className="mt-3 space-y-3">
            <label className="block text-xs font-semibold text-[#3D3428]">
              {c.categoryLabel}
              <input
                className={INPUT}
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                placeholder={c.categoryPlaceholder}
              />
            </label>
            <label className="block text-xs font-semibold text-[#3D3428]">
              {c.marketTypeLabel}
              <input
                className={INPUT}
                value={marketType}
                onChange={(e) => onMarketTypeChange(e.target.value)}
                placeholder={c.marketTypePlaceholder}
              />
            </label>
            <label className="block text-xs font-semibold text-[#3D3428]">
              {c.offerTypeLabel}
              <input
                className={INPUT}
                value={offerType}
                onChange={(e) => onOfferTypeChange(e.target.value)}
                placeholder={c.offerTypePlaceholder}
              />
            </label>
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{c.sortLabel}</p>
          <label className="mt-3 block text-xs font-semibold text-[#3D3428]">
            {c.sortLabel}
            <select className={INPUT} value={sort} onChange={(e) => onSortChange(e.target.value)}>
              <option value="newest">{c.sortNewest}</option>
              <option value="price_low">{c.sortPriceLow}</option>
              <option value="expiring_soon">{c.sortExpiringSoon}</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] p-4">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-[2.625rem] flex-1 items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
          >
            {lang === "es" ? "Limpiar filtros" : "Clear filters"}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex min-h-[2.625rem] flex-[1.2] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
          >
            {lang === "es" ? "Aplicar filtros" : "Apply filters"}
          </button>
        </div>
      </div>
    </>
  );
}
