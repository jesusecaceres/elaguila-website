"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BR_PRIVADO_CIUDAD_ZONA_SUGGESTIONS } from "../utils/brPrivadoNorCalZones";

type Props = {
  value: string;
  onChange: (next: string) => void;
  className: string;
  inputAriaLabel?: string;
};

/**
 * NorCal-oriented suggestions: type to filter, click to apply (not a native datalist).
 */
export function BrPrivadoCiudadZonaCombobox({ value, onChange, className, inputAriaLabel = "Ciudad o zona" }: Props) {
  const uid = useId();
  const listId = `${uid}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = value.trim().toLowerCase();
    if (!needle) return [...BR_PRIVADO_CIUDAD_ZONA_SUGGESTIONS].slice(0, 14);
    return BR_PRIVADO_CIUDAD_ZONA_SUGGESTIONS.filter((s) => s.toLowerCase().includes(needle)).slice(0, 14);
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        id={uid}
        aria-label={inputAriaLabel}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        role="combobox"
        className={className}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-auto rounded-xl border border-[#E8DFD0] bg-white py-1 shadow-lg"
        >
          {filtered.map((s) => (
            <li key={s} role="option" className="px-3 py-2.5 text-sm text-[#2C2416] hover:bg-[#FFF6E7]">
              <button
                type="button"
                className="w-full text-left font-medium"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
