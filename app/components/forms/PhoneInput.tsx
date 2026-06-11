"use client";

import {
  formatUsPhone,
  onLeonixPhoneInputChange,
  stripPhoneDigits,
} from "@/app/lib/leonix/phoneFormat";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  onDigitsChange?: (digits: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
};

export function PhoneInput({
  value,
  onChange,
  onDigitsChange,
  disabled,
  className,
  placeholder,
  autoComplete = "tel",
  id,
  name,
  "aria-invalid": ariaInvalid,
}: PhoneInputProps) {
  const digits = stripPhoneDigits(value);

  return (
    <input
      id={id}
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete={autoComplete}
      disabled={disabled}
      value={formatUsPhone(value)}
      aria-invalid={ariaInvalid}
      maxLength={13}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        const next = onLeonixPhoneInputChange(e.target.value, digits);
        onChange(next.display);
        onDigitsChange?.(next.digits);
      }}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text");
        const next = onLeonixPhoneInputChange(pasted, digits);
        onChange(next.display);
        onDigitsChange?.(next.digits);
      }}
    />
  );
}
