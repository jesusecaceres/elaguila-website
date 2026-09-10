import type { ComponentType } from "react";

/**
 * Shared facts-grid renderer (Final Completion item 30). One card, one title, N label:value
 * rows. Category adapters (BR Privado/Negocio, Rentas Privado/Negocio, ...) build the `rows`
 * array from their own form state/VM — this component owns no category logic, no data
 * fetching, no field-name knowledge. It only lays rows out and renders them, and drops any row
 * whose value is empty (sparse by construction, not by caller discipline).
 */

export type LeonixFactRow = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Visually emphasized value (e.g. a price or a status) — bolder/larger than a normal fact. */
  emphasis?: boolean;
};

export type LeonixListingFactsGridTheme = {
  borderColor: string;
  cardBackground: string;
  labelColor: string;
  valueColor: string;
};

export function LeonixListingFactsGrid({
  title,
  rows,
  theme,
  columns = 2,
  className,
}: {
  title: string;
  rows: readonly LeonixFactRow[] | undefined;
  theme: LeonixListingFactsGridTheme;
  /** Desktop/tablet column count (sm: breakpoint up). Mobile is always 1 column. */
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const safeRows = (Array.isArray(rows) ? rows : []).filter((r) => String(r.value ?? "").trim().length > 0);
  if (!safeRows.length) return null;

  const gridColsClass = columns === 3 ? "sm:grid-cols-3" : columns === 1 ? "" : "sm:grid-cols-2";

  return (
    <div
      className={`min-w-0 rounded-xl border p-3.5 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.08)] sm:p-4 ${className ?? ""}`}
      style={{ borderColor: theme.borderColor, background: theme.cardBackground }}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: theme.labelColor }}>
        {title}
      </h3>
      <dl className={`mt-2.5 grid gap-x-5 gap-y-3 sm:mt-3 ${gridColsClass} sm:gap-x-8 sm:gap-y-3.5`}>
        {safeRows.map((r) => (
          <div key={`${r.label}-${r.value}`} className="min-w-0">
            <dt
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: theme.labelColor }}
            >
              {r.icon ? <r.icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
              {r.label}
            </dt>
            <dd
              className={`mt-1 whitespace-pre-line break-words leading-snug [overflow-wrap:anywhere] [font-variant-numeric:tabular-nums] ${
                r.emphasis ? "text-base font-bold" : "text-sm font-medium"
              }`}
              style={{ color: theme.valueColor }}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
