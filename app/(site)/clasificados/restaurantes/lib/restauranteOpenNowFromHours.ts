import type { RestauranteDaySchedule, RestauranteWeeklyHours } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";

function parseMinutes(hhmm: string | undefined): number | null {
  if (!hhmm || typeof hhmm !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Maps JS getUTCDay()-style index: 0=Sun .. 6=Sat → weeklyHours key */
function weekdayKeyFromDateInTimeZone(now: Date, timeZone: string): keyof RestauranteWeeklyHours | null {
  const w = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  const map: Record<string, keyof RestauranteWeeklyHours> = {
    Sun: "sunday",
    Mon: "monday",
    Tue: "tuesday",
    Wed: "wednesday",
    Thu: "thursday",
    Fri: "friday",
    Sat: "saturday",
  };
  return map[w] ?? null;
}

function minutesInTimeZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  let h = 0;
  let m = 0;
  for (const p of parts) {
    if (p.type === "hour") h = Number(p.value) || 0;
    if (p.type === "minute") m = Number(p.value) || 0;
  }
  return h * 60 + m;
}

/**
 * Best-effort “open now” for discovery filter, using weekly hours in the listing timezone
 * (default `America/Los_Angeles` for NorCal catalog intent).
 *
 * - If `temporaryHoursActive` is true, returns **false** (unknown override without structured parse).
 * - Overnight windows (close < open) supported.
 */
export function isRestauranteOpenNowFromWeeklyHours(
  hours: RestauranteWeeklyHours | null | undefined,
  opts?: { timeZone?: string; now?: Date },
): boolean {
  if (!hours || typeof hours !== "object") return false;
  if (hours.temporaryHoursActive === true) return false;

  const timeZone = opts?.timeZone?.trim() || "America/Los_Angeles";
  const now = opts?.now ?? new Date();
  const key = weekdayKeyFromDateInTimeZone(now, timeZone);
  if (!key) return false;
  const sched = hours[key] as RestauranteDaySchedule | undefined;
  if (!sched || typeof sched !== "object") return false;
  if (sched.closed) return false;

  const openM = parseMinutes(sched.openTime);
  const closeM = parseMinutes(sched.closeTime);
  if (openM == null || closeM == null) return false;

  const cur = minutesInTimeZone(now, timeZone);

  if (closeM > openM) {
    return cur >= openM && cur < closeM;
  }
  // crosses midnight
  return cur >= openM || cur < closeM;
}
