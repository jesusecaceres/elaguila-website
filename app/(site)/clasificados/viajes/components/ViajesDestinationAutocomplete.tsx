"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import type { ViajesDestinationRecord } from "../data/viajesDestinationIndex";
import { filterViajesDestinations } from "../data/viajesDestinationIndex";

type ViajesDestinationAutocompleteProps = {
  value: string;
  onChange: (v: string) => void;
  /** Called when user picks a structured suggestion (canonical dest param). */
  onSelectCanonical?: (destParam: string, displayLabel: string) => void;
  placeholder?: string;
  inputClassName?: string;
};

export function ViajesDestinationAutocomplete({
  value,
  onChange,
  onSelectCanonical,
  placeholder = "Playa, ciudad, país…",
  inputClassName,
}: ViajesDestinationAutocompleteProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = useMemo(() => filterViajesDestinations(value, 10), [value]);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [close]);

  const pick = useCallback(
    (rec: ViajesDestinationRecord) => {
      onChange(rec.label);
      onSelectCanonical?.(rec.destParam, rec.label);
      close();
    },
    [close, onChange, onSelectCanonical]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && suggestions.length) {
      setOpen(true);
      setActive(e.key === "ArrowDown" ? 0 : suggestions.length - 1);
      e.preventDefault();
      return;
    }
    if (!open) {
      if (e.key === "Escape") close();
      return;
    }
    if (e.key === "Escape") {
      close();
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      setActive((i) => Math.max(0, i - 1));
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && active >= 0 && suggestions[active]) {
      pick(suggestions[active]);
      e.preventDefault();
    }
  };

  const baseInput =
    inputClassName ??
    "w-full min-w-0 max-w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] placeholder:text-[color:var(--lx-muted)] focus:ring-2";

  return (
    <div ref={wrapRef} className="relative min-w-0 w-full max-w-full">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-opt-${active}` : undefined}
        className={baseInput}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-[100] mt-1 max-h-[min(50svh,14rem)] w-full overflow-auto overscroll-contain rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] py-1 shadow-[0_16px_40px_-12px_rgba(42,36,22,0.25)]"
        >
          {suggestions.map((rec, idx) => (
            <li key={`${rec.destParam}-${rec.label}`} id={`${listId}-opt-${idx}`} role="option" aria-selected={idx === active}>
              <button
                type="button"
                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition ${
                  idx === active ? "bg-[color:var(--lx-nav-hover)]" : "hover:bg-[color:var(--lx-section)]"
                }`}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(rec)}
              >
                <span className="font-semibold text-[color:var(--lx-text)]">{rec.label}</span>
                {rec.detail ? (
                  <span className="line-clamp-1 text-xs text-[color:var(--lx-muted)]">{rec.detail}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
