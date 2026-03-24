"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";
import { formatPriceInputDisplay, normalizePriceForState } from "../helpers/priceInput";

const COPY = {
  es: {
    title: "Información básica",
    desc: "Un buen título y descripción generan más contactos.",
    titleL: "Título del anuncio",
    titleH: "Escribe un título claro para que tu artículo se entienda rápido.",
    price: "Precio",
    priceH: "Se muestra en pesos con separadores de miles; solo guardamos el valor numérico.",
    neg: "Precio negociable",
    qty: "Cantidad (si aplica)",
    brand: "Marca (opcional)",
    model: "Modelo (opcional)",
    descL: "Descripción",
    descH: "Incluye defectos reales y lo que incluye la venta.",
  },
  en: {
    title: "Basic item info",
    desc: "Clear title and description drive more replies.",
    titleL: "Listing title",
    titleH: "Use a clear title so buyers understand instantly.",
    price: "Price",
    priceH: "Shown with $ and comma grouping; we store the plain number only.",
    neg: "Negotiable price",
    qty: "Quantity (if relevant)",
    brand: "Brand (optional)",
    model: "Model (optional)",
    descL: "Description",
    descH: "Include real flaws and what’s included.",
  },
} as const;

export function BasicInfoSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.titleL}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.titleH}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.price}</label>
          <p className="mt-1 text-xs text-[#111111]/60">{t.priceH}</p>
          <div className="mt-2 flex overflow-hidden rounded-xl border border-black/15 bg-white focus-within:ring-2 focus-within:ring-[#A98C2A]/35">
            <span
              className="flex shrink-0 items-center border-r border-black/10 bg-[#F3F3F3] px-3 text-sm font-semibold text-[#111111]"
              aria-hidden
            >
              $
            </span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-[#111111] outline-none placeholder:text-[#111111]/40"
              inputMode="decimal"
              autoComplete="off"
              value={formatPriceInputDisplay(state.price)}
              onChange={(e) =>
                setState((s) => ({ ...s, price: normalizePriceForState(e.target.value) }))
              }
              placeholder={lang === "es" ? "0" : "0"}
              aria-label={t.price}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t.neg}</label>
          <select
            className={`${inputClass} mt-2`}
            value={state.negotiable}
            onChange={(e) =>
              setState((s) => ({ ...s, negotiable: e.target.value as "" | "yes" }))
            }
          >
            <option value="">{lang === "es" ? "No" : "No"}</option>
            <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.qty}</label>
          <input
            className={`${inputClass} mt-2`}
            inputMode="numeric"
            value={state.quantity}
            onChange={(e) => setState((s) => ({ ...s, quantity: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.brand}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.brand}
            onChange={(e) => setState((s) => ({ ...s, brand: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.model}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.model}
            onChange={(e) => setState((s) => ({ ...s, model: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.descL}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.descH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[120px]`}
          value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
