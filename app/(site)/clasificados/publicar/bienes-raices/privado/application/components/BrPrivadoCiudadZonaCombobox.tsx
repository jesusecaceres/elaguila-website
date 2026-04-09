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
    <div ref={containerRef} className="relative min-w-0 max-w-full">
      <input
        id={uid}
        aria-label={inputAriaLabel}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        role="combobox"
        className={`${className} min-h-[48px] touch-manipulation sm:min-h-0`}
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
          className="absolute left-0 right-0 z-30 mt-1 max-h-[min(14rem,50vh)] max-w-[100vw] overflow-auto rounded-xl border border-[#E8DFD0] bg-white py-1 shadow-lg sm:max-h-52"
        >
          {filtered.map((s) => (
            <li key={s} role="option" className="text-sm text-[#2C2416]">
              <button
                type="button"
                className="min-h-[48px] w-full touch-manipulation px-3 py-3 text-left font-medium hover:bg-[#FFF6E7] active:bg-[#E8DFD0]/60 sm:min-h-[44px] sm:py-2.5"
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
