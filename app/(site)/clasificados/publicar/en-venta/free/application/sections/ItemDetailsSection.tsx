"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Especificaciones (opcional)",
    desc: "Solo si aplica: no repitas aquí el desgaste o la condición — eso va en «Condición y uso».",
    extra: "Detalles técnicos / especificaciones",
    extraHelp:
      "Agrega detalles útiles que ayuden al comprador a confirmar compatibilidad, medidas, modelo exacto, versión, materiales, número de serie parcial, accesorios especiales u otra información importante.",
    extraPlaceholder:
      "Ej. medidas, compatibilidad, versión, modelo exacto, material, detalles técnicos u otra información importante.",
  },
  en: {
    title: "Specs (optional)",
    desc: "Only if useful: don’t repeat wear or condition here — that belongs in Condition & wear.",
    extra: "Technical details / specifications",
    extraHelp:
      "Add helpful details that help buyers confirm compatibility, measurements, exact model, version, materials, partial serial number, special accessories, or other important information.",
    extraPlaceholder:
      "Ex. measurements, compatibility, version, exact model, material, technical details, or other important information.",
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
        <p className="mt-1 text-xs text-[#111111]/60">{t.extraHelp}</p>
        <textarea
          className={`${inputClass} mt-2 min-h-[96px]`}
          value={state.itemExtraDetails}
          placeholder={t.extraPlaceholder}
          onChange={(e) => setState((s) => ({ ...s, itemExtraDetails: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
