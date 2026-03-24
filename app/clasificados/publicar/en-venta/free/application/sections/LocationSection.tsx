"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Ubicación",
    desc: "Mostramos ciudad y zona aproximada; no publiques tu dirección exacta si no quieres.",
    city: "Ciudad",
    area: "Colonia / zona",
    zip: "ZIP (opcional)",
    approx: "Mostrar ubicación aproximada en el mapa",
  },
  en: {
    title: "Location",
    desc: "We show city and approximate area — don’t share exact address unless you want to.",
    city: "City",
    area: "Neighborhood / area",
    zip: "ZIP (optional)",
    approx: "Show approximate location on the map",
  },
} as const;

export function LocationSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.city}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.city}
          onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.area}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.neighborhood}
          onChange={(e) => setState((s) => ({ ...s, neighborhood: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.zip}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.zip}
          onChange={(e) => setState((s) => ({ ...s, zip: e.target.value }))}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
        <input
          type="checkbox"
          checked={state.approximateLocationOk}
          onChange={(e) =>
            setState((s) => ({ ...s, approximateLocationOk: e.target.checked }))
          }
        />
        {t.approx}
      </label>
    </SectionShell>
  );
}
