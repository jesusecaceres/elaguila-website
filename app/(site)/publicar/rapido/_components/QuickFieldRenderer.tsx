"use client";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import { qt, quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import type { QuickClassifiedFieldDefinition, QuickIntakeValue, QuickIntakeValues, QuickLang } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickFieldIsRequired, quickFieldOptions, quickList } from "@/app/lib/quickClassifieds/quickClassifiedValidation";
import { quickInput, quickLabel } from "./QuickShell";

type Props = {
  field: QuickClassifiedFieldDefinition;
  values: QuickIntakeValues;
  lang: QuickLang;
  onChange: (key: string, value: QuickIntakeValue) => void;
};

const INPUT_TYPES: Partial<Record<QuickClassifiedFieldDefinition["kind"], string>> = {
  text: "text",
  number: "text",
  currency: "text",
  zip: "text",
  phone: "tel",
  email: "email",
  date: "date",
  time: "time",
};

export function QuickFieldRenderer({ field, values, lang, onChange }: Props) {
  const label = qt(field.label, lang);
  const required = quickFieldIsRequired(field, values);
  const hint = field.hint ? qt(field.hint, lang) : null;
  const placeholder = field.placeholder ? qt(field.placeholder, lang) : undefined;
  const id = `qf-${field.key}`;
  const tag = (
    <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-[#9A8B6A]">
      {required ? quickCopy("required", lang) : quickCopy("optional", lang)}
    </span>
  );
  const raw = values[field.key];
  const str = typeof raw === "string" ? raw : "";

  if (field.kind === "toggle") {
    const on = raw === true;
    return (
      <label className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#D8C79A] bg-white px-3 py-2">
        <span className="text-sm font-semibold">{label}</span>
        <input type="checkbox" checked={on} onChange={(e) => onChange(field.key, e.target.checked)} className="h-6 w-6 accent-[#7A1E2C]" />
      </label>
    );
  }

  if (field.kind === "chips") {
    const options = quickFieldOptions(field, values);
    const single = field.maxSelections === 1;
    const selected = single ? (str ? [str] : []) : quickList(values, field.key);
    const toggle = (v: string) => {
      if (single) {
        onChange(field.key, selected[0] === v ? "" : v);
        return;
      }
      const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
      if (field.maxSelections && next.length > field.maxSelections) return;
      onChange(field.key, next);
    };
    return (
      <div>
        <span className={quickLabel}>
          {label}
          {tag}
        </span>
        {hint ? <p className="mt-0.5 text-xs text-[#7A7164]">{hint}</p> : null}
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={label}>
          {options.map((o) => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(o.value)}
                className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${
                  active ? "border-[#7A1E2C] bg-[#7A1E2C] text-white" : "border-[#D8C79A] bg-white text-[#3D2C12]"
                }`}
              >
                {qt(o.label, lang)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.kind === "select") {
    const options = quickFieldOptions(field, values);
    return (
      <div>
        <label htmlFor={id} className={quickLabel}>
          {label}
          {tag}
        </label>
        {hint ? <p className="mt-0.5 text-xs text-[#7A7164]">{hint}</p> : null}
        <select id={id} value={str} onChange={(e) => onChange(field.key, e.target.value)} className={quickInput}>
          <option value="">{lang === "en" ? "Select…" : "Selecciona…"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {qt(o.label, lang)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "city") {
    const canonical = field.cityMode !== "free";
    return (
      <div>
        <span className={quickLabel}>
          {label}
          {tag}
        </span>
        {hint ? <p className="mt-0.5 text-xs text-[#7A7164]">{hint}</p> : null}
        <div className="mt-1">
          <CityAutocomplete
            value={str}
            onChange={(v) => onChange(field.key, v)}
            lang={lang}
            placeholder={placeholder ?? (lang === "en" ? "City" : "Ciudad")}
            variant="light"
            freeText={!canonical}
            stripInvalidOnBlur={canonical}
          />
        </div>
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div>
        <label htmlFor={id} className={quickLabel}>
          {label}
          {tag}
        </label>
        {hint ? <p className="mt-0.5 text-xs text-[#7A7164]">{hint}</p> : null}
        <textarea
          id={id}
          value={str}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={placeholder}
          maxLength={field.maxLength}
          className={`${quickInput} min-h-[120px]`}
        />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className={quickLabel}>
        {label}
        {tag}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-[#7A7164]">{hint}</p> : null}
      <input
        id={id}
        type={INPUT_TYPES[field.kind] ?? "text"}
        value={str}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={placeholder}
        maxLength={field.maxLength}
        inputMode={field.inputMode}
        autoComplete={field.autoComplete}
        className={quickInput}
      />
    </div>
  );
}
