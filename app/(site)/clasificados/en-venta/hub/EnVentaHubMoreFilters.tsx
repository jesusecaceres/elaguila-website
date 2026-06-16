"use client";

import { useEffect, useState } from "react";
import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { enVentaConditionFilterOptions } from "../filters/enVentaFilterGroups";

type Lang = "es" | "en";

const COPY = {
  es: {
    open: "Más filtros",
    title: "Más filtros",
    close: "Cerrar",
    apply: "Ver resultados",
    dept: "Categoría",
    cond: "Condición",
    priceMin: "Precio mín.",
    priceMax: "Precio máx.",
    seller: "Vendedor",
    sellerAny: "Cualquiera",
    sellerInd: "Particular",
    sellerBiz: "Negocio",
    pickup: "Recogida",
    ship: "Envío",
    delivery: "Entrega local",
    meetup: "Encuentro",
    free: "Gratis / regalo",
    nego: "Negociable",
    any: "Todas",
  },
  en: {
    open: "More filters",
    title: "More filters",
    close: "Close",
    apply: "View results",
    dept: "Category",
    cond: "Condition",
    priceMin: "Min price",
    priceMax: "Max price",
    seller: "Seller",
    sellerAny: "Any",
    sellerInd: "Individual",
    sellerBiz: "Business",
    pickup: "Pickup",
    ship: "Shipping",
    delivery: "Local delivery",
    meetup: "Meetup",
    free: "Free / gift",
    nego: "Negotiable",
    any: "All",
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const condOptions = enVentaConditionFilterOptions(lang);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full border border-[#D4E0EA] bg-[#F5F8FB] px-4 text-[12px] font-semibold text-[#2F4A65] transition hover:bg-[#E8EEF3] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {t.open}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enventa-hub-more-filters-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="enventa-hub-more-filters-title" className="text-base font-bold text-[#1E1810]">
                {t.title}
              </h2>
              <button
                type="button"
                className="rounded-lg border border-black/10 px-3 py-1 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                onClick={() => setOpen(false)}
              >
                {t.close}
              </button>
            </div>

            <form action="/clasificados/en-venta/results" method="get" className="mt-4 space-y-4">
              <input type="hidden" name="lang" value={routeLang} />

              <label className="block text-xs font-semibold text-[#5C5346]">
                {t.dept}
                <select
                  name="evDept"
                  className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                  defaultValue=""
                >
                  <option value="">{t.any}</option>
                  {EN_VENTA_DEPARTMENTS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label[lang]}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-[#5C5346]">
                {t.cond}
                <select
                  name="cond"
                  className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                  defaultValue=""
                >
                  <option value="">{t.any}</option>
                  {condOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-[#5C5346]">
                  {t.priceMin}
                  <input
                    name="priceMin"
                    type="number"
                    min={0}
                    step="1"
                    className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-semibold text-[#5C5346]">
                  {t.priceMax}
                  <input
                    name="priceMax"
                    type="number"
                    min={0}
                    step="1"
                    className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-[#5C5346]">
                {t.seller}
                <select
                  name="seller"
                  className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-3 py-2 text-sm text-[#1E1810]"
                  defaultValue=""
                >
                  <option value="">{t.sellerAny}</option>
                  <option value="individual">{t.sellerInd}</option>
                  <option value="business">{t.sellerBiz}</option>
                </select>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-[#5C5346]">{lang === "es" ? "Entrega y precio" : "Fulfillment & price"}</legend>
                {[
                  { name: "pickup", label: t.pickup },
                  { name: "ship", label: t.ship },
                  { name: "delivery", label: t.delivery },
                  { name: "meetup", label: t.meetup },
                  { name: "free", label: t.free },
                  { name: "nego", label: t.nego },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-2 text-sm text-[#2C2416]">
                    <input type="checkbox" name={item.name} value="1" className="rounded border-[#DCCAA0]" />
                    {item.label}
                  </label>
                ))}
              </fieldset>

              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
              >
                {t.apply}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
