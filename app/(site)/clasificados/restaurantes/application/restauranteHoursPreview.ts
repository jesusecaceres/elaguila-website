import type { ShellHoursStatus } from "../shell/restaurantDetailShellTypes";
import type { RestauranteDaySchedule, RestauranteWeeklyHours } from "./restauranteListingApplicationModel";

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function parseHm(s: string | undefined): number | null {
  if (!s || !/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function minutesNow(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function computeShellHoursPreview(
  hours: RestauranteWeeklyHours,
  now: Date = new Date()
): { status: ShellHoursStatus; statusLine: string; scheduleSummary: string } {
  if (hours.temporaryHoursActive && hours.temporaryHoursNote?.trim()) {
    return {
      status: "unknown",
      statusLine: hours.temporaryHoursNote.trim(),
      scheduleSummary: hours.specialHoursNote?.trim() || "Horario temporal",
    };
  }

  const key = DAY_KEYS[now.getDay()];
  const today = hours[key] as RestauranteDaySchedule | undefined;
  if (!today || today.closed) {
    return {
      status: "closed",
      statusLine: "Cerrado hoy",
      scheduleSummary: buildWeekSummary(hours),
    };
  }
  const openM = parseHm(today.openTime);
  const closeM = parseHm(today.closeTime);
  if (openM == null || closeM == null) {
    return {
      status: "unknown",
      statusLine: "Horario hoy por confirmar",
      scheduleSummary: buildWeekSummary(hours),
    };
  }
  const n = minutesNow(now);
  const open = openM;
  let close = closeM;
  if (close < open) close += 24 * 60;
  let nn = n;
  if (nn < open) nn += 24 * 60;
  const isOpen = nn >= open && nn < close;
  const closeLabel = today.closeTime ?? "";
  if (isOpen) {
    return {
      status: "open",
      statusLine: `Abierto ahora · hasta las ${fmt12(closeLabel)}`,
      scheduleSummary: buildWeekSummary(hours),
    };
  }
  if (n < openM) {
    return {
      status: "closed",
      statusLine: `Abre hoy · ${fmt12(today.openTime ?? "")}`,
      scheduleSummary: buildWeekSummary(hours),
    };
  }
  return {
    status: "closed",
    statusLine: "Cerrado por hoy",
    scheduleSummary: buildWeekSummary(hours),
  };
}

function fmt12(hm: string): string {
  const p = parseHm(hm);
  if (p == null) return hm;
  const h = Math.floor(p / 60) % 24;
  const m = p % 60;
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, "0");
  return `${h12}:${mm} ${am ? "a.m." : "p.m."}`;
}

function buildWeekSummary(h: RestauranteWeeklyHours): string {
  const parts: string[] = [];
  const dayLabel: Record<(typeof DAY_KEYS)[number], string> = {
    monday: "Lun",
    tuesday: "Mar",
    wednesday: "Mié",
    thursday: "Jue",
    friday: "Vie",
    saturday: "Sáb",
    sunday: "Dom",
  };
  for (const k of DAY_KEYS) {
    const s = h[k] as RestauranteDaySchedule;
    if (!s) continue;
    if (s.closed) parts.push(`${dayLabel[k]}: cerrado`);
    else if (s.openTime && s.closeTime) parts.push(`${dayLabel[k]} · ${s.openTime}–${s.closeTime}`);
  }
  if (h.specialHoursNote?.trim()) return `${parts.slice(0, 3).join(" · ")}… (${h.specialHoursNote.trim()})`;
  return parts.length ? parts.join(" · ") : "Horario no indicado";
}
