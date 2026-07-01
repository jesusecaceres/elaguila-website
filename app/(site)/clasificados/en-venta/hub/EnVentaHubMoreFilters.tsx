"use client";

import { useEffect, useState } from "react";
import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { enVentaConditionFilterOptions, EN_VENTA_SORT_OPTIONS } from "../filters/enVentaFilterGroups";
import { US_STATE_OPTIONS } from "../shared/constants/enVentaLocationContract";
import { EV_BTN_SECONDARY } from "../shared/styles/enVentaLeonixPublicUi";

type Lang = "es" | "en";

const COPY = {
  es: {
    open: "Filtros",
    title: "Filtros",
    close: "Cerrar",
    apply: "Aplicar filtros",
    clear: "Limpiar filtros",
    dept: "Departamento",
    sub: "Subcategoría",
    itemType: "Tipo de artículo",
    cond: "Condición",
    priceMin: "Precio mín.",
    priceMax: "Precio máx.",
    seller: "Vendedor",
    sellerAny: "Cualquiera",
    sellerInd: "Particular",
    sellerBiz: "Negocio",
    pickup: "Recogida local",
    ship: "Envío disponible",
    delivery: "Entrega local",
    meetup: "Encuentro",
    free: "Gratis / regalo",
    nego: "Negociable",
    any: "Todas",
    groupLocation: "Ubicación",
    city: "Ciudad",
    state: "Estado",
    zip: "ZIP",
    country: "País",
    groupCategory: "Categoría",
    groupPrice: "Precio",
    groupCondition: "Condición",
    groupSeller: "Vendedor y entrega",
    groupMedia: "Medios",
    hasPhoto: "Con foto",
    hasVideo: "Con video",
    sort: "Ordenar",
  },
  en: {
    open: "Filters",
    title: "Filters",
    close: "Close",
    apply: "Apply filters",
    clear: "Clear filters",
    dept: "Department",
    sub: "Subcategory",
    itemType: "Item type",
    cond: "Condition",
    priceMin: "Min price",
    priceMax: "Max price",
    seller: "Seller",
    sellerAny: "Any",
    sellerInd: "Individual",
    sellerBiz: "Business",
    pickup: "Local pickup",
    ship: "Shipping available",
    delivery: "Local delivery",
    meetup: "Meetup",
    free: "Free / gift",
    nego: "Negotiable",
    any: "All",
    groupLocation: "Location",
    city: "City",
    state: "State",
    zip: "ZIP",
    country: "Country",
    groupCategory: "Category",
    groupPrice: "Price",
    groupCondition: "Condition",
    groupSeller: "Seller & fulfillment",
    groupMedia: "Media",
    hasPhoto: "Has photo",
    hasVideo: "Has video",
    sort: "Sort",
  },
} as const;

type Props = {
  lang: Lang;
  routeLang: string;
};

export function EnVentaHubMoreFilters({ lang, routeLang }: Props) {
  const t = COPY[lang];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const condOptions = enVentaConditionFilterOptions(lang);
  const fieldClass =
    "mt-1 w-full min-h-[2.625rem] rounded-lg border border-[#D6C7AD]/90 bg-white px-3 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={EV_BTN_SECONDARY}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {t.open}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/40"
            aria-label={t.close}
            onClick={() => setOpen(false)}
          />
          <div
            className={
              "fixed z-[71] flex flex-col overflow-hidden border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-xl " +
              "inset-x-0 bottom-0 top-[12vh] rounded-t-2xl max-lg:max-h-[88vh] " +
              "lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-full lg:max-w-[400px] lg:rounded-none lg:rounded-l-2xl"
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="enventa-hub-more-filters-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#D6C7AD]/60 px-4 py-3">
              <h2 id="enventa-hub-more-filters-title" className="font-serif text-base font-bold text-[#2A4536]">
                {t.title}
              </h2>
              <button
                type="button"
                className="rounded-lg border border-[#C9A84A]/45 px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
                onClick={() => setOpen(false)}
              >
                {t.close}
              </button>
            </div>

            <form action="/clasificados/en-venta/results" method="get" className="flex min-h-0 flex-1 flex-col">
              <input type="hidden" name="lang" value={routeLang} />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.groupLocation}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-[#3D3428] sm:col-span-2">
                    {t.city}
                    <input name="city" type="text" className={fieldClass} autoComplete="address-level2" />
                  </label>
                  <label className="block text-xs font-semibold text-[#3D3428]">
                    {t.state}
                    <select name="state" defaultValue="CA" className={fieldClass}>
                      {US_STATE_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.code}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-[#3D3428]">
                    {t.zip}
                    <input
                      name="zip"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      className={fieldClass}
                      autoComplete="postal-code"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#3D3428] sm:col-span-2">
                    {t.country}
                    <input
                      name="country"
                      type="text"
                      defaultValue="United States"
                      className={fieldClass}
                      autoComplete="country-name"
                    />
                  </label>
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.groupCategory}</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-semibold text-[#3D3428]">
                    {t.dept}
                    <select name="evDept" className={fieldClass} defaultValue="">
                      <option value="">{t.any}</option>
                      {EN_VENTA_DEPARTMENTS.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label[lang]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-[#3D3428]">
                    {t.itemType}
                    <input name="itemType" type="text" className={fieldClass} />
                  </label>
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.groupPrice}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-[#3D3428]">
                    {t.priceMin}
                    <input name="priceMin" type="number" min={0} step="1" className={fieldClass} />
                  </label>
                  <label className="block text-xs font-semibold text-[#3D3428]">
                    {t.priceMax}
                    <input name="priceMax" type="number" min={0} step="1" className={fieldClass} />
                  </label>
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.groupCondition}</p>
                <label className="mt-3 block text-xs font-semibold text-[#3D3428]">
                  {t.cond}
                  <select name="cond" className={fieldClass} defaultValue="">
                    <option value="">{t.any}</option>
                    {condOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.groupSeller}</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-semibold text-[#3D3428]">
                    {t.seller}
                    <select name="seller" className={fieldClass} defaultValue="">
                      <option value="">{t.sellerAny}</option>
                      <option value="individual">{t.sellerInd}</option>
                      <option value="business">{t.sellerBiz}</option>
                    </select>
                  </label>
                  <fieldset className="space-y-2">
                    {[
                      { name: "pickup", label: t.pickup },
                      { name: "ship", label: t.ship },
                      { name: "delivery", label: t.delivery },
                      { name: "meetup", label: t.meetup },
                      { name: "free", label: t.free },
                      { name: "nego", label: t.nego },
                    ].map((item) => (
                      <label key={item.name} className="flex items-center gap-2 text-sm text-[#3D3428]">
                        <input type="checkbox" name={item.name} value="1" className="rounded border-[#D6C7AD]" />
                        {item.label}
                      </label>
                    ))}
                  </fieldset>
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.groupMedia}</p>
                <fieldset className="mt-3 flex flex-wrap gap-3 text-sm text-[#3D3428]">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="hasPhoto" value="1" className="rounded border-[#D6C7AD]" />
                    {t.hasPhoto}
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="hasVideo" value="1" className="rounded border-[#D6C7AD]" />
                    {t.hasVideo}
                  </label>
                </fieldset>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.sort}</p>
                <select name="sort" defaultValue="newest" className={`${fieldClass} mt-3`}>
                  {EN_VENTA_SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label[lang]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] p-4">
                <LinkClear
                  href={`/clasificados/en-venta/results?lang=${routeLang}`}
                  label={t.clear}
                  onNavigate={() => setOpen(false)}
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[2.625rem] flex-[1.2] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
                >
                  {t.apply}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </>
  );
}

function LinkClear({ href, label, onNavigate }: { href: string; label: string; onNavigate: () => void }) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      className="inline-flex min-h-[2.625rem] flex-1 items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
    >
      {label}
    </a>
  );
}
