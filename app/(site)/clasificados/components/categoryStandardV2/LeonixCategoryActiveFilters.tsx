import Link from "next/link";
import type { LeonixCategoryActiveFiltersProps } from "./types";
import {
  LEONIX_ACTIVE_FILTER_CHIP,
  LEONIX_ACTIVE_FILTERS_LABEL,
  LEONIX_ACTIVE_FILTERS_PANEL,
} from "./constants";

/**
 * Leonix Category Active Filters
 * 
 * This component displays active filter chips for category results pages.
 * It uses the exact Rentas/Bienes visual system with panel and chips.
 * 
 * Source: app/(site)/clasificados/rentas/results/components/RentasResultsActiveFilters.tsx
 * 
 * @param label - Section label
 * @param chips - Active filter chips
 * @param clearAllLabel - Clear all button label
 * @param onClearAll - Clear all handler
 */
export function LeonixCategoryActiveFilters({
  label,
  chips,
  clearAllLabel,
  onClearAll,
}: LeonixCategoryActiveFiltersProps) {
  // Hide when no chips
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
                <Link href={chip.href} className={LEONIX_ACTIVE_FILTER_CHIP}>
                  <span className="truncate">{chip.label}</span>
                  <span aria-hidden>×</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={chip.id}>
              <button
                type="button"
                onClick={chip.onClear}
                className={LEONIX_ACTIVE_FILTER_CHIP}
              >
                <span className="truncate">{chip.label}</span>
                <span aria-hidden>×</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onClearAll}
        className="shrink-0 text-xs font-semibold text-[#7A1E2C] underline decoration-[#7A1E2C]/40 underline-offset-2 hover:text-[#5e1721]"
      >
        {clearAllLabel}
      </button>
    </div>
  );
}
