/**
 * Real-time open/closed status logic for Restaurantes results cards.
 *
 * The actual computation now lives in the shared `computeBusinessHoursStatus` module
 * (app/lib/businessHours/computeBusinessHoursStatus.ts), which was originally extracted from
 * this exact file — this file re-exports it under its original names so the one existing caller
 * (`restauranteApplicationToDiscoveryRow.ts`) needs no changes. Confirmed behavior-identical for
 * that caller (always invoked with the default `now`, the only path where the two previously
 * diverged — the old local `getCurrentMinutes`/`getCurrentDayKey` ignored a passed `now` even
 * though the signature accepted one; the shared version correctly threads it through).
 */
import {
  computeBusinessHoursStatus,
  type BusinessHoursStatus,
  type BusinessDaySchedule,
  type BusinessWeeklyHours,
} from "@/app/lib/businessHours/computeBusinessHoursStatus";

export type HoursStatus = BusinessHoursStatus;
export type DaySchedule = BusinessDaySchedule;
export type WeeklyHours = BusinessWeeklyHours;

/**
 * Compute real-time open/closed status based on business hours
 */
export function computeHoursStatus(weeklyHours?: WeeklyHours, now: Date = new Date()): HoursStatus {
  return computeBusinessHoursStatus(weeklyHours, now);
}

/**
 * Convert application hours format to weekly hours format
 */
export function normalizeWeeklyHours(appHours: any): WeeklyHours | undefined {
  if (!appHours) return undefined;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weeklyHours: WeeklyHours = {};

  for (const day of days) {
    const dayData = appHours[day];
    if (dayData) {
      weeklyHours[day] = {
        openTime: dayData.openTime,
        closeTime: dayData.closeTime,
        closed: dayData.closed
      };
    }
  }

  return weeklyHours;
}
