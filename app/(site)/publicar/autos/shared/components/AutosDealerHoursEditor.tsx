"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { DealerHoursEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  compose24HourFrom12Parts,
  dealerWeekdayOptions,
  DEALER_HOUR_12_OPTIONS,
  DEALER_MINUTE_OPTIONS,
  parse24HourTo12Parts,
  type AmPm,
} from "@/app/lib/clasificados/autos/autosDealerHoursTimeUi";

const SELECT =
  "mt-1.5 min-h-[44px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-2 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

function TimeSelectRow({
  label,
  value24,
  disabled,
  onChange24,
}: {
  label: string;
  value24: string | undefined;
  disabled?: boolean;
  onChange24: (next: string) => void;
}) {
  const parts = parse24HourTo12Parts(value24, { hour: "9", minute: "00", ampm: "AM" });
  const setPart = (patch: Partial<{ hour: string; minute: string; ampm: AmPm }>) => {
    const next = { ...parts, ...patch };
    onChange24(compose24HourFrom12Parts(next.hour, next.minute, next.ampm));
  };

  return (
    <div>
      <span className={LABEL}>{label}</span>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        <select className={SELECT} disabled={disabled} value={parts.hour} onChange={(e) => setPart({ hour: e.target.value })}>
          {DEALER_HOUR_12_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          className={SELECT}
          disabled={disabled}
          value={parts.minute}
          onChange={(e) => setPart({ minute: e.target.value })}
        >
          {DEALER_MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={SELECT}
          disabled={disabled}
          value={parts.ampm}
          onChange={(e) => setPart({ ampm: e.target.value as AmPm })}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

type RowCopy = {
  day: string;
  open: string;
  close: string;
  closed: string;
  remove: string;
};

export function AutosDealerHoursEditor({
  lang,
  rows,
  copy,
  onUpdateRow,
  onRemoveRow,
}: {
  lang: AutosNegociosLang;
  rows: DealerHoursEntry[];
  copy: RowCopy;
  onUpdateRow: (rowId: string, patch: Partial<DealerHoursEntry>) => void;
  onRemoveRow: (rowId: string) => void;
}) {
  const weekdays = dealerWeekdayOptions(lang);

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const rowId = row.rowId ?? row.day;
        return (
          <div
            key={rowId}
            className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <label className={LABEL}>{copy.day}</label>
                <select
                  className={SELECT}
                  value={row.day}
                  onChange={(e) => onUpdateRow(rowId, { day: e.target.value })}
                >
                  {!weekdays.includes(row.day as (typeof weekdays)[number]) && row.day ? (
                    <option value={row.day}>{row.day}</option>
                  ) : null}
                  {weekdays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <TimeSelectRow
                label={copy.open}
                value24={row.open}
                disabled={row.closed}
                onChange24={(open) => onUpdateRow(rowId, { open })}
              />
              <TimeSelectRow
                label={copy.close}
                value24={row.close}
                disabled={row.closed}
                onChange24={(close) => onUpdateRow(rowId, { close })}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--lx-nav-border)] pt-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-semibold text-[color:var(--lx-text-2)]">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(e) => onUpdateRow(rowId, { closed: e.target.checked })}
                  className="h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                />
                {copy.closed}
              </label>
              <button
                type="button"
                className="min-h-[44px] min-w-[44px] text-xs font-bold text-red-700 hover:underline sm:min-h-0 sm:min-w-0"
                onClick={() => onRemoveRow(rowId)}
              >
                {copy.remove}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
