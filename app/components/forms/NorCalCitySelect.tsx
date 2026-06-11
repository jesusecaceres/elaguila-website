"use client";

import type { LeadLang } from "@/app/lib/leonix/leadCaptureValidation";
import {
  getNorCalCityOptions,
  getNorCalCityPlaceholder,
  NORCAL_OTHER_VALUE,
} from "@/app/lib/leonix/norCalCities";

type NorCalCitySelectProps = {
  lang: LeadLang;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
};

export function NorCalCitySelect({
  lang,
  value,
  onChange,
  disabled,
  className,
  name,
  id,
}: NorCalCitySelectProps) {
  const options = getNorCalCityOptions(lang);
  const placeholder = getNorCalCityPlaceholder(lang);

  return (
    <select
      id={id}
      name={name}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      autoComplete="address-level2"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export { NORCAL_OTHER_VALUE };
