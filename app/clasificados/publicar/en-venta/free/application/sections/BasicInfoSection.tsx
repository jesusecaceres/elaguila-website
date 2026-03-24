"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Información básica",
    desc: "Un buen título y descripción generan más contactos.",
    titleL: "Título del anuncio",
    titleH: "Escribe un título claro para que tu artículo se entienda rápido.",
    price: "Precio",
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
          <input
            className={`${inputClass} mt-2`}
            inputMode="decimal"
            value={state.price}
            onChange={(e) => setState((s) => ({ ...s, price: e.target.value }))}
          />
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
