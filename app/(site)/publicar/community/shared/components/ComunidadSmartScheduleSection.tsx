"use client";

import { useCallback, useEffect, useRef } from "react";

import type { DayHoursRow, DayKey } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { EmpleosFieldLabel } from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";

import { COMMUNITY_WEEK_ORDER } from "../lib/communityWeeklySchedule";
import { WeeklyScheduleEditor } from "./WeeklyScheduleEditor";

const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

/**
 * Maps a JS Date's getDay() (0=Sun) to DayKey.
 * Returns null for unexpected values.
 */
function dateToDayKey(date: Date): DayKey | null {
  const map: Record<number, DayKey> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };
  return map[date.getDay()] ?? null;
}

/** All DayKey values covered by the ISO date range [startIso, endIso] (inclusive). */
function dayKeysBetween(startIso: string, endIso: string): DayKey[] {
  if (!startIso) return [];
  const end = endIso && endIso >= startIso ? endIso : startIso;
  const result = new Set<DayKey>();
  const cursor = new Date(startIso + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  const MAX_DAYS = 7;
  let count = 0;
  while (cursor <= last && count < MAX_DAYS) {
    const key = dateToDayKey(cursor);
    if (key) result.add(key);
    cursor.setDate(cursor.getDate() + 1);
    count++;
  }
  return COMMUNITY_WEEK_ORDER.filter((k) => result.has(k));
}

const HELPER_COPY = {
  es: "Activamos los días según la fecha del evento y copiamos el horario principal. Revisa cada día y ajusta cualquier horario diferente antes de publicar.",
  en: "We activate the days based on your event date and copy the main schedule. Review each day and adjust any different hours before publishing.",
} as const;

type Props = {
  lang: Lang;
  date: string;
  eventEndDate: string;
  eventSessionStart: string;
  eventSessionEnd: string;
  weeklySchedule: DayHoursRow[];
  copyFields: {
    date: string;
    eventEndDate: string;
    eventSessionStart: string;
    eventSessionEnd: string;
    weeklySchedule: string;
    weeklyClosed: string;
    weeklyHelper: string;
  };
  onChange: (patch: {
    date?: string;
    eventEndDate?: string;
    eventSessionStart?: string;
    eventSessionEnd?: string;
    weeklySchedule?: DayHoursRow[];
  }) => void;
};

/**
 * Smart schedule section for Comunidad y Eventos.
 *
 * When a user selects a start/end date and start/end time, this component:
 * 1. Identifies which weekday(s) fall in the date range.
 * 2. Auto-activates those weekday rows (unchecks "No aplica").
 * 3. Copies the main session start/end time into auto-activated rows (only if not manually customized).
 * 4. Marks which rows were auto-filled (stored in ref, not in session state).
 * 5. When main times change, updates auto-filled rows but never overwrites manually-changed ones.
 *
 * Key design: weeklySchedule and onChange are kept in refs so the effect only
 * re-fires when date/time values actually change, avoiding infinite re-render loops.
 */
export function ComunidadSmartScheduleSection({
  lang,
  date,
  eventEndDate,
  eventSessionStart,
  eventSessionEnd,
  weeklySchedule,
  copyFields,
  onChange,
}: Props) {
  /** Tracks which rows were last auto-filled by the smart logic (not manually customized). */
  const autoFilledRef = useRef<Set<DayKey>>(new Set());
  /** Tracks the last auto-activated set of days so we can deactivate stale days on date change. */
  const lastActivatedRef = useRef<Set<DayKey>>(new Set());

  /**
   * Keep live refs to schedule + onChange so the effect closure is always fresh
   * without adding them to the dependency array (which would cause re-render loops).
   */
  const scheduleRef = useRef(weeklySchedule);
  scheduleRef.current = weeklySchedule;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /** Prev-value refs for date/time — used to detect what actually changed. */
  const prevDateRef = useRef(date);
  const prevEndDateRef = useRef(eventEndDate);
  const prevStartTimeRef = useRef(eventSessionStart);
  const prevEndTimeRef = useRef(eventSessionEnd);

  useEffect(() => {
    const dateChanged =
      prevDateRef.current !== date || prevEndDateRef.current !== eventEndDate;
    const timeChanged =
      prevStartTimeRef.current !== eventSessionStart ||
      prevEndTimeRef.current !== eventSessionEnd;

    prevDateRef.current = date;
    prevEndDateRef.current = eventEndDate;
    prevStartTimeRef.current = eventSessionStart;
    prevEndTimeRef.current = eventSessionEnd;

    if (!dateChanged && !timeChanged) return;
    if (!date) return;

    const newTargetDays = new Set(
      dayKeysBetween(date, eventEndDate && eventEndDate >= date ? eventEndDate : date),
    );
    const prevActivated = lastActivatedRef.current;
    const schedule = scheduleRef.current;

    const updated = schedule.map((row): DayHoursRow => {
      const dayKey = row.day as DayKey;
      const wasAutoFilled = autoFilledRef.current.has(dayKey);
      const wasActivated = prevActivated.has(dayKey);

      if (newTargetDays.has(dayKey)) {
        if (dateChanged && row.closed) {
          // Activate this row — it falls in the date range and is currently off.
          const open = eventSessionStart.trim() || row.open.trim();
          const close = eventSessionEnd.trim() || row.close.trim();
          autoFilledRef.current.add(dayKey);
          return { day: dayKey, closed: false, open, close };
        }
        if (timeChanged && autoFilledRef.current.has(dayKey)) {
          // Update times on auto-filled rows only (manual overrides are removed from autoFilledRef).
          return {
            day: dayKey,
            closed: false,
            open: eventSessionStart.trim() || row.open.trim(),
            close: eventSessionEnd.trim() || row.close.trim(),
          };
        }
        return row;
      } else {
        if (dateChanged && wasActivated && wasAutoFilled) {
          // Day fell out of the date range — deactivate only if we auto-filled it.
          autoFilledRef.current.delete(dayKey);
          return { day: dayKey, closed: true, open: "", close: "" };
        }
        return row;
      }
    });

    lastActivatedRef.current = newTargetDays;

    const hasChange = updated.some((r, i) => {
      const orig = schedule[i];
      return !orig || r.closed !== orig.closed || r.open !== orig.open || r.close !== orig.close;
    });
    if (hasChange) {
      onChangeRef.current({ weeklySchedule: updated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, eventEndDate, eventSessionStart, eventSessionEnd]);

  const handlePatchDay = useCallback((day: DayKey, patch: Partial<DayHoursRow>) => {
    // User manually edited this day — remove from auto-filled set so future global time
    // changes do not overwrite the user's custom value.
    autoFilledRef.current.delete(day);
    onChangeRef.current({
      weeklySchedule: scheduleRef.current.map((r) =>
        r.day === day ? { ...r, ...patch } : r,
      ),
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} required>
            {copyFields.date}
          </EmpleosFieldLabel>
          <input
            type="date"
            className={INPUT}
            value={date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} optional>
            {copyFields.eventEndDate}
          </EmpleosFieldLabel>
          <input
            type="date"
            className={INPUT}
            value={eventEndDate}
            min={date || undefined}
            onChange={(e) => onChange({ eventEndDate: e.target.value })}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} optional>
            {copyFields.eventSessionStart}
          </EmpleosFieldLabel>
          <input
            type="time"
            className={INPUT}
            value={eventSessionStart}
            onChange={(e) => onChange({ eventSessionStart: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} optional>
            {copyFields.eventSessionEnd}
          </EmpleosFieldLabel>
          <input
            type="time"
            className={INPUT}
            value={eventSessionEnd}
            onChange={(e) => onChange({ eventSessionEnd: e.target.value })}
          />
        </label>
      </div>

      {date ? (
        <div className="rounded-xl border border-[#A98C2A]/35 bg-[#FBF6EA] px-3.5 py-2.5 text-xs leading-relaxed text-[#4A3F2F]">
          {HELPER_COPY[lang]}
        </div>
      ) : null}

      <div>
        <EmpleosFieldLabel lang={lang} optional>
          {copyFields.weeklySchedule}
        </EmpleosFieldLabel>
        <WeeklyScheduleEditor
          lang={lang}
          rows={weeklySchedule}
          closedLabel={copyFields.weeklyClosed}
          helperText={copyFields.weeklyHelper}
          onPatchDay={handlePatchDay}
        />
      </div>
    </div>
  );
}
