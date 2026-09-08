/**
 * Virtual Front Desk — Leonix normal public office-hours presentation.
 *
 * This is VFD-owned reception context only. It does NOT represent executive
 * availability, physical presence, or response-time promises.
 *
 * Window: 9:00 AM – 5:00 PM America/Los_Angeles (Pacific, DST-safe via IANA zone).
 * Days of week are intentionally omitted — not approved in source truth.
 */

export const LEONIX_OFFICE_TIME_ZONE = "America/Los_Angeles";
export const LEONIX_OFFICE_OPEN_MINUTE = 9 * 60; // 9:00 AM
export const LEONIX_OFFICE_CLOSE_MINUTE = 17 * 60; // 5:00 PM (exclusive)

export type LeonixOfficeHoursStatus = "within" | "outside";

function pacificHourMinute(date: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LEONIX_OFFICE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute };
}

/** Minutes since Pacific midnight for `date`. */
export function getPacificMinutesSinceMidnight(date: Date = new Date()): number {
  const { hour, minute } = pacificHourMinute(date);
  return hour * 60 + minute;
}

/**
 * True when current Pacific time is in [9:00, 17:00).
 * 5:00 PM exactly and later = outside normal hours.
 */
export function isWithinLeonixOfficeHours(date: Date = new Date()): boolean {
  const m = getPacificMinutesSinceMidnight(date);
  return m >= LEONIX_OFFICE_OPEN_MINUTE && m < LEONIX_OFFICE_CLOSE_MINUTE;
}

export function resolveLeonixOfficeHoursStatus(date: Date = new Date()): LeonixOfficeHoursStatus {
  return isWithinLeonixOfficeHours(date) ? "within" : "outside";
}
