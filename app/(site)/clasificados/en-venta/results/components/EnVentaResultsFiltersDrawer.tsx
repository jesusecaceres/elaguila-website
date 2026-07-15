"use client";

import { useEffect, useState } from "react";
import type { EnVentaSubcategoryDef } from "../../taxonomy/subcategories";
import { EN_VENTA_SORT_OPTIONS } from "../../filters/enVentaFilterGroups";
import { US_STATE_OPTIONS } from "../../shared/constants/enVentaLocationContract";
import { EnVentaItemTypeFilterSelect } from "../../shared/components/EnVentaItemTypeFilterSelect";
import {
  CAT_STD_FILTER_CHIP,
  CAT_STD_FILTER_CHIP_GRID,
  CAT_STD_FILTER_SECTION_HEADING,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";

type Lang = "es" | "en";
type SortId = "newest" | "price-asc" | "price-desc";

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
  city: string;
  state: string;
  zip: string;
  country: string;
  itemType: string;
  sort: SortId;
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
  hasPhotoOnly: boolean;
  hasVideoOnly: boolean;
  deptOptions: FilterOption[];
  condOptions: FilterOption[];
  subOptions: EnVentaSubcategoryDef[];
  geoHint: string | null;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  onUseMyLocation: () => void;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className={`mt-5 first:mt-0 ${CAT_STD_FILTER_SECTION_HEADING}`}>{children}</p>;
}

function ChipCheckbox({
  name,
  defaultChecked,
  value,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  value?: string;
  label: string;
}) {
  return (
    <label className={CAT_STD_FILTER_CHIP}>
      <input
        form="ev-results-form"
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-4 w-4 shrink-0 rounded border-[#DCCAA0]"
      />
      <span>{label}</span>
    </label>
  );
}

export function EnVentaResultsFiltersDrawer({
  open,
  lang,
  t,
  city,
  state,
  zip,
  country,
  itemType,
  sort,
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
  hasPhotoOnly,
  hasVideoOnly,
  deptOptions,
  condOptions,
  subOptions,
  geoHint,
  onClose,
  onApply,
  onClear,
  onUseMyLocation,
}: Props) {
  const [draftDept, setDraftDept] = useState(evDept);
  const [draftSub, setDraftSub] = useState(evSub);
  const [draftItemType, setDraftItemType] = useState(itemType);

  useEffect(() => {
    if (!open) return;
    setDraftDept(evDept);
    setDraftSub(evSub);
    setDraftItemType(itemType);
  }, [open, evDept, evSub, itemType]);

  if (!open) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-[60] bg-black/40" aria-label={t.close} onClick={onClose} />
      <div
        className={
          "fixed z-[61] flex flex-col overflow-hidden border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_-12px_48px_-16px_rgba(42,36,22,0.28)] " +
          "inset-x-0 bottom-0 top-[12vh] rounded-t-2xl max-lg:max-h-[88vh] " +
          "lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-full lg:max-w-[440px] lg:rounded-none lg:rounded-l-2xl"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="enventa-results-filters-title"
      >
        <div className="flex items-center justify-between border-b border-[#E8DFD0]/80 px-4 py-3">
          <h2 id="enventa-results-filters-title" className="font-serif text-sm font-bold text-[#2A4536]">
            {t.filters}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#D6C7AD] px-3 py-1 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]">
            {t.close}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <SectionHeading>{lang === "es" ? "¿Qué artículo?" : "What item?"}</SectionHeading>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346] sm:col-span-2">
              {t.dept}
              <select
                form="ev-results-form"
                name="evDept"
                value={draftDept}
                onChange={(e) => {
                  setDraftDept(e.target.value);
                  setDraftSub("");
                  setDraftItemType("");
                }}
                className={fieldClass}
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
                value={draftSub}
                onChange={(e) => {
                  setDraftSub(e.target.value);
                  setDraftItemType("");
                }}
                className={fieldClass}
              >
                <option value="">{t.all}</option>
                {subOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label[lang]}</option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {lang === "es" ? "Tipo de artículo" : "Item type"}
              <EnVentaItemTypeFilterSelect
                lang={lang}
                evDept={draftDept}
                evSub={draftSub}
                value={draftItemType}
                onChange={setDraftItemType}
                form="ev-results-form"
                className={fieldClass}
              />
            </label>
          </div>

          <SectionHeading>{lang === "es" ? "¿Dónde?" : "Where?"}</SectionHeading>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346] sm:col-span-2">
              {lang === "es" ? "Ciudad" : "City"}
              <input form="ev-results-form" name="city" defaultValue={city} autoComplete="address-level2" className={fieldClass} />
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {lang === "es" ? "Estado" : "State"}
              <select form="ev-results-form" name="state" defaultValue={state || "CA"} className={fieldClass}>
                {US_STATE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              ZIP
              <input form="ev-results-form" name="zip" defaultValue={zip} inputMode="numeric" maxLength={5} autoComplete="postal-code" className={fieldClass} />
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346] sm:col-span-2">
              {lang === "es" ? "País" : "Country"}
              <input form="ev-results-form" name="country" defaultValue={country || "United States"} autoComplete="country-name" className={fieldClass} />
            </label>
          </div>
          <button type="button" onClick={onUseMyLocation} className="mt-3 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]">
            {t.useLocation}
          </button>
          {geoHint ? <p className="mt-2 text-xs text-[#8B4513]">{geoHint}</p> : null}

          <SectionHeading>{lang === "es" ? "¿Presupuesto?" : "Budget?"}</SectionHeading>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {t.priceMin}
              <input form="ev-results-form" name="priceMin" defaultValue={priceMin} inputMode="numeric" className={fieldClass} />
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
              {t.priceMax}
              <input form="ev-results-form" name="priceMax" defaultValue={priceMax} inputMode="numeric" className={fieldClass} />
            </label>
          </div>

          <SectionHeading>{lang === "es" ? "¿Condición?" : "Condition?"}</SectionHeading>
          <label className="mt-3 block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
            {lang === "es" ? "Condición" : "Condition"}
            <select form="ev-results-form" name="cond" defaultValue={cond} className={fieldClass}>
              <option value="">{t.all}</option>
              {condOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <SectionHeading>{lang === "es" ? "¿Vendedor y entrega?" : "Seller & delivery?"}</SectionHeading>
          <label className="mt-3 block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
            {t.seller}
            <select form="ev-results-form" name="seller" defaultValue={seller} className={fieldClass}>
              <option value="">{t.all}</option>
              <option value="individual">{t.ind}</option>
              <option value="business">{t.biz}</option>
            </select>
          </label>
          <div className={`mt-3 ${CAT_STD_FILTER_CHIP_GRID}`}>
            <ChipCheckbox name="pickup" defaultChecked={pickup} label={lang === "es" ? "Recogida" : "Pickup"} />
            <ChipCheckbox name="ship" defaultChecked={ship} label={lang === "es" ? "Envío" : "Shipping"} />
            <ChipCheckbox name="delivery" defaultChecked={delivery} label={lang === "es" ? "Entrega local" : "Local delivery"} />
            <ChipCheckbox name="meetupFilter" value="1" defaultChecked={meetupOnly} label={t.meetupOnly} />
            <ChipCheckbox name="free" value="1" defaultChecked={freeOnly} label={t.freeOnly} />
            <ChipCheckbox name="nego" value="1" defaultChecked={negotiableOnly} label={t.negoOnly} />
          </div>

          <SectionHeading>{lang === "es" ? "¿Medios?" : "Media?"}</SectionHeading>
          <div className={`mt-3 ${CAT_STD_FILTER_CHIP_GRID}`}>
            <ChipCheckbox name="hasPhoto" value="1" defaultChecked={hasPhotoOnly} label={lang === "es" ? "Con foto" : "Has photo"} />
            <ChipCheckbox name="hasVideo" value="1" defaultChecked={hasVideoOnly} label={lang === "es" ? "Con video" : "Has video"} />
            <ChipCheckbox name="featured" value="1" defaultChecked={featuredOnly} label={t.featuredMode} />
          </div>

          <SectionHeading>{lang === "es" ? "¿Cómo ordenar?" : "Sort results?"}</SectionHeading>
          <select form="ev-results-form" name="sort" defaultValue={sort} className={`${fieldClass} mt-3`}>
            {EN_VENTA_SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label[lang]}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] p-4">
          <button type="button" onClick={onClear} className="inline-flex min-h-[2.625rem] flex-1 items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF]">
            {t.clearFilters}
          </button>
          <button type="button" className="inline-flex min-h-[2.625rem] flex-[1.2] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]" onClick={onApply}>
            {t.applyFilters}
          </button>
        </div>
      </div>
    </>
  );
}
