"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Detalles del artículo",
    desc: "Detalles específicos según categoría (extensible con la taxonomía).",
    cond: "Detalle de condición",
    condH: "Menciona imperfecciones visibles.",
    extra: "Detalles adicionales",
    extraH: "Especificaciones, medidas, compatibilidad…",
  },
  en: {
    title: "Item details",
    desc: "Category-specific details (extensible via taxonomy).",
    cond: "Condition detail",
    condH: "Call out visible imperfections.",
    extra: "Additional details",
    extraH: "Specs, measurements, compatibility…",
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
        <label className={labelClass}>{t.cond}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.condH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[80px]`}
          value={state.conditionDetails}
          onChange={(e) => setState((s) => ({ ...s, conditionDetails: e.target.value }))}
        />
      </div>
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
