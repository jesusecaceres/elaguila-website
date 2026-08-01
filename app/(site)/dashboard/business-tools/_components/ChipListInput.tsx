"use client";

import { useState } from "react";

/**
 * Chip-style multi-value text entry (Gate BCO-3R-B.1) — replaces raw comma-separated text boxes
 * for cities/regions/postal codes/countries served. Enter or comma commits a chip; Backspace on
 * an empty input removes the last chip. Space types normally inside the input (no key is
 * intercepted except Enter/Comma/Backspace-when-empty).
 */
export function ChipListInput({
  id,
  label,
  values,
  onChange,
  placeholder,
  removeLabel,
}: {
  id: string;
  label: string;
  values: readonly string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  removeLabel: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#3D3428]">
        {label}
      </label>
      <div className="mt-1 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border border-[#E8DFD0] bg-white px-2 py-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#3D3428]">
            {v}
            <button
              type="button"
              aria-label={`${removeLabel}: ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="-m-1 min-h-[28px] min-w-[28px] rounded-full p-1 text-sm font-bold text-[#7A1E2C]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : ""}
          className="min-w-[100px] flex-1 border-none px-1 py-1 text-sm text-[#1E1810] outline-none"
        />
      </div>
    </div>
  );
}
