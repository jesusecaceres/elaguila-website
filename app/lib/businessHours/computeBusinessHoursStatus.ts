/**
 * Shared business-hours open-now computation — generalized from Restaurantes' working
 * `computeHoursStatus` (app/(site)/clasificados/restaurantes/lib/restauranteHoursLogic.ts).
 * Logic is unchanged; only the module location/name is generalized so other business
 * categories (Servicios, and eventually Comida Local) can reuse the same open-now truth
 * instead of reimplementing it. Restaurantes' own file is left as-is in this gate — category
 * adoption of this shared version is later category-adapter work.
 */

export type BusinessHoursStatus = {
  isOpenNow: boolean;
  openUntil?: string;
  closeTime?: string;
  status: "open" | "closed" | "unknown";
};

export type BusinessDaySchedule = {
  openTime?: string;
  closeTime?: string;
  closed?: boolean;
};

export type BusinessWeeklyHours = {
  [dayKey: string]: BusinessDaySchedule;
};

function parseTime(timeStr?: string): number | null {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

function getCurrentMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentDayKey(now: Date): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[now.getDay()];
}

/** Compute real-time open/closed status from a category's weekly hours. */
export function computeBusinessHoursStatus(
  weeklyHours?: BusinessWeeklyHours,
  now: Date = new Date(),
): BusinessHoursStatus {
  if (!weeklyHours) {
    return { isOpenNow: false, status: "unknown" };
  }

  const dayKey = getCurrentDayKey(now);
  const todaySchedule = weeklyHours[dayKey];

  if (!todaySchedule) {
    return { isOpenNow: false, status: "unknown" };
  }

  if (todaySchedule.closed) {
    return { isOpenNow: false, status: "closed" };
  }

  const openMinutes = parseTime(todaySchedule.openTime);
  const closeMinutes = parseTime(todaySchedule.closeTime);

  if (openMinutes === null || closeMinutes === null) {
    return { isOpenNow: false, status: "unknown" };
  }

  const currentMinutes = getCurrentMinutes(now);
  const open = openMinutes;
  const close = closeMinutes;

  if (close < open) {
    // Overnight hours (e.g., 10 PM to 2 AM).
    if (currentMinutes >= open || currentMinutes < close) {
      return { isOpenNow: true, openUntil: formatTime(close), closeTime: formatTime(close), status: "open" };
    }
  } else if (currentMinutes >= open && currentMinutes < close) {
    return { isOpenNow: true, openUntil: formatTime(close), closeTime: formatTime(close), status: "open" };
  }

  return { isOpenNow: false, closeTime: formatTime(open), status: "closed" };
}
