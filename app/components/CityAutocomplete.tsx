"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CA_CITIES, CITY_ALIASES } from "@/app/data/locations/norcal";
import { NORCAL_CITY_NAMES } from "@/app/data/norcalCities";

const MAX_SUGGESTIONS = 8;
const BLUR_DELAY_MS = 120;

function toCityKey(s: string): string {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToCanonical(raw: string): string {
  const key = toCityKey(raw);
  if (!key) return "";
  const fromNorCal = NORCAL_CITY_NAMES.find((n) => toCityKey(n) === key);
  if (fromNorCal) return fromNorCal;
  const fromAlias = CITY_ALIASES[key];
  if (fromAlias) return fromAlias;
  for (const record of CA_CITIES) {
    if (toCityKey(record.city) === key) return record.city;
    if (record.aliases?.some((a) => toCityKey(a) === key)) return record.city;
  }
  return "";
}

function getSuggestions(query: string): string[] {
  const q = toCityKey(query);
  if (!q) return [];
  // Use NorCal cities dataset for autocomplete suggestions
  const scored: Array<{ city: string; score: number }> = [];
  for (const name of NORCAL_CITY_NAMES) {
    const key = toCityKey(name);
    let best = 999;
    if (key === q) best = 0;
    else if (key.startsWith(q)) best = 1;
    else if (key.includes(q)) best = 2;
    if (best !== 999) scored.push({ city: name, score: best });
  }
  scored.sort((a, b) => a.score - b.score || a.city.localeCompare(b.city));
  return scored.slice(0, MAX_SUGGESTIONS).map((s) => s.city);
}

export type CityAutocompleteLang = "es" | "en";

export type CityAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  lang: CityAutocompleteLang;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** "dark" = black/gold (perfil); "light" = light form (publicar) */
  variant?: "dark" | "light";
  /** Optional: clear parent error when user selects (e.g. setMsg(null)) */
  onSelect?: () => void;
};

export default function CityAutocomplete({
  value,
  onChange,
  placeholder,
  lang,
  label,
  required,
  disabled,
  className = "",
  variant = "dark",
  onSelect,
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => getSuggestions(value), [value]);
  const showPanel = open && value.trim().length >= 1;

  const selectValue = useCallback(
    (city: string) => {
      onChange(city);
      setOpen(false);
      setHighlightedIndex(-1);
      onSelect?.();
    },
    [onChange, onSelect]
  );

  const handleBlur = useCallback(() => {
    blurTimerRef.current = window.setTimeout(() => {
      blurTimerRef.current = null;
      const canon = normalizeToCanonical(value);
      if (canon) onChange(canon);
      setOpen(false);
      setHighlightedIndex(-1);
    }, BLUR_DELAY_MS);
  }, [value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showPanel) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectValue(suggestions[highlightedIndex]);
        } else if (suggestions.length > 0) {
          selectValue(suggestions[0]);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
      }
    },
    [showPanel, suggestions, highlightedIndex, selectValue]
  );

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
    };
  }, []);

  const isDark = variant === "dark";
  const inputClasses = isDark
    ? "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60"
    : "mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30";
  const panelClasses = isDark
    ? "absolute left-0 right-0 mt-2 z-50 max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/95 shadow-xl"
    : "absolute left-0 right-0 mt-2 z-50 max-h-72 overflow-auto rounded-xl border border-black/10 bg-[#F5F5F5] shadow-xl";
  const optionClasses = isDark
    ? "block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition"
    : "block w-full text-left px-4 py-3 text-sm text-[#111111] hover:bg-white/80 transition";
  const emptyClasses = isDark ? "px-4 py-3 text-sm text-white/60" : "px-4 py-3 text-sm text-[#111111]/60";

  const noResultsText =
    lang === "es" ? "No se encontró. Elige una ciudad de la lista." : "No results. Choose a city from the list.";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label !== undefined && (
        <div className={isDark ? "text-xs text-white/60" : "text-sm text-[#111111]"}>
          {label}
          {required && <span className="text-yellow-400/90"> *</span>}
        </div>
      )}
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => {
          setOpen(true);
          setHighlightedIndex(-1);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls="city-autocomplete-list"
        className={label !== undefined ? (isDark ? "mt-2 " + inputClasses : inputClasses) : inputClasses}
      />
      {showPanel && (
        <div id="city-autocomplete-list" role="listbox" className={panelClasses}>
          {suggestions.length > 0 ? (
            suggestions.map((option, idx) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={idx === highlightedIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectValue(option);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={
                  idx === highlightedIndex
                    ? optionClasses + (isDark ? " bg-white/10" : " bg-white/80")
                    : optionClasses
                }
              >
                {option}
              </button>
            ))
          ) : (
            <div className={emptyClasses}>{noResultsText}</div>
          )}
        </div>
      )}
    </div>
  );
}
