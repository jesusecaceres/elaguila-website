"use client";

import type { EnVentaSubcategoryDef } from "../../taxonomy/subcategories";

type Lang = "es" | "en";

type FilterOption = { value: string; label: string };

type DrawerCopy = {
  filters: string;
  close: string;
  groupRefine: string;
  refineIntro: string;
  dept: string;
  sub: string;
  seller: string;
  all: string;
  ind: string;
  biz: string;
  priceMin: string;
  priceMax: string;
  freeOnly: string;
  negoOnly: string;
  meetupOnly: string;
  featuredMode: string;
  useLocation: string;
  applyFilters: string;
  clearFilters: string;
};

type Props = {
  open: boolean;
  lang: Lang;
  t: DrawerCopy;
  evDept: string;
  evSub: string;
  cond: string;
  seller: string;
  priceMin: string;
  priceMax: string;
  pickup: boolean;
  ship: boolean;
  delivery: boolean;
  freeOnly: boolean;
  negotiableOnly: boolean;
  meetupOnly: boolean;
  featuredOnly: boolean;
  deptOptions: FilterOption[];
  condOptions: FilterOption[];
  subOptions: EnVentaSubcategoryDef[];
  geoHint: string | null;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  onUseMyLocation: () => void;
};

export function EnVentaResultsFiltersDrawer({
  open,
  lang,
  t,
  evDept,
  evSub,
  cond,
  seller,
  priceMin,
  priceMax,
  pickup,
  ship,
  delivery,
  freeOnly,
  negotiableOnly,
  meetupOnly,
  featuredOnly,
  deptOptions,
  condOptions,
  subOptions,
  geoHint,
  onClose,
  onApply,
  onClear,
  onUseMyLocation,
}: Props) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40"
        aria-label={t.close}
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
        aria-labelledby="enventa-results-filters-title"
      >
        <div className="flex items-center justify-between border-b border-[#E8DFD0]/80 px-4 py-3">
          <h2 id="enventa-results-filters-title" className="font-serif text-sm font-bold text-[#2A4536]">
            {t.filters}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#D6C7AD] px-3 py-1 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
          >
            {t.close}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{t.groupRefine}</p>
          <p className="mt-1 text-xs text-[#3D3428]">{t.refineIntro}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {t.dept}
              <select
                form="ev-results-form"
                name="evDept"
                defaultValue={evDept}
                className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]"
              >
                <option value="">{t.all}</option>
                {deptOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {t.sub}
              <select
                form="ev-results-form"
                name="evSub"
                defaultValue={evSub}
                className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]"
              >
                <option value="">{t.all}</option>
                {subOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label[lang]}</option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {lang === "es" ? "Condición" : "Condition"}
              <select
                form="ev-results-form"
                name="cond"
                defaultValue={cond}
                className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]"
              >
                <option value="">{t.all}</option>
                {condOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {t.seller}
              <select
                form="ev-results-form"
                name="seller"
                defaultValue={seller}
                className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]"
              >
                <option value="">{t.all}</option>
                <option value="individual">{t.ind}</option>
                <option value="business">{t.biz}</option>
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {t.priceMin}
              <input
                form="ev-results-form"
                name="priceMin"
                defaultValue={priceMin}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {t.priceMax}
              <input
                form="ev-results-form"
                name="priceMax"
                defaultValue={priceMax}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <fieldset className="mt-4 border-t border-[#E8DFD0]/80 pt-4">
            <legend className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">
              {lang === "es" ? "Entrega y precio" : "Fulfillment & price"}
            </legend>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#3D3428]">
              <label className="inline-flex items-center gap-2">
                <input form="ev-results-form" type="checkbox" name="pickup" defaultChecked={pickup} className="rounded border-[#DCCAA0]" />
                {lang === "es" ? "Recogida" : "Pickup"}
              </label>
              <label className="inline-flex items-center gap-2">
                <input form="ev-results-form" type="checkbox" name="ship" defaultChecked={ship} className="rounded border-[#DCCAA0]" />
                {lang === "es" ? "Envío" : "Shipping"}
              </label>
              <label className="inline-flex items-center gap-2">
                <input form="ev-results-form" type="checkbox" name="delivery" defaultChecked={delivery} className="rounded border-[#DCCAA0]" />
                {lang === "es" ? "Entrega local" : "Local delivery"}
              </label>
              <label className="inline-flex items-center gap-2">
                <input form="ev-results-form" type="checkbox" name="free" value="1" defaultChecked={freeOnly} className="rounded border-[#DCCAA0]" />
                {t.freeOnly}
              </label>
              <label className="inline-flex items-center gap-2">
                <input form="ev-results-form" type="checkbox" name="nego" value="1" defaultChecked={negotiableOnly} className="rounded border-[#DCCAA0]" />
                {t.negoOnly}
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  form="ev-results-form"
                  type="checkbox"
                  name="meetupFilter"
                  value="1"
                  defaultChecked={meetupOnly}
                  className="rounded border-[#DCCAA0]"
                />
                {t.meetupOnly}
              </label>
              <label className="inline-flex w-full items-center gap-2 border-t border-[#E8DFD0]/60 pt-3">
                <input form="ev-results-form" type="checkbox" name="featured" value="1" defaultChecked={featuredOnly} className="rounded border-[#DCCAA0]" />
                <span>{t.featuredMode}</span>
              </label>
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E8DFD0]/70 pt-3">
            <button
              type="button"
              onClick={onUseMyLocation}
              className="rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
            >
              {t.useLocation}
            </button>
            {geoHint ? <span className="text-xs text-[#8B4513]">{geoHint}</span> : null}
          </div>
        </div>
        <div className="flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] p-4">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-[2.625rem] flex-1 items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
          >
            {t.clearFilters}
          </button>
          <button
            type="button"
            className="inline-flex min-h-[2.625rem] flex-[1.2] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
            onClick={onApply}
          >
            {t.applyFilters}
          </button>
        </div>
      </div>
    </>
  );
}
