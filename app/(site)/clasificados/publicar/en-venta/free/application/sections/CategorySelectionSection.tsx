"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import {
  EN_VENTA_DEPARTMENTS,
  EN_VENTA_PUBLISH_CONDITION_OPTIONS,
  getItemTypesForSelection,
} from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";
import { getSubcategoriesForDept } from "@/app/clasificados/en-venta/taxonomy/subcategories";
import { useEnVentaDetailField } from "@/app/clasificados/en-venta/publish/EnVentaDetailFieldCopyContext";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { cx, inputClass, labelClass } from "../helpers/fieldCx";

const COPY: Record<
  EnVentaFreeSectionProps["lang"],
  {
    title: string;
    desc: string;
    dept: string;
    sub: string;
    item: string;
    cond: string;
    hints: [string, string, string, string];
  }
> = {
  es: {
    title: "Categoría y artículo",
    desc: "Así los compradores encuentran tu anuncio más rápido.",
    dept: "Departamento",
    sub: "Subcategoría (opcional)",
    item: "Tipo de artículo",
    cond: "Condición",
    hints: [
      "Primero elige el departamento que mejor describe tu artículo.",
      "Si quieres, refina con una subcategoría.",
      "Después selecciona el tipo exacto de artículo. Si no ves una opción exacta, elige «Otro».",
      "Selecciona el estado real del artículo para evitar malos entendidos.",
    ],
  },
  en: {
    title: "Category & item",
    desc: "Helps buyers find your listing faster.",
    dept: "Department",
    sub: "Subcategory (optional)",
    item: "Item type",
    cond: "Condition",
    hints: [
      "First, pick the department that best describes your item.",
      "Optionally narrow with a subcategory.",
      "Then pick the exact item type. If nothing fits, choose “Other”.",
      "Pick the real condition to avoid misunderstandings.",
    ],
  },
};

export function CategorySelectionSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  const ovRama = useEnVentaDetailField("rama");
  const ovEvSub = useEnVentaDetailField("evSub");
  const ovCond = useEnVentaDetailField("condition");
  const subs = state.rama ? getSubcategoriesForDept(state.rama) : [];
  const articles = state.rama ? getItemTypesForSelection(state.rama, state.evSub) : [];

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{ovRama?.label ?? t.dept}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{ovRama?.help ?? t.hints[0]}</p>
        <select
          className={cx(inputClass, "mt-2")}
          value={state.rama}
          onChange={(e) =>
            setState((s) => ({ ...s, rama: e.target.value, evSub: "", itemType: "" }))
          }
        >
          <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
          {EN_VENTA_DEPARTMENTS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label[lang]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>{ovEvSub?.label ?? t.sub}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{ovEvSub?.help ?? t.hints[1]}</p>
        <select
          className={cx(inputClass, "mt-2")}
          value={state.evSub}
          disabled={!state.rama}
          onChange={(e) =>
            setState((s) => {
              const nextSub = e.target.value;
              const opts = s.rama ? getItemTypesForSelection(s.rama, nextSub) : [];
              const keep = opts.some((o) => o.value === s.itemType);
              return { ...s, evSub: nextSub, itemType: keep ? s.itemType : "" };
            })
          }
        >
          <option value="">{lang === "es" ? "Opcional" : "Optional"}</option>
          {subs.map((s) => (
            <option key={`${s.dept}-${s.key}`} value={s.key}>
              {s.label[lang]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>{t.item}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.hints[2]}</p>
        <select
          className={cx(inputClass, "mt-2")}
          value={state.itemType}
          disabled={!state.rama}
          onChange={(e) => setState((s) => ({ ...s, itemType: e.target.value }))}
        >
          <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
          {articles.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label[lang]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>{ovCond?.label ?? t.cond}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{ovCond?.help ?? t.hints[3]}</p>
        <select
          className={cx(inputClass, "mt-2")}
          value={state.condition}
          onChange={(e) => setState((s) => ({ ...s, condition: e.target.value }))}
        >
          <option value="">{lang === "es" ? "Selecciona…" : "Choose…"}</option>
          {EN_VENTA_PUBLISH_CONDITION_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {lang === "es" ? c.labelEs : c.labelEn}
            </option>
          ))}
        </select>
      </div>
    </SectionShell>
  );
}
