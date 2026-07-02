"use client";

import {
  isOfertaLocalUnitedStatesCountry,
  OFERTA_LOCAL_DEFAULT_COUNTRY,
  OFERTA_LOCAL_US_STATE_SELECT_OPTIONS,
  resolveOfertaLocalUsStateInput,
} from "./ofertasLocalesLocationHelpers";
import { normalizeOfertaLocalPostalCodeInput } from "./ofertasLocalesFormatting";

type RegionStateInputProps = {
  country: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
  lang: "es" | "en";
  selectPlaceholder?: string;
  usPlaceholder?: string;
  intlPlaceholder?: string;
  maxLength?: number;
  id?: string;
  listId?: string;
};

export function OfertaLocalRegionStateInput({
  country,
  value,
  onChange,
  inputClassName,
  lang,
  selectPlaceholder = lang === "en" ? "Select…" : "Selecciona…",
  usPlaceholder = lang === "en" ? "Example: CA" : "Ej. CA",
  intlPlaceholder = lang === "en" ? "State / province / region" : "Estado / provincia / región",
  maxLength = 80,
  id,
  listId = "oferta-local-us-state-options",
}: RegionStateInputProps) {
  const usCountry = isOfertaLocalUnitedStatesCountry(country || OFERTA_LOCAL_DEFAULT_COUNTRY);

  if (usCountry) {
    return (
      <select
        id={id}
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="address-level1"
      >
        <option value="">{selectPlaceholder}</option>
        {OFERTA_LOCAL_US_STATE_SELECT_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={id}
      className={inputClassName}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        const resolved = resolveOfertaLocalUsStateInput(e.target.value);
        if (resolved !== e.target.value) onChange(resolved);
      }}
      maxLength={maxLength}
      placeholder={intlPlaceholder}
      autoComplete="address-level1"
      list={listId}
    />
  );
}

type PostalInputProps = {
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
};

export function OfertaLocalPostalInput({
  value,
  onChange,
  inputClassName,
  placeholder,
  id,
  "aria-label": ariaLabel,
}: PostalInputProps) {
  return (
    <input
      id={id}
      className={inputClassName}
      type="text"
      value={value}
      onChange={(e) => onChange(normalizeOfertaLocalPostalCodeInput(e.target.value))}
      inputMode="text"
      maxLength={20}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoComplete="postal-code"
    />
  );
}
