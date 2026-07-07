"use client";

import {
  LEONIX_RESULTS_TOOLBAR,
  LEONIX_RESULTS_TOOLBAR_INNER,
  LEONIX_RESULTS_COUNT,
  LEONIX_RESULTS_COUNT_BADGE,
  LEONIX_RESULTS_COUNT_NUMBER,
} from "./constants";
import type { ResultsToolbarProps } from "./types";

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 7h12M8 12h12M8 17h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="5" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

/**
 * Leonix Category Results Toolbar
 *
 * Displays result count, sort, view toggle, and controls.
 *
 * Visual contract:
 * - Container: mt-6 border-t pt-4
 * - Inner: rounded-xl border bg-[#FFFDF7]/90
 * - Count text with badge styling
 * - Sort select, view toggle, per page options
 * - Compact mobile stacking
 *
 * Rules:
 * - Must NOT render landing CTA buttons
 * - Supports sort, view toggle, per page, filters, clear all slots
 */
export function LeonixCategoryResultsToolbar({
  countText,
  resultCount,
  sortSlot,
  viewToggleSlot,
  perPageSlot,
  filtersButtonSlot,
  clearAllButtonSlot,
}: ResultsToolbarProps) {
  return (
    <div className={LEONIX_RESULTS_TOOLBAR}>
      <div className={LEONIX_RESULTS_TOOLBAR_INNER}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className={LEONIX_RESULTS_COUNT}>
            <span className={LEONIX_RESULTS_COUNT_BADGE}>Results</span>
            <span className="mx-2 text-[#D6C7AD]" aria-hidden>
              ·
            </span>
            {countText}{" "}
            <span className={LEONIX_RESULTS_COUNT_NUMBER}>{resultCount.toLocaleString()}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {sortSlot}
            {viewToggleSlot}
            {perPageSlot}
            {filtersButtonSlot}
            {clearAllButtonSlot}
          </div>
        </div>
      </div>
    </div>
  );
}
