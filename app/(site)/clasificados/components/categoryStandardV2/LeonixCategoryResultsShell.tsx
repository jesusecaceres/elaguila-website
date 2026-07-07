import type { ReactNode } from "react";
import type { LeonixCategoryResultsShellProps } from "./types";

/**
 * Leonix Category Results Shell
 * 
 * This component provides the results shell for category results pages.
 * It enforces the final order and hard-blocks landing-only sections.
 * 
 * Source: app/(site)/clasificados/rentas/results/components/RentasResultsShell.tsx
 * Source: app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell.tsx
 * 
 * FINAL ORDER:
 * 1. Hero/search shell
 * 2. Active filters if active
 * 3. Result count + sort/view controls
 * 4. Cards/items/listings or compact empty state
 * 5. Optional pagination
 * 6. Optional lower visibility strip if explicitly allowed
 * 
 * HARD RULES:
 * - Do not accept partnerSection prop.
 * - Do not accept discoveryGrid prop.
 * - Do not accept shortcutSections prop.
 * - Do not accept randomCtaRows prop.
 * - surface must be "results"
 * 
 * @param surface - Must be "results" (hard rule)
 * @param hero - Hero/search component
 * @param activeFilters - Active filters component
 * @param toolbar - Results toolbar component
 * @param children - Results/cards/items
 * @param emptyState - Compact empty state component
 * @param pagination - Pagination component
 * @param lowerVisibility - Lower visibility strip (optional)
 * @param hasResults - Whether there are results
 */
export function LeonixCategoryResultsShell({
  surface,
  hero,
  activeFilters,
  toolbar,
  children,
  emptyState,
  pagination,
  lowerVisibility,
  hasResults,
}: LeonixCategoryResultsShellProps) {
  // Hard rule: surface must be "results"
  if (surface !== "results") {
    console.warn("[LeonixCategoryResultsShell] surface must be 'results', got:", surface);
    return null;
  }

  return (
    <div className="space-y-4 pb-3">
      {/* 1. Hero/search shell */}
      {hero}

      {/* 2. Active filters if active */}
      {activeFilters}

      {/* 3. Result count + sort/view controls (toolbar) */}
      {toolbar}

      {/* 4. Cards/items/listings or compact empty state */}
      {hasResults ? (
        <section aria-label="Results">
          {children}
        </section>
      ) : (
        emptyState
      )}

      {/* 5. Optional pagination */}
      {pagination}

      {/* 6. Optional lower visibility strip if explicitly allowed */}
      {lowerVisibility}
    </div>
  );
}
