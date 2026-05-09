"use client";

import type { DayHoursRow, DayKey } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { WEEK_DAY_LABELS } from "@/app/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";

import { COMMUNITY_WEEK_ORDER } from "../lib/communityWeeklySchedule";

const INPUT =
  "mt-1 w-full min-h-[44px] rounded-lg border border-black/10 px-3 py-2 text-sm sm:min-h-0 sm:py-2";

type Lang = "es" | "en";

export type WeeklyScheduleEditorProps = {
  lang: Lang;
  rows: DayHoursRow[];
  onPatchDay: (day: DayKey, patch: Partial<DayHoursRow>) => void;
  closedLabel: string;
  helperText: string;
};

/**
 * Fixed Mon–Sun weekly rows (same interaction model as Servicios classified hours step).
 */
export function WeeklyScheduleEditor({ lang, rows, onPatchDay, closedLabel, helperText }: WeeklyScheduleEditorProps) {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-[color:var(--lx-text-2)]">{helperText}</p>
      <div className="space-y-2">
        {COMMUNITY_WEEK_ORDER.map((day) => {
          const row = byDay.get(day) ?? { day, closed: true, open: "", close: "" };
          return (
            <div
              key={day}
              className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white/80 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:py-2.5"
            >
              <span className="shrink-0 text-sm font-semibold text-[color:var(--lx-text)] sm:w-28">
                {WEEK_DAY_LABELS[day][lang]}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.closed}
                    onChange={(e) => onPatchDay(day, { closed: e.target.checked })}
                    className="h-4 w-4 rounded border-black/20"
                  />
                  {closedLabel}
                </label>
                {!row.closed ? (
                  <>
                    <input
                      type="time"
                      className={`${INPUT} w-[min(100%,9rem)] max-w-[140px] sm:w-auto`}
                      value={row.open}
                      onChange={(e) => onPatchDay(day, { open: e.target.value })}
                    />
                    <span className="text-[color:var(--lx-muted)]">—</span>
                    <input
                      type="time"
                      className={`${INPUT} w-[min(100%,9rem)] max-w-[140px] sm:w-auto`}
                      value={row.close}
                      onChange={(e) => onPatchDay(day, { close: e.target.value })}
                    />
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
