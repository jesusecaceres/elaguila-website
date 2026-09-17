"use client";

import { useId, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = { value: string; label: string };

/**
 * Accessible combobox (WAI-ARIA combobox-with-listbox pattern) — reused for country, business
 * language, additional-language, and specific-business-type selection instead of four bespoke
 * implementations. Single-select: callers building a multi-select chip list (e.g. additional
 * languages) call `onSelect` per pick and manage the chip array themselves.
 */
export function SearchableSelect({
  id,
  label,
  options,
  value,
  onSelect,
  placeholder,
  noResultsLabel,
  disabled,
}: {
  id?: string;
  label: string;
  options: readonly SearchableSelectOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  noResultsLabel: string;
  disabled?: boolean;
}) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listboxId = `${baseId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value) ?? null;
  const displayValue = open ? query : (selectedOption?.label ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !open) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, open]);

  function openList() {
    setOpen(true);
    setQuery("");
    setActiveIndex(-1);
  }

  function commit(opt: SearchableSelectOption) {
    onSelect(opt.value);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        commit(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={baseId} className="mb-1 block text-sm font-semibold text-[#3D3428]">
        {label}
      </label>
      <input
        ref={inputRef}
        id={baseId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onFocus={openList}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="min-h-[44px] w-full rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9A84A] focus:ring-2 focus:ring-[#E8D48A]/60 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {open ? (
        <ul id={listboxId} role="listbox" aria-label={label} className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#E8DFD0] bg-white p-1 shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#7A7164]">{noResultsLabel}</li>
          ) : (
            filtered.map((opt, i) => (
              <li
                key={opt.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={opt.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(opt);
                }}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${
                  i === activeIndex ? "bg-[#F3EBDD] text-[#1E1810]" : opt.value === value ? "bg-[#FAF7F2] text-[#1E1810]" : "text-[#3D3428] hover:bg-[#FAF7F2]"
                }`}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
