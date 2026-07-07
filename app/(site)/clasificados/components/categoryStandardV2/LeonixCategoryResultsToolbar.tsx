"use client";

import type { LeonixCategoryResultsToolbarProps } from "./types";
import {
  LEONIX_RESULTS_COUNT,
  LEONIX_RESULTS_COUNT_LABEL,
  LEONIX_RESULTS_COUNT_NUMBER,
  LEONIX_RESULTS_TOOLBAR_INNER,
  LEONIX_RESULTS_TOOLBAR_WRAPPER,
  LEONIX_SORT_SELECT,
  LEONIX_VIEW_TOGGLE_BUTTON,
  LEONIX_VIEW_TOGGLE_BUTTON_ACTIVE,
  LEONIX_VIEW_TOGGLE_BUTTON_INACTIVE,
  LEONIX_VIEW_TOGGLE_GROUP,
} from "./constants";

/**
 * Leonix Category Results Toolbar
 * 
 * This component provides the results toolbar with count, sort, and view controls.
 * It uses the exact Rentas/Bienes visual system with toolbar wrapper and controls.
 * 
 * Source: app/(site)/clasificados/rentas/results/components/RentasResultsToolbar.tsx
 * 
 * MUST NOT render landing CTA buttons.
 * 
 * @param lang - "es" or "en"
 * @param countText - Count text (e.g., "Showing 1-9 of 45")
 * @param resultCount - Total result count
 * @param showingFrom - Showing from number
 * @param showingTo - Showing to number
 * @param sortLabel - Sort label
 * @param sortValue - Current sort value
 * @param onSortChange - Sort change handler
 * @param sortOptions - Sort options
 * @param viewMode - Current view mode
 * @param onViewModeChange - View mode change handler
 * @param filtersButtonLabel - Filters button label (optional)
 * @param onOpenFilters - Filters open handler (optional)
 * @param perPageLabel - Per page label (optional)
 * @param perPageValue - Current per page value
 * @param onPerPageChange - Per page change handler
 * @param perPageOptions - Per page options
 * @param clearAllLabel - Clear all label (optional)
 * @param onClearAll - Clear all handler (optional)
 */
export function LeonixCategoryResultsToolbar({
  lang,
  countText,
  resultCount,
  showingFrom,
  showingTo,
  sortLabel,
  sortValue,
  onSortChange,
  sortOptions,
  viewMode,
  onViewModeChange,
  filtersButtonLabel,
  onOpenFilters,
  perPageLabel,
  perPageValue,
  onPerPageChange,
  perPageOptions,
  clearAllLabel,
  onClearAll,
}: LeonixCategoryResultsToolbarProps) {
  const locale = lang === "en" ? "en-US" : "es-MX";

  return (
    <div className={LEONIX_RESULTS_TOOLBAR_WRAPPER}>
      <div className={LEONIX_RESULTS_TOOLBAR_INNER}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Result count */}
          <p className={LEONIX_RESULTS_COUNT}>
            <span className={LEONIX_RESULTS_COUNT_LABEL}>
              {lang === "es" ? "Resultados" : "Results"}
            </span>
            <span className="mx-2 text-[#D6C7AD]" aria-hidden>
              ·
            </span>
            {lang === "es" ? "Mostrando" : "Showing"}{" "}
            <span className={LEONIX_RESULTS_COUNT_NUMBER}>
              {showingFrom} – {showingTo}
            </span>{" "}
            {lang === "es" ? "de" : "of"}{" "}
            <span className={LEONIX_RESULTS_COUNT_NUMBER}>{resultCount.toLocaleString(locale)}</span>
          </p>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort select */}
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-[#4A4338] sm:min-h-0">
              <span className="sr-only">{sortLabel}</span>
              <span className="hidden font-semibold sm:inline">{sortLabel}</span>
              <select
                value={sortValue}
                onChange={(e) => onSortChange(e.target.value)}
                className={LEONIX_SORT_SELECT}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {/* View toggle */}
            <div
              className={LEONIX_VIEW_TOGGLE_GROUP}
              role="group"
              aria-label={`${lang === "es" ? "Vista de cuadrícula" : "Grid view"} / ${lang === "es" ? "Vista de lista" : "List view"}`}
            >
              <button
                type="button"
                aria-pressed={viewMode === "grid"}
                onClick={() => onViewModeChange("grid")}
                className={`${LEONIX_VIEW_TOGGLE_BUTTON} ${viewMode === "grid" ? LEONIX_VIEW_TOGGLE_BUTTON_ACTIVE : LEONIX_VIEW_TOGGLE_BUTTON_INACTIVE}`}
                aria-label={lang === "es" ? "Vista de cuadrícula" : "Grid view"}
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "list"}
                onClick={() => onViewModeChange("list")}
                className={`${LEONIX_VIEW_TOGGLE_BUTTON} ${viewMode === "list" ? LEONIX_VIEW_TOGGLE_BUTTON_ACTIVE : LEONIX_VIEW_TOGGLE_BUTTON_INACTIVE}`}
                aria-label={lang === "es" ? "Vista de lista" : "List view"}
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M8 7h12M8 12h12M8 17h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="5" cy="7" r="1.2" fill="currentColor" />
                  <circle cx="5" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="5" cy="17" r="1.2" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Per page select (optional) */}
            {perPageLabel && onPerPageChange && perPageOptions ? (
              <label className="flex min-h-[44px] items-center gap-2 text-sm text-[#4A4338] sm:min-h-0">
                <span className="sr-only">{perPageLabel}</span>
                <span className="hidden font-semibold sm:inline">{perPageLabel}</span>
                <select
                  value={perPageValue}
                  onChange={(e) => onPerPageChange(Number(e.target.value))}
                  className={LEONIX_SORT_SELECT}
                >
                  {perPageOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {/* Clear all button (optional) */}
            {clearAllLabel && onClearAll ? (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-semibold text-[#7A1E2C] underline decoration-[#7A1E2C]/40 underline-offset-2 hover:text-[#5e1721]"
              >
                {clearAllLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
