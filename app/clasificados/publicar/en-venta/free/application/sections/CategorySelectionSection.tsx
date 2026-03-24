"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import {
  EN_VENTA_DEPARTMENTS,
  EN_VENTA_PUBLISH_CONDITION_OPTIONS,
  getArticulosForDepartment,
} from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";
import { getSubcategoriesForDept } from "@/app/clasificados/en-venta/taxonomy/subcategories";
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
    sub: "Clasificación (subcategoría)",
    item: "Tipo de artículo",
    cond: "Condición",
    hints: [
      "Elige el departamento que mejor describe tu artículo.",
      "Refina la vitrina: elige una clasificación opcional.",
      "Elige el tipo de artículo que mejor coincide con lo que vendes.",
      "Selecciona el estado real del artículo para evitar malos entendidos.",
    ],
  },
  en: {
    title: "Category & item",
    desc: "Helps buyers find your listing faster.",
    dept: "Department",
    sub: "Shelf / subcategory",
    item: "Item type",
    cond: "Condition",
    hints: [
      "Pick the department that best matches your item.",
      "Optional: narrow the shelf / subcategory.",
      "Choose the item type that matches what you’re selling.",
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
  const subs = state.rama ? getSubcategoriesForDept(state.rama) : [];
  const articles = state.rama ? getArticulosForDepartment(state.rama) : [];

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <label className={labelClass}>{t.dept}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.hints[0]}</p>
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
        <label className={labelClass}>{t.sub}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.hints[1]}</p>
        <select
          className={cx(inputClass, "mt-2")}
          value={state.evSub}
          disabled={!state.rama}
          onChange={(e) => setState((s) => ({ ...s, evSub: e.target.value }))}
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
        <label className={labelClass}>{t.cond}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.hints[3]}</p>
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
