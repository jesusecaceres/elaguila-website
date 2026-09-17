"use client";

/**
 * Item 28/29/114/115/184 — shared "add video URL one at a time, with a per-field validity-gated
 * added confirmation" pattern, generalized from the one lane that already had it correctly
 * (BR Negocio agente-individual's `VideoUrlAddRows`) so every BR/Rentas lane can share it instead
 * of re-implementing (or under-implementing) the same UX.
 */

import { useState } from "react";

function validHttpUrl(raw: string): boolean {
  return /^https?:\/\/\S+/i.test(raw.trim());
}

function normalized(values: readonly string[], max: number): string[] {
  return Array.from({ length: max }, (_, i) => values[i] ?? "");
}

export function LeonixVideoUrlAddRows({
  values,
  max,
  onChange,
  fieldLabel,
  urlLabel,
  addLabel,
  removeLabel,
  addedLabel,
  placeholder = "https://",
  className = "",
}: {
  /** Current stored URLs (may be shorter than `max`). */
  values: readonly string[];
  max: number;
  /** Called with the full, up-to-`max`-length array whenever a slot changes or is cleared. */
  onChange: (next: string[]) => void;
  fieldLabel: string;
  urlLabel: (index: number) => string;
  addLabel: string;
  removeLabel: string;
  addedLabel: string;
  placeholder?: string;
  className?: string;
}) {
  const existing = normalized(values, max);
  const filledCount = existing.filter((u) => u.trim()).length;
  const [visibleCount, setVisibleCount] = useState(Math.min(max, Math.max(1, filledCount + 1)));

  const patch = (index: number, value: string) => {
    const next = normalized(values, max);
    next[index] = value;
    onChange(next);
  };

  return (
    <div className={className}>
      <span className="block text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{fieldLabel}</span>
      <div className="mt-3 space-y-3">
        {existing.slice(0, visibleCount).map((value, index) => {
          const ok = validHttpUrl(value);
          return (
            <div key={index} className="rounded-xl border border-[#E8DFD0] bg-white/70 p-3">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#5C5346]/90">
                {urlLabel(index + 1)}
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  type="url"
                  className="mt-1.5 w-full min-w-0 min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 text-base text-[#2C2416] outline-none focus:border-[#C9B46A]/70 sm:min-h-0 sm:flex-1 sm:py-2.5 sm:text-sm"
                  value={value}
                  onChange={(e) => patch(index, e.target.value)}
                  placeholder={placeholder}
                  autoComplete="off"
                />
                {value.trim() ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 sm:min-h-0"
                    onClick={() => patch(index, "")}
                  >
                    {removeLabel}
                  </button>
                ) : null}
              </div>
              {ok ? <p className="mt-2 text-xs font-bold text-[#2F6B3C]">{addedLabel}</p> : null}
            </div>
          );
        })}
        {visibleCount < max ? (
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-dashed border-[#C9B46A]/70 bg-[#FFF6E7] px-4 py-2.5 text-xs font-bold text-[#5C4E2E] transition hover:border-[#B8954A] hover:bg-[#FFF0D6] sm:min-h-0"
            onClick={() => setVisibleCount((n) => Math.min(max, n + 1))}
          >
            {addLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
