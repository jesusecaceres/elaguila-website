/**
 * Executive working-hours helpers — ECP-owned.
 * Distinct from VFD business office hours (`app/lib/visitanos/visitanosOfficeHours.ts`).
 */

import type { ExecutiveDayHours, ExecutiveDayKey, ExecutiveWorkingHours } from "./digitalContactTypes";

const DAY_FROM_SHORT: Record<string, ExecutiveDayKey> = {
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat",
  sun: "sun",
};

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Returns false when the IANA zone cannot be used with Intl. */
export function isValidIanaTimeZone(timeZone: string): boolean {
  const tz = String(timeZone ?? "").trim();
  if (!tz) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function parseHhMmToMinutes(value: string | undefined): number | null {
  const raw = String(value ?? "").trim();
  const m = HH_MM.exec(raw);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function getExecutiveLocalParts(
  date: Date,
  timeZone: string,
): { day: ExecutiveDayKey; minutesSinceMidnight: number } | null {
  if (!isValidIanaTimeZone(timeZone)) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const weekdayRaw = parts.find((p) => p.type === "weekday")?.value ?? "";
    const day = DAY_FROM_SHORT[weekdayRaw.slice(0, 3).toLowerCase()];
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "NaN");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "NaN");
    if (!day || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return { day, minutesSinceMidnight: hour * 60 + minute };
  } catch {
    return null;
  }
}

function dayRow(hours: ExecutiveWorkingHours, day: ExecutiveDayKey): ExecutiveDayHours | undefined {
  return hours.days.find((d) => d.day === day);
}

/**
 * Whether `date` falls inside configured executive working hours.
 * Missing day → closed. Invalid timezone / malformed times → null (caller → unknown_schedule).
 * Interval is `[open, close)`.
 */
export function isWithinExecutiveWorkingHours(
  hours: ExecutiveWorkingHours | undefined | null,
  date: Date,
): boolean | null {
  if (!hours) return null;
  const tz = String(hours.timezone ?? "").trim();
  if (!isValidIanaTimeZone(tz)) return null;
  const local = getExecutiveLocalParts(date, tz);
  if (!local) return null;
  const row = dayRow(hours, local.day);
  if (!row || row.closed) return false;
  const open = parseHhMmToMinutes(row.open);
  const close = parseHhMmToMinutes(row.close);
  if (open === null || close === null) return null;
  if (close <= open) return null; // no overnight / inverted ranges in V1
  return local.minutesSinceMidnight >= open && local.minutesSinceMidnight < close;
}
