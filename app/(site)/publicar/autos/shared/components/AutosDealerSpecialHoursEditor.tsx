"use client";

import type { DealerSpecialHoursRow } from "@/app/clasificados/autos/negocios/types/autoDealerListing";

const INPUT =
  "mt-1.5 min-h-[44px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

type RowCopy = {
  label: string;
  labelPlaceholder: string;
  note: string;
  notePlaceholder: string;
  remove: string;
};

/**
 * Named/date-specific exceptions to the regular weekly schedule (holiday hours, closures).
 * Same `{label, note}` shape as Servicios' proven `specialHoursRows` — free-text on purpose
 * (e.g. "Nochebuena" / "9:00 AM – 2:00 PM", or "Navidad" / "Cerrado") rather than a rigid
 * date+time picker, matching what the owner actually asked for.
 */
export function AutosDealerSpecialHoursEditor({
  rows,
  copy,
  onUpdateRow,
  onRemoveRow,
}: {
  rows: DealerSpecialHoursRow[];
  copy: RowCopy;
  onUpdateRow: (index: number, patch: Partial<DealerSpecialHoursRow>) => void;
  onRemoveRow: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className={LABEL}>{copy.label}</label>
              <input
                type="text"
                className={INPUT}
                placeholder={copy.labelPlaceholder}
                value={row.label}
                onChange={(e) => onUpdateRow(index, { label: e.target.value })}
              />
            </div>
            <div className="min-w-0">
              <label className={LABEL}>{copy.note}</label>
              <input
                type="text"
                className={INPUT}
                placeholder={copy.notePlaceholder}
                value={row.note}
                onChange={(e) => onUpdateRow(index, { note: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end border-t border-[color:var(--lx-nav-border)] pt-3">
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] text-xs font-bold text-red-700 hover:underline sm:min-h-0 sm:min-w-0"
              onClick={() => onRemoveRow(index)}
            >
              {copy.remove}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
