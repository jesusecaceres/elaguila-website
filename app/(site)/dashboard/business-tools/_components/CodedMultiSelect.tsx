"use client";

import { useMemo } from "react";
import { SearchableSelect } from "./SearchableSelect";

export type CodedOption = { value: string; label: string };

/**
 * Searchable "add" combobox + removable chip row for value/label pairs that must be validated
 * against a controlled list (ISO countries, state/province datasets) — ChipListInput's free-text
 * chips can't do this since it has no concept of a valid option set. Gate BCO-3R-B.3.
 */
export function CodedMultiSelect({
  id,
  label,
  options,
  selectedValues,
  onChange,
  addPlaceholder,
  noResultsLabel,
  removeLabel,
  countLabel,
  disabled,
}: {
  id?: string;
  label: string;
  options: readonly CodedOption[];
  selectedValues: readonly string[];
  onChange: (next: string[]) => void;
  addPlaceholder?: string;
  noResultsLabel: string;
  removeLabel: string;
  countLabel?: (n: number) => string;
  disabled?: boolean;
}) {
  const labelFor = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return (v: string) => map.get(v) ?? v;
  }, [options]);

  const addableOptions = useMemo(() => options.filter((o) => !selectedValues.includes(o.value)), [options, selectedValues]);

  function add(value: string) {
    if (!value || selectedValues.includes(value)) return;
    onChange([...selectedValues, value]);
  }
  function remove(value: string) {
    onChange(selectedValues.filter((v) => v !== value));
  }

  return (
    <div>
      <SearchableSelect
        id={id}
        label={label}
        options={addableOptions}
        value=""
        onSelect={add}
        placeholder={addPlaceholder}
        noResultsLabel={noResultsLabel}
        disabled={disabled}
      />
      {selectedValues.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedValues.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#3D3428]">
              {labelFor(v)}
              <button
                type="button"
                aria-label={`${removeLabel}: ${labelFor(v)}`}
                onClick={() => remove(v)}
                className="-m-1 min-h-[28px] min-w-[28px] rounded-full p-1 text-sm font-bold text-[#7A1E2C]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {countLabel ? (
        <p aria-live="polite" className="mt-1 text-xs text-[#7A7164]">
          {countLabel(selectedValues.length)}
        </p>
      ) : null}
    </div>
  );
}
