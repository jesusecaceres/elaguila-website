"use client";

import { getItemTypesForSelection } from "../fields/enVentaTaxonomy";

type Props = {
  lang: "es" | "en";
  evDept: string;
  evSub: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  form?: string;
  name?: string;
  disabled?: boolean;
};

export function EnVentaItemTypeFilterSelect({
  lang,
  evDept,
  evSub,
  value,
  onChange,
  className,
  form,
  name = "itemType",
  disabled,
}: Props) {
  const options = evDept.trim() ? getItemTypesForSelection(evDept, evSub) : [];
  const allLabel = lang === "es" ? "Todos" : "All";
  const chooseLabel = lang === "es" ? "Selecciona departamento primero" : "Choose department first";

  return (
    <select
      form={form}
      name={name}
      value={value}
      disabled={disabled ?? !evDept.trim()}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      aria-label={lang === "es" ? "Tipo de artículo" : "Item type"}
    >
      <option value="">{evDept.trim() ? allLabel : chooseLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label[lang]}
        </option>
      ))}
    </select>
  );
}
