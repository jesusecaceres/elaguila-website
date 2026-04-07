"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Especificaciones (opcional)",
    desc: "Solo si aplica: medidas, compatibilidad, modelo exacto, número de serie parcial, etc. No repitas aquí el desgaste o la condición — eso va en «Condición y uso».",
    extra: "Detalles técnicos / compatibilidad",
    extraH: "Ej: talla, voltaje, puertos, compatibilidad con…",
  },
  en: {
    title: "Specs (optional)",
    desc: "Only if useful: measurements, compatibility, exact model, partial serial, etc. Don’t repeat wear or condition here — that belongs in Condition & wear.",
    extra: "Technical / compatibility details",
    extraH: "e.g. size, voltage, ports, works with…",
  },
} as const;

export function ItemDetailsSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.extra}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.extraH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[96px]`}
          value={state.itemExtraDetails}
          onChange={(e) => setState((s) => ({ ...s, itemExtraDetails: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
