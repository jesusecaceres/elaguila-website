"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Condición y uso",
    desc: "La honestidad genera confianza. Aquí va el desgaste real y los defectos; la descripción general del artículo va arriba.",
    wear: "Desgaste / uso",
    wearH: "Describe rayones, batería, horas de uso, etc.",
    acc: "Accesorios incluidos (si aplica)",
    accH: "Solo si aplica: cargador, caja, manual, funda…",
  },
  en: {
    title: "Condition & wear",
    desc: "Honest detail builds trust. Put real wear and flaws here; the main pitch lives in Basic info.",
    wear: "Wear & usage",
    wearH: "Scratches, battery health, hours of use…",
    acc: "Included accessories (if any)",
    accH: "Only if relevant: charger, box, manual, case…",
  },
} as const;

export function ConditionSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.wear}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.wearH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[80px]`}
          value={state.wearNotes}
          onChange={(e) => setState((s) => ({ ...s, wearNotes: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.acc}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.accH}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[80px]`}
          value={state.accessoriesNotes}
          onChange={(e) => setState((s) => ({ ...s, accessoriesNotes: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
