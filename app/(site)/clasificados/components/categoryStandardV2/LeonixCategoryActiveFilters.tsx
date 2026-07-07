"use client";

import {
  LEONIX_ACTIVE_FILTERS_PANEL,
  LEONIX_ACTIVE_FILTER_CHIP,
  LEONIX_ACTIVE_FILTERS_LABEL,
} from "./constants";
import type { ActiveFiltersProps } from "./types";

/**
 * Leonix Category Active Filters
 *
 * Displays active filter chips with clear functionality.
 *
 * Visual contract:
 * - Panel: rounded-xl border bg-[#FFFDF7]/90
 * - Chips: rounded-full border bg-white
 * - Label: uppercase tracking text-[#556B3E]
 * - Compact wrap/no overflow
 * - Chip min-h around 36-40px
 *
 * Rules:
 * - Only active filters generated from URL/query state
 * - No category shortcut chips here
 * - Hide when no chips
 */
export function LeonixCategoryActiveFilters({
  label,
  chips,
  clearAllLabel,
  onClearAll,
}: ActiveFiltersProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={LEONIX_ACTIVE_FILTERS_PANEL} aria-label={label}>
      <span className={LEONIX_ACTIVE_FILTERS_LABEL}>{label}</span>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {chips.map((chip) => {
          if (chip.href) {
            return (
              <li key={chip.id}>
                <a
                  href={chip.href}
                  className={LEONIX_ACTIVE_FILTER_CHIP}
                >
                  <span className="truncate">{chip.label}</span>
                </a>
              </li>
            );
          }

          return (
            <li key={chip.id}>
              <button
                type="button"
                onClick={chip.onClear}
                className={`${LEONIX_ACTIVE_FILTER_CHIP} flex items-center gap-1.5`}
              >
                <span className="truncate">{chip.label}</span>
                <span className="shrink-0 text-[#B8954A]" aria-hidden>
                  ×
                </span>
                <span className="sr-only">Clear filter</span>
              </button>
            </li>
          );
        })}
      </ul>

      {clearAllLabel && onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          className="mt-2 text-xs font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-2 hover:text-[#8A6F3A] sm:mt-0 sm:ml-auto"
        >
          {clearAllLabel}
        </button>
      ) : null}
    </div>
  );
}
