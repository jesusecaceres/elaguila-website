"use client";

import type { LeadLang } from "@/app/lib/leonix/leadCaptureValidation";
import { getGlobalLocationPlaceholder } from "@/app/lib/leonix/globalLocationFieldCopy";

type GlobalLocationInputProps = {
  lang: LeadLang;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export function GlobalLocationInput({
  lang,
  value,
  onChange,
  disabled,
  className,
  name,
  id,
  placeholder,
  "aria-label": ariaLabel,
}: GlobalLocationInputProps) {
  return (
    <input
      type="text"
      id={id}
      name={name}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder ?? getGlobalLocationPlaceholder(lang)}
      autoComplete="address-level2"
      maxLength={120}
      aria-label={ariaLabel}
    />
  );
}
