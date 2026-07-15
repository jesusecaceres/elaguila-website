"use client";

import { EN_VENTA_SUBCATEGORY_ROWS } from "../../taxonomy/subcategories";
import {
  enVentaConditionFilterOptions,
  enVentaDepartmentFilterOptions,
} from "../../filters/enVentaFilterGroups";
import type { EnVentaDrawerFilterState } from "../enVentaBrowseParams";
import { EnVentaItemTypeFilterSelect } from "./EnVentaItemTypeFilterSelect";
import { CAT_STD_FILTER_CHIP_GRID } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";

const fieldClass =
  "mt-1 w-full min-w-0 rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2 text-sm text-[#2C2416] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35";

type Props = {
  lang: "es" | "en";
  values: EnVentaDrawerFilterState;
  onChange: (patch: Partial<EnVentaDrawerFilterState>) => void;
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 border-t border-[#E8DFD0]/80 pt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F] first:mt-0 first:border-t-0 first:pt-0">
      {children}
    </p>
  );
}

function ChipToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-[2.25rem] cursor-pointer items-center gap-2 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-[#DCCAA0]"
      />
      <span>{label}</span>
    </label>
  );
}

export function EnVentaLandingDrawerFields({ lang, values, onChange }: Props) {
  const deptOptions = enVentaDepartmentFilterOptions(lang);
  const condOptions = enVentaConditionFilterOptions(lang);
  const subOptions = EN_VENTA_SUBCATEGORY_ROWS.filter((r) => !values.evDept || r.dept === values.evDept);
  const allLabel = lang === "es" ? "Todos" : "All";

  return (
    <>
      <SectionHeading>{lang === "es" ? "¿Qué artículo?" : "What item?"}</SectionHeading>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346] sm:col-span-2">
          {lang === "es" ? "Departamento" : "Department"}
          <select
            value={values.evDept}
            onChange={(e) => onChange({ evDept: e.target.value, evSub: "", itemType: "" })}
            className={fieldClass}
          >
            <option value="">{allLabel}</option>
            {deptOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
          {lang === "es" ? "Subcategoría" : "Subcategory"}
          <select
            value={values.evSub}
            onChange={(e) => onChange({ evSub: e.target.value, itemType: "" })}
            className={fieldClass}
          >
            <option value="">{allLabel}</option>
            {subOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label[lang]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
          {lang === "es" ? "Tipo de artículo" : "Item type"}
          <EnVentaItemTypeFilterSelect
            lang={lang}
            evDept={values.evDept}
            evSub={values.evSub}
            value={values.itemType}
            onChange={(itemType) => onChange({ itemType })}
            className={fieldClass}
          />
        </label>
      </div>

      <SectionHeading>{lang === "es" ? "¿Presupuesto?" : "Budget?"}</SectionHeading>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
          {lang === "es" ? "Precio mínimo" : "Min price"}
          <input
            value={values.priceMin}
            onChange={(e) => onChange({ priceMin: e.target.value })}
            inputMode="numeric"
            className={fieldClass}
          />
        </label>
        <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
          {lang === "es" ? "Precio máximo" : "Max price"}
          <input
            value={values.priceMax}
            onChange={(e) => onChange({ priceMax: e.target.value })}
            inputMode="numeric"
            className={fieldClass}
          />
        </label>
      </div>

      <SectionHeading>{lang === "es" ? "¿Condición?" : "Condition?"}</SectionHeading>
      <label className="mt-3 block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
        {lang === "es" ? "Condición" : "Condition"}
        <select value={values.cond} onChange={(e) => onChange({ cond: e.target.value })} className={fieldClass}>
          <option value="">{allLabel}</option>
          {condOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <SectionHeading>{lang === "es" ? "¿Vendedor y entrega?" : "Seller & delivery?"}</SectionHeading>
      <label className="mt-3 block text-left text-[11px] font-semibold uppercase tracking-wide text-[#5C5346]">
        {lang === "es" ? "Vendedor" : "Seller"}
        <select value={values.seller} onChange={(e) => onChange({ seller: e.target.value })} className={fieldClass}>
          <option value="">{allLabel}</option>
          <option value="individual">{lang === "es" ? "Particular" : "Individual"}</option>
          <option value="business">{lang === "es" ? "Negocio" : "Business"}</option>
        </select>
      </label>
      <div className={`mt-3 ${CAT_STD_FILTER_CHIP_GRID}`}>
        <ChipToggle
          checked={values.pickup}
          label={lang === "es" ? "Recogida" : "Pickup"}
          onChange={(v) => onChange({ pickup: v })}
        />
        <ChipToggle
          checked={values.ship}
          label={lang === "es" ? "Envío" : "Shipping"}
          onChange={(v) => onChange({ ship: v })}
        />
        <ChipToggle
          checked={values.delivery}
          label={lang === "es" ? "Entrega local" : "Local delivery"}
          onChange={(v) => onChange({ delivery: v })}
        />
        <ChipToggle
          checked={values.meetup}
          label={lang === "es" ? "Punto de encuentro" : "Meetup"}
          onChange={(v) => onChange({ meetup: v })}
        />
        <ChipToggle
          checked={values.free}
          label={lang === "es" ? "Gratis/regalo" : "Free / gift"}
          onChange={(v) => onChange({ free: v })}
        />
        <ChipToggle
          checked={values.nego}
          label={lang === "es" ? "Negociable" : "Negotiable"}
          onChange={(v) => onChange({ nego: v })}
        />
      </div>

      <SectionHeading>{lang === "es" ? "¿Medios?" : "Media?"}</SectionHeading>
      <div className={`mt-3 ${CAT_STD_FILTER_CHIP_GRID}`}>
        <ChipToggle
          checked={values.hasPhoto}
          label={lang === "es" ? "Solo con foto" : "Has photo"}
          onChange={(v) => onChange({ hasPhoto: v })}
        />
        <ChipToggle
          checked={values.hasVideo}
          label={lang === "es" ? "Con video" : "Has video"}
          onChange={(v) => onChange({ hasVideo: v })}
        />
        <ChipToggle
          checked={values.featured}
          label={lang === "es" ? "Destacado" : "Featured"}
          onChange={(v) => onChange({ featured: v })}
        />
      </div>
    </>
  );
}
