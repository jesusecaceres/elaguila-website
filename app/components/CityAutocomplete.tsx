"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CA_CITIES } from "@/app/data/locations/norcal";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

const MAX_SUGGESTIONS = 30;
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

/** Canonical normalization: shared with lista/filters via californiaLocationHelpers. */
function normalizeToCanonical(raw: string): string {
  return getCanonicalCityName(raw);
}

/** Suggestions from full NorCal list (CA_CITIES). Matches city + aliases; returns canonical record.city. */
function getSuggestions(query: string): string[] {
  const q = toCityKey(query);
  if (!q) return [];
  const scored: Array<{ city: string; score: number }> = [];
  const seen = new Set<string>();
  for (const record of CA_CITIES) {
    const cityKey = toCityKey(record.city);
    let best = 999;
    if (cityKey === q) best = 0;
    else if (cityKey.startsWith(q)) best = 1;
    else if (cityKey.includes(q)) best = 2;
    if (best === 999 && record.aliases?.length) {
      for (const a of record.aliases) {
        const aliasKey = toCityKey(a);
        if (aliasKey === q) best = Math.min(best, 0);
        else if (aliasKey.startsWith(q)) best = Math.min(best, 1);
        else if (aliasKey.includes(q)) best = Math.min(best, 2);
      }
    }
    if (best !== 999 && !seen.has(record.city)) {
      seen.add(record.city);
      scored.push({ city: record.city, score: best });
    }
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
  /** "dark" = black/gold (perfil); "light" = light form (publicar); "brForm" = BR agente publish (cream card) */
  variant?: "dark" | "light" | "brForm";
  /** Optional: clear parent error when user selects (e.g. setMsg(null)) */
  onSelect?: () => void;
  /** When true, clear the field on blur if text does not resolve to a canonical NorCal city (strict filter key). */
  stripInvalidOnBlur?: boolean;
  /** Invalid state (e.g. after failed “next” in publish flow) */
  invalid?: boolean;
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
  invalid = false,
  stripInvalidOnBlur = false,
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
      else if (stripInvalidOnBlur && value.trim()) onChange("");
      setOpen(false);
      setHighlightedIndex(-1);
    }, BLUR_DELAY_MS);
  }, [value, onChange, stripInvalidOnBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Always allow spaces in multi-word cities (e.g. "San Jose"); never steal Space for listbox UX.
      if (e.key === " " || e.code === "Space") {
        setHighlightedIndex(-1);
        return;
      }
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
  const isBrForm = variant === "brForm";
  const inputClasses = isDark
    ? `w-full rounded-xl border ${invalid ? "border-red-500 ring-1 ring-red-500/35" : "border-white/10"} bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-yellow-500/60`
    : isBrForm
      ? `mt-1.5 w-full min-h-[44px] rounded-xl border ${invalid ? "border-red-500 ring-1 ring-red-500/35" : "border-[#E8DFD0]"} bg-white px-3 py-3 text-base text-[#2C2416] placeholder:text-[#5C5346]/50 outline-none focus:border-[#C9B46A]/70 sm:min-h-0 sm:py-2.5 sm:text-sm`
      : `mt-2 w-full rounded-xl border ${invalid ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"} bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30`;
  const panelClasses = isDark
    ? "absolute left-0 right-0 mt-2 z-50 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/95 shadow-xl"
    : isBrForm
      ? "absolute left-0 right-0 z-50 mt-1 max-h-80 overflow-auto rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] shadow-xl"
      : "absolute left-0 right-0 mt-2 z-50 max-h-80 overflow-auto rounded-xl border border-black/10 bg-[#F5F5F5] shadow-xl";
  const optionClasses = isDark
    ? "block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition"
    : isBrForm
      ? "block w-full text-left px-4 py-3 text-sm text-[#2C2416] hover:bg-[#FFF6E7] transition"
      : "block w-full text-left px-4 py-3 text-sm text-[#111111] hover:bg-white/80 transition";
  const emptyClasses = isDark
    ? "px-4 py-3 text-sm text-white/60"
    : isBrForm
      ? "px-4 py-3 text-sm text-[#5C5346]/80"
      : "px-4 py-3 text-sm text-[#111111]/60";

  const noResultsText =
    lang === "es" ? "No se encontró. Elige una ciudad de la lista." : "No results. Choose a city from the list.";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label !== undefined && (
        <div className={isDark ? "text-xs text-white/60" : isBrForm ? "text-xs font-bold uppercase tracking-wide text-[#5C5346]/90" : "text-sm text-[#111111]"}>
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
        aria-invalid={invalid}
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
